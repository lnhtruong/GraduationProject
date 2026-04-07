"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Search,
  X,
  User,
  LogOut,
  Settings,
  FolderOpen,
  BookOpen,
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDesktopSearchVisible, setIsDesktopSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

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
      className="sticky top-0 z-50 w-full border-b bg-accent shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo and Title */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded"
            />
            <span
              className={cn(
                "font-bold",
                isDesktopSearchVisible
                  ? "hidden sm:inline-block"
                  : "hidden sm:inline-block",
              )}
            >
              LearnHub
            </span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav
          className={cn(
            "items-center gap-4 lg:gap-6",
            isDesktopSearchVisible ? "hidden" : "hidden md:flex",
          )}
        >
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/upload">Video AI</Link>
          </Button>
        </nav>

        {/* Right Side Controls */}
        <div className={cn("flex flex-1 items-center justify-end gap-2")}>
          {/* Desktop Search Form */}
          {isDesktopSearchVisible && (
            <form className="hidden md:flex flex-1 items-center gap-1 max-w-sm lg:max-w-md ml-auto">
              <Input
                ref={desktopSearchInputRef}
                type="search"
                placeholder="Tìm kiếm mọi thứ..."
                className="h-9 flex-1 bg-background text-foreground"
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
              className="hidden md:inline-flex"
              onClick={() => setIsDesktopSearchVisible(true)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
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
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
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
