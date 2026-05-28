import { createServer } from "http";
import fs from "fs";
import path from "path";
import { Server } from "socket.io";

const DATA_DIR = path.resolve("./server-data");
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
  ensureStateFile();
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
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

function writeSharedState(state) {
  ensureStateFile();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function generateGroupCode(seed = Date.now().toString(36)) {
  const base = `${seed}${Math.random().toString(36).slice(2, 8)}`
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  return `GRP-${base.slice(0, 6).padEnd(6, "X")}`;
}

function generateUniqueGroupCode(groups, seed = Date.now().toString(36)) {
  let nextCode = generateGroupCode(seed);
  while (groups.some((group) => group.code === nextCode)) {
    nextCode = generateGroupCode(`${seed}${Math.random().toString(36).slice(2, 6)}`);
  }
  return nextCode;
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
    code: entry.code || generateUniqueGroupCode([], entry.id),
    description: entry.description || "",
    flag: entry.flag || "🏳️",
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
    .filter((group) => group.members.length > 0);
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

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
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
  withCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Content-Type": "application/json" });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", "http://localhost:3001");
  const state = normalizeSocialState(readSharedState());
  state.groups = Array.isArray(state.groups) ? state.groups.map(normalizeGroup) : [];

  if (req.method === "GET" && url.pathname === "/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ users: state.users }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/users") {
    const payload = await parseBody(req).catch(() => null);
    if (!payload?.id || !payload?.username) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid user payload" }));
      return;
    }

    const existingIndex = state.users.findIndex((user) => user.id === payload.id);
    if (existingIndex >= 0) {
      state.users[existingIndex] = payload;
    } else if (!state.users.some((user) => user.username === payload.username)) {
      state.users.push(payload);
    }

    writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, users: state.users }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/groups") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ groups: state.groups }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/social") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      users: state.users,
      groups: state.groups,
      friends: state.friends,
      friendRequests: state.friendRequests,
      messages: state.messages,
      groupMessages: state.groupMessages,
      gameInvites: state.gameInvites,
    }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups") {
    const payload = await parseBody(req).catch(() => null);
    if (!payload?.creatorId || !payload?.name) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid group payload" }));
      return;
    }

    state.groups = removeUserFromGroups(state.groups, payload.creatorId);
    const groupId = `group-${Date.now()}`;
    const nextGroup = normalizeGroup({
      ...payload,
      id: groupId,
      code: generateUniqueGroupCode(state.groups, groupId),
      members: [payload.creatorId],
      pendingRequests: [],
      createdAt: new Date().toISOString(),
    });
    state.groups.unshift(nextGroup);
    writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, group: nextGroup, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/request") {
    const payload = await parseBody(req).catch(() => null);
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
      }
      writeSharedState(state);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, status: "joined", group: joinableGroup, groups: state.groups }));
      return;
    }

    if (!freshGroup.members.includes(payload.userId) && !freshGroup.pendingRequests.includes(payload.userId)) {
      freshGroup.pendingRequests.push(payload.userId);
      writeSharedState(state);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: "requested", group: freshGroup, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/update") {
    const payload = await parseBody(req).catch(() => null);
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

    writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, group, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/leave") {
    const payload = await parseBody(req).catch(() => null);
    if (!payload?.userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid leave payload" }));
      return;
    }

    const currentGroup = state.groups.find((entry) => entry.members.includes(payload.userId));
    state.groups = removeUserFromGroups(state.groups, payload.userId);
    writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, groupId: currentGroup?.id || null, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/respond") {
    const payload = await parseBody(req).catch(() => null);
    const group = state.groups.find((entry) => entry.id === payload?.groupId);
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
    writeSharedState(state);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, group, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/groups/remove-member") {
    const payload = await parseBody(req).catch(() => null);
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
    writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, groups: state.groups }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/friend-request") {
    const payload = await parseBody(req).catch(() => null);
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
      writeSharedState(state);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/friend-respond") {
    const payload = await parseBody(req).catch(() => null);
    const request = state.friendRequests.find((entry) => entry.id === payload?.requestId);
    if (!request) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Friend request not found" }));
      return;
    }

    request.status = payload.accept ? "accepted" : "declined";
    if (payload.accept) {
      state.friends[request.fromUserId] = Array.from(new Set([...(state.friends[request.fromUserId] || []), request.toUserId]));
      state.friends[request.toUserId] = Array.from(new Set([...(state.friends[request.toUserId] || []), request.fromUserId]));
    }
    writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/messages") {
    const payload = await parseBody(req).catch(() => null);
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
    writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/group-messages") {
    const payload = await parseBody(req).catch(() => null);
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
    writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/game-invites") {
    const payload = await parseBody(req).catch(() => null);
    if (!payload?.fromUserId || !payload?.toUserId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid game invite payload" }));
      return;
    }

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
      });
      writeSharedState(state);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/social/game-invites/respond") {
    const payload = await parseBody(req).catch(() => null);
    const invite = state.gameInvites.find((entry) => entry.id === payload?.inviteId);
    if (!invite) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Game invite not found" }));
      return;
    }

    invite.status = payload.accept ? "accepted" : "declined";
    writeSharedState(state);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Socket.IO Server Running", port: 3001 }));
});

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // ✅ اجازه دسترسی به localhost، 127.0.0.1، و IP‌های محلی
      // ✅ Allow localhost, 127.0.0.1, and local network IPs
      // ✅ ریق ngrok و CloudFlare Tunnel را هم اضافه کنیم
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

      if (!origin || allowedPatterns.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("برای دسترسی اجازه نیست | Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
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
      createdAt: Date.now(),
      turn: {
        timer: null,
        endsAt: null,
        currentIndex: 0,
        durationMs: 45000,
        missedByIndex: new Map(), // index -> missed turns due to timeout
        playersInGame: [], // ordered list used for index mapping
      },
      rematch: null,
    });
  }
  return rooms.get(roomId);
}

