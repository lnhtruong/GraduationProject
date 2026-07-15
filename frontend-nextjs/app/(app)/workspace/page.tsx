import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Không gian làm việc",
  "Quản lý nội dung học tập và tài nguyên cá nhân trong StudyLoop.",
);

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Workspace from "@/features/workspace";

export default function WorkspacePage() {
	return (
		<ProtectedRoute
			title="Workspace của bạn"
			description="Đăng nhập để quản lý dự án, bản nháp và video đã hoàn thành."
		>
			<Workspace />
		</ProtectedRoute>
	);
}

