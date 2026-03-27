"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HomeButton from "@/components/HomeButton";
import VoiceInputButton from "@/components/VoiceInputButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
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
  stopDuelMachineBgm,
} from "@/lib/sounds";

type ScreenMode = "menu" | "bomb" | "duel";
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
];

const FLOATING_ITEMS = ["💣", "⚡", "🔥", "💥", "⭐", "🧨", "🕒", "🎯", "🎮", "✨"];

type BombMood = "idle" | "active" | "success" | "fail";

function BombBuddy({ mood }: { mood: BombMood }) {
  const active = mood === "active";
  const success = mood === "success";
  const fail = mood === "fail";
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative w-10 h-9 mb-1">
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-1.5 h-3.5 rounded-full bg-amber-700 origin-bottom"
          style={active ? { animation: "bomb-shake 0.5s infinite" } : undefined}
        />
        <span
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm"
          style={active ? { animation: "sparkle 0.9s ease-out infinite" } : undefined}
        >
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${success ? "bg-lime-300" : fail ? "bg-amber-300" : "bg-white/80"}`} />
        </span>
      </div>
      <div
        className="relative w-28 h-28 rounded-full border-4 border-slate-800 bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 shadow-[inset_0_12px_20px_rgba(255,255,255,0.22),0_12px_20px_rgba(0,0,0,0.22)]"
        style={active ? { animation: "bomb-shake 0.45s infinite" } : undefined}
      >
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

export default function GamePage() {
  const router = useRouter();

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

  const activeRoundRef = useRef<"bomb" | "duel" | null>(null);

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
  }, [resetSharedTranscript]);

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
    const sentenceCount = countSentences(liveTranscript);
    const wordCount = countWords(liveTranscript);
    setBombDetectedSentences(sentenceCount);
    setBombDetectedWords(wordCount);
  }, [liveTranscript]);

  useEffect(() => {
    if (activeRoundRef.current !== "duel") return;
    const sentenceCount = countSentences(liveTranscript);
    setDuelUserSentences(sentenceCount);
  }, [liveTranscript]);

  useEffect(() => {
    if (bombPhase !== "judging" || isListening || isProcessing) return;
    const sentenceCount = countSentences(liveTranscript);
    const wordCount = countWords(liveTranscript);
    const heardClearly = wordCount >= 4;
    const success = heardClearly;
    setBombDetectedSentences(sentenceCount);
    setBombDetectedWords(wordCount);
    setBombSuccess(success);
    setBombMessage(success ? "" : "이번에는 소리가 잘 안 잡혔어요. 더 크게, 또렷하게 한 번 더!");
    setBombPhase("result");
    if (success) playTransition();
    else playBuzzer();
  }, [bombPhase, isListening, isProcessing, liveTranscript, bombMission.targetSentences]);

  useEffect(() => {
    if (duelPhase !== "judging" || isListening || isProcessing) return;
    const userWords = countWords(liveTranscript);
    const userSentences = countSentences(liveTranscript);
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
  }, [duelPhase, isListening, isProcessing, liveTranscript]);

  useEffect(() => {
    if (duelImpact === "none") return;
    const timer = window.setTimeout(() => setDuelImpact("none"), 1300);
    return () => window.clearTimeout(timer);
  }, [duelImpact]);

  useEffect(() => {
    if (mode === "duel" || mode === "bomb") {
      startDuelMachineBgm();
    } else {
      stopDuelMachineBgm();
    }
    return () => {
      stopDuelMachineBgm();
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      activeRoundRef.current = null;
      stop();
      stopDuelMachineBgm();
    };
  }, [stop]);

  const bombProgress = useMemo(
    () => Math.max(0, Math.min(100, (bombTimeLeft / Math.max(1, bombMission.seconds)) * 100)),
    [bombTimeLeft, bombMission.seconds]
  );

  const duelResultLabel =
    duelWinner === "user" ? "ME" : duelWinner === "ai" ? "AI" : "DRAW";

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
          <section className="grid gap-4 md:grid-cols-2">
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
          </section>
        )}

        {mode === "bomb" && (
          <section className="rounded-3xl border-2 border-pink-200/80 bg-gradient-to-b from-pink-50/95 via-rose-50/95 to-amber-50/95 p-5 space-y-4 text-gray-800 shadow-[0_10px_30px_rgba(255,182,193,0.28)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-rose-500">폭탄 돌리기</h2>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setMode("menu");
                  setBombPhase("idle");
                  activeRoundRef.current = null;
                  stop();
                }}
                className="text-sm text-rose-500/80 hover:text-rose-600"
              >
                코너 선택으로
              </button>
            </div>

            <div className="rounded-2xl border border-pink-200 bg-white/80 p-4">
              <p className="text-xs text-rose-500/80 mb-1 font-semibold">MISSION</p>
              <p className="font-semibold text-rose-700">{bombMission.prompt}</p>
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
                <div className="text-7xl font-black tracking-tight text-rose-500">
                  {bombPhase === "countdown" ? bombCountdown : "GO!"}
                </div>
                <div className="flex items-center justify-center">
                  <BombBuddy mood={bombPhase === "live" ? "active" : "idle"} />
                </div>
                {bombPhase === "live" && (
                  <>
                    <div className="w-full h-3 rounded-full bg-rose-100 overflow-hidden border border-rose-200">
                      <div
                        className="h-full bg-gradient-to-r from-lime-300 via-amber-300 to-rose-400 transition-all duration-700"
                        style={{ width: `${bombProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-rose-600 font-semibold">남은 시간: {bombTimeLeft}s</p>
                    <p className="text-sm text-rose-700">
                      감지된 문장 {bombDetectedSentences}개 / 단어 {bombDetectedWords}개
                    </p>
                  </>
                )}
              </div>
            )}

            {bombPhase === "judging" && (
              <div className="rounded-2xl bg-white/85 border border-pink-200 p-4 text-center">
                <p className="text-lg font-semibold animate-pulse text-rose-600">AI가 발화를 듣는 중...</p>
              </div>
            )}

            {bombPhase === "result" && (
              <div className="relative overflow-hidden rounded-2xl bg-white/90 border border-pink-200 p-4 space-y-2">
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
                {!bombSuccess ? <p className="text-sm text-gray-700">{bombMessage}</p> : null}
                {!bombSuccess ? (
                  <p className="text-sm text-gray-600">인식 결과: {bombDetectedSentences}문장 · {bombDetectedWords}단어</p>
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
              <p className="text-xs text-amber-900 bg-amber-100 border border-amber-300 rounded-xl px-3 py-2">
                {sttError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                value={liveTranscript}
                onChange={(e) => setLiveTranscript(e.target.value)}
                placeholder="음성이 잘 안 되면 여기에 영어로 직접 입력해도 됩니다."
                className="flex-1 rounded-xl bg-white border border-pink-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300/60"
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
              <p className="text-xs text-cyan-100/80 mb-1">TAUNT</p>
              <p className="font-medium">{duelMission.taunt}</p>
            </div>

            {duelPhase === "idle" && (
              <button
                type="button"
                onClick={beginDuelRound}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 font-semibold"
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
              <div className="h-5 rounded-full bg-white/15 overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${duelBeam}%`,
                    background:
                      "linear-gradient(90deg, rgba(34,211,238,0.95), rgba(129,140,248,0.95), rgba(56,189,248,0.95))",
                    backgroundSize: "200% 200%",
                    animation: "beam-flow 1.2s linear infinite",
                  }}
                />
              </div>
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
                value={liveTranscript}
                onChange={(e) => setLiveTranscript(e.target.value)}
                placeholder="음성이 잘 안 되면 여기에 영어로 입력해도 됩니다."
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300/60"
              />
              <VoiceInputButton isListening={isListening} onToggle={toggle} supported={supported} theme="sky" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
