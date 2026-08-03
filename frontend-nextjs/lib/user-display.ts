import type { User } from "@/store/auth";

type DisplayUser = Partial<
  Pick<User, "firstName" | "lastName" | "email" | "avatarUrl" | "avatar_url" | "picture">
> | null | undefined;

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEmailLocalPart(email: unknown) {
  const normalizedEmail = readText(email);
  return normalizedEmail?.split("@", 1)[0] || null;
}

export function getUserDisplayName(user: DisplayUser, fallback = "Người dùng") {
  const firstName = readText(user?.firstName);
  const lastName = readText(user?.lastName);
  const fullName = [lastName, firstName].filter(Boolean).join(" ").trim();
  return fullName || firstName || getEmailLocalPart(user?.email) || fallback;
}

export function getUserInitials(user: DisplayUser, fallback = "U") {
  const firstName = readText(user?.firstName);
  const lastName = readText(user?.lastName);

  if (firstName && lastName) {
    return `${lastName[0]}${firstName[0]}`.toUpperCase();
  }

  const displaySource = lastName ?? firstName ?? getEmailLocalPart(user?.email) ?? fallback;
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
