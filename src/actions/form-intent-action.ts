"use server";

import { getGeneralClient, GROQ_MODEL } from "@/lib/groq-client";

export type FormIntentResponse = {
  isFormAction: boolean;
  action?: any; // The VoiceFormAction payload
  reply?: string; // Text to speak back to the user
};

export async function parseFormIntent(
  pathname: string,
  text: string
): Promise<FormIntentResponse> {
  const groq = getGeneralClient();

  const systemPrompt = `
Kamu adalah asisten suara POLANITAS yang membantu user mengisi form di halaman web.
Tugasmu adalah mendeteksi apakah ucapan user bertujuan untuk mengisi form atau mengklik tombol submit.
Jika YA, kembalikan JSON dengan isFormAction: true, tipe aksi (action), dan balasan suara (reply).
Jika TIDAK, kembalikan JSON dengan isFormAction: false.

Halaman saat ini: ${pathname}

DAFTAR AKSI FORM YANG DIDUKUNG UNTUK HALAMAN /dashboard/sessions:
1. set-topic: Mengisi input "Topik / Produk / Bisnis" (contoh: "isi topik jualan kopi susu")
2. set-audience: Mengisi input "Target Audiens" (contoh: "target audiensnya anak muda 20 tahun")
3. set-region: Mengubah dropdown Region. Kode yang valid: "ID" (Indonesia), "MY" (Malaysia), "SG" (Singapura), "US" (Amerika Serikat).
4. toggle-platform: Mencentang/uncentang platform. Platform yang valid: "tiktok", "youtube", "instagram", "shopee", "tokopedia".
5. set-focus: Mengubah Fokus Riset. ID valid: "trend-konten", "whitespace-produk", "analisis-kompetitor", "strategi-hashtag", "segmentasi-audiens".
6. submit-form: Mengklik tombol "Mulai Riset AI" / Submit form. (contoh: "mulai riset", "submit form ini")

FORMAT JSON OUTPUT YANG WAJIB DIIKUTI:
{
  "isFormAction": boolean,
  "action": {
    "type": "set-topic" | "set-audience" | "set-region" | "toggle-platform" | "set-focus" | "submit-form",
    "value": string, // untuk set-topic, set-audience
    "code": string, // untuk set-region
    "platform": string, // untuk toggle-platform
    "focusId": string // untuk set-focus
  },
  "reply": "Kalimat singkat (maks 2 kalimat) untuk diucapkan ke user sebagai konfirmasi"
}

CONTOH 1: "tolong isi topiknya tentang skincare korea"
{"isFormAction": true, "action": {"type": "set-topic", "value": "skincare korea"}, "reply": "Mengisi topik dengan skincare korea."}

CONTOH 2: "pilih platform tiktok dan shopee" (Hanya bisa proses 1 per request, pilih yang pertama, atau biarkan sistem menangani. Karena format action hanya support 1 platform untuk toggle-platform, pilih salah satu atau jika butuh banyak pakai set-platforms. Untuk sekarang, support single action saja dulu)
{"isFormAction": true, "action": {"type": "toggle-platform", "platform": "tiktok"}, "reply": "Mengubah status platform TikTok."}

CONTOH 3: "apa itu whitespace?"
{"isFormAction": false}

Output HANYA berupa JSON valid tanpa format markdown \`\`\`json.
  `.trim();

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { isFormAction: false };

    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error("[Form Intent Parse Error]:", error);
    return { isFormAction: false };
  }
}
