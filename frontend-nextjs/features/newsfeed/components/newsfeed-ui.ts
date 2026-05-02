import { BookOpenCheck, Bookmark, Compass, UserCircle2 } from "lucide-react";

export const SIDEBAR_ITEMS = [
	{ id: "home", label: "Trang chủ", icon: Compass, href: "/" },
	{ id: "subscriptions", label: "Kênh đã đăng ký", icon: BookOpenCheck, href: "/courses" },
	{ id: "library", label: "Thư viện", icon: Bookmark, href: "/library" },
	{ id: "history", label: "Lịch sử", icon: UserCircle2, href: "/history" },
	{ id: "saved", label: "Đã lưu", icon: Bookmark, href: "/saved" },
	{ id: "settings", label: "Cài đặt", icon: UserCircle2, href: "/settings" },
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