function buildPlayerIndexMap(room) {
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
  room.turn.missedByIndex = new Map();
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
    playerIndexMap: buildPlayerIndexMap(room),
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
    playerIndexMap: buildPlayerIndexMap(room),
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

  clearTurnTimer(room);
  const durationMs = normalizeTurnTimeSeconds(Math.round((room.turn?.durationMs || 45000) / 1000)) * 1000;
  room.turn.durationMs = durationMs;

  room.turn.currentIndex = room.gameState.currentPlayerIndex || 0;
  room.turn.endsAt = Date.now() + durationMs;
  io.to(roomId).emit("turn-timer-updated", {
    endsAt: room.turn.endsAt,
    currentPlayerIndex: room.turn.currentIndex,
  });

  room.turn.timer = setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r || r.status !== "playing" || !r.gameState) return;

    const idx = r.gameState.currentPlayerIndex || 0;
    console.log(`⏱️  [TURN] Timeout in room ${roomId} | playerIndex=${idx}`);

    normalizeTimedOutPlayer(r);

    // Auto-advance turn
    const playerCount =
      r.turn.playersInGame?.length || r.gameState.players?.length || 2;
    r.gameState.currentPlayerIndex = (idx + 1) % Math.max(2, playerCount);
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
  return "MM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
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
    `   Can match: ${queue.length >= playerCount ? "YES ✅" : "NO ❌"}`,
  );

  const groupedByGame = new Map();
  queue.forEach((player) => {
    const key = player.gameId || "splendor";
    if (!groupedByGame.has(key)) {
      groupedByGame.set(key, []);
    }
    groupedByGame.get(key).push(player);
  });

  const eligibleGroup = Array.from(groupedByGame.values()).find((group) => group.length >= playerCount);

  if (eligibleGroup) {
    // Match found! Take playerCount players from the same game
    const matchedPlayers = eligibleGroup.slice(0, playerCount);
    const matchedIds = new Set(matchedPlayers.map((player) => player.playerId));
    matchmakingQueue[playerCount] = queue.filter((player) => !matchedIds.has(player.playerId));

    // Create new room for this match
    const roomId = generateRoomId();
    const room = getOrCreateRoom(roomId);
    room.maxPlayers = playerCount;
    room.gameId = matchedPlayers[0]?.gameId || null;
    room.turn.durationMs = normalizeTurnTimeSeconds(matchedPlayers[0]?.turnTime) * 1000;

    console.log(`\n${"#".repeat(60)}`);
    console.log(`🎮 MATCH CREATED: ${roomId}`);
    console.log(`${"#".repeat(60)}`);

    // Add players to room
    const playerList = [];
    matchedPlayers.forEach((player, idx) => {
      room.players.set(player.playerId, {
        id: player.playerId,
        name: player.playerName,
        socketId: player.socketId,
        connected: true,
        joinedAt: Date.now(),
      });
      playerList.push(player);
      console.log(`   [${idx + 1}] ${player.playerName} (${player.socketId})`);
    });

    console.log(`\nℹ️  Notifying ${playerCount} players about match...`);

    // Notify all matched players that game is ready
    matchedPlayers.forEach((player, idx) => {
      console.log(`   📤 Sending 'match-found' to ${player.playerName}...`);
      io.to(player.socketId).emit("match-found", {
        roomId,
        players: Array.from(room.players.values()),
        turnTime: room.turn.durationMs / 1000,
      });
      console.log(`   ✅ Sent to ${player.playerName}`);
    });

    console.log(`\n${"#".repeat(60)}\n`);

    return {
      roomId,
      players: Array.from(room.players.values()),
    };
  }

  console.log(`   ➡️  No match possible. Queue too small.\n`);
  return null;
}

