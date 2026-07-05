import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Không gian làm việc",
  "Quản lý nội dung học tập và tài nguyên cá nhân trong LearnHub.",
);

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Workspace from "@/features/workspace";

export default function WorkspacePage() {
	return (
		<ProtectedRoute>
			<Workspace />
		</ProtectedRoute>
	);
}

