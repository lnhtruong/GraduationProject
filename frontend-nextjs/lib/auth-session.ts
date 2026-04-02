import { useAuthStore, authStorageHelper, type User } from "@/store/auth";

export function decodeJwt(token: string): {
  exp?: number;
  [key: string]: unknown;
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return {};
  }
}

export function buildUserFromToken(token: string): User | null {
  const payload = decodeJwt(token);
  const userId = payload.userId;
  const email = payload.email;
  const role = payload.role;

  if (
    typeof userId !== "number" ||
    typeof email !== "string" ||
    typeof role !== "number"
  ) {
    return null;
  }

  return {
    id: userId,
    email,
    role,
    firstName: null,
    lastName: null,
  };
}

export function syncAuthSession(options: {
  accessToken: string;
  user?: User | null;
}) {
  const { accessToken, user } = options;

  authStorageHelper.setAccessToken(accessToken);

  if (user) {
    authStorageHelper.setUser(user);
    return;
  }

  const parsedUser = buildUserFromToken(accessToken);
  if (parsedUser) {
    authStorageHelper.setUser(parsedUser);
  }
}

export function clearAuthSession() {
  authStorageHelper.clearAll();
}

export const authSession = {
  isAuthenticated: () => useAuthStore.getState().isAuthenticated(),
  getCurrentUser: () => useAuthStore.getState().user,
  getAccessToken: () => useAuthStore.getState().accessToken,
};
