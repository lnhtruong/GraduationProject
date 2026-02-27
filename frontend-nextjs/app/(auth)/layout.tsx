import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication - LearnHub",
  description: "Sign in or create your LearnHub account",
};

/**
 * Auth Layout
 * Modern isolated layout for authentication pages
 * Full-screen design with brand identity
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950">
        {/* Animated shapes */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-300 dark:bg-orange-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Brand header */}
        <div className="container mx-auto px-4 pt-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg transform group-hover:scale-105 transition-transform">
                <span className="text-2xl font-bold text-white">L</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                LearnHub
              </span>
              <span className="text-xs text-muted-foreground -mt-1">Video AI Platform</span>
            </div>
          </Link>
        </div>

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center p-4">
          {children}
        </div>

        {/* Footer */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 LearnHub. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
