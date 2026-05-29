"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import {
 MessageSquare,
 ArrowLeft,
 ChevronRight,
 ChevronLeft,
 CheckCircle,
 Circle,
 Zap,
 Lightbulb,
 Target,
 BookOpen,
 Clock,
} from "lucide-react";
import { AILab } from "@/components/Chatbot";
import { useAuth } from "@/components/auth/AuthProvider";
import { useModuleProgress } from "@/hooks/use-module-progress";

interface QuizAnswer {
 questionIndex: number;
 selected: number;
 correct: boolean;
}
const C = "#8B5CF6";
const CL = "rgba(139,92,246,";

const TONES: Record<
 string,
 { label: string; icon: string; sample: string; emotionWords: string[] }
> = {
 aggressive: {
 label: "Agresif",
 icon: "solar:fire-bold-duotone",
 sample:
 "STOP scroll sekarang! Kamu sedang kehilangan ribuan pelanggan setiap hari karena caption yang membosankan. Waktu kamu TERBATAS — pesaing sudah bergerak. Ambil keputusan SEKARANG atau tertinggal selamanya!",
 emotionWords: ["STOP", "kehilangan", "TERBATAS", "SEKARANG", "tertinggal"],
 },
 casual: {
 label: "Santai",
 icon: "solar:emoji-funny-circle-bold-duotone",
 sample:
 "Eh, pernah nggak sih ngerasa caption kamu tuh gitu-gitu aja? Tenang, kamu nggak sendirian kok. Yuk coba cara baru yang lebih fun dan lebih nyambung sama audiens kamu~",
 emotionWords: ["nggak sih", "Tenang", "fun", "nyambung"],
 },
 empathetic: {
 label: "Empatis",
 icon: "solar:heart-bold-duotone",
 sample:
 "Kami memahami betapa lelahnya kamu mencoba membuat konten yang benar-benar terasa personal. Perasaan itu valid. Biarkan kami membantu kamu menemukan suara autentik brand-mu — satu langkah ringan di satu waktu.",
 emotionWords: ["memahami", "lelahnya", "valid", "autentik", "ringan"],
 },
};

