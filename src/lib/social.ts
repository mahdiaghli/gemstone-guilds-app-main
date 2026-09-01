import { API_SERVER_URL } from "@/lib/socketConfig";
import defaultAvatar from "@/assets/avatar.webp";
import { readPlayerExtras } from "@/lib/playerExtras";
import { getLevelFromXp, readProgress } from "@/lib/progression";

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
}

export interface ChatMessage {
  id: string;
  participants: [string, string];
  senderId: string;
  text: string;
  createdAt: string;
}

export interface GroupEntry {
  id: string;
  creatorId: string;
  name: string;
  code: string;
  description: string;
  flag?: string;
  minScore: number;
  visibility: "public" | "private" | "closed";
  members: string[];
  pendingRequests: string[];
  createdAt: string;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface GroupJoinRequestSummary {
  groupId: string;
  groupName: string;
  requesterId: string;
}

export interface GroupMemberInfo {
  id: string;
  username: string;
  score: number;
}

export interface RankedPlayerInfo extends GroupMemberInfo {
  email?: string;
  createdAt?: string;
  level: number;
  coins: number;
  gems: number;
  userCode: string;
}

export type GroupJoinResult =
  | "joined"
  | "requested"
  | "group-closed"
  | "group-not-found"
  | "already-member";

export type FriendRequestSendResult = "sent" | "already-friends" | "already-requested";

export interface GameInvite {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
  gameId: string;
  playerCount: number;
  humanPlayers: number;
  turnTime: 15 | 30 | 45 | 60;
  roomId: string;
}

const REMOTE_RETRY_COOLDOWN_MS = 30_000;
let remoteDisabledUntil = 0;

interface SocialStore {
  friends: Record<string, string[]>;
  friendRequests: FriendRequest[];
  messages: ChatMessage[];
  groups: GroupEntry[];
  groupMessages: GroupChatMessage[];
  gameInvites: GameInvite[];
}

const STORAGE_KEY = "splendor-social-store";

const DEFAULT_STORE: SocialStore = {
  friends: {},
  friendRequests: [],
  messages: [],
  groups: [],
  groupMessages: [],
  gameInvites: [],
};

const MAX_SAVED_MESSAGES = 100;

function normalizeGroup(entry: Partial<GroupEntry> & { id: string; creatorId: string; name: string }): GroupEntry {
  const visibility =
    entry.visibility === "private" || entry.visibility === "closed"
      ? entry.visibility
      : "public";
  return {
    id: entry.id,
    creatorId: entry.creatorId,
    name: entry.name,
    code: entry.code || generateGroupCode(entry.id),
    description: entry.description || "",
    flag: entry.flag || "🏳️",
    minScore: Number(entry.minScore) || 0,
    visibility,
    members: Array.isArray(entry.members) ? entry.members : [entry.creatorId],
    pendingRequests: Array.isArray(entry.pendingRequests) ? entry.pendingRequests : [],
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

function normalizeGameInvite(invite: Partial<GameInvite> & Pick<GameInvite, "id" | "fromUserId" | "toUserId" | "createdAt" | "status">): GameInvite {
  const playerCount = normalizePlayerCount(Number(invite.playerCount) || 2);
  return {
    id: invite.id,
    fromUserId: invite.fromUserId,
    toUserId: invite.toUserId,
    createdAt: invite.createdAt,
    status: invite.status,
    gameId: typeof invite.gameId === "string" && invite.gameId ? invite.gameId : "splendor",
    playerCount,
    humanPlayers: normalizeHumanPlayers(Number(invite.humanPlayers) || playerCount, playerCount),
    turnTime: normalizeTurnTime(Number(invite.turnTime) || 15),
    roomId: typeof invite.roomId === "string" && invite.roomId ? invite.roomId : `FR-${invite.id.slice(-6).toUpperCase()}`,
  };
}

function readStore(): SocialStore {
  if (typeof window === "undefined") return DEFAULT_STORE;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STORE));
    return DEFAULT_STORE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SocialStore>;
    return {
      ...DEFAULT_STORE,
      ...parsed,
      groups: Array.isArray(parsed.groups) ? parsed.groups.map((group) => normalizeGroup(group as any)) : [],
      gameInvites: Array.isArray(parsed.gameInvites) ? parsed.gameInvites.map((invite) => normalizeGameInvite(invite as any)) : [],
    };
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STORE));
    return DEFAULT_STORE;
  }
}

