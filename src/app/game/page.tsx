"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HomeButton from "@/components/HomeButton";
import VoiceInputButton from "@/components/VoiceInputButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTTS } from "@/hooks/useTTS";
import {
  playBuzzer,
  playClick,
  playDefeatBlast,
  playExplosion,
  playPop,
  playGoSignal,
  playFrogCroak,
  playLaserPulse,
  playTransition,
  playVictoryBlast,
  setBgmDucked,
  startBgmForGameMode,
  startRhythmDanceBgm,
  stopAllCornerBgm,
  stopRhythmDanceBgm,
  unlockAudioContext,
} from "@/lib/sounds";

type ScreenMode =
  | "menu"
  | "bomb"
  | "duel"
  | "twenty"
  | "password"
  | "repair"
  | "wordchain"
  | "memory"
  | "frog"
  | "treasure"
  | "alphabet"
  | "tongue"
  | "rhythm";
type RoundPhase = "idle" | "countdown" | "live" | "judging" | "result";

interface BombMission {
  id: string;
  prompt: string;
  targetSentences: number;
  seconds: number;
}

interface DuelMission {
  id: string;
  taunt: string;
  targetSentences: number;
  seconds: number;
}

interface TwentyQuestion {
  id: string;
  answer: string;
  keywordHints: string[];
  sentenceHints: string[];
}

interface PasswordPuzzle {
  id: string;
  answerWords: string[];
  scrambledWords: string[];
}

interface RepairPuzzle {
  id: string;
  broken: string;
  fixed: string;
  focus: "tense" | "plural" | "sv-agreement";
}

interface WordChainEntry {
  speaker: "ai" | "me";
  word: string;
  turn: number;
}

interface MemoryRound {
  id: string;
  words: string[];
}

interface FrogPuzzle {
  id: string;
  ai: string;
  opposite: string;
}

interface TreasureWord {
  id: string;
  word: string;
}

interface RhythmSentence {
  id: string;
  full: string;
  chunks: [string, string, string];
}

interface TongueLine {
  id: string;
  text: string;
}

const BOMB_MISSIONS: BombMission[] = [
  {
    id: "bomb-1",
    prompt: "Say 2 things about you in 10 seconds! GO!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-2",
    prompt: "Say 3 foods you love before the bomb explodes!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-3",
    prompt: "Say 2 plans for this weekend right now!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-4",
    prompt: "Say 3 animals you like in 10 seconds!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-5",
    prompt: "Say 2 things in your school bag. GO!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-6",
    prompt: "Say 3 colors you can see right now!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-7",
    prompt: "Say 2 hobbies you enjoy after school!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-8",
    prompt: "Say 3 drinks you like to have!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-9",
    prompt: "Say 2 rooms in your house. GO!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-10",
    prompt: "Say 3 things on your study desk!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-11",
    prompt: "Say 2 places you want to visit!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-12",
    prompt: "Say 3 fruits in your kitchen now!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-13",
    prompt: "Say 2 sports you can play!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-14",
    prompt: "Say 3 school subjects you study!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-15",
    prompt: "Say 2 things you did yesterday!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-16",
    prompt: "Say 3 words about today’s weather!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-17",
    prompt: "Say 2 favorite cartoon characters!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-18",
    prompt: "Say 3 clothes you are wearing now!",
    targetSentences: 3,
    seconds: 10,
  },
  {
    id: "bomb-19",
    prompt: "Say 2 things you want to learn next!",
    targetSentences: 2,
    seconds: 10,
  },
  {
    id: "bomb-20",
    prompt: "Say 3 words to cheer your friend up!",
    targetSentences: 3,
    seconds: 10,
  },
];

const DUEL_MISSIONS: DuelMission[] = [
  {
    id: "duel-1",
    taunt: "I can say 3 sentences. Can you?",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-2",
    taunt: "I can talk about my day in 4 sentences!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-3",
    taunt: "I can describe my favorite movie in 3 lines!",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-4",
    taunt: "I can say 4 sentences about my family. Can you?",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-5",
    taunt: "I can make 3 future plans. Try to beat me!",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-6",
    taunt: "I can describe my room in 4 sentences!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-7",
    taunt: "I can talk about my weekend in 4 sentences. Can you?",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-8",
    taunt: "I can list 3 fun games I play!",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-9",
    taunt: "I can describe my best friend in 4 lines!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-10",
    taunt: "I can say 3 reasons I like summer. Can you?",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-11",
    taunt: "I can make 4 sentences about my school day!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-12",
    taunt: "I can tell 3 things in my lunch box!",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-13",
    taunt: "I can explain my favorite food in 4 lines!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-14",
    taunt: "I can say 3 habits I do every morning!",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-15",
    taunt: "I can describe a rainy day in 4 sentences!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-16",
    taunt: "I can say 3 things I do with my family!",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-17",
    taunt: "I can describe my dream room in 4 lines!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-18",
    taunt: "I can make 3 sentences about my pet!",
    targetSentences: 3,
    seconds: 14,
  },
  {
    id: "duel-19",
    taunt: "I can tell 4 things I want to buy!",
    targetSentences: 4,
    seconds: 15,
  },
  {
    id: "duel-20",
    taunt: "I can say 3 goals for next month. Can you?",
    targetSentences: 3,
    seconds: 14,
  },
];

const TWENTY_QUESTIONS: TwentyQuestion[] = [
  {
    id: "q-banana",
    answer: "banana",
    keywordHints: ["monkey", "yellow", "fruit"],
    sentenceHints: [
      "Monkeys like this yellow fruit.",
      "It is a tropical fruit.",
      "You peel the skin off to eat it.",
    ],
  },
  {
    id: "q-apple",
    answer: "apple",
    keywordHints: ["red", "round", "fruit"],
    sentenceHints: [
      "This fruit is often red or green.",
      "It can be sweet and crunchy.",
      "People say one a day keeps the doctor away.",
    ],
  },
  {
    id: "q-tiger",
    answer: "tiger",
    keywordHints: ["animal", "stripe", "jungle"],
    sentenceHints: [
      "This big cat has black stripes.",
      "It is strong and fast.",
      "It lives in forests and grasslands.",
    ],
  },
  {
    id: "q-train",
    answer: "train",
    keywordHints: ["transport", "rail", "station"],
    sentenceHints: [
      "This vehicle runs on rails.",
      "Many people ride it to travel.",
      "You can get on it at a station.",
    ],
  },
  {
    id: "q-pizza",
    answer: "pizza",
    keywordHints: ["food", "cheese", "slice"],
    sentenceHints: [
      "This food is round and cut into slices.",
      "It usually has cheese on top.",
      "People add toppings like pepperoni or mushrooms.",
    ],
  },
  {
    id: "q-rainbow",
    answer: "rainbow",
    keywordHints: ["sky", "color", "rain"],
    sentenceHints: [
      "You can see it after rain.",
      "It has many colors in the sky.",
      "It looks like a big curved line.",
    ],
  },
  {
    id: "q-robot",
    answer: "robot",
    keywordHints: ["machine", "metal", "helper"],
    sentenceHints: [
      "It is a machine that can do tasks.",
      "Some look like humans.",
      "People build it with technology.",
    ],
  },
  {
    id: "q-camera",
    answer: "camera",
    keywordHints: ["photo", "lens", "picture"],
    sentenceHints: [
      "You use it to take pictures.",
      "It has a lens in front.",
      "Phones also have this now.",
    ],
  },
  {
    id: "q-pencil",
    answer: "pencil",
    keywordHints: ["school", "write", "eraser"],
    sentenceHints: [
      "Students use it to write.",
      "It can be sharpened when it gets short.",
      "You can erase what you wrote.",
    ],
  },
  {
    id: "q-chocolate",
    answer: "chocolate",
    keywordHints: ["sweet", "brown", "snack"],
    sentenceHints: [
      "It is a sweet snack.",
      "It is often brown.",
      "Many people like it as a dessert.",
    ],
  },
  {
    id: "q-elephant",
    answer: "elephant",
    keywordHints: ["big", "gray", "trunk"],
    sentenceHints: [
      "This animal is very big and gray.",
      "It has a long trunk.",
      "It can spray water with its trunk.",
    ],
  },
  {
    id: "q-bus",
    answer: "bus",
    keywordHints: ["transport", "stop", "people"],
    sentenceHints: [
      "Many people ride this vehicle together.",
      "You wait for it at a stop.",
      "It drives on roads in the city.",
    ],
  },
  {
    id: "q-balloon",
    answer: "balloon",
    keywordHints: ["party", "air", "float"],
    sentenceHints: [
      "You often see this at parties.",
      "It is filled with air or helium.",
      "It can float in the sky.",
    ],
  },
  {
    id: "q-guitar",
    answer: "guitar",
    keywordHints: ["music", "string", "instrument"],
    sentenceHints: [
      "This is a musical instrument.",
      "You play it by using strings.",
      "Many singers use it on stage.",
    ],
  },
  {
    id: "q-butterfly",
    answer: "butterfly",
    keywordHints: ["insect", "wing", "flower"],
    sentenceHints: [
      "This insect has colorful wings.",
      "It flies from flower to flower.",
      "It starts life as a caterpillar.",
    ],
  },
  {
    id: "q-sandwich",
    answer: "sandwich",
    keywordHints: ["bread", "lunch", "ham"],
    sentenceHints: [
      "You make it with two slices of bread.",
      "People often eat it for lunch.",
      "You can put cheese, ham, or vegetables in it.",
    ],
  },
  {
    id: "q-mountain",
    answer: "mountain",
    keywordHints: ["high", "nature", "climb"],
    sentenceHints: [
      "This place is very high.",
      "People hike and climb here.",
      "You can see snow on top sometimes.",
    ],
  },
  {
    id: "q-clock",
    answer: "clock",
    keywordHints: ["time", "wall", "hour"],
    sentenceHints: [
      "This thing shows time.",
      "You can hang it on a wall.",
      "It has hands or numbers.",
    ],
  },
  {
    id: "q-icecream",
    answer: "ice cream",
    keywordHints: ["cold", "sweet", "dessert"],
    sentenceHints: [
      "This dessert is cold and sweet.",
      "It can melt on hot days.",
      "You can eat it in a cone or cup.",
    ],
  },
  {
    id: "q-library",
    answer: "library",
    keywordHints: ["book", "quiet", "study"],
    sentenceHints: [
      "This place has many books.",
      "People read and study quietly here.",
      "You can borrow books from this place.",
    ],
  },
];

const PASSWORD_SENTENCES: { id: string; words: string[] }[] = [
  { id: "pw-1", words: ["I", "want", "to", "buy", "three", "apples"] },
  { id: "pw-2", words: ["We", "go", "to", "school", "every", "morning"] },
  { id: "pw-3", words: ["My", "brother", "likes", "playing", "soccer", "outside"] },
  { id: "pw-4", words: ["She", "reads", "a", "book", "before", "bedtime"] },
  { id: "pw-5", words: ["They", "watch", "funny", "videos", "after", "dinner"] },
  { id: "pw-6", words: ["Please", "close", "the", "window", "it", "is cold"] },
  { id: "pw-7", words: ["Our", "teacher", "gives", "us", "easy", "homework"] },
  { id: "pw-8", words: ["I", "drink", "milk", "with", "my", "breakfast"] },
  { id: "pw-9", words: ["The", "cat", "sleeps", "on", "the", "sofa"] },
  { id: "pw-10", words: ["Can", "you", "help", "me", "find", "pencil"] },
  { id: "pw-11", words: ["My", "friends", "play", "games", "after", "school"] },
  { id: "pw-12", words: ["She", "eats", "a", "banana", "every", "day"] },
  { id: "pw-13", words: ["Please", "open", "the", "door", "for", "me"] },
  { id: "pw-14", words: ["We", "visit", "grandma", "on", "Sunday", "morning"] },
  { id: "pw-15", words: ["The", "bird", "sings", "near", "my", "window"] },
  { id: "pw-16", words: ["I", "need", "new", "shoes", "for", "soccer"] },
  { id: "pw-17", words: ["They", "clean", "their", "room", "every", "Saturday"] },
  { id: "pw-18", words: ["My", "teacher", "reads", "stories", "to", "us"] },
  { id: "pw-19", words: ["Can", "we", "watch", "a", "movie", "tonight"] },
  { id: "pw-20", words: ["I", "always", "carry", "water", "in", "summer"] },
];

const REPAIR_PUZZLES: RepairPuzzle[] = [
  { id: "r-1", broken: "I goed to the airport yesterday.", fixed: "I went to the airport yesterday.", focus: "tense" },
  { id: "r-2", broken: "She go to school every day.", fixed: "She goes to school every day.", focus: "sv-agreement" },
  { id: "r-3", broken: "He have two cat at home.", fixed: "He has two cats at home.", focus: "plural" },
  { id: "r-4", broken: "They was happy after class.", fixed: "They were happy after class.", focus: "sv-agreement" },
  { id: "r-5", broken: "My brother eat lunch at noon.", fixed: "My brother eats lunch at noon.", focus: "sv-agreement" },
  { id: "r-6", broken: "We buyed a new table.", fixed: "We bought a new table.", focus: "tense" },
  { id: "r-7", broken: "There is three apple in my bag.", fixed: "There are three apples in my bag.", focus: "plural" },
  { id: "r-8", broken: "The baby cry last night.", fixed: "The baby cried last night.", focus: "tense" },
  { id: "r-9", broken: "My mom cook dinner every night.", fixed: "My mom cooks dinner every night.", focus: "sv-agreement" },
  { id: "r-10", broken: "I have many book on my desk.", fixed: "I have many books on my desk.", focus: "plural" },
  { id: "r-11", broken: "He do his homework after school.", fixed: "He does his homework after school.", focus: "sv-agreement" },
  { id: "r-12", broken: "She taked a bus this morning.", fixed: "She took a bus this morning.", focus: "tense" },
  { id: "r-13", broken: "My friend have a red bike.", fixed: "My friend has a red bike.", focus: "sv-agreement" },
  { id: "r-14", broken: "There are one pencil in the box.", fixed: "There is one pencil in the box.", focus: "sv-agreement" },
  { id: "r-15", broken: "They plays soccer on Sunday.", fixed: "They play soccer on Sunday.", focus: "sv-agreement" },
  { id: "r-16", broken: "I eated pizza for dinner.", fixed: "I ate pizza for dinner.", focus: "tense" },
  { id: "r-17", broken: "She have two doll in her room.", fixed: "She has two dolls in her room.", focus: "plural" },
  { id: "r-18", broken: "The dogs runs in the park.", fixed: "The dogs run in the park.", focus: "sv-agreement" },
  { id: "r-19", broken: "We was late for the movie.", fixed: "We were late for the movie.", focus: "sv-agreement" },
  { id: "r-20", broken: "He writed three letter yesterday.", fixed: "He wrote three letters yesterday.", focus: "plural" },
];

const WORD_CHAIN_MAX_TURN = 10;
const WORD_CHAIN_WORDS = [
  "apple", "eagle", "earth", "heart", "tiger", "rabbit", "turtle", "energy", "yellow", "window",
  "whale", "ear", "robot", "teacher", "rain", "night", "table", "engine", "elbow", "water",
  "river", "rocket", "tomato", "ocean", "nose", "eraser", "radio", "owl", "lemon", "notebook",
  "kangaroo", "orange", "envelope", "elevator", "ring", "garden", "napkin", "number", "road", "drum",
  "moon", "needle", "egg", "grape", "elephant", "train", "nut", "truck", "key", "yogurt",
  "toast", "tower", "rose", "earthquake", "emerald", "dream", "map", "piano", "octopus", "sun",
  "newspaper", "ruler", "rope", "eraser", "red", "desk", "kite", "eleven", "north", "hat",
].map((word) => word.toLowerCase());

const MEMORY_ROUNDS: MemoryRound[] = [
  { id: "mem-1", words: ["apple", "book", "cat", "door", "egg"] },
  { id: "mem-2", words: ["sun", "nose", "ear", "robot", "tree"] },
  { id: "mem-3", words: ["water", "ring", "grape", "elephant", "top"] },
  { id: "mem-4", words: ["lamp", "piano", "orange", "eraser", "rain"] },
  { id: "mem-5", words: ["moon", "night", "table", "engine", "earth"] },
  { id: "mem-6", words: ["key", "yogurt", "toast", "train", "nest"] },
  { id: "mem-7", words: ["river", "rocket", "tiger", "radio", "owl"] },
  { id: "mem-8", words: ["hat", "tomato", "ocean", "napkin", "note"] },
  { id: "mem-9", words: ["kite", "eraser", "rose", "egg", "garden"] },
  { id: "mem-10", words: ["drum", "map", "pencil", "lemon", "north"] },
];

const FROG_PUZZLES: FrogPuzzle[] = [
  { id: "frog-1", ai: "I like apples.", opposite: "I don't like apples." },
  { id: "frog-2", ai: "I can swim.", opposite: "I can't swim." },
  { id: "frog-3", ai: "She is happy.", opposite: "She is not happy." },
  { id: "frog-4", ai: "We have homework.", opposite: "We don't have homework." },
  { id: "frog-5", ai: "He can play soccer.", opposite: "He can't play soccer." },
  { id: "frog-6", ai: "They are ready.", opposite: "They are not ready." },
  { id: "frog-7", ai: "I want milk.", opposite: "I don't want milk." },
  { id: "frog-8", ai: "My dad is at home.", opposite: "My dad is not at home." },
  { id: "frog-9", ai: "We can go now.", opposite: "We can't go now." },
  { id: "frog-10", ai: "She likes music.", opposite: "She doesn't like music." },
  { id: "frog-11", ai: "He has a bike.", opposite: "He doesn't have a bike." },
  { id: "frog-12", ai: "I am hungry.", opposite: "I am not hungry." },
  { id: "frog-13", ai: "They are my friends.", opposite: "They are not my friends." },
  { id: "frog-14", ai: "We can see stars.", opposite: "We can't see stars." },
  { id: "frog-15", ai: "She can dance.", opposite: "She can't dance." },
];

