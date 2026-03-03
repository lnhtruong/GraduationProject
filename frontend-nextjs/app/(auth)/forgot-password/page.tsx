import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata = {
  title: "Quên mật khẩu",
  description: "Đặt lại mật khẩu của bạn",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
