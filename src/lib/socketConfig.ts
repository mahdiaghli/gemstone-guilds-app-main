import { isNativeApp } from "@/lib/nativeApp";

function cleanEnvUrl(raw: string | undefined) {
  if (!raw) return "";
  return raw.split("#")[0].trim().replace(/\/$/, "");
}

const envUrl = cleanEnvUrl(import.meta.env.VITE_SOCKET_URL);

export const SOCKET_SERVER_URL =
  envUrl ||
  (typeof window !== "undefined" && !isNativeApp()
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

export const API_SERVER_URL = SOCKET_SERVER_URL;
