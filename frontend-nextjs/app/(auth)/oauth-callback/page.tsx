"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncAuthSession } from "@/lib/auth-session";
import type { User } from "@/features/auth/types";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    if (error || !accessToken || !userParam) {
      router.replace("/signin?error=oauth_failed");
      return;
    }

    try {
      const user = JSON.parse(atob(decodeURIComponent(userParam))) as User;
      syncAuthSession({ accessToken, user });
      router.replace("/");
    } catch {
      router.replace("/signin?error=oauth_failed");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Đang đăng nhập...</p>
    </div>
  );
}
