import type { Achievement } from "@/types/conversation";
import type { QuestionItem } from "@/types/conversation";

export interface EvaluationResult {
  score: number;
  achievement: Achievement;
  corrected?: string;
  feedback?: string;
  /** true면 채점 API 미동작 — 진행·분기 없음 */
  evaluationUnavailable?: boolean;
}

const API_FAIL_FEEDBACK =
  "채점 서버에 연결할 수 없어요. Vercel 환경 변수 OPENAI_API_KEY와 재배포를 확인해 주세요.";

/**
 * 서버 OpenAI LLM(/api/speaking/evaluate)으로만 교정·채점. API 실패 시 로컬 키워드 채점 없음.
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
    /* strict: no fallback */
  }

  return {
    score: 0,
    achievement: "low",
    feedback: API_FAIL_FEEDBACK,
    evaluationUnavailable: true,
  };
}
