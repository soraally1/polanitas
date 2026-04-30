"use client";

import { useState } from "react";
import {
  BarChart2,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BookOpen,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AILab } from "@/components/Chatbot";

// ═══════════════════════════════════════════════════════
// TYPE
// ═══════════════════════════════════════════════════════
interface Lesson {
  id: string;
  title: string;
  concept: string;
  explanation: string;
  formula?: string;
  dataset: number[];
  datasetLabel: string;
  compute: (data: number[]) => Record<string, string | number>;
  insight: string;
  quiz: { question: string; options: string[]; correct: number; explanation: string };
}

// ═══════════════════════════════════════════════════════
// LESSON DATA
// ═══════════════════════════════════════════════════════
const LESSONS: Lesson[] = [
  {
    id: "mean",
    title: "Mean (Rata-rata)",
    concept: "Pusat data yang paling umum. Mean adalah jumlah seluruh nilai dibagi dengan banyaknya data.",
    explanation:
      "Mean sangat berguna untuk memahami 'nilai tipikal' dalam sebuah dataset, namun rentan terhadap outlier (nilai ekstrem). Dalam analisis konten, mean view count memberimu gambaran performa rata-rata.",
    formula: "Mean = (x₁ + x₂ + ... + xₙ) / n",
    dataset: [12400, 8700, 45200, 9100, 11800, 7300, 220000, 14200, 9800, 10100],
    datasetLabel: "Views per video (last 10 videos)",
    compute: (d) => {
      const mean = d.reduce((a, b) => a + b, 0) / d.length;
      return {
        "Jumlah data (n)": d.length,
        "Total views": d.reduce((a, b) => a + b, 0).toLocaleString(),
        "Mean (rata-rata)": Math.round(mean).toLocaleString(),
      };
    },
    insight:
      "Perhatikan: satu video viral (220.000 views) membuat mean menjadi 34.860 — jauh di atas performa 9 video lainnya. Ini menunjukkan mean bisa menyesatkan jika ada outlier.",
    quiz: {
      question: "Dataset views: [100, 200, 300, 400, 10000]. Mana pernyataan yang paling tepat?",
      options: [
        "Mean = 600, ini menggambarkan performa rata-rata dengan akurat",
        "Mean = 2.200, tapi tidak merepresentasikan sebagian besar data karena ada outlier 10.000",
        "Mean = 300, ini adalah nilai tengah dataset",
        "Mean tidak berguna jika ada nilai 10.000",
      ],
      correct: 1,
      explanation:
        "Mean = (100+200+300+400+10000)/5 = 2.200. Nilainya ditarik ke atas oleh outlier 10.000, sehingga tidak merepresentasikan 4 video lainnya secara adil.",
    },
  },
  {
    id: "median",
    title: "Median (Nilai Tengah)",
    concept: "Nilai yang berada tepat di tengah ketika data diurutkan. Lebih tahan terhadap outlier dibanding mean.",
    explanation:
      "Untuk data ganjil: ambil nilai tengah. Untuk data genap: rata-ratakan dua nilai tengah. Median lebih baik digunakan ketika data condong/skewed, seperti data penghasilan atau views yang didominasi outlier.",
    formula: "Urutkan data → ambil nilai tengah (atau rata-rata dua tengah)",
    dataset: [12400, 8700, 45200, 9100, 11800, 7300, 220000, 14200, 9800, 10100],
    datasetLabel: "Views per video (same dataset)",
    compute: (d) => {
      const sorted = [...d].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      const mean = d.reduce((a, b) => a + b, 0) / d.length;
      return {
        "Data terurut (ringkas)": `${sorted[0].toLocaleString()} … ${sorted[sorted.length - 1].toLocaleString()}`,
        "Median": Math.round(median).toLocaleString(),
        "Mean (pembanding)": Math.round(mean).toLocaleString(),
        "Selisih Mean - Median": Math.round(mean - median).toLocaleString(),
      };
    },
    insight:
      "Median = 10.950 vs Mean = 34.860. Dengan dataset yang sama, median jauh lebih merepresentasikan 'performa tipikal' channel kamu karena tidak terpengaruh video viral.",
    quiz: {
      question: "Kapan sebaiknya kamu menggunakan median daripada mean?",
      options: [
        "Selalu, karena median lebih mudah dihitung",
        "Ketika distribusi data simetris dan tidak ada outlier",
        "Ketika data memiliki outlier atau distribusi condong (skewed)",
        "Hanya untuk dataset dengan n > 100",
      ],
      correct: 2,
      explanation:
        "Median lebih robust terhadap outlier. Jika data kamu skewed (ada nilai ekstrem seperti video viral), median lebih merepresentasikan 'pusat' data yang sesungguhnya.",
    },
  },
  {
    id: "standar-deviasi",
    title: "Standar Deviasi",
    concept: "Ukuran sebaran/dispersi data. Seberapa jauh nilai-nilai dari mean-nya.",
    explanation:
      "SD kecil = data konsisten dan terkumpul di sekitar mean. SD besar = data sangat bervariasi. Untuk kreator konten, SD views tinggi berarti performa tidak konsisten — ada yang meledak, ada yang anjlok.",
    formula: "SD = √(Σ(xᵢ - mean)² / n)",
    dataset: [9800, 10200, 9500, 10800, 9900, 10100, 10400, 9700, 10300, 10000],
    datasetLabel: "Views kreator konsisten (10 video)",
    compute: (d) => {
      const mean = d.reduce((a, b) => a + b, 0) / d.length;
      const variance = d.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / d.length;
      const sd = Math.sqrt(variance);
      return {
        "Mean": Math.round(mean).toLocaleString(),
        "Variance": Math.round(variance).toLocaleString(),
        "Standar Deviasi (SD)": Math.round(sd).toLocaleString(),
        "Rentang (Max-Min)": (Math.max(...d) - Math.min(...d)).toLocaleString(),
        "Konsistensi": sd < 1000 ? "🟢 Sangat konsisten" : "🟡 Cukup variasi",
      };
    },
    insight:
      "SD ≈ 375 pada dataset ini berarti hampir semua video berada dalam rentang 10.000 ± 375 views — creator yang sangat konsisten! Bandingkan jika ada video 220.000 views dalam dataset sebelumnya.",
    quiz: {
      question: "Dua kreator punya mean views 50.000. Kreator A: SD=2000, Kreator B: SD=40000. Apa kesimpulannya?",
      options: [
        "Performa keduanya sama karena mean-nya sama",
        "Kreator A lebih konsisten, Kreator B lebih viral tapi tidak stabil",
        "Kreator B lebih baik karena SD-nya lebih besar",
        "SD tidak relevan untuk analisis kreator konten",
      ],
      correct: 1,
      explanation:
        "Mean yang sama tidak berarti performa sama. SD rendah (A) = konsisten di sekitar 50K. SD tinggi (B) = mungkin ada video 200K tapi juga video 5K. Tergantung tujuanmu: brand deal biasanya suka konsistensi.",
    },
  },
  {
    id: "distribusi",
    title: "Distribusi Data & Histogram",
    concept: "Bagaimana frekuensi nilai tersebar dalam dataset. Membantumu memahami pola di balik kumpulan angka.",
    explanation:
      "Distribusi normal (bell curve) simetris di sekitar mean. Data nyata sering right-skewed (condong kanan) — misal data views: kebanyakan video punya views kecil, sedikit yang viral. Memahami bentuk distribusi penting sebelum memilih metode statistik.",
    formula: "Frekuensi per interval (bin) → plot sebagai histogram",
    dataset: [1200, 1800, 2100, 3400, 3800, 4200, 4600, 5100, 5300, 5800, 6200, 6800, 7200, 9100, 12000, 15000, 22000, 45000],
    datasetLabel: "Views 18 video bulan ini",
    compute: (d) => {
      const sorted = [...d].sort((a, b) => a - b);
      const bins = [
        { label: "0–5K", range: [0, 5000] },
        { label: "5K–10K", range: [5000, 10000] },
        { label: "10K–20K", range: [10000, 20000] },
        { label: "20K+", range: [20000, Infinity] },
      ];
      const counts: Record<string, number> = {};
      bins.forEach((b) => {
        counts[b.label] = d.filter((v) => v >= b.range[0] && v < b.range[1]).length;
      });
      return {
        "0–5K views": `${counts["0–5K"]} video`,
        "5K–10K views": `${counts["5K–10K"]} video`,
        "10K–20K views": `${counts["10K–20K"]} video`,
        "20K+ views": `${counts["20K+"]} video`,
        "Bentuk distribusi": "Right-skewed (ekor kanan panjang)",
      };
    },
    insight:
      "Mayoritas video punya views rendah, sedikit yang tembus 20K+. Ini distribusi right-skewed yang sangat umum di konten digital. Mean akan lebih besar dari median di distribusi seperti ini.",
    quiz: {
      question: "Jika distribusi views sangat right-skewed, metode apa yang lebih tepat untuk meringkas data?",
      options: [
        "Mean saja, karena lebih mudah dipahami",
        "Median dan IQR (interquartile range), karena lebih robust terhadap outlier",
        "Nilai maksimum, karena kita ingin tahu viral tertinggi",
        "Modus, karena yang paling sering muncul",
      ],
      correct: 1,
      explanation:
        "Untuk distribusi skewed, median + IQR lebih representatif daripada mean + SD. Ini standar dalam laporan analisis data profesional untuk data yang tidak simetris.",
    },
  },
  {
    id: "korelasi",
    title: "Korelasi & Hubungan Antar Variabel",
    concept:
      "Seberapa kuat dan ke arah mana dua variabel bergerak bersama. Korelasi ≠ kausalitas.",
    explanation:
      "Koefisien korelasi Pearson (r) berkisar -1 hingga 1. r mendekati 1: korelasi positif kuat. r mendekati -1: korelasi negatif kuat. r ≈ 0: tidak ada korelasi linear. Contoh: durasi video vs retention rate.",
    formula: "r = Σ[(xᵢ-x̄)(yᵢ-ȳ)] / √[Σ(xᵢ-x̄)² · Σ(yᵢ-ȳ)²]",
    dataset: [60, 90, 120, 150, 180, 210, 240, 270, 300, 360],
    datasetLabel: "Durasi video (detik) — variabel X",
    compute: (d) => {
      const retention = d.map((dur) => Math.max(20, 85 - (dur - 60) * 0.18 + (Math.random() * 6 - 3)));
      const meanX = d.reduce((a, b) => a + b, 0) / d.length;
      const meanY = retention.reduce((a, b) => a + b, 0) / retention.length;
      const num = d.reduce((a, b, i) => a + (b - meanX) * (retention[i] - meanY), 0);
      const den = Math.sqrt(
        d.reduce((a, b) => a + Math.pow(b - meanX, 2), 0) *
          retention.reduce((a, b) => a + Math.pow(b - meanY, 2), 0)
      );
      const r = num / den;
      return {
        "Rata-rata durasi": `${meanX.toFixed(0)} detik`,
        "Rata-rata retention": `${meanY.toFixed(1)}%`,
        "Korelasi Pearson (r)": r.toFixed(3),
        "Interpretasi": r < -0.7 ? "Korelasi negatif kuat" : r < -0.3 ? "Korelasi negatif sedang" : "Lemah",
        "Kesimpulan": "Semakin panjang video → retention cenderung turun",
      };
    },
    insight:
      "Korelasi negatif antara durasi dan retention adalah temuan umum di platform pendek. Tapi ingat: korelasi bukan kausalitas! Mungkin ada faktor ketiga (topik, hook quality) yang lebih berpengaruh.",
    quiz: {
      question: "Studi menemukan korelasi r=0.85 antara jumlah thumbnail berwarna cerah dan views. Apa kesimpulan yang tepat?",
      options: [
        "Thumbnail cerah MENYEBABKAN video mendapat lebih banyak views — kita harus ganti semua thumbnail",
        "Ada hubungan positif yang kuat, namun ini baru korelasi, bukan bukti kausalitas langsung",
        "r=0.85 artinya 85% views berasal dari thumbnail",
        "Korelasi ini tidak bermakna karena hanya r=0.85 bukan r=1.0",
      ],
      correct: 1,
      explanation:
        "Korelasi kuat (r=0.85) menunjukkan pola hubungan yang signifikan, tapi tidak membuktikan sebab-akibat. Mungkin kreator yang lebih berpengalaman (quality content) juga cenderung membuat thumbnail lebih menarik.",
    },
  },
  {
    id: "outlier",
    title: "Outlier & Deteksi Anomali",
    concept: "Nilai yang jauh berbeda dari pola umum data. Bisa jadi masalah, atau bisa jadi insight paling berharga.",
    explanation:
      "Metode sederhana: IQR method. Hitung Q1 (25th percentile) dan Q3 (75th percentile), lalu IQR = Q3 - Q1. Nilai di bawah Q1 - 1.5×IQR atau di atas Q3 + 1.5×IQR dianggap outlier. Dalam data konten, outlier positif (video viral) adalah sinyal penting untuk dianalisis.",
    formula: "Batas bawah = Q1 - 1.5×IQR | Batas atas = Q3 + 1.5×IQR",
    dataset: [8200, 9100, 10400, 9600, 11200, 8800, 10100, 9300, 215000, 10700, 9900, 8600],
    datasetLabel: "Views 12 video terakhir",
    compute: (d) => {
      const sorted = [...d].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      const outliers = sorted.filter((v) => v < lower || v > upper);
      return {
        "Q1 (25th percentile)": q1.toLocaleString(),
        "Q3 (75th percentile)": q3.toLocaleString(),
        "IQR": iqr.toLocaleString(),
        "Batas atas normal": upper.toLocaleString(),
        "Outlier terdeteksi": outliers.map((v) => v.toLocaleString()).join(", "),
        "Status": `${outliers.length} outlier ditemukan`,
      };
    },
    insight:
      "Video 215.000 views terdeteksi sebagai outlier positif. Ini bukan masalah — ini peluang! Analisis faktor apa yang membuat video ini berbeda: topik, thumbnail, timing posting, atau panjang video?",
    quiz: {
      question: "Kamu menemukan outlier negatif dalam data engagement rate. Apa tindakan terbaik?",
      options: [
        "Hapus data tersebut karena akan merusak analisis",
        "Abaikan saja, outlier selalu berarti data error",
        "Investigasi penyebabnya — apakah error data, atau ada insight tersembunyi (konten yang gagal, dll)",
        "Ganti nilainya dengan mean dataset",
      ],
      correct: 2,
      explanation:
        "Outlier harus diinvestigasi, bukan otomatis dihapus. Outlier negatif bisa berarti posting di waktu yang salah, topik yang tidak relevan, atau error teknis — semua adalah informasi berharga untuk keputusan konten.",
    },
  },
];

