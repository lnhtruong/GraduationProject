import type { User } from "@/store/auth";

type DisplayUser = Partial<
  Pick<User, "firstName" | "lastName" | "email" | "avatarUrl" | "avatar_url" | "picture">
> | null | undefined;

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getUserDisplayName(user: DisplayUser, fallback = "Người dùng") {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return fullName || readText(user?.firstName) || readText(user?.email) || fallback;
}

export function getUserInitials(user: DisplayUser, fallback = "U") {
  const firstName = readText(user?.firstName);
  const lastName = readText(user?.lastName);

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  const displaySource = firstName ?? readText(user?.email) ?? fallback;
  return displaySource.slice(0, 2).toUpperCase();
}

export function getUserAvatarUrl(user: DisplayUser) {
  return (
    readText(user?.avatarUrl) ??
    readText(user?.avatar_url) ??
    readText(user?.picture) ??
    undefined
  );
}
