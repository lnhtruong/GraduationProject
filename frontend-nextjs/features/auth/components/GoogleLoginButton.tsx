"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/env";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
            },
          ) => void;
        };
      };
    };
  }
}

type GoogleLoginButtonProps = {
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  iconOnly?: boolean;
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
};

export function GoogleLoginButton({
  text = "signin_with",
  width,
  size = "large",
  shape = "rectangular",
  iconOnly = false,
  disabled = false,
  onCredential,
}: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google) {
      const readyTimer = window.setTimeout(() => {
        setScriptReady(true);
      }, 0);

      return () => window.clearTimeout(readyTimer);
    }

    const existingScript = document.getElementById("google-gsi-script");

    if (existingScript) {
      const checkInterval = window.setInterval(() => {
        if (window.google) {
          window.setTimeout(() => {
            setScriptReady(true);
          }, 0);
          window.clearInterval(checkInterval);
        }
      }, 100);

      return () => window.clearInterval(checkInterval);
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.setTimeout(() => {
        setScriptReady(true);
      }, 0);
    };
    script.onerror = () => setScriptFailed(true);
    document.head.appendChild(script);
  }, []);

  const clientId = GOOGLE_CLIENT_ID ?? "";
  const buttonWidth = width ?? (shape === "circle" ? 40 : 320);
  const displayShape = iconOnly ? "circle" : shape;
  const displayWidth = iconOnly ? 40 : buttonWidth;
  const isCircle = displayShape === "circle";

  const initializeGoogle = useCallback(() => {
    if (!clientId || !window.google || initializedRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        void onCredential(response.credential);
      },
    });

    initializedRef.current = true;
  }, [clientId, onCredential]);

  const renderButton = useCallback(() => {
    if (!clientId || disabled || !window.google || !buttonRef.current) {
      return;
    }

    buttonRef.current.innerHTML = "";

    initializeGoogle();

    const buttonOptions: {
      type: "standard" | "icon";
      theme: "outline" | "filled_blue" | "filled_black";
      size: "large" | "medium" | "small";
      width?: number;
      text: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape: "rectangular" | "pill" | "circle" | "square";
    } = {
      type: iconOnly ? "icon" : "standard",
      theme: "outline",
      size,
      text,
      shape: displayShape,
    };

    if (!iconOnly) {
      buttonOptions.width = displayWidth;
    }

    window.google.accounts.id.renderButton(buttonRef.current, buttonOptions);
  }, [
    clientId,
    disabled,
    displayShape,
    displayWidth,
    iconOnly,
    initializeGoogle,
    size,
    text,
  ]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    if (iconOnly) {
      renderButton();
      return;
    }

    const timer = window.setTimeout(() => {
      renderButton();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [iconOnly, initializeGoogle, renderButton, scriptReady]);

  if (!clientId) {
    return (
      <div
        className={
          isCircle
            ? "flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-amber-300 bg-amber-50 text-xs font-semibold text-amber-700"
            : "rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700"
        }
        title="Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID"
      >
        {isCircle ? "G" : "Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID"}
      </div>
    );
  }

  if (scriptFailed) {
    return (
      <div
        className={
          isCircle
            ? "flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-amber-300 bg-amber-50 text-xs font-semibold text-amber-700"
            : "rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700"
        }
        title="Không tải được nút Google. Kiểm tra network hoặc adblock."
      >
        {isCircle
          ? "G"
          : "Không tải được nút Google. Kiểm tra network hoặc adblock."}
      </div>
    );
  }

  if (iconOnly) {
    return (
      <div
        ref={buttonRef}
        style={{ colorScheme: "light" }}
        className={
          scriptReady
            ? "flex h-10 w-10 items-center justify-center"
            : "h-10 w-10 animate-pulse rounded-full border border-slate-200 bg-slate-50"
        }
      />
    );
  }

  return (
    <div
      className={
        isCircle ? "flex h-11 w-11 items-center justify-center" : "space-y-3"
      }
    >
      {!scriptReady && (
        <div
          className={
            isCircle
              ? "h-11 w-11 animate-pulse rounded-full border border-slate-200 bg-slate-50"
              : "flex min-h-10 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500"
          }
          aria-hidden="true"
        />
      )}
      <div
        ref={buttonRef}
        className={
          scriptReady
            ? isCircle
              ? "h-11 w-11 overflow-hidden"
              : "flex justify-center"
            : "hidden"
        }
      />
    </div>
  );
}
