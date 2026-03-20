/**
 * Say It Like a Pro / 복습용 — 가장 최근 학습 대화를 브라우저에 저장
 */
import type { FreeTalkingSampleLine } from "@/types/freeTalking";
import type { TurnMessage, TurnResult } from "@/types/conversation";

const STORAGE_KEY = "kelo-recent-pro-practice-v1";

export type RecentLearningSource = "speaking" | "freeTalking" | "writing";

export interface StoredProPractice {
  updatedAt: number;
  source: RecentLearningSource;
  /** UI에 표시 (예: 주제명, Conversation Time) */
  label?: string;
  /** 샘플 화면에서 AI 말풍선 이름 */
  partnerName?: string;
  lines: FreeTalkingSampleLine[];
}

function safeParse(raw: string | null): StoredProPractice | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as StoredProPractice;
    if (!data || !Array.isArray(data.lines) || data.lines.length === 0) return null;
    const lines = data.lines.filter(
      (l) =>
        l &&
        (l.speaker === "ai" || l.speaker === "user") &&
        typeof l.text === "string"
    ) as FreeTalkingSampleLine[];
    if (lines.length === 0) return null;
    return { ...data, lines };
  } catch {
    return null;
  }
}

export function loadRecentProPractice(): StoredProPractice | null {
  if (typeof window === "undefined") return null;
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveRecentProPractice(payload: StoredProPractice): void {
  if (typeof window === "undefined") return;
  if (!payload.lines?.length) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...payload, updatedAt: payload.updatedAt || Date.now() })
    );
  } catch {
    /* quota / private mode */
  }
}

/** Conversation Time(홈 스피킹) 메시지·채점 결과 → Pro 연습용 대화 */
export function buildSampleLinesFromSpeaking(
  messages: TurnMessage[],
  results: TurnResult[]
): FreeTalkingSampleLine[] {
  const questionByTurn = new Map<number, string>();
  const answerByTurn = new Map<number, string>();
  for (const m of messages) {
    if (m.role === "question") questionByTurn.set(m.turnIndex, m.text);
    if (m.role === "answer") answerByTurn.set(m.turnIndex, m.text);
  }
  const turns = Array.from(questionByTurn.keys())
    .filter((t) => answerByTurn.has(t))
    .sort((a, b) => a - b);
  const lines: FreeTalkingSampleLine[] = [];
  for (const t of turns) {
    const q = questionByTurn.get(t);
    if (!q?.trim()) continue;
    lines.push({ speaker: "ai", text: q.trim() });
    const result = results.find((r) => r.turnIndex === t);
    const rawAnswer = answerByTurn.get(t) ?? "";
    const userText =
      (result?.corrected && result.corrected.trim()) || rawAnswer.trim();
    lines.push({ speaker: "user", text: userText });
  }
  return lines;
}

export function recentSourceLabel(source: RecentLearningSource): string {
  switch (source) {
    case "speaking":
      return "Conversation Time";
    case "freeTalking":
      return "Free Talking";
    case "writing":
      return "Writing Time";
    default:
      return "최근 학습";
  }
}
