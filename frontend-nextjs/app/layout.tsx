import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { QueryProvider } from "../components/providers/QueryProvider";
import { Header } from "../components/Header";
import Footer from "@/components/Footer";

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
            <Header />
            {children}
            <Footer />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
