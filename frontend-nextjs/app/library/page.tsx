import { ProtectedRoute } from "@/components/ProtectedRoute";
import LibraryFeature from "@/features/library";

export default function LibraryPage() {
	return (
		<ProtectedRoute>
			<LibraryFeature />
		</ProtectedRoute>
	);
}
