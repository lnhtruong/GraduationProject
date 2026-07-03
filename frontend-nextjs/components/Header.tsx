"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingCart,
  X,
  Menu,
  User,
  LogOut,
  FolderOpen,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Heart,
  Repeat,
  LayoutDashboard,
  Sun,
  Moon,
  MonitorSmartphone,
  MonitorPlay,
  Briefcase,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

import { SearchBar } from "@/components/SearchBar";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { canAccessInstructor, getRoleName, ROLES } from "@/lib/roles";
import { useUiModeStore } from "@/store/ui-mode";
import { useCartSummary } from "@/features/cart/api/cart.hooks";

const LEARNER_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Newsfeed", href: "/newsfeed" },
  { label: "Tạo Short/Highlight", href: "/upload" },
];

const TEACHER_NAV_ITEMS = [
  { label: "Dashboard", href: "/instructor/dashboard" },
  { label: "Courses", href: "/instructor/courses" },
  { label: "Roadmaps", href: "/instructor/roadmaps" },
  { label: "Q&A", href: "/instructor/qa" },
  { label: "Analytics", href: "/instructor/analytics" },
];

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useUiModeStore();
  const { theme, setTheme } = useTheme();
  const [isDesktopSearchVisible, setIsDesktopSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const canUseTeacherMode = canAccessInstructor(user?.role);
  const isTeacherMode = canUseTeacherMode && viewMode === "teacher";
  const shouldFetchCartSummary = pathname === "/cart";
  const { data: cartSummary } = useCartSummary(shouldFetchCartSummary);
  const cartCount = isAuthenticated ? (cartSummary?.itemCount ?? 0) : 0;

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
      className="sticky top-0 z-50 w-full border-b border-primary/20 dark:border-border/40 bg-primary/95 dark:bg-card/85 shadow-md backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex h-16 w-full items-center justify-between gap-3 px-2 sm:px-3 lg:px-4">
        <div className={cn("items-center gap-2 sm:gap-3", isDesktopSearchVisible ? "hidden lg:flex" : "flex")}>
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
              "hidden items-center gap-1 rounded-xl border border-primary/20 bg-background/80 p-1 shadow-sm lg:flex",
              isDesktopSearchVisible ? "hidden" : "hidden lg:flex",
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
                    "h-8 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-background/10 dark:hover:bg-primary/5",
                    isActive &&
                      "bg-background/80 text-foreground dark:bg-primary/20 dark:text-primary shadow-sm ring-1 ring-primary/30",
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
                  className="h-9 w-9 rounded-full border border-border/70 lg:hidden"
                  aria-label="Mở điều hướng"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 lg:hidden">
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
        <div className={cn("flex items-center justify-end gap-2", isDesktopSearchVisible ? "w-full lg:w-auto" : "")}>
          {/* Search Form (Mobile & Desktop) */}
          {isDesktopSearchVisible && (
            <div className="flex w-full items-center gap-1 lg:ml-auto lg:w-96">
              <SearchBar className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsDesktopSearchVisible(false)}
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {!isDesktopSearchVisible && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-border/70"
              onClick={() => setIsDesktopSearchVisible(true)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {!isDesktopSearchVisible && !isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border/70"
                  aria-label="Thay đổi giao diện"
                >
                  {theme === "light" ? (
                    <Sun className="h-5 w-5" />
                  ) : theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <MonitorSmartphone className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Giao diện sáng</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Giao diện tối</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                  <MonitorSmartphone className="mr-2 h-4 w-4" />
                  <span>Giao diện thiết bị</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Cart icon — chỉ hiện khi không phải teacher mode */}
          {isAuthenticated && !isTeacherMode && (
            <div
              className={cn(isDesktopSearchVisible ? "hidden lg:flex" : "flex")}
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full border border-border/70"
                asChild
              >
                <Link href="/cart" aria-label="Giỏ hàng">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          )}





          {isAuthenticated ? (
            <NotificationBell className="lg:inline-flex" />
          ) : null}

          {/* Auth Section */}
          {isAuthenticated ? (
            <motion.div
              className={cn(isDesktopSearchVisible ? "hidden lg:block" : "block")}
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
                        <AvatarImage
                          src={user?.avatarUrl ?? undefined}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <p className="text-[10px] leading-none text-muted-foreground/50">
                        {getRoleName(user?.role ?? 0)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Admin Panel — Top Priority */}
                  {user?.role === ROLES.ADMIN && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          href={pathname.startsWith("/admin") ? "/" : "/admin"}
                          className="cursor-pointer text-primary focus:bg-primary/5 focus:text-primary font-semibold"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                          <span>{pathname.startsWith("/admin") ? "LearnHub" : "Admin Studio"}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* YouTube Studio Style Switch */}
                  {canUseTeacherMode && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer text-primary focus:bg-primary/5 focus:text-primary font-semibold"
                        onClick={(e) => {
                          e.preventDefault();
                          setViewMode(isTeacherMode ? "learner" : "teacher");
                          router.push(isTeacherMode ? "/" : "/instructor/dashboard");
                        }}
                      >
                        <MonitorPlay className="mr-2 h-4 w-4 text-primary" />
                        <span>{isTeacherMode ? "LearnHub" : "LearnHub Studio"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Contextual Menu Items */}
                  {isTeacherMode ? (
                    <>
                      {/* Teacher View */}
                      <DropdownMenuItem asChild>
                        <Link href="/instructor/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Bảng điều khiển</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/instructor/courses" className="cursor-pointer">
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>Quản lý khóa học</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/library" className="cursor-pointer">
                          <FolderOpen className="mr-2 h-4 w-4" />
                          <span>Thư viện Media</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/instructor/analytics" className="cursor-pointer">
                          <Search className="mr-2 h-4 w-4" />
                          <span>Doanh thu & Phân tích</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {/* Learner View */}
                      <DropdownMenuItem asChild>
                        <Link href="/my-courses" className="cursor-pointer">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          <span>Học tập của tôi</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/workspace" className="cursor-pointer">
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>Workspace của tôi</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wishlist" className="cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          <span>Khóa học đã lưu</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="lg:hidden">
                        <Link href="/cart" className="cursor-pointer">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Giỏ hàng của tôi</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}



                  {/* Theme Toggle Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {theme === "light" ? (
                        <Sun className="mr-2 h-4 w-4" />
                      ) : theme === "dark" ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <MonitorSmartphone className="mr-2 h-4 w-4" />
                      )}
                      <span>Giao diện: {theme === "light" ? "Sáng" : theme === "dark" ? "Tối" : "Thiết bị"}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-56">
                        <DropdownMenuCheckboxItem 
                          checked={theme === "system"} 
                          onCheckedChange={() => setTheme("system")}
                        >
                          Giao diện thiết bị
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem 
                          checked={theme === "dark"} 
                          onCheckedChange={() => setTheme("dark")}
                        >
                          Giao diện tối
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem 
                          checked={theme === "light"} 
                          onCheckedChange={() => setTheme("light")}
                        >
                          Giao diện sáng
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    variant="destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-destructive" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ) : (
            <motion.div
              className={cn("flex items-center gap-2", isDesktopSearchVisible ? "hidden lg:flex" : "flex")}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="sm" 
                  asChild
                  className="rounded-full bg-background text-foreground hover:bg-background/90 border border-border/70 dark:bg-transparent dark:text-primary dark:border dark:border-primary dark:hover:bg-primary/10 font-semibold px-4 shadow-sm"
                >
                  <Link href={`/signin?returnUrl=${encodeURIComponent(pathname)}`}>Đăng nhập</Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
