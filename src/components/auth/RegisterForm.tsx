"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { createSession } from "@/actions/auth-actions";
import { Mail, Lock, User, UserPlus, AlertCircle, Globe, CheckCircle } from "lucide-react";
import { ThemeLogo } from "@/components/layout/ThemeLogo";

const googleProvider = new GoogleAuthProvider();

export default function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ── Password strength indicator ────────────────────────────
  function checkStrength(pwd: string) {
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setPasswordStrength(score);
  }

  // ── Email / Password Register ───────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name     = fd.get("name")     as string;
    const email    = fd.get("email")    as string;
    const password = fd.get("password") as string;
    const confirm  = fd.get("confirm")  as string;

    if (password !== confirm) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    startTransition(async () => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        const result = await createSession(cred.user.uid);
        if (result?.error) throw new Error(result.error);
        router.push("/dashboard");
        router.refresh();
      } catch (err: any) {
        setError(friendlyError(err.code ?? err.message));
      }
    });
  }

  // ── Google Register ─────────────────────────────────────────
  async function handleGoogle() {
    setError(null);
    setGooglePending(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const result = await createSession(cred.user.uid);
      if (result?.error) throw new Error(result.error);
      router.push("/dashboard");
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

  const strengthColors = ["", "#EF4444", "#F59E0B", "#3B82F6", "#22C55E"];
  const strengthLabels = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];

  return (
    <div className="animate-fade-in-up" style={{ width: "100%", maxWidth: 420 }}>
      <div>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ThemeLogo height={32} />
          </div>
          <h2 style={{ marginBottom: 6, fontSize: "1.25rem" }}>Buat Akun Baru</h2>
          <p style={{ fontSize: "0.875rem" }}>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              style={{ color: "var(--color-accent-text)", fontWeight: 600 }}
            >
              Masuk di sini
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
          {/* Name */}
          <div>
            <label htmlFor="reg-name" className="label">Nama Lengkap</label>
            <div style={{ position: "relative" }}>
              <User
                size={15}
                strokeWidth={2}
                color="var(--color-text-muted)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                id="reg-name"
                name="name"
                type="text"
                className="input"
                placeholder="Nama kamu"
                required
                autoComplete="name"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail
                size={15}
                strokeWidth={2}
                color="var(--color-text-muted)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                id="reg-email"
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

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                strokeWidth={2}
                color="var(--color-text-muted)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                id="reg-password"
                name="password"
                type="password"
                className="input"
                placeholder="Min. 6 karakter"
                required
                minLength={6}
                autoComplete="new-password"
                style={{ paddingLeft: 36 }}
                onChange={(e) => checkStrength(e.target.value)}
              />
            </div>

            {/* Password strength bar */}
            {passwordStrength > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                  {[1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 999,
                        background: lvl <= passwordStrength
                          ? (strengthColors[passwordStrength] ?? "var(--color-border)")
                          : "var(--color-border)",
                        transition: "background 0.3s ease",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="caption"
                  style={{ color: strengthColors[passwordStrength] }}
                >
                  Password {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" className="label">Konfirmasi Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                strokeWidth={2}
                color="var(--color-text-muted)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                id="reg-confirm"
                name="confirm"
                type="password"
                className="input"
                placeholder="Ulangi password"
                required
                minLength={6}
                autoComplete="new-password"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Terms */}
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Dengan mendaftar, kamu menyetujui{" "}
            <a href="#" style={{ color: "var(--color-accent-text)" }}>Ketentuan Layanan</a>{" "}
            dan{" "}
            <a href="#" style={{ color: "var(--color-accent-text)" }}>Kebijakan Privasi</a> kami.
          </p>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <UserPlus size={15} strokeWidth={2.5} />
            {isPending ? "Membuat akun..." : "Buat Akun"}
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
            atau daftar dengan
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        </div>

        {/* Google */}
        <button
          id="register-google-btn"
          onClick={handleGoogle}
          disabled={loading}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Globe size={15} strokeWidth={2} />
          {isGooglePending ? "Membuka Google..." : "Daftar dengan Google"}
        </button>
      </div>

      {/* Benefits below card */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          "Akses 3 AI Agents sekaligus — Researcher, Strategist & Analyst",
          "Real-time eye tracking untuk analisis konten berbasis data",
          "Gratis untuk kreator individual",
        ].map((benefit) => (
          <div key={benefit} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <CheckCircle size={15} strokeWidth={2} color="var(--color-done)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use":   "Email sudah digunakan. Coba masuk atau gunakan email lain.",
    "auth/weak-password":          "Password terlalu lemah. Gunakan minimal 6 karakter.",
    "auth/invalid-email":          "Format email tidak valid.",
    "auth/network-request-failed": "Koneksi gagal. Periksa jaringan kamu.",
    "auth/too-many-requests":      "Terlalu banyak percobaan. Coba beberapa menit lagi.",
  };
  return map[code] ?? `Terjadi kesalahan: ${code}`;
}
