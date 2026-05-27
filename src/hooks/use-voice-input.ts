/**
 * POLANITAS — useVoiceInput
 *
 * Web Speech API hook for voice-driven form filling.
 * Designed for users with hand disabilities using face tracking.
 *
 * Works with React-controlled inputs by dispatching native input events
 * (React intercepts these via its synthetic event system).
 *
 * Note: SpeechRecognition is not in the default TypeScript DOM lib,
 * so we declare the minimal types we need locally.
 */

"use client";

import { useCallback, useRef, useState } from "react";

// ── Local Web Speech API type declarations ────────────────────────────────────
// (Not included in TypeScript's default lib.dom.d.ts target)
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart:  ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend:    ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror:  ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// ── Public types ──────────────────────────────────────────────────────────────
export type VoiceInputMode = "append" | "replace";

export interface VoiceInputOptions {
  /** BCP 47 language tag. Default: "id-ID" */
  lang?: string;
  /** Whether to append or replace existing value. Default: "replace" */
  mode?: VoiceInputMode;
  /** Called with the final recognised text */
  onResult?: (text: string) => void;
  /** Called on any error */
  onError?: (err: string) => void;
}

// ── Detect API (Chrome prefixes it) ──────────────────────────────────────────
function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState("");
  const [interimText, setInterimText] = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  const recRef     = useRef<ISpeechRecognition | null>(null);
  const targetRef  = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const optionsRef = useRef<VoiceInputOptions>({});

  // ── Inject recognised text into a React-controlled input ─────────────────────
  function injectText(el: HTMLInputElement | HTMLTextAreaElement, text: string, mode: VoiceInputMode) {
    const finalValue = mode === "append"
      ? (el.value ? `${el.value} ${text}` : text)
      : text;

    // React overrides the value setter — use native setter to bypass it,
    // then dispatch a synthetic 'input' event so React picks up the change.
    const proto = el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    nativeSetter?.call(el, finalValue);

    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ── Start listening ───────────────────────────────────────────────────────────
  const startListening = useCallback((
    target?: HTMLInputElement | HTMLTextAreaElement | null,
    options: VoiceInputOptions = {},
  ) => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setIsSupported(false);
      setError("Browser tidak mendukung Web Speech API. Coba Chrome atau Edge.");
      options.onError?.("unsupported");
      return;
    }
    setIsSupported(true);

    // Stop any existing session
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) { /* ignore */ }
    }

    targetRef.current  = target ?? null;
    optionsRef.current = options;

    const rec = new SR();
    rec.lang            = options.lang ?? "id-ID";
    rec.continuous      = false;  // stop after first pause
    rec.interimResults  = true;   // show live partial results
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setInterimText("");
      setError(null);
    };

    rec.onresult = (event: ISpeechRecognitionEvent) => {
      let final   = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final   += r[0].transcript;
        else           interim += r[0].transcript;
      }
      if (interim) setInterimText(interim);
      if (final) {
        const text = final.trim();
        setTranscript(text);
        setInterimText("");
        const el = targetRef.current;
        if (el) injectText(el, text, optionsRef.current.mode ?? "replace");
        options.onResult?.(text);
      }
    };

    rec.onerror = (event: ISpeechRecognitionErrorEvent) => {
      const msg =
        event.error === "not-allowed" ? "Akses mikrofon ditolak. Izinkan mikrofon di browser." :
        event.error === "no-speech"   ? "Tidak ada suara terdeteksi. Coba lagi." :
        event.error === "network"     ? "Koneksi internet diperlukan untuk Speech API." :
        `Error: ${event.error}`;
      setError(msg);
      setIsListening(false);
      options.onError?.(msg);
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recRef.current = rec;
    rec.start();
  }, []);

  // ── Stop listening ────────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    try { recRef.current?.stop(); } catch (_) { /* ignore */ }
    setIsListening(false);
    setInterimText("");
  }, []);

  // ── Check support ─────────────────────────────────────────────────────────────
  const checkSupport = useCallback(() => {
    const supported = getSpeechRecognition() !== null;
    setIsSupported(supported);
    return supported;
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimText,
    error,
    startListening,
    stopListening,
    checkSupport,
  };
}
