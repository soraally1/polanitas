import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "POLANITAS — Digital Content Intelligence Platform",
    template: "%s | POLANITAS",
  },
  description:
    "Platform strategi dan analisis konten digital bertenaga Multi-Agent AI dan Eye Tracking. Riset tren otomatis, strategi konten viral, dan analisis perhatian berbasis biometrik.",
  keywords: ["content strategy", "AI marketing", "eye tracking", "tren indonesia", "analisis konten"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={jakarta.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
