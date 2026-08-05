import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: number;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
  photoURL?: string | null;
  photoUrl?: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;

  isAuthenticated: () => boolean;
  getAuthHeader: () => { Authorization: string } | Record<string, never>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isLoading: false,
          error: null,
        });
      },

      isAuthenticated: () => {
        return Boolean(get().accessToken && get().user);
      },

      getAuthHeader: () => {
        const token = get().accessToken;
        if (!token) return {} as Record<string, never>;
        return {
          Authorization: `Bearer ${token}`,
        };
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

export const authStorageHelper = {
  getAccessToken: () => useAuthStore.getState().accessToken,

  getUser: () => useAuthStore.getState().user,

  setAccessToken: (token: string | null) => {
    useAuthStore.getState().setAccessToken(token);
  },

  setUser: (user: User | null) => {
    useAuthStore.getState().setUser(user);
  },

  clearAll: () => {
    useAuthStore.getState().clearAuth();
  },
};
