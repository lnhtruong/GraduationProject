import { Bookmark, Clock3, Compass } from "lucide-react";

export const SIDEBAR_ITEMS = [
  { id: "top", label: "Nổi bật", icon: Compass, href: "/newsfeed" },
  { id: "history", label: "Lịch sử", icon: Clock3, href: "/newsfeed/history" },
  { id: "saved", label: "Đã lưu", icon: Bookmark, href: "/newsfeed/saved" },
];

export function getInitials(name?: string | null) {
  if (!name) {
    return "KH";
  }

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? "K"}${parts[parts.length - 1][0] ?? "H"}`.toUpperCase();
}
