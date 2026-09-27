import { afterEach, describe, expect, it } from "vitest";
import {
  consumePhoneOtp,
  isIranianMobile,
  normalizePhone,
  requestPhoneOtp,
} from "../../server/phoneAuth.js";

const previousAllowDevOtp = process.env.ALLOW_DEV_OTP;
const previousNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (previousAllowDevOtp === undefined) delete process.env.ALLOW_DEV_OTP;
  else process.env.ALLOW_DEV_OTP = previousAllowDevOtp;
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
});

describe("phone OTP authentication", () => {
  it("normalizes Iranian mobile formats and Persian digits", () => {
    expect(normalizePhone("+98 912 345 6789")).toBe("09123456789");
    expect(normalizePhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(isIranianMobile("09123456789")).toBe(true);
    expect(isIranianMobile("02112345678")).toBe(false);
  });

  it("accepts a development OTP once and rejects reuse", async () => {
    process.env.ALLOW_DEV_OTP = "1";
    process.env.NODE_ENV = "test";
    const result = await requestPhoneOtp("09120000001");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.devCode).toMatch(/^\d{6}$/);
    expect(consumePhoneOtp(result.phone, result.devCode)).toBe(true);
    expect(consumePhoneOtp(result.phone, result.devCode)).toBe(false);
  });

  it("enforces the resend cooldown", async () => {
    process.env.ALLOW_DEV_OTP = "1";
    process.env.NODE_ENV = "test";
    const first = await requestPhoneOtp("09120000002");
    const second = await requestPhoneOtp("09120000002");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });
});
