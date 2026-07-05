"use client";

import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden flex min-h-[70vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-[260px] h-[260px] rounded-full bg-accent/10 dark:bg-accent/5 blur-[60px] pointer-events-none animation-delay-2000 animate-pulse" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-slate-100/[0.01] pointer-events-none" />

      <div className="max-w-md w-full text-center bg-card/40 backdrop-blur-xl border border-border/60 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 transition-all duration-300 hover:shadow-primary/5 hover:border-primary/20">
        {/* Animated Icon Ring */}
        <div className="relative w-20 h-20 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-destructive/5 dark:bg-destructive/10 animate-ping opacity-75" />
          <div className="w-16 h-16 rounded-full bg-destructive/15 dark:bg-destructive/25 flex items-center justify-center">
            <ShieldAlert className="h-9 w-9 text-destructive" />
          </div>
        </div>

        {/* 403 Title */}
        <h1 className="text-7xl sm:text-8xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-destructive via-primary to-accent select-none drop-shadow-sm leading-none mb-4">
          403
        </h1>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-3">
          Không có quyền truy cập
        </h2>

        {/* Message */}
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
          Tài khoản của bạn hiện không có đủ đặc quyền để xem nội dung trang này. Vui lòng thử lại bằng tài khoản khác hoặc liên hệ quản trị viên.
        </p>

        {/* Interactive Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background/60 hover:bg-muted font-bold px-5 py-3 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 text-foreground cursor-pointer text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-bold px-6 py-3 shadow-md shadow-primary/10 hover:bg-primary/90 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

