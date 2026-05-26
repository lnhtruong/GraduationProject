"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getRoleName } from "@/lib/roles";
import AvatarUploader from "@/features/auth/components/AvatarUploader";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user } = useAuth();

  const getRoleVariant = (
    role: number,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 2:
        return "destructive";
      case 3:
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Hồ sơ của tôi</h1>

      <div className="grid gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <AvatarUploader />
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Tên</Label>
                  <p className="font-medium">
                    {user?.firstName || "Chưa cập nhật"}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Họ</Label>
                  <p className="font-medium">
                    {user?.lastName || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground">Vai trò</Label>
                <div>
                  <Badge variant={getRoleVariant(user?.role || 1)}>
                    {getRoleName(user?.role || 1)}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground">User ID</Label>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  Tài khoản của bạn đã được xác thực và có thể sử dụng đầy đủ
                  các tính năng của LearnHub.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
