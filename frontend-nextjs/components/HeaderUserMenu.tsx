"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Library,
  LogOut,
  MonitorPlay,
  MonitorSmartphone,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";

import { RoleBadge } from "@/components/RoleBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND } from "@/lib/brand";
import { ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { getUserDisplayName } from "@/lib/user-display";
import { useTheme } from "@/hooks/useTheme";
import type { User as AuthUser } from "@/store/auth";

interface HeaderUserMenuProps {
  user?: AuthUser | null;
  isTeacherMode: boolean;
  canUseTeacherMode: boolean;
  onSwitchMode: () => void;
  onLogout: () => void | Promise<void>;
  className?: string;
}

export function HeaderUserMenu({
  user,
  isTeacherMode,
  canUseTeacherMode,
  onSwitchMode,
  onLogout,
  className,
}: HeaderUserMenuProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [menuView, setMenuView] = useState<"main" | "theme">("main");
  const displayName = getUserDisplayName(user);
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : MonitorSmartphone;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setMenuView("main");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-9 max-w-[13.5rem] shrink-0 gap-2 overflow-hidden rounded-full border border-border/70 bg-background px-1.5 pr-2 shadow-sm transition hover:border-primary/40 hover:bg-muted/50 sm:h-10 lg:h-12 lg:max-w-[14.5rem] lg:px-2 lg:pr-3",
            className,
          )}
        >
          <UserAvatar user={user} className="h-7 w-7 ring-1 ring-border/80 sm:h-8 sm:w-8" />

          <div className="hidden min-w-0 flex-1 flex-col items-start gap-0.5 overflow-hidden leading-none lg:flex">
            <span className="max-w-full truncate text-sm font-semibold text-foreground">
              {displayName}
            </span>
            <RoleBadge
              role={user?.role}
              className="h-5 min-w-[4.75rem] justify-center px-2 py-0 text-[10px] leading-none [&_svg]:h-3 [&_svg]:w-3"
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {menuView === "main" ? (
          <>
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                <RoleBadge role={user?.role} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role === ROLES.ADMIN ? (
              <DropdownMenuItem asChild>
                <Link href={pathname.startsWith("/admin") ? "/" : "/admin"}>
                  <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                  {pathname.startsWith("/admin") ? `Về ${BRAND.name}` : "Quản trị"}
                </Link>
              </DropdownMenuItem>
            ) : null}
            {canUseTeacherMode ? (
              <DropdownMenuItem onClick={onSwitchMode}>
                <MonitorPlay className="mr-2 h-4 w-4 text-primary" />
                {isTeacherMode ? "Chế độ học viên" : "Khu giảng viên"}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            {isTeacherMode ? (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/instructor/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Bảng điều khiển
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/instructor/courses">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Quản lý khóa học
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/library">
                    <Library className="mr-2 h-4 w-4" />
                    Thư viện media
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/my-courses">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Học tập của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/workspace">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Workspace của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist">
                    <Heart className="mr-2 h-4 w-4" />
                    Khóa học đã lưu
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setMenuView("theme");
              }}
              className="cursor-pointer justify-between"
            >
              <span className="flex items-center gap-2">
                <ThemeIcon className="mr-2 h-4 w-4" />
                Giao diện:{" "}
                {theme === "light" ? "Sáng" : theme === "dark" ? "Tối" : "Theo thiết bị"}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Hồ sơ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void onLogout()}
              variant="destructive"
              className="focus:bg-destructive/10 data-[highlighted]:bg-destructive/10 dark:focus:bg-destructive/20 dark:data-[highlighted]:bg-destructive/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-muted"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setMenuView("main");
                }}
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </Button>
              <span>Giao diện</span>
            </div>
            {[
              ["system", MonitorSmartphone, "Theo thiết bị"],
              ["light", Sun, "Sáng"],
              ["dark", Moon, "Tối"],
            ].map(([value, Icon, label]) => (
              <DropdownMenuItem
                key={value as string}
                onSelect={(event) => {
                  event.preventDefault();
                  setTheme(value as "system" | "light" | "dark");
                }}
                className="flex cursor-pointer items-center"
              >
                <div className="flex w-6 shrink-0 items-center justify-center">
                  {theme === value && <Check className="h-4 w-4 text-foreground" />}
                </div>
                <Icon className="mr-2 h-4 w-4" />
                <span>{label as string}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
