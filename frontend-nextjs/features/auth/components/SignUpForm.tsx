"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signUpSchema, type SignUpFormData } from "../schemas";
import { SocialAuthRow } from "./SocialAuthRow";

function getSafeReturnUrl(value: string | null): string | null {
  if (!value) return null;

  const decoded = decodeURIComponent(value);
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;

  return decoded;
}

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl"));
  const { register: registerUser, googleLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setError("");
    setSuccess(false);

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      setSuccess(true);

      setTimeout(() => {
        router.push(returnUrl ? `/signin?registered=true&returnUrl=${encodeURIComponent(returnUrl)}` : "/signin?registered=true");
      }, 2000);
    } catch (err: unknown) {
      // Parse error message from backend
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại.";

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const onGoogleLogin = async (credential: string) => {
    setError("");
    setSuccess(false);

    try {
      await googleLogin({ credential });

      router.push(returnUrl ?? "/");
    } catch (err: unknown) {
      let errorMessage = "Đăng nhập Google thất bại. Vui lòng thử lại.";

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Tạo tài khoản
        </h1>
        <p className="text-sm text-muted-foreground">
          Tham gia LearnHub để bắt đầu hành trình học tập
        </p>
      </div>

      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="py-3">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Tạo tài khoản thành công! Chào mừng bạn đến với LearnHub.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Nguyễn"
                        disabled={form.formState.isSubmitting}
                        className="h-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Văn A"
                        disabled={form.formState.isSubmitting}
                        className="h-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      placeholder="your@email.com"
                      disabled={form.formState.isSubmitting}
                      className="h-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={form.formState.isSubmitting}
                        className="h-10 pr-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
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
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={form.formState.isSubmitting}
                        className="h-10 pr-10 bg-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
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
              className="w-full h-10 font-medium mt-4"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tạo tài khoản
            </Button>
          </form>
        </Form>

        <SocialAuthRow onGoogleCredential={onGoogleLogin} />

        <div className="mt-5 space-y-3">
          <div className="text-[11px] leading-relaxed text-muted-foreground text-center">
            Bằng cách tạo tài khoản, bạn đồng ý với{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Chính sách bảo mật
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-3 border-t border-border">
            Đã có tài khoản?{" "}
            <Link
              href={returnUrl ? `/signin?returnUrl=${encodeURIComponent(returnUrl)}` : "/signin"}
              className="text-primary hover:text-primary/80 hover:underline font-medium transition-all"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
