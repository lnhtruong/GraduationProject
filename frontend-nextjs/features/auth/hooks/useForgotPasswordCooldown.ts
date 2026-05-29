"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "forgot_password_unlock_at";

function getStoredUnlockAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const value = parseInt(raw, 10);
  return isNaN(value) ? null : value;
}

function calcSecondsLeft(unlockAt: number | null): number {
  if (unlockAt === null) return 0;
  return Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));
}

export function formatCountdown(seconds: number): string {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export function useForgotPasswordCooldown() {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    calcSecondsLeft(getStoredUnlockAt()),
  );

  // Tick every second while locked
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const id = setInterval(() => {
      const stored = getStoredUnlockAt();
      const remaining = calcSecondsLeft(stored);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        localStorage.removeItem(STORAGE_KEY);
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [secondsLeft]);

  /**
   * Call this when a 429/423 response arrives.
   * retryAfterSeconds: value from Retry-After header or response body (in seconds).
   */
  const startCooldown = useCallback((retryAfterSeconds: number) => {
    const unlockAt = Date.now() + retryAfterSeconds * 1000;
    localStorage.setItem(STORAGE_KEY, unlockAt.toString());
    setSecondsLeft(calcSecondsLeft(unlockAt));
  }, []);

  const isLocked = secondsLeft > 0;

  return { secondsLeft, isLocked, startCooldown, formatCountdown };
}
