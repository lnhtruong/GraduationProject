"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useCartSummary } from "@/features/cart/api/cart.hooks";
import { canAccessInstructor } from "@/lib/roles";
import { useUiModeStore } from "@/store/ui-mode";
import type { User as AuthUser } from "@/store/auth";

interface NewsfeedHeaderProps {
  onToggleMenu: () => void;
  isAuthenticated: boolean;
  user?: AuthUser | null;
  onLogout: () => void | Promise<void>;
}

export function NewsfeedHeader({
  onToggleMenu,
  isAuthenticated,
  user,
  onLogout,
}: NewsfeedHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useUiModeStore();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const canUseTeacherMode = canAccessInstructor(user?.role);
  const isTeacherMode = canUseTeacherMode && viewMode === "teacher";
  const { data: cartSummary } = useCartSummary(isAuthenticated && !isTeacherMode);
  const cartCount = cartSummary?.itemCount ?? 0;

  const switchMode = () => {
    const nextMode = isTeacherMode ? "learner" : "teacher";
    setViewMode(nextMode);
    router.push(nextMode === "teacher" ? "/instructor/dashboard" : "/");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/92 shadow-xs backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 w-full items-center">
        <div className="flex h-full w-16 shrink-0 items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mở hoặc thu gọn menu bảng tin"
            onClick={onToggleMenu}
            className="h-9 w-9 shrink-0 rounded-full border border-border/70 sm:h-10 sm:w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="mx-auto flex h-full min-w-0 flex-1 max-w-screen-2xl items-center gap-2 pr-2 sm:gap-3 sm:pr-5 lg:pr-8">
          <BrandLogo className="md:hidden" />
          <BrandLogo compact className="hidden md:flex lg:hidden [&>div]:hidden" />
          <BrandLogo className="hidden lg:flex" />

          <div className="hidden min-w-[280px] flex-1 justify-center px-2 md:flex">
            <SearchBar
              searchPath="/newsfeed/search"
              className="max-w-xl"
              placeholder="Tìm clip, kỹ năng, chủ đề muốn học..."
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={isMobileSearchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
              onClick={() => setIsMobileSearchOpen((open) => !open)}
              className="h-9 w-9 rounded-full border border-border/70 sm:h-10 sm:w-10 md:hidden"
            >
              {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

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

            {isAuthenticated ? (
              <HeaderUserMenu
                user={user}
                isTeacherMode={isTeacherMode}
                canUseTeacherMode={canUseTeacherMode}
                onSwitchMode={switchMode}
                onLogout={onLogout}
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
      </div>

      {isMobileSearchOpen ? (
        <div className="border-t border-border/70 px-3 py-3 md:hidden">
          <SearchBar
            searchPath="/newsfeed/search"
            className="max-w-none"
            placeholder="Tìm clip, kỹ năng, chủ đề muốn học..."
          />
        </div>
      ) : null}
    </header>
  );
}
