import { randomInt } from "crypto";

const TEMPLATE_BODY_ID = Number(process.env.MELIPAYAMAK_OTP_BODY_ID || 524);

function dedicatedOtpUrl() {
  const raw = process.env.MELIPAYAMAK_OTP_URL?.trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("MELIPAYAMAK_OTP_URL is invalid.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "console.melipayamak.com" ||
    !/^\/api\/send\/otp\/[^/]+\/?$/.test(url.pathname) ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error("MELIPAYAMAK_OTP_URL must be a MeliPayamak dedicated OTP endpoint.");
  }
  return url.toString();
}

function sharedServiceUrl() {
  const token = process.env.MELIPAYAMAK_TOKEN?.trim();
  if (!token) {
    throw new Error("Configure MELIPAYAMAK_OTP_URL or MELIPAYAMAK_TOKEN for OTP delivery.");
  }
  return `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(token)}`;
}

export function allowDevOtp() {
  return process.env.ALLOW_DEV_OTP === "1" && process.env.NODE_ENV !== "production";
}

export async function sendOtpSms(phone) {
  const dedicatedUrl = dedicatedOtpUrl();
  const code = dedicatedUrl ? null : String(randomInt(0, 1_000_000)).padStart(6, "0");
  const url = dedicatedUrl ?? sharedServiceUrl();
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        dedicatedUrl
          ? { to: phone }
          : { to: phone, bodyId: TEMPLATE_BODY_ID, args: [code] },
      ),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
  } catch {
    throw new Error("ارتباط با سرویس پیامک ملی‌پیامک برقرار نشد.");
  }

  const result = await response.json().catch(() => null);
  const deliveredCode = dedicatedUrl ? String(result?.code ?? "").trim() : code;
  if (!response.ok || (dedicatedUrl ? !/^\d{6}$/.test(deliveredCode) : !result?.recId)) {
    console.error("[sms] MeliPayamak rejected the OTP request.", {
      httpStatus: response.status,
    });
    throw new Error("ارسال کد تأیید از طریق ملی‌پیامک ناموفق بود.");
  }

  return deliveredCode;
}
