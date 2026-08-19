import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logout as logoutApi, loginWithEmailPassword, registerWithEmailPassword } from "../services/auth.api";
import { setUnauthorizedHandler } from "../services/api";
import type { User } from "../types/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getMe();
      setUser(response.user);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      clearAuth();
      navigate("/login", { replace: true });
    }
  }, [clearAuth, navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth();
      navigate("/login", { replace: true });
    });
  }, [clearAuth, navigate]);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const response = await getMe();
        if (mounted) {
          setUser(response.user);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginWithEmailPassword(email, password);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await registerWithEmailPassword(name, email, password);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      logout,
      refreshUser,
      login,
      register,
    }),
    [user, isLoading, logout, refreshUser, login, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
