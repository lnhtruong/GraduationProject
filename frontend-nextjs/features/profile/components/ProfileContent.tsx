"use client";

import { useEffect, useState } from "react";
import AvatarUploader from "@/features/auth/components/AvatarUploader";
import { useAuth, useAuthActions } from "@/features/auth/hooks/useAuth";
import { BecomeInstructorSection } from "@/features/lecturer-requests/components/student/BecomeInstructorSection";
import { RoleBadge } from "@/components/RoleBadge";
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
import { BadgeCheck, Loader2, Mail, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "@/features/profile/api/profile.api";
import { getUserDisplayName } from "@/lib/user-display";

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

  const displayName = getUserDisplayName(user);

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
    <main className="bg-muted/[0.12]">
      <div className="container mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {isLoadingProfile && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải hồ sơ...
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative min-h-64 overflow-hidden sm:min-h-72" style={{ background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 54%, var(--background)) 36%, color-mix(in oklab, var(--primary) 18%, var(--background)) 68%, var(--background) 100%)" }}>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.18)_25%,transparent_25%,transparent_50%,rgb(255_255_255_/_0.18)_50%,rgb(255_255_255_/_0.18)_75%,transparent_75%,transparent)] bg-[size:34px_34px] opacity-25 dark:opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent dark:from-card dark:via-card/55" />

            <div className="absolute right-5 top-5 rounded-full border border-white/60 bg-white/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40 dark:text-white">
              Hồ sơ cá nhân
            </div>

            <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-7 sm:pb-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <AvatarUploader />
                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                    {displayName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <RoleBadge role={user?.role} className="text-xs" />
                    {user?.email && (
                      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border bg-background/75 px-2.5 py-1 text-foreground shadow-sm backdrop-blur dark:bg-black/30 dark:text-white">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Tabs defaultValue="overview" className="mt-6 w-full">
          <TabsList className="mb-5 grid h-auto w-full grid-cols-2 rounded-xl border bg-background p-1 shadow-sm sm:w-[420px]">
            <TabsTrigger
              value="overview"
              className="cursor-pointer gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <UserRound className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="cursor-pointer gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border bg-background shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Tổng quan tài khoản</CardTitle>
                <CardDescription>Thông tin định danh và quyền hiện tại của bạn trên StudyLoop.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border bg-muted/[0.18] p-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <BadgeCheck className="h-4 w-4" />
                      Tên hiển thị
                    </span>
                    <p className="mt-2 truncate text-base font-semibold">{displayName}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/[0.18] p-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      Vai trò hiện tại
                    </span>
                    <p className="mt-2 text-base font-semibold">{getRoleName(user?.role || 1)}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/[0.18] p-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email đăng nhập
                    </span>
                    <p className="mt-2 truncate text-base font-semibold">{user?.email || "--"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.role === ROLES.STUDENT && <BecomeInstructorSection />}
          </TabsContent>
          <TabsContent value="edit" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border bg-background shadow-sm">
              <CardHeader>
                <CardTitle>Chỉnh sửa thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật tên và họ để mọi người dễ nhận ra bạn trên StudyLoop.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Họ</Label>
                    <Input
                      id="edit-lastName"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Nhập họ của bạn"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">Tên</Label>
                    <Input
                      id="edit-firstName"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Nhập tên của bạn"
                      className="h-11 rounded-xl"
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
                    className="h-11 cursor-not-allowed rounded-xl bg-muted/50"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Email là định danh duy nhất và không thể thay đổi ở trang này.
                  </p>
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFirstName(user?.firstName || "");
                    setLastName(user?.lastName || "");
                  }}
                  disabled={isUpdating}
                  className="w-full rounded-xl sm:w-auto"
                >
                  Huỷ
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating || (!firstName && !lastName)}
                  className="w-full rounded-xl sm:w-auto"
                >
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
    </main>
  );
}
