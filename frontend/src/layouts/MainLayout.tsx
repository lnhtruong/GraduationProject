import { Button } from "@/components/ui/button";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { Avatar } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { Suspense } from "react";
import { Link, Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md grid place-items-center text-white font-bold">
                  <img src="/logo.png" alt="Logo" className="w-6 h-6" />
                </div>
                <span className="font-semibold text-lg text-primary">
                  LearnHub
                </span>
              </Link>

              <NavigationMenu className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-primary">
                  Trang chủ
                </Link>
                <Link to="/upload" className="hover:text-primary">
                  Tạo nội dung
                </Link>
              </NavigationMenu>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" className="px-2 py-1 rounded-full">
                <Search className="size-4 text-muted-foreground" />
              </Button>

              <Avatar className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center text-sm">
                U
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
