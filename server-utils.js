function generateGroupCode(seed = Date.now().toString(36)) {
  const base = `${seed}${Math.random().toString(36).slice(2, 8)}`
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  return `GRP-${base.slice(0, 6).padEnd(6, "X")}`;
}

export function generateUniqueGroupCode(groups, seed = Date.now().toString(36)) {
  let nextCode = generateGroupCode(seed);
  while (groups.some((group) => group.code === nextCode)) {
    nextCode = generateGroupCode(`${seed}${Math.random().toString(36).slice(2, 6)}`);
  }
  return nextCode;
}

export function normalizeTurnTimeSeconds(value) {
  return value === 15 || value === 30 || value === 45 || value === 60 ? value : 45;
}

export function normalizePlayerCount(value) {
  return Math.max(2, Math.min(4, Number(value) || 2));
}

export function normalizeHumanPlayers(value, playerCount) {
  return Math.max(1, Math.min(playerCount, Number(value) || playerCount));
}

export function normalizeGroup(entry) {
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

export function removeUserFromGroups(groups, userId) {
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
