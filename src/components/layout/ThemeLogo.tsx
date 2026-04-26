"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ThemeLogoProps {
  height?: number;
  className?: string;
}

export function ThemeLogo({ height = 32, className }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch — show nothing until mounted
  if (!mounted) {
    return (
      <div
        style={{ height, width: height * 4, borderRadius: 4 }}
        className="skeleton"
        aria-hidden="true"
      />
    );
  }

  const src =
    resolvedTheme === "dark"
      ? "/logo/LogoWhite.svg"
      : "/logo/LogoBlack.svg";

  return (
    <Image
      src={src}
      alt="POLANITAS"
      height={height}
      width={height * 4}          // aspect-ratio placeholder; Next.js will use intrinsic SVG size
      style={{ height, width: "auto", objectFit: "contain" }}
      priority
      className={className}
    />
  );
}
