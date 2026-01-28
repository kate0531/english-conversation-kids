import type { QuestionItem } from "@/types/conversation";

/** 실사 느낌의 이미지 (Unsplash, 픽사베이 등 프리 사용 가능한 URL) */
const IMG = {
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80",
  school: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=80",
  weather: "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=400&q=80",
  hobby: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80",
  family: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80",
  weekend: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80",
} as const;

export const QUESTIONS: Record<string, QuestionItem> = {
  // 1턴: 쉬운 인사/일상
  q1: {
    id: "q1",
    turn: 1,
    level: "easy",
    questionEn: "Good morning! Did you have breakfast today?",
    questionKo: "좋은 아침! 오늘 아침 먹었어?",
    imageUrl: IMG.breakfast,
    reactions: {
      high: "Great job! You sound natural.",
      mid: "Good try! A little more practice and you'll get it.",
      low: "No worries! Let's try again with \"Yes, I did\" or \"No, I didn't\".",
    },
    nextQuestionIds: {
      high: ["q2a", "q2b"],
      mid: ["q2a"],
      low: ["q2a"],
    },
    expectedKeywords: ["yes", "no", "did", "breakfast", "have", "had"],
  },
  // 2턴: 수준별 분기
  q2a: {
    id: "q2a",
    turn: 2,
    level: "medium",
    questionEn: "Do you like your school? What's your favorite subject?",
    questionKo: "학교는 어때? 가장 좋아하는 수업이 뭐야?",
    imageUrl: IMG.school,
    reactions: {
      high: "Wow, you answered in full sentences!",
      mid: "Good! Try adding one more word next time.",
      low: "That's okay. You can say \"I like math\" or \"My favorite is science\".",
    },
    nextQuestionIds: {
      high: ["q3a", "q3b"],
      mid: ["q3a"],
      low: ["q3a"],
    },
    expectedKeywords: ["like", "love", "subject", "math", "science", "english", "favorite"],
  },
  q2b: {
    id: "q2b",
    turn: 2,
    level: "medium",
    questionEn: "How's the weather today? Is it sunny or cloudy?",
    questionKo: "오늘 날씨 어때? 맑아 아니면 흐려?",
    imageUrl: IMG.weather,
    reactions: {
      high: "Perfect! You described the weather well.",
      mid: "Nice! You could add \"It's\" before sunny or cloudy.",
      low: "You can say \"It's sunny\" or \"It's cloudy.\"",
    },
    nextQuestionIds: {
      high: ["q3c", "q3d"],
      mid: ["q3c"],
      low: ["q3c"],
    },
    expectedKeywords: ["sunny", "cloudy", "weather", "hot", "cold", "nice", "good"],
  },
  // 3턴: 조금 더 구체적
  q3a: {
    id: "q3a",
    turn: 3,
    level: "medium",
    questionEn: "What do you like to do after school?",
    questionKo: "방과 후에 뭐 하는 걸 좋아해?",
    imageUrl: IMG.hobby,
    reactions: {
      high: "You're doing great at conversation!",
      mid: "Good answer. Keep going!",
      low: "Try \"I play games\" or \"I read books.\"",
    },
    nextQuestionIds: {
      high: ["q4"],
      mid: ["q4"],
      low: ["q4"],
    },
    expectedKeywords: ["play", "read", "watch", "draw", "sport", "game", "like"],
  },
  q3b: {
    id: "q3b",
    turn: 3,
    level: "hard",
    questionEn: "Who do you play with usually? Your friends or family?",
    questionKo: "보통 누구랑 놀아? 친구들이랑? 가족이랑?",
    imageUrl: IMG.family,
    reactions: {
      high: "Excellent! You used \"with\" and \"or\" correctly.",
      mid: "Not bad! You're getting the hang of it.",
      low: "You can say \"I play with my friends\" or \"With my family.\"",
    },
    nextQuestionIds: {
      high: ["q4"],
      mid: ["q4"],
      low: ["q4"],
    },
    expectedKeywords: ["friends", "family", "with", "play", "mom", "dad", "sister", "brother"],
  },
  q3c: {
    id: "q3c",
    turn: 3,
    level: "medium",
    questionEn: "Do you like rainy days or sunny days better?",
    questionKo: "비 오는 날이랑 맑은 날 중에 뭐가 더 좋아?",
    imageUrl: IMG.weather,
    reactions: {
      high: "I like your choice! You said it clearly.",
      mid: "Good! \"Sunny\" or \"Rainy\" both work.",
      low: "Try \"I like sunny days\" or \"I prefer rainy days.\"",
    },
    nextQuestionIds: {
      high: ["q4"],
      mid: ["q4"],
      low: ["q4"],
    },
    expectedKeywords: ["sunny", "rainy", "like", "better", "prefer", "days"],
  },
  q3d: {
    id: "q3d",
    turn: 3,
    level: "hard",
    questionEn: "What do you do on rainy days at home?",
    questionKo: "비 오는 날엔 집에서 뭐 해?",
    imageUrl: IMG.weekend,
    reactions: {
      high: "You're really good at answering in full sentences!",
      mid: "Nice answer! You're improving.",
      low: "You could say \"I watch TV\" or \"I play inside.\"",
    },
    nextQuestionIds: {
      high: ["q4"],
      mid: ["q4"],
      low: ["q4"],
    },
    expectedKeywords: ["watch", "play", "read", "draw", "home", "inside", "tv", "game"],
  },
  // 4턴: 3턴 이후 “고급” — 자유 대화로 넘어가는 문장 (프로토타입에서는 고정 문구로 표현)
  q4: {
    id: "q4",
    turn: 4,
    level: "hard",
    questionEn: "You did well in this practice! From here, we can talk freely about anything you want. What would you like to talk about?",
    questionKo: "지금까지 잘했어! 이제부터는 하고 싶은 주제로 자유롭게 대화해 보자. 뭘 이야기하고 싶어?",
    imageUrl: IMG.weekend,
    reactions: {
      high: "You're ready for free conversation!",
      mid: "You're almost there. Say any topic you like!",
      low: "Try saying \"my favorite animal\" or \"sports\" or \"food.\"",
    },
    nextQuestionIds: {
      high: ["q5"],
      mid: ["q5"],
      low: ["q5"],
    },
    expectedKeywords: ["talk", "about", "like", "want", "sports", "food", "movie", "game", "animal", "anything"],
  },
  q5: {
    id: "q5",
    turn: 5,
    level: "hard",
    questionEn: "Great job! You've completed all the steps. Keep practicing and have fun with English!",
    questionKo: "잘했어! 모든 단계를 마쳤어. 계속 연습하고 영어 재밌게 해 보자!",
    imageUrl: IMG.weekend,
    reactions: {
      high: "Amazing! See you next time.",
      mid: "Well done! See you next time.",
      low: "Good effort! See you next time.",
    },
    nextQuestionIds: {
      high: [],
      mid: [],
      low: [],
    },
    expectedKeywords: ["thanks", "bye", "see", "you", "next", "time", "ok"],
  },
};

export const FIRST_QUESTION_ID = "q1";
export const FREE_TALK_FIRST_ID = "q4";

export function getNextQuestion(
  currentId: string,
  achievement: "high" | "mid" | "low"
): QuestionItem | null {
  const q = QUESTIONS[currentId];
  if (!q) return null;
  const ids = q.nextQuestionIds[achievement];
  if (!ids || ids.length === 0) return null;
  const nextId = ids[0];
  return QUESTIONS[nextId] ?? null;
}
