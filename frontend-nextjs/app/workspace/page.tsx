import { ProtectedRoute } from "@/components/ProtectedRoute";
import Workspace from "@/features/workspace";

export default function WorkspacePage() {
	return (
		<ProtectedRoute>
			<Workspace />
		</ProtectedRoute>
	);
}

