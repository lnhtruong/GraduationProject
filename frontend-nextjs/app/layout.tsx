import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { QueryProvider } from "../components/providers/QueryProvider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { ToastRouteDismiss } from "../components/providers/ToastRouteDismiss";
import { Toaster } from "../components/ui/sonner";
import { ScrollToTopButton } from "../components/ScrollToTopButton";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  applicationName: BRAND.name,
  title: {
    template: `%s | ${BRAND.name}`,
    default: BRAND.title,
  },
  description: BRAND.description,
  keywords: [...BRAND.keywords],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  verification: {
    google: "LhTBEkvNYx4eg_CTnTQzU_OT2H-cbt1dT-lJAWfhCtk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: BRAND.name,
    title: BRAND.title,
    description: BRAND.description,
    images: [
      {
        url: BRAND.ogImage,
        width: 1200,
        height: 630,
        alt: BRAND.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.title,
    description: BRAND.description,
    images: [BRAND.ogImage],
  },
  icons: {
    icon: BRAND.icon,
    shortcut: BRAND.icon,
    apple: BRAND.appleIcon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="datn-theme">
            <AuthProvider>
              {children}
              <ScrollToTopButton />
              <ToastRouteDismiss />
              <Toaster richColors closeButton position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
