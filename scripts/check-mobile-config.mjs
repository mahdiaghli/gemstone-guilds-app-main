import { readFileSync } from "node:fs";
import { isIP } from "node:net";

let raw = process.env.VITE_SOCKET_URL?.trim();
if (!raw) {
  try {
    const contents = readFileSync(".env", "utf8");
    const line = contents.split(/\r?\n/).find((entry) => /^\s*VITE_SOCKET_URL\s*=/.test(entry));
    raw = line?.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  } catch {
    // The explicit environment variable below is the preferred release path.
  }
}
if (!raw) throw new Error("Set VITE_SOCKET_URL=https://<public-server-ip-or-domain> when building the mobile app.");
let url;
try {
  url = new URL(raw);
} catch {
  throw new Error(".env.mobile needs a valid VITE_SOCKET_URL.");
}
const host = url.hostname.replace(/^\[|\]$/g, "");
const local = host === "localhost" || host.endsWith(".local") || /^127\./.test(host) ||
  /^10\./.test(host) || /^192\.168\./.test(host) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
  (isIP(host) === 6 && (host === "::1" || /^f[cd]/i.test(host)));
if (url.protocol !== "https:" || local || url.username || url.password || url.search || url.hash) {
  throw new Error("Mobile releases require a public HTTPS server URL without credentials or query parameters.");
}
