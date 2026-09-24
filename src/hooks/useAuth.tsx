import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { API_SERVER_URL } from "@/lib/socketConfig";
import { toPublicUser, type PublicUser } from "@/lib/userPublic";
import {
  clearSession,
  readSessionToken,
  saveSession,
  USER_STORAGE_KEY,
} from "@/lib/authStorage";

type User = PublicUser;
type AuthFailureReason =
  | "invalid_credentials"
  | "username_exists"
  | "invalid_input"
  | "server_unavailable";
type AuthResult = { ok: true } | { ok: false; reason: AuthFailureReason };

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  register: (username: string, email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  updateProfile: (updates: { username: string; email?: string }) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const MAX_USERNAME_LENGTH = 15;
const AUTH_REQUEST_TIMEOUT_MS = 4_000;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

const isUsernameValid = (username: string) =>
  username.trim().length > 0 && username.trim().length <= MAX_USERNAME_LENGTH;

async function authRequest(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = readSessionToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_SERVER_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const token = readSessionToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { ok, data } = await authRequest("/auth/me");
        if (ok && data?.user) {
          setUser(toPublicUser(data.user));
        } else {
          clearSession();
          setUser(null);
        }
      } catch {
        const saved =
          localStorage.getItem(USER_STORAGE_KEY) ||
          sessionStorage.getItem(USER_STORAGE_KEY);
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            clearSession();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = async (
    username: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const { ok, status, data } = await authRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (!ok || !data?.token || !data?.user) {
        return {
          ok: false,
          reason: status === 401 ? "invalid_credentials" : "server_unavailable",
        };
      }
      const sessionUser = toPublicUser(data.user);
      setUser(sessionUser);
      saveSession(data.token, sessionUser, rememberMe);
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, reason: "server_unavailable" };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      if (!isUsernameValid(username) || !password) {
        return { ok: false, reason: "invalid_input" };
      }
      const { ok, status, data } = await authRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), email, password }),
      });
      if (!ok || !data?.token || !data?.user) {
        return {
          ok: false,
          reason: status === 409 ? "username_exists" : status === 400 ? "invalid_input" : "server_unavailable",
        };
      }
      const sessionUser = toPublicUser(data.user);
      setUser(sessionUser);
      saveSession(data.token, sessionUser, rememberMe);
      localStorage.setItem("splendor-needs-tutorial", "true");
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, reason: "server_unavailable" };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: {
    username: string;
    email?: string;
  }): Promise<boolean> => {
    if (!user) return false;
    try {
      if (!isUsernameValid(updates.username)) return false;
      const { ok, data } = await authRequest("/users", {
        method: "POST",
        body: JSON.stringify({
          username: updates.username,
          email: updates.email || "",
        }),
      });
      if (!ok || !data?.user) return false;
      const nextUser = toPublicUser(data.user);
      setUser(nextUser);
      saveSession(readSessionToken(), nextUser, localStorage.getItem("splendor-remember-me") === "true");
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = () => {
    authRequest("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
