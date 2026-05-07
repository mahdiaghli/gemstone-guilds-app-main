import {
  readSharedState,
  writeSharedState,
  normalizeSocialState,
} from "./server-state.js";
import {
  generateUniqueGroupCode,
  normalizeGroup,
  removeUserFromGroups,
  normalizeTurnTimeSeconds,
  normalizePlayerCount,
  normalizeHumanPlayers,
} from "./server-utils.js";

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

export function setupHttpRoutes(httpServer) {
  httpServer.on("request", async (req, res) => {
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
        const playerCount = normalizePlayerCount(payload.playerCount);
        state.gameInvites.unshift({
          id: `invite-${Date.now()}-${payload.fromUserId}-${payload.toUserId}`,
          fromUserId: payload.fromUserId,
          toUserId: payload.toUserId,
          createdAt: new Date().toISOString(),
          status: "pending",
          gameId: typeof payload.gameId === "string" && payload.gameId ? payload.gameId : "splendor",
          playerCount,
          humanPlayers: normalizeHumanPlayers(payload.humanPlayers, playerCount),
          turnTime: normalizeTurnTimeSeconds(payload.turnTime),
          roomId: typeof payload.roomId === "string" && payload.roomId ? payload.roomId : `FR-${Date.now().toString(36).toUpperCase()}`,
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
      res.end(JSON.stringify({ ok: true, invite }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Socket.IO Server Running", port: 3001 }));
  });
}
