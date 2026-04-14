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
        <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
