import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";
import type {
  FreeTalkingScenario,
  FreeTalkingConversationTurn,
  FreeTalkingSampleLine,
} from "@/types/freeTalking";

export const maxDuration = 120;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = { role: "system" | "user"; content: string };

async function chatJson(messages: ChatMsg[]): Promise<string | null> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.65,
      max_tokens: 2000,
    }),
  });
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  if (!res.ok) return null;
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

type RawGenerated = {
  topic?: string;
  situation?: string;
  partner?: Record<string, unknown>;
  visualKeywords?: unknown;
  conversation?: unknown[];
  perfectSampleConversation?: unknown[];
};

function normalizeScenario(raw: RawGenerated): FreeTalkingScenario | null {
  const topic = typeof raw.topic === "string" ? raw.topic.trim() : "";
  const situation = typeof raw.situation === "string" ? raw.situation.trim() : "";
  if (!topic || !situation) return null;

  const kwRaw = raw.visualKeywords;
  const visualKeywords = Array.isArray(kwRaw)
    ? kwRaw.map((k) => String(k).trim()).filter(Boolean)
    : [];
  if (visualKeywords.length === 0) visualKeywords.push("classroom", "friends");

  const partner = raw.partner ?? {};
  const name = typeof partner.name === "string" ? partner.name : "Hailey";
  const role = typeof partner.role === "string" ? partner.role : "classmate";
  const personality =
    typeof partner.personality === "string" ? partner.personality : "friendly and cheerful";

  const conv: FreeTalkingConversationTurn[] = [];
  const convArr = Array.isArray(raw.conversation) ? raw.conversation : [];
  for (let i = 0; i < convArr.length; i++) {
    const t = convArr[i] as Record<string, unknown>;
    const turn = typeof t.turn === "number" ? t.turn : i + 1;
    const speaker = t.speaker === "user" ? "user" : "ai";
    if (speaker === "ai") {
      const text = typeof t.text === "string" ? t.text.trim() : "";
      const koText = typeof t.koText === "string" ? t.koText.trim() : "";
      if (!text) continue;
      conv.push({ turn, speaker: "ai", text, koText: koText || undefined });
    } else {
      const hint = typeof t.hint === "string" ? t.hint.trim() : "";
      const expectedLevel =
        typeof t.expectedLevel === "string" ? t.expectedLevel : "short sentence";
      let keywords: string[] = [];
      if (Array.isArray(t.keywords)) {
        keywords = t.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean);
      }
      conv.push({
        turn,
        speaker: "user",
        expectedLevel,
        hint: hint || "Answer in a short English sentence.",
        keywords: keywords.length ? keywords : ["yes", "like"],
      });
    }
  }

  if (conv.length < 5 || conv[0]?.speaker !== "ai") return null;

  const samples: FreeTalkingSampleLine[] = [];
  const ps = Array.isArray(raw.perfectSampleConversation) ? raw.perfectSampleConversation : [];
  for (const line of ps) {
    const L = line as Record<string, unknown>;
    const sp = L.speaker === "user" ? "user" : "ai";
    const text = typeof L.text === "string" ? L.text.trim() : "";
    if (text) samples.push({ speaker: sp, text });
  }

  if (samples.length < 5) {
    for (const turn of conv) {
      if (turn.speaker === "ai" && turn.text) {
        samples.push({ speaker: "ai", text: turn.text });
      } else if (turn.speaker === "user" && turn.hint) {
        samples.push({ speaker: "user", text: turn.hint.split("/")[0]?.trim() || turn.hint });
      }
    }
  }

  return {
    topic,
    situation,
    partner: { name, role, personality, gender: "female" },
    visualKeywords,
    conversation: conv,
    perfectSampleConversation: samples.slice(0, 14),
  };
}

export async function POST(req: NextRequest) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as { topic?: string };
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    if (!topic) {
      return NextResponse.json({ error: "topic required" }, { status: 400 });
    }

    const system: ChatMsg = {
      role: "system",
      content: `You design English free-talking lessons for Korean elementary students (ages 8–12).
Output ONLY valid JSON (no markdown). The JSON must have:
- "topic": the topic title exactly as given
- "situation": one English sentence (Hailey, a friendly classmate, is the partner)
- "partner": { "name": "Hailey", "role": "classmate", "personality": "friendly and cheerful", "gender": "female" }
- "visualKeywords": array of 3–5 short English nouns for the setting (for subtitles context)

- "conversation": exactly 7 items, turns 1..7 alternating:
  - odd (1,3,5,7): "speaker":"ai", "text" (simple English question), "koText" (Korean translation)
  - even (2,4,6): "speaker":"user", "expectedLevel" (e.g. "short sentence"), "hint" (English example phrase), "keywords" (2–5 English words)
- "perfectSampleConversation": exactly 7 objects alternating ai then user: natural simple English for each line matching the conversation flow

Use CEFR A1–A2 English only for AI lines.`,
    };

    const user: ChatMsg = {
      role: "user",
      content: `Topic: ${topic}`,
    };

    const text = await chatJson([system, user]);
    if (!text) {
      return NextResponse.json({ error: "LLM failed" }, { status: 502 });
    }

    let parsed: RawGenerated;
    try {
      parsed = JSON.parse(stripJsonFence(text)) as RawGenerated;
    } catch {
      return NextResponse.json({ error: "Invalid JSON from model" }, { status: 502 });
    }

    const scenarioBase = normalizeScenario(parsed);
    if (!scenarioBase) {
      return NextResponse.json({ error: "Invalid scenario shape" }, { status: 502 });
    }

    // 빠른 진입을 위해 질문/대화만 우선 반환하고, 이미지는 클라이언트에서 비동기 생성
    return NextResponse.json({ scenario: scenarioBase });
  } catch (e) {
    console.error("generate-scenario:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
