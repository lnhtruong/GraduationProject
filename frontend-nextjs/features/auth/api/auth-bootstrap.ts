import { useAuthStore } from "@/store/auth";
import {
  buildUserFromToken,
  clearAuthSession,
  decodeJwt,
  syncAuthSession,
} from "@/lib/auth-session";
import { authClient } from "./auth-client";
import type { RefreshTokenResponse } from "../types";

export async function initializeAuth() {
  const state = useAuthStore.getState();
  const { accessToken, user } = state;

  const now = Math.floor(Date.now() / 1000);
  const decoded = accessToken ? decodeJwt(accessToken) : {};
  const exp = typeof decoded.exp === "number" ? decoded.exp : 0;
  const isTokenExpired = !accessToken || exp <= now + 10;

  try {
    if (!isTokenExpired) {
      if (!user) {
        const parsedUser = buildUserFromToken(accessToken);
        if (parsedUser) {
          state.setUser(parsedUser);
        }
      }
      return;
    }

    const { data: response } = await authClient.post<RefreshTokenResponse>(
      "/refresh",
      undefined,
    );

    if (response.accessToken) {
      syncAuthSession({ accessToken: response.accessToken });
    }
  } catch {
    clearAuthSession();
  }
}
