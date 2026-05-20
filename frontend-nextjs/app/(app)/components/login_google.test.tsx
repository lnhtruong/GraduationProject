"use client";

import Script from "next/script";
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Component test auth flow: register, local login, Google login.
 *
 * Env (.env.local):
 * NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
 */

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

type AuthUser = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: number | null;
  avatarUrl?: string | null;
};

type AuthResponse = {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
};

type FormMode = "login" | "register";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900";

export default function GoogleLoginTest() {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  const [mode, setMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE_URL = "http://localhost:8000/api";
  const GOOGLE_CLIENT_ID = "297....apps.googleusercontent.com";

  const resetStatus = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const saveAuth = useCallback((data: AuthResponse) => {
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    setResult(data);
  }, []);

  const handleGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        setLoading(true);
        resetStatus();

        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message || data?.error || "Google login failed",
          );
        }

        saveAuth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    [API_BASE_URL, resetStatus, saveAuth],
  );

  const renderGoogleButton = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    if (!window.google) {
      return;
    }

    const container = googleButtonRef.current;
    if (!container) {
      return;
    }

    // Container bị unmount khi đổi tab → clear rồi render lại
    container.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "signin_with",
      shape: "rectangular",
    });
  }, [GOOGLE_CLIENT_ID, handleGoogleCredential]);

  const isLoggedIn = Boolean(result?.accessToken && mode === "login");

  useEffect(() => {
    if (mode !== "login" || !googleScriptReady || isLoggedIn) {
      return;
    }

    // Đợi DOM mount xong div googleButtonRef sau khi chuyển tab / logout
    const timer = window.setTimeout(() => {
      renderGoogleButton();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [mode, googleScriptReady, isLoggedIn, renderGoogleButton]);

  async function handleLocalLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      resetStatus();

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Login failed");
      }

      saveAuth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      resetStatus();

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Register failed");
      }

      setSuccessMessage(
        "Đăng ký thành công. Chuyển qua tab Đăng nhập để test login.",
      );
      setMode("login");
      setPassword("");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: FormMode) {
    setMode(nextMode);
    resetStatus();
    setResult(null);
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setResult(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    resetStatus();
  }

  const displayName =
    result?.user.firstName || result?.user.lastName
      ? `${result?.user.firstName ?? ""} ${result?.user.lastName ?? ""}`.trim()
      : "No name";

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptReady(true)}
      />

      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-xl">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Auth Flow Test
            </h1>
            <p className="text-sm text-slate-500">
              Test đăng ký, login thường và Google login
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {isLoggedIn && result ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
                <p className="font-semibold text-green-700">
                  Đăng nhập thành công
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {result.user.avatarUrl ? (
                    <img
                      src={result.user.avatarUrl}
                      alt="avatar"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-slate-200" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{displayName}</p>
                    <p className="text-slate-500">{result.user.email}</p>
                    <p className="text-xs text-slate-400">
                      Role: {result.user.role ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800"
              >
                Logout local
              </button>
            </div>
          ) : (
            <>
              {mode === "login" ? (
                <form onSubmit={handleLocalLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      placeholder="you@example.com"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      required
                      placeholder="••••••••"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loading ? "Đang xử lý..." : "Login thường"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        First name
                      </label>
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        type="text"
                        placeholder="Tài"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        Last name
                      </label>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        type="text"
                        placeholder="Phan"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      placeholder="you@example.com"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      required
                      placeholder="••••••••"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
                  </button>
                </form>
              )}

              {mode === "login" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate-400">hoặc</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="flex justify-center">
                    <div ref={googleButtonRef} />
                  </div>
                </>
              )}

              {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {result && !result.accessToken && mode === "register" && (
                <div className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