function writeStore(store: SocialStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function emitSocialChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("splendor-social-updated"));
}

function persistStore(store: SocialStore) {
  writeStore(store);
  emitSocialChange();
}

function mergeStore(partial: Partial<SocialStore>) {
  const store = readStore();
  const next: SocialStore = {
    ...store,
    ...partial,
    groups: Array.isArray(partial.groups) ? partial.groups.map((group) => normalizeGroup(group as any)) : store.groups,
    friendRequests: Array.isArray(partial.friendRequests) ? partial.friendRequests : store.friendRequests,
    messages: Array.isArray(partial.messages) ? partial.messages : store.messages,
    groupMessages: Array.isArray(partial.groupMessages) ? partial.groupMessages : store.groupMessages,
    gameInvites: Array.isArray(partial.gameInvites) ? partial.gameInvites.map((invite) => normalizeGameInvite(invite as any)) : store.gameInvites,
    friends: partial.friends && typeof partial.friends === "object" ? partial.friends : store.friends,
  };
  writeStore(next);
  return next;
}

function generateGroupCode(seed?: string) {
  const base = `${seed || Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  return `GRP-${base.slice(0, 6).padEnd(6, "X")}`;
}

function generateUniqueGroupCode(groups: GroupEntry[], seed?: string) {
  let nextCode = generateGroupCode(seed);
  while (groups.some((group) => group.code === nextCode)) {
    nextCode = generateGroupCode(`${seed || Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`);
  }
  return nextCode;
}

function removeUserFromGroups(store: SocialStore, userId: string) {
  store.groups = store.groups
    .map((group) => {
      if (!group.members.includes(userId) && !group.pendingRequests.includes(userId)) {
        return group;
      }
      const nextMembers = group.members.filter((id) => id !== userId);
      const nextPending = group.pendingRequests.filter((id) => id !== userId);
      return {
        ...group,
        creatorId: group.creatorId === userId ? nextMembers[0] || "" : group.creatorId,
        members: nextMembers,
        pendingRequests: nextPending,
      };
    })
    .filter((group) => group.members.length > 0);
}

async function fetchRemoteJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (Date.now() < remoteDisabledUntil) {
    return null;
  }

  try {
    const headers = new Headers(init?.headers);
    const token =
      sessionStorage.getItem("splendor_session_token") ||
      localStorage.getItem("splendor_session_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const hasBody = init?.body !== undefined && init?.body !== null;

    if (!hasBody) {
      headers.delete("Content-Type");
    } else if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "text/plain;charset=UTF-8");
    }

    const response = await fetch(url, {
      mode: "cors",
      ...init,
      headers,
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    remoteDisabledUntil = Date.now() + REMOTE_RETRY_COOLDOWN_MS;
    return null;
  }
}

async function postRemote(url: string, payload: Record<string, unknown>) {
  return fetchRemoteJson<{ ok?: boolean }>(`${API_SERVER_URL}${url}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function syncSocialStateRemote() {
  const data = await fetchRemoteJson<Partial<SocialStore> & { users?: Array<Record<string, unknown>> }>(`${API_SERVER_URL}/social`, {
    method: "GET",
  });
  if (!data) return readStore();
  if (Array.isArray(data.users)) {
    localStorage.setItem("splendor_users", JSON.stringify(data.users));
  }
  return mergeStore(data);
}

export function getUserCode(userId?: string) {
  if (!userId) return "SP-000000";
  return `SP-${userId.slice(-6).padStart(6, "0")}`;
}

export function getRegisteredUsers() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("splendor_users") || "[]");
  } catch {
    return [];
  }
}

function updateLocalUserProfile(userId: string, updates: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const users = getRegisteredUsers();
  const nextUsers = users.map((entry: any) =>
    entry.id === userId ? { ...entry, ...updates } : entry,
  );
  localStorage.setItem("splendor_users", JSON.stringify(nextUsers));

  const currentRaw = localStorage.getItem("splendor_user");
  if (currentRaw) {
    try {
      const currentUser = JSON.parse(currentRaw);
      if (currentUser?.id === userId) {
        localStorage.setItem("splendor_user", JSON.stringify({ ...currentUser, ...updates }));
      }
    } catch {}
  }
}

