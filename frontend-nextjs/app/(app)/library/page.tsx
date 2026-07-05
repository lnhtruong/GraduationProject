import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LibraryFeature from "@/features/library";

export const metadata: Metadata = {
	title: "Thư viện",
	description: "Quản lý và học tập các khóa học bạn đã đăng ký, lưu trữ hoặc yêu thích.",
};

export default function LibraryPage() {
	return (
		<ProtectedRoute>
			<LibraryFeature />
		</ProtectedRoute>
	);
}
