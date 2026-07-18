"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  MonitorSmartphone,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  User,
  X,
} from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { SearchBar } from "@/components/SearchBar";
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
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useCartSummary } from "@/features/cart/api/cart.hooks";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { canAccessInstructor } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useUiModeStore } from "@/store/ui-mode";

const LEARNER_NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Bảng tin", href: "/newsfeed" },
  { label: "Tạo highlight", href: "/upload" },
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
    return isTeacherMode ? TEACHER_NAV_ITEMS : LEARNER_NAV_ITEMS;
  }, [isTeacherMode]);

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

  const switchMode = () => {
    const nextMode = isTeacherMode ? "learner" : "teacher";
    setViewMode(nextMode);
    router.push(nextMode === "teacher" ? "/instructor/dashboard" : "/");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : MonitorSmartphone;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 shadow-xs backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-2 px-2 sm:gap-3 sm:px-5 lg:px-8">
        <BrandLogo />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full border border-border/70 sm:h-10 sm:w-10 lg:hidden"
              aria-label="Mở điều hướng"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 lg:hidden">
            {navItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {!shouldHideHeaderSearch ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-border/70 sm:h-10 sm:w-10 lg:hidden"
              onClick={() => setIsMobileSearchOpen((value) => !value)}
              aria-label={isMobileSearchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
            >
              {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
          ) : null}

          {isAuthenticated && !isTeacherMode ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full border border-border/70 sm:h-10 sm:w-10"
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

          {isAuthenticated ? (
            <NotificationBell className="h-9 w-9 bg-transparent hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground sm:h-10 sm:w-10" />
          ) : null}

          {!isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-border/70 sm:h-10 sm:w-10"
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
          ) : null}

          {isAuthenticated ? (
            <HeaderUserMenu
              user={user}
              isTeacherMode={isTeacherMode}
              canUseTeacherMode={canUseTeacherMode}
              onSwitchMode={switchMode}
              onLogout={() => void logout()}
            />
          ) : (
            <Button
              asChild
              className="h-9 w-9 shrink-0 overflow-hidden rounded-full p-0 font-bold sm:h-10 sm:w-auto sm:px-5"
            >
              <Link
                href={`/signin?returnUrl=${encodeURIComponent(pathname)}`}
                aria-label="Đăng nhập"
                className="flex items-center justify-center gap-1.5 overflow-hidden sm:overflow-visible"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng nhập</span>
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
