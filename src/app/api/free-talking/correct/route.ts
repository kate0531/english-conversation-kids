import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";
import { getPrompt } from "@/lib/prompts";
import type { FreeTalkingScenario, CorrectionPoint } from "@/types/freeTalking";

/** 대화 턴 + userAnswers로 전체 대화 문자열 생성 */
function buildTranscript(scenario: FreeTalkingScenario, userAnswers: string[]): string {
  const lines: string[] = [];
  let userIndex = 0;
  const partnerName = scenario.partner?.name ?? "Partner";
  for (const turn of scenario.conversation) {
    if (turn.speaker === "ai" && turn.text) {
      lines.push(`${partnerName}: ${turn.text}`);
    } else if (turn.speaker === "user") {
      const answer = userAnswers[userIndex++] ?? "(no answer)";
      lines.push(`User: ${answer}`);
    }
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { scenario, userAnswers } = body as {
      scenario: FreeTalkingScenario;
      userAnswers: string[];
    };

    if (!scenario?.conversation || !Array.isArray(userAnswers)) {
      return NextResponse.json(
        { error: "scenario and userAnswers required" },
        { status: 400 }
      );
    }

    const transcript = buildTranscript(scenario, userAnswers);

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
            content: getPrompt("freeTalkingCorrect"),
          },
          {
            role: "user",
            content: `Topic: ${scenario.topic}\nSituation: ${scenario.situation}\n\nDialogue:\n${transcript}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI free-talking correct error:", err);
      return NextResponse.json(
        { error: "OpenAI request failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      corrections?: { koExplanation: string; enCorrected: string }[];
      summary?: string;
    };

    const corrections: CorrectionPoint[] = (parsed.corrections ?? []).map(
      (c) => ({
        koExplanation: c.koExplanation ?? "",
        enCorrected: c.enCorrected ?? "",
      })
    );
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    return NextResponse.json({ corrections, summary });
  } catch (e) {
    console.error("Free-talking correct error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