const LESSONS = [
 {
 id: "prompt-architecture",
 title: "Arsitektur Prompt untuk Copywriting",
 concept: "Dari Brief ke Output LLM yang Presisi",
 body: `Membuat copy yang efektif dengan LLM bukan sekadar mengetik "buatkan caption bagus". Dibutuhkan **arsitektur prompt** yang tersistematiskan agar output konsisten dan berkualitas tinggi.

**Framework CRISP untuk prompt copywriting:**
- **Context** — Siapa brand-nya, apa produknya, siapa audiens target
- **Role** — Peran apa yang dimainkan AI (copywriter senior, brand strategist, dll)
- **Instruction** — Tugas spesifik dengan batasan jelas (panjang, tone, format)
- **Style** — Contoh gaya bahasa yang diinginkan (berikan sample)
- **Parameters** — Variabel yang bisa diubah (nama produk, benefit, CTA)

Dengan framework ini, kamu bisa menghasilkan ratusan variasi caption yang konsisten secara brand voice tapi unik secara konten.`,
 insight:
 "Prompt yang terstruktur menghasilkan output 3x lebih konsisten dan mengurangi editing time sebesar 70%",
 challenge:
 "**LATIHAN PROMPT:** Tulis prompt CRISP untuk brand skincare yang menarget Gen Z. Pastikan setiap elemen CRISP terisi dengan spesifik!",
 quiz: {
 question:
 "Elemen mana dalam CRISP yang paling sering dilewatkan tapi paling berdampak pada kualitas output?",
 options: [
 "Context — karena AI tidak perlu tahu tentang brand",
 "Style — memberikan contoh gaya bahasa membuat output jauh lebih aligned dengan brand voice",
 "Parameters — variabel tidak penting untuk copywriting",
 "Role — AI tahu kalau diminta menulis pasti berperan sebagai penulis",
 ],
 correct: 1,
 explanation:
 "Tanpa Style example, AI mengandalkan 'default voice' yang generic. Memberikan 2-3 contoh kalimat referensi membuat output sangat aligned dengan brand personality yang diinginkan.",
 },
 },
 {
 id: "personalization",
 title: "Personalisasi per Segmen Audiens",
 concept: "Satu Produk, Seribu Pesan Berbeda",
 body: `Kekuatan terbesar LLM untuk copywriting adalah kemampuan menghasilkan **variasi massal** yang dipersonalisasi per segmen audiens tanpa mengorbankan kualitas.

**Framework Personalisasi 3-Layer:**

**Layer 1 — Demographic:** Umur, lokasi, gender → mengubah bahasa dan referensi budaya. Gen Z Jakarta vs Ibu rumah tangga Surabaya membutuhkan framing yang berbeda total.

**Layer 2 — Psychographic:** Pain points, aspirasi, values → mengubah angle dan emotional trigger. Audiens yang price-sensitive vs quality-focused membutuhkan CTA berbeda.

**Layer 3 — Behavioral:** Power user vs first-timer, cart abandoner vs browser → mengubah urgency level dan offer structure.

Dengan LLM, kamu bisa mengkombinasikan 3 layer ini untuk menghasilkan 50-100 variasi caption yang masing-masing terasa "ditulis khusus" untuk segmen tertentu.`,
 insight:
 "Caption yang dipersonalisasi per segmen menghasilkan engagement rate 2.8x lebih tinggi dari caption generic one-size-fits-all",
 challenge:
 "**SEGMENTASI:** Pilih satu produk. Definisikan 3 segmen audiens berbeda. Untuk setiap segmen, tulis pain point utama dan emotional trigger yang paling efektif.",
 quiz: {
 question: "Apa risiko terbesar dari personalisasi berlebihan dengan LLM?",
 options: [
 "Biaya API yang terlalu mahal",
 "Output yang terlalu banyak sehingga tidak bisa dikelola",
 "Inkonsistensi brand voice — setiap variasi terasa seperti brand berbeda jika tidak ada style guide yang kuat",
 "Personalisasi selalu lebih baik, tidak ada risiko",
 ],
 correct: 2,
 explanation:
 "Personalisasi tanpa guardrails brand voice akan menghasilkan 100 caption yang terasa seperti 100 brand berbeda. Solusinya: style guide yang ketat + few-shot examples di setiap prompt.",
 },
 },
 {
 id: "viral-hooks",
 title: "Viral Hook Engineering",
 concept: "Hook Ã— CTA Ã— Urgency Formula",
 body: `Sebuah copy yang viral memiliki tiga komponen yang bekerja sinergis: **Hook** yang menghentikan scroll, **CTA** yang memaksa aksi, dan **Urgency** yang menciptakan kebutuhan bertindak sekarang.

**Hook Pattern Library:**
- **Contrarian Hook:** "Yang kamu tahu tentang X itu salah..."
- **Curiosity Gap:** "Ada satu hal tentang X yang brand besar sembunyikan..."
- **Social Proof:** "10.000 orang sudah mencoba ini dan 87% melihat perubahan..."
- **Direct Challenge:** "Kamu pikir X kamu sudah bagus? Cek ini."
- **Story Lead:** "3 bulan lalu, aku hampir menyerah..."

Rahasia: hook yang efektif menciptakan **open loop** di otak audiens — mereka HARUS menyelesaikan membaca untuk menutup loop tersebut.`,
 insight:
 "Hook di 3 detik pertama menentukan 80% keberhasilan konten — investasikan waktu terbesar di sini",
 challenge:
 "**HOOK BATTLE:** Tulis 5 variasi hook untuk satu produk menggunakan 5 pattern berbeda. Tanyakan ke AI Lab mana yang paling kuat dan mengapa!",
 quiz: {
 question:
 "Mengapa 'Curiosity Gap' menjadi salah satu hook paling efektif di konten digital?",
 options: [
 "Karena orang suka rahasia",
 "Karena menciptakan open loop kognitif yang secara neurologis memaksa otak untuk mencari penutupnya (Zeigarnik Effect)",
 "Karena algoritmanya memprioritaskan konten mysterious",
 "Karena mudah dibuat oleh AI",
 ],
 correct: 1,
 explanation:
 "Zeigarnik Effect: otak manusia secara natural cenderung mengingat dan memprioritaskan tugas/informasi yang belum selesai. Curiosity Gap exploit efek ini — audiens harus terus menonton/membaca untuk 'menutup' loop yang dibuka oleh hook.",
 },
 },
 {
 id: "quality-control",
 title: "Quality Control Output LLM",
 concept: "Dari Draft AI ke Publishing-Ready",
 body: `Output LLM, sehebat apa pun prompt-nya, selalu membutuhkan **quality control** sebelum publishing. Tanpa QC, risiko terbesar adalah: hallucination (fakta palsu), brand voice drift, dan tonal inconsistency.

**Framework QC 4-Layer:**

**Layer 1 — Fact Check:** Verifikasi setiap klaim, statistik, dan pernyataan. LLM sering "mengarang" angka yang terdengar masuk akal tapi tidak factual.

**Layer 2 — Brand Alignment:** Cek apakah tone, vocabulary, dan messaging sesuai brand guidelines. Red flags: kata-kata yang brand kamu tidak akan pernah gunakan.

**Layer 3 — Legal Compliance:** Pastikan tidak ada klaim kesehatan yang berlebihan, perbandingan kompetitor yang ilegal, atau pelanggaran UU ITE.

**Layer 4 — A/B Readiness:** Format output agar siap untuk split testing — setiap variasi harus cukup berbeda untuk menghasilkan insight yang bermakna.

Automasi QC: buat checklist template yang bisa di-reuse untuk setiap batch output LLM.`,
 insight:
 "Tim yang menerapkan QC 4-Layer mengurangi 'content recall' (konten yang harus ditarik setelah publish) sebesar 95%",
 challenge:
 "**QC PRACTICE:** Minta AI Lab menghasilkan 5 caption untuk produk kamu. Terapkan QC 4-Layer pada setiap caption. Berapa yang lolos semua layer?",
 quiz: {
 question:
 "Pada Layer QC mana kamu paling mungkin menemukan masalah kritis yang bisa merugikan brand secara legal?",
 options: [
 "Layer 1 — Fact Check",
 "Layer 2 — Brand Alignment",
 "Layer 3 — Legal Compliance, karena klaim berlebihan dan pelanggaran regulasi bisa berujung sanksi hukum",
 "Layer 4 — A/B Readiness",
 ],
 correct: 2,
 explanation:
 "Legal Compliance adalah layer paling kritis karena pelanggaran bisa berujung pada tuntutan hukum, denda, atau pencabutan izin. Contoh: klaim 'menyembuhkan jerawat dalam 3 hari' untuk produk skincare bisa melanggar regulasi BPOM.",
 },
 },
 {
 id: "tone-of-voice",
 title: "Tone of Voice Mastery",
 concept: "Menyesuaikan Nada Bicara AI dengan Karakter Brand",
 body: `Menulis dengan AI bukan berarti kehilangan kepribadian brand Anda. **Tone of Voice Mastery** adalah seni memandu LLM agar menghasilkan tulisan dengan nada bicara yang konsisten dengan identitas brand Anda, baik itu profesional, humoris, edukatif, atau bersahabat.

Untuk menguasai ini, Anda harus mendefinisikan parameter suara brand secara spesifik kepada LLM:

**1. Persona & Karakter:** Jelaskan siapa brand Anda (misalnya: "seorang mentor muda yang ramah dan suportif" vs "analis keuangan senior yang formal").

**2. Kosa Kata & Frasa Kunci:** Daftarkan kata-kata yang *wajib* digunakan (misal: "Yuk", "Sobat", "Insight") dan kata-kata yang *dilarang* (misal: kata gaul yang berlebihan untuk brand premium).

**3. Panjang Kalimat & Struktur:** Atur ritme penulisan. Apakah brand Anda menyukai kalimat pendek yang punchy, atau penjelasan panjang yang detail dan terstruktur?`,
 insight:
 "Brand dengan tone of voice yang konsisten di seluruh channel memiliki loyalitas pelanggan 33% lebih tinggi dibanding yang tidak konsisten.",
 challenge: `**PILIH TONE KAMU:** Tentukan 3 kata sifat yang mendeskripsikan tone of voice brand Anda. Tulis sebuah prompt sistem yang mengajarkan LLM untuk menulis dengan 3 karakteristik tersebut!`,
 quiz: {
 question:
 "Manakah cara terbaik untuk memastikan LLM menghasilkan konten dengan tone yang konsisten?",
 options: [
 "Menggunakan prompt yang sama secara berulang tanpa penjelasan context",
 "Memberikan instruksi sistem (system prompt) yang menjabarkan persona, contoh gaya penulisan, dan aturan kosa kata secara spesifik",
 "Membiarkan AI memilih tone-nya sendiri secara acak",
 "Menggunakan software detektor AI",
 ],
 correct: 1,
 explanation:
 "System prompt yang terstruktur dengan penjelasan persona, gaya bahasa, serta contoh input-output (few-shot prompting) adalah cara paling andal untuk menjaga konsistensi tone output LLM.",
 },
 },
 {
 id: "feedback-loop",
 title: "Iterasi & Feedback Loop AI",
 concept: "Proses Penyempurnaan Output Secara Terarah",
 body: `Sangat jarang draf pertama AI langsung sempurna. Kunci utama copywriting AI yang berkualitas terletak pada **Iterasi dan Feedback Loop** — proses memberikan instruksi korektif yang tepat ke LLM untuk memperbaiki bagian spesifik yang kurang memuaskan.

Langkah-langkah menerapkan feedback loop yang efisien:

**1. Jangan Mulai Dari Nol:** Daripada meminta AI membuat ulang seluruh teks dari awal saat ada kesalahan, mintalah koreksi spesifik (misal: "Ubah paragraf kedua agar terdengar lebih persuasif").

**2. Berikan Contoh Nyata:** Jika AI kesulitan memahami revisi Anda, berikan contoh kalimat yang Anda inginkan (misal: "Tulis ulang hook ini seperti contoh berikut...").

**3. Evaluasi dan Simpan:** Setelah mendapatkan output yang ideal, analisis prompt revisi mana yang paling berhasil, dan gunakan parameter tersebut untuk pembuatan konten berikutnya.`,
 insight:
 "Melakukan iterasi bertahap dengan feedback spesifik menghemat 40% waktu revisi dibandingkan meminta AI men-generate ulang draf baru berkali-kali secara acak.",
 challenge: `**COBA ITERASI:** Ambil satu draf iklan yang dibuat AI yang menurut Anda terlalu kaku. Tuliskan 3 prompt feedback spesifik untuk mengubahnya menjadi lebih santai dan berorientasi pada benefit!`,
 quiz: {
 question:
 "Apa cara terbaik untuk merevisi draf AI yang terlalu panjang dan bertele-tele?",
 options: [
 "Meminta AI menulis ulang seluruh draf tanpa instruksi tambahan",
 "Memberikan feedback spesifik seperti: 'Persingkat teks ini menjadi maksimal 150 kata dan gunakan kalimat aktif'",
 "Menghapus seluruh teks dan menulisnya sendiri secara manual dari awal",
 "Mengubah suhu (temperature) API menjadi maksimal",
 ],
 correct: 1,
 explanation:
 "Memberikan instruksi revisi yang spesifik dan terukur (seperti batasan kata atau gaya kalimat) membantu LLM memahami batasan baru dengan lebih presisi.",
 },
 },
 {
 id: "scaling-production",
 title: "Scaling Content Production",
 concept: "Mengembangkan Volume Konten Tanpa Kehilangan Kualitas",
 body: `Ketika Anda sudah menguasai prompt, QC, dan iterasi, tantangan selanjutnya adalah **Scaling Content Production** — meningkatkan kuantitas produksi konten secara eksponensial tanpa mengorbankan kualitas dan konsistensi brand.

Strategi penskalaan konten dengan bantuan AI:

**1. Batch Processing:** Kumpulkan ide konten selama satu bulan sekaligus, lalu gunakan LLM untuk membuat draf konten tersebut dalam satu sesi kerja terstruktur (batching).

**2. Templatisasi Prompt:** Dokumentasikan prompt terbaik yang terbukti menghasilkan conversion rate tinggi ke dalam perpustakaan prompt (prompt library) yang dapat diakses oleh seluruh anggota tim.

**3. Distribusi Peran (Workflow):** Bagi tugas dalam tim dengan jelas: AI berperan sebagai pembuat draf kasar pertama (drafting), sementara copywriter manusia bertindak sebagai editor akhir dan validator kreatif.`,
 insight:
 "Menggunakan workflow kolaborasi manusia-AI yang terstandarisasi memungkinkan bisnis meningkatkan output konten hingga 300% dalam waktu kurang dari 30 hari.",
 challenge: `**DESAIN WORKFLOW:** Buat bagan alur kerja tim Anda yang menggunakan AI untuk memproduksi 30 konten media sosial dalam satu minggu. Siapa yang bertanggung jawab melakukan QC di akhir?`,
 quiz: {
 question:
 "Apa kunci utama agar kualitas konten tidak menurun saat kita meningkatkan volume produksi (scaling) menggunakan AI?",
 options: [
 "Mengurangi pengawasan manusia agar proses lebih cepat",
 "Memiliki Standard Operating Procedure (SOP) dan checklist Quality Control (QC) yang ketat bagi editor manusia",
 "Menggunakan software pembuat konten otomatis 100% tanpa campur tangan manusia",
 "Memposting konten langsung dari output AI tanpa diedit",
 ],
 correct: 1,
 explanation:
 "SOP dan checklist QC adalah benteng pertahanan terakhir. Editor manusia memastikan bahwa meskipun volume konten melonjak, setiap konten yang keluar tetap memenuhi standar kualitas dan etika brand.",
 },
 },
];

