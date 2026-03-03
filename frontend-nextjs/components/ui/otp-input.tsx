"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function OTPInput({
  length = 6,
  value = "",
  onChange,
  onBlur,
  disabled = false,
  className,
  error = false,
}: OTPInputProps) {
  const [otp, setOtp] = React.useState<string[]>(
    value.split("").slice(0, length),
  );
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    const newOtp = value.split("").slice(0, length);
    setOtp(newOtp);
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (digit && !/^\d$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    onChange?.(newOtp.join(""));

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    const digits = pastedData.split("").filter((char) => /^\d$/.test(char));

    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < length) {
        newOtp[idx] = digit;
      }
    });
    setOtp(newOtp);
    onChange?.(newOtp.join(""));

    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    const focusIndex =
      nextEmptyIndex === -1 ? length - 1 : Math.min(nextEmptyIndex, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    // Dùng justify-between để 6 ô dàn đều 2 bên mép form
    <div className={cn("flex gap-2 justify-between w-full", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            // Ép kích thước về h-10, dùng w-full max-w-[3rem] để nó tự co giãn đàn hồi
            "h-10 w-full max-w-[3rem] text-center text-base font-semibold",
            "rounded-md border border-input bg-background",
            "transition-shadow duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            otp[index] && "border-primary/50", // Ô nào có chữ thì viền hơi đậm lên xíu
            error && "border-destructive focus:ring-destructive/50",
            className,
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
