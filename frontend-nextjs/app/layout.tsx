import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { QueryProvider } from "../components/providers/QueryProvider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { LayoutWrapper } from "../components/LayoutWrapper";
import { Toaster } from "../components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="datn-theme">
            <AuthProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
              <Toaster richColors closeButton position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