export async function searchUsersRemote(query: string, currentUserId?: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const data = await fetchRemoteJson<{ users?: Array<{ id: string; username: string }> }>(`${API_SERVER_URL}/users`, {
    method: "GET",
  });
  if (Array.isArray(data?.users)) {
    localStorage.setItem("splendor_users", JSON.stringify(data.users));
    return data.users.filter((user) => {
      if (user.id === currentUserId) return false;
      return user.username.toLowerCase().includes(normalized) || getUserCode(user.id).toLowerCase().includes(normalized);
    });
  }
  return searchUsers(query, currentUserId);
}

export function getUserDisplayName(userId?: string) {
  const users = getRegisteredUsers();
  const found = users.find((user: { id: string; username: string }) => user.id === userId);
  return found?.username || "Unknown";
}

export function getUserAvatar(userId?: string) {
  const users = getRegisteredUsers();
  const found = users.find((user: { id: string; selectedAvatar?: string }) => user.id === userId);
  return found?.selectedAvatar || defaultAvatar;
}

export function getFriends(userId: string) {
  const store = readStore();
  return store.friends[userId] || [];
}

export function getFriendRequests(userId: string) {
  const store = readStore();
  return store.friendRequests.filter((request) => request.toUserId === userId && request.status === "pending");
}

export function searchUsers(query: string, currentUserId?: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return getRegisteredUsers().filter((user: { id: string; username: string }) => {
    if (user.id === currentUserId) return false;
    return user.username.toLowerCase().includes(normalized) || getUserCode(user.id).toLowerCase().includes(normalized);
  });
}

