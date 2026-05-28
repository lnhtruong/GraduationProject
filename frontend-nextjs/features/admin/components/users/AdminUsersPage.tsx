"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Ban,
  KeyRound,
  MoreHorizontal,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminUsers, useAdminUpdateUser, useAdminResetPassword } from "../../api/admin-users.hooks";
import type { AdminUser } from "../../api/admin-users.api";
import { ROLES, getRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";

type RoleFilter = "all" | "1" | "2" | "3";
type BanFilter = "all" | "active" | "banned";

const PAGE_SIZE = 15;

type ConfirmAction =
  | { type: "ban"; user: AdminUser }
  | { type: "unban"; user: AdminUser }
  | { type: "reset-password"; user: AdminUser }
  | { type: "change-role"; user: AdminUser; newRole: number };

function getRoleIcon(role: number) {
  switch (role) {
    case ROLES.ADMIN:
      return <ShieldCheck className="h-3.5 w-3.5 text-primary" />;
    case ROLES.LECTURER:
      return <BookOpen className="h-3.5 w-3.5 text-blue-500" />;
    default:
      return <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function getRoleBadgeClass(role: number): string {
  switch (role) {
    case ROLES.ADMIN:
      return "bg-primary/15 text-primary border-primary/20";
    case ROLES.LECTURER:
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getUserInitials(user: AdminUser): string {
  const first = user.firstName?.trim() || "";
  const last = user.lastName?.trim() || "";
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

function getFullName(user: AdminUser): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "";
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [banFilter, setBanFilter] = useState<BanFilter>("all");
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, isError, refetch } = useAdminUsers();
  const updateUser = useAdminUpdateUser();
  const resetPassword = useAdminResetPassword();

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.firstName ?? "").toLowerCase().includes(q) ||
        (u.lastName ?? "").toLowerCase().includes(q);

      const matchesRole =
        roleFilter === "all" || String(u.role) === roleFilter;

      const matchesBan =
        banFilter === "all" ||
        (banFilter === "banned" && u.isBanned) ||
        (banFilter === "active" && !u.isBanned);

      return matchesSearch && matchesRole && matchesBan;
    });
  }, [users, search, roleFilter, banFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.type) {
        case "ban":
          await updateUser.mutateAsync({ id: confirmAction.user.id, dto: { isBanned: true } });
          toast.success(`Đã khoá tài khoản ${confirmAction.user.email}`);
          break;
        case "unban":
          await updateUser.mutateAsync({ id: confirmAction.user.id, dto: { isBanned: false } });
          toast.success(`Đã mở khoá tài khoản ${confirmAction.user.email}`);
          break;
        case "reset-password":
          await resetPassword.mutateAsync(confirmAction.user.id);
          toast.success(`Đã đặt lại mật khẩu cho ${confirmAction.user.email}`);
          break;
        case "change-role":
          await updateUser.mutateAsync({ id: confirmAction.user.id, dto: { role: confirmAction.newRole } });
          toast.success(`Đã đổi vai trò thành ${getRoleName(confirmAction.newRole)}`);
          break;
      }
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setConfirmAction(null);
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === ROLES.ADMIN).length,
    lecturers: users.filter((u) => u.role === ROLES.LECTURER).length,
    banned: users.filter((u) => u.isBanned).length,
  };

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div>
          <p className="font-semibold">Không thể tải danh sách người dùng</p>
          <p className="mt-1 text-sm text-muted-foreground">Vui lòng thử lại</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Users className="h-5 w-5 text-primary" />
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem, phân quyền và quản lý tài khoản người dùng
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isLoading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Tổng người dùng", value: stats.total, color: "text-foreground" },
          { label: "Quản trị viên", value: stats.admins, color: "text-primary" },
          { label: "Giảng viên", value: stats.lecturers, color: "text-blue-600" },
          { label: "Đã bị khoá", value: stats.banned, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", s.color)}>{isLoading ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1" style={{ minWidth: 200, maxWidth: 340 }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email hoặc tên..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as RoleFilter); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="1">Quản trị viên</SelectItem>
            <SelectItem value="3">Giảng viên</SelectItem>
            <SelectItem value="2">Học viên</SelectItem>
          </SelectContent>
        </Select>
        <Select value={banFilter} onValueChange={(v) => { setBanFilter(v as BanFilter); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="banned">Đã bị khoá</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Người dùng</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vai trò</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ngày tạo</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground">
                    <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
                    <p className="font-medium">Không tìm thấy người dùng</p>
                    <p className="mt-1 text-xs">Thử thay đổi bộ lọc tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                paged.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/40 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={user.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">{getUserInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          {getFullName(user) && (
                            <p className="truncate font-medium leading-none">{getFullName(user)}</p>
                          )}
                          <p className={cn("truncate text-xs text-muted-foreground", !getFullName(user) && "font-medium text-foreground text-sm")}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("gap-1 text-[11px]", getRoleBadgeClass(user.role))}>
                        {getRoleIcon(user.role)}
                        {getRoleName(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[11px]">
                          Đã bị khoá
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]">
                          Hoạt động
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {/* Đổi vai trò */}
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Vai trò</DropdownMenuLabel>
                          {([
                            { role: ROLES.STUDENT, label: "Học viên" },
                            { role: ROLES.LECTURER, label: "Giảng viên" },
                            { role: ROLES.ADMIN, label: "Quản trị viên" },
                          ] as const)
                            .filter((r) => r.role !== user.role)
                            .map((r) => {
                              const isSelf = currentUser?.id === user.id;
                              return (
                                <DropdownMenuItem
                                  key={r.role}
                                  disabled={isSelf}
                                  title={isSelf ? "Không thể thay đổi tài khoản của chính bạn" : undefined}
                                  onClick={() =>
                                    !isSelf &&
                                    setConfirmAction({ type: "change-role", user, newRole: r.role })
                                  }
                                >
                                  Đổi thành {r.label}
                                </DropdownMenuItem>
                              );
                            })}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Tài khoản</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: "reset-password", user })}
                          >
                            <KeyRound className="mr-2 h-3.5 w-3.5" />
                            Đặt lại mật khẩu
                          </DropdownMenuItem>
                          {(() => {
                            const isSelf = currentUser?.id === user.id;
                            return user.isBanned ? (
                              <DropdownMenuItem
                                disabled={isSelf}
                                className="text-emerald-600 focus:text-emerald-600"
                                title={isSelf ? "Không thể thay đổi tài khoản của chính bạn" : undefined}
                                onClick={() =>
                                  !isSelf && setConfirmAction({ type: "unban", user })
                                }
                              >
                                <Ban className="mr-2 h-3.5 w-3.5" />
                                Mở khoá tài khoản
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled={isSelf}
                                className="text-destructive focus:text-destructive"
                                title={isSelf ? "Không thể thay đổi tài khoản của chính bạn" : undefined}
                                onClick={() =>
                                  !isSelf && setConfirmAction({ type: "ban", user })
                                }
                              >
                                <Ban className="mr-2 h-3.5 w-3.5" />
                                Khoá tài khoản
                              </DropdownMenuItem>
                            );
                          })()}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} người dùng
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[4rem] text-center text-xs">
                Trang {currentPage}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmAction?.type === "ban" && "Khoá tài khoản"}
              {confirmAction?.type === "unban" && "Mở khoá tài khoản"}
              {confirmAction?.type === "reset-password" && "Đặt lại mật khẩu"}
              {confirmAction?.type === "change-role" && "Đổi vai trò"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmAction?.type === "ban" && (
                <>Bạn có chắc muốn khoá tài khoản <strong>{confirmAction.user.email}</strong>? Người dùng sẽ không thể đăng nhập.</>
              )}
              {confirmAction?.type === "unban" && (
                <>Bạn có chắc muốn mở khoá tài khoản <strong>{confirmAction.user.email}</strong>?</>
              )}
              {confirmAction?.type === "reset-password" && (
                <>Đặt lại mật khẩu của <strong>{confirmAction.user.email}</strong> về mật khẩu mặc định?</>
              )}
              {confirmAction?.type === "change-role" && (
                <>Đổi vai trò của <strong>{confirmAction.user.email}</strong> thành <strong>{getRoleName(confirmAction.newRole)}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Huỷ
            </Button>
            <Button
              variant={confirmAction?.type === "ban" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={updateUser.isPending || resetPassword.isPending}
            >
              {(updateUser.isPending || resetPassword.isPending) ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