function TypewriterViz() {
 const [tone, setTone] = useState<string>("aggressive");
 const [displayedWords, setDisplayedWords] = useState<string[]>([]);
 const [isTyping, setIsTyping] = useState(false);
 const t = TONES[tone];

 useEffect(() => {
 const words = t.sample.split(" ");
 setDisplayedWords([]);
 setIsTyping(true);

 const timeouts: NodeJS.Timeout[] = [];
 words.forEach((_, i) => {
 const timeout = setTimeout(() => {
 setDisplayedWords((prev) => [...prev, words[i]]);
 if (i === words.length - 1) setIsTyping(false);
 }, i * 100);
 timeouts.push(timeout);
 });

 return () => timeouts.forEach(clearTimeout);
 }, [tone]);

 return (
 <div
 style={{
 background: "var(--color-surface)",
 border: "1px solid var(--color-border)",
 borderRadius: "var(--radius-xl)",
 overflow: "hidden",
 }}
 >
 <div
 style={{
 padding: "16px 24px",
 borderBottom: "1px solid var(--color-border)",
 background: "var(--color-surface-2)",
 }}
 >
 <div style={{ fontWeight: 800, fontSize: "1rem" }}>
 Tone of Voice Generator
 </div>
 <div className="caption" style={{ marginTop: 4 }}>
 Pilih tone untuk melihat efek pada copy yang dihasilkan
 </div>
 </div>
 <div style={{ padding: 24 }}>
 <div
 style={{
 display: "flex",
 gap: 10,
 marginBottom: 20,
 flexWrap: "wrap",
 }}
 >
 {Object.entries(TONES).map(([key, val]) => (
 <button
 key={key}
 onClick={() => setTone(key)}
 style={{
 padding: "8px 20px",
 borderRadius: 100,
 border:
 tone === key
 ? `2px solid ${C}`
 : "1px solid var(--color-border)",
 background:
 tone === key ? `${CL}0.1)` : "var(--color-surface-2)",
 color: tone === key ? C : "var(--color-text-secondary)",
 fontWeight: 700,
 fontSize: "0.8125rem",
 cursor: "pointer",
 fontFamily: "var(--font-sans)",
 display: "flex",
 alignItems: "center",
 gap: 8,
 }}
 >
 <Icon icon={val.icon} width={18} />
 {val.label}
 </button>
 ))}
 </div>
 <div
 style={{
 minHeight: 120,
 padding: "20px 24px",
 background: "var(--color-surface-2)",
 borderRadius: "var(--radius-md)",
 border: "1px solid var(--color-border)",
 lineHeight: 1.8,
 fontSize: "1rem",
 }}
 >
 <AnimatePresence mode="wait">
 <motion.div
 key={tone}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 >
 {displayedWords.map((word, i) => {
 const isEmotion = t.emotionWords.some((ew) =>
 word.toLowerCase().includes(ew.toLowerCase()),
 );
 return (
 <motion.span
 key={i}
 initial={{ opacity: 0, filter: "blur(4px)" }}
 animate={{ opacity: 1, filter: "blur(0px)" }}
 transition={{ duration: 0.3 }}
 style={{
 color: isEmotion ? C : "var(--color-text-primary)",
 fontWeight: isEmotion ? 800 : 400,
 textShadow: isEmotion ? `0 0 12px ${CL}0.4)` : "none",
 }}
 >
 {word}{" "}
 </motion.span>
 );
 })}
 {isTyping && (
 <motion.span
 animate={{ opacity: [1, 0] }}
 transition={{ repeat: Infinity, duration: 0.8 }}
 style={{ color: C, fontWeight: 700 }}
 >
 |
 </motion.span>
 )}
 </motion.div>
 </AnimatePresence>
 </div>
 {!isTyping && displayedWords.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 style={{
 marginTop: 16,
 padding: "14px 16px",
 background: `${CL}0.06)`,
 border: `1px solid ${CL}0.2)`,
 borderRadius: "var(--radius-sm)",
 }}
 >
 <strong style={{ color: C, fontSize: "0.875rem" }}>
 Analisis Tone:
 </strong>
 <span
 style={{
 fontSize: "0.875rem",
 color: "var(--color-text-secondary)",
 marginLeft: 8,
 }}
 >
 {tone === "aggressive"
 ? "Menggunakan urgency words dan KAPITAL untuk memaksa aksi. Cocok untuk flash sale dan limited offer."
 : tone === "casual"
 ? "Bahasa kolokial dan friendly. Cocok untuk brand yang menarget Gen Z dan membangun community."
 : "Menunjukkan understanding dan empati. Cocok untuk produk personal care dan layanan konsultasi."}
 </span>
 </motion.div>
 )}
 </div>
 </div>
 );
}