export function sendFriendRequest(fromUserId: string, toUserId: string): FriendRequestSendResult {
  const store = readStore();
  const alreadyFriends = (store.friends[fromUserId] || []).includes(toUserId);
  const pendingExists = store.friendRequests.some(
    (request) =>
      request.status === "pending" &&
      ((request.fromUserId === fromUserId && request.toUserId === toUserId) ||
        (request.fromUserId === toUserId && request.toUserId === fromUserId)),
  );

  if (alreadyFriends) return "already-friends";
  if (pendingExists) return "already-requested";

  store.friendRequests.unshift({
    id: `${Date.now()}-${fromUserId}-${toUserId}`,
    fromUserId,
    toUserId,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  persistStore(store);
  postRemote("/social/friend-request", { fromUserId, toUserId }).then(() => syncSocialStateRemote());
  return "sent";
}

export function respondToFriendRequest(requestId: string, accept: boolean) {
  const store = readStore();
  const request = store.friendRequests.find((entry) => entry.id === requestId);
  if (!request) return;

  request.status = accept ? "accepted" : "declined";
  if (accept) {
    store.friends[request.fromUserId] = Array.from(new Set([...(store.friends[request.fromUserId] || []), request.toUserId]));
    store.friends[request.toUserId] = Array.from(new Set([...(store.friends[request.toUserId] || []), request.fromUserId]));
  }
  persistStore(store);
  postRemote("/social/friend-respond", { requestId, accept }).then(() => syncSocialStateRemote());
}

export function getChatParticipants(userId: string) {
  const store = readStore();
  const ids = new Set<string>();
  store.messages.forEach((message) => {
    if (message.participants.includes(userId)) {
      ids.add(message.participants[0] === userId ? message.participants[1] : message.participants[0]);
    }
  });
  getFriends(userId).forEach((friendId) => ids.add(friendId));
  return Array.from(ids);
}

export function getConversation(userId: string, otherUserId: string) {
  const store = readStore();
  return store.messages.filter((message) => {
    const [first, second] = message.participants;
    return (first === userId && second === otherUserId) || (first === otherUserId && second === userId);
  });
}

export function sendChatMessage(fromUserId: string, toUserId: string, text: string) {
  const store = readStore();
  store.messages.push({
    id: `${Date.now()}-${fromUserId}`,
    participants: [fromUserId, toUserId].sort() as [string, string],
    senderId: fromUserId,
    text,
    createdAt: new Date().toISOString(),
  });
  const participants = [fromUserId, toUserId].sort().join(":");
  const trimmedMessages = store.messages.filter((message) => message.participants.join(":") !== participants);
  const latestConversation = store.messages
    .filter((message) => message.participants.join(":") === participants)
    .slice(-MAX_SAVED_MESSAGES);
  store.messages = [...trimmedMessages, ...latestConversation];
  persistStore(store);
  postRemote("/social/messages", { fromUserId, toUserId, text }).then(() => syncSocialStateRemote());
}

export function getPendingGameInvites(userId: string) {
  return readStore().gameInvites.filter((invite) => invite.toUserId === userId && invite.status === "pending");
}

type SendGameInviteInput = {
  fromUserId: string;
  toUserId: string;
  gameId: string;
  playerCount: number;
  humanPlayers: number;
  turnTime: 15 | 30 | 45 | 60;
};

function normalizePlayerCount(playerCount: number) {
  return Math.max(2, Math.min(4, Math.floor(playerCount || 2)));
}

function normalizeHumanPlayers(humanPlayers: number, playerCount: number) {
  return Math.max(1, Math.min(playerCount, Math.floor(humanPlayers || 2)));
}

function normalizeTurnTime(turnTime: number): 15 | 30 | 45 | 60 {
  return turnTime === 15 || turnTime === 30 || turnTime === 45 || turnTime === 60 ? turnTime : 15;
}

export function sendGameInvite(input: SendGameInviteInput) {
  const { fromUserId, toUserId, gameId } = input;
  const store = readStore();
  const playerCount = normalizePlayerCount(input.playerCount);
  const humanPlayers = normalizeHumanPlayers(input.humanPlayers, playerCount);
  const turnTime = normalizeTurnTime(input.turnTime);
  const exists = store.gameInvites.some(
    (invite) =>
      invite.status === "pending" &&
      ((invite.fromUserId === fromUserId && invite.toUserId === toUserId) ||
        (invite.fromUserId === toUserId && invite.toUserId === fromUserId)),
  );
  if (exists) return false;
  const roomId = `FR-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  store.gameInvites.unshift({
    id: `invite-${Date.now()}-${fromUserId}-${toUserId}`,
    fromUserId,
    toUserId,
    createdAt: new Date().toISOString(),
    status: "pending",
    gameId: gameId || "splendor",
    playerCount,
    humanPlayers,
    turnTime,
    roomId,
  });
  persistStore(store);
  postRemote("/social/game-invites", { fromUserId, toUserId, gameId, playerCount, humanPlayers, turnTime, roomId }).then(() => syncSocialStateRemote());
  return true;
}

export function respondToGameInvite(inviteId: string, accept: boolean) {
  const store = readStore();
  const invite = store.gameInvites.find((entry) => entry.id === inviteId);
  if (!invite) return null;
  invite.status = accept ? "accepted" : "declined";
  persistStore(store);
  postRemote("/social/game-invites/respond", { inviteId, accept }).then(() => syncSocialStateRemote());
  return invite;
}

export function getGroups() {
  return readStore().groups;
}

export function getCurrentGroupForUser(userId?: string) {
  if (!userId) return null;
  return readStore().groups.find((group) => group.members.includes(userId)) || null;
}

export function leaveCurrentGroup(userId?: string) {
  if (!userId) return null;
  const store = readStore();
  const current = store.groups.find((group) => group.members.includes(userId));
  if (!current) return null;
  removeUserFromGroups(store, userId);
  persistStore(store);
  return current.id;
}

export async function getGroupsRemote() {
  const data = await fetchRemoteJson<{ groups?: GroupEntry[] }>(`${API_SERVER_URL}/groups`, {
    method: "GET",
  });
  if (Array.isArray(data?.groups)) {
    const store = readStore();
    store.groups = data.groups.map((group) => normalizeGroup(group as any));
    persistStore(store);
    return store.groups;
  }
  return getGroups();
}

export function createGroup(group: Omit<GroupEntry, "id" | "code" | "members" | "pendingRequests" | "createdAt">) {
  const store = readStore();
  removeUserFromGroups(store, group.creatorId);
  const id = `group-${Date.now()}`;
  store.groups.unshift(
    normalizeGroup({
      ...group,
      id,
      code: generateUniqueGroupCode(store.groups, id),
      members: [group.creatorId],
      pendingRequests: [],
      createdAt: new Date().toISOString(),
    }),
  );
  persistStore(store);
}

export async function createGroupRemote(group: Omit<GroupEntry, "id" | "code" | "members" | "pendingRequests" | "createdAt">) {
  const data = await fetchRemoteJson<{ groups?: GroupEntry[]; group?: GroupEntry }>(`${API_SERVER_URL}/groups`, {
    method: "POST",
    body: JSON.stringify(group),
  });
  if (Array.isArray(data?.groups)) {
    const store = readStore();
    store.groups = data.groups.map((entry) => normalizeGroup(entry as any));
    persistStore(store);
  }
  return data?.group ? normalizeGroup(data.group as any) : null;
}

export function updateGroup(groupId: string, actorId: string, updates: Partial<Pick<GroupEntry, "name" | "description" | "flag" | "minScore" | "visibility">>) {
  const store = readStore();
  const group = store.groups.find((entry) => entry.id === groupId);
  if (!group || group.creatorId !== actorId) return null;

  Object.assign(group, {
    name: typeof updates.name === "string" && updates.name.trim() ? updates.name.trim() : group.name,
    description: typeof updates.description === "string" ? updates.description.trim() : group.description,
    flag: typeof updates.flag === "string" && updates.flag ? updates.flag : group.flag,
    minScore: updates.minScore !== undefined ? Number(updates.minScore) || 0 : group.minScore,
    visibility:
      updates.visibility === "private" || updates.visibility === "closed" || updates.visibility === "public"
        ? updates.visibility
        : group.visibility,
  });

  persistStore(store);
  return group;
}

export async function updateGroupRemote(
  groupId: string,
  actorId: string,
  updates: Partial<Pick<GroupEntry, "name" | "description" | "flag" | "minScore" | "visibility">>,
) {
  const data = await fetchRemoteJson<{ ok?: boolean; groups?: GroupEntry[]; group?: GroupEntry }>(`${API_SERVER_URL}/groups/update`, {
    method: "POST",
    body: JSON.stringify({ groupId, actorId, updates }),
  });

  if (Array.isArray(data?.groups)) {
    const store = readStore();
    store.groups = data.groups.map((group) => normalizeGroup(group as any));
    persistStore(store);
  }

  return data?.group ? normalizeGroup(data.group as any) : updateGroup(groupId, actorId, updates);
}

export function requestJoinGroup(groupId: string, userId: string): GroupJoinResult {
  const store = readStore();
  const group = store.groups.find((entry) => entry.id === groupId);
  if (!group) return "group-not-found";
  if (group.members.includes(userId) || group.pendingRequests.includes(userId)) return "already-member";
  if (group.visibility === "closed") return "group-closed";

  if (group.visibility === "public") {
    removeUserFromGroups(store, userId);
    const freshGroup = store.groups.find((entry) => entry.id === groupId);
    if (!freshGroup) return "group-not-found";
    freshGroup.members = Array.from(new Set([...freshGroup.members, userId]));
    persistStore(store);
    return "joined";
  }

  group.pendingRequests.push(userId);
  persistStore(store);
  return "requested";
}

export async function requestJoinGroupRemote(groupId: string, userId: string) {
  const data = await fetchRemoteJson<{ ok?: boolean; status?: GroupJoinResult; groups?: GroupEntry[] }>(`${API_SERVER_URL}/groups/request`, {
    method: "POST",
    body: JSON.stringify({ groupId, userId }),
  });
  if (Array.isArray(data?.groups)) {
    const store = readStore();
    store.groups = data.groups.map((group) => normalizeGroup(group as any));
    persistStore(store);
  } else {
    await getGroupsRemote();
  }
  return data?.status || requestJoinGroup(groupId, userId);
}

export async function leaveCurrentGroupRemote(userId?: string) {
  if (!userId) return null;
  const data = await fetchRemoteJson<{ ok?: boolean; groups?: GroupEntry[]; groupId?: string }>(`${API_SERVER_URL}/groups/leave`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  if (Array.isArray(data?.groups)) {
    const store = readStore();
    store.groups = data.groups.map((group) => normalizeGroup(group as any));
    persistStore(store);
    return data.groupId || null;
  }
  return leaveCurrentGroup(userId);
}

export function getGroupRequestsForCreator(userId: string): GroupJoinRequestSummary[] {
  return readStore().groups.flatMap((group) => {
    if (group.creatorId !== userId) return [];
    return group.pendingRequests.map((requesterId) => ({
      groupId: group.id,
      groupName: group.name,
      requesterId,
    }));
  });
}

export function respondToGroupRequest(groupId: string, requesterId: string, accept: boolean) {
  const store = readStore();
  const group = store.groups.find((entry) => entry.id === groupId);
  if (!group) return;

  group.pendingRequests = group.pendingRequests.filter((id) => id !== requesterId);
  if (accept) {
    removeUserFromGroups(store, requesterId);
    const freshGroup = store.groups.find((entry) => entry.id === groupId);
    if (freshGroup) {
      freshGroup.members = Array.from(new Set([...freshGroup.members, requesterId]));
    }
  }

  persistStore(store);
}

export async function respondToGroupRequestRemote(groupId: string, requesterId: string, accept: boolean) {
  const data = await fetchRemoteJson<{ ok?: boolean; groups?: GroupEntry[] }>(`${API_SERVER_URL}/groups/respond`, {
    method: "POST",
    body: JSON.stringify({ groupId, userId: requesterId, accept }),
  });
  if (Array.isArray(data?.groups)) {
    const store = readStore();
    store.groups = data.groups.map((group) => normalizeGroup(group as any));
    persistStore(store);
  } else {
    await getGroupsRemote();
  }
  return Boolean(data?.ok);
}

export async function removeGroupMemberRemote(groupId: string, memberId: string, actorId: string) {
  const data = await fetchRemoteJson<{ ok?: boolean; groups?: GroupEntry[] }>(`${API_SERVER_URL}/groups/remove-member`, {
    method: "POST",
    body: JSON.stringify({ groupId, memberId, actorId }),
  });
  if (Array.isArray(data?.groups)) {
    const store = readStore();
    store.groups = data.groups.map((group) => normalizeGroup(group as any));
    persistStore(store);
  } else {
    await getGroupsRemote();
  }
  return Boolean(data?.ok);
}

export function getGroupScore(group: GroupEntry) {
  return group.members.reduce((sum, memberId) => {
    try {
      const raw = localStorage.getItem(`splendor-progress:${memberId}`);
      const parsed = raw ? JSON.parse(raw) : null;
      return sum + (Number(parsed?.points) || 0);
    } catch {
      return sum;
    }
  }, 0);
}

export function getRankedGroups(groups: GroupEntry[] = getGroups()) {
  return [...groups].sort((a, b) => getGroupScore(b) - getGroupScore(a));
}

export function getGroupMembersInfo(groupId: string): GroupMemberInfo[] {
  const group = getGroups().find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.members.map((memberId) => {
    const user = getRegisteredUsers().find((entry: any) => entry.id === memberId);
    let score = 0;
    try {
      const raw = localStorage.getItem(`splendor-progress:${memberId}`);
      const parsed = raw ? JSON.parse(raw) : null;
      score = Number(parsed?.points) || 0;
    } catch {
      score = 0;
    }
    return {
      id: memberId,
      username: user?.username || "Unknown",
      score,
    };
  });
}

export function getRankedPlayers(): RankedPlayerInfo[] {
  return getRegisteredUsers()
    .map((user: any) => {
      const progress = readProgress(user.id);
      const extras = readPlayerExtras(user.id);
      return {
        id: user.id,
        username: user.username || "Unknown",
        email: user.email,
        createdAt: user.createdAt,
        score: Number(progress.points) || 0,
        level: getLevelFromXp(progress.xp),
        coins: Number(progress.coins) || 0,
        gems: Number(extras.gems) || 0,
        userCode: getUserCode(user.id),
      };
    })
    .sort((a, b) => b.score - a.score || b.level - a.level || a.username.localeCompare(b.username));
}

export function getGroupMessages(groupId: string) {
  return readStore().groupMessages.filter((message) => message.groupId === groupId);
}

export function sendGroupMessage(groupId: string, senderId: string, text: string) {
  const store = readStore();
  store.groupMessages.push({
    id: `${Date.now()}-${senderId}-${groupId}`,
    groupId,
    senderId,
    text,
    createdAt: new Date().toISOString(),
  });
  const otherGroups = store.groupMessages.filter((message) => message.groupId !== groupId);
  const latestGroupMessages = store.groupMessages
    .filter((message) => message.groupId === groupId)
    .slice(-MAX_SAVED_MESSAGES);
  store.groupMessages = [...otherGroups, ...latestGroupMessages];
  persistStore(store);
  postRemote("/social/group-messages", { groupId, senderId, text }).then(() => syncSocialStateRemote());
}

export function syncSelectedAvatar(userId: string | undefined, selectedAvatar: string) {
  if (!userId) return;
  updateLocalUserProfile(userId, { selectedAvatar });
  const user = getRegisteredUsers().find((entry: any) => entry.id === userId);
  if (!user) return;
  postRemote("/users", { ...user, selectedAvatar });
}
