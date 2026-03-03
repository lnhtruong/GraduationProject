"use client";

import { useState } from "react";
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
} from "lucide-react";
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
import { useForgotPassword } from "../api/auth.hooks";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../schemas";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate: forgotPassword } = useForgotPassword({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      // Redirect to reset password page with email
      setTimeout(() => {
        const email = form.getValues("email");
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    },
    onError: (err) => {
      setError(err.message || "Không thể gửi mã OTP. Vui lòng thử lại.");
      setSuccess(false);
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    setError(null);
    setSuccess(false);
    forgotPassword(data);
  };

  return (
    <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 dark:ring-white/10">
      <CardHeader className="space-y-1.5 pb-5 pt-6">
        <CardTitle className="text-2xl font-bold text-center text-foreground tracking-tight">
          Quên mật khẩu?
        </CardTitle>
        <CardDescription className="text-center text-sm text-muted-foreground">
          Nhập email của bạn để nhận mã OTP
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        {error && (
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
                        disabled={form.formState.isSubmitting || success}
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
              disabled={form.formState.isSubmitting || success}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {form.formState.isSubmitting ? "Đang gửi..." : "Gửi mã OTP"}
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
      </CardContent>
    </Card>
  );
}
