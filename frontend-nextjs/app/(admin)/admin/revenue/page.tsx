import { buildPrivatePageMetadata } from "@/lib/metadata";
import AdminRevenuePage from "@/features/admin/components/revenue/AdminRevenuePage";

export const metadata = buildPrivatePageMetadata(
  "Doanh thu",
  "Theo dõi doanh thu, giao dịch và hiệu quả kinh doanh của StudyLoop.",
);

export default function Page() {
  return <AdminRevenuePage />;
}
