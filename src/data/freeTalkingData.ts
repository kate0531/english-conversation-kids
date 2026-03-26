import type { FreeTalkingScenario } from "@/types/freeTalking";

/** Free Talking 주제 (선택 시 API로 시나리오·이미지 생성, 실패 시 정적 폴백) */
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
  "Birthday Party",
  "Sports Day",
  "Healthy Habits",
  "Dream Job",
  "Music & Songs",
  "My Room",
  "Travel & Vacations",
  "School Subjects",
  "Helping at Home",
  "Seasons & Nature",
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

/** Hailey 프로필 변형 (주제별 살짝 다른 인상) */
const HAILEY_HOBBIES = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1518611012118-3967928c6c99?w=400&q=80",
};
const HAILEY_FOOD = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
};
const HAILEY_PARK = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1531123414780-7427d2dc0bd4?w=400&q=80",
};
const HAILEY_SHOP = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
};
const HAILEY_WEATHER = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1546528367-3d3cfc6a3f85?w=400&q=80",
};
const HAILEY_ANIMALS = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
};
const HAILEY_WEEKEND = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
};
const HAILEY_FRIENDS = {
  ...HAILEY_PROFILE,
  imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
};

/** 주제별 시나리오 (각 주제마다 Hailey와 여러 번 주고받는 대화) */
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

  Hobbies: {
    topic: "Hobbies",
    situation: "Hailey wants to know what you like to do for fun.",
    partner: HAILEY_HOBBIES,
    visualKeywords: ["hobbies", "sports", "music"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! What is your favorite hobby?", koText: "안녕! 제일 좋아하는 취미가 뭐야?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "I like drawing. / I play the piano.", keywords: ["drawing", "piano", "reading", "soccer"] },
      { turn: 3, speaker: "ai", text: "Cool! How often do you do it?", koText: "멋지다! 얼마나 자주 해?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "Every day. / On weekends.", keywords: ["every", "weekend", "often"] },
      { turn: 5, speaker: "ai", text: "Nice! What do you like most about it?", koText: "좋다! 그중에서 뭐가 제일 좋아?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "Because it's fun. / I feel happy.", keywords: ["fun", "happy", "relax"] },
      { turn: 7, speaker: "ai", text: "Awesome! Hobbies make life fun. Let's talk again!", koText: "최고야! 취미는 삶을 재밌게 해. 또 이야기하자!" },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! What is your favorite hobby?" },
      { speaker: "user", text: "I like reading books and drawing." },
      { speaker: "ai", text: "Cool! How often do you do it?" },
      { speaker: "user", text: "I read almost every day." },
      { speaker: "ai", text: "Nice! What do you like most about it?" },
      { speaker: "user", text: "I feel relaxed and happy." },
      { speaker: "ai", text: "Awesome! Hobbies make life fun. Let's talk again!" },
    ],
  },

  "Favorite Food": {
    topic: "Favorite Food",
    situation: "You and Hailey talk about food you love.",
    partner: HAILEY_FOOD,
    visualKeywords: ["food", "kitchen", "meal"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! What's your favorite food?", koText: "안녕! 제일 좋아하는 음식이 뭐야?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "I love pizza. / Kimchi stew.", keywords: ["pizza", "rice", "chicken", "noodles"] },
      { turn: 3, speaker: "ai", text: "Yum! When do you usually eat it?", koText: "맛있겠다! 보통 언제 먹어?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "At dinner. / On my birthday.", keywords: ["dinner", "lunch", "birthday"] },
      { turn: 5, speaker: "ai", text: "Great! Can you cook it, or does someone make it for you?", koText: "좋아! 네가 만들어, 아니면 누가 해 주니?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "My mom cooks. / I help sometimes.", keywords: ["mom", "cook", "help"] },
      { turn: 7, speaker: "ai", text: "Sounds delicious! I'd love to try it too. See you!", koText: "맛있을 것 같아! 나도 먹어 보고 싶다. 또 봐!" },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! What's your favorite food?" },
      { speaker: "user", text: "I love chicken and fried rice." },
      { speaker: "ai", text: "Yum! When do you usually eat it?" },
      { speaker: "user", text: "We often have it for dinner." },
      { speaker: "ai", text: "Great! Can you cook it, or does someone make it for you?" },
      { speaker: "user", text: "My mom cooks it. I help cut vegetables." },
      { speaker: "ai", text: "Sounds delicious! I'd love to try it too. See you!" },
    ],
  },

  "At the Park": {
    topic: "At the Park",
    situation: "Hailey chats about going to the park.",
    partner: HAILEY_PARK,
    visualKeywords: ["park", "trees", "outside"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! Do you like going to the park?", koText: "안녕! 공원 가는 거 좋아해?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "Yes, I love it. / Sometimes.", keywords: ["yes", "love", "sometimes"] },
      { turn: 3, speaker: "ai", text: "Nice! What do you like to do at the park?", koText: "좋다! 공원에서 뭐 하고 싶어?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "I swing and run. / Play soccer.", keywords: ["swing", "run", "soccer", "play"] },
      { turn: 5, speaker: "ai", text: "Fun! Who do you usually go with?", koText: "재밌겠다! 주로 누구랑 가?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "With my family. / With friends.", keywords: ["family", "friends", "parents"] },
      { turn: 7, speaker: "ai", text: "The park is the best! Let's play there again soon.", koText: "공원이 최고야! 곧 또 가서 놀자." },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! Do you like going to the park?" },
      { speaker: "user", text: "Yes, I love going to the park on sunny days." },
      { speaker: "ai", text: "Nice! What do you like to do at the park?" },
      { speaker: "user", text: "I ride my bike and play on the swings." },
      { speaker: "ai", text: "Fun! Who do you usually go with?" },
      { speaker: "user", text: "I go with my dad and my little brother." },
      { speaker: "ai", text: "The park is the best! Let's play there again soon." },
    ],
  },

  Shopping: {
    topic: "Shopping",
    situation: "Hailey asks about shopping and things you like to buy.",
    partner: HAILEY_SHOP,
    visualKeywords: ["shopping", "store", "mall"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! Do you like going shopping?", koText: "안녕! 쇼핑하는 거 좋아해?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "Yes, sometimes. / I love it.", keywords: ["yes", "love", "sometimes"] },
      { turn: 3, speaker: "ai", text: "Cool! What do you like to buy?", koText: "멋지다! 뭐 사는 거 좋아해?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "Books and snacks. / New shoes.", keywords: ["books", "toys", "clothes", "snacks"] },
      { turn: 5, speaker: "ai", text: "Nice! Where do you usually go shopping?", koText: "좋아! 보통 어디서 쇼핑해?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "At the supermarket. / At the mall.", keywords: ["supermarket", "mall", "store", "online"] },
      { turn: 7, speaker: "ai", text: "Shopping is fun! Maybe we can go together sometime.", koText: "쇼핑은 재밌어! 언젠가 같이 가도 좋겠다." },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! Do you like going shopping?" },
      { speaker: "user", text: "Yes, I like shopping with my mom on weekends." },
      { speaker: "ai", text: "Cool! What do you like to buy?" },
      { speaker: "user", text: "I like buying stickers and picture books." },
      { speaker: "ai", text: "Nice! Where do you usually go shopping?" },
      { speaker: "user", text: "We usually go to a big bookstore near our home." },
      { speaker: "ai", text: "Shopping is fun! Maybe we can go together sometime." },
    ],
  },

  Weather: {
    topic: "Weather",
    situation: "Hailey talks about the weather with you.",
    partner: HAILEY_WEATHER,
    visualKeywords: ["weather", "sky", "season"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! How is the weather today?", koText: "안녕! 오늘 날씨 어때?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "It's sunny. / It's cold and windy.", keywords: ["sunny", "rainy", "cold", "hot"] },
      { turn: 3, speaker: "ai", text: "Oh really? Do you like sunny days or rainy days more?", koText: "정말? 맑은 날이랑 비 오는 날 중에 뭐가 더 좋아?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "I like sunny days. / Rainy days.", keywords: ["sunny", "rainy", "snow"] },
      { turn: 5, speaker: "ai", text: "I see! What clothes do you wear when it's cold?", koText: "그렇구나! 추울 때 뭐 입어?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "A jacket and a hat. / A warm coat.", keywords: ["jacket", "coat", "sweater"] },
      { turn: 7, speaker: "ai", text: "Stay warm! Thanks for chatting about the weather.", koText: "따뜻하게 입어! 날씨 이야기해 줘서 고마워." },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! How is the weather today?" },
      { speaker: "user", text: "It's sunny and a little windy today." },
      { speaker: "ai", text: "Oh really? Do you like sunny days or rainy days more?" },
      { speaker: "user", text: "I like sunny days because I can play outside." },
      { speaker: "ai", text: "I see! What clothes do you wear when it's cold?" },
      { speaker: "user", text: "I wear a thick jacket and gloves." },
      { speaker: "ai", text: "Stay warm! Thanks for chatting about the weather." },
    ],
  },

  Animals: {
    topic: "Animals",
    situation: "Hailey loves animals and wants to know your favorites.",
    partner: HAILEY_ANIMALS,
    visualKeywords: ["animals", "zoo", "pet"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! What's your favorite animal?", koText: "안녕! 제일 좋아하는 동물이 뭐야?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "I like dogs. / Dolphins are cool.", keywords: ["dog", "cat", "rabbit", "dolphin"] },
      { turn: 3, speaker: "ai", text: "Wow! Why do you like that animal?", koText: "와! 그 동물을 왜 좋아해?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "Because they are cute. / They are smart.", keywords: ["cute", "smart", "friendly"] },
      { turn: 5, speaker: "ai", text: "Cool! Do you have a pet at home?", koText: "멋지다! 집에 반려동물 있어?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "Yes, a fish. / No, but I want a dog.", keywords: ["yes", "no", "fish", "dog"] },
      { turn: 7, speaker: "ai", text: "Animals are amazing! Let's talk about them again.", koText: "동물은 정말 놀라워! 또 같이 이야기하자." },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! What's your favorite animal?" },
      { speaker: "user", text: "I like pandas and rabbits." },
      { speaker: "ai", text: "Wow! Why do you like that animal?" },
      { speaker: "user", text: "They look soft and really cute." },
      { speaker: "ai", text: "Cool! Do you have a pet at home?" },
      { speaker: "user", text: "I have a small goldfish in a bowl." },
      { speaker: "ai", text: "Animals are amazing! Let's talk about them again." },
    ],
  },

  "Weekend Plans": {
    topic: "Weekend Plans",
    situation: "Hailey asks what you usually do on weekends.",
    partner: HAILEY_WEEKEND,
    visualKeywords: ["weekend", "calendar", "relax"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! What do you usually do on weekends?", koText: "안녕! 주말에 보통 뭐 해?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "I visit my grandma. / I play games.", keywords: ["visit", "play", "study", "rest"] },
      { turn: 3, speaker: "ai", text: "Sounds nice! Who do you spend weekends with?", koText: "좋다! 주말엔 누구랑 시간 보내?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "My family. / My cousin.", keywords: ["family", "parents", "friends", "cousin"] },
      { turn: 5, speaker: "ai", text: "Great! What is your favorite weekend activity?", koText: "멋지다! 주말에 하는 것 중 제일 좋은 활동이 뭐야?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "Going to the movies. / Riding my bike.", keywords: ["movies", "bike", "park", "sleep"] },
      { turn: 7, speaker: "ai", text: "Enjoy your weekends! Talk to you soon.", koText: "주말 잘 보내! 곧 또 이야기하자." },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! What do you usually do on weekends?" },
      { speaker: "user", text: "I sleep in a little and then study English." },
      { speaker: "ai", text: "Sounds nice! Who do you spend weekends with?" },
      { speaker: "user", text: "I stay home with my parents and sometimes see friends." },
      { speaker: "ai", text: "Great! What is your favorite weekend activity?" },
      { speaker: "user", text: "My favorite is going to the cinema with my friends." },
      { speaker: "ai", text: "Enjoy your weekends! Talk to you soon." },
    ],
  },

  Friends: {
    topic: "Friends",
    situation: "Hailey wants to hear about your friends.",
    partner: HAILEY_FRIENDS,
    visualKeywords: ["friends", "smile", "together"],
    conversation: [
      { turn: 1, speaker: "ai", text: "Hi! Tell me about your best friend.", koText: "안녕! 제일 친한 친구에 대해 말해 줄래?" },
      { turn: 2, speaker: "user", expectedLevel: "short sentence", hint: "Her name is Minji. / He is kind.", keywords: ["name", "kind", "funny", "classmate"] },
      { turn: 3, speaker: "ai", text: "Aww! What do you like to do together?", koText: "좋다! 같이 뭐 하는 걸 좋아해?" },
      { turn: 4, speaker: "user", expectedLevel: "simple answer", hint: "We play games. / We study together.", keywords: ["play", "study", "chat", "sports"] },
      { turn: 5, speaker: "ai", text: "Cool! How did you meet your friend?", koText: "멋지다! 친구는 어떻게 만났어?" },
      { turn: 6, speaker: "user", expectedLevel: "short sentence", hint: "In my class. / At the playground.", keywords: ["class", "school", "same"] },
      { turn: 7, speaker: "ai", text: "Friends are the best! Keep being kind to each other.", koText: "친구가 최고야! 서로 잘 지내." },
    ],
    perfectSampleConversation: [
      { speaker: "ai", text: "Hi! Tell me about your best friend." },
      { speaker: "user", text: "My best friend is Leo. We are in the same class." },
      { speaker: "ai", text: "Aww! What do you like to do together?" },
      { speaker: "user", text: "We play basketball and share snacks." },
      { speaker: "ai", text: "Cool! How did you meet your friend?" },
      { speaker: "user", text: "We met on the first day of school last year." },
      { speaker: "ai", text: "Friends are the best! Keep being kind to each other." },
    ],
  },
};

/** 배경 이미지 (visualKeywords 기반 mock URL) */
export function getBackgroundImageUrl(keywords: string[]): string {
  const joined = (keywords.length ? keywords : ["school"]).join(" ").toLowerCase();
  // play / school area
  if (
    joined.includes("playground") ||
    joined.includes("school") ||
    joined.includes("soccer") ||
    joined.includes("basketball") ||
    joined.includes("sports") ||
    joined.includes("play")
  ) {
    return "https://images.unsplash.com/photo-1582657118090-af35eefb9958?w=800&q=80";
  }
  // outdoor park
  if (
    joined.includes("park") ||
    joined.includes("outside") ||
    joined.includes("swing") ||
    joined.includes("run") ||
    joined.includes("bike") ||
    joined.includes("playground")
  ) {
    return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80";
  }
  // family / home
  if (
    joined.includes("home") ||
    joined.includes("family") ||
    joined.includes("cozy") ||
    joined.includes("mother") ||
    joined.includes("father") ||
    joined.includes("parents") ||
    joined.includes("mom") ||
    joined.includes("dad") ||
    joined.includes("brother") ||
    joined.includes("sister")
  ) {
    return "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80";
  }
  // hobbies / music / reading / study
  if (
    joined.includes("hobb") ||
    joined.includes("music") ||
    joined.includes("sports") ||
    joined.includes("drawing") ||
    joined.includes("piano") ||
    joined.includes("reading") ||
    joined.includes("study") ||
    joined.includes("chat")
  ) {
    return "https://images.unsplash.com/photo-1461896836934-8bda835b7d36?w=800&q=80";
  }
  // food / meal
  if (
    joined.includes("food") ||
    joined.includes("meal") ||
    joined.includes("kitchen") ||
    joined.includes("pizza") ||
    joined.includes("rice") ||
    joined.includes("chicken") ||
    joined.includes("noodles") ||
    joined.includes("kimchi") ||
    joined.includes("burger") ||
    joined.includes("snack")
  ) {
    return "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80";
  }
  // shopping
  if (
    joined.includes("shop") ||
    joined.includes("mall") ||
    joined.includes("store") ||
    joined.includes("books") ||
    joined.includes("toys") ||
    joined.includes("clothes") ||
    joined.includes("shoes") ||
    joined.includes("snacks") ||
    joined.includes("supermarket") ||
    joined.includes("online")
  ) {
    return "https://images.unsplash.com/photo-1555529669-568a5be58e1a?w=800&q=80";
  }
  // weather
  if (
    joined.includes("weather") ||
    joined.includes("sky") ||
    joined.includes("season") ||
    joined.includes("sunny") ||
    joined.includes("rainy") ||
    joined.includes("snow") ||
    joined.includes("cloudy") ||
    joined.includes("windy") ||
    joined.includes("hot") ||
    joined.includes("cold")
  ) {
    return "https://images.unsplash.com/photo-1433863448220-78aaa064dd47?w=800&q=80";
  }
  // animals
  if (
    joined.includes("animal") ||
    joined.includes("zoo") ||
    joined.includes("pet") ||
    joined.includes("dog") ||
    joined.includes("cat") ||
    joined.includes("rabbit") ||
    joined.includes("dolphin") ||
    joined.includes("fish")
  ) {
    return "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=80";
  }
  // weekend plans
  if (
    joined.includes("weekend") ||
    joined.includes("calendar") ||
    joined.includes("relax") ||
    joined.includes("saturday") ||
    joined.includes("sunday")
  ) {
    return "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80";
  }
  // friends
  if (
    joined.includes("friend") ||
    joined.includes("friends") ||
    joined.includes("together") ||
    joined.includes("class") ||
    joined.includes("same") ||
    joined.includes("school")
  ) {
    return "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1582657118090-af35eefb9958?w=800&q=80";
}

/** 인물 이미지 (mock) - 시나리오에 imageUrl 없을 때 폴백 */
export const PARTNER_IMAGE_MALE =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80";
export const PARTNER_IMAGE_FEMALE =
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80";

/** 성인 여성 랜덤 사진 풀 (free talking 파트너용) */
export const ADULT_FEMALE_PARTNER_IMAGES = [
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
  "https://images.unsplash.com/photo-1546528367-3d3cfc6a3f85?w=400&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
  "https://images.unsplash.com/photo-1531123414780-7427d2dc0bd4?w=400&q=80",
  "https://images.unsplash.com/photo-1518611012118-3967928c6c99?w=400&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
  "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=400&q=80",
] as const;

export function getRandomAdultFemalePartnerImageUrl(): string {
  const list = ADULT_FEMALE_PARTNER_IMAGES;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx] ?? PARTNER_IMAGE_FEMALE;
}

/** 주제 선택 시 시나리오 반환 (School Life / My Family 시연용) */
export function getScenarioForTopic(topic: string): FreeTalkingScenario {
  return (
    FREE_TALK_SCENARIOS[topic] ??
    FREE_TALK_SCENARIOS["School Life - After School"]
  );
}
