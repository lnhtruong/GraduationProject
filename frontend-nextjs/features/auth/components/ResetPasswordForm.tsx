"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { OTPInput } from "@/components/ui/otp-input";
import { useResetPassword, useForgotPassword } from "../api/auth.hooks";
import { resetPasswordSchema, type ResetPasswordFormData } from "../schemas";
import {
  useForgotPasswordCooldown,
  formatCountdown,
} from "../hooks/useForgotPasswordCooldown";

function parseApiMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const { isLocked: isResendRateLimited, secondsLeft: resendSecondsLeft, startCooldown: startResendCooldown } =
    useForgotPasswordCooldown();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromUrl,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (emailFromUrl) {
      form.setValue("email", emailFromUrl);
    }
  }, [emailFromUrl, form]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const { mutate: forgotPassword, isPending: isResending } = useForgotPassword({
    onSuccess: () => {
      setResendCountdown(60);
      setError(null);
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 429) {
        const retryAfter = Number(err.response.data?.retryAfter) || 300;
        startResendCooldown(retryAfter);
        const mins = Math.ceil(retryAfter / 60);
        setError(`Bạn đã gửi OTP quá nhiều lần. Vui lòng thử lại sau ${mins} phút.`);
      } else {
        setError(parseApiMessage(err, "Không thể gửi lại mã OTP. Vui lòng thử lại."));
      }
    },
  });

  const { mutate: resetPassword } = useResetPassword({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        router.push("/signin?reset=success");
      }, 2000);
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 423) {
        setIsAccountLocked(true);
        setError(null);
      } else {
        setIsAccountLocked(false);
        setError(parseApiMessage(err, "Không thể đặt lại mật khẩu. Vui lòng thử lại."));
      }
      setSuccess(false);
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    setError(null);
    setSuccess(false);
    // Chỉ gửi các field mà backend cần, không gửi confirmPassword
    resetPassword({
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword,
    });
  };

  const handleResendOTP = () => {
    if (resendCountdown > 0 || isResendRateLimited || isAccountLocked || !emailFromUrl) return;
    forgotPassword({ email: emailFromUrl });
  };

  return (
    <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 dark:ring-white/10">
      <CardHeader className="space-y-1.5 pb-5 pt-6">
        <CardTitle className="text-2xl font-bold text-center text-foreground tracking-tight">
          Đặt lại mật khẩu
        </CardTitle>
        <CardDescription className="text-center text-sm text-muted-foreground">
          Nhập mã OTP và mật khẩu mới của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        {isAccountLocked && (
          <Alert variant="destructive" className="mb-4 py-2">
            <Clock className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">Tài khoản tạm thời bị khóa</AlertTitle>
            <AlertDescription className="text-sm">
              Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau 30 phút hoặc{" "}
              <a href="/forgot-password" className="underline font-medium">
                gửi lại OTP
              </a>
              .
            </AlertDescription>
          </Alert>
        )}

        {error && !isAccountLocked && (
          <Alert variant="destructive" className="mb-4 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">Lỗi</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4 py-2">
            <CheckCircle2 className="h-4 w-4 stroke-current" />
            <AlertTitle className="text-sm font-semibold">
              Mật khẩu đã được đặt lại thành công!
            </AlertTitle>
            <AlertDescription className="text-sm">
              Bạn có thể đăng nhập bằng mật khẩu mới trong giây lát...
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
                    <Input
                      {...field}
                      type="email"
                      className="h-10 bg-muted/50 border-border text-muted-foreground"
                      disabled
                      readOnly
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  {/* Canh trái Label như bình thường */}
                  <FormLabel>Mã OTP</FormLabel>
                  <FormControl>
                    <OTPInput
                      length={6}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={form.formState.isSubmitting || success}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <div className="relative">
                      {/* Đã xóa Lock Icon */}
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10 h-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                        disabled={form.formState.isSubmitting || success}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={form.formState.isSubmitting || success}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      {/* Đã xóa Lock Icon */}
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10 h-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                        disabled={form.formState.isSubmitting || success}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={form.formState.isSubmitting || success}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-10 font-medium mt-2"
              disabled={form.formState.isSubmitting || success || isAccountLocked}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {form.formState.isSubmitting
                ? "Đang xử lý..."
                : "Đặt lại mật khẩu"}
            </Button>
          </form>
        </Form>

        <div className="mt-5 text-center text-sm text-muted-foreground border-t border-border pt-4">
          Không nhận được mã?{" "}
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendCountdown > 0 || isResendRateLimited || isResending || isAccountLocked}
            className="text-primary hover:text-primary/80 hover:underline font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            {isResending ? (
              <>
                <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                Đang gửi...
              </>
            ) : isResendRateLimited ? (
              <>
                <Clock className="inline h-3 w-3 mr-1" />
                {`Gửi lại sau ${formatCountdown(resendSecondsLeft)}`}
              </>
            ) : resendCountdown > 0 ? (
              `Gửi lại (${resendCountdown}s)`
            ) : (
              "Gửi lại"
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
