import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";
import { getPrompt } from "@/lib/prompts";
import type { Achievement } from "@/types/conversation";
import type { QuestionItem } from "@/types/conversation";

export interface EvaluateResponseBody {
  score: number;
  achievement: Achievement;
  corrected?: string;
  feedback?: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
    }

    const body = await req.json();
    const { userAnswer, question } = body as {
      userAnswer?: string;
      question?: QuestionItem;
    };

    if (!userAnswer || typeof userAnswer !== "string" || !question?.questionEn) {
      return NextResponse.json({ error: "userAnswer and question required" }, { status: 400 });
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
            content: getPrompt("speakingEvaluate"),
          },
          {
            role: "user",
            content: `Question: ${question.questionEn}
Student's answer: ${userAnswer.trim()}

Please correct and provide feedback as JSON.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI speaking evaluate error:", err);
      return NextResponse.json({ error: "OpenAI request failed" }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid response" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      corrected?: string;
      feedback?: string;
      score?: number;
    };

    const score = Math.min(100, Math.max(0, Number(parsed.score) || 50));
    let achievement: Achievement = "low";
    if (score >= 70) achievement = "high";
    else if (score >= 40) achievement = "mid";

    const payload: EvaluateResponseBody = {
      score,
      achievement,
      corrected: parsed.corrected ?? userAnswer,
      feedback: parsed.feedback ?? "",
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("Speaking evaluate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
