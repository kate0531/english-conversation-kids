"use client";

import type { FreeTalkingScenario } from "@/types/freeTalking";

interface PlannerTurn {
  turn: number;
  aiQuestionKo: string;
  aiQuestionEn?: string;
  englishHint: string;
}

interface PlannerResponse {
  topic: string;
  turns: PlannerTurn[];
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function toHintKeywords(englishHint: string): string[] {
  return englishHint
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 4);
}

export async function buildThreeTurnScenario(topic: string): Promise<FreeTalkingScenario | null> {
  const userInput = `주제: ${topic}. 세션1, 세션2, 세션3을 각각 1턴씩 써서 총 3턴 질문을 만들어줘.`;
  const res = await fetch("/api/openai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      promptKey: "sessionThreeTurnPlanner",
      userInput,
      temperature: 0.7,
      max_tokens: 700,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const jsonText = extractJsonObject(content);
  if (!jsonText) return null;

  const parsed = JSON.parse(jsonText) as PlannerResponse;
  if (!parsed || !Array.isArray(parsed.turns) || parsed.turns.length < 3) return null;

  const turns = parsed.turns
    .slice(0, 3)
    .sort((a, b) => a.turn - b.turn)
    .map((t) => ({
      turn: t.turn,
      aiQuestionKo: String(t.aiQuestionKo ?? "").trim(),
      aiQuestionEn: String(t.aiQuestionEn ?? "").trim(),
      englishHint: String(t.englishHint ?? "").trim(),
    }));

  if (turns.some((t) => !t.aiQuestionKo || !t.englishHint)) return null;

  return {
    topic,
    situation: "AI generated 3-turn free talking mission.",
    partner: {
      name: "Hailey",
      role: "classmate",
      personality: "friendly and cheerful",
      gender: "female",
      imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    },
    visualKeywords: ["conversation", "classmate", "school"],
    conversation: [
      {
        turn: 1,
        speaker: "ai",
        text: turns[0].aiQuestionEn || turns[0].englishHint,
        koText: turns[0].aiQuestionKo,
      },
      {
        turn: 2,
        speaker: "user",
        expectedLevel: "short sentence",
        hint: turns[0].englishHint,
        keywords: toHintKeywords(turns[0].englishHint),
      },
      {
        turn: 3,
        speaker: "ai",
        text: turns[1].aiQuestionEn || turns[1].englishHint,
        koText: turns[1].aiQuestionKo,
      },
      {
        turn: 4,
        speaker: "user",
        expectedLevel: "short sentence",
        hint: turns[1].englishHint,
        keywords: toHintKeywords(turns[1].englishHint),
      },
      {
        turn: 5,
        speaker: "ai",
        text: turns[2].aiQuestionEn || turns[2].englishHint,
        koText: turns[2].aiQuestionKo,
      },
      {
        turn: 6,
        speaker: "user",
        expectedLevel: "short sentence",
        hint: turns[2].englishHint,
        keywords: toHintKeywords(turns[2].englishHint),
      },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: turns[0].aiQuestionEn || turns[0].englishHint },
      { speaker: "user", text: turns[0].englishHint },
      { speaker: "ai", text: turns[1].aiQuestionEn || turns[1].englishHint },
      { speaker: "user", text: turns[1].englishHint },
      { speaker: "ai", text: turns[2].aiQuestionEn || turns[2].englishHint },
      { speaker: "user", text: turns[2].englishHint },
    ],
  };
}

