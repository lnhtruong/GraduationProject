import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getRoleAccess } from "@/lib/route-access";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={getRoleAccess("instructor")}>
      <div className="min-h-screen bg-muted/30 bg-[radial-gradient(circle,_hsl(var(--border))_1px,_transparent_1px)] [background-size:24px_24px]">
        <main className="mx-auto max-w-screen-xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
