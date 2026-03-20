import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";

export const maxDuration = 60;

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

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const openaiForm = new FormData();
    const name = file instanceof File ? file.name : "audio.webm";
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
