/** 10가지 주제 분류, 각 주제별 영어 쓰기 프롬프트 */
export const WRITING_TOPICS: Record<string, string[]> = {
  Family: [
    "Write about your family. Who lives with you?",
    "Who is your favorite family member and why?",
    "What do you like to do with your family on weekends?",
    "Describe one thing your mom or dad does for you every day.",
    "If you could go on a trip with your family, where would you go?",
  ],
  School: [
    "What is your favorite subject at school and why?",
    "Describe your best friend at school.",
    "What do you do during lunch break?",
    "What is your favorite thing about your school?",
    "Write about one thing you learned this week.",
  ],
  Hobby: [
    "What is your hobby? When do you do it?",
    "Why do you like your hobby?",
    "Write about a new hobby you want to try.",
    "Do you like to draw, sing, or play sports? Write about it.",
    "What do you do in your free time?",
  ],
  Weather: [
    "What is your favorite season and why?",
    "What do you like to do on a sunny day?",
    "What do you like to do on a rainy day?",
    "Describe the weather today.",
    "Do you like summer or winter better? Why?",
  ],
  Food: [
    "What is your favorite food? Why do you like it?",
    "What did you eat for breakfast today?",
    "Write about a food you don't like and why.",
    "If you could eat one thing every day, what would it be?",
    "Describe your favorite meal.",
  ],
  "Daily routine": [
    "What do you do every morning before school?",
    "What do you do after school?",
    "Write about your bedtime routine.",
    "What is the best part of your day?",
    "Describe one thing you do every weekend.",
  ],
  Friends: [
    "Who is your best friend? What do you like about them?",
    "What do you like to do with your friends?",
    "Write about a time you had fun with a friend.",
    "How do you make new friends?",
    "What does a good friend do?",
  ],
  Pets: [
    "Do you have a pet? Describe it.",
    "If you could have any pet, what would it be and why?",
    "What do you need to do to take care of a pet?",
    "Write about an animal you like.",
    "Have you ever had a pet? Write about it.",
  ],
  Weekend: [
    "What did you do last weekend?",
    "What do you usually do on weekends?",
    "What is your favorite thing to do on Saturday?",
    "Write about a perfect weekend.",
    "Do you like weekends or weekdays better? Why?",
  ],
  Travel: [
    "Where do you want to go on a trip? Why?",
    "Write about a place you visited.",
    "What do you need to pack when you travel?",
    "What is your favorite way to travel: car, train, or plane?",
    "Describe a trip you want to take with your family.",
  ],
};

export const TOPIC_KEYS = Object.keys(WRITING_TOPICS) as string[];

export function getRandomPrompt(category: string): string {
  const prompts = WRITING_TOPICS[category];
  if (!prompts?.length) return "";
  return prompts[Math.floor(Math.random() * prompts.length)];
}
