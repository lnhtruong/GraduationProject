import { buildPrivatePageMetadata } from "@/lib/metadata";
import AdminLecturerRequestsPage from "@/features/lecturer-requests/components/admin/AdminLecturerRequestsPage";

export const metadata = buildPrivatePageMetadata(
  "Yêu cầu giảng viên",
  "Duyệt hồ sơ nâng cấp giảng viên và quản lý quy trình xét duyệt.",
);

export default function Page() {
  return <AdminLecturerRequestsPage />;
}
