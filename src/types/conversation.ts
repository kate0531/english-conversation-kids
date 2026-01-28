export type Level = "easy" | "medium" | "hard";
export type Achievement = "high" | "mid" | "low"; // 상 / 중 / 하

export interface QuestionItem {
  id: string;
  turn: number;
  level: Level;
  questionEn: string;
  questionKo: string;
  imageUrl: string;
  /** 이 질문으로 넘어오는 조건: 이전 답변 점수 등 */
  nextConditions?: { afterScore?: Achievement; afterTurn?: number };
  /** 수준별 반응 메시지 */
  reactions: {
    high: string;
    mid: string;
    low: string;
  };
  /** 수준별 다음에 나올 수 있는 후보 질문 id */
  nextQuestionIds: {
    high: string[];
    mid: string[];
    low: string[];
  };
  /** 채점 시 참고할 키워드/패턴 (프로토타입에서는 단순 매칭) */
  expectedKeywords?: string[];
}

export interface TurnMessage {
  role: "question" | "answer";
  text: string;
  imageUrl?: string;
  turnIndex: number;
  timestamp: number;
}

export interface TurnResult {
  turnIndex: number;
  userAnswer: string;
  score: number; // 0–100
  achievement: Achievement;
  corrected?: string;
  feedback?: string;
  reaction: string;
}
