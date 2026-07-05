import { buildPrivatePageMetadata } from "@/lib/metadata";
import AdminDashboardPage from "@/features/admin/components/dashboard/AdminDashboardPage";

export const metadata = buildPrivatePageMetadata(
  "Bảng điều khiển quản trị",
  "Theo dõi số liệu vận hành và trạng thái hệ thống LearnHub.",
);

export default function Page() {
  return <AdminDashboardPage />;
}
