"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useLogin,
  useRegister,
  useLogout,
} from "@/features/auth/api//auth.hooks";
import { tokenManager } from "@/lib/http";
import type {
  User,
  LoginRequest,
  RegisterRequest,
} from "@/features/auth/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // TanStack Query mutations
  const loginMutation = useLogin({
    onSuccess: (data) => {
      setUser(data.user);

      // Check if there's a return URL
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");
      router.push(returnUrl || "/");
    },
    onError: (error) => {
      // Don't redirect on error, let form handle it
      console.error("Login failed:", error.message);
    },
  });

  const registerMutation = useRegister({});

  const logoutMutation = useLogout({
    onSuccess: () => {
      setUser(null);
      router.push("/signin");
    },
    onError: () => {
      // Clear local state even if API fails
      tokenManager.clearAll();
      setUser(null);
      router.push("/signin");
    },
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const storedUser = tokenManager.getUser();
      const token = tokenManager.getAccessToken();

      if (storedUser && token) {
        setUser(storedUser);
        // Token refresh handled automatically by axios interceptor
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (data: LoginRequest) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterRequest) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const refreshUser = () => {
    const storedUser = tokenManager.getUser();
    setUser(storedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
