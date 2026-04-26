"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { signOut, user } = useAuth();

  return (
    <button
      id="sign-out-btn"
      onClick={signOut}
      className="btn btn-ghost btn-icon"
      title="Keluar"
      aria-label="Sign out"
      style={{ width: 36, height: 36 }}
    >
      <LogOut size={15} strokeWidth={2} />
    </button>
  );
}
