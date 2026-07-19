"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, GraduationCap, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { getUserDisplayName } from "@/lib/user-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

const NAV_TABS = [
  { label: "Tổng quan", href: "/instructor/dashboard" },
  { label: "Khóa học", href: "/instructor/courses" },
  { label: "Lộ trình", href: "/instructor/roadmaps" },
  { label: "Hỏi đáp", href: "/instructor/qa" },
  { label: "Phân tích", href: "/instructor/analytics" },
];

export function InstructorNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = getUserDisplayName(user, "Giảng viên");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 lg:gap-6 lg:px-8">
        <BrandLogo compact badge="Giảng viên" />

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_TABS.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-4 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell className="h-9 w-9" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-1.5 px-2">
                <UserAvatar
                  user={user}
                  fallback="GV"
                  className="h-7 w-7"
                  fallbackClassName="text-[11px]"
                />
                <span className="hidden text-sm font-medium sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Hồ sơ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Về trang học viên
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                variant="destructive"
                className="focus:bg-destructive/10 data-[highlighted]:bg-destructive/10 dark:focus:bg-destructive/20 dark:data-[highlighted]:bg-destructive/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
