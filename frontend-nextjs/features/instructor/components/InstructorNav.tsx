"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  { label: "Dashboard", href: "/instructor/dashboard" },
  { label: "Courses", href: "/instructor/courses" },
  { label: "Shorts Feed", href: "/instructor/shorts" },
  { label: "Q&A", href: "/instructor/qa" },
  { label: "Analytics", href: "/instructor/analytics" },
];

export function InstructorNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName} ${user.lastName}`;
    if (user?.firstName) return user.firstName;
    return user?.email ?? "Giảng viên";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 lg:px-8">
        {/* Logo — click về learner view */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          title="Về trang học viên"
        >
          <Image
            src="/logo.png"
            alt="LearnHub"
            width={28}
            height={28}
            className="rounded"
          />
          <span className="hidden font-bold sm:inline">LearnHub</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            Teacher
          </span>
        </Link>

        {/* Nav tabs */}
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href;
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

        {/* Right: notification + avatar */}
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell className="h-9 w-9" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-1.5 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={user?.avatarUrl ?? undefined}
                    alt={getUserDisplayName()}
                  />
                  <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  {getUserDisplayName()}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{getUserDisplayName()}</p>
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
                  <span className="mr-2">🎓</span>
                  Về trang học viên
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
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
