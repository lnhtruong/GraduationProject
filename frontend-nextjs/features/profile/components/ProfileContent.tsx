"use client";

import { useAuth, useAuthActions } from "@/features/auth/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRoleName, ROLES } from "@/lib/roles";
import AvatarUploader from "@/features/auth/components/AvatarUploader";
import { BecomeInstructorSection } from "@/features/lecturer-requests/components/student/BecomeInstructorSection";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Shield } from "lucide-react";
import { profileApi } from "@/features/profile/api/profile.api";
import { toast } from "sonner";

export function ProfileContent() {
  const { user } = useAuth();
  const { setUser } = useAuthActions();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

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

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    try {
      setIsUpdating(true);
      const data = await profileApi.updateProfile(user.id, {
        firstName,
        lastName,
      });
      
      // Update local storage/state
      setUser({ ...user, ...data });
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 md:px-8">
      
      {/* Cover Banner & Floating Avatar */}
      <div className="relative mb-16">
        <div className="h-48 md:h-64 w-full rounded-2xl bg-gradient-to-r from-primary/30 to-primary/5 overflow-hidden relative border border-border/50">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        </div>
        
        {/* Avatar positioned perfectly on the edge */}
        <div className="absolute bottom-0 left-8 md:left-12 translate-y-1/2 flex items-end gap-6">
          <div className="rounded-full bg-background p-1.5 shadow-md">
            <AvatarUploader />
          </div>
          <div className="pb-2 hidden md:block">
            <h1 className="text-2xl font-bold text-foreground">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0]}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getRoleVariant(user?.role || 1)} className="shadow-none font-medium">
                {getRoleName(user?.role || 1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Title */}
      <div className="mb-8 md:hidden px-2 mt-4">
        <h1 className="text-2xl font-bold text-foreground">
          {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0]}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={getRoleVariant(user?.role || 1)} className="shadow-none font-medium">
            {getRoleName(user?.role || 1)}
          </Badge>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 space-x-8">
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger 
            value="edit" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1"
          >
            Chỉnh sửa Hồ sơ
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 gap-6">
            
            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Tên hiển thị</Label>
                      <p className="font-medium">{user?.firstName ? `${user.firstName} ${user.lastName}` : "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Địa chỉ Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Vai trò</Label>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{getRoleName(user?.role || 1)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user?.role === ROLES.STUDENT && (
                <BecomeInstructorSection />
              )}
            </div>

          </div>
        </TabsContent>

        {/* TAB 2: EDIT PROFILE */}
        <TabsContent value="edit" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Chỉnh sửa thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật Tên và Họ của bạn để mọi người có thể dễ dàng nhận ra bạn trên LearnHub.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Tên (First Name)</Label>
                  <Input 
                    id="edit-firstName" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Họ (Last Name)</Label>
                  <Input 
                    id="edit-lastName" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nhập họ của bạn"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (Chỉ đọc)</Label>
                <Input 
                  id="edit-email" 
                  value={user?.email || ""} 
                  readOnly 
                  disabled
                  className="bg-muted/50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email là định danh duy nhất và không thể thay đổi ở trang này.</p>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setFirstName(user?.firstName || "");
                setLastName(user?.lastName || "");
              }} disabled={isUpdating}>
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
