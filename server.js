import { createServer } from "http";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";
import { isIP } from "net";
import { Server } from "socket.io";
import {
  hashPassword,
  verifyPassword,
  migrateUserRecord,
  toPublicUser,
  MAX_BODY_BYTES,
} from "./server/security.js";
import {
  advanceSplendorTurn,
  timeoutDeadMansDraw,
} from "./server/splendorTurn.js";
import {
  syncUsersWithDatabase,
  saveUserToDatabase,
  loadSharedStateFromDatabase,
  saveSharedStateToDatabase,
} from "./server/database.js";
import { isValidInitialSplendorState, isValidSplendorTransition } from "./server/splendorValidation.js";
import { isValidDeadMansDrawState, isValidInitialDeadMansDrawState } from "./server/deadMansDrawValidation.js";
import { ensureDefaultGroups, generateUniqueGroupCode, repairDuplicateGroupCodes } from "./server/defaultGroups.js";
import {
  consumePhoneOtp,
  isIranianMobile,
  normalizePhone,
  requestPhoneOtp,
} from "./server/phoneAuth.js";

const disconnectTimers = new Map();
let databaseUsersSnapshot = null;
let sharedStateSnapshot = null;
let sharedStateWriteQueue = Promise.resolve();
let sharedStateRevision = 0;
let userMutationRevision = 0;
const RECONNECT_MS = 60_000;
const AUTH_SECRET = process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-only-change-this-auth-secret");
if (!AUTH_SECRET || (process.env.NODE_ENV === "production" && AUTH_SECRET.length < 32)) {
  throw new Error("AUTH_SECRET must be set to at least 32 characters in production.");
}
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_IP_WINDOW_MS = 10 * 60 * 1000;
const OTP_IP_MAX_REQUESTS = 10;
const otpIpWindows = new Map();

const DATA_DIR = path.resolve(process.env.SPLENDOR_DATA_DIR || "./server-data");
const STATE_FILE = path.join(DATA_DIR, "shared-state.json");

function ensureStateFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({
        users: [],
        groups: [],
        friends: {},
        friendRequests: [],
        messages: [],
        groupMessages: [],
        gameInvites: [],
      }, null, 2),
      "utf8",
    );
  }
}

function readSharedState() {
  if (sharedStateSnapshot) return structuredClone(sharedStateSnapshot);
  if (process.env.NODE_ENV === "production" && !fs.existsSync(STATE_FILE)) {
    return { users: [], groups: ensureDefaultGroups([]), friends: {}, friendRequests: [], messages: [], groupMessages: [], gameInvites: [] };
  }
  if (process.env.NODE_ENV !== "production") ensureStateFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    const users = Array.isArray(parsed.users) ? parsed.users.map(migrateUserRecord) : [];
    const groups = repairDuplicateGroupCodes(ensureDefaultGroups(Array.isArray(parsed.groups) ? parsed.groups : []));
    const migrated = { ...parsed, users, groups };
    const changed = JSON.stringify(parsed.users) !== JSON.stringify(users) ||
      JSON.stringify(parsed.groups) !== JSON.stringify(groups);
    if (changed && process.env.NODE_ENV !== "production") void writeSharedState(migrated);
    return migrated;
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    return {
      users: [],
      groups: [],
      friends: {},
      friendRequests: [],
      messages: [],
      groupMessages: [],
      gameInvites: [],
    };
  }
}

function signSessionPayload(payload) {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
}

function createSessionToken(user) {
  const payload = `${user.id}.${Date.now()}.${randomBytes(16).toString("base64url")}.${user.authVersion || "0"}`;
  return `${payload}.${signSessionPayload(payload)}`;
}

function tokenFromReq(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function userFromToken(token, state) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const payload = parts.slice(0, 4).join(".");
  const actual = Buffer.from(parts[4]);
  const expected = Buffer.from(signSessionPayload(payload));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  const issuedAt = Number(parts[1]);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > Date.now() || Date.now() - issuedAt > SESSION_TTL_MS) return null;
  const user = (state.users || []).find((entry) => entry.id === parts[0]);
  return user && (user.authVersion || "0") === parts[3] ? user : null;
}

function userFromRequest(req, state) {
  return userFromToken(tokenFromReq(req), state);
}


function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function unauthorized(res) {
  sendJson(res, 401, { error: "Unauthorized" });
}

function allowOtpRequestFromIp(req) {
  const peerIp = req.socket?.remoteAddress || "unknown";
  const trustedProxy = process.env.TRUST_PROXY === "1" &&
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(peerIp);
  const forwardedIp = trustedProxy
    ? String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
    : "";
  const ip = isIP(forwardedIp) ? forwardedIp : peerIp;
  const now = Date.now();
  if (otpIpWindows.size > 10_000) {
    for (const [key, timestamps] of otpIpWindows) {
      if (!timestamps.some((timestamp) => timestamp > now - OTP_IP_WINDOW_MS)) otpIpWindows.delete(key);
    }
  }
  const recent = (otpIpWindows.get(ip) || []).filter(
    (timestamp) => timestamp > now - OTP_IP_WINDOW_MS,
  );
  if (recent.length >= OTP_IP_MAX_REQUESTS) {
    otpIpWindows.set(ip, recent);
    return false;
  }
  recent.push(now);
  otpIpWindows.set(ip, recent);
  return true;
}

function buildPlayerIndexMap(playersArray) {
  const playerIndexMap = {};
  playersArray.forEach((player, idx) => {
    playerIndexMap[player.id] = idx;
    if (player.socketId) playerIndexMap[player.socketId] = idx;
  });
  return playerIndexMap;
}

function assertCanPublishState(socket, room, playerId) {
  const member = room.players.get(playerId);
  if (!member || member.socketId !== socket.id || member.accountId !== socket.data.userId) return false;
  if (room.gameId === "totem" || room.gameId === "beasty-bar") return true;
  const idx = room.gameId === "dead-mans-draw"
    ? room.gameState?.powerTargetSelection?.playerIndex ??
      room.gameState?.ringSelectionIndex ?? room.gameState?.currentPlayerIndex
    : room.gameState?.currentPlayerIndex;
  const seated = room.turn.playersInGame?.[idx];
  return Boolean(seated && seated.id === playerId);
}

function activeTurnIndex(room, state) {
  return room.gameId === "dead-mans-draw"
    ? state?.powerTargetSelection?.playerIndex ?? state?.ringSelectionIndex ?? state?.currentPlayerIndex
    : state?.currentPlayerIndex;
}

function clearDisconnectTimer(roomId, playerId) {
  const key = `${roomId}:${playerId}`;
  const timer = disconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }
}

