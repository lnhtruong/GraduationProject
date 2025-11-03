import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { PageLoader } from "@/components/PageLoader";

export default function MainLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoader message="Đang tải trang..." />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
