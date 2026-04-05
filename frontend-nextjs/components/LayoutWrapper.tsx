"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import Footer from "./Footer";

/**
 * Conditional Layout Wrapper
 * Hides Header/Footer for auth pages
 */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Auth pages không hiển thị Header/Footer
  const isAuthPage =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");

  const isEditorShellPage = pathname?.startsWith("/editor");
  const isImmersivePage = pathname?.startsWith("/newsfeed");

  if (isAuthPage || isEditorShellPage || isImmersivePage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