const TREASURE_WORDS: TreasureWord[] = [
  { id: "tr-1", word: "apple" },
  { id: "tr-2", word: "banana" },
  { id: "tr-3", word: "orange" },
  { id: "tr-4", word: "grape" },
  { id: "tr-5", word: "peach" },
  { id: "tr-6", word: "watermelon" },
  { id: "tr-7", word: "carrot" },
  { id: "tr-8", word: "tomato" },
  { id: "tr-9", word: "potato" },
  { id: "tr-10", word: "onion" },
  { id: "tr-11", word: "bread" },
  { id: "tr-12", word: "rice" },
  { id: "tr-13", word: "milk" },
  { id: "tr-14", word: "juice" },
  { id: "tr-15", word: "water" },
  { id: "tr-16", word: "cookie" },
  { id: "tr-17", word: "cake" },
  { id: "tr-18", word: "candy" },
  { id: "tr-19", word: "pizza" },
  { id: "tr-20", word: "noodle" },
  { id: "tr-21", word: "school" },
  { id: "tr-22", word: "classroom" },
  { id: "tr-23", word: "teacher" },
  { id: "tr-24", word: "student" },
  { id: "tr-25", word: "friend" },
  { id: "tr-26", word: "book" },
  { id: "tr-27", word: "notebook" },
  { id: "tr-28", word: "pencil" },
  { id: "tr-29", word: "eraser" },
  { id: "tr-30", word: "ruler" },
  { id: "tr-31", word: "desk" },
  { id: "tr-32", word: "chair" },
  { id: "tr-33", word: "bag" },
  { id: "tr-34", word: "homework" },
  { id: "tr-35", word: "question" },
  { id: "tr-36", word: "answer" },
  { id: "tr-37", word: "house" },
  { id: "tr-38", word: "room" },
  { id: "tr-39", word: "door" },
  { id: "tr-40", word: "window" },
  { id: "tr-41", word: "kitchen" },
  { id: "tr-42", word: "bedroom" },
  { id: "tr-43", word: "bathroom" },
  { id: "tr-44", word: "garden" },
  { id: "tr-45", word: "family" },
  { id: "tr-46", word: "mother" },
  { id: "tr-47", word: "father" },
  { id: "tr-48", word: "sister" },
  { id: "tr-49", word: "brother" },
  { id: "tr-50", word: "baby" },
  { id: "tr-51", word: "dog" },
  { id: "tr-52", word: "cat" },
  { id: "tr-53", word: "bird" },
  { id: "tr-54", word: "fish" },
  { id: "tr-55", word: "rabbit" },
  { id: "tr-56", word: "tiger" },
  { id: "tr-57", word: "lion" },
  { id: "tr-58", word: "elephant" },
  { id: "tr-59", word: "monkey" },
  { id: "tr-60", word: "horse" },
  { id: "tr-61", word: "run" },
  { id: "tr-62", word: "walk" },
  { id: "tr-63", word: "jump" },
  { id: "tr-64", word: "sit" },
  { id: "tr-65", word: "stand" },
  { id: "tr-66", word: "open" },
  { id: "tr-67", word: "close" },
  { id: "tr-68", word: "eat" },
  { id: "tr-69", word: "drink" },
  { id: "tr-70", word: "read" },
  { id: "tr-71", word: "write" },
  { id: "tr-72", word: "draw" },
  { id: "tr-73", word: "sing" },
  { id: "tr-74", word: "dance" },
  { id: "tr-75", word: "play" },
  { id: "tr-76", word: "swim" },
  { id: "tr-77", word: "cook" },
  { id: "tr-78", word: "wash" },
  { id: "tr-79", word: "clean" },
  { id: "tr-80", word: "help" },
  { id: "tr-81", word: "happy" },
  { id: "tr-82", word: "sad" },
  { id: "tr-83", word: "big" },
  { id: "tr-84", word: "small" },
  { id: "tr-85", word: "hot" },
  { id: "tr-86", word: "cold" },
  { id: "tr-87", word: "sunny" },
  { id: "tr-88", word: "rainy" },
  { id: "tr-89", word: "cloudy" },
  { id: "tr-90", word: "windy" },
  { id: "tr-91", word: "morning" },
  { id: "tr-92", word: "afternoon" },
  { id: "tr-93", word: "evening" },
  { id: "tr-94", word: "night" },
  { id: "tr-95", word: "today" },
  { id: "tr-96", word: "tomorrow" },
  { id: "tr-97", word: "park" },
  { id: "tr-98", word: "market" },
  { id: "tr-99", word: "library" },
  { id: "tr-100", word: "hospital" },
];

/** 알파벳 코너: 단어당 제한 시간(초) */
const ALPHA_ROUND_SEC = 12;

const RHYTHM_SENTENCES: RhythmSentence[] = [
  { id: "rh-1", full: "I'm going to the airport.", chunks: ["I'm going", "to the", "airport."] },
  { id: "rh-2", full: "I can talk about him all day.", chunks: ["I can", "talk about him", "all day."] },
  { id: "rh-3", full: "We should leave right now.", chunks: ["We should", "leave", "right now."] },
  { id: "rh-4", full: "She wants to learn English.", chunks: ["She wants", "to learn", "English."] },
  { id: "rh-5", full: "They are playing in the park.", chunks: ["They are", "playing in", "the park."] },
  { id: "rh-6", full: "My brother likes pizza.", chunks: ["My brother", "likes", "pizza."] },
  { id: "rh-7", full: "I need a glass of water.", chunks: ["I need", "a glass", "of water."] },
  { id: "rh-8", full: "Let's meet after school.", chunks: ["Let's", "meet after", "school."] },
  { id: "rh-9", full: "The cat is under the table.", chunks: ["The cat", "is under", "the table."] },
  { id: "rh-10", full: "I will call you later.", chunks: ["I will", "call you", "later."] },
  { id: "rh-11", full: "This music makes me dance.", chunks: ["This music", "makes me", "dance."] },
  { id: "rh-12", full: "Please open the window.", chunks: ["Please", "open the", "window."] },
];

const TONGUE_LINES: TongueLine[] = [
  { id: "tg-1", text: "Good blood, bad blood." },
  { id: "tg-2", text: "Black bug, big bug." },
  { id: "tg-3", text: "Blue glue, green glue." },
  { id: "tg-4", text: "Red truck, yellow truck." },
  { id: "tg-5", text: "Fresh fried fish." },
  { id: "tg-6", text: "Big black bear." },
  { id: "tg-7", text: "Sheep sleep soundly." },
  { id: "tg-8", text: "Fast fox fixes fences." },
  { id: "tg-9", text: "Smart snakes slide slowly." },
  { id: "tg-10", text: "Tiny turtles turn twice." },
  { id: "tg-11", text: "Clean cream, cool cream." },
  { id: "tg-12", text: "Short shirt, sharp shirt." },
  { id: "tg-13", text: "Thin thumb, thick thumb." },
  { id: "tg-14", text: "Top chop, chip chop." },
  { id: "tg-15", text: "Ten tiny tap dancers." },
  { id: "tg-16", text: "Brave brown birds blink." },
  { id: "tg-17", text: "Lucky ducks drink lemonade." },
  { id: "tg-18", text: "Wild wolves whistle well." },
  { id: "tg-19", text: "Shiny shoes, shiny socks." },
  { id: "tg-20", text: "Please play purple piano." },
  { id: "tg-21", text: "Six soft sea stars." },
  { id: "tg-22", text: "Best breakfast brings bright brains." },
  { id: "tg-23", text: "Good game, great goal." },
  { id: "tg-24", text: "Tom takes tiny tacos." },
  { id: "tg-25", text: "Jack jumps, Jill jogs." },
  { id: "tg-26", text: "Big bag, pink bag." },
  { id: "tg-27", text: "Cold coffee, hot cocoa." },
  { id: "tg-28", text: "Silver spoon, simple soup." },
  { id: "tg-29", text: "Quick queen quietly quizzes." },
  { id: "tg-30", text: "Round road, right road." },
  { id: "tg-31", text: "Sweet swing, swift swing." },
  { id: "tg-32", text: "Great green grapes grow." },
];

const FLOATING_ITEMS = ["💣", "⚡", "🔥", "💥", "⭐", "🧨", "🕒", "🎯", "🎮", "✨"];

type RhythmPhase = "countdown" | "demo" | "play" | "merging" | "cleared" | "tier2_ment";

type BombMood = "idle" | "active" | "success" | "fail";
type TwentyHintMode = "keywords" | "sentences";

function BombBuddy({ mood, urgent = false }: { mood: BombMood; urgent?: boolean }) {
  const active = mood === "active";
  const success = mood === "success";
  const fail = mood === "fail";
  return (
    <div className="relative flex items-center justify-center select-none pt-5">
      <div
        className="relative w-28 h-28 rounded-full border-4 border-slate-800 bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 shadow-[inset_0_12px_20px_rgba(255,255,255,0.22),0_12px_20px_rgba(0,0,0,0.22)]"
        style={active ? { animation: `bomb-shake ${urgent ? 0.28 : 0.45}s infinite` } : undefined}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-1.5 h-5 rounded-full bg-amber-700 origin-bottom"
          style={active ? { animation: `bomb-shake ${urgent ? 0.26 : 0.42}s infinite` } : undefined}
        />
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-7 text-sm"
          style={active ? { animation: `sparkle ${urgent ? 0.45 : 0.9}s ease-out infinite` } : undefined}
        >
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              urgent ? "bg-rose-300" : success ? "bg-lime-300" : fail ? "bg-amber-300" : "bg-white/80"
            }`}
          />
        </span>
        <div className="absolute left-1/2 -translate-x-1/2 top-7 w-14 h-6 rounded-full bg-white/20 blur-[1px]" />
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-10 w-7 h-7 rounded-full border-4 shadow-inner ${
            success ? "border-lime-200/90" : fail ? "border-amber-200/90" : "border-white/80"
          }`}
        />
        <div className="absolute left-1/2 -translate-x-1/2 top-[2.9rem] w-2.5 h-2.5 rounded-full bg-white" />
      </div>
    </div>
  );
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleWords(words: string[]): string[] {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.every((w, i) => w === words[i])) {
    arr.push(arr.shift() ?? "");
  }
  return arr;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeChainWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function getLastLetter(word: string): string {
  const normalized = normalizeChainWord(word);
  return normalized ? normalized[normalized.length - 1] : "";
}

function tokenizeSentence(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => normalizeWord(w))
    .filter(Boolean);
}

function countWords(text: string): number {
  const matched = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
  return matched ? matched.length : 0;
}

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const byMark = trimmed
    .split(/[.!?]+/)
    .map((x) => x.trim())
    .filter(Boolean).length;
  if (byMark > 0) return byMark;
  const words = countWords(trimmed);
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / 4));
}

function countDuelSpeakingUnits(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const byMark = trimmed
    .split(/[.!?]+/)
    .map((x) => x.trim())
    .filter(Boolean).length;
  const byConnectors = trimmed
    .toLowerCase()
    .split(/\b(?:and|then|also|because|but|so)\b|,/)
    .map((x) => x.trim())
    .filter(Boolean).length;
  const words = countWords(trimmed);
  const byWordGroups = words > 0 ? Math.round(words / 3) : 0;
  return Math.max(1, Math.min(8, Math.max(byMark, byConnectors, byWordGroups)));
}

function isSentenceMatch(spoken: string, expected: string): boolean {
  const a = tokenizeSentence(spoken);
  const b = tokenizeSentence(expected);
  if (a.length !== b.length) return false;
  return a.every((word, idx) => word === b[idx]);
}

function getRepairHintParts(broken: string, fixed: string): Array<{ text: string; isWrong: boolean }> {
  const brokenParts = broken.trim().split(/\s+/).filter(Boolean);
  const fixedParts = fixed.trim().split(/\s+/).filter(Boolean);
  const maxLen = Math.max(brokenParts.length, fixedParts.length);
  const result: Array<{ text: string; isWrong: boolean }> = [];

  for (let i = 0; i < maxLen; i += 1) {
    const brokenWord = brokenParts[i];
    if (!brokenWord) continue;
    const fixedWord = fixedParts[i] ?? "";
    result.push({
      text: brokenWord,
      isWrong: normalizeWord(brokenWord) !== normalizeWord(fixedWord),
    });
  }

  return result;
}

function normalizeHeardText(text: string): string {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed || lower === "silence" || lower === "(silence)" || lower === "[silence]") return "";
  return trimmed;
}

