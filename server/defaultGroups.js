import { randomInt } from "crypto";

const CODE_SPACE = 36 ** 6;
const DEFAULT_GROUP_COUNT = 10;
const ADJECTIVES = ["سپید", "زرین", "آبی", "سرخ", "سبز", "نقره‌ای", "بنفش", "آتشین", "مهتابی", "زمردین"];
const NOUNS = ["اژدها", "ققنوس", "شیر", "شاهین", "سیمرغ", "پلنگ", "گرگ", "طوفان", "ستاره", "کوهستان"];

export function generateUniqueGroupCode(groups, start = randomInt(CODE_SPACE)) {
  const used = new Set(groups.map((group) => group.code));
  let candidate = Math.abs(Math.trunc(start)) % CODE_SPACE;
  for (let attempts = 0; attempts < CODE_SPACE; attempts += 1) {
    const code = `GRP-${candidate.toString(36).toUpperCase().padStart(6, "0")}`;
    if (!used.has(code)) return code;
    candidate = (candidate + 1) % CODE_SPACE;
  }
  throw new Error("Group code space exhausted");
}

export function ensureDefaultGroups(groups) {
  const allowedDefaultIds = new Set(
    Array.from({ length: DEFAULT_GROUP_COUNT }, (_, index) => `default-group-${String(index + 1).padStart(3, "0")}`),
  );
  // Migrate the old 100-group seed in place. User-created groups are preserved.
  const retainedGroups = groups.filter(
    (group) => !String(group.id || "").startsWith("default-group-") || allowedDefaultIds.has(group.id),
  );
  const existingIds = new Set(retainedGroups.map((group) => group.id));
  const defaults = ADJECTIVES.flatMap((adjective, adjectiveIndex) =>
    NOUNS.map((noun, nounIndex) => {
      const number = adjectiveIndex * NOUNS.length + nounIndex + 1;
      const suffix = String(number).padStart(3, "0");
      return {
        id: `default-group-${suffix}`,
        creatorId: "",
        name: `${adjective} ${noun}`,
        code: `GRP-D${String(number).padStart(5, "0")}`,
        description: "",
        flag: `flag${(number - 1) % 10 + 1}`,
        minScore: 0,
        visibility: "public",
        members: [],
        pendingRequests: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      };
    }),
  ).slice(0, DEFAULT_GROUP_COUNT).filter((group) => !existingIds.has(group.id));
  return defaults.length || retainedGroups.length !== groups.length
    ? [...retainedGroups, ...defaults]
    : groups;
}

export function repairDuplicateGroupCodes(groups) {
  const used = [];
  return groups.map((group) => {
    const code = group.code && !used.some((entry) => entry.code === group.code)
      ? group.code
      : generateUniqueGroupCode(used);
    const repaired = code === group.code ? group : { ...group, code };
    used.push(repaired);
    return repaired;
  });
}