async function writeSharedState(state) {
  if (process.env.NODE_ENV === "production") {
    const previousState = sharedStateSnapshot;
    sharedStateSnapshot = structuredClone(state);
    const pendingState = structuredClone(state);
    const revision = ++sharedStateRevision;
    sharedStateWriteQueue = sharedStateWriteQueue.catch(() => {}).then(async () => {
      try {
        await saveSharedStateToDatabase(pendingState);
      } catch (error) {
        if (sharedStateRevision === revision) sharedStateSnapshot = previousState;
        throw error;
      }
    });
    await sharedStateWriteQueue;
    return;
  }
  ensureStateFile();
  const temporaryFile = `${STATE_FILE}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(temporaryFile, STATE_FILE);
  } catch (error) {
    if (fs.existsSync(temporaryFile)) fs.unlinkSync(temporaryFile);
    throw error;
  }
}

function normalizeTurnTimeSeconds(value) {
  return value === 15 || value === 30 || value === 45 || value === 60 ? value : 45;
}

function normalizeGroup(entry) {
  const visibility =
    entry.visibility === "private" || entry.visibility === "closed"
      ? entry.visibility
      : "public";
  return {
    ...entry,
    code: entry.code || generateUniqueGroupCode([]),
    description: entry.description || "",
    flag: entry.flag || "ðŸ³ï¸",
    minScore: Number(entry.minScore) || 0,
    visibility,
    members: Array.isArray(entry.members) ? entry.members : [entry.creatorId],
    pendingRequests: Array.isArray(entry.pendingRequests) ? entry.pendingRequests : [],
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

function removeUserFromGroups(groups, userId) {
  return groups
    .map((group) => {
      if (!group.members.includes(userId) && !group.pendingRequests.includes(userId)) {
        return group;
      }
      const members = group.members.filter((id) => id !== userId);
      const pendingRequests = group.pendingRequests.filter((id) => id !== userId);
      return {
        ...group,
        creatorId: group.creatorId === userId ? members[0] || "" : group.creatorId,
        members,
        pendingRequests,
      };
    })
    .filter((group) => group.members.length > 0 || group.id.startsWith("default-group-"));
}

function normalizeSocialState(state) {
  return {
    ...state,
    friends: state.friends && typeof state.friends === "object" ? state.friends : {},
    friendRequests: Array.isArray(state.friendRequests) ? state.friendRequests : [],
    messages: Array.isArray(state.messages) ? state.messages : [],
    groupMessages: Array.isArray(state.groupMessages) ? state.groupMessages : [],
    gameInvites: Array.isArray(state.gameInvites) ? state.gameInvites : [],
  };
}

function trimConversationMessages(messages, participants) {
  const key = [...participants].sort().join(":");
  const rest = messages.filter((message) => message.participants.join(":") !== key);
  const latest = messages
    .filter((message) => message.participants.join(":") === key)
    .slice(-100);
  return [...rest, ...latest];
}

function trimGroupMessages(messages, groupId) {
  const rest = messages.filter((message) => message.groupId !== groupId);
  const latest = messages
    .filter((message) => message.groupId === groupId)
    .slice(-100);
  return [...rest, ...latest];
}

function withCors(req, res) {
  const origin = req.headers.origin;
  const allowed = String(process.env.CLIENT_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (origin && (process.env.NODE_ENV !== "production" || allowed.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
  if (process.env.NODE_ENV !== "production") res.setHeader("Access-Control-Allow-Private-Network", "true");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const httpServer = createServer(async (req, res) => {
  withCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Content-Type": "application/json" });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true, service: "splendor-server" });
    return;
  }

  const url = new URL(req.url || "/", "http://localhost:3001");
  const state = normalizeSocialState(readSharedState());
  if (Array.isArray(databaseUsersSnapshot)) {
    state.users = databaseUsersSnapshot;
  }
  state.groups = Array.isArray(state.groups) ? state.groups.map(normalizeGroup) : [];
  const mutatingSocial =
    req.method === "POST" &&
    (url.pathname.startsWith("/groups") || url.pathname.startsWith("/social"));
  const actor = mutatingSocial ? userFromRequest(req, state) : null;
  if (mutatingSocial && !actor) {
    unauthorized(res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/auth/otp/request") {
    if (!allowOtpRequestFromIp(req)) {
      sendJson(res, 429, { error: "Too many verification-code requests" });
      return;
    }
    const payload = (await parseBody(req).catch(() => null)) || {};
    const result = await requestPhoneOtp(payload?.phone);
    if (!result.ok) {
      sendJson(res, result.status || 503, { error: result.error });
      return;
    }
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/auth/register") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    const username = String(payload?.username || "").trim();
    const phone = normalizePhone(payload?.phone);
    const code = String(payload?.code || "").trim();
    if (!username || username.length > 15 || !isIranianMobile(phone) || !/^\d{6}$/.test(code)) {
      sendJson(res, 400, { error: "Invalid registration payload" });
      return;
    }
    if (state.users.some((user) => user.username.toLocaleLowerCase("en-US") === username.toLocaleLowerCase("en-US"))) {
      sendJson(res, 409, { error: "Username already exists" });
      return;
    }
    if (state.users.some((user) => normalizePhone(user.phone) === phone)) {
      sendJson(res, 409, { error: "Phone already exists" });
      return;
    }
    if (!consumePhoneOtp(phone, code)) {
      sendJson(res, 401, { error: "Invalid or expired verification code" });
      return;
    }
    const { salt, hash } = hashPassword(randomBytes(32).toString("hex"));
    const user = {
      id: randomUUID(),
      username,
      email: "",
      phone,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash: hash,
    };
    state.users.push(user);
    userMutationRevision += 1;
    databaseUsersSnapshot = state.users;
    await saveUserToDatabase(user);
    await writeSharedState(state);
    const token = createSessionToken(user);
    sendJson(res, 200, { ok: true, token, user: toPublicUser(user) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/auth/login") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    const phone = normalizePhone(payload?.phone);
    const code = String(payload?.code || "").trim();
    if (!isIranianMobile(phone) || !/^\d{6}$/.test(code)) {
      sendJson(res, 400, { error: "Invalid login payload" });
      return;
    }
    const user = state.users.find((entry) => normalizePhone(entry.phone) === phone);
    if (!user) {
      sendJson(res, 404, { error: "ACCOUNT_NOT_FOUND" });
      return;
    }
    if (!consumePhoneOtp(phone, code)) {
      sendJson(res, 401, { error: "Invalid phone number or verification code" });
      return;
    }
    const token = createSessionToken(user);
    sendJson(res, 200, { ok: true, token, user: toPublicUser(user) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/auth/me") {
    const user = userFromRequest(req, state);
    if (!user) {
      unauthorized(res);
      return;
    }
    sendJson(res, 200, { user: toPublicUser(user) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/auth/logout") {
    const user = userFromRequest(req, state);
    if (user) {
      user.authVersion = randomBytes(16).toString("hex");
      user.updatedAt = new Date().toISOString();
      userMutationRevision += 1;
      databaseUsersSnapshot = state.users;
      await saveUserToDatabase(user);
      await writeSharedState(state);
      for (const connected of io.sockets.sockets.values()) {
        if (connected.data.userId === user.id) connected.disconnect(true);
      }
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/users") {
    sendJson(res, 200, { users: (state.users || []).map(toPublicUser) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/users") {
    const actor = userFromRequest(req, state);
    if (!actor) {
      unauthorized(res);
      return;
    }
    const payload = (await parseBody(req).catch(() => null)) || {};
    const username = String(payload?.username || actor.username).trim();
    if (!username || username.length > 15) {
      sendJson(res, 400, { error: "Invalid user payload" });
      return;
    }
    if (state.users.some((user) => user.id !== actor.id && user.username.toLocaleLowerCase("en-US") === username.toLocaleLowerCase("en-US"))) {
      sendJson(res, 409, { error: "Username already exists" });
      return;
    }
    const existingIndex = state.users.findIndex((user) => user.id === actor.id);
    if (existingIndex >= 0) {
      state.users[existingIndex] = {
        ...state.users[existingIndex],
        username,
        email: payload?.email ?? state.users[existingIndex].email,
        selectedAvatar: payload?.selectedAvatar ?? state.users[existingIndex].selectedAvatar,
      };
      delete state.users[existingIndex].password;
    }
    userMutationRevision += 1;
    databaseUsersSnapshot = state.users;
    state.users[existingIndex].updatedAt = new Date().toISOString();
    await saveUserToDatabase(state.users[existingIndex]);
    await writeSharedState(state);
    sendJson(res, 200, {
      ok: true,
      users: state.users.map(toPublicUser),
      user: toPublicUser(state.users[existingIndex]),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/groups") {
    const reader = userFromRequest(req, state);
    if (!reader) {
      unauthorized(res);
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ groups: state.groups.map((group) => ({
      ...group,
      pendingRequests: group.creatorId === reader.id
        ? group.pendingRequests
        : group.pendingRequests.filter((id) => id === reader.id),
    })) }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/social") {
    const reader = userFromRequest(req, state);
    if (!reader) {
      unauthorized(res);
      return;
    }
    const memberGroupIds = new Set(state.groups
      .filter((group) => group.members.includes(reader.id))
      .map((group) => group.id));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      users: (state.users || []).map(toPublicUser),
      groups: state.groups.map((group) => ({
        ...group,
        pendingRequests: group.creatorId === reader.id
          ? group.pendingRequests
          : group.pendingRequests.filter((id) => id === reader.id),
      })),
      friends: { [reader.id]: state.friends[reader.id] || [] },
      friendRequests: state.friendRequests.filter((request) =>
        request.fromUserId === reader.id || request.toUserId === reader.id),
      messages: state.messages.filter((message) => message.participants.includes(reader.id)),
      groupMessages: state.groupMessages.filter((message) => memberGroupIds.has(message.groupId)),
      gameInvites: state.gameInvites.filter((invite) =>
        invite.fromUserId === reader.id || invite.toUserId === reader.id),
    }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    if (!payload?.name) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid group payload" }));
      return;
    }

    state.groups = removeUserFromGroups(state.groups, actor.id);
    const groupId = `group-${Date.now()}`;
    const nextGroup = normalizeGroup({
      ...payload,
      creatorId: actor.id,
      id: groupId,
      code: generateUniqueGroupCode(state.groups),
      members: [actor.id],
      pendingRequests: [],
      createdAt: new Date().toISOString(),
    });
    state.groups.unshift(nextGroup);
    await writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, group: nextGroup, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/request") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.userId = actor.id;
    const group = state.groups.find((entry) => entry.id === payload?.groupId);
    if (!group || !payload?.userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid request payload" }));
      return;
    }

    const freshGroup = state.groups.find((entry) => entry.id === payload.groupId);
    if (!freshGroup) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Group not found" }));
      return;
    }

    if (freshGroup.members.includes(payload.userId) || freshGroup.pendingRequests.includes(payload.userId)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, status: "already-member", group: freshGroup, groups: state.groups }));
      return;
    }

    if (freshGroup.visibility === "closed") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, status: "group-closed", group: freshGroup, groups: state.groups }));
      return;
    }

    if (freshGroup.visibility === "public") {
      state.groups = removeUserFromGroups(state.groups, payload.userId);
      const joinableGroup = state.groups.find((entry) => entry.id === payload.groupId);
      if (!joinableGroup) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Group not found" }));
        return;
      }

      if (!joinableGroup.members.includes(payload.userId)) {
        joinableGroup.members.push(payload.userId);
        if (!joinableGroup.creatorId) joinableGroup.creatorId = payload.userId;
      }
      await writeSharedState(state);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, status: "joined", group: joinableGroup, groups: state.groups }));
      return;
    }

    if (!freshGroup.members.includes(payload.userId) && !freshGroup.pendingRequests.includes(payload.userId)) {
      freshGroup.pendingRequests.push(payload.userId);
      await writeSharedState(state);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: "requested", group: freshGroup, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/update") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.actorId = actor.id;
    const group = state.groups.find((entry) => entry.id === payload?.groupId);
    if (!group || !payload?.actorId || !payload?.updates) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid update payload" }));
      return;
    }

    if (group.creatorId !== payload.actorId) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not allowed" }));
      return;
    }

    if (typeof payload.updates.name === "string" && payload.updates.name.trim()) {
      group.name = payload.updates.name.trim();
    }
    if (typeof payload.updates.description === "string") {
      group.description = payload.updates.description.trim();
    }
    if (typeof payload.updates.flag === "string" && payload.updates.flag) {
      group.flag = payload.updates.flag;
    }
    if (payload.updates.minScore !== undefined) {
      group.minScore = Number(payload.updates.minScore) || 0;
    }
    if (["public", "private", "closed"].includes(payload.updates.visibility)) {
      group.visibility = payload.updates.visibility;
    }

    await writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, group, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/leave") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.userId = actor.id;
    if (!payload?.userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid leave payload" }));
      return;
    }

    const currentGroup = state.groups.find((entry) => entry.members.includes(payload.userId));
    state.groups = removeUserFromGroups(state.groups, payload.userId);
    await writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, groupId: currentGroup?.id || null, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/respond") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    const group = state.groups.find((entry) => entry.id === payload?.groupId);
    if (!group || group.creatorId !== actor.id) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not allowed" }));
      return;
    }
    if (!group || !payload?.userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid respond payload" }));
      return;
    }

    group.pendingRequests = group.pendingRequests.filter((id) => id !== payload.userId);
    if (payload.accept) {
      state.groups = removeUserFromGroups(state.groups, payload.userId);
      const freshGroup = state.groups.find((entry) => entry.id === payload.groupId);
      if (freshGroup && !freshGroup.members.includes(payload.userId)) {
        freshGroup.members.push(payload.userId);
      }
    }
    await writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, group, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/remove-member") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.actorId = actor.id;
    const group = state.groups.find((entry) => entry.id === payload?.groupId);
    if (!group || !payload?.memberId || !payload?.actorId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid remove member payload" }));
      return;
    }

    if (group.creatorId !== payload.actorId || payload.memberId === group.creatorId) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not allowed" }));
      return;
    }

    state.groups = removeUserFromGroups(state.groups, payload.memberId);
    await writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/friend-request") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.fromUserId = actor.id;
    if (!payload?.fromUserId || !payload?.toUserId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid friend request payload" }));
      return;
    }

    const exists = state.friendRequests.some(
      (request) =>
        request.status === "pending" &&
        ((request.fromUserId === payload.fromUserId && request.toUserId === payload.toUserId) ||
          (request.fromUserId === payload.toUserId && request.toUserId === payload.fromUserId)),
    );

    if (!exists) {
      state.friendRequests.unshift({
        id: `${Date.now()}-${payload.fromUserId}-${payload.toUserId}`,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      await writeSharedState(state);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/friend-respond") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    const request = state.friendRequests.find((entry) => entry.id === payload?.requestId);
    if (!request || request.toUserId !== actor.id) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Friend request not found" }));
      return;
    }

    request.status = payload.accept ? "accepted" : "declined";
    if (payload.accept) {
      state.friends[request.fromUserId] = Array.from(new Set([...(state.friends[request.fromUserId] || []), request.toUserId]));
      state.friends[request.toUserId] = Array.from(new Set([...(state.friends[request.toUserId] || []), request.fromUserId]));
    }
    await writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/messages") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.fromUserId = actor.id;
    if (!payload?.fromUserId || !payload?.toUserId || !payload?.text) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid message payload" }));
      return;
    }

    state.messages.push({
      id: `${Date.now()}-${payload.fromUserId}`,
      participants: [payload.fromUserId, payload.toUserId].sort(),
      senderId: payload.fromUserId,
      text: payload.text,
      createdAt: new Date().toISOString(),
    });
    state.messages = trimConversationMessages(state.messages, [payload.fromUserId, payload.toUserId]);
    await writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/group-messages") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.senderId = actor.id;
    if (!payload?.groupId || !payload?.senderId || !payload?.text) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid group message payload" }));
      return;
    }

    state.groupMessages.push({
      id: `${Date.now()}-${payload.senderId}-${payload.groupId}`,
      groupId: payload.groupId,
      senderId: payload.senderId,
      text: payload.text,
      createdAt: new Date().toISOString(),
    });
    state.groupMessages = trimGroupMessages(state.groupMessages, payload.groupId);
    await writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/game-invites") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    payload.fromUserId = actor.id;
    if (!payload?.fromUserId || !payload?.toUserId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid game invite payload" }));
      return;
    }

    const gameId = payload.gameId === "dead-mans-draw" ? "dead-mans-draw" : "splendor";
    const turnTime = normalizeTurnTimeSeconds(payload.turnTime);
    const requestedRoomId = typeof payload.roomId === "string" ? payload.roomId.trim() : "";
    const roomId = /^FR-[A-Z0-9]{6,32}$/.test(requestedRoomId)
      ? requestedRoomId
      : `FR-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const exists = state.gameInvites.some(
      (invite) =>
        invite.status === "pending" &&
        ((invite.fromUserId === payload.fromUserId && invite.toUserId === payload.toUserId) ||
          (invite.fromUserId === payload.toUserId && invite.toUserId === payload.fromUserId)),
    );

    if (!exists) {
      state.gameInvites.unshift({
        id: `invite-${Date.now()}-${payload.fromUserId}-${payload.toUserId}`,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        createdAt: new Date().toISOString(),
        status: "pending",
        gameId,
        playerCount: 2,
        humanPlayers: 2,
        turnTime,
        roomId,
      });
      await writeSharedState(state);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/game-invites/respond") {
    const payload = (await parseBody(req).catch(() => null)) || {};
    const invite = state.gameInvites.find((entry) => entry.id === payload?.inviteId);
    if (!invite || invite.toUserId !== actor.id) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Game invite not found" }));
      return;
    }

    invite.status = payload.accept ? "accepted" : "declined";
    await writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Socket.IO Server Running", port: 3001 }));
});

