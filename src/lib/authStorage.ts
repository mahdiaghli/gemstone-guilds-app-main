export const SESSION_TOKEN_KEY = "splendor_session_token";
export const USER_STORAGE_KEY = "splendor_user";

export function readSessionToken() {
  if (typeof window === "undefined") return "";
  return (
    sessionStorage.getItem(SESSION_TOKEN_KEY) ||
    localStorage.getItem(SESSION_TOKEN_KEY) ||
    ""
  );
}

export function saveSession(token: string, user: unknown, rememberMe: boolean) {
  const payload = JSON.stringify(user);
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(USER_STORAGE_KEY, payload);
  if (rememberMe) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, payload);
    localStorage.setItem("splendor-remember-me", "true");
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.setItem("splendor-remember-me", "false");
  }
}

export function clearSession() {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(SESSION_TOKEN_KEY);
    store.removeItem(USER_STORAGE_KEY);
  }
}
