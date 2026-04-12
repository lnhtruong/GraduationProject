import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getRoleAccess } from "@/lib/route-access";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={getRoleAccess("instructor")}>
      <div className="min-h-screen bg-muted/30">
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
