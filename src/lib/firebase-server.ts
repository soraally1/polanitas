/**
 * POLANITAS — Firebase Server-Side DB (No Admin SDK)
 *
 * Initialises a separate Firebase app instance for server-only use
 * (Server Actions, Route Handlers). Avoids browser-only IndexedDB persistence.
 *
 * Uses the same project credentials as the client SDK (NEXT_PUBLIC_*),
 * which are safe to read on the server side.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const SERVER_APP_NAME = "__polanitas_server__";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getServerApp() {
  const existing = getApps().find((a) => a.name === SERVER_APP_NAME);
  if (existing) return existing;
  return initializeApp(firebaseConfig, SERVER_APP_NAME);
}

const serverApp = getServerApp();

// Use "memory" cache so Firestore doesn't try to access IndexedDB on the server
export const db = initializeFirestore(serverApp, {} as any);