export default function GamePage() {
  const router = useRouter();
  const {
    speak: speakHint,
    speakAndWait: speakHintAndWait,
    stop: stopHintSpeech,
  } = useTTS({ gender: "female" });

  const [mode, setMode] = useState<ScreenMode>("menu");
  const [liveTranscript, setLiveTranscript] = useState("");

  const [bombMission, setBombMission] = useState<BombMission>(() => BOMB_MISSIONS[0]);
  const [bombPhase, setBombPhase] = useState<RoundPhase>("idle");
  const [bombCountdown, setBombCountdown] = useState(3);
  const [bombTimeLeft, setBombTimeLeft] = useState(10);
  const [bombDetectedSentences, setBombDetectedSentences] = useState(0);
  const [bombDetectedWords, setBombDetectedWords] = useState(0);
  const [bombSuccess, setBombSuccess] = useState(false);
  const [bombMessage, setBombMessage] = useState("");
  const [bombInputText, setBombInputText] = useState("");

  const [duelMission, setDuelMission] = useState<DuelMission>(() => DUEL_MISSIONS[0]);
  const [duelPhase, setDuelPhase] = useState<RoundPhase>("idle");
  const [duelCountdown, setDuelCountdown] = useState(3);
  const [duelTimeLeft, setDuelTimeLeft] = useState(14);
  const [duelUserSentences, setDuelUserSentences] = useState(0);
  const [duelAiSentences, setDuelAiSentences] = useState(0);
  const [duelWinner, setDuelWinner] = useState<"user" | "ai" | "draw">("draw");
  const [duelMessage, setDuelMessage] = useState("");
  const [duelBeam, setDuelBeam] = useState(50);
  const [duelImpact, setDuelImpact] = useState<"none" | "win" | "lose" | "draw">("none");
  const [duelSpeechBoost, setDuelSpeechBoost] = useState(0);
  const [duelInputText, setDuelInputText] = useState("");

  const [twentyQuestion, setTwentyQuestion] = useState<TwentyQuestion>(() => TWENTY_QUESTIONS[0]);
  const [twentyGuess, setTwentyGuess] = useState("");
  const [twentyHintMode, setTwentyHintMode] = useState<TwentyHintMode>("keywords");
  const [twentyAttempts, setTwentyAttempts] = useState(0);
  const [twentySolved, setTwentySolved] = useState(false);
  const [twentyMessage, setTwentyMessage] = useState("");
  const [twentyRecentGuesses, setTwentyRecentGuesses] = useState<string[]>([]);

  const [passwordPuzzle, setPasswordPuzzle] = useState<PasswordPuzzle>(() => {
    const picked = PASSWORD_SENTENCES[0];
    return { id: picked.id, answerWords: picked.words, scrambledWords: shuffleWords(picked.words) };
  });
  const [passwordTranscript, setPasswordTranscript] = useState("");
  const [passwordPressedNumbers, setPasswordPressedNumbers] = useState<number[]>([]);
  const [passwordTappedNumber, setPasswordTappedNumber] = useState<number | null>(null);
  const [passwordMatchedCount, setPasswordMatchedCount] = useState(0);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordShake, setPasswordShake] = useState(false);

  const [repairPuzzle, setRepairPuzzle] = useState<RepairPuzzle>(() => REPAIR_PUZZLES[0]);
  const [repairTranscript, setRepairTranscript] = useState("");
  const [repairAttempts, setRepairAttempts] = useState(0);
  const [repairRecovered, setRepairRecovered] = useState(false);
  const [repairShake, setRepairShake] = useState(false);
  const [repairMessage, setRepairMessage] = useState("고장 문장을 고쳐서 영어로 말해보세요.");
  const repairHintParts = useMemo(
    () => getRepairHintParts(repairPuzzle.broken, repairPuzzle.fixed),
    [repairPuzzle.broken, repairPuzzle.fixed]
  );

  const [wordChainCurrent, setWordChainCurrent] = useState("apple");
  const [wordChainInput, setWordChainInput] = useState("");
  const [wordChainTurn, setWordChainTurn] = useState(1);
  const [wordChainGauge, setWordChainGauge] = useState(0);
  const [wordChainGaugeTrend, setWordChainGaugeTrend] = useState<"up" | "down" | "none">("none");
  const [wordChainHistory, setWordChainHistory] = useState<WordChainEntry[]>([
    { speaker: "ai", word: "apple", turn: 0 },
  ]);
  const [wordChainFinished, setWordChainFinished] = useState(false);
  const [wordChainMessage, setWordChainMessage] = useState("AI 단어를 보고 끝말잇기를 시작해요!");
  const [wordChainCelebrate, setWordChainCelebrate] = useState(false);

  const [memoryRound, setMemoryRound] = useState<MemoryRound>(() => MEMORY_ROUNDS[0]);
  const [memoryInput, setMemoryInput] = useState("");
  const [memoryRevealed, setMemoryRevealed] = useState<boolean[]>([false, false, false, false, false]);
  const [memoryPopped, setMemoryPopped] = useState<number | null>(null);
  const [memoryListeningOrder, setMemoryListeningOrder] = useState(false);
  const [memoryMessage, setMemoryMessage] = useState("다시 듣기를 눌러 순서를 기억한 뒤 첫 단어부터 말해보세요.");
  const [memoryCompleted, setMemoryCompleted] = useState(false);
  const [memoryReplayLeft, setMemoryReplayLeft] = useState(1);
  const [memoryCountdown, setMemoryCountdown] = useState<3 | 2 | 1 | 0 | null>(null);
  const [memoryActiveWordIndex, setMemoryActiveWordIndex] = useState<number | null>(null);
  const [memoryWrongCount, setMemoryWrongCount] = useState(0);
  const [memoryReplayGlow, setMemoryReplayGlow] = useState(false);
  const [memoryNewRoundGlow, setMemoryNewRoundGlow] = useState(false);

  const [frogPuzzle, setFrogPuzzle] = useState<FrogPuzzle>(() => FROG_PUZZLES[0]);
  const [frogInput, setFrogInput] = useState("");
  const [frogAttempts, setFrogAttempts] = useState(0);
  const [frogSuccess, setFrogSuccess] = useState(false);
  const [frogMessage, setFrogMessage] = useState("AI 문장을 듣고 반대로 말해보세요!");
  const [frogCelebrate, setFrogCelebrate] = useState(false);
  const [frogShake, setFrogShake] = useState(false);
  const [frogSnakeBurst, setFrogSnakeBurst] = useState(false);

  const [treasureWord, setTreasureWord] = useState<TreasureWord>(() => TREASURE_WORDS[0]);
  const [treasureOpened, setTreasureOpened] = useState(false);
  const [treasureInput, setTreasureInput] = useState("");
  const [treasureMessage, setTreasureMessage] = useState("");
  const [treasureSuccess, setTreasureSuccess] = useState(false);
  const [treasureCoinBurst, setTreasureCoinBurst] = useState(false);
  const [treasureFailBurst, setTreasureFailBurst] = useState(false);

  const [alphaLetter, setAlphaLetter] = useState<string | null>(null);
  const [alphaRolling, setAlphaRolling] = useState(false);
  const [alphaRollFace, setAlphaRollFace] = useState("?");
  const [alphaWords, setAlphaWords] = useState<string[]>([]);
  const [alphaInput, setAlphaInput] = useState("");
  const [alphaMessage, setAlphaMessage] = useState("");
  const [alphaTimeLeft, setAlphaTimeLeft] = useState(ALPHA_ROUND_SEC);
  const [alphaExpired, setAlphaExpired] = useState(false);
  const [alphaTimerKey, setAlphaTimerKey] = useState(0);
  const [alphaShake, setAlphaShake] = useState(false);
  const [alphaDiceBurst, setAlphaDiceBurst] = useState(false);

  const [tongueLine, setTongueLine] = useState<TongueLine>(() => TONGUE_LINES[0]);
  const [tongueInput, setTongueInput] = useState("");
  const [tongueAttempts, setTongueAttempts] = useState(0);
  const [tongueSuccess, setTongueSuccess] = useState(false);
  const [tongueShake, setTongueShake] = useState(false);
  const [tongueCrownBurst, setTongueCrownBurst] = useState(false);

  const [rhythmLine, setRhythmLine] = useState<RhythmSentence>(() => RHYTHM_SENTENCES[0]);
  const [rhythmPhase, setRhythmPhase] = useState<RhythmPhase>("countdown");
  const [rhythmTier, setRhythmTier] = useState<1 | 2>(1);
  const [rhythmCountdownLabel, setRhythmCountdownLabel] = useState<null | "3" | "2" | "1" | "go">(
    null
  );
  const [rhythmDemoChunk, setRhythmDemoChunk] = useState<null | 0 | 1 | 2>(null);
  const [rhythmManualChunk, setRhythmManualChunk] = useState<null | 0 | 1 | 2>(null);
  const [rhythmInput, setRhythmInput] = useState("");
  const [rhythmClearFloatKey, setRhythmClearFloatKey] = useState(0);
  const [rhythmClearFlash, setRhythmClearFlash] = useState(false);

  const activeRoundRef = useRef<"bomb" | "duel" | null>(null);
  const memoryPlaybackTokenRef = useRef(0);
  const rhythmPlaybackTokenRef = useRef(0);
  const rhythmManualChunkClearRef = useRef<number | null>(null);
  const alphaRollTimerRef = useRef<number | null>(null);
  const previousModeRef = useRef<ScreenMode>("menu");

  const { isListening, start, stop, toggle, supported, sttError, clearSttError, isProcessing } =
    useSpeechRecognition({
    lang: "en-US",
    maxRecordingMs: 12000,
    onInterim: (text) => setLiveTranscript(text),
    onResult: (text) => setLiveTranscript(text),
  });

  const resetSharedTranscript = useCallback(() => {
    setLiveTranscript("");
    clearSttError();
  }, [clearSttError]);

  const stopMemoryPlayback = useCallback(() => {
    memoryPlaybackTokenRef.current += 1;
    stopHintSpeech();
    setMemoryListeningOrder(false);
    setMemoryActiveWordIndex(null);
    setMemoryCountdown(null);
  }, [stopHintSpeech]);

  const beginBombRound = useCallback(() => {
    const mission = pickRandom(BOMB_MISSIONS);
    playClick();
    resetSharedTranscript();
    setBombMission(mission);
    setBombPhase("countdown");
    setBombCountdown(3);
    setBombTimeLeft(mission.seconds);
    setBombDetectedSentences(0);
    setBombDetectedWords(0);
    setBombSuccess(false);
    setBombMessage("");
    setBombInputText("");
  }, [resetSharedTranscript]);

  const beginDuelRound = useCallback(() => {
    const mission = pickRandom(DUEL_MISSIONS);
    playClick();
    resetSharedTranscript();
    setDuelMission(mission);
    setDuelPhase("countdown");
    setDuelCountdown(3);
    setDuelTimeLeft(mission.seconds);
    setDuelUserSentences(0);
    setDuelAiSentences(0);
    setDuelWinner("draw");
    setDuelMessage("");
    setDuelBeam(50);
    setDuelImpact("none");
    setDuelSpeechBoost(0);
    setDuelInputText("");
  }, [resetSharedTranscript]);

  const beginTwentyRound = useCallback(() => {
    playClick();
    const picked = pickRandom(TWENTY_QUESTIONS);
    setTwentyQuestion(picked);
    setTwentyGuess("");
    setTwentyHintMode("keywords");
    setTwentyAttempts(0);
    setTwentySolved(false);
    setTwentyMessage("");
    setTwentyRecentGuesses([]);
  }, []);

  const beginPasswordRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    const picked = pickRandom(PASSWORD_SENTENCES);
    setPasswordPuzzle({
      id: picked.id,
      answerWords: picked.words,
      scrambledWords: shuffleWords(picked.words),
    });
    setPasswordTranscript("");
    setPasswordPressedNumbers([]);
    setPasswordTappedNumber(null);
    setPasswordMatchedCount(0);
    setPasswordUnlocked(false);
    setPasswordShake(false);
  }, [resetSharedTranscript]);

  const beginRepairRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    const picked = pickRandom(REPAIR_PUZZLES);
    setRepairPuzzle(picked);
    setRepairTranscript("");
    setRepairAttempts(0);
    setRepairRecovered(false);
    setRepairShake(false);
    setRepairMessage("고장 문장을 고쳐서 영어로 말해보세요.");
  }, [resetSharedTranscript]);

  const beginWordChainRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    const starter = pickRandom(WORD_CHAIN_WORDS);
    const firstLetter = getLastLetter(starter).toUpperCase();
    setWordChainCurrent(starter);
    setWordChainInput("");
    setWordChainTurn(1);
    setWordChainGauge(0);
    setWordChainGaugeTrend("none");
    setWordChainHistory([{ speaker: "ai", word: starter, turn: 0 }]);
    setWordChainFinished(false);
    setWordChainCelebrate(false);
    setWordChainMessage(`AI 시작 단어: ${starter.toUpperCase()} / "${firstLetter}"로 시작하는 단어를 말해보세요.`);
  }, [resetSharedTranscript]);

  const playMemoryOrder = useCallback(
    async (words: string[], token: number) => {
      if (!words.length) return;
      setMemoryListeningOrder(true);
      setMemoryMessage("AI가 단어 순서를 읽는 중... 잘 듣고 5개를 한 번에 말해보세요.");
      try {
        for (let i = 0; i < words.length; i += 1) {
          if (memoryPlaybackTokenRef.current !== token) return;
          setMemoryActiveWordIndex(i);
          await speakHintAndWait(words[i]);
          if (memoryPlaybackTokenRef.current !== token) return;
          await new Promise<void>((resolve) => {
            window.setTimeout(() => resolve(), 260);
          });
        }
      } finally {
        if (memoryPlaybackTokenRef.current !== token) return;
        setMemoryActiveWordIndex(null);
        setMemoryListeningOrder(false);
        setMemoryMessage("이제 5개 단어를 순서대로 한 번에 말해보세요.");
      }
    },
    [speakHintAndWait]
  );

  const runMemoryCountdownAndPlay = useCallback(
    async (words: string[], token: number) => {
      setMemoryCountdown(3);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
      if (memoryPlaybackTokenRef.current !== token) return;
      setMemoryCountdown(2);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
      if (memoryPlaybackTokenRef.current !== token) return;
      setMemoryCountdown(1);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
      if (memoryPlaybackTokenRef.current !== token) return;
      setMemoryCountdown(0);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 520));
      if (memoryPlaybackTokenRef.current !== token) return;
      setMemoryCountdown(null);
      await playMemoryOrder(words, token);
    },
    [playMemoryOrder]
  );

  const beginMemoryRound = useCallback(() => {
    playClick();
    memoryPlaybackTokenRef.current += 1;
    stopHintSpeech();
    resetSharedTranscript();
    const round = pickRandom(MEMORY_ROUNDS);
    const token = memoryPlaybackTokenRef.current;
    setMemoryRound(round);
    setMemoryInput("");
    setMemoryRevealed([false, false, false, false, false]);
    setMemoryPopped(null);
    setMemoryCompleted(false);
    setMemoryReplayLeft(1);
    setMemoryActiveWordIndex(null);
    setMemoryCountdown(null);
    setMemoryWrongCount(0);
    setMemoryReplayGlow(false);
    setMemoryNewRoundGlow(false);
    setMemoryMessage("");
    void runMemoryCountdownAndPlay(round.words, token);
  }, [resetSharedTranscript, runMemoryCountdownAndPlay, stopHintSpeech]);

  const beginFrogRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    const picked = pickRandom(FROG_PUZZLES);
    setFrogPuzzle(picked);
    setFrogInput("");
    setFrogAttempts(0);
    setFrogSuccess(false);
    setFrogCelebrate(false);
    setFrogShake(false);
    setFrogSnakeBurst(false);
    setFrogMessage("문장을 눌러 듣고, 반대로 말해 보세요.");
  }, [resetSharedTranscript]);

  const beginTreasureRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    const picked = pickRandom(TREASURE_WORDS);
    setTreasureWord(picked);
    setTreasureOpened(false);
    setTreasureInput("");
    setTreasureSuccess(false);
    setTreasureCoinBurst(false);
    setTreasureFailBurst(false);
    setTreasureMessage("");
  }, [resetSharedTranscript]);

  const runRhythmCountdownDemoAndUnlock = useCallback(
    async (line: RhythmSentence, token: number, opts?: { fast?: boolean }) => {
      unlockAudioContext();
      setRhythmPhase("countdown");
      const fast = !!opts?.fast;
      const ttsOpts = fast ? ({ fast: true, rhythmTier2: true } as const) : { fast: false as const };
      const seq: Array<"3" | "2" | "1" | "go"> = ["3", "2", "1", "go"];
      for (const label of seq) {
        if (rhythmPlaybackTokenRef.current !== token) return;
        setRhythmCountdownLabel(label);
        if (label === "go") {
          playGoSignal();
          await new Promise<void>((r) => window.setTimeout(r, 420));
        } else {
          await new Promise<void>((r) => window.setTimeout(r, 680));
        }
      }
      if (rhythmPlaybackTokenRef.current !== token) return;
      setRhythmCountdownLabel(null);
      stopRhythmDanceBgm();
      startRhythmDanceBgm({ fast });
      setRhythmPhase("demo");
      for (let i = 0; i < 3; i += 1) {
        if (rhythmPlaybackTokenRef.current !== token) return;
        setRhythmDemoChunk(i as 0 | 1 | 2);
        await speakHintAndWait(line.chunks[i], ttsOpts);
      }
      if (rhythmPlaybackTokenRef.current !== token) return;
      setRhythmDemoChunk(null);
      await new Promise<void>((r) => window.setTimeout(r, 480));
      if (rhythmPlaybackTokenRef.current !== token) return;
      await speakHintAndWait(line.full, ttsOpts);
      if (rhythmPlaybackTokenRef.current !== token) return;
      resetSharedTranscript();
      setRhythmInput("");
      setRhythmPhase("play");
    },
    [speakHintAndWait, resetSharedTranscript]
  );

  const beginRhythmRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    stopRhythmDanceBgm();
    rhythmPlaybackTokenRef.current += 1;
    const token = rhythmPlaybackTokenRef.current;
    const line = pickRandom(RHYTHM_SENTENCES);
    setRhythmLine(line);
    setRhythmTier(1);
    setRhythmPhase("countdown");
    setRhythmDemoChunk(null);
    setRhythmManualChunk(null);
    setRhythmCountdownLabel(null);
    setRhythmInput("");
    setRhythmClearFlash(false);
    void runRhythmCountdownDemoAndUnlock(line, token, { fast: false });
  }, [resetSharedTranscript, runRhythmCountdownDemoAndUnlock]);

  const submitRhythmTry = useCallback(() => {
    if (rhythmPhase !== "play") return;
    const spoken = normalizeHeardText(rhythmInput) || normalizeHeardText(liveTranscript);
    if (!spoken.trim()) {
      playBuzzer();
      resetSharedTranscript();
      setRhythmInput("");
      return;
    }
    if (!isSentenceMatch(spoken, rhythmLine.full)) {
      playBuzzer();
      resetSharedTranscript();
      setRhythmInput("");
      return;
    }
    playPop();
    resetSharedTranscript();
    setRhythmInput("");
    if (rhythmTier === 1) {
      stopRhythmDanceBgm();
      rhythmPlaybackTokenRef.current += 1;
      const tierToken = rhythmPlaybackTokenRef.current;
      setRhythmPhase("tier2_ment");
      setRhythmTier(2);
      window.setTimeout(() => {
        if (rhythmPlaybackTokenRef.current !== tierToken) return;
        void runRhythmCountdownDemoAndUnlock(rhythmLine, tierToken, { fast: true });
      }, 1000);
    } else {
      rhythmPlaybackTokenRef.current += 1;
      stopRhythmDanceBgm();
      playTransition();
      setRhythmPhase("merging");
      window.setTimeout(() => {
        setRhythmPhase("cleared");
        setRhythmClearFlash(true);
        window.setTimeout(() => setRhythmClearFlash(false), 720);
        setRhythmClearFloatKey((k) => k + 1);
      }, 1000);
    }
  }, [rhythmPhase, rhythmTier, rhythmLine, rhythmInput, liveTranscript, runRhythmCountdownDemoAndUnlock, resetSharedTranscript]);

  const replayRhythmChunk = useCallback(
    (idx: 0 | 1 | 2) => {
      if (rhythmPhase !== "play") return;
      playClick();
      setRhythmManualChunk(idx);
      if (rhythmManualChunkClearRef.current) window.clearTimeout(rhythmManualChunkClearRef.current);
      const fast = rhythmTier === 2;
      speakHint(rhythmLine.chunks[idx], fast ? { fast: true, rhythmTier2: true } : { fast: false });
      const tid = window.setTimeout(() => {
        setRhythmManualChunk(null);
        rhythmManualChunkClearRef.current = null;
      }, 2600);
      rhythmManualChunkClearRef.current = tid;
    },
    [rhythmPhase, rhythmLine, rhythmTier, speakHint]
  );

  const beginAlphaRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    if (alphaRollTimerRef.current) {
      clearInterval(alphaRollTimerRef.current);
      alphaRollTimerRef.current = null;
    }
    setAlphaLetter(null);
    setAlphaRolling(false);
    setAlphaRollFace("?");
    setAlphaWords([]);
    setAlphaInput("");
    setAlphaExpired(false);
    setAlphaTimeLeft(ALPHA_ROUND_SEC);
    setAlphaTimerKey((k) => k + 1);
    setAlphaMessage("");
    setAlphaShake(false);
    setAlphaDiceBurst(false);
  }, [resetSharedTranscript]);

  const rollAlphaDice = useCallback(() => {
    if (alphaRolling) return;
    playClick();
    unlockAudioContext();
    setAlphaExpired(false);
    setAlphaLetter(null);
    setAlphaMessage("");
    setAlphaRolling(true);
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let step = 0;
    if (alphaRollTimerRef.current) clearInterval(alphaRollTimerRef.current);
    alphaRollTimerRef.current = window.setInterval(() => {
      step += 1;
      setAlphaRollFace(letters[step % 26]);
      if (step >= 22) {
        if (alphaRollTimerRef.current) {
          clearInterval(alphaRollTimerRef.current);
          alphaRollTimerRef.current = null;
        }
        const picked = letters[Math.floor(Math.random() * 26)];
        setAlphaLetter(picked);
        setAlphaRollFace(picked);
        setAlphaRolling(false);
        setAlphaTimeLeft(ALPHA_ROUND_SEC);
        setAlphaTimerKey((k) => k + 1);
        setAlphaMessage(`"${picked}"로 시작하는 영어 단어를 말해 보세요!`);
        setAlphaDiceBurst(false);
      }
    }, 72);
  }, [alphaRolling]);

  const submitAlphaWord = useCallback(() => {
    if (!alphaLetter || alphaRolling || alphaExpired) return;
    const raw = normalizeHeardText(alphaInput) || normalizeHeardText(liveTranscript);
    const words = tokenizeSentence(raw);
    const w = words[0];
    if (!w) {
      playBuzzer();
      setAlphaShake(true);
      window.setTimeout(() => setAlphaShake(false), 500);
      setAlphaMessage("단어를 말하거나 입력해 주세요.");
      resetSharedTranscript();
      setAlphaInput("");
      return;
    }
    const need = alphaLetter.toLowerCase();
    if (w[0] !== need) {
      playBuzzer();
      setAlphaShake(true);
      window.setTimeout(() => setAlphaShake(false), 500);
      setAlphaMessage(`"${alphaLetter}"로 시작해야 해요. 다시 도전!`);
      resetSharedTranscript();
      setAlphaInput("");
      return;
    }
    if (alphaWords.includes(w)) {
      playBuzzer();
      setAlphaShake(true);
      window.setTimeout(() => setAlphaShake(false), 500);
      setAlphaMessage("이미 말한 단어예요. 새로운 단어로!");
      resetSharedTranscript();
      setAlphaInput("");
      return;
    }
    playPop();
    setAlphaDiceBurst(true);
    window.setTimeout(() => setAlphaDiceBurst(false), 520);
    setAlphaWords((prev) => {
      const next = [...prev, w];
      setAlphaMessage(`Nice! "${w.toUpperCase()}" — 계속! (${next.length}개)`);
      return next;
    });
    setAlphaInput("");
    resetSharedTranscript();
    setAlphaTimeLeft(ALPHA_ROUND_SEC);
    setAlphaTimerKey((k) => k + 1);
  }, [alphaLetter, alphaRolling, alphaExpired, alphaInput, liveTranscript, alphaWords, resetSharedTranscript]);

  const beginTongueRound = useCallback(() => {
    playClick();
    resetSharedTranscript();
    const line = pickRandom(TONGUE_LINES);
    setTongueLine(line);
    setTongueInput("");
    setTongueAttempts(0);
    setTongueSuccess(false);
    setTongueShake(false);
    setTongueCrownBurst(false);
  }, [resetSharedTranscript]);

  const submitTongueTry = useCallback(() => {
    const spoken = normalizeHeardText(tongueInput) || normalizeHeardText(liveTranscript);
    if (isSentenceMatch(spoken, tongueLine.text)) {
      resetSharedTranscript();
      setTongueInput("");
      playTransition();
      setTongueSuccess(true);
      setTongueCrownBurst(true);
      window.setTimeout(() => setTongueCrownBurst(false), 1000);
    } else {
      playBuzzer();
      setTongueShake(true);
      setTongueAttempts((a) => a + 1);
      window.setTimeout(() => setTongueShake(false), 500);
      resetSharedTranscript();
      setTongueInput("");
    }
  }, [tongueInput, liveTranscript, tongueLine.text, resetSharedTranscript]);

  const triggerWordChainCelebration = useCallback(() => {
    if (!wordChainFinished) return;
    setWordChainCelebrate(true);
    playVictoryBlast();
    window.setTimeout(() => setWordChainCelebrate(false), 1300);
  }, [wordChainFinished]);

  const submitMemoryWord = useCallback(() => {
    if (memoryCompleted || memoryListeningOrder || memoryCountdown !== null) return;
    const raw = normalizeHeardText(memoryInput) || normalizeHeardText(liveTranscript);

    const spokenWords = raw
      .trim()
      .split(/\s+/)
      .map((w) => normalizeWord(w))
      .filter(Boolean);
    if (spokenWords.length === 0) {
      setMemoryMessage("입력된 단어가 없어요. 음성 또는 텍스트로 5개 단어를 말해 주세요.");
      playBuzzer();
      resetSharedTranscript();
      setMemoryInput("");
      return;
    }

    const expectedWords = memoryRound.words.map((w) => normalizeWord(w));
    const isExactOrder =
      spokenWords.length >= expectedWords.length &&
      expectedWords.every((word, idx) => spokenWords[idx] === word);

    if (!isExactOrder) {
      const nextWrongCount = memoryWrongCount + 1;
      setMemoryWrongCount(nextWrongCount);
      if (nextWrongCount >= 2) {
        setMemoryRevealed([true, true, true, true, true]);
        setMemoryCompleted(true);
        setMemoryReplayGlow(false);
        setMemoryNewRoundGlow(true);
        setMemoryMessage("오답! 정답은 " + memoryRound.words.map((w) => w.toUpperCase()).join(" / ") + " 입니다.");
      } else {
        setMemoryReplayGlow(memoryReplayLeft > 0);
        setMemoryNewRoundGlow(false);
        setMemoryMessage("오답! 다시 듣기를 눌러 한 번 더 도전해보세요.");
      }
      playDefeatBlast();
      playBuzzer();
      resetSharedTranscript();
      setMemoryInput("");
      return;
    }

    setMemoryRevealed([true, true, true, true, true]);
    setMemoryPopped(4);
    resetSharedTranscript();
    setMemoryInput("");
    playTransition();
    window.setTimeout(() => setMemoryPopped((current) => (current === 4 ? null : current)), 320);
    setMemoryCompleted(true);
    setMemoryReplayGlow(false);
    setMemoryNewRoundGlow(true);
    setMemoryMessage("정답! 5개 단어 순서를 완벽히 기억했어요!");
    playVictoryBlast();
  }, [
    memoryCompleted,
    memoryListeningOrder,
    memoryCountdown,
    memoryInput,
    liveTranscript,
    memoryRound.words,
    memoryWrongCount,
    memoryReplayLeft,
    resetSharedTranscript,
  ]);

  const submitFrogTry = useCallback(() => {
    if (frogSuccess) return;
    const sourceText = normalizeHeardText(frogInput) || normalizeHeardText(liveTranscript);
    if (!sourceText) {
      setFrogMessage("입력된 문장이 없어요. 음성 또는 텍스트로 반대로 말해보세요.");
      playBuzzer();
      resetSharedTranscript();
      setFrogInput("");
      return;
    }

    setFrogAttempts((prev) => prev + 1);
    const correct = isSentenceMatch(sourceText, frogPuzzle.opposite);
    if (correct) {
      setFrogSuccess(true);
      setFrogCelebrate(true);
      setFrogMessage("PASS! 반대로 말하기 성공!");
      resetSharedTranscript();
      setFrogInput("");
      playFrogCroak();
      playVictoryBlast();
      playTransition();
      window.setTimeout(() => setFrogCelebrate(false), 1300);
      return;
    }

    setFrogSuccess(false);
    setFrogMessage("아쉽! AI 문장과 반대로 다시 말해보세요.");
    setFrogShake(true);
    setFrogSnakeBurst(true);
    window.setTimeout(() => setFrogShake(false), 520);
    window.setTimeout(() => setFrogSnakeBurst(false), 760);
    playFrogCroak();
    playDefeatBlast();
    playBuzzer();
    resetSharedTranscript();
    setFrogInput("");
  }, [frogSuccess, frogInput, liveTranscript, frogPuzzle.opposite, resetSharedTranscript]);

  const submitTreasureTry = useCallback(() => {
    if (!treasureOpened) {
      setTreasureMessage("먼저 보물상자를 열어 단어를 확인해보세요.");
      playBuzzer();
      resetSharedTranscript();
      setTreasureInput("");
      return;
    }
    const sourceText = normalizeHeardText(treasureInput) || normalizeHeardText(liveTranscript);
    if (!sourceText) {
      setTreasureMessage("문장을 말하거나 입력해 주세요.");
      playBuzzer();
      resetSharedTranscript();
      setTreasureInput("");
      return;
    }

    const words = tokenizeSentence(sourceText);
    const target = normalizeWord(treasureWord.word);
    const containsTarget = words.includes(target);
    const sentenceEnough = words.length >= 3;
    if (containsTarget && sentenceEnough) {
      setTreasureSuccess(true);
      setTreasureCoinBurst(true);
      setTreasureMessage("");
      resetSharedTranscript();
      setTreasureInput("");
      playVictoryBlast();
      playTransition();
      window.setTimeout(() => setTreasureCoinBurst(false), 1200);
      return;
    }

    setTreasureSuccess(false);
    setTreasureFailBurst(true);
    setTreasureMessage("");
    playDefeatBlast();
    playBuzzer();
    window.setTimeout(() => setTreasureFailBurst(false), 980);
    resetSharedTranscript();
    setTreasureInput("");
  }, [treasureOpened, treasureInput, liveTranscript, treasureWord.word, resetSharedTranscript]);

  const submitTwentyGuess = useCallback(() => {
    const raw = twentyGuess.trim();
    if (twentySolved) return;
    if (!raw) {
      resetSharedTranscript();
      setTwentyGuess("");
      return;
    }
    setTwentyRecentGuesses((prev) => [raw, ...prev].slice(0, 6));
    const guess = raw.toLowerCase().replace(/[^a-z]/g, "");
    const answer = twentyQuestion.answer.toLowerCase();
    const normalizedAnswer = answer.replace(/[^a-z]/g, "");
    const correct = guess === normalizedAnswer || guess.includes(normalizedAnswer);
    setTwentyAttempts((prev) => prev + 1);

    if (correct) {
      setTwentySolved(true);
      setTwentyMessage("정답! PASS!");
      resetSharedTranscript();
      setTwentyGuess("");
      playVictoryBlast();
      playTransition();
      return;
    }

    if (twentyHintMode === "keywords") {
      setTwentyHintMode("sentences");
      setTwentyMessage("");
    } else {
      setTwentyMessage("조금 더 생각해봐요! 다시 추측!");
    }
    playBuzzer();
    resetSharedTranscript();
    setTwentyGuess("");
  }, [twentyGuess, twentySolved, twentyQuestion.answer, twentyHintMode, resetSharedTranscript]);

  const submitPasswordTry = useCallback(() => {
    const spoken = tokenizeSentence(passwordTranscript);
    const answer = passwordPuzzle.answerWords.map((w) => normalizeWord(w));
    if (spoken.length === 0) {
      resetSharedTranscript();
      setPasswordTranscript("");
      return;
    }
    const isExact =
      spoken.length === answer.length &&
      answer.every((word, idx) => spoken[idx] === word);

    if (isExact) {
      setPasswordUnlocked(true);
      resetSharedTranscript();
      setPasswordTranscript("");
      playVictoryBlast();
      playTransition();
      return;
    }

    setPasswordUnlocked(false);
    setPasswordShake(true);
    playBuzzer();
    playDefeatBlast();
    window.setTimeout(() => setPasswordShake(false), 520);
    resetSharedTranscript();
    setPasswordTranscript("");
  }, [passwordTranscript, passwordPuzzle.answerWords, resetSharedTranscript]);

  const submitRepairTry = useCallback(() => {
    const spoken = repairTranscript.trim();
    if (repairRecovered) return;
    if (!spoken) {
      resetSharedTranscript();
      setRepairTranscript("");
      return;
    }
    const correct = isSentenceMatch(spoken, repairPuzzle.fixed);
    setRepairAttempts((prev) => prev + 1);

    if (correct) {
      setRepairRecovered(true);
      setRepairMessage("정상 복구 완료!");
      resetSharedTranscript();
      setRepairTranscript("");
      playVictoryBlast();
      playTransition();
      return;
    }

    setRepairRecovered(false);
    setRepairMessage("복구 실패! 문장을 다시 고쳐 말해보세요.");
    setRepairShake(true);
    playBuzzer();
    playDefeatBlast();
    window.setTimeout(() => setRepairShake(false), 520);
    resetSharedTranscript();
    setRepairTranscript("");
  }, [repairTranscript, repairRecovered, repairPuzzle.fixed, resetSharedTranscript]);

  const submitWordChainTurn = useCallback(() => {
    if (wordChainFinished) return;
    const sourceRaw = normalizeHeardText(wordChainInput) || normalizeHeardText(liveTranscript);
    const word = normalizeChainWord(sourceRaw);
    if (!word) {
      setWordChainMessage("단어가 비어 있어요. 음성 또는 텍스트로 단어를 입력해 주세요.");
      setWordChainGaugeTrend("down");
      playBuzzer();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 260);
      resetSharedTranscript();
      setWordChainInput("");
      return;
    }

    const expectedFirst = getLastLetter(wordChainCurrent);
    if (!expectedFirst || word[0] !== expectedFirst) {
      setWordChainGauge((prev) => Math.max(0, prev - 10));
      setWordChainGaugeTrend("down");
      setWordChainMessage(`"${expectedFirst.toUpperCase()}"로 시작해야 해요. 다시 도전!`);
      playBuzzer();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 260);
      resetSharedTranscript();
      setWordChainInput("");
      return;
    }

    const usedWords = new Set(wordChainHistory.map((entry) => normalizeChainWord(entry.word)));
    if (usedWords.has(word)) {
      setWordChainGauge((prev) => Math.max(0, prev - 10));
      setWordChainGaugeTrend("down");
      setWordChainMessage("이미 나온 단어예요. 새로운 단어로 이어가요!");
      playDefeatBlast();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 260);
      resetSharedTranscript();
      setWordChainInput("");
      return;
    }

    const aiFirst = getLastLetter(word);
    const aiCandidate =
      WORD_CHAIN_WORDS.find((candidate) => candidate.startsWith(aiFirst) && !usedWords.has(candidate) && candidate !== word) ??
      WORD_CHAIN_WORDS.find((candidate) => candidate.startsWith(aiFirst) && candidate !== word);

    const userEntry: WordChainEntry = { speaker: "me", word, turn: wordChainTurn };
    const updatedHistory = [...wordChainHistory, userEntry];
    setWordChainGauge((prev) => Math.min(100, prev + 10));
    setWordChainGaugeTrend("up");
    playLaserPulse();

    if (wordChainTurn >= WORD_CHAIN_MAX_TURN) {
      setWordChainHistory(updatedHistory);
      setWordChainFinished(true);
      setWordChainMessage("10턴 클리어! 끝말잇기 미션 성공!");
      resetSharedTranscript();
      setWordChainInput("");
      playVictoryBlast();
      playTransition();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 300);
      return;
    }

    if (!aiCandidate) {
      setWordChainHistory(updatedHistory);
      setWordChainCurrent(word);
      setWordChainFinished(true);
      setWordChainMessage("AI가 더 이상 단어를 못 찾았어요! 당신 승리!");
      resetSharedTranscript();
      setWordChainInput("");
      playVictoryBlast();
      playTransition();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 300);
      return;
    }

    const aiEntry: WordChainEntry = { speaker: "ai", word: aiCandidate, turn: wordChainTurn };
    const nextRequired = getLastLetter(aiCandidate).toUpperCase();
    setWordChainHistory([...updatedHistory, aiEntry]);
    setWordChainCurrent(aiCandidate);
    setWordChainTurn((prev) => prev + 1);
    resetSharedTranscript();
    setWordChainInput("");
    setWordChainMessage(`AI: ${aiCandidate.toUpperCase()} / 다음은 "${nextRequired}"로 시작!`);
    window.setTimeout(() => setWordChainGaugeTrend("none"), 300);
  }, [
    wordChainFinished,
    wordChainInput,
    liveTranscript,
    wordChainCurrent,
    wordChainHistory,
    wordChainTurn,
    resetSharedTranscript,
  ]);

  useEffect(() => {
    if (bombPhase !== "countdown") return;
    if (bombCountdown <= 0) {
      setBombPhase("live");
      setBombTimeLeft(bombMission.seconds);
      playGoSignal();
      activeRoundRef.current = "bomb";
      start();
      return;
    }
    const timer = window.setTimeout(() => setBombCountdown((prev) => prev - 1), 850);
    return () => window.clearTimeout(timer);
  }, [bombPhase, bombCountdown, bombMission.seconds, start]);

  useEffect(() => {
    if (duelPhase !== "countdown") return;
    if (duelCountdown <= 0) {
      setDuelPhase("live");
      setDuelTimeLeft(duelMission.seconds);
      playGoSignal();
      activeRoundRef.current = "duel";
      start();
      return;
    }
    const timer = window.setTimeout(() => setDuelCountdown((prev) => prev - 1), 850);
    return () => window.clearTimeout(timer);
  }, [duelPhase, duelCountdown, duelMission.seconds, start]);

  useEffect(() => {
    if (bombPhase !== "live") return;
    if (bombTimeLeft <= 0) {
      setBombPhase("judging");
      activeRoundRef.current = null;
      stop();
      playExplosion();
      return;
    }
    const timer = window.setTimeout(() => {
      setBombTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [bombPhase, bombTimeLeft, stop]);

  useEffect(() => {
    if (duelPhase !== "live") return;
    if (duelTimeLeft <= 0) {
      setDuelPhase("judging");
      activeRoundRef.current = null;
      stop();
      return;
    }
    const timer = window.setTimeout(() => {
      setDuelTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [duelPhase, duelTimeLeft, stop]);

  useEffect(() => {
    if (activeRoundRef.current !== "bomb") return;
    const sourceText = normalizeHeardText(bombInputText) || normalizeHeardText(liveTranscript);
    const sentenceCount = countSentences(sourceText);
    const wordCount = countWords(sourceText);
    setBombDetectedSentences(sentenceCount);
    setBombDetectedWords(wordCount);
  }, [liveTranscript, bombInputText, duelPhase, isListening]);

  useEffect(() => {
    if (activeRoundRef.current !== "duel") return;
    const sourceText = normalizeHeardText(duelInputText) || normalizeHeardText(liveTranscript);
    const unitCount = countDuelSpeakingUnits(sourceText);
    setDuelUserSentences(unitCount);
    if (duelPhase === "live" && isListening && sourceText.trim()) {
      setDuelSpeechBoost((prev) => Math.min(1, prev + 0.3));
      setDuelBeam((prev) => Math.min(96, prev + 2.4));
    }
  }, [liveTranscript, duelInputText, duelPhase, isListening]);

  useEffect(() => {
    if (duelPhase !== "live") {
      setDuelSpeechBoost(0);
      return;
    }
    const timer = window.setInterval(() => {
      setDuelSpeechBoost((prev) => Math.max(0, prev - 0.08));
    }, 130);
    return () => window.clearInterval(timer);
  }, [duelPhase]);

  useEffect(() => {
    if (bombPhase !== "judging" || isListening || isProcessing) return;
    const sourceText = normalizeHeardText(bombInputText) || normalizeHeardText(liveTranscript);
    const sentenceCount = countSentences(sourceText);
    const wordCount = countWords(sourceText);
    const heardClearly = wordCount >= 4;
    const success = heardClearly;
    setBombDetectedSentences(sentenceCount);
    setBombDetectedWords(wordCount);
    setBombSuccess(success);
    setBombMessage(success ? "" : "이번에는 소리가 잘 안 잡혔어요. 더 크게, 또렷하게 한 번 더!");
    setBombPhase("result");
    resetSharedTranscript();
    setBombInputText("");
    if (success) playTransition();
    else playBuzzer();
  }, [bombPhase, isListening, isProcessing, liveTranscript, bombInputText, bombMission.targetSentences, resetSharedTranscript]);

  useEffect(() => {
    if (duelPhase !== "judging" || isListening || isProcessing) return;
    const sourceText = normalizeHeardText(duelInputText) || normalizeHeardText(liveTranscript);
    const userWords = countWords(sourceText);
    const userSentences = countDuelSpeakingUnits(sourceText);
    const aiSentences = Math.floor(Math.random() * 3) + 2;
    const boostedUser = userSentences + (userWords >= 10 ? 1 : 0);
    const winner: "user" | "ai" | "draw" =
      boostedUser > aiSentences ? "user" : boostedUser < aiSentences ? "ai" : "draw";
    const beam = Math.max(8, Math.min(92, 50 + (boostedUser - aiSentences) * 14));

    setDuelUserSentences(userSentences);
    setDuelAiSentences(aiSentences);
    setDuelBeam(beam);
    setDuelWinner(winner);
    setDuelMessage(
      winner === "user"
        ? "ME 승리! 광선 게이지를 끝까지 밀어냈어요!"
        : winner === "ai"
        ? "AI 승리! 그래도 발화는 아주 잘 잡혔어요. 리매치!"
        : "무승부! 한 번 더 붙으면 이길 수 있어요."
    );
    if (winner === "user") {
      setDuelImpact("win");
      playLaserPulse();
      playVictoryBlast();
      playTransition();
    } else if (winner === "ai") {
      setDuelImpact("lose");
      playDefeatBlast();
      playBuzzer();
      playExplosion();
    } else {
      setDuelImpact("draw");
      playLaserPulse();
    }
    setDuelPhase("result");
    resetSharedTranscript();
    setDuelInputText("");
  }, [duelPhase, isListening, isProcessing, liveTranscript, duelInputText, resetSharedTranscript]);

  // 녹음 종료 직후 isListening/isProcessing이 둘 다 false가 되므로,
  // "둘 중 하나일 때만 동기화" 가드가 있으면 Whisper 최종 텍스트가 필드에 안 들어감.
  useLayoutEffect(() => {
    if (mode !== "bomb") return;
    setBombInputText(liveTranscript);
  }, [mode, liveTranscript]);

  useLayoutEffect(() => {
    if (mode !== "duel") return;
    setDuelInputText(liveTranscript);
  }, [mode, liveTranscript]);

  useEffect(() => {
    if (duelImpact === "none") return;
    const timer = window.setTimeout(() => setDuelImpact("none"), 1300);
    return () => window.clearTimeout(timer);
  }, [duelImpact]);

  useEffect(() => {
    if (mode !== "password") return;
    setPasswordTranscript(liveTranscript);
    const spoken = tokenizeSentence(liveTranscript);
    const answer = passwordPuzzle.answerWords.map((w) => normalizeWord(w));
    let matched = 0;
    for (let i = 0; i < Math.min(spoken.length, answer.length); i += 1) {
      if (spoken[i] === answer[i]) matched += 1;
      else break;
    }
    const pressed = passwordPuzzle.answerWords
      .slice(0, matched)
      .map((word) => passwordPuzzle.scrambledWords.findIndex((w) => w === word) + 1)
      .filter((n) => n > 0);
    setPasswordMatchedCount(matched);
    setPasswordPressedNumbers(pressed);
  }, [liveTranscript, mode, passwordPuzzle.answerWords, passwordPuzzle.scrambledWords]);

  useEffect(() => {
    if (mode !== "twenty") return;
    setTwentyGuess(liveTranscript);
  }, [liveTranscript, mode]);

  useEffect(() => {
    if (mode !== "repair") return;
    setRepairTranscript(liveTranscript);
  }, [liveTranscript, mode]);

  useLayoutEffect(() => {
    if (mode !== "wordchain") return;
    setWordChainInput(liveTranscript);
  }, [liveTranscript, mode]);

  useLayoutEffect(() => {
    if (mode !== "memory") return;
    setMemoryInput(liveTranscript);
  }, [liveTranscript, mode]);

  useLayoutEffect(() => {
    if (mode !== "frog") return;
    setFrogInput(liveTranscript);
  }, [liveTranscript, mode]);

  useLayoutEffect(() => {
    if (mode !== "treasure") return;
    setTreasureInput(liveTranscript);
  }, [liveTranscript, mode]);

  useEffect(() => {
    if (previousModeRef.current === "memory" && mode !== "memory") {
      stopMemoryPlayback();
    }
    if (previousModeRef.current === "rhythm" && mode !== "rhythm") {
      rhythmPlaybackTokenRef.current += 1;
      stopRhythmDanceBgm();
      stopHintSpeech();
      if (rhythmManualChunkClearRef.current) {
        window.clearTimeout(rhythmManualChunkClearRef.current);
        rhythmManualChunkClearRef.current = null;
      }
    }
    previousModeRef.current = mode;
  }, [mode, stopMemoryPlayback, stopHintSpeech]);

  useEffect(() => {
    startBgmForGameMode(mode);
  }, [mode]);

  useEffect(() => {
    setBgmDucked(isListening || isProcessing);
  }, [isListening, isProcessing]);

  useLayoutEffect(() => {
    if (mode !== "alphabet") return;
    setAlphaInput(liveTranscript);
  }, [mode, liveTranscript]);

  useLayoutEffect(() => {
    if (mode !== "tongue") return;
    setTongueInput(liveTranscript);
  }, [mode, liveTranscript]);

  useLayoutEffect(() => {
    if (mode !== "rhythm") return;
    setRhythmInput(liveTranscript);
  }, [mode, liveTranscript]);

  useEffect(() => {
    if (mode !== "alphabet" || !alphaLetter || alphaRolling || alphaExpired) return;
    setAlphaTimeLeft(ALPHA_ROUND_SEC);
    const id = window.setInterval(() => {
      setAlphaTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setAlphaExpired(true);
          playBuzzer();
          setAlphaShake(true);
          window.setTimeout(() => setAlphaShake(false), 500);
          setAlphaMessage("시간 초과! 주사위를 다시 굴려 도전하세요.");
          return 0;
        }
        playPop();
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, alphaLetter, alphaRolling, alphaExpired, alphaTimerKey]);

  useEffect(() => {
    return () => {
      activeRoundRef.current = null;
      stop();
      stopMemoryPlayback();
      stopAllCornerBgm();
      if (alphaRollTimerRef.current) {
        clearInterval(alphaRollTimerRef.current);
        alphaRollTimerRef.current = null;
      }
      if (rhythmManualChunkClearRef.current) {
        window.clearTimeout(rhythmManualChunkClearRef.current);
        rhythmManualChunkClearRef.current = null;
      }
    };
  }, [stop, stopMemoryPlayback]);

  const bombProgress = useMemo(
    () => Math.max(0, Math.min(100, (bombTimeLeft / Math.max(1, bombMission.seconds)) * 100)),
    [bombTimeLeft, bombMission.seconds]
  );
  const bombDanger = bombPhase === "live" && bombTimeLeft <= 3;

  const duelResultLabel =
    duelWinner === "user" ? "ME" : duelWinner === "ai" ? "AI" : "DRAW";
  const duelSaberShift = Math.max(-38, Math.min(38, (duelBeam - 50) * 1.1 + duelSpeechBoost * 14));
  const wordChainRequired = getLastLetter(wordChainCurrent).toUpperCase();
  const rhythmOverlayActive = rhythmCountdownLabel !== null || rhythmPhase === "tier2_ment";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-fuchsia-50 to-amber-50 text-white relative overflow-hidden">
      <style jsx global>{`
        @keyframes float-up {
          0% { transform: translateY(120%) rotate(0deg); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translateY(-140%) rotate(24deg); opacity: 0; }
        }
        @keyframes bomb-shake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-6deg) scale(1.06); }
          40% { transform: rotate(6deg) scale(1.05); }
          60% { transform: rotate(-4deg) scale(1.08); }
          80% { transform: rotate(5deg) scale(1.04); }
        }
        @keyframes beam-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes duel-flash {
          0% { opacity: 0; transform: scale(0.35); }
          30% { opacity: 0.95; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.45); }
        }
        @keyframes duel-stars {
          0% { opacity: 0; transform: translateY(10px) scale(0.65); }
          30% { opacity: 1; transform: translateY(-10px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-58px) scale(1.55); }
        }
        @keyframes confetti-drop {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(240px) rotate(620deg); opacity: 0; }
        }
        @keyframes quiz-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes quiz-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 10px rgba(16,185,129,0.04); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes coin-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(220px) rotate(540deg); opacity: 0; }
        }
        @keyframes lock-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes saber-flicker {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.25); }
        }
        @keyframes duel-start-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.45); }
          50% { box-shadow: 0 0 0 10px rgba(129,140,248,0.15); }
        }
        @keyframes go-jitter {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          20% { transform: translateY(-3px) rotate(-2deg); }
          40% { transform: translateY(2px) rotate(2deg); }
          60% { transform: translateY(-2px) rotate(-1.2deg); }
          80% { transform: translateY(2px) rotate(1.2deg); }
        }
        @keyframes danger-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.1); border-color: rgba(251,146,146,0.45); }
          50% { box-shadow: 0 0 0 10px rgba(248,113,113,0.05); border-color: rgba(239,68,68,0.8); }
        }
        @keyframes danger-badge {
          0%, 100% { transform: translateY(0); opacity: 0.9; }
          50% { transform: translateY(-2px); opacity: 1; }
        }
        @keyframes danger-vignette {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.78; }
        }
        @keyframes chain-up {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.04); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes chain-down {
          0% { transform: translateY(0px) scale(1); }
          30% { transform: translateY(5px) scale(0.98); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes clear-blink {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.35); filter: brightness(1); }
          50% { box-shadow: 0 0 0 10px rgba(244,114,182,0.12); filter: brightness(1.2); }
        }
        @keyframes memory-pop {
          0% { transform: scale(1); opacity: 1; }
          45% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.88); opacity: 0.6; }
        }
        @keyframes frog-hop-burst {
          0% { transform: translateY(24px) scale(0.75) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-220px) scale(1.25) rotate(16deg); opacity: 0; }
        }
        @keyframes snake-pop-down {
          0% { transform: translateY(-90px) scale(0.82) rotate(-10deg); opacity: 0; }
          30% { transform: translateY(14px) scale(1.08) rotate(8deg); opacity: 1; }
          100% { transform: translateY(120px) scale(0.9) rotate(-6deg); opacity: 0; }
        }
        @keyframes chest-lid-open {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-62deg); }
        }
        @keyframes drop-fade {
          0% { transform: translateY(-30px) scale(0.8) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(240px) scale(1.1) rotate(18deg); opacity: 0; }
        }
        @keyframes chest-wobble {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-2.6deg) scale(1.02); }
          50% { transform: rotate(2.8deg) scale(1.02); }
          75% { transform: rotate(-1.8deg) scale(1.01); }
        }
        @keyframes treasure-bubble-rise {
          0% { transform: translateY(34px) scale(0.72); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes rhythm-chunk-tts-wave {
          0%, 100% { transform: scale(1) translateY(0); box-shadow: 0 0 16px rgba(236,72,153,0.35); }
          50% { transform: scale(1.07) translateY(-6px); box-shadow: 0 0 26px rgba(34,211,238,0.45); }
        }
        @keyframes rhythm-chunk-idle {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.02) translateY(-2px); }
        }
        @keyframes rhythm-clear-float {
          0% { transform: translateY(12px) scale(0.85); opacity: 0; }
          40% { transform: translateY(-4px) scale(1.05); opacity: 1; }
          100% { transform: translateY(-6px) scale(1); opacity: 1; }
        }
        @keyframes rhythm-clear-overlay {
          0% { transform: scale(0.75); opacity: 0; filter: blur(4px); }
          35% { transform: scale(1.06); opacity: 1; filter: blur(0); }
          70% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        @keyframes rhythm-merge-reveal {
          0% { transform: scale(0.88); opacity: 0; }
          45% { transform: scale(0.96); opacity: 0.88; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {FLOATING_ITEMS.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="absolute text-xl pointer-events-none select-none opacity-40"
          style={{
            left: `${(idx * 11 + 7) % 95}%`,
            bottom: "-15%",
            animation: `float-up ${6 + (idx % 5)}s linear ${idx * 0.35}s infinite`,
          }}
        >
          {item}
        </span>
      ))}

      <header className="relative z-10 border-b border-sky-200/70 backdrop-blur bg-white/70">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <HomeButton
            onClick={() => {
              playClick();
              router.push("/");
            }}
            className="bg-white/90 border-sky-200 text-slate-700 hover:bg-white hover:border-sky-300"
          />
          <div>
            <h1 className="text-lg font-semibold tracking-wide text-slate-900">Game Arena</h1>
            <p className="text-xs text-slate-600">영어 게임을 골라 시작해보세요</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6">
        {mode === "menu" && (
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("bomb");
                setBombPhase("idle");
              }}
              className="rounded-2xl border border-rose-300/40 bg-rose-500/20 hover:bg-rose-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-rose-700">Speed Game</p>
              <h2 className="text-xl font-bold mt-1">폭탄 돌리기</h2>
              <p className="text-sm text-slate-700 mt-2">10초 안에 영어로 말하기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("duel");
                setDuelPhase("idle");
              }}
              className="rounded-2xl border border-cyan-300/40 bg-cyan-500/20 hover:bg-cyan-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-cyan-700">Battle Mode</p>
              <h2 className="text-xl font-bold mt-1">AI vs. Me</h2>
              <p className="text-sm text-slate-700 mt-2">AI와 말하기 대결</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("twenty");
                beginTwentyRound();
              }}
              className="rounded-2xl border border-emerald-300/40 bg-emerald-500/20 hover:bg-emerald-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-emerald-700">Guessing Game</p>
              <h2 className="text-xl font-bold mt-1">AI랑 스무고개</h2>
              <p className="text-sm text-slate-700 mt-2">힌트를 보고 정답 맞히기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("password");
                beginPasswordRound();
              }}
              className="rounded-2xl border border-violet-300/40 bg-violet-500/20 hover:bg-violet-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-violet-700">Speaking Puzzle</p>
              <h2 className="text-xl font-bold mt-1">AI랑 자물쇠 풀기</h2>
              <p className="text-sm text-slate-700 mt-2">순서대로 말해 자물쇠 풀기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("repair");
                beginRepairRound();
              }}
              className="rounded-2xl border border-amber-300/40 bg-amber-500/20 hover:bg-amber-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-amber-700">Grammar Repair</p>
              <h2 className="text-xl font-bold mt-1">고장난 AI 복구하기</h2>
              <p className="text-sm text-slate-700 mt-2">틀린 문장 고쳐 말하기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("wordchain");
                beginWordChainRound();
              }}
              className="rounded-2xl border border-fuchsia-300/40 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-fuchsia-700">Arcade Relay</p>
              <h2 className="text-xl font-bold mt-1">AI랑 끝말잇기</h2>
              <p className="text-sm text-slate-700 mt-2">끝말잇기로 단어 이어가기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("memory");
                beginMemoryRound();
              }}
              className="rounded-2xl border border-sky-300/40 bg-sky-500/20 hover:bg-sky-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-sky-700">Smart Memory</p>
              <h2 className="text-xl font-bold mt-1">AI랑 기억력 대결</h2>
              <p className="text-sm text-slate-700 mt-2">순서 기억해 말하기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("frog");
                beginFrogRound();
              }}
              className="rounded-2xl border border-lime-300/40 bg-lime-500/20 hover:bg-lime-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-lime-700">Frog Challenge</p>
              <h2 className="text-xl font-bold mt-1">AI 청개구리 대결</h2>
              <p className="text-sm text-slate-700 mt-2">반대로 바꿔 말하기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("treasure");
                beginTreasureRound();
              }}
              className="rounded-2xl border border-amber-300/40 bg-amber-500/20 hover:bg-amber-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-amber-700">Treasure Quest</p>
              <h2 className="text-xl font-bold mt-1">AI 보물찾기 게임</h2>
              <p className="text-sm text-slate-700 mt-2">단어 넣어 문장 만들기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("alphabet");
                beginAlphaRound();
              }}
              className="rounded-2xl border border-indigo-300/40 bg-indigo-500/20 hover:bg-indigo-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-indigo-700">Letter Quiz</p>
              <h2 className="text-xl font-bold mt-1">알파벳 주사위 퀴즈</h2>
              <p className="text-sm text-slate-700 mt-2">알파벳으로 단어 말하기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("tongue");
                beginTongueRound();
              }}
              className="rounded-2xl border border-fuchsia-300/40 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-fuchsia-700">Tongue Twister</p>
              <h2 className="text-xl font-bold mt-1">AI 텅 트위스터 챌린지</h2>
              <p className="text-sm text-slate-700 mt-2">듣고 그대로 따라 말하기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("rhythm");
                beginRhythmRound();
              }}
              className="rounded-2xl border border-pink-300/40 bg-pink-500/20 hover:bg-pink-500/30 p-5 text-left text-slate-900 transition"
            >
              <p className="text-sm text-pink-700">Rhythm &amp; Dance</p>
              <h2 className="text-xl font-bold mt-1">AI 리듬 따라잡기</h2>
              <p className="text-sm text-slate-700 mt-2">듣고 빠르게 따라 말하기</p>
            </button>
          </section>
        )}

        {mode === "bomb" && (
          <section
            className="rounded-3xl border border-rose-300/40 bg-gradient-to-b from-rose-900/55 via-fuchsia-950/55 to-slate-950/75 p-5 space-y-4 text-white shadow-[0_12px_34px_rgba(244,114,182,0.2)] relative overflow-hidden"
            style={bombDanger ? { animation: "danger-border 0.55s ease-in-out infinite" } : undefined}
          >
            {bombDanger ? (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255,255,255,0) 45%, rgba(239,68,68,0.22) 72%, rgba(220,38,38,0.45) 100%)",
                  animation: "danger-vignette 0.55s ease-in-out infinite",
                }}
              />
            ) : null}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-rose-200">폭탄 돌리기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                  setBombPhase("idle");
                  activeRoundRef.current = null;
                  stop();
                }}
                className="text-sm text-cyan-100/80 hover:text-cyan-50"
              >
                코너 선택으로
              </button>
            </div>

            <div className="rounded-2xl border border-rose-200/35 bg-rose-500/12 p-4">
              <p className="text-xs text-rose-100/80 mb-1 font-semibold">MISSION</p>
              <p className="font-semibold text-rose-50">{bombMission.prompt}</p>
            </div>

            {bombPhase === "idle" && (
              <button
                type="button"
                onClick={beginBombRound}
                className="w-full py-3 rounded-2xl text-white bg-gradient-to-r from-pink-500 to-rose-400 font-bold shadow-md"
              >
                시작하기
              </button>
            )}

            {(bombPhase === "countdown" || bombPhase === "live") && (
              <div className="text-center space-y-3">
                <div
                  className="text-7xl font-black tracking-tight text-rose-200"
                  style={bombPhase === "live" ? { animation: "go-jitter 0.35s ease-in-out infinite" } : undefined}
                >
                  {bombPhase === "countdown" ? bombCountdown : "GO!"}
                </div>
                <div className="flex items-center justify-center">
                  <BombBuddy mood={bombPhase === "live" ? "active" : "idle"} urgent={bombDanger} />
                </div>
                {bombPhase === "live" && (
                  <>
                    <div className="w-full h-3 rounded-full bg-rose-950/55 overflow-hidden border border-rose-200/35">
                      <div
                        className="h-full bg-gradient-to-r from-lime-300 via-amber-300 to-rose-400 transition-all duration-700"
                        style={{ width: `${bombProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-rose-100 font-semibold">남은 시간: {bombTimeLeft}s</p>
                    <p className="text-sm text-rose-100/90">
                      감지된 문장 {bombDetectedSentences}개 / 단어 {bombDetectedWords}개
                    </p>
                  </>
                )}
              </div>
            )}

            {bombPhase === "judging" && (
              <div className="rounded-2xl bg-white/10 border border-rose-200/35 p-4 text-center">
                <p className="text-lg font-semibold animate-pulse text-rose-100">AI가 발화를 듣는 중...</p>
              </div>
            )}

            {bombPhase === "result" && (
              <div className="relative overflow-hidden rounded-2xl bg-white/10 border border-rose-200/35 p-4 space-y-2">
                {bombSuccess && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 22 }).map((_, i) => (
                      <span
                        key={`bomb-confetti-${i}`}
                        className="absolute w-2.5 h-4 rounded-sm"
                        style={{
                          left: `${(i * 13 + 9) % 100}%`,
                          top: "-12px",
                          background:
                            i % 5 === 0
                              ? "#fb7185"
                              : i % 5 === 1
                              ? "#facc15"
                              : i % 5 === 2
                              ? "#22c55e"
                              : i % 5 === 3
                              ? "#38bdf8"
                              : "#a78bfa",
                          animation: `confetti-drop ${1.2 + (i % 5) * 0.25}s ease-out ${i * 0.04}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center pb-1">
                  <BombBuddy mood={bombSuccess ? "success" : "fail"} />
                </div>
                <p className={`text-lg font-bold ${bombSuccess ? "text-emerald-500" : "text-amber-500"}`}>
                  {bombSuccess ? "PASS!" : "다시 한 번!"}
                </p>
                {!bombSuccess ? <p className="text-sm text-rose-100/90">{bombMessage}</p> : null}
                {!bombSuccess ? (
                  <p className="text-sm text-rose-100/80">인식 결과: {bombDetectedSentences}문장 · {bombDetectedWords}단어</p>
                ) : null}
                <button
                  type="button"
                  onClick={beginBombRound}
                  className="mt-2 w-full py-2.5 rounded-xl text-white bg-rose-500 hover:bg-rose-400 transition"
                >
                  한 판 더
                </button>
              </div>
            )}

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={bombInputText}
                onChange={(e) => {
                  setBombInputText(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                placeholder="음성이 잘 안 되면 여기에 영어로 직접 입력해도 됩니다."
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="pink" />
            </div>
          </section>
        )}

        {mode === "duel" && (
          <section className="relative overflow-hidden rounded-2xl border border-cyan-300/45 bg-gradient-to-b from-cyan-950 via-slate-950 to-indigo-950 p-5 space-y-4 shadow-[0_18px_42px_rgba(6,182,212,0.24)]">
            {duelImpact !== "none" && (
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                <div
                  className={`absolute inset-0 ${
                    duelImpact === "win"
                      ? "bg-cyan-300/25"
                      : duelImpact === "lose"
                      ? "bg-rose-400/25"
                      : "bg-amber-300/20"
                  }`}
                  style={{ animation: "duel-flash 1.2s ease-out forwards" }}
                />
                <div className="relative text-6xl" style={{ animation: "duel-stars 1.1s ease-out forwards" }}>
                  {duelImpact === "win" ? "🎆✨🏆" : duelImpact === "lose" ? "💥😵💥" : "⭐⚡⭐"}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-cyan-300">AI vs. Me</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                  setDuelPhase("idle");
                  activeRoundRef.current = null;
                  stop();
                }}
                className="text-sm text-cyan-300 hover:text-sky-300"
              >
                코너 선택으로
              </button>
            </div>

            <div className="rounded-xl border border-cyan-200/35 bg-cyan-900/55 p-4">
              <p className="text-xs font-semibold text-white mb-1">대결</p>
              <p className="font-bold text-white">{duelMission.taunt}</p>
            </div>

            {duelPhase === "idle" && (
              <button
                type="button"
                onClick={beginDuelRound}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 font-semibold animate-[duel-start-glow_1.4s_ease-in-out_infinite]"
              >
                대결 시작
              </button>
            )}

            {(duelPhase === "countdown" || duelPhase === "live") && (
              <div className="text-center space-y-3">
                <div className="text-7xl font-black tracking-tight text-cyan-200">
                  {duelPhase === "countdown" ? duelCountdown : "GO!"}
                </div>
                {duelPhase === "live" && (
                  <p className="text-sm text-cyan-300">
                    {duelMission.targetSentences}문장 이상 도전! 남은 시간: {duelTimeLeft}s
                  </p>
                )}
              </div>
            )}

            {duelPhase === "judging" && (
              <div className="rounded-xl border border-cyan-200/25 bg-cyan-950/45 p-4 text-center">
                <p className="text-lg font-semibold animate-pulse">대결 결과 계산 중...</p>
              </div>
            )}

            <div className="rounded-xl border border-cyan-200/25 bg-cyan-950/35 p-4 space-y-2">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>AI</span>
                <span>ME</span>
              </div>
              <div className="h-7 rounded-full bg-slate-950/70 overflow-hidden relative border border-cyan-200/25">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${duelBeam}%`,
                    background:
                      "linear-gradient(90deg, rgba(34,211,238,0.98), rgba(129,140,248,0.98), rgba(56,189,248,0.98))",
                    backgroundSize: "200% 200%",
                    animation: "beam-flow 1.2s linear infinite",
                  }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/40" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-16 h-2 rounded-full"
                  style={{
                    left: `calc(50% + ${duelSaberShift}px - 32px)`,
                    background:
                      "linear-gradient(90deg, rgba(6,182,212,0.95), rgba(255,255,255,0.95), rgba(99,102,241,0.95))",
                    boxShadow:
                      "0 0 14px rgba(34,211,238,0.9), 0 0 22px rgba(129,140,248,0.65)",
                    animation: "saber-flicker 0.7s ease-in-out infinite",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/90"
                  style={{
                    left: `calc(50% + ${duelSaberShift}px - 8px)`,
                    boxShadow: "0 0 16px rgba(255,255,255,0.9)",
                  }}
                />
              </div>
              {duelPhase === "live" && (
                <p className="text-[11px] text-sky-300">
                  말하기를 시작하면 광선검이 내 쪽으로 밀려요!
                </p>
              )}
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>AI 문장: {duelAiSentences}</span>
                <span>내 문장: {duelUserSentences}</span>
              </div>
            </div>

            {duelPhase === "result" && (
              <div className="rounded-xl border border-cyan-200/25 bg-cyan-950/45 p-4 space-y-2">
                <p
                  className={`text-lg font-bold ${
                    duelWinner === "user"
                      ? "text-emerald-200"
                      : duelWinner === "ai"
                      ? "text-rose-200"
                      : "text-amber-200"
                  }`}
                >
                  RESULT: {duelResultLabel}
                </p>
                <p className="text-sm text-sky-300">{duelMessage}</p>
                <button
                  type="button"
                  onClick={beginDuelRound}
                  className="mt-2 w-full py-2.5 rounded-lg bg-cyan-500/80 hover:bg-cyan-400 transition"
                >
                  리매치
                </button>
              </div>
            )}

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={duelInputText}
                onChange={(e) => {
                  setDuelInputText(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                placeholder="음성이 잘 안 되면 여기에 영어로 입력해도 됩니다."
                className="flex-1 rounded-xl bg-cyan-500/10 border border-cyan-200/25 px-3 py-2 text-sm text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-cyan-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
            </div>
          </section>
        )}

        {mode === "twenty" && (
          <section className="relative overflow-hidden rounded-3xl border border-emerald-300/50 bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 p-5 space-y-4 shadow-[0_18px_42px_rgba(16,185,129,0.24)]">
            <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-emerald-300/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-cyan-300/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-emerald-300">AI랑 스무고개</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  stopMemoryPlayback();
                  setMode("menu");
                }}
                className="text-sm text-emerald-300 hover:text-teal-300"
              >
                코너 선택으로
              </button>
            </div>

            <div
              className={`rounded-2xl border p-4 transition-colors duration-300 ${
                twentyHintMode === "keywords"
                  ? "border-teal-300/70 bg-emerald-500/10 backdrop-blur-[1px]"
                  : "border-indigo-300/75 bg-slate-900/72 backdrop-blur-[1px]"
              }`}
              style={{ animation: "quiz-glow 2.4s ease-in-out infinite" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold ${twentyHintMode === "keywords" ? "text-emerald-300" : "text-violet-300"}`}>
                  HINT MODE
                </p>
                <p className={`text-xs ${twentyHintMode === "keywords" ? "text-emerald-300/85" : "text-violet-300/85"}`}>
                  시도 {twentyAttempts}회
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {twentyHintMode === "keywords" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-300/60 bg-emerald-400/15 text-emerald-300">
                    <span style={{ animation: "quiz-float 2.6s ease-in-out infinite" }}>💡</span>
                    단어 힌트
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-violet-300/80 bg-indigo-900/70 text-violet-300">
                    <span style={{ animation: "quiz-float 2.2s ease-in-out infinite" }}>🧠</span>
                    문장 힌트
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-1.5 flex-1 rounded-full ${twentyHintMode === "keywords" ? "bg-emerald-500" : "bg-emerald-300/35"}`} />
                <div className={`h-1.5 flex-1 rounded-full ${twentyHintMode === "sentences" ? "bg-indigo-300" : "bg-indigo-200/25"}`} />
              </div>
              {twentyHintMode === "keywords" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {twentyQuestion.keywordHints.map((hint) => (
                    <button
                      type="button"
                      key={`${twentyQuestion.id}-${hint}`}
                      onClick={() => {
                        playClick();
                        speakHint(hint);
                      }}
                      className="px-2.5 py-1 rounded-full text-xs bg-emerald-100/75 border border-emerald-500/70 text-emerald-900 hover:bg-emerald-200/85 transition font-semibold"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              ) : (
                <ul className="mt-2 text-sm text-violet-300 space-y-1.5">
                  {twentyQuestion.sentenceHints.map((hint, idx) => (
                    <button
                      type="button"
                      key={`${twentyQuestion.id}-hint-${idx}`}
                      onClick={() => {
                        playClick();
                        speakHint(hint);
                      }}
                      className="w-full text-left rounded-lg bg-indigo-950/85 border border-violet-300/45 px-2.5 py-1.5 text-violet-300 hover:bg-indigo-900 transition"
                    >
                      {hint}
                    </button>
                  ))}
                </ul>
              )}
            </div>

            {twentyMessage || twentyRecentGuesses.length > 0 ? (
              <div className="rounded-xl border border-emerald-200/25 bg-emerald-950/40 p-3">
                {twentyMessage ? <p className="text-sm text-emerald-300">{twentyMessage}</p> : null}
                {twentyRecentGuesses.length > 0 ? (
                  <div className={twentyMessage ? "mt-2 flex flex-wrap gap-1.5" : "flex flex-wrap gap-1.5"}>
                    {twentyRecentGuesses.map((g, idx) => (
                      <span
                        key={`${g}-${idx}`}
                        className="px-2 py-0.5 rounded-full text-[11px] bg-slate-700/60 border border-emerald-400/30 text-emerald-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {twentySolved && (
              <div className="relative overflow-hidden rounded-xl border border-emerald-300/40 bg-emerald-400/20 p-4 text-center">
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span
                      key={`twenty-confetti-${i}`}
                      className="absolute w-2 h-3 rounded-sm"
                      style={{
                        left: `${(i * 17 + 11) % 100}%`,
                        top: "-10px",
                        background: i % 2 === 0 ? "#34d399" : "#22d3ee",
                        animation: `confetti-drop ${1 + (i % 4) * 0.2}s ease-out ${i * 0.03}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xl font-bold text-emerald-300">PASS!</p>
                <p className="text-sm text-teal-300 mt-1">정답: {twentyQuestion.answer}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                value={twentyGuess}
                onChange={(e) => setTwentyGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitTwentyGuess()}
                placeholder="정답을 영어 단어로 입력하세요."
                className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-200/25 px-3 py-2 text-sm text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitTwentyGuess}
                disabled={!twentyGuess.trim() || twentySolved}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                정답 제출
              </button>
            </div>

            <button
              type="button"
              onClick={beginTwentyRound}
              className="w-full py-2.5 rounded-xl border border-emerald-300/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition"
            >
              새 문제
            </button>
          </section>
        )}

        {mode === "password" && (
          <section
            className={`relative overflow-hidden rounded-3xl border border-violet-200/65 bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 p-5 space-y-4 shadow-[0_18px_42px_rgba(139,92,246,0.24)] ${
              passwordShake ? "animate-[shake_0.5s_linear]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-violet-300">AI랑 자물쇠 풀기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                  stop();
                }}
                className="text-sm text-violet-300 hover:text-fuchsia-300"
              >
                코너 선택으로
              </button>
            </div>

            <div className="relative rounded-2xl border border-violet-200/55 bg-violet-900/45 backdrop-blur-sm p-4">
              {passwordUnlocked && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/15 via-white/10 to-cyan-200/15 animate-pulse" />
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={`beam-${i}`}
                      className="absolute left-1/2 top-1/2 w-1 h-36 bg-gradient-to-t from-yellow-200/0 via-yellow-100/80 to-white/90"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                        animation: `duel-stars 1.1s ease-out ${i * 0.08}s`,
                      }}
                    />
                  ))}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={`coin-${i}`}
                      className="absolute text-lg"
                      style={{
                        left: `${(i * 11 + 7) % 100}%`,
                        top: "-12px",
                        animation: `coin-fall ${0.9 + (i % 4) * 0.2}s ease-out ${i * 0.03}s`,
                      }}
                    >
                      🪙
                    </span>
                  ))}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={`smile-${i}`}
                      className="absolute text-lg"
                      style={{
                        left: `${(i * 19 + 5) % 100}%`,
                        top: `${8 + (i % 3) * 10}%`,
                        animation: `duel-stars ${0.9 + (i % 3) * 0.2}s ease-out ${i * 0.05}s`,
                      }}
                    >
                      {i % 2 === 0 ? "😄" : "✨"}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-center gap-4">
                <div className="w-24 h-24 rounded-2xl border-2 border-violet-100/70 bg-white/25 flex items-center justify-center text-5xl shadow-[0_0_22px_rgba(196,181,253,0.45)]">
                  <span style={{ animation: "lock-pop 1.2s ease-in-out infinite" }}>
                    {passwordUnlocked ? "🔓" : "🔒"}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-fuchsia-300">Digital Lock</p>
                  <p className="text-xs mt-1 font-bold text-white">정답 순서로 말하면 잠금 해제!</p>
                  <p className="text-xs mt-1 font-bold text-white">진행: {passwordMatchedCount}/{passwordPuzzle.answerWords.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {passwordPuzzle.scrambledWords.map((word, idx) => {
                const keyNumber = idx + 1;
                const pressed = passwordPressedNumbers.includes(keyNumber);
                const tapped = passwordTappedNumber === keyNumber;
                return (
                  <button
                    key={`pad-${passwordPuzzle.id}-${keyNumber}`}
                    type="button"
                    onClick={() => {
                      playClick();
                      speakHint(word);
                      setPasswordTappedNumber(keyNumber);
                      window.setTimeout(() => setPasswordTappedNumber((n) => (n === keyNumber ? null : n)), 220);
                    }}
                    className={`rounded-xl border py-2 transition relative overflow-hidden ${
                      pressed
                        ? "bg-emerald-400/35 border-emerald-200 text-emerald-50 shadow-[0_0_22px_rgba(52,211,153,0.65)]"
                        : tapped
                        ? "bg-violet-400/30 border-violet-200 text-violet-50 shadow-[0_0_16px_rgba(196,181,253,0.65)]"
                        : "bg-slate-900/55 border-violet-200/35 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_14px_rgba(0,0,0,0.28)]"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30 pointer-events-none" />
                    <div className="relative text-[10px] opacity-85">#{keyNumber}</div>
                    <div className="relative text-xs font-semibold truncate px-1 mt-0.5">{word}</div>
                  </button>
                );
              })}
            </div>

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={passwordTranscript}
                onChange={(e) => {
                  setPasswordTranscript(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitPasswordTry()}
                placeholder="음성 인식이 약하면 문장을 직접 입력해도 됩니다."
                className="flex-1 rounded-xl bg-violet-500/10 border border-violet-200/25 px-3 py-2 text-sm text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-violet-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitPasswordTry}
                className="px-3.5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium"
              >
                해제 시도
              </button>
            </div>

            <button
              type="button"
              onClick={beginPasswordRound}
              className="w-full py-2.5 rounded-xl border border-violet-300/40 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition"
            >
              새 비밀번호
            </button>
          </section>
        )}

        {mode === "frog" && (
          <section className={`relative overflow-hidden rounded-3xl border border-lime-300/40 bg-gradient-to-b from-emerald-900/65 via-lime-950/65 to-slate-950/80 p-5 space-y-4 ${frogShake ? "animate-[shake_0.5s_linear]" : ""}`}>
            {frogSnakeBurst && (
              <div className="absolute inset-0 pointer-events-none z-30 flex justify-center">
                <span
                  className="text-6xl"
                  style={{ animation: "snake-pop-down 0.72s ease-out forwards" }}
                >
                  🐍
                </span>
              </div>
            )}
            {frogCelebrate && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={`frog-burst-${i}`}
                    className="absolute text-xl"
                    style={{
                      left: `${(i * 13 + 9) % 100}%`,
                      bottom: "-12px",
                      animation: `frog-hop-burst ${0.95 + (i % 4) * 0.24}s ease-out ${i * 0.03}s`,
                    }}
                  >
                    {i % 2 === 0 ? "🐸" : "🍀"}
                  </span>
                ))}
              </div>
            )}
            <div className="absolute -top-12 -right-8 w-36 h-36 rounded-full bg-lime-300/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-lime-100">AI랑 무조건 반대로 말하기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-fuchsia-100/80 hover:text-fuchsia-50"
              >
                코너 선택으로
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                playClick();
                speakHint(frogPuzzle.ai);
                playFrogCroak();
              }}
              className="w-full text-left rounded-2xl border border-lime-200/40 bg-lime-400/15 p-4 hover:bg-lime-400/22 transition"
            >
              <p className="text-xs text-lime-100/80 mb-1">AI SENTENCE</p>
              <p className="text-lg font-black text-lime-50">{frogPuzzle.ai}</p>
              <p className="text-xs text-lime-100/75 mt-1">시도 횟수: {frogAttempts}</p>
            </button>

            <div className="rounded-2xl border border-emerald-200/35 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-50">{frogMessage}</p>
            </div>

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={frogInput}
                onChange={(e) => {
                  setFrogInput(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitFrogTry()}
                placeholder="음성 인식이 약하면 반대 문장을 직접 입력해도 됩니다."
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitFrogTry}
                className="px-3.5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-900 text-sm font-bold"
              >
                반대로 말하기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  speakHint(frogPuzzle.opposite);
                  playFrogCroak();
                }}
                className="py-2.5 rounded-xl border border-lime-300/45 text-lime-100 hover:bg-lime-500/20 transition"
              >
                힌트
              </button>
              <button
                type="button"
                onClick={beginFrogRound}
                className="py-2.5 rounded-xl border border-emerald-300/45 text-emerald-100 hover:bg-emerald-500/20 transition"
              >
                새 문장
              </button>
            </div>
          </section>
        )}

        {mode === "treasure" && (
          <section className="relative overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-b from-amber-900/55 via-yellow-950/60 to-slate-950/80 p-5 space-y-4">
            {treasureCoinBurst && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {Array.from({ length: 26 }).map((_, i) => (
                  <span
                    key={`treasure-coin-${i}`}
                    className="absolute text-lg"
                    style={{
                      left: `${(i * 11 + 9) % 100}%`,
                      top: "36%",
                      animation: `coin-fall ${0.9 + (i % 4) * 0.22}s ease-out ${i * 0.03}s`,
                    }}
                  >
                    💵
                  </span>
                ))}
              </div>
            )}
            {treasureFailBurst && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={`treasure-fail-${i}`}
                    className="absolute text-xl"
                    style={{
                      left: `${(i * 17 + 7) % 100}%`,
                      top: "-14px",
                      animation: `drop-fade ${0.95 + (i % 3) * 0.18}s ease-out ${i * 0.04}s`,
                    }}
                  >
                    {i % 2 === 0 ? "💀" : "🕷️"}
                  </span>
                ))}
              </div>
            )}
            <div className="absolute -top-12 -right-8 w-36 h-36 rounded-full bg-amber-300/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-yellow-300/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-amber-100">AI 보물찾기 게임</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-fuchsia-100/80 hover:text-fuchsia-50"
              >
                코너 선택으로
              </button>
            </div>

            <div className="relative py-2">
              <button
                type="button"
                onClick={() => {
                  if (treasureOpened) return;
                  setTreasureOpened(true);
                  playPop();
                  playClick();
                }}
                className={`mx-auto relative block w-56 h-32 ${!treasureOpened ? "animate-[chest-wobble_1.25s_ease-in-out_infinite]" : ""}`}
              >
                {!treasureOpened ? (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg text-amber-100/90 animate-pulse">⬇</span>
                ) : null}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-2 w-48 h-14 rounded-t-[24px] border-2 border-amber-300/75 bg-gradient-to-b from-amber-300/80 to-amber-700/80 origin-bottom transition-all duration-300"
                  style={treasureOpened ? { opacity: 0, transform: "translateX(-50%) translateY(-22px) scale(0.8)" } : undefined}
                />
                <div
                  className={`absolute left-1/2 -translate-x-1/2 bottom-1 w-48 h-[4.5rem] rounded-b-[20px] border-2 transition-all duration-300 ${
                    treasureOpened
                      ? "border-amber-500/75 bg-gradient-to-b from-amber-800/80 to-stone-950/85"
                      : "border-amber-300/75 bg-gradient-to-b from-amber-500/80 to-amber-900/85"
                  }`}
                />
                <div className={`absolute left-1/2 -translate-x-1/2 bottom-8 w-7 h-6 rounded-md border transition-all duration-300 ${
                  treasureOpened ? "border-amber-500/60 bg-amber-700/55" : "border-amber-100/70 bg-yellow-200/80"
                }`} />
                {treasureOpened ? (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-9 rounded-2xl border border-yellow-100/85 bg-amber-200/80 px-4 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
                    style={{ animation: "treasure-bubble-rise 0.32s ease-out" }}
                  >
                    <span className="text-lg font-black text-amber-950 tracking-wide">{treasureWord.word.toUpperCase()}</span>
                  </div>
                ) : null}
              </button>
            </div>

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={treasureInput}
                onChange={(e) => {
                  setTreasureInput(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitTreasureTry()}
                placeholder='공개된 단어를 포함한 문장을 말하거나 입력하세요.'
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitTreasureTry}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold"
              >
                문장 제출
              </button>
            </div>

            {treasureMessage ? (
              <p className={`text-sm ${treasureSuccess ? "text-emerald-100" : "text-white/90"}`}>{treasureMessage}</p>
            ) : null}

            <button
              type="button"
              onClick={beginTreasureRound}
              className="w-full py-2.5 rounded-xl border border-amber-300/45 text-amber-100 hover:bg-amber-500/20 transition"
            >
              새 보물상자
            </button>
          </section>
        )}

        {mode === "memory" && (
          <section className="relative overflow-hidden rounded-3xl border border-sky-300/40 bg-gradient-to-b from-slate-900/90 via-sky-950/70 to-black/85 p-5 space-y-4">
            <div className="absolute inset-0 pointer-events-none opacity-35" style={{ background: "linear-gradient(180deg, rgba(34,211,238,0.04) 0%, rgba(0,0,0,0) 20%)" }} />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-sky-100">AI랑 기억력 대결</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>

            <div className="rounded-2xl border border-sky-200/35 bg-sky-500/10 p-4">
              <div className="flex items-center justify-between text-xs text-sky-100/80">
                <span>SMART MEMORY SEQUENCE</span>
              </div>
              <p className="mt-2 text-sm text-white/90">{memoryMessage}</p>
              {memoryCountdown !== null ? (
                <div className="mt-3 text-center">
                  <span className="inline-flex min-w-20 justify-center rounded-2xl border border-cyan-200/75 bg-cyan-400/25 px-5 py-2 text-4xl font-black text-cyan-50 animate-pulse shadow-[0_0_24px_rgba(34,211,238,0.55)]">
                    {memoryCountdown === 0 ? "GO!" : String(memoryCountdown)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {memoryRound.words.map((word, idx) => (
                <div
                  key={`memory-bubble-${memoryRound.id}-${idx}`}
                  className={`relative min-h-[88px] rounded-2xl border p-4 text-center transition ${
                    memoryRevealed[idx]
                      ? "border-emerald-200/70 bg-emerald-400/25 text-emerald-50 shadow-[0_10px_18px_rgba(16,185,129,0.28)]"
                      : "border-sky-200/45 bg-slate-900/70 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_12px_18px_rgba(2,6,23,0.4)]"
                  }`}
                  style={
                    memoryPopped === idx
                      ? { animation: "memory-pop 0.3s ease-out" }
                      : memoryActiveWordIndex === idx
                      ? { boxShadow: "0 0 0 2px rgba(34,211,238,0.55), 0 0 22px rgba(56,189,248,0.52)" }
                      : undefined
                  }
                >
                  <div className="text-sm font-extrabold opacity-95 tracking-wide">#{idx + 1}</div>
                  <div className="mt-2 text-xl font-black tracking-wide">
                    {memoryRevealed[idx] ? word.toUpperCase() : memoryReplayLeft > 0 ? "❤" : "?"}
                  </div>
                </div>
              ))}
            </div>

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={memoryInput}
                onChange={(e) => {
                  setMemoryInput(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitMemoryWord()}
                placeholder="음성 인식이 약하면 단어를 직접 입력해도 됩니다."
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitMemoryWord}
                disabled={memoryListeningOrder || memoryCompleted || memoryCountdown !== null}
                className="px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium disabled:opacity-50"
              >
                단어 확인
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (memoryReplayLeft <= 0) return;
                  memoryPlaybackTokenRef.current += 1;
                  const token = memoryPlaybackTokenRef.current;
                  setMemoryReplayLeft(0);
                  setMemoryReplayGlow(false);
                  void playMemoryOrder(memoryRound.words, token);
                }}
                disabled={memoryListeningOrder || memoryReplayLeft <= 0 || memoryCountdown !== null}
                className={`py-2.5 rounded-xl border border-sky-300/45 text-sky-100 hover:bg-sky-500/20 transition disabled:opacity-50 ${
                  memoryReplayGlow ? "animate-pulse shadow-[0_0_24px_rgba(56,189,248,0.62)]" : ""
                }`}
              >
                {memoryListeningOrder ? "재생 중..." : `다시 듣기 ${memoryReplayLeft > 0 ? "❤" : ""}`}
              </button>
              <button
                type="button"
                onClick={beginMemoryRound}
                className={`py-2.5 rounded-xl border border-cyan-300/50 text-cyan-100 hover:bg-cyan-500/20 transition shadow-[0_0_16px_rgba(34,211,238,0.42)] hover:shadow-[0_0_24px_rgba(34,211,238,0.65)] ${
                  memoryNewRoundGlow ? "animate-pulse shadow-[0_0_28px_rgba(34,211,238,0.78)]" : ""
                }`}
              >
                새 라운드
              </button>
            </div>
          </section>
        )}

        {mode === "wordchain" && (
          <section className="relative overflow-hidden rounded-3xl border border-fuchsia-300/45 bg-gradient-to-b from-fuchsia-950 via-violet-900/92 to-cyan-800/85 p-5 space-y-4 shadow-[0_16px_36px_rgba(217,70,239,0.16)]">
            {wordChainCelebrate && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={`wordchain-confetti-${i}`}
                    className="absolute w-2.5 h-4 rounded-sm"
                    style={{
                      left: `${(i * 11 + 7) % 100}%`,
                      top: "-12px",
                      background:
                        i % 5 === 0 ? "#f472b6" : i % 5 === 1 ? "#22d3ee" : i % 5 === 2 ? "#facc15" : i % 5 === 3 ? "#4ade80" : "#c084fc",
                      animation: `confetti-drop ${0.95 + (i % 5) * 0.22}s ease-out ${i * 0.03}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="absolute -top-14 -right-10 w-40 h-40 rounded-full bg-fuchsia-300/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-cyan-300/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-fuchsia-300">AI랑 끝말잇기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-fuchsia-300 hover:text-cyan-300"
              >
                코너 선택으로
              </button>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div className="rounded-2xl border border-fuchsia-200/35 bg-black/25 p-2 flex items-end justify-center">
                <div
                  className={`relative w-8 h-40 rounded-full border border-fuchsia-200/40 bg-fuchsia-950/40 overflow-hidden ${
                    wordChainGaugeTrend === "up"
                      ? "animate-[chain-up_0.3s_ease-out]"
                      : wordChainGaugeTrend === "down"
                      ? "animate-[chain-down_0.3s_ease-out]"
                      : ""
                  }`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fuchsia-500 via-cyan-300 to-emerald-300 transition-all duration-300"
                    style={{ height: `${wordChainGauge}%` }}
                  />
                  <div className="absolute -right-10 top-1 text-[10px] text-fuchsia-300">MAX</div>
                  <div className="absolute -right-10 bottom-1 text-[10px] text-fuchsia-300">MIN</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-fuchsia-200/40 bg-fuchsia-900/55 p-4">
                  <div className="flex items-center justify-between text-xs text-fuchsia-300">
                    <span>TURN {wordChainTurn}/{WORD_CHAIN_MAX_TURN}</span>
                    <span>게이지 {wordChainGauge}%</span>
                  </div>
                  <p className="mt-2 text-sm text-fuchsia-200">{wordChainMessage}</p>
                </div>

                <div className="rounded-2xl border border-cyan-200/35 bg-cyan-900/55 p-4">
                  <p className="text-xs text-cyan-300">현재 기준 단어</p>
                  <p className="text-2xl font-black text-cyan-300 tracking-wide">{wordChainCurrent.toUpperCase()}</p>
                  <p className="text-sm text-cyan-200 mt-1">다음 단어 시작 글자: <span className="font-bold text-emerald-300">{wordChainRequired}</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-fuchsia-200/25 bg-fuchsia-950/35 p-3">
              <div className="flex flex-wrap gap-2">
                {wordChainHistory.slice(-10).map((entry, idx) => (
                  <span
                    key={`chain-${entry.turn}-${idx}-${entry.word}`}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      entry.speaker === "me"
                        ? "bg-emerald-400/20 border-emerald-200/50 text-emerald-300"
                        : "bg-fuchsia-400/20 border-fuchsia-200/50 text-fuchsia-300"
                    }`}
                  >
                    {entry.speaker === "me" ? "ME" : "AI"} · {entry.word}
                  </span>
                ))}
              </div>
            </div>

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={wordChainInput}
                onChange={(e) => {
                  setWordChainInput(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitWordChainTurn()}
                placeholder="끝 글자로 시작하는 영어 단어를 말하거나 입력하세요."
                className="flex-1 rounded-xl bg-fuchsia-500/10 border border-fuchsia-200/25 px-3 py-2 text-sm text-fuchsia-200 placeholder:text-fuchsia-300/55 outline-none focus:ring-2 focus:ring-fuchsia-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitWordChainTurn}
                className="px-3.5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-sm font-medium"
              >
                단어 제출
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={beginWordChainRound}
                className="py-2.5 rounded-xl border border-fuchsia-300/40 text-fuchsia-100 hover:bg-fuchsia-500/20 transition"
              >
                새 게임
              </button>
              <button
                type="button"
                onClick={wordChainFinished ? triggerWordChainCelebration : submitWordChainTurn}
                className={`py-2.5 rounded-xl border border-cyan-300/40 text-cyan-100 hover:bg-cyan-500/20 transition ${
                  wordChainFinished ? "animate-[clear-blink_0.9s_ease-in-out_infinite] bg-cyan-400/20" : ""
                }`}
              >
                {wordChainFinished ? "클리어 완료" : "턴 진행"}
              </button>
            </div>
          </section>
        )}

        {mode === "alphabet" && (
          <section
            className={`relative rounded-3xl border border-indigo-300/40 bg-gradient-to-b from-indigo-900/50 via-slate-950/75 to-black p-5 space-y-4 ${
              alphaShake ? "animate-[shake_0.5s_linear]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-indigo-100">AI 주사위 굴리기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>
            {alphaMessage ? <p className="text-sm text-white/90">{alphaMessage}</p> : null}
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={rollAlphaDice}
                disabled={alphaRolling}
                className="relative w-40 h-40 rounded-2xl border-4 border-indigo-300/50 bg-indigo-950/60 flex items-center justify-center text-6xl font-black text-indigo-50 shadow-[inset_0_0_30px_rgba(99,102,241,0.35)] disabled:opacity-80"
              >
                <span
                  className="relative z-10 inline-flex items-center justify-center"
                  style={
                    alphaRolling
                      ? { animation: "bomb-shake 0.2s linear infinite" }
                      : !alphaLetter || alphaExpired
                      ? { animation: "go-jitter 1.2s ease-in-out infinite" }
                      : undefined
                  }
                >
                  {!alphaLetter || alphaExpired ? "🎲" : alphaRollFace}
                </span>
                {alphaLetter && !alphaExpired ? (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-32 h-32">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.14)" strokeWidth="7" fill="none" />
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          stroke="url(#alphaTimerGrad)"
                          strokeWidth="7"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={276.46}
                          strokeDashoffset={(1 - alphaTimeLeft / ALPHA_ROUND_SEC) * 276.46}
                          style={{ transition: "stroke-dashoffset 0.25s linear" }}
                        />
                        <defs>
                          <linearGradient id="alphaTimerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="55%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#f472b6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                ) : null}
                {alphaLetter && !alphaExpired ? (
                  <>
                    <span className="absolute -inset-1 rounded-3xl bg-fuchsia-400/10 blur-lg pointer-events-none" />
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-indigo-900/85 border border-cyan-300/50 text-xs font-black text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)] pointer-events-none">
                      {alphaTimeLeft}s
                    </span>
                  </>
                ) : null}
                {alphaDiceBurst ? (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={`dice-burst-${i}`}
                        className="absolute text-sm"
                        style={{
                          left: "50%",
                          top: "50%",
                          animation: `duel-stars 0.55s ease-out ${i * 0.03}s`,
                          transform: `translate(${Math.cos((i / 8) * Math.PI * 2) * 28}px, ${Math.sin((i / 8) * Math.PI * 2) * 28}px)`,
                        }}
                      >
                        🎲
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            </div>
            <div className="rounded-2xl border border-indigo-300/35 bg-indigo-500/10 p-3">
              <p className="text-[11px] text-indigo-100/85 mb-2 font-semibold">내가 말한 단어</p>
              <div className="min-h-[30px] flex flex-wrap gap-2">
                {alphaWords.map((w, i) => (
                  <span
                    key={`${w}-${i}`}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/25 border border-indigo-300/40 text-xs uppercase tracking-wide text-indigo-50"
                  >
                    {i + 1}. {w}
                  </span>
                ))}
              </div>
            </div>
            {alphaDiceBurst ? (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 26 }).map((_, i) => (
                  <span
                    key={`alpha-screen-burst-${i}`}
                    className="absolute text-lg"
                    style={{
                      left: `${(i * 17 + 9) % 100}%`,
                      top: "-10px",
                      animation: `confetti-drop ${0.9 + (i % 5) * 0.2}s ease-out ${i * 0.03}s`,
                    }}
                  >
                    🎲
                  </span>
                ))}
              </div>
            ) : null}
            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                value={alphaInput}
                onChange={(e) => {
                  setAlphaInput(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitAlphaWord()}
                placeholder="음성 인식이 안 되면 텍스트를 입력하세요."
                disabled={!alphaLetter || alphaRolling || alphaExpired}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300/60 disabled:opacity-50"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitAlphaWord}
                disabled={!alphaLetter || alphaRolling || alphaExpired}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium disabled:opacity-50"
              >
                단어 제출
              </button>
            </div>
            <button
              type="button"
              onClick={beginAlphaRound}
              className="w-full py-2.5 rounded-xl border border-indigo-300/40 text-indigo-100 hover:bg-indigo-500/20 transition"
            >
              새 라운드
            </button>
          </section>
        )}

        {mode === "tongue" && (
          <section
            className={`relative overflow-hidden rounded-3xl border border-fuchsia-300/45 bg-gradient-to-b from-fuchsia-900/50 via-violet-950/75 to-slate-950 p-5 space-y-4 ${
              tongueShake ? "animate-[shake_0.5s_linear]" : ""
            }`}
          >
            <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-fuchsia-300/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-cyan-300/15 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-fuchsia-100">AI 텅 트위스터 챌린지</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>
            <div className="rounded-2xl border border-fuchsia-200/70 bg-gradient-to-r from-fuchsia-500/30 to-cyan-400/25 p-4 shadow-[0_0_30px_rgba(217,70,239,0.38)]">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  speakHint(tongueLine.text);
                }}
                className="text-left w-full text-base sm:text-lg font-bold text-fuchsia-50 leading-snug hover:text-white transition"
              >
                {tongueLine.text}
              </button>
              <p className="text-xs text-fuchsia-100/80 mt-2">시도 횟수: {tongueAttempts}</p>
            </div>
            {tongueCrownBurst ? (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={`tongue-crown-${i}`}
                    className="absolute text-2xl"
                    style={{
                      left: "50%",
                      top: "50%",
                      animation: `duel-stars 0.9s ease-out ${i * 0.02}s`,
                      transform: `translate(${Math.cos((i / 16) * Math.PI * 2) * 90}px, ${Math.sin((i / 16) * Math.PI * 2) * 90}px)`,
                    }}
                  >
                    👑
                  </span>
                ))}
              </div>
            ) : null}
            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                value={tongueInput}
                onChange={(e) => {
                  setTongueInput(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitTongueTry()}
                placeholder="음성 인식이 안 되면 텍스트를 입력하세요."
                disabled={tongueSuccess}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300/60 disabled:opacity-50"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitTongueTry}
                disabled={tongueSuccess}
                className="px-3.5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-sm font-medium disabled:opacity-50"
              >
                제출
              </button>
            </div>
            <button
              type="button"
              onClick={beginTongueRound}
              className="w-full py-2.5 rounded-xl border border-fuchsia-300/40 text-fuchsia-100 hover:bg-fuchsia-500/20 transition"
            >
              다음 문장
            </button>
          </section>
        )}

        {mode === "rhythm" && (
          <section className="relative overflow-hidden rounded-3xl border border-fuchsia-400/35 bg-gradient-to-b from-purple-900/50 via-slate-950/80 to-black p-5 min-h-[320px]">
            <div className="relative z-50 flex items-center justify-between pb-3">
              <h2 className="text-lg font-extrabold text-fuchsia-200">AI 리듬 따라잡기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>
            <div
              className={`space-y-4 transition-all duration-500 ease-out ${
                rhythmOverlayActive
                  ? "opacity-[0.28] brightness-[0.42] saturate-[0.75] pointer-events-none select-none"
                  : "opacity-100 brightness-100 saturate-100"
              }`}
            >
            {rhythmPhase === "cleared" ? (
              <div className="relative text-center py-6 min-h-[140px]">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    speakHint(rhythmLine.full, { fast: true, rhythmTier2: true });
                  }}
                  className="mx-auto block w-full max-w-xl rounded-2xl border border-cyan-200/75 bg-cyan-400/25 px-6 py-6 text-lg sm:text-xl font-black text-cyan-50 shadow-[0_0_30px_rgba(56,189,248,0.45)] hover:bg-cyan-300/35 transition"
                >
                  {rhythmLine.full}
                </button>
              </div>
            ) : (
              <div className="relative min-h-[110px]">
                <div
                  className={`grid grid-cols-3 gap-2 transition-all duration-[800ms] ease-out ${
                    rhythmPhase === "merging"
                      ? "opacity-0 blur-md scale-[0.96] pointer-events-none"
                      : "opacity-100 blur-0 scale-100"
                  }`}
                >
                  {([0, 1, 2] as const).map((idx) => {
                    const merging = rhythmPhase === "merging";
                    const chunkAudible =
                      rhythmDemoChunk === idx ||
                      (rhythmPhase === "play" && rhythmManualChunk === idx);
                    let anim: string | undefined;
                    if (!merging) {
                      if (chunkAudible && (rhythmPhase === "demo" || rhythmPhase === "play")) {
                        anim = "rhythm-chunk-tts-wave 0.85s ease-in-out infinite";
                      } else if (rhythmPhase === "demo" || rhythmPhase === "play") {
                        anim = "rhythm-chunk-idle 2.2s ease-in-out infinite";
                      }
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={rhythmPhase !== "play" || merging}
                        onClick={() => replayRhythmChunk(idx)}
                        className={`rounded-xl border px-2 py-4 text-center text-xs sm:text-sm font-semibold leading-snug min-h-[92px] ${
                          chunkAudible
                            ? rhythmTier === 1
                              ? "border-fuchsia-300/70 bg-fuchsia-500/30 text-white shadow-[0_0_20px_rgba(217,70,239,0.35)]"
                              : "border-sky-300/70 bg-sky-500/30 text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                            : rhythmTier === 1
                            ? "border-fuchsia-200/35 bg-fuchsia-900/20 text-fuchsia-50"
                            : "border-sky-200/35 bg-sky-900/20 text-sky-50"
                        } ${rhythmPhase === "play" && !merging ? "cursor-pointer hover:bg-white/10" : "cursor-default"}`}
                        style={{ animation: anim }}
                      >
                        {rhythmLine.chunks[idx]}
                      </button>
                    );
                  })}
                </div>
                <div
                  className={`absolute inset-0 z-10 flex items-center justify-center px-2 transition-all duration-[800ms] ease-out ${
                    rhythmPhase === "merging"
                      ? "opacity-100 delay-100"
                      : "opacity-0 pointer-events-none delay-0"
                  }`}
                  aria-hidden={rhythmPhase !== "merging"}
                >
                  <div className="w-full max-w-xl rounded-2xl border border-cyan-200/75 bg-cyan-400/25 px-6 py-6 text-lg sm:text-xl font-black text-cyan-50 text-center shadow-[0_0_30px_rgba(56,189,248,0.45)]">
                    {rhythmLine.full}
                  </div>
                </div>
              </div>
            )}

            {rhythmPhase !== "cleared" ? (
              <>
                {sttError ? (
                  <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                    {sttError}
                  </p>
                ) : null}

                <div className="flex items-center gap-2">
                  <input
                    value={rhythmInput}
                    onChange={(e) => {
                      setRhythmInput(e.target.value);
                      setLiveTranscript(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && submitRhythmTry()}
                    placeholder="음성 인식이 안 되면 텍스트를 입력하세요."
                    disabled={rhythmPhase !== "play"}
                    className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300/60 disabled:opacity-50"
                  />
                  <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
                  <button
                    type="button"
                    onClick={submitRhythmTry}
                    disabled={rhythmPhase !== "play"}
                    className="px-3.5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-sm font-medium disabled:opacity-50"
                  >
                    제출
                  </button>
                </div>
              </>
            ) : null}

            <button
              type="button"
              onClick={beginRhythmRound}
              className="w-full py-2.5 rounded-xl border border-fuchsia-300/40 text-fuchsia-100 hover:bg-fuchsia-500/20 transition"
            >
              다음 문장
            </button>
            </div>

            {rhythmClearFlash && rhythmPhase === "cleared" ? (
              <div className="absolute inset-0 z-[46] flex items-center justify-center rounded-3xl pointer-events-none">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-slate-950/95 via-violet-950/92 to-slate-950/98" />
                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.22),transparent_58%)]" />
                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_80%_80%,rgba(217,70,239,0.12),transparent_50%)]" />
                <div className="absolute inset-3 rounded-2xl border border-white/10 bg-black/25 shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]" />
                <span
                  key={rhythmClearFloatKey}
                  className="relative z-10 text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_22px_rgba(56,189,248,0.85)]"
                  style={{ animation: "rhythm-clear-overlay 0.72s ease-out forwards" }}
                >
                  CLEAR!
                </span>
              </div>
            ) : null}

            {rhythmOverlayActive ? (
              <div className="absolute inset-0 z-40 flex items-center justify-center rounded-3xl pointer-events-none">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-slate-950/95 via-violet-950/92 to-slate-950/98" />
                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.22),transparent_58%)]" />
                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_80%_80%,rgba(217,70,239,0.12),transparent_50%)]" />
                <div className="absolute inset-3 rounded-2xl border border-white/10 bg-black/25 shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]" />
                <span
                  key={`${rhythmPhase}-${rhythmCountdownLabel ?? "none"}-${rhythmTier}`}
                  className="relative z-10 text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_22px_rgba(56,189,248,0.85)]"
                  style={{ animation: "rhythm-clear-float 0.45s ease-out both" }}
                >
                  {rhythmPhase === "tier2_ment"
                    ? "Great!"
                    : rhythmCountdownLabel === "go"
                    ? "GO!"
                    : rhythmCountdownLabel ?? ""}
                </span>
              </div>
            ) : null}
          </section>
        )}

        {mode === "repair" && (
          <section className={`relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-b from-zinc-900/80 via-slate-900/80 to-zinc-950/85 p-5 space-y-4 ${repairShake ? "animate-[shake_0.5s_linear]" : ""}`}>
            <div
              className="absolute inset-x-0 top-0 h-8 border-y border-black/50"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, #facc15 0px, #facc15 16px, #111827 16px, #111827 32px)",
                animation: "beam-flow 3s linear infinite",
              }}
            />
            <div className="absolute inset-x-0 top-10 h-2 bg-amber-400/15" />
            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <span className="text-3xl animate-[saber-flicker_0.45s_ease-in-out_infinite]">🚨</span>
              <h2 className="text-xl font-extrabold tracking-wide text-amber-300 animate-pulse">
                SYSTEM ERROR!!
              </h2>
              <span className="text-3xl animate-[saber-flicker_0.45s_ease-in-out_infinite]">🚨</span>
            </div>

            <div className="pt-20 flex items-center justify-between">
              <h3 className="text-base font-semibold text-amber-100">고장난 AI 복구하기</h3>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>

            <div className="rounded-2xl border border-red-300/45 bg-red-500/15 p-4 shadow-[0_0_24px_rgba(248,113,113,0.35)]">
              <p className="text-lg font-semibold text-red-50 leading-relaxed">
                {repairHintParts.map((part, idx) => (
                  <span
                    key={`repair-hint-${idx}-${part.text}`}
                    className={part.isWrong ? "text-red-300" : "text-red-50"}
                  >
                    {part.text}
                    {idx < repairHintParts.length - 1 ? " " : ""}
                  </span>
                ))}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/35 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-100/80 mb-1">MISSION</p>
              <p className="text-sm text-emerald-50">문장을 올바르게 고쳐서 말해보세요.</p>
              <p className="text-xs text-emerald-100/70 mt-1">시도 횟수: {repairAttempts}</p>
            </div>

            {repairRecovered && (
              <div className="relative overflow-hidden rounded-2xl border border-emerald-300/60 bg-emerald-400/20 p-4 text-center">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 via-white/10 to-cyan-200/20 animate-pulse" />
                  {Array.from({ length: 18 }).map((_, i) => (
                    <span
                      key={`repair-fx-${i}`}
                      className="absolute text-xl"
                      style={{
                        left: `${(i * 17 + 9) % 100}%`,
                        top: `${6 + (i % 3) * 12}%`,
                        animation: `duel-stars ${0.9 + (i % 3) * 0.22}s ease-out ${i * 0.05}s`,
                      }}
                    >
                      {i % 2 === 0 ? "✨" : "🛠️"}
                    </span>
                  ))}
                </div>
                <p className="text-2xl font-black text-emerald-100">정상 복구</p>
                <p className="text-sm text-emerald-50 mt-1">{repairPuzzle.fixed}</p>
              </div>
            )}

            {sttError ? (
              <p className="text-xs text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={repairTranscript}
                onChange={(e) => {
                  setRepairTranscript(e.target.value);
                  setLiveTranscript(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitRepairTry()}
                placeholder="고친 문장을 영어로 말하거나 입력하세요."
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" variant="startStop" />
              <button
                type="button"
                onClick={submitRepairTry}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium"
              >
                복구 시도
              </button>
            </div>

            <button
              type="button"
              onClick={beginRepairRound}
              className="w-full py-2.5 rounded-xl border border-amber-300/40 text-amber-100 hover:bg-amber-500/20 transition"
            >
              새 문장
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
