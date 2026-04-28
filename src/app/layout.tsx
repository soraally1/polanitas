import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Polanitas",
    template: "",
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
    <html lang="id" suppressHydrationWarning className={`${jakarta.variable} ${spaceMono.variable} antialiased`}>
      <body className="bg-bg text-primary font-sans min-h-dvh overflow-x-hidden leading-[1.6]">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