// Helper function to get room players as array
function getRoomPlayersArray(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.players.values());
}

io.on("connection", (socket) => {
  console.log(
    `✅ [CONNECTION] Player connected | بازیکن متصل شد: ${socket.id}`,
  );
  console.log(`📱 Client address: ${socket.handshake.address}`);
  console.log(`🌍 Headers:`, {
    agent: socket.handshake.headers["user-agent"]?.substring(0, 50),
    origin: socket.handshake.headers["origin"],
  });

  // Matchmaking: Find a match for this player
  socket.on("find-match", (data) => {
    const { playerCount, playerName, playerId, turnTime, gameId } = data;
    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `🔍 [MATCHMAKING] ${playerName} searching for ${playerCount}-player game`,
    );
    console.log(`   Player ID: ${playerId}`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`${"=".repeat(60)}\n`);

    // Ensure queue exists for this playerCount
    if (!matchmakingQueue[playerCount]) {
      matchmakingQueue[playerCount] = [];
    }

    // Add to matchmaking queue
    matchmakingQueue[playerCount].push({
      socketId: socket.id,
      playerId,
      playerName,
      gameId,
      turnTime: normalizeTurnTimeSeconds(turnTime),
      timestamp: Date.now(),
    });

    console.log(`📊 [QUEUE] Current ${playerCount}-player queue:`);
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
        `🎉 MATCH FOUND! Attempting to match ${playerCount} players...`,
      );
      console.log(`${"*".repeat(60)}\n`);
    }

    // Try to match players
    const matchResult = tryMatchPlayers(playerCount);
    if (matchResult) {
      console.log(`✅ [MATCH SUCCESS] Room created: ${matchResult.roomId}`);
      broadcastQueueStatus(playerCount);
      // Match found, players will be notified via 'match-found' event
    } else {
      console.log(`⏳ [WAITING] Not enough players yet. Broadcasting queue count...`);
      broadcastQueueStatus(playerCount);
    }
  });

  // Cancel matchmaking
  socket.on("cancel-match", (data) => {
    const { playerCount, playerId } = data;
    console.log(
      `❌ [MATCHMAKING] Player ${playerId} cancelled search for ${playerCount}-player game`,
    );

    // Remove from queue
    const queue = matchmakingQueue[playerCount];
    const index = queue.findIndex((p) => p.playerId === playerId);
    if (index !== -1) {
      queue.splice(index, 1);
      console.log(
        `📊 [MATCHMAKING] Queue for ${playerCount}-player games: ${queue.length} player(s)`,
      );
    }

    socket.emit("match-cancelled");
    broadcastQueueStatus(playerCount);
  });

  // Join room
  socket.on("join-room", (data) => {
    const { roomId, playerId, playerName, playerCount, isHost, turnTime, gameId } = data;
    console.log(
      `👤 [JOIN-ROOM] ${playerName} (Tab-ID: ${playerId}) joining room ${roomId}`,
    );
    console.log(`   Socket ID: ${socket.id} | نام: ${playerName}`);

    const existingRoom = rooms.get(roomId);
    const room = existingRoom || getOrCreateRoom(roomId);
    if (!room) return;

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
      connected: true,
      joinedAt: Date.now(),
    });

    // Update max players if host is setting it
    if (isHost && playerCount) {
      room.maxPlayers = playerCount;
      console.log(`   Max Players set to: ${playerCount}`);
    }
    if (gameId) {
      room.gameId = gameId;
    }
    if (turnTime) {
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
      `📊 [PLAYERS] Room ${roomId} now has ${room.players.size} players | تعداد بازیکنان: ${room.players.size}`,
    );
  });

  // Leave room
  socket.on("leave-room", (data) => {
    const { roomId, playerId } = data;
    console.log(
      `👋 [LEAVE-ROOM] Player ${playerId} leaving room ${roomId} | بازیکن ترک اتاق`,
    );
    handlePlayerDeparture(roomId, playerId, socket.id);
    socket.leave(roomId);
  });

  // Start game
  socket.on("start-game", (data) => {
    const { roomId, gameState, turnTime } = data;
    console.log(`🎮 [START-GAME] Starting game in room ${roomId} | شروع بازی`);

    const room = rooms.get(roomId);
    if (room && room.players.size >= 2 && (!room.maxPlayers || room.players.size === room.maxPlayers)) {
      room.status = "playing";
      room.gameState = gameState;

      // Get players in a consistent order (sorted by socket ID to ensure consistency)
      const playersArray = Array.from(room.players.values()).sort((a, b) =>
        a.socketId.localeCompare(b.socketId),
      );
      room.turn.playersInGame = playersArray;
      room.turn.missedByIndex = new Map();
      room.turn.durationMs = normalizeTurnTimeSeconds(turnTime) * 1000;
      room.rematch = null;

      // Create mapping of socket ID to player index in game
      const playerIndexMap = {};
      playersArray.forEach((player, idx) => {
        playerIndexMap[player.socketId] = idx;
      });

      // Notify all players in room that game started
      io.to(roomId).emit("game-started", {
        gameState,
        playersInGame: playersArray,
        playerIndexMap, // Map socket ID to game index
      });
      console.log(
        `✅ [START-GAME] Game started with ${room.players.size} players | بازی آغاز شد`,
      );

      // Start turn timer (30s per turn)
      startTurnTimer(roomId);
    } else {
      console.log(
        `❌ [START-GAME] Not enough players (${room?.players.size || 0}/2)`,
      );
    }
  });

  // Sync game state - main action that broadcasts to all players
  socket.on("sync-game-state", (data) => {
    const { roomId, gameState } = data;
    const room = rooms.get(roomId);
    if (room) {
      const prevIndex = room.gameState?.currentPlayerIndex;
      room.gameState = gameState;
      // Broadcast updated game state to ALL players in room (including sender)
      io.to(roomId).emit("game-state-updated", gameState);
      console.log(
        `📡 [SYNC] Game state synced in room ${roomId} | وضعیت بروزرسانی شد`,
      );

      if (
        typeof prevIndex === "number" &&
        typeof gameState?.currentPlayerIndex === "number" &&
        gameState.currentPlayerIndex !== prevIndex
      ) {
        room.turn.missedByIndex.set(prevIndex, 0);
      }

      if (
        room.status === "playing" &&
        typeof gameState?.currentPlayerIndex === "number" &&
        gameState.currentPlayerIndex !== prevIndex
      ) {
        startTurnTimer(roomId);
      }
    }
  });

  // Handle general game actions - broadcasts to all players
  socket.on("game-action", (data) => {
    const { roomId, playerId, gameState, timestamp } = data;
    const room = rooms.get(roomId);
    if (room) {
      const prevIndex = room.gameState?.currentPlayerIndex;
      room.gameState = gameState;
      // Broadcast to all players in room
      io.to(roomId).emit("game-state-updated", gameState);
      console.log(
        `⚡ [ACTION] Game action from ${playerId} in room ${roomId} | عملیات بازی`,
      );

      if (
        typeof prevIndex === "number" &&
        typeof gameState?.currentPlayerIndex === "number" &&
        gameState.currentPlayerIndex !== prevIndex
      ) {
        room.turn.missedByIndex.set(prevIndex, 0);
      }

      if (
        room.status === "playing" &&
        typeof gameState?.currentPlayerIndex === "number" &&
        gameState.currentPlayerIndex !== prevIndex
      ) {
        startTurnTimer(roomId);
      }
    }
  });

  // Card purchase action
  socket.on("card-purchased", (data) => {
    const { roomId, cardId, playerIndex, playerId, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit("card-purchase-action", {
        cardId,
        playerIndex,
        gameState,
      });
      console.log(
        `💳 [CARD] Card ${cardId} purchased by player ${playerIndex} (${playerId}) | خریداری کارت`,
      );
    }
  });

  // Token action
  socket.on("tokens-taken", (data) => {
    const { roomId, gems, playerIndex, playerId, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit("tokens-action", {
        gems,
        playerIndex,
        gameState,
      });
      console.log(
        `🪙 [TOKEN] Tokens ${gems.join(",")} taken by player ${playerIndex} (${playerId}) | گرفتن سکه‌ها`,
      );
    }
  });

  // Chat message
  socket.on("send-chat-message", (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    if (room) {
      // Broadcast message to all in room
      io.to(roomId).emit("chat-message", message);
      console.log(
        `💬 [CHAT] Room ${roomId} - ${message.playerName}: ${message.message}`,
      );
    }
  });

  // Microphone toggle
  socket.on("microphone-toggled", (data) => {
    const { roomId, playerId, enabled } = data;
    const room = rooms.get(roomId);
    if (room) {
      // Broadcast microphone status to all in room
      io.to(roomId).emit("player-microphone-toggled", {
        playerId,
        enabled,
      });
      const status = enabled ? "ON 🎤" : "OFF 🔇";
      console.log(
        `🎤 [MIC] Microphone ${status} for ${playerId} in room ${roomId} | میکروفون ${enabled ? "روشن" : "خاموش"}`,
      );
    }
  });

  // Voice chat signaling (WebRTC)
  socket.on("voice-offer", (data) => {
    const { to, offer, roomId } = data;
    if (to) {
      io.to(to).emit("voice-offer", {
        from: socket.id,
        offer,
        roomId,
      });
    }
  });

  socket.on("voice-answer", (data) => {
    const { to, answer, roomId } = data;
    if (to) {
      io.to(to).emit("voice-answer", {
        from: socket.id,
        answer,
        roomId,
      });
    }
  });

  socket.on("voice-ice", (data) => {
    const { to, candidate, roomId } = data;
    if (to) {
      io.to(to).emit("voice-ice", {
        from: socket.id,
        candidate,
        roomId,
      });
    }
  });

  socket.on("voice-end", (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit("voice-end", {
        from: socket.id,
      });
    }
  });

  // End game
  socket.on("end-game", (data) => {
    const { roomId } = data;
    console.log(`🏁 [END-GAME] Ending game in room ${roomId} | پایان بازی`);

    const room = rooms.get(roomId);
    if (room) {
      room.status = "finished";
      room.gameState = null;
      room.rematch = null;
      clearTurnTimer(room);

      io.to(roomId).emit("game-ended", {
        playersInRoom: getRoomPlayersArray(roomId),
      });
      console.log(`✅ [END-GAME] Game ended | بازی پایان یافت`);
    }
  });

  socket.on("request-rematch", (data) => {
    const { roomId, playerId, initialGameState } = data;
    const room = rooms.get(roomId);
    if (!room || !initialGameState) return;

    room.rematch = {
      requestedBy: playerId,
      acceptedBy: new Set([playerId]),
      initialGameState,
    };

    socket.to(roomId).emit("rematch-requested", { playerId });
  });

  socket.on("respond-rematch", (data) => {
    const { roomId, playerId, accept } = data;
    const room = rooms.get(roomId);
    if (!room || !room.rematch) return;

    if (!accept) {
      room.rematch = null;
      io.to(roomId).emit("rematch-result", { accepted: false });
      return;
    }

    room.rematch.acceptedBy.add(playerId);

    if (room.rematch.acceptedBy.size >= room.players.size) {
      room.status = "playing";
      room.gameState = room.rematch.initialGameState;
      const playersArray = Array.from(room.players.values()).sort((a, b) =>
        a.socketId.localeCompare(b.socketId),
      );
      room.turn.playersInGame = playersArray;
      room.turn.missedByIndex = new Map();

      const playerIndexMap = {};
      playersArray.forEach((player, idx) => {
        playerIndexMap[player.socketId] = idx;
      });

      io.to(roomId).emit("rematch-result", { accepted: true });
      io.to(roomId).emit("game-started", {
        gameState: room.gameState,
        playersInGame: playersArray,
        playerIndexMap,
      });
      room.rematch = null;
      startTurnTimer(roomId);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ [DISCONNECT] Player disconnected | قطع شده: ${socket.id}`);

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
      handlePlayerDeparture(roomId, matchingPlayer.id, socket.id);
      socket.leave(roomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(
    `\n🎮 [SERVER] Splendor Server running on http://localhost:${PORT}`,
  );
  console.log(`📡 [SERVER] سرور Splendor در حال کار است`);
  console.log(
    `\n📱 [MOBILE] For mobile/remote connection, use your laptop IP:`,
  );
  console.log(`   http://YOUR_LAPTOP_IP:${PORT}`);
  console.log(
    `\n💡 [TIP] Find your IP: Run 'ipconfig' and look for IPv4 Address\n`,
  );
});
