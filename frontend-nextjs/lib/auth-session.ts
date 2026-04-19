import { useAuthStore, authStorageHelper, type User } from "@/store/auth";

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function mergeUserProfile(user: User): User {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser || currentUser.id !== user.id) {
    return user;
  }

  return {
    ...user,
    firstName: user.firstName ?? currentUser.firstName ?? null,
    lastName: user.lastName ?? currentUser.lastName ?? null,
  };
}

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
    firstName:
      readNullableString(payload.firstName) ??
      readNullableString(payload.first_name),
    lastName:
      readNullableString(payload.lastName) ??
      readNullableString(payload.last_name),
  };
}

export function syncAuthSession(options: {
  accessToken: string;
  user?: User | null;
}) {
  const { accessToken, user } = options;

  authStorageHelper.setAccessToken(accessToken);

  if (user) {
    authStorageHelper.setUser(mergeUserProfile(user));
    return;
  }

  const parsedUser = buildUserFromToken(accessToken);
  if (parsedUser) {
    authStorageHelper.setUser(mergeUserProfile(parsedUser));
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
