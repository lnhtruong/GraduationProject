"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncAuthSession } from "@/lib/auth-session";
import type { User } from "@/features/auth/types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function getSafeReturnUrl(value: string | null): string | null {
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  return decoded;
}

function OAuthCallbackContent() {
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
        
        const storedReturnUrl = sessionStorage.getItem("oauth_return_url");
        sessionStorage.removeItem("oauth_return_url");
        const safeReturnUrl = getSafeReturnUrl(storedReturnUrl);
        
        router.replace(safeReturnUrl ?? "/");
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


export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Đang đăng nhập...</p>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
