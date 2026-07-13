"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ChevronRight,
  Flag,
  Wallet,
  GraduationCap,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { getUserDisplayName } from "@/lib/user-display";

const NAV_ITEMS = [
  {
    label: "Tổng quan",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Duyệt khóa học",
    href: "/admin/courses",
    icon: BookOpen,
  },
  { label: "Người dùng", href: "/admin/users", icon: Users },
  {
    label: "Doanh thu",
    href: "/admin/revenue",
    icon: Wallet,
  },
  {
    label: "Yêu cầu Giảng viên",
    href: "/admin/lecturer-requests",
    icon: GraduationCap,
  },
  {
    label: "Báo cáo vi phạm",
    href: "/admin/reports",
    icon: Flag,
  },
];

/**
 * Nội dung điều hướng dùng chung cho sidebar desktop (aside cố định) và
 * sidebar mobile (bên trong Sheet trượt từ trái, xem AdminMobileSidebar).
 */
export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName = getUserDisplayName(user, "Quản trị viên");

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Chức năng
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground/70",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-border/60 px-3 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
          <UserAvatar
            user={user}
            fallback="AD"
            className="h-8 w-8"
            fallbackClassName="text-xs"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{displayName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          Quay về trang chủ
        </Link>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive/80 hover:bg-destructive/5 hover:text-destructive transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Đăng xuất
        </button>
      </div>
    </>
  );
}

/** Sidebar cố định — chỉ hiển thị từ breakpoint lg trở lên. */
export function AdminSidebar() {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border/60 bg-background lg:flex">
      <div className="border-b border-border/60 px-4 py-3">
        <BrandLogo
          compact
          badge="Admin"
          subtitle="Quản trị hệ thống"
          className="px-0 hover:bg-transparent"
        />
      </div>
      <AdminSidebarNav />
    </aside>
  );
}
