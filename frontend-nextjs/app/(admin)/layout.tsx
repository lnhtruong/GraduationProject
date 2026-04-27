import { Header } from "@/components/Header";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
