import { isNativeApp } from "@/lib/nativeApp";

function cleanEnvUrl(raw: string | undefined) {
  if (!raw) return "";
  return raw.split("#")[0].trim().replace(/\/$/, "");
}

const envUrl = cleanEnvUrl(import.meta.env.VITE_SOCKET_URL);

function isLocalNetworkHost(hostname: string) {
  if (hostname === "localhost" || hostname === "::1" || hostname.startsWith("127.")) {
    return true;
  }
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d+)\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

function getBrowserServerUrl() {
  if (typeof window === "undefined" || isNativeApp()) return "";
  return `${window.location.protocol}//${window.location.hostname}:3001`;
}

function shouldFollowBrowserHost(configuredUrl: string) {
  if (!configuredUrl || typeof window === "undefined" || isNativeApp()) return false;
  try {
    const configuredHost = new URL(configuredUrl).hostname;
    return isLocalNetworkHost(configuredHost) && isLocalNetworkHost(window.location.hostname);
  } catch {
    return false;
  }
}

const browserServerUrl = getBrowserServerUrl();

// During local development, follow the host that actually served the app. This
// keeps authentication working when a laptop's DHCP address changes.
export const SOCKET_SERVER_URL =
  (shouldFollowBrowserHost(envUrl) ? browserServerUrl : envUrl) ||
  browserServerUrl ||
  "http://localhost:3001";

export const API_SERVER_URL = SOCKET_SERVER_URL;
