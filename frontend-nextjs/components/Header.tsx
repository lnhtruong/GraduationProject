"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Menu,
  User,
  LogOut,
  Settings,
  FolderOpen,
  BookOpen,
  GraduationCap,
  ShoppingCart,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/features/cart/hooks/useCartStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canAccessInstructor } from "@/lib/roles";
import { useUiModeStore } from "@/store/ui-mode";

const LEARNER_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Video AI", href: "/upload" },
];

const TEACHER_NAV_ITEMS = [
  { label: "Dashboard", href: "/instructor/dashboard" },
  { label: "Courses", href: "/instructor/courses" },
  { label: "Shorts Feed", href: "/instructor/shorts" },
  { label: "Q&A", href: "/instructor/qa" },
  { label: "Analytics", href: "/instructor/analytics" },
];

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useUiModeStore();
  const [isDesktopSearchVisible, setIsDesktopSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const canUseTeacherMode = canAccessInstructor(user?.role);
  const isTeacherMode = canUseTeacherMode && viewMode === "teacher";

  useEffect(() => {
    if (
      pathname.startsWith("/instructor") &&
      canUseTeacherMode &&
      useUiModeStore.getState().viewMode !== "teacher"
    ) {
      setViewMode("teacher");
    }
  }, [pathname, canUseTeacherMode, setViewMode]);

  const navItems = isTeacherMode ? TEACHER_NAV_ITEMS : LEARNER_NAV_ITEMS;

  // [MOCK] lấy count từ local Zustand store
  // [SWAP] Dùng useCartSummary() từ cart.hooks.ts khi backend sẵn sàng:
  //   const { data } = useCartSummary();
  //   const cartCount = data?.itemCount ?? 0;
  const cartCount = useCartStore((state) => state.getItemCount());

  useEffect(() => {
    if (isDesktopSearchVisible && desktopSearchInputRef.current) {
      desktopSearchInputRef.current.focus();
    }
  }, [isDesktopSearchVisible]);

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.email || "User";
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-primary/50 bg-primary/60 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-primary/30 dark:bg-primary/18"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex h-16 w-full items-center justify-between gap-3 px-2 sm:px-3 lg:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo and Title */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/"
              className="mr-1 flex items-center gap-2 rounded-lg px-1 py-1"
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={44}
                height={44}
                className="rounded"
              />
              <span className="hidden text-base font-semibold tracking-tight sm:inline">
                LearnHub
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav
            className={cn(
              "hidden items-center gap-1 rounded-xl border border-primary/20 bg-background/80 p-1 shadow-sm md:flex",
              isDesktopSearchVisible ? "hidden" : "hidden md:flex",
            )}
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    "h-8 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
                    isActive &&
                      "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30",
                  )}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>

          {/* Mobile Navigation */}
          {!isDesktopSearchVisible && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-border/70 md:hidden"
                  aria-label="Mở điều hướng"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 md:hidden">
                <DropdownMenuLabel>
                  {isTeacherMode ? "Teacher Navigation" : "Main Navigation"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right Side Controls */}
        <div className={cn("flex items-center justify-end gap-2")}>
          {/* Desktop Search Form */}
          {isDesktopSearchVisible && (
            <form className="ml-auto hidden items-center gap-1 md:flex md:w-72 lg:w-96">
              <Input
                ref={desktopSearchInputRef}
                type="search"
                placeholder="Tìm kiếm mọi thứ..."
                className="h-9 flex-1 rounded-full bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Tìm kiếm"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Submit search"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsDesktopSearchVisible(false)}
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </Button>
            </form>
          )}

          {!isDesktopSearchVisible && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-full border border-border/70 md:inline-flex"
              onClick={() => setIsDesktopSearchVisible(true)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Cart icon — chỉ hiện khi đã đăng nhập */}
          {isAuthenticated && (
            <div className={cn(isDesktopSearchVisible ? "hidden md:flex" : "flex")}>
              <Link href="/cart" aria-label="Giỏ hàng">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          )}

          <div
            className={cn(isDesktopSearchVisible ? "hidden md:flex" : "flex")}
          >
            <ThemeToggle />
          </div>

          {/* Auth Section */}
          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full border border-border/70"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/workspace" className="cursor-pointer">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span>Không gian làm việc</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/library" className="cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Thư viện video & ảnh</span>
                    </Link>
                  </DropdownMenuItem>
                  {/* Teacher Mode — chỉ hiện với LECTURER và ADMIN */}
                  {canAccessInstructor(user?.role) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(event) => event.preventDefault()}
                        className="mx-1.5 my-1 flex w-[calc(100%-0.75rem)] cursor-default items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 focus:bg-primary/10"
                      >
                        <div className="flex items-start gap-2.5">
                          <GraduationCap className="mt-0.5 h-4 w-4 text-primary" />
                          <div className="leading-tight">
                            <p className="text-sm font-semibold text-primary">
                              Teacher Mode
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Chuyển sang không gian giảng viên
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isTeacherMode}
                          onCheckedChange={(checked) => {
                            setViewMode(checked ? "teacher" : "learner");
                            router.push(
                              checked ? "/instructor/dashboard" : "/",
                            );
                          }}
                          aria-label="Teacher mode switch"
                        />
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin">Đăng nhập</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="sm" asChild>
                  <Link href="/signup">Đăng ký</Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
