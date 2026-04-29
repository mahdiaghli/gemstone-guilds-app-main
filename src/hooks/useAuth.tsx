import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { API_SERVER_URL } from "@/lib/socketConfig";

interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  updateProfile: (updates: { username: string; email?: string }) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// فعلاً مقدار پیش‌فرض undefined برای جلوگیری از استفاده خارج از Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // بررسی نشست قبلی
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("splendor_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem("splendor_user");
    } finally {
      setIsLoading(false);
    }

    // دریافت لیست کاربران از سرور (غیر بحرانی)
    fetch(`${API_SERVER_URL}/users`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.users)) {
          localStorage.setItem("splendor_users", JSON.stringify(data.users));
        }
      })
      .catch(() => {});
  }, []);

  // ورود کاربر
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const localUsersRaw = localStorage.getItem("splendor_users");
      const users = localUsersRaw ? JSON.parse(localUsersRaw) : [];

      const foundUser = users.find(
        (u: any) => u.username === username && u.password === password
      );

      if (foundUser) {
        const userSession: User = {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
          createdAt: foundUser.createdAt,
        };
        setUser(userSession);
        localStorage.setItem("splendor_user", JSON.stringify(userSession));
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ثبت‌نام کاربر جدید
  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const localUsersRaw = localStorage.getItem("splendor_users");
      const users = localUsersRaw ? JSON.parse(localUsersRaw) : [];

      if (users.some((u: any) => u.username === username)) {
        // نام کاربری تکراری
        return false;
      }

      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
      };

      const nextUsers = [...users, newUser];
      localStorage.setItem("splendor_users", JSON.stringify(nextUsers));

      // ارسال به سرور برای همگام‌سازی (غیر بحرانی)
      fetch(`${API_SERVER_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      }).catch(() => {});

      // ایجاد نشست و ذخیره
      const userSession: User = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      };
      setUser(userSession);
      localStorage.setItem("splendor_user", JSON.stringify(userSession));
      localStorage.setItem("splendor-needs-tutorial", "true");

      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // به‌روزرسانی پروفایل
  const updateProfile = async (updates: {
    username: string;
    email?: string;
  }): Promise<boolean> => {
    if (!user) return false;

    try {
      const localUsersRaw = localStorage.getItem("splendor_users");
      const users = localUsersRaw ? JSON.parse(localUsersRaw) : [];

      const nameTaken = users.some(
        (u: any) => u.id !== user.id && u.username === updates.username
      );
      if (nameTaken) return false;

      const nextUsers = users.map((u: any) =>
        u.id === user.id
          ? { ...u, username: updates.username, email: updates.email || "" }
          : u
      );
      localStorage.setItem("splendor_users", JSON.stringify(nextUsers));

      const nextUser: User = {
        ...user,
        username: updates.username,
        email: updates.email || "",
      };
      setUser(nextUser);
      localStorage.setItem("splendor_user", JSON.stringify(nextUser));

      fetch(`${API_SERVER_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          nextUsers.find((u: any) => u.id === user.id)
        ),
      }).catch(() => {});

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // خروج از حساب
  const logout = () => {
    setUser(null);
    localStorage.removeItem("splendor_user");
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    updateProfile,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