const io = new Server(httpServer, {
  maxHttpBufferSize: 256 * 1024,
  connectionStateRecovery: {
    maxDisconnectionDuration: RECONNECT_MS,
    skipMiddlewares: false,
  },
  cors: {
    origin: function (origin, callback) {
      // âœ… Ø§Ø¬Ø§Ø²Ù‡ Ø¯Ø³ØªØ±Ø³ÛŒ Ø¨Ù‡ localhostØŒ 127.0.0.1ØŒ Ùˆ IPâ€ŒÙ‡Ø§ÛŒ Ù…Ø­Ù„ÛŒ
      // âœ… Allow localhost, 127.0.0.1, and local network IPs
      // âœ… Ø±ÛŒÙ‚ ngrok Ùˆ CloudFlare Tunnel Ø±Ø§ Ù‡Ù… Ø§Ø¶Ø§ÙÙ‡ Ú©Ù†ÛŒÙ…
      const allowedPatterns = [
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
        /^http:\/\/192\.168\./,
        /^http:\/\/10\./,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^https:\/\/.*\.ngrok\.io$/, // ngrok
        /^https:\/\/.*\.ngrok-free\.app$/, // ngrok v3+
        /^https:\/\/.*\.trycloudflare\.com$/, // CloudFlare Tunnel
      ];

      const configuredOrigins = String(process.env.CLIENT_ORIGINS || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      const configuredOriginAllowed = configuredOrigins.includes(origin);

      if (!origin || configuredOriginAllowed ||
        (process.env.NODE_ENV !== "production" &&
          (configuredOrigins.length === 0 || allowedPatterns.some((pattern) => pattern.test(origin))))) {
        callback(null, true);
      } else {
        callback(new Error("Ø¨Ø±Ø§ÛŒ Ø¯Ø³ØªØ±Ø³ÛŒ Ø§Ø¬Ø§Ø²Ù‡ Ù†ÛŒØ³Øª | Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const state = normalizeSocialState(readSharedState());
  if (Array.isArray(databaseUsersSnapshot)) state.users = databaseUsersSnapshot;
  const user = userFromToken(socket.handshake.auth?.token, state);
  if (!user) return next(new Error("Unauthorized"));
  socket.data.userId = user.id;
  socket.data.username = user.username;
  next();
});

// In-memory room storage
const rooms = new Map();

// In-memory matchmaking queue (waiting players)
const matchmakingQueue = {
  2: [], // Queue for 2-player games
  3: [], // Queue for 3-player games
  4: [], // Queue for 4-player games
};

function broadcastQueueStatus(playerCount) {
  const queue = matchmakingQueue[playerCount] || [];
  queue.forEach((player) => {
    const sameGameCount = queue.filter((entry) => entry.gameId === player.gameId).length;
    io.to(player.socketId).emit("players-waiting", {
      playerCount,
      currentPlayers: sameGameCount,
    });
  });
}

// Helper function to get or create room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      gameState: null,
      gameId: null,
      status: "waiting",
      maxPlayers: 4,
      hostAccountId: null,
      createdAt: Date.now(),
      turn: {
        timer: null,
        endsAt: null,
        currentIndex: 0,
        durationMs: 45000,
        playersInGame: [], // ordered list used for index mapping
      },
      rematch: null,
    });
  }
  return rooms.get(roomId);
}

function buildRoomPlayerIndexMap(room) {
  const map = {};
  if (!room?.turn?.playersInGame?.length) return map;
  room.turn.playersInGame.forEach((player, idx) => {
    if (player?.socketId) {
      map[player.socketId] = idx;
    }
  });
  return map;
}

function resetMissedCounts(room) {
  if (!room?.turn) return;
}

function removePlayerFromGame(roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room || !room.gameState || !room.turn?.playersInGame?.length) return null;

  const playersInGame = [...room.turn.playersInGame];
  const removedPlayerMeta = playersInGame[playerIndex];

  if (removedPlayerMeta?.id) {
    room.players.delete(removedPlayerMeta.id);
  }

  const removedPlayerState = room.gameState.players[playerIndex];
  const remainingPlayers = room.gameState.players
    .filter((_, idx) => idx !== playerIndex)
    .map((p, idx) => ({ ...p, id: idx }));

  const newTokenPool = { ...room.gameState.tokenPool };
  if (removedPlayerState?.tokens) {
    for (const key of Object.keys(newTokenPool)) {
      newTokenPool[key] += removedPlayerState.tokens[key] || 0;
    }
  }

  room.turn.playersInGame = playersInGame.filter((_, idx) => idx !== playerIndex);
  resetMissedCounts(room);

  const currentPlayerIndex = room.gameState.currentPlayerIndex || 0;
  const nextCurrentPlayerIndex =
    currentPlayerIndex > playerIndex
      ? currentPlayerIndex - 1
      : currentPlayerIndex === playerIndex
        ? Math.min(playerIndex, Math.max(remainingPlayers.length - 1, 0))
        : currentPlayerIndex;

  room.gameState = {
    ...room.gameState,
    players: remainingPlayers,
    tokenPool: newTokenPool,
    currentPlayerIndex: nextCurrentPlayerIndex,
  };

  const remainingCount = room.gameState.players.length;
  if (remainingCount <= 1) {
    room.gameState = {
      ...room.gameState,
      gameOver: true,
      winner: 0,
    };
    room.status = "finished";
    clearTurnTimer(room);
  } else {
    room.status = "playing";
  }

  return {
    removedPlayerMeta,
    gameState: room.gameState,
    playerIndexMap: buildRoomPlayerIndexMap(room),
    roomStatus: room.status,
  };
}

function removeDeadMansDrawPlayerFromGame(roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room || !room.gameState || !room.turn?.playersInGame?.length) return null;

  const playersInGame = [...room.turn.playersInGame];
  const removedPlayerMeta = playersInGame[playerIndex];
  if (removedPlayerMeta?.id) {
    room.players.delete(removedPlayerMeta.id);
  }

  const remainingPlayers = room.gameState.players
    .filter((_, idx) => idx !== playerIndex)
    .map((player, idx) => ({ ...player, id: idx }));

  const currentPlayerIndex = room.gameState.currentPlayerIndex || 0;
  const ringSelectionIndex = room.gameState.ringSelectionIndex;
  const targetSelection = room.gameState.powerTargetSelection;

  room.turn.playersInGame = playersInGame.filter((_, idx) => idx !== playerIndex);
  resetMissedCounts(room);

  const nextCurrentPlayerIndex =
    currentPlayerIndex > playerIndex
      ? currentPlayerIndex - 1
      : currentPlayerIndex === playerIndex
        ? Math.min(playerIndex, Math.max(remainingPlayers.length - 1, 0))
        : currentPlayerIndex;

  room.gameState = {
    ...room.gameState,
    players: remainingPlayers,
    currentPlayerIndex: nextCurrentPlayerIndex,
    pendingEffect:
      room.gameState.pendingEffect?.kind === "pistol" || room.gameState.pendingEffect?.kind === "dagger"
        ? {
            ...room.gameState.pendingEffect,
            options: room.gameState.pendingEffect.options
              .filter((option) => option.playerIndex !== playerIndex)
              .map((option) => ({
                ...option,
                playerIndex: option.playerIndex > playerIndex ? option.playerIndex - 1 : option.playerIndex,
              })),
          }
        : room.gameState.pendingEffect,
    ringSelectionIndex:
      ringSelectionIndex === null
        ? null
        : ringSelectionIndex > playerIndex
          ? ringSelectionIndex - 1
          : ringSelectionIndex === playerIndex
            ? null
            : ringSelectionIndex,
    powerTargetSelection:
      targetSelection && targetSelection.playerIndex === playerIndex
        ? null
        : targetSelection
          ? {
              ...targetSelection,
              playerIndex:
                targetSelection.playerIndex > playerIndex
                  ? targetSelection.playerIndex - 1
                  : targetSelection.playerIndex,
              options: targetSelection.options
                .filter((idx) => idx !== playerIndex)
                .map((idx) => (idx > playerIndex ? idx - 1 : idx)),
            }
          : null,
    winnerIndices: room.gameState.winnerIndices
      .filter((idx) => idx !== playerIndex)
      .map((idx) => (idx > playerIndex ? idx - 1 : idx)),
  };

  const remainingCount = room.gameState.players.length;
  if (remainingCount <= 1) {
    room.gameState = {
      ...room.gameState,
      gameOver: true,
      winnerIndices: remainingCount === 1 ? [0] : [],
    };
    room.status = "finished";
    clearTurnTimer(room);
  } else {
    room.status = "playing";
  }

  return {
    removedPlayerMeta,
    gameState: room.gameState,
    playerIndexMap: buildRoomPlayerIndexMap(room),
    roomStatus: room.status,
  };
}

