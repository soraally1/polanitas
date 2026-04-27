"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { signOut, user } = useAuth();

  return (
    <button
      id="sign-out-btn"
      onClick={signOut}
      className="btn btn-ghost btn-icon w-9 h-9"
      title="Keluar"
      aria-label="Sign out"
    >
      <LogOut size={15} strokeWidth={2} />
    </button>
  );
}
