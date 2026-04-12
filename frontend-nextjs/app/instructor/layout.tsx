import { InstructorNav } from "@/features/instructor/components/InstructorNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ROLES } from "@/lib/roles";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={[ROLES.LECTURER, ROLES.ADMIN]}>
      <div className="min-h-screen bg-muted/30">
        <InstructorNav />
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
