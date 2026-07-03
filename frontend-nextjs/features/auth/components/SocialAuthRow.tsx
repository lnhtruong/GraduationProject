"use client";

import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/env";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { GoogleLoginButton } from "./GoogleLoginButton";

type SocialAuthRowProps = {
  onGoogleCredential: (credential: string) => void | Promise<void>;
};

/** Shared base classes for all 3 social buttons */
const SOCIAL_BTN =
  "relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-muted select-none";

export function SocialAuthRow({ onGoogleCredential }: SocialAuthRowProps) {
  const searchParams = useSearchParams();

  const handleOAuthRedirect = (provider: "github" | "facebook") => {
    if (typeof window === "undefined") return;

    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl) {
      sessionStorage.setItem("oauth_return_url", returnUrl);
    } else {
      sessionStorage.removeItem("oauth_return_url");
    }

    const baseUrl = API_URL?.replace(/\/$/, "");
    const targetUrl = baseUrl
      ? `${baseUrl}/auth/${provider}`
      : `/auth/${provider}`;

    window.location.assign(targetUrl);
  };

  return (
    <div className="mt-6 w-full">
      <div className="relative mb-7 flex items-center justify-center">
        <span className="absolute w-full border-t border-border/70" />
        <span className="relative z-10 bg-background dark:bg-card px-4 text-[13px] font-medium tracking-wide text-muted-foreground">
          Hoặc tiếp tục với
        </span>
      </div>

      <div className="flex items-center justify-center gap-6">
        {/* Google */}
        <div className={SOCIAL_BTN} title="Đăng nhập với Google">
          {/* Logo tự vẽ — pointer-events-none để click xuyên qua */}
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className="pointer-events-none"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {/*
            GSI iframe ẩn hoàn toàn nhưng vẫn nhận click.
            - opacity-0: ẩn nhưng KHÔNG tắt pointer-events (khác visibility:hidden)
            - flex items-center justify-center: căn giữa iframe 40x40 trong div 44x44
            - KHÔNG dùng overflow-hidden: tránh clip iframe của Google
          */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0">
            <GoogleLoginButton
              iconOnly
              shape="circle"
              width={44}
              onCredential={onGoogleCredential}
            />
          </div>
        </div>


        {/* GitHub */}
        <button
          type="button"
          aria-label="Đăng nhập với GitHub"
          title="Đăng nhập với GitHub"
          className={SOCIAL_BTN}
          onClick={() => handleOAuthRedirect("github")}
        >
          <FaGithub className="h-5 w-5 text-foreground" />
        </button>

        {/* Facebook */}
        <button
          type="button"
          aria-label="Đăng nhập với Facebook"
          title="Đăng nhập với Facebook"
          className={SOCIAL_BTN}
          onClick={() => handleOAuthRedirect("facebook")}
        >
          <FaFacebook className="h-5 w-5 text-[#1877F2]" />
        </button>
      </div>
    </div>
  );
}


