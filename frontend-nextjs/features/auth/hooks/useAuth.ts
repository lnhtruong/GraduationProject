import { useAuthStore } from "@/store/auth";
import { authSession } from "@/lib/auth-session";
import { authApi } from "@/features/auth/api/auth.api";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  return {
    user,
    accessToken,
    isLoading,
    error,
    isAuthenticated,
    login: authApi.login,
    register: authApi.register,
    logout: authApi.logout,
    validateToken: authApi.validateToken,
    getAccessToken: authSession.getAccessToken,
  };
}

export function useAuthState() {
  return {
    user: useAuthStore((state) => state.user),
    accessToken: useAuthStore((state) => state.accessToken),
    isAuthenticated: useAuthStore((state) => state.isAuthenticated()),
    isLoading: useAuthStore((state) => state.isLoading),
  };
}

export function useAuthActions() {
  return {
    setUser: useAuthStore((state) => state.setUser),
    setAccessToken: useAuthStore((state) => state.setAccessToken),
    clearAuth: useAuthStore((state) => state.clearAuth),
    logout: authApi.logout,
    setLoading: useAuthStore((state) => state.setLoading),
    setError: useAuthStore((state) => state.setError),
  };
}
