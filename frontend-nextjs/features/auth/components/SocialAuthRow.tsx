"use client";

import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/env";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { GoogleLoginButton } from "./GoogleLoginButton";

type SocialAuthRowProps = {
  onGoogleCredential: (credential: string) => void | Promise<void>;
};

export function SocialAuthRow({ onGoogleCredential }: SocialAuthRowProps) {
  const handleOAuthRedirect = (provider: "github" | "facebook") => {
    if (typeof window === "undefined") return;

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
        <span className="relative z-10 bg-card px-4 text-[13px] font-medium tracking-wide text-muted-foreground">
          Hoặc tiếp tục với
        </span>
      </div>

      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center justify-center transition-transform hover:-translate-y-0.5 hover:opacity-80">
          <GoogleLoginButton
            iconOnly
            shape="circle"
            width={44}
            onCredential={onGoogleCredential}
          />
        </div>

        <Button
          type="button"
          aria-label="Continue with GitHub"
          title="Đăng nhập với GitHub"
          variant="outline"
          size="icon-lg"
          className="rounded-full border-slate-200 bg-white text-[#181717] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          onClick={() => handleOAuthRedirect("github")}
        >
          <FaGithub className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          aria-label="Continue with Facebook"
          title="Đăng nhập với Facebook"
          variant="outline"
          size="icon-lg"
          className="rounded-full border-slate-200 bg-white text-[#1877F2] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          onClick={() => handleOAuthRedirect("facebook")}
        >
          <FaFacebook className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