function clearTurnTimer(room) {
  if (room?.turn?.timer) {
    clearTimeout(room.turn.timer);
    room.turn.timer = null;
  }
  if (room?.turn) {
    room.turn.endsAt = null;
  }
}

function normalizeTimedOutPlayer(room) {
  if (!room?.gameState) return;
  const playerIndex = room.gameState.currentPlayerIndex || 0;
  const player = room.gameState.players?.[playerIndex];
  if (!player?.tokens) return;

  const tokenOrder = ["diamond", "sapphire", "emerald", "ruby", "onyx", "gold"];
  const totalTokens = () =>
    tokenOrder.reduce((sum, token) => sum + (player.tokens[token] || 0), 0);

  while (totalTokens() > 10) {
    const tokenToReturn = tokenOrder
      .filter((token) => (player.tokens[token] || 0) > 0)
      .sort((a, b) => {
        if (a === "gold" && b !== "gold") return 1;
        if (b === "gold" && a !== "gold") return -1;
        return (player.tokens[b] || 0) - (player.tokens[a] || 0);
      })[0];

    if (!tokenToReturn) break;
    player.tokens[tokenToReturn] -= 1;
    room.gameState.tokenPool[tokenToReturn] += 1;
  }
}

function startTurnTimer(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== "playing" || !room.gameState) return;

  if (room.gameState.gameOver) {
    room.status = "finished";
    clearTurnTimer(room);
    return;
  }

  clearTurnTimer(room);
  const durationMs = normalizeTurnTimeSeconds(Math.round((room.turn?.durationMs || 45000) / 1000)) * 1000;
  room.turn.durationMs = durationMs;

  room.turn.currentIndex = room.gameId === "dead-mans-draw"
    ? room.gameState.powerTargetSelection?.playerIndex ??
      room.gameState.ringSelectionIndex ?? room.gameState.currentPlayerIndex ?? 0
    : room.gameState.currentPlayerIndex || 0;
  room.turn.endsAt = Date.now() + durationMs;
  io.to(roomId).emit("turn-timer-updated", {
    endsAt: room.turn.endsAt,
    serverNow: Date.now(),
    currentPlayerIndex: room.turn.currentIndex,
    durationMs,
  });

  room.turn.timer = setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r || r.status !== "playing" || !r.gameState) return;

    const idx = r.turn.currentIndex;
    console.log(`â±ï¸  [TURN] Timeout in room ${roomId} | playerIndex=${idx}`);

    normalizeTimedOutPlayer(r);

    if (r.gameId === "dead-mans-draw") {
      r.gameState = timeoutDeadMansDraw(r.gameState);
    } else if (r.gameId === "totem" || r.gameId === "beasty-bar") {
      io.to(roomId).emit("game-state-updated", r.gameState);
      startTurnTimer(roomId);
      return;
    } else {
      r.gameState = advanceSplendorTurn(r.gameState, r.targetScore || 15);
    }
    io.to(roomId).emit("game-state-updated", r.gameState);
    startTurnTimer(roomId);
  }, durationMs);
}

