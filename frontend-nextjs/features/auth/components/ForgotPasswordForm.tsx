"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  ArrowLeft,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForgotPassword } from "../api/auth.hooks";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../schemas";
import {
  useForgotPasswordCooldown,
  formatCountdown,
} from "../hooks/useForgotPasswordCooldown";
import { getAuthErrorMessage } from "../utils/auth-error-message";

/** Extract wait seconds from a 429 AxiosError.
 * express-rate-limit with standardHeaders sends `ratelimit-reset` (epoch s)
 * and optionally `retry-after` (seconds). We try both.
 */
function extractRetryAfterSeconds(error: unknown): number {
  if (!isAxiosError(error) || !error.response) return 60;

  const headers = error.response.headers as Record<string, string | undefined>;

  // `retry-after` may be seconds or an HTTP-date; express-rate-limit sends seconds
  const retryAfterRaw = headers["retry-after"] ?? headers["Retry-After"];
  if (retryAfterRaw) {
    const secs = parseInt(retryAfterRaw, 10);
    if (!isNaN(secs) && secs > 0) return secs;
  }

  // `ratelimit-reset` is epoch seconds (standardHeaders: true)
  const resetRaw = headers["ratelimit-reset"] ?? headers["RateLimit-Reset"];
  if (resetRaw) {
    const epochSecs = parseInt(resetRaw, 10);
    if (!isNaN(epochSecs)) {
      const remaining = Math.ceil(epochSecs - Date.now() / 1000);
      if (remaining > 0) return remaining;
    }
  }

  return 60; // safe fallback
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const { isLocked, secondsLeft, startCooldown } = useForgotPasswordCooldown();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { mutate: forgotPassword, isSuccess } = useForgotPassword({
    onSuccess: () => {
      setTimeout(() => {
        const email = form.getValues("email");
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    },
    onError: (err) => {
      const axiosErr = isAxiosError(err) ? err : null;
      const status = axiosErr?.response?.status;

      if (status === 429 || status === 423) {
        const waitSecs = extractRetryAfterSeconds(err);
        startCooldown(waitSecs);
        const mins = Math.ceil(waitSecs / 60);
        toast.error(
          `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${mins} phút.`,
        );
      } else {
        toast.error(
          getAuthErrorMessage(err, "Không thể gửi mã OTP. Vui lòng thử lại."),
        );
      }
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    if (isLocked) return;
    forgotPassword(data);
  };

  const isDisabled = form.formState.isSubmitting || isSuccess || isLocked;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Quên mật khẩu?
        </h1>
        <p className="text-sm text-muted-foreground">
          Nhập email của bạn để nhận mã OTP
        </p>
      </div>

      <div className="space-y-4">
        {isLocked && (
          <Alert variant="destructive" className="mb-4 py-2">
            <Clock className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">
              Tạm thời bị khóa
            </AlertTitle>
            <AlertDescription className="text-sm">
              Vui lòng thử lại sau{" "}
              <span className="font-mono font-semibold">
                {formatCountdown(secondsLeft)}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {isSuccess && !isLocked && (
          <Alert variant="success" className="mb-4 py-2">
            <CheckCircle2 className="h-4 w-4 stroke-current" />
            <AlertTitle className="text-sm font-semibold">
              Thành công!
            </AlertTitle>
            <AlertDescription className="text-sm">
              Vui lòng kiểm tra email và nhập mã OTP để đặt lại mật khẩu.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        className="pl-9 h-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                        disabled={isDisabled}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-10 font-medium mt-2"
              disabled={isDisabled}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLocked ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Gửi lại sau {formatCountdown(secondsLeft)}
                </>
              ) : form.formState.isSubmitting ? (
                "Đang gửi..."
              ) : (
                "Gửi mã OTP"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-5 text-center text-sm text-muted-foreground border-t border-border pt-4">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline font-medium transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
