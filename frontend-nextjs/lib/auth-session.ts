import { useAuthStore, authStorageHelper, type User } from "@/store/auth";

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function mergeUserProfile(user: User): User {
  const normalizedUser = normalizeAuthUser(user);
  const currentUser = useAuthStore.getState().user;
  if (!currentUser || currentUser.id !== normalizedUser.id) {
    return normalizedUser;
  }

  return {
    ...normalizedUser,
    firstName: normalizedUser.firstName ?? currentUser.firstName ?? null,
    lastName: normalizedUser.lastName ?? currentUser.lastName ?? null,
    avatarUrl: normalizedUser.avatarUrl ?? currentUser.avatarUrl ?? null,
  };
}

export function normalizeAuthUser(raw: unknown): User {
  const source = (raw ?? {}) as Record<string, unknown>;

  return {
    id: Number(source.id ?? source.userId ?? source.user_id ?? 0),
    email: typeof source.email === "string" ? source.email : "",
    role: Number(source.role ?? 0),
    firstName:
      readNullableString(source.firstName) ??
      readNullableString(source.first_name),
    lastName:
      readNullableString(source.lastName) ??
      readNullableString(source.last_name),
    avatarUrl:
      readNullableString(source.avatarUrl) ??
      readNullableString(source.avatar_url) ??
      readNullableString(source.picture) ??
      readNullableString(source.photoURL) ??
      readNullableString(source.photoUrl),
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
    avatarUrl:
      readNullableString(payload.avatarUrl) ??
      readNullableString(payload.avatar_url) ??
      readNullableString(payload.picture),
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
