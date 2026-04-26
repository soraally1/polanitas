"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { createSession } from "@/actions/auth-actions";
import { Mail, Lock, LogIn, AlertCircle, Globe } from "lucide-react";
import { ThemeLogo } from "@/components/layout/ThemeLogo";

const googleProvider = new GoogleAuthProvider();

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") ?? "/dashboard";

  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Email / Password Login ──────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    startTransition(async () => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const result = await createSession(cred.user.uid);
        if (result?.error) throw new Error(result.error);
        router.push(redirectTo);
        router.refresh();
      } catch (err: any) {
        setError(friendlyError(err.code ?? err.message));
      }
    });
  }

  // ── Google Login ────────────────────────────────────────────
  async function handleGoogle() {
    setError(null);
    setGooglePending(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const result = await createSession(cred.user.uid);
      if (result?.error) throw new Error(result.error);
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(friendlyError(err.code ?? err.message));
      }
    } finally {
      setGooglePending(false);
    }
  }

  const loading = isPending || isGooglePending;

  return (
    <div
      className="animate-fade-in-up"
      style={{ width: "100%", maxWidth: 420 }}
    >
      <div>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ThemeLogo height={32} />
          </div>
          <h2 style={{ marginBottom: 6, fontSize: "1.25rem" }}>Masuk ke Akun</h2>
          <p style={{ fontSize: "0.875rem" }}>
            Belum punya akun?{" "}
            <Link
              href="/register"
              style={{ color: "var(--color-accent-text)", fontWeight: 600 }}
            >
              Daftar gratis
            </Link>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 14px",
              background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-error) 30%, transparent)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 20,
              fontSize: "0.875rem",
              color: "var(--color-error)",
            }}
          >
            <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <label htmlFor="login-email" className="label">
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={15}
                strokeWidth={2}
                color="var(--color-text-muted)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                id="login-email"
                name="email"
                type="email"
                className="input"
                placeholder="nama@email.com"
                required
                autoComplete="email"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label htmlFor="login-password" className="label" style={{ margin: 0 }}>
                Password
              </label>
              <a href="#" style={{ fontSize: "0.8125rem", color: "var(--color-accent-text)" }}>
                Lupa password?
              </a>
            </div>
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                strokeWidth={2}
                color="var(--color-text-muted)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                id="login-password"
                name="password"
                type="password"
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 4, width: "100%", justifyContent: "center" }}
          >
            <LogIn size={15} strokeWidth={2.5} />
            {isPending ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "20px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
            atau masuk dengan
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        </div>

        {/* Google Sign In */}
        <button
          id="login-google-btn"
          onClick={handleGoogle}
          disabled={loading}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Globe size={15} strokeWidth={2} />
          {isGooglePending ? "Membuka Google..." : "Lanjutkan dengan Google"}
        </button>
      </div>
    </div>
  );
}

// Map Firebase error codes to user-friendly Indonesian messages
function friendlyError(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found":       "Email tidak terdaftar. Coba daftar terlebih dahulu.",
    "auth/wrong-password":       "Password salah. Silakan coba lagi.",
    "auth/invalid-credential":   "Email atau password salah.",
    "auth/invalid-email":        "Format email tidak valid.",
    "auth/too-many-requests":    "Terlalu banyak percobaan. Coba beberapa menit lagi.",
    "auth/network-request-failed": "Koneksi gagal. Periksa jaringan kamu.",
    "auth/user-disabled":        "Akun ini telah dinonaktifkan.",
  };
  return map[code] ?? `Terjadi kesalahan: ${code}`;
}
