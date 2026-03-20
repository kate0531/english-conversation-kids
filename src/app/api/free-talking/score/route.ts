import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function fallbackScore(sentences: string[]): number {
  const cleaned = sentences.map((s) => s.trim()).filter(Boolean);
  if (!cleaned.length) return 0;
  const scores = cleaned.map((s) => {
    const wc = s.split(/\s+/).filter(Boolean).length;
    // 짧으면 낮게, 너무 길면 과해지지 않게 완만하게 스케일
    return clamp(10 + wc * 6, 0, 100);
  });
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg);
}

export async function POST(req: NextRequest) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { sentences } = body as { sentences?: string[] };
    const list = Array.isArray(sentences) ? sentences.map((s) => String(s).trim()).filter(Boolean) : [];
    if (!list.length) {
      return NextResponse.json({ error: "sentences required" }, { status: 400 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are an English teacher for elementary students. " +
              "Given the student's transcribed answers (English sentences), score overall speaking quality. " +
              "Return JSON only.",
          },
          {
            role: "user",
            content:
              `Student sentences:\n` +
              list.map((s, i) => `${i + 1}. ${s}`).join("\n") +
              `\n\nReturn ONLY this JSON shape:\n` +
              `{ \"score\": number, \"perSentence\": [ { \"index\": number, \"score\": number } ] }` +
              `\nScore must be 0-100 (0 worst, 100 best).`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Free-talking score error:", err);
      return NextResponse.json({ error: "score failed" }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid response format" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      score?: number;
      perSentence?: { index: number; score: number }[];
    };

    const score = typeof parsed.score === "number" ? Math.round(clamp(parsed.score, 0, 100)) : null;
    if (score == null) {
      return NextResponse.json({ score: fallbackScore(list) });
    }

    return NextResponse.json({ score });
  } catch {
    // 서버/네트워크 예외 시에도 앱이 멈추지 않게 폴백
    // (단, 여기서는 api 호출 실패이므로 fallbackScore 사용)
    try {
      const body = await req.json();
      const list = Array.isArray(body.sentences)
        ? body.sentences.map((s: unknown) => String(s).trim()).filter(Boolean)
        : [];
      return NextResponse.json({ score: fallbackScore(list) });
    } catch {
      return NextResponse.json({ score: 0 });
    }
  }
}

