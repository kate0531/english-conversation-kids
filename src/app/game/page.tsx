"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  playGoSignal,
  playLaserPulse,
  playTransition,
  playVictoryBlast,
  startDuelMachineBgm,
  startMemoryBgm,
  startWordChainBgm,
  stopDuelMachineBgm,
  stopMemoryBgm,
  stopWordChainBgm,
} from "@/lib/sounds";

type ScreenMode = "menu" | "bomb" | "duel" | "twenty" | "password" | "repair" | "wordchain" | "memory";
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

const WORD_CHAIN_MAX_TURN = 20;
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

const FLOATING_ITEMS = ["💣", "⚡", "🔥", "💥", "⭐", "🧨", "🕒", "🎯", "🎮", "✨"];

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
  const [twentyMessage, setTwentyMessage] = useState("단어 힌트를 보고 정답을 맞혀보세요.");
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

  const activeRoundRef = useRef<"bomb" | "duel" | null>(null);
  const memoryPlaybackTokenRef = useRef(0);

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
    setTwentyMessage("단어 힌트를 보고 정답을 맞혀보세요.");
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
      return;
    }

    setMemoryRevealed([true, true, true, true, true]);
    setMemoryPopped(4);
    setMemoryInput("");
    setLiveTranscript("");
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
  ]);

  const submitTwentyGuess = useCallback(() => {
    const raw = twentyGuess.trim();
    if (!raw || twentySolved) return;
    setTwentyRecentGuesses((prev) => [raw, ...prev].slice(0, 6));
    const guess = raw.toLowerCase().replace(/[^a-z]/g, "");
    const answer = twentyQuestion.answer.toLowerCase();
    const normalizedAnswer = answer.replace(/[^a-z]/g, "");
    const correct = guess === normalizedAnswer || guess.includes(normalizedAnswer);
    setTwentyAttempts((prev) => prev + 1);

    if (correct) {
      setTwentySolved(true);
      setTwentyMessage("정답! PASS!");
      playVictoryBlast();
      playTransition();
      return;
    }

    if (twentyHintMode === "keywords") {
      setTwentyHintMode("sentences");
      setTwentyMessage("아쉽! 문장 힌트로 업그레이드!");
    } else {
      setTwentyMessage("조금 더 생각해봐요! 다시 추측!");
    }
    playBuzzer();
  }, [twentyGuess, twentySolved, twentyQuestion.answer, twentyHintMode]);

  const submitPasswordTry = useCallback(() => {
    const spoken = tokenizeSentence(passwordTranscript);
    const answer = passwordPuzzle.answerWords.map((w) => normalizeWord(w));
    if (spoken.length === 0) return;
    const isExact =
      spoken.length === answer.length &&
      answer.every((word, idx) => spoken[idx] === word);

    if (isExact) {
      setPasswordUnlocked(true);
      playVictoryBlast();
      playTransition();
      return;
    }

    setPasswordUnlocked(false);
    setPasswordShake(true);
    playBuzzer();
    playDefeatBlast();
    window.setTimeout(() => setPasswordShake(false), 520);
  }, [passwordTranscript, passwordPuzzle.answerWords]);

  const submitRepairTry = useCallback(() => {
    const spoken = repairTranscript.trim();
    if (!spoken || repairRecovered) return;
    const correct = isSentenceMatch(spoken, repairPuzzle.fixed);
    setRepairAttempts((prev) => prev + 1);

    if (correct) {
      setRepairRecovered(true);
      setRepairMessage("정상 복구 완료!");
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
  }, [repairTranscript, repairRecovered, repairPuzzle.fixed]);

  const submitWordChainTurn = useCallback(() => {
    if (wordChainFinished) return;
    const sourceRaw = normalizeHeardText(wordChainInput) || normalizeHeardText(liveTranscript);
    const word = normalizeChainWord(sourceRaw);
    if (!word) {
      setWordChainMessage("단어가 비어 있어요. 음성 또는 텍스트로 단어를 입력해 주세요.");
      setWordChainGaugeTrend("down");
      playBuzzer();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 260);
      return;
    }

    const expectedFirst = getLastLetter(wordChainCurrent);
    if (!expectedFirst || word[0] !== expectedFirst) {
      setWordChainGauge((prev) => Math.max(0, prev - 7));
      setWordChainGaugeTrend("down");
      setWordChainMessage(`"${expectedFirst.toUpperCase()}"로 시작해야 해요. 다시 도전!`);
      playBuzzer();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 260);
      return;
    }

    const usedWords = new Set(wordChainHistory.map((entry) => normalizeChainWord(entry.word)));
    if (usedWords.has(word)) {
      setWordChainGauge((prev) => Math.max(0, prev - 6));
      setWordChainGaugeTrend("down");
      setWordChainMessage("이미 나온 단어예요. 새로운 단어로 이어가요!");
      playDefeatBlast();
      window.setTimeout(() => setWordChainGaugeTrend("none"), 260);
      return;
    }

    const aiFirst = getLastLetter(word);
    const aiCandidate =
      WORD_CHAIN_WORDS.find((candidate) => candidate.startsWith(aiFirst) && !usedWords.has(candidate) && candidate !== word) ??
      WORD_CHAIN_WORDS.find((candidate) => candidate.startsWith(aiFirst) && candidate !== word);

    const userEntry: WordChainEntry = { speaker: "me", word, turn: wordChainTurn };
    const updatedHistory = [...wordChainHistory, userEntry];
    setWordChainGauge((prev) => Math.min(100, prev + 9));
    setWordChainGaugeTrend("up");
    playLaserPulse();

    if (wordChainTurn >= WORD_CHAIN_MAX_TURN) {
      setWordChainHistory(updatedHistory);
      setWordChainFinished(true);
      setWordChainMessage("20턴 클리어! 끝말잇기 미션 성공!");
      setWordChainInput("");
      setLiveTranscript("");
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
      setWordChainInput("");
      setLiveTranscript("");
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
    setWordChainInput("");
    setLiveTranscript("");
    setWordChainMessage(`AI: ${aiCandidate.toUpperCase()} / 다음은 "${nextRequired}"로 시작!`);
    window.setTimeout(() => setWordChainGaugeTrend("none"), 300);
  }, [wordChainFinished, wordChainInput, liveTranscript, wordChainCurrent, wordChainHistory, wordChainTurn]);

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
    if (success) playTransition();
    else playBuzzer();
  }, [bombPhase, isListening, isProcessing, liveTranscript, bombInputText, bombMission.targetSentences]);

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
  }, [duelPhase, isListening, isProcessing, liveTranscript, duelInputText]);

  useEffect(() => {
    if (mode !== "bomb") return;
    if (!isListening && !isProcessing) return;
    setBombInputText(liveTranscript);
  }, [mode, isListening, isProcessing, liveTranscript]);

  useEffect(() => {
    if (mode !== "duel") return;
    if (!isListening && !isProcessing) return;
    setDuelInputText(liveTranscript);
  }, [mode, isListening, isProcessing, liveTranscript]);

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

  useEffect(() => {
    if (mode !== "wordchain") return;
    if (!isListening && !isProcessing) return;
    setWordChainInput(liveTranscript);
  }, [liveTranscript, mode, isListening, isProcessing]);

  useEffect(() => {
    if (mode !== "memory") return;
    if (!isListening && !isProcessing) return;
    setMemoryInput(liveTranscript);
  }, [liveTranscript, mode, isListening, isProcessing]);

  useEffect(() => {
    if (mode === "memory") return;
    stopMemoryPlayback();
  }, [mode, stopMemoryPlayback]);

  useEffect(() => {
    if (mode === "memory") {
      stopDuelMachineBgm();
      stopWordChainBgm();
      startMemoryBgm();
      return () => {
        stopMemoryBgm();
      };
    }
    if (mode === "wordchain" || mode === "duel" || mode === "twenty") {
      stopMemoryBgm();
      stopDuelMachineBgm();
      startWordChainBgm();
      return () => {
        stopWordChainBgm();
      };
    }
    if (mode === "bomb" || mode === "password" || mode === "repair") {
      stopMemoryBgm();
      stopWordChainBgm();
      startDuelMachineBgm();
    } else {
      stopDuelMachineBgm();
      stopWordChainBgm();
      stopMemoryBgm();
    }
    return () => {
      stopDuelMachineBgm();
      stopWordChainBgm();
      stopMemoryBgm();
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      activeRoundRef.current = null;
      stop();
      stopMemoryPlayback();
      stopDuelMachineBgm();
      stopWordChainBgm();
      stopMemoryBgm();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white relative overflow-hidden">
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

      <header className="relative z-10 border-b border-white/10 backdrop-blur bg-black/25">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <HomeButton
            onClick={() => {
              playClick();
              router.push("/");
            }}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
          />
          <div>
            <h1 className="text-lg font-semibold tracking-wide">Game Arena</h1>
            <p className="text-xs text-white/70">말하기만 하면 점수 인정! 텐션 있게 GO!</p>
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
              className="rounded-2xl border border-rose-300/40 bg-rose-500/20 hover:bg-rose-500/30 p-5 text-left transition"
            >
              <p className="text-sm text-rose-200">Speed Game</p>
              <h2 className="text-xl font-bold mt-1">폭탄 돌리기</h2>
              <p className="text-sm text-white/80 mt-2">10초 GO! 사운드 + 째깍째깍 + 폭발 텐션</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("duel");
                setDuelPhase("idle");
              }}
              className="rounded-2xl border border-cyan-300/40 bg-cyan-500/20 hover:bg-cyan-500/30 p-5 text-left transition"
            >
              <p className="text-sm text-cyan-200">Battle Mode</p>
              <h2 className="text-xl font-bold mt-1">AI vs. Me</h2>
              <p className="text-sm text-white/80 mt-2">줄다리기/광선검 느낌 대결 게이지</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("twenty");
                beginTwentyRound();
              }}
              className="rounded-2xl border border-emerald-300/40 bg-emerald-500/20 hover:bg-emerald-500/30 p-5 text-left transition"
            >
              <p className="text-sm text-emerald-200">Guessing Game</p>
              <h2 className="text-xl font-bold mt-1">AI랑 스무고개</h2>
              <p className="text-sm text-white/80 mt-2">단어 힌트 → 문장 힌트 정답 맞히기</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("password");
                beginPasswordRound();
              }}
              className="rounded-2xl border border-violet-300/40 bg-violet-500/20 hover:bg-violet-500/30 p-5 text-left transition"
            >
              <p className="text-sm text-violet-200">Speaking Puzzle</p>
              <h2 className="text-xl font-bold mt-1">AI랑 자물쇠 풀기</h2>
              <p className="text-sm text-white/80 mt-2">스크램블 순서 발화로 자물쇠 해제</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("repair");
                beginRepairRound();
              }}
              className="rounded-2xl border border-amber-300/40 bg-amber-500/20 hover:bg-amber-500/30 p-5 text-left transition"
            >
              <p className="text-sm text-amber-200">Grammar Repair</p>
              <h2 className="text-xl font-bold mt-1">고장난 AI 복구하기</h2>
              <p className="text-sm text-white/80 mt-2">틀린 문장을 고쳐서 시스템 복구</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("wordchain");
                beginWordChainRound();
              }}
              className="rounded-2xl border border-fuchsia-300/40 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 p-5 text-left transition"
            >
              <p className="text-sm text-fuchsia-200">Arcade Relay</p>
              <h2 className="text-xl font-bold mt-1">AI랑 끝말잇기</h2>
              <p className="text-sm text-white/80 mt-2">20턴 단어 릴레이 + 상승/하락 게이지</p>
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setMode("memory");
                beginMemoryRound();
              }}
              className="rounded-2xl border border-sky-300/40 bg-sky-500/20 hover:bg-sky-500/30 p-5 text-left transition"
            >
              <p className="text-sm text-sky-200">Smart Memory</p>
              <h2 className="text-xl font-bold mt-1">AI랑 기억력 대결</h2>
              <p className="text-sm text-white/80 mt-2">5개 단어 순서대로 외워서 말하기</p>
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
                className="text-sm text-white/70 hover:text-white"
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
          <section className="relative overflow-hidden rounded-2xl border border-cyan-300/30 bg-black/35 p-5 space-y-4">
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
              <h2 className="text-lg font-semibold text-cyan-200">AI vs. Me</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                  setDuelPhase("idle");
                  activeRoundRef.current = null;
                  stop();
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>

            <div className="rounded-xl border border-cyan-200/30 bg-cyan-500/10 p-4">
              <p className="text-xs text-cyan-100/80 mb-1">대결</p>
              <p className="font-medium">{duelMission.taunt}</p>
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
                  <p className="text-sm text-white/80">
                    {duelMission.targetSentences}문장 이상 도전! 남은 시간: {duelTimeLeft}s
                  </p>
                )}
              </div>
            )}

            {duelPhase === "judging" && (
              <div className="rounded-xl bg-white/10 p-4 text-center">
                <p className="text-lg font-semibold animate-pulse">대결 결과 계산 중...</p>
              </div>
            )}

            <div className="rounded-xl border border-cyan-200/20 p-4 space-y-2">
              <div className="flex justify-between text-sm text-white/80">
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
                <p className="text-[11px] text-cyan-100/75">
                  말하기를 시작하면 광선검이 내 쪽으로 밀려요!
                </p>
              )}
              <div className="flex justify-between text-sm">
                <span>AI 문장: {duelAiSentences}</span>
                <span>내 문장: {duelUserSentences}</span>
              </div>
            </div>

            {duelPhase === "result" && (
              <div className="rounded-xl bg-white/10 p-4 space-y-2">
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
                <p className="text-sm text-white/85">{duelMessage}</p>
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
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
            </div>
          </section>
        )}

        {mode === "twenty" && (
          <section className="relative overflow-hidden rounded-3xl border border-emerald-300/40 bg-gradient-to-b from-emerald-900/55 via-slate-900/60 to-emerald-950/60 p-5 space-y-4">
            <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-emerald-300/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-cyan-300/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-emerald-200">AI랑 스무고개</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  stopMemoryPlayback();
                  setMode("menu");
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>

            <div
              className={`rounded-2xl border p-4 transition-colors duration-300 ${
                twentyHintMode === "keywords"
                  ? "border-teal-300/70 bg-teal-100/35 backdrop-blur-[1px]"
                  : "border-indigo-300/75 bg-slate-900/72 backdrop-blur-[1px]"
              }`}
              style={{ animation: "quiz-glow 2.4s ease-in-out infinite" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold ${twentyHintMode === "keywords" ? "text-emerald-700" : "text-indigo-100"}`}>
                  HINT MODE
                </p>
                <p className={`text-xs ${twentyHintMode === "keywords" ? "text-emerald-700/80" : "text-indigo-100/80"}`}>
                  시도 {twentyAttempts}회
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {twentyHintMode === "keywords" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-teal-500/70 bg-teal-100/75 text-teal-900">
                    <span style={{ animation: "quiz-float 2.6s ease-in-out infinite" }}>💡</span>
                    단어 힌트
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-indigo-300/80 bg-indigo-900/70 text-indigo-50">
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
                <ul className="mt-2 text-sm text-white/90 space-y-1.5">
                  {twentyQuestion.sentenceHints.map((hint, idx) => (
                    <button
                      type="button"
                      key={`${twentyQuestion.id}-hint-${idx}`}
                      onClick={() => {
                        playClick();
                        speakHint(hint);
                      }}
                      className="w-full text-left rounded-lg bg-indigo-950/85 border border-indigo-300/45 px-2.5 py-1.5 text-indigo-50 hover:bg-indigo-900 transition"
                    >
                      {hint}
                    </button>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-3">
              <p className="text-sm text-white/90">{twentyMessage}</p>
              {twentyRecentGuesses.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {twentyRecentGuesses.map((g, idx) => (
                    <span
                      key={`${g}-${idx}`}
                      className="px-2 py-0.5 rounded-full text-[11px] bg-slate-700/60 border border-slate-500/40 text-white/85"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

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
                <p className="text-xl font-bold text-emerald-100">PASS!</p>
                <p className="text-sm text-emerald-50 mt-1">정답: {twentyQuestion.answer}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                value={twentyGuess}
                onChange={(e) => setTwentyGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitTwentyGuess()}
                placeholder="정답을 영어 단어로 입력하세요."
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
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
              className="w-full py-2.5 rounded-xl border border-emerald-300/30 text-emerald-100 hover:bg-emerald-500/20 transition"
            >
              새 문제
            </button>
          </section>
        )}

        {mode === "password" && (
          <section
            className={`relative overflow-hidden rounded-3xl border border-violet-200/60 bg-gradient-to-b from-violet-700/40 via-indigo-700/35 to-cyan-700/30 p-5 space-y-4 ${
              passwordShake ? "animate-[shake_0.5s_linear]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-violet-100">AI랑 자물쇠 풀기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                  stop();
                }}
                className="text-sm text-white/70 hover:text-white"
              >
                코너 선택으로
              </button>
            </div>

            <div className="relative rounded-2xl border border-violet-200/55 bg-white/15 backdrop-blur-sm p-4">
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
                <div className="text-sm text-violet-50">
                  <p className="font-semibold">Digital Lock</p>
                  <p className="text-xs mt-1">정답 순서로 말하면 잠금 해제!</p>
                  <p className="text-xs mt-1">진행: {passwordMatchedCount}/{passwordPuzzle.answerWords.length}</p>
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
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
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
              className="w-full py-2.5 rounded-xl border border-violet-300/30 text-violet-100 hover:bg-violet-500/20 transition"
            >
              새 비밀번호
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
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
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
          <section className="relative overflow-hidden rounded-3xl border border-fuchsia-300/40 bg-gradient-to-b from-fuchsia-900/55 via-indigo-950/60 to-slate-950/70 p-5 space-y-4">
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
              <h2 className="text-lg font-extrabold text-fuchsia-100">AI랑 끝말잇기</h2>
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
                  <div className="absolute -right-10 top-1 text-[10px] text-fuchsia-100/80">MAX</div>
                  <div className="absolute -right-10 bottom-1 text-[10px] text-fuchsia-100/80">MIN</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-fuchsia-200/40 bg-fuchsia-500/15 p-4">
                  <div className="flex items-center justify-between text-xs text-fuchsia-100/80">
                    <span>TURN {wordChainTurn}/{WORD_CHAIN_MAX_TURN}</span>
                    <span>게이지 {wordChainGauge}%</span>
                  </div>
                  <p className="mt-2 text-sm text-white/90">{wordChainMessage}</p>
                </div>

                <div className="rounded-2xl border border-cyan-200/35 bg-cyan-500/10 p-4">
                  <p className="text-xs text-cyan-100/80">현재 기준 단어</p>
                  <p className="text-2xl font-black text-cyan-100 tracking-wide">{wordChainCurrent.toUpperCase()}</p>
                  <p className="text-sm text-cyan-50/90 mt-1">다음 단어 시작 글자: <span className="font-bold text-emerald-300">{wordChainRequired}</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="flex flex-wrap gap-2">
                {wordChainHistory.slice(-10).map((entry, idx) => (
                  <span
                    key={`chain-${entry.turn}-${idx}-${entry.word}`}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      entry.speaker === "me"
                        ? "bg-emerald-400/20 border-emerald-200/50 text-emerald-100"
                        : "bg-fuchsia-400/20 border-fuchsia-200/50 text-fuchsia-100"
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
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
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
              <p className="text-lg font-semibold text-red-50">{repairPuzzle.broken}</p>
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
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
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
