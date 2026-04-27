import type { Metadata } from "next";
import LandingClient from "@/components/landing/LandingClient";

export const metadata: Metadata = {
  title: "POLANITAS",
  description:
    "Platform interaktif untuk belajar analisis data, riset tren, dan strategi konten digital dengan praktik langsung menggunakan Multi-Agent AI & Eye Tracking.",
};

export default function LandingPage() {
  return <LandingClient />;
}
