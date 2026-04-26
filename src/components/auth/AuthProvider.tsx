"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { createSession, destroySession } from "@/actions/auth-actions";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Force reload so displayName/photoURL changes propagate immediately
        await firebaseUser.reload();
        // Re-read the refreshed user object from auth
        const refreshed = auth.currentUser;
        setUser(refreshed);
      } else {
        setUser(null);
      }
      setLoading(false);

      if (firebaseUser) {
        try {
          await createSession(firebaseUser.uid);
        } catch {
          // Non-critical
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    await destroySession(); // clears cookie + redirects to /login
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
