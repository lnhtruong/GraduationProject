"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShieldCheck,
  ChevronRight,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Báo cáo vi phạm",
    href: "/admin/reports",
    icon: Flag,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border/60 bg-background">
      {/* Sidebar header */}
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Admin Panel</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Quản trị hệ thống
          </p>
        </div>
      </div>

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

      {/* Footer hint */}
      <div className="border-t border-border/60 px-4 py-3">
        <p className="text-[11px] text-muted-foreground/50">
          Chỉ Admin mới truy cập được khu vực này
        </p>
      </div>
    </aside>
  );
}
