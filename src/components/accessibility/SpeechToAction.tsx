"use client";

/**
 * POLANITAS — Speech-to-Action (Groq Whisper powered)
 * Records mic audio → Groq Whisper → command matching → navigation + TTS
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Mic, MicOff, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGroqSpeech } from "@/hooks/use-groq-speech";
import { useAuth } from "@/components/auth/AuthProvider";
import { askAboutPage } from "@/actions/page-context-action";
import { parseFormIntent } from "@/actions/form-intent-action";
import { dispatchVoiceFormAction } from "@/lib/voice-form-filler";
import { useAccessibility } from "@/hooks/use-accessibility";

// ── Command map ────────────────────────────────────────────────────────────────
const ROUTE_COMMANDS: { patterns: string[]; path: string; announce: string }[] = [
  { patterns: ["buka dashboard", "ke dashboard", "halaman utama", "home"], path: "/dashboard", announce: "Membuka Dashboard." },
  { patterns: ["buka materi", "lihat materi", "buka modul", "kurikulum", "semua materi"], path: "/dashboard/learn", announce: "Membuka Materi." },
  { patterns: ["buka sesi", "sesi riset", "mulai riset", "buka riset"], path: "/dashboard/sessions", announce: "Membuka Sesi Riset." },
  { patterns: ["buka heatmap", "eye tracking", "heatmap"], path: "/dashboard/heatmaps", announce: "Membuka Heatmap." },
  { patterns: ["buka researcher", "researcher"], path: "/dashboard/researcher", announce: "Membuka Researcher." },
  { patterns: ["buka strategist", "strategist"], path: "/dashboard/strategist", announce: "Membuka Strategist." },
  { patterns: ["buka analyst", "analyst"], path: "/dashboard/analyst", announce: "Membuka Analyst." },
  { patterns: ["buka laporan", "laporan"], path: "/dashboard/reports", announce: "Membuka Laporan." },
  { patterns: ["modul satu", "modul 1", "materi satu", "materi 1", "orkestrasi ai", "orkestrasi"], path: "/dashboard/learn/ai-orchestration", announce: "Membuka Modul satu." },
  { patterns: ["modul dua", "modul 2", "materi dua", "materi 2", "deteksi tren", "tren dini"], path: "/dashboard/learn/trend-signal", announce: "Membuka Modul dua." },
  { patterns: ["modul tiga", "modul 3", "materi tiga", "materi 3", "whitespace", "marketplace"], path: "/dashboard/learn/marketplace-whitespace", announce: "Membuka Modul tiga." },
  { patterns: ["modul empat", "modul 4", "materi empat", "materi 4", "eye tracking mastery"], path: "/dashboard/learn/eye-tracking", announce: "Membuka Modul empat." },
  { patterns: ["modul lima", "modul 5", "materi lima", "materi 5", "copywriting", "llm"], path: "/dashboard/learn/llm-copywriting", announce: "Membuka Modul lima." },
];

const PATH_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/learn": "Materi",
  "/dashboard/sessions": "Sesi Riset",
  "/dashboard/heatmaps": "Heatmap",
  "/dashboard/researcher": "Researcher",
  "/dashboard/strategist": "Strategist",
  "/dashboard/analyst": "Analyst",
  "/dashboard/reports": "Laporan",
  "/dashboard/learn/ai-orchestration": "Modul satu: Orkestrasi AI",
  "/dashboard/learn/trend-signal": "Modul dua: Deteksi Tren",
  "/dashboard/learn/marketplace-whitespace": "Modul tiga: Whitespace",
  "/dashboard/learn/eye-tracking": "Modul empat: Eye Tracking",
  "/dashboard/learn/llm-copywriting": "Modul lima: Copywriting LLM",
};

// Whisper sometimes returns these for silence — ignore silently
const NOISE_PATTERNS = [
  /^\[.*\]$/, // [Music], [Applause], etc.
  /^terima kasih\.?$/i,
  /^(um+|eh+|ah+|hmm+)\.?$/i,
  /^\.+$/,
  /^\s*$/,
];

// A transcript must contain at least one of these words to be processed
const INTENT_WORDS = [
  "buka", "ke", "modul", "kembali", "ulangi",
  "keluar", "logout", "berhenti", "matikan",
  "dashboard", "materi", "sesi", "riset",
  "heatmap", "researcher", "strategist", "analyst",
  "laporan", "halaman", "di mana", "home",
  // Question intents
  "apa", "ada", "bisa", "jelaskan", "ceritakan",
  "ajarkan", "ajarin", "pelajari", "beritahu", "info",
  "topik", "isi", "mulai belajar", "mulai mengajar",
  "arti", "maksud", "kenapa", "bagaimana", "contoh", "beda",
  "lanjut", "terus", "lagi", "tolong",
  // Form intents
  "pilih", "centang", "target", "fokus", "submit", "ubah", "ganti", "region", "negara"
];

function isNoise(raw: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(raw.trim()));
}

function hasCommandIntent(text: string): boolean {
  return INTENT_WORDS.some((w) => text.includes(w));
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "id-ID";
  utt.rate = 0.92;
  window.speechSynthesis.speak(utt);
}

// ── Component ──────────────────────────────────────────────────────────────────
export function SpeechToAction() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { prefs } = useAccessibility(user?.uid);

  const isBlindUser = prefs?.isBlind ?? false;

  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isAsking, setIsAsking] = useState(false); // AI thinking indicator

  const [liveTranscript, setLiveTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const chatHistoryRef = useRef<{ role: 'user' | 'assistant', content: string }[]>([]);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoEnabled = useRef(false);

  function showFeedback(msg: string) {
    setFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 6000);
  }

  // Read prefs after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-enable when we detect the user is blind for the first time
  useEffect(() => {
    if (isBlindUser && !hasAutoEnabled.current) {
      setEnabled(true);
      hasAutoEnabled.current = true;
    }
  }, [isBlindUser]);

  // Announce page on navigation — also reset chat history on page change
  useEffect(() => {
    chatHistoryRef.current = [];
    setChatHistory([]);
    if (!enabled || !isBlindUser) return;
    const name = PATH_NAMES[pathname] ?? pathname;
    const t = setTimeout(() => speak(`Halaman ${name}. Ucapkan perintah.`), 700);
    return () => clearTimeout(t);
  }, [pathname, enabled, isBlindUser]);

  // ── Command handler (called after Groq returns transcript) ────────────────
  const handleTranscript = useCallback(
    (raw: string) => {
      // 1. Silently drop Whisper hallucinations & noise
      if (isNoise(raw)) return;

      const text = normalize(raw);

      // 2. Only process if the transcript has clear command intent
      //    Unrelated chatter / background speech → ignored silently
      if (!hasCommandIntent(text)) {
        setLiveTranscript(raw); // show in widget but no feedback/TTS
        return;
      }

      setLiveTranscript(raw);

      // Stop
      if (text.includes("berhenti") || text.includes("matikan")) {
        speak("Dinonaktifkan.");
        showFeedback("🔇 Dinonaktifkan");
        setEnabled(false);
        return;
      }

      // Sign out
      if (text.includes("keluar") || text.includes("logout")) {
        speak("Sampai jumpa!");
        showFeedback("👋 Keluar...");
        setTimeout(() => signOut(), 1200);
        return;
      }

      // Repeat
      if (text.includes("ulangi") || text.includes("di mana") || text.includes("halaman apa")) {
        const name = PATH_NAMES[pathname] ?? pathname;
        speak(`Kamu berada di ${name}.`);
        showFeedback(`📍 ${name}`);
        return;
      }

      // Back (Special handling: skip if it sounds like lesson navigation)
      if ((text.includes("kembali") || text.includes("sebelumnya")) && !text.includes("materi")) {
        speak("Kembali.");
        showFeedback("← Kembali");
        router.back();
        return;
      }

      // Routes
      for (const { patterns, path, announce } of ROUTE_COMMANDS) {
        if (patterns.some((p) => text.includes(p))) {
          // Jika user sudah berada di halaman tersebut, abaikan perintah navigasi
          // agar ucapan bisa diteruskan ke Form Intent atau Chat Assistant (misal "mulai riset" saat di form)
          if (pathname === path) continue;

          speak(announce);
          showFeedback(`→ ${announce}`);
          router.push(path);
          return;
        }
      }

      // ── Form Intent Check & AI Assistant ──────────────────────────────────
      setIsAsking(true);
      showFeedback("🤔 Sedang memproses...");

      // Coba parse intent form dulu
      parseFormIntent(pathname, raw)
        .then((intent) => {
          if (intent.isFormAction && intent.action) {
            dispatchVoiceFormAction(intent.action);
            if (intent.reply) {
              speak(intent.reply);
              showFeedback(`📝 ${intent.reply}`);
            }
            setIsAsking(false);
          } else {
            // Kalau bukan aksi form, kirim ke asisten tanya-jawab
            speak("Sebentar...");
            return askAboutPage(pathname, raw, chatHistoryRef.current)
              .then(({ answer }) => {
                const updated = [
                  ...chatHistoryRef.current,
                  { role: 'user' as const, content: raw },
                  { role: 'assistant' as const, content: answer },
                ].slice(-10);
                chatHistoryRef.current = updated;
                setChatHistory(updated);
                showFeedback(answer.slice(0, 100) + (answer.length > 100 ? "..." : ""));
                speak(answer);
              });
          }
        })
        .catch(() => {
          speak("Maaf, terjadi kesalahan.");
          showFeedback("❌ Error memproses ucapan");
        })
        .finally(() => setIsAsking(false));
    },
    [pathname, router, signOut]
  );

  // ── Groq Whisper hook ─────────────────────────────────────────────────────
  const { status, errorMsg } = useGroqSpeech({
    enabled,
    onTranscript: handleTranscript,
  });

  if (!mounted) return null;
  if (!isBlindUser) return null;

  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isError = status === "error";

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="bg-[color:var(--color-bg)] border border-border rounded-xl px-4 py-2.5 shadow-lg max-w-[260px] pointer-events-none"
          >
            <p className="text-xs font-semibold text-primary leading-snug">{feedback}</p>
            {liveTranscript && (
              <p className="text-[10px] text-muted mt-0.5">"{liveTranscript}"</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget */}
      <div className="bg-[color:var(--color-bg)] border border-border rounded-2xl shadow-lg overflow-hidden min-w-[190px]">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {isAsking ? (
              <Loader2 size={10} className="text-primary animate-spin shrink-0" />
            ) : isError ? (
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            ) : isListening ? (
              <motion.span
                className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                animate={{ scale: [1, 1.6, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            ) : isProcessing ? (
              <motion.span
                className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />
            ) : (
              <span className="w-2 h-2 rounded-full bg-border shrink-0" />
            )}

            <span className="text-[10px] font-bold text-secondary truncate">
              {isAsking     ? "AI Menjawab..."
              : isError     ? "Mic error"
              : isListening ? "Merekam..."
              : isProcessing? "Groq AI..."
              : enabled     ? "Standby"
              :               "Mic mati"}
            </span>
          </div>

          {/* Toggle */}
          <button
            onClick={() => {
              const next = !enabled;
              setEnabled(next);
              if (next) speak("Aktif. Siap mendengarkan.");
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-none
              ${enabled ? "bg-primary text-[color:var(--color-bg)]" : "bg-surface-2 text-muted hover:bg-surface"}`}
            title={enabled ? "Matikan mic" : "Aktifkan mic"}
          >
            {enabled ? <Mic size={12} /> : <MicOff size={12} />}
          </button>

          {/* Collapse */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-7 h-7 rounded-full bg-surface-2 text-muted hover:bg-surface flex items-center justify-center cursor-pointer border-none transition-colors"
          >
            {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Expandable body */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              {/* Live transcript */}
              <div className="px-3 py-2 min-h-[30px]">
                {liveTranscript ? (
                  <p className="text-[10px] text-primary font-mono italic truncate">"{liveTranscript}"</p>
                ) : (
                  <p className="text-[10px] text-muted">
                    {isListening ? "🎤 Sedang merekam..." : isProcessing ? "⚡ Groq memproses..." : "Klik 🎤 untuk mulai"}
                  </p>
                )}
              </div>

              {/* Quick commands (clickable for test) */}
              <div className="px-3 pb-2 flex flex-col gap-0.5">
                {["buka dashboard", "buka materi", "buka sesi riset", "modul satu", "kembali", "ulangi"].map((cmd) => (
                  <button key={cmd} type="button"
                    onClick={() => handleTranscript(cmd)}
                    className="text-left text-[10px] font-mono text-secondary hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-2 border-none bg-transparent cursor-pointer"
                    title="Klik untuk simulasi perintah"
                  >
                    &ldquo;{cmd}&rdquo;
                  </button>
                ))}
              </div>

              {/* Error */}
              {isError && errorMsg && (
                <div className="mx-3 mb-3 text-[10px] text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg p-2 leading-relaxed">
                  {errorMsg}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
