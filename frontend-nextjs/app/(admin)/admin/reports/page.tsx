import { buildPrivatePageMetadata } from "@/lib/metadata";
import AdminReportsPage from "@/features/admin/components/reports/AdminReportsPage";

export const metadata = buildPrivatePageMetadata(
  "Báo cáo vi phạm",
  "Xem xét và xử lý các báo cáo nội dung, khóa học và người dùng.",
);

export default function Page() {
  return <AdminReportsPage />;
}
