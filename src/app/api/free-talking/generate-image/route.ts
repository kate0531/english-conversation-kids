import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function generateImage(prompt: string): Promise<string | null> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) return null;
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt.slice(0, 950),
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: Array<{ url?: string }> };
  const url = data.data?.[0]?.url;
  return typeof url === "string" && url.startsWith("http") ? url : null;
}

export async function POST(req: NextRequest) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as { topic?: string; visualKeywords?: string[] };
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    if (!topic) {
      return NextResponse.json({ error: "topic required" }, { status: 400 });
    }
    const keywords =
      Array.isArray(body.visualKeywords) && body.visualKeywords.length > 0
        ? body.visualKeywords.slice(0, 6).join(", ")
        : "kids, classroom, friendly";

    const prompt = `Children's book style illustration for kids English conversation topic "${topic}".
Scene keywords: ${keywords}.
Bright, colorful, positive mood, simple composition, no text, no letters, no logos, no watermark.`;

    const backgroundImageUrl = await generateImage(prompt);
    return NextResponse.json({ backgroundImageUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

