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
  const isAuthPage = pathname?.startsWith("/signin") || pathname?.startsWith("/signup");

  if (isAuthPage) {
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
