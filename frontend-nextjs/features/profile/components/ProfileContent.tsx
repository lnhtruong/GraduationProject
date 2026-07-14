"use client";

import { useEffect, useMemo, useState } from "react";
import AvatarUploader from "@/features/auth/components/AvatarUploader";
import { useAuth, useAuthActions } from "@/features/auth/hooks/useAuth";
import { BecomeInstructorSection } from "@/features/lecturer-requests/components/student/BecomeInstructorSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoleName, ROLES } from "@/lib/roles";
import { Loader2, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "@/features/profile/api/profile.api";

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }
  return "Có lỗi xảy ra khi cập nhật thông tin.";
}

function getRoleVariant(role: number): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case 2:
      return "destructive";
    case 3:
      return "secondary";
    default:
      return "default";
  }
}

export function ProfileContent() {
  const { user } = useAuth();
  const { setUser } = useAuthActions();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    profileApi
      .getMe()
      .then((profile) => {
        if (!isMounted) return;
        setUser(profile);
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
      })
      .catch(() => {
        if (!isMounted || !user) return;
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setUser, user?.id]);

  const displayName = useMemo(() => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.email?.split("@")[0] || "Người dùng";
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    try {
      setIsUpdating(true);
      const data = await profileApi.updateProfile(user.id, {
        firstName,
        lastName,
      });
      setUser({ ...user, ...data });
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      {isLoadingProfile && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải hồ sơ...
        </div>
      )}

      <div className="relative mb-16">
        <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-r from-primary/30 to-primary/5 md:h-64">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        </div>

        <div className="absolute bottom-0 left-8 flex translate-y-1/2 items-end gap-6 md:left-12">
          <div className="rounded-full bg-background p-1.5 shadow-md">
            <AvatarUploader />
          </div>
          <div className="hidden pb-2 md:block">
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={getRoleVariant(user?.role || 1)} className="font-medium shadow-none">
                {getRoleName(user?.role || 1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 mt-4 px-2 md:hidden">
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={getRoleVariant(user?.role || 1)} className="font-medium shadow-none">
            {getRoleName(user?.role || 1)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 h-auto w-full justify-start space-x-8 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent px-1 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            className="rounded-none border-b-2 border-transparent px-1 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Chỉnh sửa hồ sơ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                      Tên hiển thị
                    </Label>
                    <p className="font-medium">{displayName}</p>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                      Địa chỉ email
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="truncate font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                      Vai trò
                    </Label>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{getRoleName(user?.role || 1)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.role === ROLES.STUDENT && <BecomeInstructorSection />}
          </div>
        </TabsContent>

        <TabsContent value="edit" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Chỉnh sửa thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật tên và họ của bạn để mọi người dễ nhận ra bạn trên StudyLoop.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Tên</Label>
                  <Input
                    id="edit-firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Nhập tên của bạn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Họ</Label>
                  <Input
                    id="edit-lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Nhập họ của bạn"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                  className="cursor-not-allowed bg-muted/50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Email là định danh duy nhất và không thể thay đổi ở trang này.
                </p>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex justify-end gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setFirstName(user?.firstName || "");
                  setLastName(user?.lastName || "");
                }}
                disabled={isUpdating}
              >
                Hủy
              </Button>
              <Button onClick={handleUpdateProfile} disabled={isUpdating || (!firstName && !lastName)}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
