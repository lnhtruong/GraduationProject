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
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInSchema, type SignInFormData } from "../schemas";
import { SocialAuthRow } from "./SocialAuthRow";

function getSafeReturnUrl(value: string | null): string | null {
  if (!value) return null;

  const decoded = decodeURIComponent(value);
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;

  return decoded;
}

export default function SignInForm() {
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl"));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setError("");

    try {
      await login(data);

      router.push(returnUrl ?? "/");
    } catch (err: unknown) {
      // Parse error message from backend
      let errorMessage = "Đăng nhập thất bại. Vui lòng thử lại.";

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
          Chào mừng trở lại
        </h1>
        <p className="text-sm text-muted-foreground">
          Đăng nhập vào tài khoản LearnHub của bạn
        </p>
      </div>

      <div className="space-y-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="on"
          >
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                      autoComplete="email"
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Mật khẩu</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline transition-all"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
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

            <Button
              type="submit"
              className="w-full h-10 font-medium mt-2"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Đăng nhập
            </Button>
          </form>
        </Form>

        <SocialAuthRow onGoogleCredential={onGoogleLogin} />

        <div className="text-center text-sm text-muted-foreground pt-4">
          Chưa có tài khoản?{" "}
          <Link
            href={returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : "/signup"}
            className="text-primary hover:text-primary/80 hover:underline font-medium transition-all"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
