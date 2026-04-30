"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, User, Send, AlertCircle } from "lucide-react";
import { askModuleAI } from "@/actions/learn-actions";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AILabProps {
  moduleId: string;
  moduleName: string;
  placeholder?: string;
  initialMessage?: string;
  themeColor?: string; // e.g. #06B6D4
  themeGradient?: string; // e.g. linear-gradient(...)
}

function Typewriter({
  text,
  onComplete,
  animate = true,
}: {
  text: string;
  onComplete?: () => void;
  animate?: boolean;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!spanRef.current) return;
    if (!animate) {
      spanRef.current.textContent = text;
      return;
    }
    
    let i = 0;
    const el = spanRef.current;
    el.textContent = "";
    const t = setInterval(() => {
      i += 3; // Type 3 chars at a time for speed
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        el.textContent = text;
        clearInterval(t);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 25);
    return () => clearInterval(t);
  }, [text, animate]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
      <span ref={spanRef}>{!animate ? text : ""}</span>
    </>
  );
}

export function AILab({
  moduleId,
  moduleName,
  placeholder = "Tanyakan sesuatu...",
  initialMessage,
  themeColor = "#06B6D4",
  themeGradient = "linear-gradient(135deg, #06B6D4, #0891B2)",
}: AILabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // The lock!
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize with initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([
        {
          role: "ai",
          content: initialMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [initialMessage, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading || isTyping) return;
    const userMsg = input.trim();
    setInput("");
    setError(null);
    setMessages((p) => [
      ...p,
      { role: "user", content: userMsg, timestamp: new Date() },
    ]);
    
    setLoading(true);
    try {
      const response = await askModuleAI(moduleId, userMsg);
      setLoading(false);
      if (response.error) {
        setError(response.error);
      } else if (response.answer) {
        setIsTyping(true); // Lock it!
        setMessages((p) => [
          ...p,
          { role: "ai", content: response.answer!, timestamp: new Date() },
        ]);
      }
    } catch (err) {
      setLoading(false);
      setError("Terjadi kesalahan koneksi.");
    }
  }

  // Generate a rgba version of the theme color for the header icon background
  const clRgba = themeColor.startsWith("#") 
    ? `rgba(${parseInt(themeColor.slice(1,3), 16)}, ${parseInt(themeColor.slice(3,5), 16)}, ${parseInt(themeColor.slice(5,7), 16)}, `
    : "rgba(6, 182, 212, ";

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", overflow: "hidden", background: "var(--color-surface)", boxShadow: "var(--shadow-md)" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#1A1D23 0%,#2D2F3A 100%)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${clRgba}0.3)`, border: `1px solid ${clRgba}0.5)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={18} color={themeColor} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#F8F9FA" }}>AI Tutor Lab</div>
          <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>Konteks: {moduleName}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "rgba(110,225,43,0.15)", border: "1px solid rgba(110,225,43,0.3)", borderRadius: 100, padding: "3px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6EE12B", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6EE12B" }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ height: 360, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, background: "var(--color-surface-2)" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start", animation: "slideIn 0.3s ease-out both" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.role === "ai" ? themeGradient : "var(--color-surface-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--color-border)" }}>
              {msg.role === "ai" ? <Bot size={15} color="#FFF" /> : <User size={15} color="var(--color-text-secondary)" />}
            </div>
            <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.role === "ai" ? "var(--color-surface)" : themeGradient, border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.875rem", color: msg.role === "ai" ? "var(--color-text-primary)" : "#FFF", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {msg.role === "ai" ? (
                  <Typewriter 
                    text={msg.content.replace(/\*\*(.*?)\*\*/g, "$1")} 
                    onComplete={i === messages.length - 1 ? () => setIsTyping(false) : undefined} 
                    animate={i === messages.length - 1}
                  />
                ) : (
                  msg.content.replace(/\*\*(.*?)\*\*/g, "$1")
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: themeGradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot size={15} color="#FFF" />
            </div>
            <div style={{ padding: "14px 18px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 6 }}>
              {[0, 1, 2].map((ii) => (
                <div key={ii} style={{ width: 8, height: 8, borderRadius: "50%", background: themeColor, animation: `pulse 1.2s ${ii * 0.2}s infinite`, opacity: 0.6 }} />
              ))}
            </div>
          </div>
        )}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", color: "#EF4444" }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 10, background: "var(--color-surface)" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isTyping ? "Tunggu AI selesai mengetik..." : placeholder}
          disabled={loading || isTyping}
          rows={2}
          style={{ flex: 1, border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", background: "var(--color-surface-2)", resize: "none", outline: "none", lineHeight: 1.5, opacity: (loading || isTyping) ? 0.7 : 1, cursor: (loading || isTyping) ? "not-allowed" : "text" }}
        />
        <button
          onClick={handleSend}
          disabled={loading || isTyping || !input.trim()}
          style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: (loading || isTyping || !input.trim()) ? "var(--color-surface-3)" : themeGradient, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: (loading || isTyping || !input.trim()) ? "not-allowed" : "pointer", flexShrink: 0, alignSelf: "flex-end" }}
        >
          <Send size={18} color={(loading || isTyping || !input.trim()) ? "var(--color-text-muted)" : "#FFF"} />
        </button>
      </div>
    </div>
  );
}
