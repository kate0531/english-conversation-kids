import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";

/** Vercel Pro 등에서 긴 음성 허용. Hobby는 플랜상 ~10초로 잘리므로 클라이언트 녹음도 짧게 유지 */
export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isBlobLike(v: unknown): v is Blob {
  return (
    typeof v === "object" &&
    v != null &&
    typeof (v as Blob).arrayBuffer === "function" &&
    typeof (v as Blob).size === "number"
  );
}

/** OpenAI Whisper STT (multipart audio → 텍스트) */
export async function POST(req: NextRequest) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const language = (formData.get("language") as string) || "en";

    // Vercel/Node에서 File이 Blob과 다른 프로토타입 체인일 수 있어 완화 검사
    if (!isBlobLike(file)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const openaiForm = new FormData();
    const name =
      file instanceof File && file.name
        ? file.name
        : guessAudioFilename(file.type);
    openaiForm.append("file", file, name);
    openaiForm.append("model", "whisper-1");
    if (language && language.length === 2) {
      openaiForm.append("language", language);
    }

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI STT error:", err);
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
    }

    const data = (await res.json()) as { text?: string };
    const text = typeof data.text === "string" ? data.text.trim() : "";
    return NextResponse.json({ text });
  } catch (e) {
    console.error("STT route error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

function guessAudioFilename(mime: string): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "audio.m4a";
  if (m.includes("mpeg") || m.includes("mp3")) return "audio.mp3";
  if (m.includes("wav")) return "audio.wav";
  if (m.includes("ogg")) return "audio.ogg";
  return "audio.webm";
}
