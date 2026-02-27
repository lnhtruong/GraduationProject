"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Label } from "@/components/ui/label";
import { Github, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignInForm() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(
        error?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 shadow-2xl border-2 border-white/20">
      <CardHeader className="space-y-3 pb-8">
        <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-center text-base">
          Đăng nhập vào tài khoản LearnHub của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="w-full h-11 hover:bg-accent transition-colors"
          >
            <Github className="h-5 w-5 mr-2" />
            GitHub
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 hover:bg-accent transition-colors"
          >
            <Mail className="h-5 w-5 mr-2" />
            Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Hoặc đăng nhập với
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-base">
                Mật khẩu
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline transition-all"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="h-11 text-base pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 h-11 w-11 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Đăng nhập
          </Button>
        </form>

        <div className="text-center text-sm">
          Chưa có tài khoản?{" "}
          <Link
            href="/signup"
            className="text-primary hover:underline font-semibold transition-all"
          >
            Đăng ký ngay
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
