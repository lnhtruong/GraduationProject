"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncAuthSession } from "@/lib/auth-session";
import type { User } from "@/features/auth/types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const session = searchParams.get("session");
    const error = searchParams.get("error");

    if (error || !session) {
      router.replace("/signin?error=oauth_failed");
      return;
    }

    fetch(`${API_URL}/auth/oauth-session?session=${encodeURIComponent(session)}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then((data: { accessToken: string; user: User }) => {
        syncAuthSession({ accessToken: data.accessToken, user: data.user });
        router.replace("/");
      })
      .catch(() => {
        router.replace("/signin?error=oauth_failed");
      });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Đang đăng nhập...</p>
    </div>
  );
}
