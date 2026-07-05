import { buildPrivatePageMetadata } from "@/lib/metadata";
import DashboardPage from "@/features/instructor/components/dashboard/DashboardPage";

export const metadata = buildPrivatePageMetadata(
  "Tổng quan giảng viên",
  "Theo dõi hiệu quả giảng dạy, khóa học và hoạt động học viên.",
);

export default function Page() {
  return <DashboardPage />;
}
