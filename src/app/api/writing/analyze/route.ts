import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";
import { getPrompt } from "@/lib/prompts";

function sampleAnalysis(paragraph: string): string {
  const lineCount = paragraph.trim().split(/\n/).filter(Boolean).length;
  if (lineCount <= 1) {
    return "한 문장만 있네요. 질문에 맞게 2~3문장 이상 이어서 쓰면 더 좋아요.";
  }
  return "글의 흐름이 자연스러워요. 마지막 문장에 \"I like it because...\"처럼 이유를 하나 더 붙이면 더 풍성해질 거예요.";
}

export async function POST(req: NextRequest) {
  try {
    const { paragraph } = await req.json();
    if (!paragraph || typeof paragraph !== "string") {
      return NextResponse.json({ error: "paragraph required" }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      return NextResponse.json({ analysis: sampleAnalysis(paragraph) }, { status: 200 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getPrompt("writingAnalyze"),
          },
          {
            role: "user",
            content: paragraph,
          },
        ],
        temperature: 0.6,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI analyze error:", err);
      return NextResponse.json({ analysis: "분석을 불러오지 못했어요." }, { status: 200 });
    }

    const data = await res.json();
    const analysis = data.choices[0]?.message?.content ?? "분석 결과가 없어요.";
    return NextResponse.json({ analysis }, { status: 200 });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
