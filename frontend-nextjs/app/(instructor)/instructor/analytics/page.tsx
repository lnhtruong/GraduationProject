import { buildPrivatePageMetadata } from "@/lib/metadata";
import AnalyticsPage from "@/features/instructor/components/analytics/AnalyticsPage";

export const metadata = buildPrivatePageMetadata(
  "Phân tích giảng viên",
  "Phân tích hiệu suất nội dung, lượt xem và tương tác học tập.",
);

export default function Page() {
  return <AnalyticsPage />;
}
