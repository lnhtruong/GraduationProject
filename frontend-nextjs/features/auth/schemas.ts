import { z } from "zod";

/**
 * Schema cho form đăng nhập
 */
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Schema cho form đăng ký
 */
export const signUpSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    firstName: z.string().min(1, "Vui lòng nhập tên"),
    lastName: z.string().min(1, "Vui lòng nhập họ"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Schema cho form quên mật khẩu
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema cho form đặt lại mật khẩu
 */
export const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    otp: z.string().length(6, "Mã OTP phải có 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
