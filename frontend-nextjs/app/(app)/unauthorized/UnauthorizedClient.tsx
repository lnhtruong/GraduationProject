"use client";

import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-16rem)] w-full max-w-3xl items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              403
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Bạn không có quyền xem trang này
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tài khoản hiện tại không được cấp quyền truy cập nội dung này. Nếu bạn
              nghĩ đây là nhầm lẫn, hãy đăng nhập bằng tài khoản phù hợp hoặc liên hệ
              quản trị viên.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="justify-center gap-2"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <Button asChild className="justify-center gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Về trang chủ
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
