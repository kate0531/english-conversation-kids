import type { FreeTalkingScenario } from "@/types/freeTalking";

/** 10개 주제 - School Life - After School만 mock 데이터 완성 */
export const FREE_TALK_TOPICS = [
  "School Life - After School",
  "My Family",
  "Hobbies",
  "Favorite Food",
  "At the Park",
  "Shopping",
  "Weather",
  "Animals",
  "Weekend Plans",
  "Friends",
] as const;

/** Hailey - School Life용 (캐주얼, 단정한 차림) */
const HAILEY_PROFILE = {
  name: "Hailey",
  role: "classmate",
  personality: "friendly and cheerful",
  gender: "female" as const,
  imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
};

/** Hailey - My Family용 (부드럽고 친근한 인상) */
const HAILEY_FAMILY_PROFILE = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
};

/** 주제별 시나리오 - School Life / My Family 시연용 */
export const FREE_TALK_SCENARIOS: Record<string, FreeTalkingScenario> = {
  "School Life - After School": {
    topic: "School Life - After School",
    situation: "You meet Hailey after school near the playground.",
    partner: HAILEY_PROFILE,
    visualKeywords: ["school playground", "afternoon", "kids", "backpack"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! School is over now. What do you do after school?", koText: "안녕! 이제 방과 후야. 방과 후에 뭐 해?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "I play soccer. / I go home.", keywords: ["soccer"] },
      { turn: 3, speaker: "ai", text: "Oh, that sounds fun! Who do you play with?", koText: "오, 재밌겠다! 누구랑 놀아?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "With my friends.", keywords: ["friends"] },
      { turn: 5, speaker: "ai", text: "Cool! Where do you play?", koText: "멋지다! 어디서 놀아?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "At the playground. / In the park.", keywords: ["playground", "park"] },
      { turn: 7, speaker: "ai", text: "Nice! I like playing after school too.", koText: "좋다! 나도 방과 후에 노는 거 좋아해." },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! School is over now. What do you do after school?" },
      { speaker: "user", text: "I play soccer with my friends." },
      { speaker: "ai", text: "Oh, that sounds fun! Who do you play with?" },
      { speaker: "user", text: "I play with my friends." },
      { speaker: "ai", text: "Cool! Where do you play?" },
      { speaker: "user", text: "We play at the playground." },
      { speaker: "ai", text: "Nice! I like playing after school too." },
    ],
  },
  "My Family": {
    topic: "My Family",
    situation: "Hailey asks about your family.",
    partner: HAILEY_FAMILY_PROFILE,
    visualKeywords: ["home", "family", "cozy"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! How many people are in your family?", koText: "안녕! 가족이 몇 명이야?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "There are four. / We are five.", keywords: ["four", "five"] },
      { turn: 3, speaker: "ai", text: "That's nice! Do you have any brothers or sisters?", koText: "좋다! 형제자매 있어?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "I have a brother. / I have two sisters.", keywords: ["brother", "sister"] },
      { turn: 5, speaker: "ai", text: "That's cool! What do you like to do with your family?", koText: "멋지다! 가족이랑 뭐 하는 거 좋아해?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "We watch movies. / We play games.", keywords: ["movies", "games", "watch", "play"] },
      { turn: 7, speaker: "ai", text: "I love my family too. Let's talk again!", koText: "나도 가족 좋아해. 또 이야기하자!" },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! How many people are in your family?" },
      { speaker: "user", text: "There are four of us." },
      { speaker: "ai", text: "That's nice! Do you have any brothers or sisters?" },
      { speaker: "user", text: "Yes, I have a younger brother." },
      { speaker: "ai", text: "That's cool! What do you like to do with your family?" },
      { speaker: "user", text: "We watch movies together." },
      { speaker: "ai", text: "I love my family too. Let's talk again!" },
    ],
  },
};

/** 배경 이미지 (visualKeywords 기반 mock URL) */
export function getBackgroundImageUrl(keywords: string[]): string {
  const k = keywords[0] ?? "school";
  if (k.includes("playground")) return "https://images.unsplash.com/photo-1582657118090-af35eefb9958?w=800&q=80";
  if (k.includes("park")) return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80";
  if (k.includes("home") || k.includes("family") || k.includes("cozy"))
    return "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80";
  return "https://images.unsplash.com/photo-1582657118090-af35eefb9958?w=800&q=80";
}

/** 인물 이미지 (mock) - 시나리오에 imageUrl 없을 때 폴백 */
export const PARTNER_IMAGE_MALE =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80";
export const PARTNER_IMAGE_FEMALE =
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80";

/** 주제 선택 시 시나리오 반환 (School Life / My Family 시연용) */
export function getScenarioForTopic(topic: string): FreeTalkingScenario {
  return (
    FREE_TALK_SCENARIOS[topic] ??
    FREE_TALK_SCENARIOS["School Life - After School"]
  );
}
