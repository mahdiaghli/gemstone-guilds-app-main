import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./server-data");
const STATE_FILE = path.join(DATA_DIR, "shared-state.json");

export function ensureStateFile() {
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

export function readSharedState() {
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

export function writeSharedState(state) {
  ensureStateFile();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export function normalizeSocialState(state) {
  return {
    ...state,
    friends: state.friends && typeof state.friends === "object" ? state.friends : {},
    friendRequests: Array.isArray(state.friendRequests) ? state.friendRequests : [],
    messages: Array.isArray(state.messages) ? state.messages : [],
    groupMessages: Array.isArray(state.groupMessages) ? state.groupMessages : [],
    gameInvites: Array.isArray(state.gameInvites) ? state.gameInvites : [],
  };
}

export function trimConversationMessages(messages, participants) {
  const key = [...participants].sort().join(":");
  const rest = messages.filter((message) => message.participants.join(":") !== key);
  const latest = messages
    .filter((message) => message.participants.join(":") === key)
    .slice(-100);
  return [...rest, ...latest];
}

export function trimGroupMessages(messages, groupId) {
  const rest = messages.filter((message) => message.groupId !== groupId);
  const latest = messages
    .filter((message) => message.groupId === groupId)
    .slice(-100);
  return [...rest, ...latest];
}
