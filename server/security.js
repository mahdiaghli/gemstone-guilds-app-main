import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;

export const MAX_BODY_BYTES = 256 * 1024;

export function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(plain), salt, KEYLEN).toString("hex");
  return { salt, hash };
}

export function verifyPassword(plain, salt, hash) {
  if (!plain || !salt || !hash) return false;
  const actual = scryptSync(String(plain), String(salt), KEYLEN);
  const expected = Buffer.from(String(hash), "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function migrateUserRecord(user) {
  if (!user || typeof user !== "object") return user;
  const next = { ...user };
  if (next.password && !next.passwordHash) {
    const { salt, hash } = hashPassword(String(next.password));
    next.salt = salt;
    next.passwordHash = hash;
  }
  delete next.password;
  return next;
}

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}
