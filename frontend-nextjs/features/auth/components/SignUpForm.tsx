"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
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
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signUpSchema, type SignUpFormData } from "../schemas";

export default function SignUpForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
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
        router.push("/signin?registered=true");
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

  return (
    <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 dark:ring-white/10">
      <CardHeader className="space-y-1.5 pb-5 pt-6">
        <CardTitle className="text-2xl font-bold text-center text-foreground tracking-tight">
          Tạo tài khoản
        </CardTitle>
        <CardDescription className="text-center text-sm text-muted-foreground">
          Tham gia LearnHub để bắt đầu hành trình học tập
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        {/* Nút Social Login cao cấp */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-background hover:bg-muted font-normal text-muted-foreground transition-all"
          >
            <svg className="w-4 h-4 mr-2 text-foreground" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
            Github
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-background hover:bg-muted font-normal text-muted-foreground transition-all"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
              />
              <path
                fill="#34A853"
                d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
              />
              <path
                fill="#4A90E2"
                d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
              />
              <path
                fill="#FBBC05"
                d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
              />
            </svg>
            Google
          </Button>
        </div>

        {/* Kẻ ngang phân cách */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-medium">
              Hoặc tiếp tục với email
            </span>
          </div>
        </div>

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
              href="/signin"
              className="text-primary hover:text-primary/80 hover:underline font-medium transition-all"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
