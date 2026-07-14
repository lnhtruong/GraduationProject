"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/BrandLogo";
import { AdminSidebarNav } from "./AdminSidebar";

/** Hamburger + Sheet trượt trái — điều hướng admin trên màn hình dưới lg. */
export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở menu quản trị</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 max-w-[80vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border/60 px-4 py-3 text-left">
          <SheetTitle asChild>
            <BrandLogo
              compact
              badge="Admin"
              subtitle="Quản trị hệ thống"
              className="px-0 hover:bg-transparent"
            />
          </SheetTitle>
        </SheetHeader>
        <AdminSidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
