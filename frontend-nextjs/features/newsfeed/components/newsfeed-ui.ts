import { BookOpenCheck, Bookmark, Compass, UserCircle2 } from "lucide-react";

export const MENU_ITEMS = [
	{ id: "for-you", label: "Dành cho bạn", icon: Compass },
	{ id: "my-courses", label: "Khóa học của tôi", icon: BookOpenCheck },
	{ id: "saved", label: "Đã lưu", icon: Bookmark },
	{ id: "profile", label: "Hồ sơ", icon: UserCircle2 },
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
