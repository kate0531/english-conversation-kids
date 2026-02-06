/** Free Talking Time - Bermuda 스타일 랜덤 대화 프로토타입 */

export interface FreeTalkingPartner {
  name: string;
  role: string;
  personality: string;
  gender?: "male" | "female"; // 사진·음원 성별 통일용
  imageUrl?: string; // mock: 정면 인물 사진
}

export interface FreeTalkingConversationTurn {
  turn: number;
  speaker: "ai" | "user";
  text: string;
  /** AI 발화 한글 번역 (자막용) */
  koText?: string;
  expectedLevel?: string;
  hint?: string;
  /** 힌트로 제시할 키워드 (soccer, friends 등) */
  keywords?: string[];
}

export interface FreeTalkingSampleLine {
  speaker: "ai" | "user";
  text: string;
}

export interface FreeTalkingScenario {
  topic: string;
  situation: string;
  partner: FreeTalkingPartner;
  visualKeywords: string[];
  conversation: FreeTalkingConversationTurn[];
  perfectSampleConversation: FreeTalkingSampleLine[];
}

export interface CorrectionPoint {
  koExplanation: string; // 한글 설명
  enCorrected: string; // 영어 교정 문장
}

export type SubtitleMode = "none" | "ko" | "en";
