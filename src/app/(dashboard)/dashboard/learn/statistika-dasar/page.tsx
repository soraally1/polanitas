"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart2,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Circle,
  Zap,
  Lightbulb,
  BookOpen,
  Clock,
  ArrowLeft,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { AILab } from "@/components/Chatbot";
import { useAuth } from "@/components/auth/AuthProvider";
import { useModuleProgress } from "@/hooks/use-module-progress";

const ACCENT = "#22C55E";
const ACCENT_LIGHT = "rgba(34,197,94,";

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
  onReset,
}: {
  quiz: Lesson["quiz"];
  answered: boolean;
  selected: number | null;
  onSelect: (i: number) => void;
  onReset: () => Promise<void>;
}) {
  const isCorrect = answered && selected === quiz.correct;
  const isWrong = answered && selected !== null && selected !== quiz.correct;

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
            if (isCorrect && i === quiz.correct) {
              // User answered correctly — highlight correct answer green
              bg = "color-mix(in srgb, #22C55E 12%, transparent)";
              border = "1px solid #22C55E50";
              color = "#166534";
            } else if (isWrong && i === selected) {
              // User answered wrong — only highlight their wrong pick in red
              bg = "color-mix(in srgb, #EF4444 12%, transparent)";
              border = "1px solid #EF444450";
              color = "#991B1B";
            }
            // If wrong, do NOT highlight the correct answer
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
                  color: isCorrect && i === quiz.correct ? "#22C55E" : "var(--color-text-muted)",
                }}
              >
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
              {isCorrect && i === quiz.correct && (
                <CheckCircle size={14} color="#22C55E" style={{ marginLeft: "auto", flexShrink: 0, marginTop: 2 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Show explanation only when correct */}
      {isCorrect && (
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

      {/* Show hint when wrong, with retry button */}
      {isWrong && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "color-mix(in srgb, #EF4444 8%, transparent)",
            border: "1px solid #EF444430",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.65,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span><strong style={{ color: "#991B1B" }}>Jawaban salah.</strong> Coba lagi untuk melihat penjelasan.</span>
          <button
            onClick={onReset}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #EF444450",
              background: "color-mix(in srgb, #EF4444 15%, transparent)",
              color: "#991B1B",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN MODULE PAGE
// ═══════════════════════════════════════════════════════
export default function StatistikaDasarPage() {
  const { user } = useAuth();
  const { completedLessons, quizAnswers, isModuleComplete, isLoading, saveAnswer, resetAnswer } =
    useModuleProgress("statistika-dasar", user?.uid, LESSONS.length);

  const [currentLesson, setCurrentLesson] = useState(0);
  const [computed,      setComputed]      = useState<Record<string, string | number> | null>(null);
  const [quizSelected,  setQuizSelected]  = useState<number | null>(null);
  const [quizAnswered,  setQuizAnswered]  = useState(false);
  const [showAILab,     setShowAILab]     = useState(false);

  const lesson = LESSONS[currentLesson];
  const ACCENT = "var(--color-accent)";
  const ACCENT_LIGHT = "var(--color-accent-subtle)";
  const progress = (completedLessons.size / LESSONS.length) * 100;

  useEffect(() => {
    const saved = quizAnswers[currentLesson];
    if (saved) {
      setQuizSelected(saved.selected);
      setQuizAnswered(true);
    } else {
      setQuizSelected(null);
      setQuizAnswered(false);
    }
  }, [currentLesson, quizAnswers]);

  function runCompute() {
    setComputed(lesson.compute(lesson.dataset));
  }

  async function handleQuizSelect(i: number) {
    setQuizSelected(i);
    setQuizAnswered(true);
    await saveAnswer(currentLesson, i, i === lesson.quiz.correct);
  }

  function goToLesson(idx: number) {
    setCurrentLesson(idx);
    setComputed(null);
  }

  const maxValue = Math.max(...lesson.dataset);

  return (
    <div
      className="animate-fade-in-up"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link
          href="/dashboard/learn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--color-text-secondary)",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Kurikulum
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
            }}
          >
            <BookOpen size={15} />
            {completedLessons.size}/{LESSONS.length} selesai
          </div>
          <div
            style={{
              width: 120,
              height: 6,
              background: "var(--color-surface-3)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${ACCENT}, #059669)`,
                borderRadius: 999,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #1A1D23 0%, #2D2F3A 100%)",
          borderRadius: "var(--radius-xl)",
          padding: "32px 36px",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ACCENT_LIGHT}0.3, transparent 70%)`,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: `${ACCENT_LIGHT}20`,
              border: `1px solid ${ACCENT_LIGHT}40`,
              borderRadius: 100,
              padding: "4px 14px",
              marginBottom: 12,
            }}
          >
            <BarChart2 size={13} color="#6EE7B7" />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#6EE7B7",
                letterSpacing: "0.06em",
              }}
            >
              MODUL 0 · STATISTIKA
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.375rem, 3vw, 1.875rem)",
              color: "#F8F9FA",
              letterSpacing: "-0.04em",
              marginBottom: 8,
            }}
          >
            Statistika Dasar untuk Analis Data
          </h1>
          <p style={{ color: "#9CA3AF", maxWidth: 480 }}>
            Pelajari 6 konsep inti statistik deskriptif dengan dataset nyata dan latihan interaktif.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8125rem",
                color: "#9CA3AF",
              }}
            >
              <BookOpen size={14} /> 6 Materi
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8125rem",
                color: "#9CA3AF",
              }}
            >
              <Clock size={14} /> 2 jam
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8125rem",
                color: "#6EE7B7",
                fontWeight: 700,
              }}
            >
              <Zap size={14} /> AI Tutor Lab
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 28,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "0 0 260px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            position: "sticky",
            top: 24,
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            DAFTAR MATERI
          </div>
          {LESSONS.map((l, i) => {
            const isDone = completedLessons.has(i);
            const isActive = i === currentLesson;
            return (
              <button
                key={l.id}
                onClick={() => goToLesson(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: isActive
                    ? `1px solid ${ACCENT_LIGHT}50`
                    : "1px solid transparent",
                  background: isActive ? `${ACCENT_LIGHT}10` : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  width: "100%",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {isDone ? (
                  <CheckCircle
                    size={16}
                    color="#6EE12B"
                    style={{ flexShrink: 0 }}
                  />
                ) : (
                  <Circle
                    size={16}
                    color={isActive ? ACCENT : "var(--color-border-2)"}
                    style={{ flexShrink: 0 }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? ACCENT : "var(--color-text-secondary)",
                    lineHeight: 1.4,
                  }}
                >
                  {i + 1}. {l.title}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            flex: "1 1 400px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            minWidth: 0,
          }}
        >
          <div className="premium-card" style={{ padding: 0 }}>
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid var(--color-border)",
                background: `${ACCENT_LIGHT}05`,
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: `${ACCENT_LIGHT}15`,
                  border: `1px solid ${ACCENT_LIGHT}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BarChart2 size={22} color={ACCENT} strokeWidth={2} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: ACCENT,
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  MATERI {currentLesson + 1} DARI {LESSONS.length}
                </div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    letterSpacing: "-0.02em",
                    color: "var(--color-text-primary)",
                    marginBottom: 2,
                  }}
                >
                  {lesson.title}
                </h2>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {lesson.concept}
                </div>
              </div>
            </div>
            <div style={{ padding: 28 }}>
              <div
                style={{
                  fontSize: "0.9375rem",
                  lineHeight: 1.75,
                  color: "var(--color-text-secondary)",
                  marginBottom: 24,
                  whiteSpace: "pre-wrap",
                }}
              >
                {lesson.explanation}
              </div>

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
                  }}
                >
                  {lesson.formula}
                </div>
              )}
            </div>
          </div>

          <div className="premium-card" style={{ padding: 0 }}>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--color-surface-2)",
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: "var(--radius-md)",
                  background: `linear-gradient(135deg, ${ACCENT}, #059669)`,
                  border: "none",
                  color: "#FFF",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <TrendingUp size={15} strokeWidth={2.5} />
                Hitung Sekarang
              </button>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {lesson.dataset.map((v, i) => (
                <DataBar key={i} value={v} max={maxValue} color={ACCENT} />
              ))}
            </div>

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
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: ACCENT }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                <Lightbulb size={15} color={ACCENT} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>Insight: </strong>
                  {lesson.insight}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAILab((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
              background: showAILab
                ? `linear-gradient(135deg, ${ACCENT}, #059669)`
                : "var(--color-surface-3)",
              border: "1px solid",
              borderColor: showAILab ? "transparent" : "var(--color-border)",
              color: showAILab ? "#FFF" : "var(--color-text-secondary)",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
              marginBottom: showAILab ? 20 : 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            <Zap size={15} />{" "}
            {showAILab ? "Tutup AI Tutor Lab" : "Buka AI Tutor Lab — Tanya Langsung ke AI"}
          </button>
          {showAILab && (
            <AILab
              moduleId="statistika-dasar"
              moduleName="Statistika Dasar"
              initialMessage="Halo! Saya AI Tutor Lab. Ingin bertanya lebih lanjut tentang Mean, Median, Standar Deviasi, atau Korelasi? Tanyakan saja!"
              themeColor={ACCENT}
              themeGradient={`linear-gradient(135deg, ${ACCENT}, #059669)`}
            />
          )}

          <QuizBlock
            quiz={lesson.quiz}
            answered={quizAnswered}
            selected={quizSelected}
            onSelect={handleQuizSelect}
            onReset={async () => {
              setQuizSelected(null);
              setQuizAnswered(false);
              await resetAnswer(currentLesson);
            }}
          />

          {isModuleComplete && (
            <div
              style={{
                padding: "20px 24px",
                background: `linear-gradient(135deg, ${ACCENT_LIGHT}12, rgba(59,130,246,0.08))`,
                border: `1px solid ${ACCENT_LIGHT}35`,
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 4,
              }}
            >
              <Trophy size={24} color="#16A34A" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, color: "#16A34A", marginBottom: 2 }}>🎉 Modul Selesai!</div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                  Semua {LESSONS.length} materi Statistika Dasar telah diselesaikan. Progress disimpan otomatis.
                </div>
              </div>
            </div>
          )}

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
                disabled={!quizAnswered || quizSelected !== lesson.quiz.correct}
                className="btn btn-primary"
                style={{ gap: 5, opacity: quizAnswered && quizSelected === lesson.quiz.correct ? 1 : 0.5 }}
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
