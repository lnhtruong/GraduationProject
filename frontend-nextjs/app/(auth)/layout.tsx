import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { PageLoader } from "@/components/PageLoader";

export const metadata: Metadata = {
  title: "Authentication - LearnHub",
  description: "Sign in or create your LearnHub account",
};

/**
 * Auth Layout
 * Spotlight layout: Professional, tech-focused with a subtle brand glow
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* --- BACKGROUND EFFECTS --- */}
      {/* 1. Ánh sáng Spotlight hắt từ trên xuống giữa màn hình */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-200 h-150 pointer-events-none select-none">
        <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 blur-[120px] rounded-full"></div>
      </div>

      {/* 2. Nền lưới (Grid) hiển thị rõ ở giữa và mờ dần ra 4 góc */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.02] mask-[radial-gradient(ellipse_at_center,black_50%,transparent_100%)] pointer-events-none select-none"></div>
      {/* --------------------------- */}

      {/* Brand header */}
      <div className="container relative z-10 mx-auto px-4 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="relative flex items-center justify-center transform group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="LearnHub Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary tracking-tight">
              LearnHub
            </span>
          </div>
        </Link>
      </div>

      {/* Main content (Form sẽ nằm ngay giữa luồng sáng) */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        {/* Bọc thêm một lớp animte nhẹ để form trồi lên mượt mà */}
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </div>
      </div>

      {/* Footer */}
      <div className="container relative z-10 mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 LearnHub. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/support"
              className="hover:text-primary transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
