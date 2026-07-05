import { buildPrivatePageMetadata } from "@/lib/metadata";
import AdminUsersPage from "@/features/admin/components/users/AdminUsersPage";

export const metadata = buildPrivatePageMetadata(
  "Quản lý người dùng",
  "Quản trị tài khoản, vai trò và trạng thái người dùng trong hệ thống LearnHub.",
);

export default function Page() {
  return <AdminUsersPage />;
}
