import type { Achievement } from "@/types/conversation";
import type { QuestionItem } from "@/types/conversation";
import { correctWithGPT, type CorrectionResult } from "./correction";

export interface EvaluationResult {
  score: number;
  achievement: Achievement;
  corrected?: string;
  feedback?: string;
}

/**
 * GPT API로 교정 후 채점 (API 키가 있으면), 없으면 기본 채점
 */
export async function evaluateAnswer(
  userAnswer: string,
  question: QuestionItem
): Promise<EvaluationResult> {
  const raw = userAnswer.trim().toLowerCase();
  if (!raw) return { score: 0, achievement: "low" };

  // GPT API로 교정 시도
  const gptResult = await correctWithGPT(userAnswer, question);

  if (gptResult) {
    // GPT 결과 사용
    const score = gptResult.score;
    let achievement: Achievement = "low";
    if (score >= 70) achievement = "high";
    else if (score >= 40) achievement = "mid";

    return {
      score,
      achievement,
      corrected: gptResult.corrected,
      feedback: gptResult.feedback,
    };
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
