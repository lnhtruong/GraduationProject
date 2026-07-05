"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MonitorPlay,
  MonitorSmartphone,
  Moon,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sun,
  User,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/SearchBar";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useCartSummary } from "@/features/cart/api/cart.hooks";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { canAccessInstructor, getRoleName, ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useUiModeStore } from "@/store/ui-mode";

const LEARNER_NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Newsfeed", href: "/newsfeed" },
  { label: "Tạo Highlight", href: "/upload" },
];

const TEACHER_NAV_ITEMS = [
  { label: "Tổng quan", href: "/instructor/dashboard" },
  { label: "Khóa học", href: "/instructor/courses" },
  { label: "Lộ trình", href: "/instructor/roadmaps" },
  { label: "Hỏi đáp", href: "/instructor/qa" },
  { label: "Phân tích", href: "/instructor/analytics" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useUiModeStore();
  const { theme, setTheme } = useTheme();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const canUseTeacherMode = canAccessInstructor(user?.role);
  const isTeacherMode = canUseTeacherMode && viewMode === "teacher";
  const shouldHideHeaderSearch = pathname.startsWith("/courses/search");
  const shouldFetchCartSummary = isAuthenticated && !isTeacherMode;
  const { data: cartSummary } = useCartSummary(shouldFetchCartSummary);
  const cartCount = cartSummary?.itemCount ?? 0;

  const navItems = useMemo(() => {
    if (isTeacherMode) return TEACHER_NAV_ITEMS;

    return isAuthenticated
      ? [
          ...LEARNER_NAV_ITEMS,
          { label: "Học của tôi", href: "/my-courses" },
        ]
      : LEARNER_NAV_ITEMS;
  }, [isAuthenticated, isTeacherMode]);

  useEffect(() => {
    if (
      pathname.startsWith("/instructor") &&
      canUseTeacherMode &&
      useUiModeStore.getState().viewMode !== "teacher"
    ) {
      setViewMode("teacher");
    }
  }, [pathname, canUseTeacherMode, setViewMode]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMobileSearchOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Người dùng";

  const userInitials = (() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }

    return (user?.email?.[0] ?? "U").toUpperCase();
  })();

  const switchMode = () => {
    const nextMode = isTeacherMode ? "learner" : "teacher";
    setViewMode(nextMode);
    router.push(nextMode === "teacher" ? "/instructor/dashboard" : "/");
  };

  const ThemeIcon =
    theme === "light" ? Sun : theme === "dark" ? Moon : MonitorSmartphone;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 shadow-xs backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-3 sm:px-5 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-xl px-1 py-1.5 transition-colors hover:bg-muted/60"
        >
          <Image
            src="/logo.png"
            alt="LearnHub"
            width={42}
            height={42}
            priority
            className="h-10 w-10 rounded-xl"
          />
          <div className="hidden leading-tight sm:block">
            <p className="text-base font-extrabold tracking-tight text-foreground">
              LearnHub
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              Học tập thông minh
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary/10 text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!shouldHideHeaderSearch ? (
          <div className="hidden min-w-[280px] flex-1 justify-center px-2 lg:flex">
            <SearchBar
              className="max-w-xl"
              placeholder="Tìm khóa học, giảng viên, chủ đề..."
            />
          </div>
        ) : (
          <div className="hidden flex-1 lg:block" />
        )}

        <div className="ml-auto flex items-center gap-2">
          {!shouldHideHeaderSearch ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-border/70 lg:hidden"
              onClick={() => setIsMobileSearchOpen((value) => !value)}
              aria-label={isMobileSearchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
            >
              {isMobileSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          ) : null}

          {isAuthenticated && !isTeacherMode ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative hidden h-10 w-10 rounded-full border border-border/70 sm:inline-flex"
            >
              <Link href="/cart" aria-label="Giỏ hàng">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>
            </Button>
          ) : null}

          {isAuthenticated ? <NotificationBell className="hidden sm:inline-flex" /> : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border/70"
                aria-label="Đổi giao diện"
              >
                <ThemeIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Giao diện</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={theme === "system"}
                onCheckedChange={() => setTheme("system")}
              >
                <MonitorSmartphone className="mr-2 h-4 w-4" />
                Theo thiết bị
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={theme === "light"}
                onCheckedChange={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Sáng
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={theme === "dark"}
                onCheckedChange={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Tối
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border/70 lg:hidden"
                aria-label="Mở điều hướng"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 lg:hidden">
              <DropdownMenuLabel>Điều hướng</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              {isAuthenticated && !isTeacherMode ? (
                <DropdownMenuItem asChild>
                  <Link href="/cart">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Giỏ hàng của tôi
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 gap-2 rounded-full border border-border/70 px-1.5 pr-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-sm font-semibold lg:inline">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {getRoleName(user?.role ?? 0)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {user?.role === ROLES.ADMIN ? (
                  <DropdownMenuItem asChild>
                    <Link href={pathname.startsWith("/admin") ? "/" : "/admin"}>
                      <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                      {pathname.startsWith("/admin") ? "Về LearnHub" : "Quản trị"}
                    </Link>
                  </DropdownMenuItem>
                ) : null}

                {canUseTeacherMode ? (
                  <DropdownMenuItem onClick={switchMode}>
                    <MonitorPlay className="mr-2 h-4 w-4 text-primary" />
                    {isTeacherMode ? "Chế độ học viên" : "LearnHub Studio"}
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
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void logout()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="h-10 rounded-full px-5 font-bold">
              <Link href={`/signin?returnUrl=${encodeURIComponent(pathname)}`}>
                Đăng nhập
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isMobileSearchOpen && !shouldHideHeaderSearch ? (
        <div className="border-t border-border/70 px-3 py-3 lg:hidden">
          <SearchBar
            className="max-w-none"
            placeholder="Tìm khóa học, giảng viên, chủ đề..."
          />
        </div>
      ) : null}
    </header>
  );
}
