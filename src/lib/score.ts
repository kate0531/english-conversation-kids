import type { Achievement } from "@/types/conversation";
import type { QuestionItem } from "@/types/conversation";

export interface EvaluationResult {
  score: number;
  achievement: Achievement;
  corrected?: string;
  feedback?: string;
}

/**
 * 서버 OpenAI LLM(/api/speaking/evaluate)으로 교정·채점, 실패 시 기본 채점
 */
export async function evaluateAnswer(
  userAnswer: string,
  question: QuestionItem
): Promise<EvaluationResult> {
  const raw = userAnswer.trim().toLowerCase();
  if (!raw) return { score: 0, achievement: "low" };

  try {
    const res = await fetch("/api/speaking/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAnswer, question }),
    });
    if (res.ok) {
      const data = (await res.json()) as EvaluationResult;
      if (typeof data.score === "number" && data.achievement) {
        return data;
      }
    }
  } catch {
    /* fallback below */
  }

  // GPT API 없으면 기본 채점 (기존 로직)
  let score = 0;
  const keywords = question.expectedKeywords ?? [];
  const matched = keywords.filter((k) => raw.includes(k.toLowerCase()));
  score += Math.min(matched.length * 25, 60);

  const wordCount = raw.split(/\s+/).length;
  if (wordCount >= 2 && wordCount <= 15) score += 20;
  else if (wordCount >= 1) score += 10;

  if (raw.length >= 5) score += 10;

  const final = Math.min(100, Math.max(0, score));

  let achievement: Achievement = "low";
  if (final >= 70) achievement = "high";
  else if (final >= 40) achievement = "mid";

  return { score: final, achievement };
}