// ═══════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════

function DataBar({ value, max, color = "var(--color-accent)" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          background: "var(--color-surface-2)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", minWidth: 60, textAlign: "right" }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function QuizBlock({
  quiz,
  answered,
  selected,
  onSelect,
}: {
  quiz: Lesson["quiz"];
  answered: boolean;
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Lightbulb size={15} color="var(--color-accent-text)" />
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
          Cek Pemahamanmu
        </span>
      </div>

      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 14, lineHeight: 1.55 }}>
        {quiz.question}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {quiz.options.map((opt, i) => {
          let bg = "var(--color-surface)";
          let border = "1px solid var(--color-border)";
          let color = "var(--color-text-primary)";

          if (answered) {
            if (i === quiz.correct) {
              bg = "color-mix(in srgb, #22C55E 12%, transparent)";
              border = "1px solid #22C55E50";
              color = "#166534";
            } else if (i === selected) {
              bg = "color-mix(in srgb, #EF4444 12%, transparent)";
              border = "1px solid #EF444450";
              color = "#991B1B";
            }
          } else if (selected === i) {
            border = "1px solid var(--color-accent)";
            bg = "var(--color-accent-subtle)";
          }

          return (
            <button
              key={i}
              onClick={() => !answered && onSelect(i)}
              disabled={answered}
              style={{
                background: bg,
                border,
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                textAlign: "left",
                fontSize: "0.875rem",
                color,
                cursor: answered ? "default" : "pointer",
                transition: "all 0.2s",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  minWidth: 20,
                  color: answered && i === quiz.correct ? "#22C55E" : "var(--color-text-muted)",
                }}
              >
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
              {answered && i === quiz.correct && (
                <CheckCircle size={14} color="#22C55E" style={{ marginLeft: "auto", flexShrink: 0, marginTop: 2 }} />
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "color-mix(in srgb, #22C55E 10%, transparent)",
            border: "1px solid #22C55E30",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color: "#166534" }}>Penjelasan:</strong> {quiz.explanation}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN MODULE PAGE
// ═══════════════════════════════════════════════════════
export default function StatistikaDasarPage() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [computed, setComputed] = useState<Record<string, string | number> | null>(null);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [showAILab, setShowAILab] = useState(false);

  const lesson = LESSONS[currentLesson];

  function runCompute() {
    setComputed(lesson.compute(lesson.dataset));
  }

  function handleQuizSelect(i: number) {
    setQuizSelected(i);
    setQuizAnswered(true);
    if (i === lesson.quiz.correct) {
      setCompletedLessons((prev) => new Set([...prev, currentLesson]));
    }
  }

  function goToLesson(idx: number) {
    setCurrentLesson(idx);
    setComputed(null);
    setQuizSelected(null);
    setQuizAnswered(false);
  }

  const maxValue = Math.max(...lesson.dataset);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }} className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p className="caption" style={{ color: "var(--color-accent-text)", marginBottom: 8 }}>
          JALUR PEMULA · STATISTIKA DASAR
        </p>
        <h1 style={{ marginBottom: 8, fontSize: "clamp(1.4rem,3vw,1.875rem)" }}>
          Statistika Dasar untuk Analis Data
        </h1>
        <p>Pelajari 6 konsep inti statistik deskriptif dengan dataset nyata dan latihan interaktif.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
        {/* ── Sidebar: Lesson list ────────────────────── */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            position: "sticky",
            top: "calc(var(--header-height) + 20px)",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={14} color="var(--color-text-muted)" />
              <span className="caption" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>{completedLessons.size}/{LESSONS.length} Selesai</span>
            </div>
            {/* Progress bar */}
            <div
              style={{
                marginTop: 10,
                height: 6,
                background: "var(--color-surface-3)",
                borderRadius: 999,
                overflow: "hidden",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(completedLessons.size / LESSONS.length) * 100}%`,
                  background: "var(--color-accent)",
                  borderRadius: 999,
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 10px var(--color-accent-glow)"
                }}
              />
            </div>
          </div>

          {LESSONS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => goToLesson(i)}
              style={{
                width: "100%",
                padding: "11px 14px",
                textAlign: "left",
                background: i === currentLesson ? "var(--color-accent-subtle)" : "transparent",
                border: "none",
                borderBottom: "1px solid var(--color-border)",
                borderLeft: i === currentLesson ? "3px solid var(--color-accent)" : "3px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
                fontFamily: "var(--font-sans)",
              }}
            >
              {completedLessons.has(i) ? (
                <CheckCircle size={13} color="#22C55E" style={{ flexShrink: 0 }} />
              ) : (
                <div
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    border: `2px solid ${i === currentLesson ? "var(--color-accent)" : "var(--color-border-2)"}`,
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: i === currentLesson ? 600 : 500,
                  color: i === currentLesson ? "var(--color-accent-text)" : "var(--color-text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                {l.title}
              </span>
            </button>
          ))}
        </div>

        {/* ── Main Content ────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Lesson card */}
          <div className="premium-card">
            {/* Lesson header */}
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-surface-2)",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px var(--color-accent-glow)"
                }}
              >
                <BarChart2 size={22} color="var(--color-accent-text)" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                  {lesson.title}
                </div>
                <div className="caption" style={{ marginTop: 4, color: "var(--color-accent-text)" }}>
                  Modul {currentLesson + 1} dari {LESSONS.length}
                </div>
              </div>
            </div>

            {/* Concept + explanation */}
            <div style={{ padding: "24px" }}>
              <div
                style={{
                  padding: "14px 16px",
                  background: "var(--color-accent-subtle)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-accent-text)" }}>
                  Konsep:{" "}
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  {lesson.concept}
                </span>
              </div>

              <p style={{ lineHeight: 1.75, marginBottom: 16 }}>{lesson.explanation}</p>

              {lesson.formula && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.875rem",
                    padding: "12px 16px",
                    background: "var(--color-surface-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-text-primary)",
                    marginBottom: 0,
                  }}
                >
                  {lesson.formula}
                </div>
              )}
            </div>
          </div>

          {/* Dataset explorer */}
          <div className="premium-card">
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--color-surface-2)"
              }}
            >
              <div>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-text-primary)" }}>
                  Praktik Dataset Interaktif
                </span>
                <div className="caption" style={{ marginTop: 4 }}>{lesson.datasetLabel}</div>
              </div>
              <button
                onClick={runCompute}
                className="btn btn-primary"
                style={{ gap: 6, boxShadow: "0 4px 12px var(--color-accent-glow)" }}
              >
                <TrendingUp size={15} strokeWidth={2.5} />
                Hitung Sekarang
              </button>
            </div>

            {/* Data bars */}
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {lesson.dataset.map((v, i) => (
                <DataBar key={i} value={v} max={maxValue} />
              ))}
            </div>

            {/* Results */}
            {computed && (
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12,
                  background: "var(--color-surface-2)",
                }}
              >
                {Object.entries(computed).map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "12px 14px",
                    }}
                  >
                    <div className="caption" style={{ marginBottom: 5 }}>{key}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-accent-text)" }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Insight */}
            {computed && (
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid var(--color-border)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  background: "var(--color-surface-2)",
                }}
              >
                <Lightbulb size={15} color="var(--color-accent-text)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>Insight: </strong>
                  {lesson.insight}
                </p>
              </div>
            )}
          </div>

          {/* AI Lab Toggle */}
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setShowAILab(!showAILab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: "var(--radius-md)",
                background: showAILab
                  ? "linear-gradient(135deg, var(--color-accent), #3B82F6)"
                  : "var(--color-surface-3)",
                border: "1px solid",
                borderColor: showAILab ? "transparent" : "var(--color-border)",
                color: showAILab ? "#12200A" : "var(--color-text-secondary)",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                justifyContent: "center",
                marginBottom: showAILab ? 20 : 0,
                fontFamily: "var(--font-sans)",
                transition: "all 0.3s ease",
              }}
            >
              <Zap size={15} />
              {showAILab ? "Tutup AI Tutor Lab" : "Buka AI Tutor Lab — Tanya Langsung ke AI"}
            </button>
            {showAILab && (
              <AILab
                moduleId="statistika-dasar"
                moduleName="Statistika Dasar"
                initialMessage="Halo! Saya AI Tutor Lab. Ingin bertanya lebih lanjut tentang Mean, Median, Standar Deviasi, atau Korelasi? Tanyakan saja!"
                themeColor="var(--color-accent)"
                themeGradient="linear-gradient(135deg, var(--color-accent), #3B82F6)"
              />
            )}
          </div>

          <QuizBlock
            quiz={lesson.quiz}
            answered={quizAnswered}
            selected={quizSelected}
            onSelect={handleQuizSelect}
          />

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => goToLesson(currentLesson - 1)}
              disabled={currentLesson === 0}
              className="btn btn-ghost"
              style={{ gap: 5 }}
            >
              <ChevronLeft size={15} /> Sebelumnya
            </button>

            {currentLesson < LESSONS.length - 1 ? (
              <button
                onClick={() => goToLesson(currentLesson + 1)}
                className="btn btn-primary"
                style={{ gap: 5 }}
              >
                Modul Berikutnya <ChevronRight size={15} />
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#22C55E", fontWeight: 700 }}>
                <CheckCircle size={16} />
                Modul Selesai! 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
