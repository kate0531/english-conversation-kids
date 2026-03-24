/** A. 스토리 교재 샘플 원고 */
export const STORY_PASSAGE_LINES = [
  "I am a witch.",
  "I am old.",
  "I am an old witch.",
  "It is my cat.",
  "My cat is fat.",
  "It is a fat cat.",
] as const;

export const STORY_PASSAGE = STORY_PASSAGE_LINES.join("\n");

/** 빈칸 미션: 통문장 말하기용 */
export const STORY_BLANKS = [
  {
    id: "b1",
    display: "I am ___ witch.",
    answer: "an old",
    fullSentence: "I am an old witch.",
  },
  {
    id: "b2",
    display: "My cat is ___.",
    answer: "fat",
    fullSentence: "My cat is fat.",
  },
  {
    id: "b3",
    display: "It is ___ fat cat.",
    answer: "a",
    fullSentence: "It is a fat cat.",
  },
] as const;

/** B. word 교재 */
export const WORD_LIST = [
  "fat",
  "old",
  "small",
  "every day",
  "forget",
  "living room",
  "all the time",
] as const;

/** Word 한글 뜻 (음성 인식: 한글 제시 → 영어로 대답) */
export const WORD_KO: Record<string, string> = {
  fat: "뚱뚱한",
  old: "늙은",
  small: "작은",
  "every day": "매일",
  forget: "잊다",
  "living room": "거실",
  "all the time": "항상",
};

/** C. 문법 교재 (a/an) */
export const GRAMMAR_ITEMS = [
  "a bag",
  "an elephant",
  "an apple",
  "a friend",
  "a house",
  "a garden",
] as const;

/** 문법 항목 한글 뜻 (음성 인식: 한글 제시 → 영어로 대답) */
export const GRAMMAR_KO: Record<string, string> = {
  "a bag": "가방",
  "an elephant": "코끼리",
  "an apple": "사과",
  "a friend": "친구",
  "a house": "집",
  "a garden": "정원",
};
