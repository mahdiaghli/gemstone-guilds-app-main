import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { allowDevOtp, sendOtpSms } from "./sms.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const pendingOtps = new Map();

function toEnglishDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizePhone(raw) {
  const digits = toEnglishDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("0098") && digits.length === 14) return `0${digits.slice(4)}`;
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("9")) return `0${digits}`;
  return digits;
}

export function isIranianMobile(phone) {
  return /^09\d{9}$/.test(phone);
}

function hashOtp(code, salt) {
  return scryptSync(code, salt, 32).toString("hex");
}

function otpMatches(code, entry) {
  const candidate = Buffer.from(hashOtp(code, entry.salt), "hex");
  const expected = Buffer.from(entry.codeHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function requestPhoneOtp(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!isIranianMobile(phone)) {
    return { ok: false, status: 400, error: "شماره موبایل معتبر نیست." };
  }

  const existing = pendingOtps.get(phone);
  const now = Date.now();
  if (existing && existing.requestedAt + OTP_RESEND_COOLDOWN_MS > now) {
    return {
      ok: true,
      phone,
      retryAfterSeconds: Math.ceil(
        (existing.requestedAt + OTP_RESEND_COOLDOWN_MS - now) / 1000,
      ),
    };
  }

  const reservationId = randomBytes(16).toString("hex");
  pendingOtps.set(phone, {
    reservationId,
    requestedAt: now,
    expiresAt: 0,
    attempts: 0,
    salt: "",
    codeHash: "",
  });

  try {
    const devCode = allowDevOtp()
      ? String(randomInt(0, 1_000_000)).padStart(6, "0")
      : undefined;
    const code = devCode ?? (await sendOtpSms(phone));
    const current = pendingOtps.get(phone);
    if (!current || current.reservationId !== reservationId) {
      return { ok: false, status: 409, error: "درخواست جدیدتری ثبت شده است." };
    }
    const salt = randomBytes(16).toString("hex");
    pendingOtps.set(phone, {
      ...current,
      salt,
      codeHash: hashOtp(code, salt),
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    return { ok: true, phone, retryAfterSeconds: 60, devCode };
  } catch (error) {
    if (pendingOtps.get(phone)?.reservationId === reservationId) pendingOtps.delete(phone);
    return {
      ok: false,
      status: 503,
      error: error instanceof Error ? error.message : "ارسال کد انجام نشد.",
    };
  }
}

export function consumePhoneOtp(rawPhone, rawCode) {
  const phone = normalizePhone(rawPhone);
  const code = toEnglishDigits(rawCode).replace(/\D/g, "");
  const entry = pendingOtps.get(phone);
  if (
    !entry ||
    !/^\d{6}$/.test(code) ||
    entry.expiresAt <= Date.now() ||
    entry.attempts >= OTP_MAX_ATTEMPTS ||
    !entry.salt ||
    !entry.codeHash
  ) {
    return false;
  }

  if (!otpMatches(code, entry)) {
    entry.attempts += 1;
    if (entry.attempts >= OTP_MAX_ATTEMPTS) entry.expiresAt = 0;
    pendingOtps.set(phone, entry);
    return false;
  }

  pendingOtps.delete(phone);
  return true;
}
