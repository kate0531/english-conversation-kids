import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/openai";
import { getPrompt, type PromptKey } from "@/lib/prompts";

function isPromptKey(value: unknown): value is PromptKey {
  return (
    value === "writingGrammar" ||
    value === "writingAnalyze" ||
    value === "freeTalkingCorrect" ||
    value === "speakingEvaluate" ||
    value === "sessionThreeTurnPlanner"
  );
}

/**
 * OpenAI Chat Completions 프록시
 * Apidog 등에서 로컬 서버로 요청해 OpenAI 응답을 테스트할 수 있습니다.
 * API 키는 서버의 .env.local에만 두면 됩니다.
 */
export async function POST(req: NextRequest) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not set. Add it to .env.local" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      messages,
      promptKey,
      userInput,
      model = "gpt-4o-mini",
      temperature,
      max_tokens,
    } = body as {
      messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
      promptKey?: unknown;
      userInput?: unknown;
      model?: string;
      temperature?: number;
      max_tokens?: number;
    };

    let finalMessages = messages;

    if (promptKey !== undefined) {
      if (!isPromptKey(promptKey)) {
        return NextResponse.json({ error: "invalid promptKey" }, { status: 400 });
      }

      const systemPrompt = getPrompt(promptKey);

      if (Array.isArray(messages) && messages.length > 0) {
        finalMessages = [{ role: "system", content: systemPrompt }, ...messages];
      } else {
        if (typeof userInput !== "string" || !userInput.trim()) {
          return NextResponse.json(
            { error: "userInput is required when messages are omitted" },
            { status: 400 }
          );
        }
        finalMessages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput.trim() },
        ];
      }
    }

    if (!finalMessages || !Array.isArray(finalMessages) || finalMessages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 500,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message ?? "OpenAI request failed", raw: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("OpenAI chat proxy error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