function handlePlayerDeparture(roomId, playerId, socketId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const waitingPlayer = room.players.get(playerId)
    || Array.from(room.players.values()).find((player) => player.socketId === socketId);
  const resolvedPlayerId = waitingPlayer?.id || playerId;

  if (room.status === "playing" && room.gameState) {
    const playerIndex = room.turn.playersInGame.findIndex(
      (player) => player.id === resolvedPlayerId || player.socketId === socketId,
    );

    if (playerIndex !== -1) {
      const removalResult = room.gameId === "dead-mans-draw"
        ? removeDeadMansDrawPlayerFromGame(roomId, playerIndex)
        : removePlayerFromGame(roomId, playerIndex);

      if (removalResult) {
        io.to(roomId).emit("players-updated", {
          players: getRoomPlayersArray(roomId),
          roomStatus: room.status,
        });
        io.to(roomId).emit("player-removed", removalResult);
        io.to(roomId).emit("game-state-updated", removalResult.gameState);
        if (room.status === "playing") {
          startTurnTimer(roomId);
        }
        return;
      }
    }
  }

  if (resolvedPlayerId) {
    room.players.delete(resolvedPlayerId);
  }

  if (room.players.size === 0) {
    clearTurnTimer(room);
    rooms.delete(roomId);
    return;
  }

  io.to(roomId).emit("players-updated", {
    players: getRoomPlayersArray(roomId),
    roomStatus: room.status,
  });
}

// Helper function to generate random room ID
function generateRoomId() {
  let roomId;
  do {
    roomId = `MM-${randomBytes(12).toString("hex").toUpperCase()}`;
  } while (rooms.has(roomId));
  return roomId;
}

// Helper function to match players from queue
function tryMatchPlayers(playerCount) {
  const queue = matchmakingQueue[playerCount];

  console.log(
    `\n[MATCH-CHECK] Checking if we can match ${playerCount}-player game...`,
  );
  console.log(`   Queue length: ${queue.length}`);
  console.log(`   Required: ${playerCount}`);
  console.log(
    `   Can match: ${queue.length >= playerCount ? "YES âœ…" : "NO âŒ"}`,
  );

  const groupedByGame = new Map();
  queue.forEach((player) => {
    const key = player.gameId || "splendor";
    if (!groupedByGame.has(key)) {
      groupedByGame.set(key, []);
    }
    groupedByGame.get(key).push(player);
  });

  const eligibleGroup = Array.from(groupedByGame.values()).find((group) =>
    new Set(group.map((player) => player.accountId)).size >= playerCount);

  if (eligibleGroup) {
    // Match found! Take playerCount players from the same game
    const matchedPlayers = [];
    const matchedAccounts = new Set();
    for (const player of eligibleGroup) {
      if (matchedAccounts.has(player.accountId)) continue;
      matchedPlayers.push(player);
      matchedAccounts.add(player.accountId);
      if (matchedPlayers.length === playerCount) break;
    }
    const matchedIds = new Set(matchedPlayers.map((player) => player.playerId));
    matchmakingQueue[playerCount] = queue.filter((player) => !matchedIds.has(player.playerId));

    // Create new room for this match
    const roomId = generateRoomId();
    const room = getOrCreateRoom(roomId);
    room.maxPlayers = playerCount;
    room.gameId = matchedPlayers[0]?.gameId || null;
    room.hostAccountId = matchedPlayers[0]?.accountId || null;
    room.turn.durationMs = normalizeTurnTimeSeconds(matchedPlayers[0]?.turnTime) * 1000;

    console.log(`\n${"#".repeat(60)}`);
    console.log(`ðŸŽ® MATCH CREATED: ${roomId}`);
    console.log(`${"#".repeat(60)}`);

    // Add players to room
    const playerList = [];
    matchedPlayers.forEach((player, idx) => {
      room.players.set(player.playerId, {
        id: player.playerId,
        name: player.playerName,
        socketId: player.socketId,
        accountId: player.accountId,
        connected: true,
        joinedAt: Date.now(),
      });
      playerList.push(player);
      console.log(`   [${idx + 1}] ${player.playerName} (${player.socketId})`);
    });

    console.log(`\nâ„¹ï¸  Notifying ${playerCount} players about match...`);

    // Notify all matched players that game is ready
    matchedPlayers.forEach((player, idx) => {
      console.log(`   ðŸ“¤ Sending 'match-found' to ${player.playerName}...`);
      io.to(player.socketId).emit("match-found", {
        roomId,
        players: Array.from(room.players.values()),
        turnTime: room.turn.durationMs / 1000,
      });
      console.log(`   âœ… Sent to ${player.playerName}`);
    });

    console.log(`\n${"#".repeat(60)}\n`);

    return {
      roomId,
      players: Array.from(room.players.values()),
    };
  }

  console.log(`   âž¡ï¸  No match possible. Queue too small.\\n`);
  return null;
}

