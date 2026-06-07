import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { QueryProvider } from "../components/providers/QueryProvider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { Toaster } from "../components/ui/sonner";
import { ScrollToTopButton } from "../components/ScrollToTopButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "LearnHub - Video AI Platform",
  description: "AI-powered video processing and editing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="datn-theme">
            <AuthProvider>
              {children}
              <ScrollToTopButton />
              <Toaster richColors closeButton position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