export default function LLMCopywritingPage() {
 const { user } = useAuth();
 const { completedLessons, quizAnswers, isModuleComplete, saveAnswer, resetAnswer } =
 useModuleProgress("llm-copywriting", user?.uid, LESSONS.length);

 const [currentLesson, setCurrentLesson] = useState(0);
 const [quizAnswer, setQuizAnswer] = useState<QuizAnswer | null>(null);
 const [showAILab, setShowAILab] = useState(false);

 // Restore quiz answer for current lesson from Firestore
 useEffect(() => {
 const saved = quizAnswers[currentLesson];
 if (saved) {
 setQuizAnswer({ questionIndex: currentLesson, selected: saved.selected, correct: saved.correct });
 } else {
 setQuizAnswer(null);
 }
 }, [currentLesson, quizAnswers]);
 const lesson = LESSONS[currentLesson];
 const progress = (completedLessons.size / LESSONS.length) * 100;
 function goToLesson(idx: number) {
 setCurrentLesson(idx);
 setShowAILab(false);
 window.scrollTo({ top: 0, behavior: "smooth" });
 }
 async function handleQuizAnswer(i: number) {
 if (quizAnswer) return;
 const correct = i === lesson.quiz.correct;
 setQuizAnswer({ questionIndex: currentLesson, selected: i, correct });
 await saveAnswer(currentLesson, i, correct);
 }
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
 background: `linear-gradient(90deg,${C},#7C3AED)`,
 borderRadius: 999,
 transition: "width 0.5s ease",
 }}
 />
 </div>
 </div>
 </div>
 <div
 style={{
 background: "linear-gradient(135deg,#1A1D23 0%,#2D2F3A 100%)",
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
 background: `radial-gradient(circle,${CL}0.3) 0%,transparent 70%)`,
 }}
 />
 <div style={{ position: "relative", zIndex: 1 }}>
 <div
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: 8,
 background: `${CL}0.2)`,
 border: `1px solid ${CL}0.4)`,
 borderRadius: 100,
 padding: "4px 14px",
 marginBottom: 12,
 }}
 >
 <MessageSquare size={13} color="#C4B5FD" />
 <span
 style={{
 fontSize: "0.75rem",
 fontWeight: 700,
 color: "#C4B5FD",
 letterSpacing: "0.06em",
 }}
 >
 MODUL 5 · LLM COPYWRITING
 </span>
 </div>
 <h1
 style={{
 fontSize: "clamp(1.375rem,3vw,1.875rem)",
 color: "#F8F9FA",
 letterSpacing: "-0.04em",
 marginBottom: 8,
 }}
 >
 Copywriting Hiper-Personalisasi LLM
 </h1>
 <p style={{ color: "#9CA3AF", maxWidth: 480 }}>
 Otomatisasi pembuatan ribuan caption personalisasi dengan framework
 prompt engineering.
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
 <BookOpen size={14} /> 4 Materi
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
 <Clock size={14} /> 3 jam
 </span>
 <span
 style={{
 display: "flex",
 alignItems: "center",
 gap: 6,
 fontSize: "0.8125rem",
 color: "#C4B5FD",
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
 ? `1px solid ${CL}0.5)`
 : "1px solid transparent",
 background: isActive ? `${CL}0.1)` : "transparent",
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
 color={isActive ? C : "var(--color-border-2)"}
 style={{ flexShrink: 0 }}
 />
 )}
 <span
 style={{
 fontSize: "0.8125rem",
 fontWeight: isActive ? 700 : 500,
 color: isActive ? C : "var(--color-text-secondary)",
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
 background: `${CL}0.05)`,
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
 background: `${CL}0.15)`,
 border: `1px solid ${CL}0.3)`,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 flexShrink: 0,
 }}
 >
 <MessageSquare size={22} color={C} strokeWidth={2} />
 </div>
 <div>
 <div
 style={{
 fontSize: "0.6875rem",
 fontWeight: 700,
 color: C,
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
 {lesson.body.replace(/\*\*(.*?)\*\*/g, "$1")}
 </div>
 <div
 style={{
 display: "flex",
 alignItems: "flex-start",
 gap: 12,
 padding: "16px 18px",
 background: `${CL}0.06)`,
 border: `1px solid ${CL}0.2)`,
 borderRadius: "var(--radius-md)",
 marginBottom: 28,
 }}
 >
 <Lightbulb
 size={18}
 color={C}
 style={{ flexShrink: 0, marginTop: 1 }}
 />
 <p
 style={{
 fontSize: "0.875rem",
 color: "var(--color-text-primary)",
 fontStyle: "italic",
 fontWeight: 600,
 lineHeight: 1.6,
 }}
 >
 {lesson.insight}
 </p>
 </div>
 <div style={{ marginBottom: 28 }}>
 <TypewriterViz />
 </div>
 <div
 style={{
 padding: "20px 22px",
 background: "var(--color-surface-2)",
 border: "1px solid var(--color-border)",
 borderRadius: "var(--radius-md)",
 marginBottom: 28,
 }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "center",
 gap: 8,
 marginBottom: 12,
 }}
 >
 <Target size={15} color="var(--color-accent-text)" />
 <span
 style={{
 fontSize: "0.75rem",
 fontWeight: 700,
 color: "var(--color-accent-text)",
 letterSpacing: "0.08em",
 }}
 >
 TANTANGAN PRAKTIK
 </span>
 </div>
 <div
 style={{
 fontSize: "0.875rem",
 lineHeight: 1.7,
 color: "var(--color-text-secondary)",
 whiteSpace: "pre-wrap",
 }}
 >
 {lesson.challenge.replace(/\*\*(.*?)\*\*/g, "$1")}
 </div>
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
 ? `linear-gradient(135deg,${C},#7C3AED)`
 : "var(--color-surface-3)",
 border: "1px solid",
 borderColor: showAILab
 ? "transparent"
 : "var(--color-border)",
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
 {showAILab
 ? "Tutup AI Tutor Lab"
 : "Buka AI Tutor Lab — Tanya Langsung ke AI"}
 </button>
 {showAILab && (
 <AILab
 moduleId="llm-copywriting"
 moduleName="LLM Copywriting"
 initialMessage="Halo! Aku AI Tutor untuk modul Copywriting LLM. Tanyakan tentang prompt engineering, personalisasi copy, atau minta review hook kamu!"
 themeColor={C}
 themeGradient={`linear-gradient(135deg, ${C}, #7C3AED)`}
 />
 )}
 </div>
 </div>
 <div className="premium-card" style={{ padding: 0 }}>
 <div
 style={{
 padding: "20px 24px",
 borderBottom: "1px solid var(--color-border)",
 background: "var(--color-surface-2)",
 display: "flex",
 alignItems: "center",
 gap: 10,
 }}
 >
 <MessageSquare size={18} color="var(--color-accent-text)" />
 <span style={{ fontWeight: 800, fontSize: "1rem" }}>
 Cek Pemahaman
 </span>
 {quizAnswer && (
 <span
 style={{
 marginLeft: "auto",
 fontSize: "0.75rem",
 fontWeight: 700,
 padding: "2px 10px",
 borderRadius: 100,
 background: quizAnswer.correct
 ? "rgba(34,197,94,0.1)"
 : "rgba(239,68,68,0.1)",
 color: quizAnswer.correct ? "#16A34A" : "#DC2626",
 }}
 >
 {quizAnswer.correct ? "✓ Benar!" : "✗ Coba lagi"}
 </span>
 )}
 </div>
 <div style={{ padding: "24px 28px" }}>
 <p
 style={{
 fontWeight: 700,
 fontSize: "1rem",
 color: "var(--color-text-primary)",
 marginBottom: 20,
 lineHeight: 1.5,
 }}
 >
 {lesson.quiz.question}
 </p>
 <div
 style={{ display: "flex", flexDirection: "column", gap: 10 }}
 >
 {lesson.quiz.options.map((opt, i) => {
 const isS = quizAnswer?.selected === i;
 const isC = i === lesson.quiz.correct;
 const sr = !!quizAnswer;
 let bg = "var(--color-surface-2)";
 let border = "1px solid var(--color-border)";
 let color = "var(--color-text-secondary)";
 if (sr && isC && quizAnswer.correct) {
 bg = "rgba(34,197,94,0.08)";
 border = "1px solid rgba(34,197,94,0.4)";
 color = "#15803D";
 } else if (sr && isS && !isC) {
 bg = "rgba(239,68,68,0.08)";
 border = "1px solid rgba(239,68,68,0.4)";
 color = "#B91C1C";
 }
 return (
 <button
 key={i}
 onClick={() => handleQuizAnswer(i)}
 disabled={!!quizAnswer}
 style={{
 padding: "14px 18px",
 borderRadius: "var(--radius-md)",
 background: bg,
 border,
 color,
 fontSize: "0.875rem",
 fontWeight: 500,
 cursor: quizAnswer ? "not-allowed" : "pointer",
 textAlign: "left",
 display: "flex",
 alignItems: "center",
 gap: 10,
 lineHeight: 1.5,
 fontFamily: "var(--font-sans)",
 }}
 >
 <span
 style={{
 width: 24,
 height: 24,
 borderRadius: "50%",
 background:
 sr && isC && quizAnswer.correct
 ? "#16A34A"
 : sr && isS && !isC
 ? "#DC2626"
 : "var(--color-surface-3)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 fontSize: "0.6875rem",
 fontWeight: 800,
 color:
 (sr && isC && quizAnswer.correct) || (sr && isS)
 ? "#FFF"
 : "var(--color-text-muted)",
 flexShrink: 0,
 }}
 >
 {String.fromCharCode(65 + i)}
 </span>
 {opt}
 </button>
 );
 })}
 </div>
 {quizAnswer && (
 <div
 style={{
 marginTop: 20,
 padding: "16px 18px",
 background: quizAnswer.correct
 ? "rgba(34,197,94,0.06)"
 : "rgba(239,68,68,0.06)",
 border: `1px solid ${quizAnswer.correct ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
 borderRadius: "var(--radius-md)",
 }}
 >
 <div
 style={{
 fontSize: "0.75rem",
 fontWeight: 700,
 color: quizAnswer.correct ? "#16A34A" : "#DC2626",
 marginBottom: 6,
 }}
 >
 {quizAnswer.correct ? "✓ PENJELASAN" : "✗ JAWABAN SALAH"}
 </div>
 <p
 style={{
 fontSize: "0.875rem",
 lineHeight: 1.65,
 color: "var(--color-text-secondary)",
 }}
 >
 {quizAnswer.correct
 ? lesson.quiz.explanation
 : "Jawaban Anda kurang tepat. Silakan coba lagi untuk menemukan jawaban yang benar!"}
 </p>
 {!quizAnswer.correct && (
 <button
 onClick={async () => {
 setQuizAnswer(null);
 await resetAnswer(currentLesson);
 }}
 className="btn btn-secondary"
 style={{ marginTop: 12, fontSize: "0.8rem", padding: "6px 12px" }}
 >
 Coba Lagi
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 gap: 12,
 }}
 >
 <button
 onClick={() => goToLesson(currentLesson - 1)}
 disabled={currentLesson === 0}
 className="btn btn-secondary"
 style={{ gap: 8, opacity: currentLesson === 0 ? 0.4 : 1 }}
 >
 <ChevronLeft size={16} /> Sebelumnya
 </button>
 {currentLesson < LESSONS.length - 1 ? (
 <button
 onClick={() => goToLesson(currentLesson + 1)}
 disabled={!quizAnswer || !quizAnswer.correct}
 className="btn btn-primary"
 style={{ gap: 8, opacity: quizAnswer && quizAnswer.correct ? 1 : 0.5 }}
 >
 Materi Berikutnya <ChevronRight size={16} />
 </button>
 ) : (
 <Link
 href="/dashboard/learn"
 className="btn btn-primary"
 style={{ gap: 8 }}
 >
 Selesai! Kembali ke Kurikulum <CheckCircle size={16} />
 </Link>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}