// Helper function to get room players as array
function getRoomPlayersArray(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.players.values());
}

function startRematch(roomId, room) {
  if (!room.rematch || room.status !== "finished") return;
  room.status = "playing";
  room.gameState = room.rematch.initialGameState;
  const playersArray = Array.from(room.players.values()).sort((a, b) =>
    a.socketId.localeCompare(b.socketId),
  );
  room.turn.playersInGame = playersArray;
  room.rematch = null;
  io.to(roomId).emit("rematch-result", { accepted: true });
  io.to(roomId).emit("game-started", {
    gameState: room.gameState,
    playersInGame: playersArray,
    playerIndexMap: buildPlayerIndexMap(playersArray),
  });
  startTurnTimer(roomId);
}

function isValidInitialRoomState(room, state) {
  if (!state || !Array.isArray(state.players) || state.players.length !== room.players.size) return false;
  if (room.gameId === "splendor") return isValidInitialSplendorState(state, room.players.size);
  if (room.gameId === "dead-mans-draw") return isValidInitialDeadMansDrawState(state, room.players.size);
  return false;
}

io.on("connection", (socket) => {
  console.log(
    `âœ… [CONNECTION] Player connected | Ø¨Ø§Ø²ÛŒÚ©Ù† Ù…ØªØµÙ„ Ø´Ø¯: ${socket.id}`,
  );
  console.log(`ðŸ“± Client address: ${socket.handshake.address}`);
  console.log(`ðŸŒ Headers:`, {
    agent: socket.handshake.headers["user-agent"]?.substring(0, 50),
    origin: socket.handshake.headers["origin"],
  });

  // Matchmaking: Find a match for this player
  socket.on("find-match", (data) => {
    if (!data || typeof data !== "object") return;
    const { playerCount, playerId, turnTime, gameId } = data;
    if (![2, 3, 4].includes(playerCount) || !["splendor", "dead-mans-draw"].includes(gameId) ||
      typeof playerId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(playerId)) return;
    if (Array.from(rooms.values()).some((room) => room.status === "playing" &&
      Array.from(room.players.values()).some((player) => player.accountId === socket.data.userId))) {
      socket.emit("match-error", { message: "Finish your current game before finding another match." });
      return;
    }
    const playerName = socket.data.username;
    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `ðŸ” [MATCHMAKING] ${playerName} searching for ${playerCount}-player game`,
    );
    console.log(`   Player ID: ${playerId}`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`${"=".repeat(60)}\n`);

    // Ensure queue exists for this playerCount
    if (!matchmakingQueue[playerCount]) {
      matchmakingQueue[playerCount] = [];
    }

    // Add to matchmaking queue
    for (const count of [2, 3, 4]) {
      matchmakingQueue[count] = matchmakingQueue[count].filter(
        (player) => player.accountId !== socket.data.userId && player.socketId !== socket.id,
      );
      broadcastQueueStatus(count);
    }
    matchmakingQueue[playerCount].push({
      socketId: socket.id,
      playerId,
      playerName,
      accountId: socket.data.userId,
      gameId,
      turnTime: normalizeTurnTimeSeconds(turnTime),
      timestamp: Date.now(),
    });

    console.log(`ðŸ“Š [QUEUE] Current ${playerCount}-player queue:`);
    console.log(
      `   Total players waiting: ${matchmakingQueue[playerCount].length}/${playerCount}`,
    );
    matchmakingQueue[playerCount].forEach((p, i) => {
      console.log(
        `   [${i + 1}] ${p.playerName} (${p.playerId.substring(0, 8)}...)`,
      );
    });

    // Check if we can match
    if (matchmakingQueue[playerCount].length >= playerCount) {
      console.log(`\n${"*".repeat(60)}`);
      console.log(
        `ðŸŽ‰ MATCH FOUND! Attempting to match ${playerCount} players...`,
      );
      console.log(`${"*".repeat(60)}\n`);
    }

    // Try to match players
    const matchResult = tryMatchPlayers(playerCount);
    if (matchResult) {
      console.log(`âœ… [MATCH SUCCESS] Room created: ${matchResult.roomId}`);
      broadcastQueueStatus(playerCount);
      // Match found, players will be notified via 'match-found' event
    } else {
      console.log(`â³ [WAITING] Not enough players yet. Broadcasting queue count...`);
      broadcastQueueStatus(playerCount);
    }
  });

  // Cancel matchmaking
  socket.on("cancel-match", (data) => {
    if (!data || typeof data !== "object") return;
    const { playerCount, playerId } = data;
    if (![2, 3, 4].includes(playerCount)) return;
    console.log(
      `âŒ [MATCHMAKING] Player ${playerId} cancelled search for ${playerCount}-player game`,
    );

    // Remove from queue
    const queue = matchmakingQueue[playerCount];
    const index = queue.findIndex((p) => p.playerId === playerId && p.socketId === socket.id);
    if (index !== -1) {
      queue.splice(index, 1);
      console.log(
        `ðŸ“Š [MATCHMAKING] Queue for ${playerCount}-player games: ${queue.length} player(s)`,
      );
    }

    socket.emit("match-cancelled");
    broadcastQueueStatus(playerCount);
  });

  // Join room
  socket.on("join-room", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, playerId, playerCount, isHost, turnTime, gameId } = data;
    if (typeof roomId !== "string" || !/^[A-Za-z0-9-]{4,40}$/.test(roomId) ||
      typeof playerId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(playerId)) {
      socket.emit("join-room-error", { message: "Invalid room or player ID." });
      return;
    }
    const playerName = socket.data.username;
    console.log(
      `ðŸ‘¤ [JOIN-ROOM] ${playerName} (Tab-ID: ${playerId}) joining room ${roomId}`,
    );
    console.log(`   Socket ID: ${socket.id} | Ù†Ø§Ù…: ${playerName}`);

    const existingRoom = rooms.get(roomId);
    if (!existingRoom && !isHost) {
      socket.emit("join-room-error", { message: "Room not found." });
      return;
    }
    const room = existingRoom || getOrCreateRoom(roomId);
    if (!room) return;
    const isFriendInviteRoom = typeof roomId === "string" && roomId.startsWith("FR-");
    if (isFriendInviteRoom) {
      room.maxPlayers = 2;
    }

    const already = room.players.get(playerId);
    if (already) {
      if (already.accountId !== socket.data.userId) {
        socket.emit("join-room-error", { message: "This seat belongs to another player." });
        return;
      }
      const oldSocketId = already.socketId;
      clearDisconnectTimer(roomId, playerId);
      already.socketId = socket.id;
      already.connected = true;
      already.name = playerName || already.name;
      socket.join(roomId);
      if (oldSocketId !== socket.id) io.sockets.sockets.get(oldSocketId)?.disconnect(true);
      io.to(roomId).emit("players-updated", {
        players: getRoomPlayersArray(roomId),
        roomStatus: room.status,
      });
      socket.emit("players-updated", {
        players: getRoomPlayersArray(roomId),
        roomStatus: room.status,
      });
      if (room.status === "playing" && room.gameState) {
        socket.emit("game-state-updated", room.gameState);
        socket.emit("player-index-map-updated", {
          playerIndexMap: buildPlayerIndexMap(room.turn.playersInGame || getRoomPlayersArray(roomId)),
          gameState: room.gameState,
        });
        if (Number.isFinite(room.turn?.endsAt)) {
          socket.emit("turn-timer-updated", {
            endsAt: room.turn.endsAt,
            serverNow: Date.now(),
            currentPlayerIndex: room.gameState.currentPlayerIndex || 0,
            durationMs: room.turn.durationMs,
          });
        }
      }
      return;
    }

    if (room.status !== "waiting" || room.players.size >= room.maxPlayers ||
      Array.from(room.players.values()).some((player) => player.accountId === socket.data.userId)) {
      socket.emit("join-room-error", { message: "Room is full or already started." });
      return;
    }

    if (!isHost && room.status !== "waiting") {
      socket.emit("join-room-error", {
        message: "Game already started in this room.",
      });
      return;
    }

    if (!isHost && room.maxPlayers && room.players.size >= room.maxPlayers) {
      socket.emit("join-room-error", {
        message: "Room is full.",
      });
      return;
    }

    // Add player to room
    room.players.set(playerId, {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      accountId: socket.data.userId,
      connected: true,
      joinedAt: Date.now(),
    });

    // Update max players if host is setting it
    if (isHost && playerCount) {
      if (!room.hostAccountId) room.hostAccountId = socket.data.userId;
      if (room.hostAccountId === socket.data.userId) {
        room.maxPlayers = isFriendInviteRoom ? 2 : [2, 3, 4].includes(playerCount) ? playerCount : 2;
      }
      console.log(`   Max Players set to: ${playerCount}`);
    }
    if (gameId && !room.gameId && ["splendor", "dead-mans-draw"].includes(gameId)) {
      room.gameId = isFriendInviteRoom && gameId !== "dead-mans-draw" ? "splendor" : gameId;
    }
    if (turnTime && room.hostAccountId === socket.data.userId) {
      room.turn.durationMs = normalizeTurnTimeSeconds(turnTime) * 1000;
    }

    // Join socket to room namespace
    socket.join(roomId);

    // Broadcast updated player list to all in room
    io.to(roomId).emit("players-updated", {
      players: getRoomPlayersArray(roomId),
      roomStatus: room.status,
    });

    console.log(
      `ðŸ“Š [PLAYERS] Room ${roomId} now has ${room.players.size} players | ØªØ¹Ø¯Ø§Ø¯ Ø¨Ø§Ø²ÛŒÚ©Ù†Ø§Ù†: ${room.players.size}`,
    );
  });

  // Leave room
  socket.on("leave-room", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, playerId } = data;
    const member = rooms.get(roomId)?.players.get(playerId);
    if (!member || member.socketId !== socket.id || member.accountId !== socket.data.userId) return;
    console.log(
      `ðŸ‘‹ [LEAVE-ROOM] Player ${playerId} leaving room ${roomId} | Ø¨Ø§Ø²ÛŒÚ©Ù† ØªØ±Ú© Ø§ØªØ§Ù‚`,
    );
    handlePlayerDeparture(roomId, playerId, socket.id);
    socket.leave(roomId);
  });

  // Start game
  socket.on("start-game", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, gameState, turnTime, targetScore } = data;
    console.log(`ðŸŽ® [START-GAME] Starting game in room ${roomId} | Ø´Ø±ÙˆØ¹ Ø¨Ø§Ø²ÛŒ`);

    const room = rooms.get(roomId);
    const isMember = Array.from(room?.players.values() || []).some((member) =>
      member.socketId === socket.id && member.accountId === socket.data.userId);
    const mayStart = roomId.startsWith("MM-")
      ? isMember
      : room?.hostAccountId === socket.data.userId && isMember;
    if (room && room.status === "waiting" && mayStart &&
      ["splendor", "dead-mans-draw"].includes(room.gameId) &&
      room.players.size >= 2 && room.players.size === room.maxPlayers &&
      gameState && Array.isArray(gameState.players) &&
      gameState.players.length === room.players.size &&
      gameState.currentPlayerIndex === 0 && gameState.gameOver === false &&
      (room.gameId !== "splendor" || isValidInitialSplendorState(gameState, room.players.size)) &&
      (room.gameId !== "dead-mans-draw" || isValidInitialDeadMansDrawState(gameState, room.players.size))) {
      room.status = "playing";
      room.gameState = gameState;
      room.targetScore = Number.isInteger(targetScore) && targetScore >= 10 && targetScore <= 30 ? targetScore : 15;

      // Get players in a consistent order (sorted by socket ID to ensure consistency)
      const playersArray = Array.from(room.players.values()).sort((a, b) =>
        a.socketId.localeCompare(b.socketId),
      );
      room.turn.playersInGame = playersArray;
      room.turn.durationMs = normalizeTurnTimeSeconds(turnTime) * 1000;
      room.rematch = null;

      // Create mapping of socket ID to player index in game
      const playerIndexMap = buildPlayerIndexMap(playersArray);

      // Notify all players in room that game started
      io.to(roomId).emit("game-started", {
        gameState,
        playersInGame: playersArray,
        playerIndexMap, // Map socket ID to game index
      });
      console.log(
        `âœ… [START-GAME] Game started with ${room.players.size} players | Ø¨Ø§Ø²ÛŒ Ø¢ØºØ§Ø² Ø´Ø¯`,
      );

      // Start turn timer (30s per turn)
      startTurnTimer(roomId);
    } else {
      console.log(
        `âŒ [START-GAME] Not enough players (${room?.players.size || 0}/2)`,
      );
    }
  });

  // Sync game state - main action that broadcasts to all players
  socket.on("sync-game-state", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, gameState, playerId } = data;
    const room = rooms.get(roomId);
    if (room?.status === "playing" && gameState && assertCanPublishState(socket, room, playerId) &&
      (room.gameId !== "splendor" || isValidSplendorTransition(room.gameState, gameState, room.targetScore)) &&
      (room.gameId !== "dead-mans-draw" || isValidDeadMansDrawState(gameState, room.players.size))) {
      const prevIndex = activeTurnIndex(room, room.gameState);
      room.gameState = gameState;
      // Broadcast updated game state to ALL players in room (including sender)
      io.to(roomId).emit("game-state-updated", gameState);
      console.log(
        `ðŸ“¡ [SYNC] Game state synced in room ${roomId} | ÙˆØ¶Ø¹ÛŒØª Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø¯`,
      );

      if (
        room.status === "playing" &&
        typeof activeTurnIndex(room, gameState) === "number" &&
        activeTurnIndex(room, gameState) !== prevIndex
      ) {
        startTurnTimer(roomId);
      }
    } else if (room?.status === "playing" && room.players.get(playerId)?.socketId === socket.id) {
      socket.emit("game-state-updated", room.gameState);
    }
  });

  // Handle general game actions - broadcasts to all players
  socket.on("game-action", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, playerId, gameState, timestamp } = data;
    const room = rooms.get(roomId);
    if (room?.status === "playing" && gameState && assertCanPublishState(socket, room, playerId) &&
      (room.gameId !== "splendor" || isValidSplendorTransition(room.gameState, gameState, room.targetScore)) &&
      (room.gameId !== "dead-mans-draw" || isValidDeadMansDrawState(gameState, room.players.size))) {
      const prevIndex = activeTurnIndex(room, room.gameState);
      room.gameState = gameState;
      // Broadcast to all players in room
      io.to(roomId).emit("game-state-updated", gameState);
      console.log(
        `âš¡ [ACTION] Game action from ${playerId} in room ${roomId} | Ø¹Ù…Ù„ÛŒØ§Øª Ø¨Ø§Ø²ÛŒ`,
      );

      if (
        room.status === "playing" &&
        typeof activeTurnIndex(room, gameState) === "number" &&
        activeTurnIndex(room, gameState) !== prevIndex
      ) {
        startTurnTimer(roomId);
      }
    } else if (room?.status === "playing" && room.players.get(playerId)?.socketId === socket.id) {
      socket.emit("game-state-updated", room.gameState);
    }
  });

  // Card purchase action
  socket.on("card-purchased", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, cardId, playerIndex, playerId } = data;
    const room = rooms.get(roomId);
    if (room?.status === "playing" && assertCanPublishState(socket, room, playerId) &&
      room.turn.playersInGame[playerIndex]?.id === playerId) {
      io.to(roomId).emit("card-purchase-action", {
        cardId,
        playerIndex,
        gameState: room.gameState,
      });
      console.log(
        `ðŸ’³ [CARD] Card ${cardId} purchased by player ${playerIndex} (${playerId}) | Ø®Ø±ÛŒØ¯Ø§Ø±ÛŒ Ú©Ø§Ø±Øª`,
      );
    }
  });

  // Token action
  socket.on("tokens-taken", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, gems, playerIndex, playerId } = data;
    const room = rooms.get(roomId);
    if (room?.status === "playing" && Array.isArray(gems) && gems.length <= 3 &&
      assertCanPublishState(socket, room, playerId) &&
      room.turn.playersInGame[playerIndex]?.id === playerId) {
      io.to(roomId).emit("tokens-action", {
        gems,
        playerIndex,
        gameState: room.gameState,
      });
      console.log(
        `ðŸª™ [TOKEN] Tokens ${gems.join(",")} taken by player ${playerIndex} (${playerId}) | Ú¯Ø±ÙØªÙ† Ø³Ú©Ù‡â€ŒÙ‡Ø§`,
      );
    }
  });

  // Chat message
  socket.on("send-chat-message", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    if (room && socket.rooms.has(roomId) && typeof message?.message === "string" &&
      message.message.length <= 500) {
      // Broadcast message to all in room
      io.to(roomId).emit("chat-message", {
        ...message,
        playerName: socket.data.username,
      });
      console.log(
        `ðŸ’¬ [CHAT] Room ${roomId} - ${message.playerName}: ${message.message}`,
      );
    }
  });

  // Microphone toggle
  socket.on("microphone-toggled", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, playerId, enabled } = data;
    const room = rooms.get(roomId);
    if (room?.players.get(playerId)?.socketId === socket.id && typeof enabled === "boolean") {
      io.to(roomId).emit("player-microphone-toggled", {
        playerId,
        socketId: socket.id,
        enabled,
      });
      const status = enabled ? "ON ðŸŽ¤" : "OFF ðŸ”‡";
      console.log(
        `ðŸŽ¤ [MIC] Microphone ${status} for ${playerId} in room ${roomId} | Ù…ÛŒÚ©Ø±ÙˆÙÙˆÙ† ${enabled ? "Ø±ÙˆØ´Ù†" : "Ø®Ø§Ù…ÙˆØ´"}`,
      );
    }
  });

  function canSignalPeer(data) {
    if (!data || typeof data !== "object" || typeof data.to !== "string" ||
      typeof data.roomId !== "string") return false;
    const room = rooms.get(data.roomId);
    return Boolean(room && socket.rooms.has(data.roomId) &&
      Array.from(room.players.values()).some((player) => player.socketId === socket.id) &&
      Array.from(room.players.values()).some((player) => player.socketId === data.to));
  }

  // Voice chat signaling (WebRTC)
  socket.on("voice-offer", (data) => {
    if (!canSignalPeer(data)) return;
    const { to, offer, roomId } = data;
    if (offer && typeof offer === "object") {
      io.to(to).emit("voice-offer", {
        from: socket.id,
        offer,
        roomId,
      });
    }
  });

  socket.on("voice-answer", (data) => {
    if (!canSignalPeer(data)) return;
    const { to, answer, roomId } = data;
    if (answer && typeof answer === "object") {
      io.to(to).emit("voice-answer", {
        from: socket.id,
        answer,
        roomId,
      });
    }
  });

  socket.on("voice-ice", (data) => {
    if (!canSignalPeer(data)) return;
    const { to, candidate, roomId } = data;
    if (candidate && typeof candidate === "object") {
      io.to(to).emit("voice-ice", {
        from: socket.id,
        candidate,
        roomId,
      });
    }
  });

  socket.on("voice-end", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId } = data;
    const room = rooms.get(roomId);
    if (room && socket.rooms.has(roomId) &&
      Array.from(room.players.values()).some((player) => player.socketId === socket.id)) {
      socket.to(roomId).emit("voice-end", {
        from: socket.id,
      });
    }
  });

  // End game
  socket.on("end-game", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId } = data;
    console.log(`ðŸ [END-GAME] Ending game in room ${roomId} | Ù¾Ø§ÛŒØ§Ù† Ø¨Ø§Ø²ÛŒ`);

    const room = rooms.get(roomId);
    if (room?.status === "playing" && room.gameState?.gameOver && socket.rooms.has(roomId)) {
      room.status = "finished";
      room.gameState = null;
      room.rematch = null;
      clearTurnTimer(room);

      io.to(roomId).emit("game-ended", {
        playersInRoom: getRoomPlayersArray(roomId),
      });
      console.log(`âœ… [END-GAME] Game ended | Ø¨Ø§Ø²ÛŒ Ù¾Ø§ÛŒØ§Ù† ÛŒØ§ÙØª`);
    }
  });

  socket.on("post-game-action", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, playerId, action, initialGameState } = data;
    const room = rooms.get(roomId);
    const member = room?.players.get(playerId);
    if (!room || !member || member.socketId !== socket.id || member.accountId !== socket.data.userId ||
      !socket.rooms.has(roomId) || room.status !== "finished") return;
    if (action === "exit") return;
    if (action === "play-again") {
      if (!room.rematch) {
        if (!isValidInitialRoomState(room, initialGameState)) return;
        room.rematch = {
          requestedBy: playerId,
          acceptedBy: new Set([playerId]),
          initialGameState,
        };
        socket.to(roomId).emit("rematch-requested", { playerId });
        io.to(roomId).emit("post-game-votes", {
          playerIds: Array.from(room.rematch.acceptedBy),
        });
        return;
      }
      room.rematch.acceptedBy.add(playerId);
      io.to(roomId).emit("post-game-votes", {
        playerIds: Array.from(room.rematch.acceptedBy),
      });
      if (room.rematch.acceptedBy.size >= room.players.size) {
        startRematch(roomId, room);
      }
    }
  });

  socket.on("request-rematch", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, playerId, initialGameState } = data;
    const room = rooms.get(roomId);
    if (!room || room.status !== "finished" ||
      room.players.get(playerId)?.socketId !== socket.id ||
      room.players.get(playerId)?.accountId !== socket.data.userId ||
      !isValidInitialRoomState(room, initialGameState)) return;

    room.rematch = {
      requestedBy: playerId,
      acceptedBy: new Set([playerId]),
      initialGameState,
    };

    socket.to(roomId).emit("rematch-requested", { playerId });
  });

  socket.on("respond-rematch", (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, playerId, accept } = data;
    const room = rooms.get(roomId);
    if (!room || !room.rematch || room.status !== "finished" ||
      room.players.get(playerId)?.socketId !== socket.id ||
      room.players.get(playerId)?.accountId !== socket.data.userId) return;

    if (!accept) {
      room.rematch = null;
      io.to(roomId).emit("rematch-result", { accepted: false });
      return;
    }

    room.rematch.acceptedBy.add(playerId);

    if (room.rematch.acceptedBy.size >= room.players.size) {
      startRematch(roomId, room);
    }
  });

  socket.on("disconnect", () => {
    console.log(`âŒ [DISCONNECT] Player disconnected | Ù‚Ø·Ø¹ Ø´Ø¯Ù‡: ${socket.id}`);

    Object.keys(matchmakingQueue).forEach((countKey) => {
      const playerCount = Number(countKey);
      const queue = matchmakingQueue[playerCount];
      const nextQueue = queue.filter((player) => player.socketId !== socket.id);
      if (nextQueue.length !== queue.length) {
        matchmakingQueue[playerCount] = nextQueue;
        broadcastQueueStatus(playerCount);
      }
    });

    for (const [roomId, room] of rooms.entries()) {
      const matchingPlayer = Array.from(room.players.values()).find((player) => player.socketId === socket.id);
      if (!matchingPlayer) continue;
      if (room.status === "playing") {
        matchingPlayer.connected = false;
        const key = `${roomId}:${matchingPlayer.id}`;
        clearDisconnectTimer(roomId, matchingPlayer.id);
        disconnectTimers.set(
          key,
          setTimeout(() => {
            handlePlayerDeparture(roomId, matchingPlayer.id, matchingPlayer.socketId);
            disconnectTimers.delete(key);
          }, RECONNECT_MS),
        );
        continue;
      }
      handlePlayerDeparture(roomId, matchingPlayer.id, socket.id);
      socket.leave(roomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
const databaseSyncRevision = userMutationRevision;
async function startServer() {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production.");
  }
  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_ORIGINS?.trim()) {
    throw new Error("CLIENT_ORIGINS is required in production (include the public HTTPS and native app origins).");
  }
  const fallbackState = normalizeSocialState(readSharedState());
  const users = await syncUsersWithDatabase(fallbackState.users || []);
  if (databaseSyncRevision !== userMutationRevision || !Array.isArray(users)) {
    throw new Error("Could not initialize users before accepting connections.");
  }
  databaseUsersSnapshot = users;
  const state = normalizeSocialState(process.env.NODE_ENV === "production"
    ? await loadSharedStateFromDatabase(fallbackState)
    : readSharedState());
  state.users = users;
  if (process.env.NODE_ENV === "production") sharedStateSnapshot = structuredClone(state);
  await writeSharedState(state);
  httpServer.listen(PORT, () => {
    console.log(`Game server listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});
