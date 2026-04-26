/**
 * POLANITAS — Auth Server Actions (No Admin SDK)
 *
 * Menyimpan UID Firebase langsung ke httpOnly cookie setelah
 * client-side Firebase Auth berhasil. Middleware membaca cookie
 * ini untuk melindungi route /dashboard.
 *
 * Flow: Firebase Client Auth → uid → createSession(uid) → __session cookie
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "__session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 hari (detik)

/** Menyimpan UID ke httpOnly cookie setelah login berhasil. */
export async function createSession(uid: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return { success: true };
  } catch (err: any) {
    return { error: err.message ?? "Gagal membuat sesi." };
  }
}

/** Menghapus cookie sesi dan redirect ke /login. */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

/** Mengembalikan UID dari cookie, atau null jika belum login. */
export async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}
