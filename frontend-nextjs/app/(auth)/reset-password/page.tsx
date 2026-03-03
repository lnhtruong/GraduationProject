import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata = {
  title: "Đặt lại mật khẩu",
  description: "Tạo mật khẩu mới cho tài khoản của bạn",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
