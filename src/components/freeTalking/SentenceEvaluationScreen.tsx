"use client";

import { useState, useEffect } from "react";
import { playPopup } from "@/lib/sounds";

interface SentenceEvaluationScreenProps {
  sentences: string[];
  onComplete: (score: number) => void;
  onBack: () => void;
}

const SCORE_OPTIONS = [30, 50, 70, 85, 95];
const SCALE_MOVE_MS = 380;

/** Speech Check: 말한 문장 3개 + 스케일 점수 (왔다갔다 후 30에서 멈춰 깜빡임) */
export default function SentenceEvaluationScreen({
  sentences,
  onComplete,
  onBack,
}: SentenceEvaluationScreenProps) {
  const [scaleIndex, setScaleIndex] = useState(0);
  const [restingAt30, setRestingAt30] = useState(false);
  const [autoScoring, setAutoScoring] = useState(true);
  const [autoError, setAutoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // 자동 점수 계산: Whisper 결과 문장들을 GPT가 0-100으로 평가
    const run = async () => {
      setAutoScoring(true);
      setAutoError(null);
      try {
        const res = await fetch("/api/free-talking/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sentences }),
        });
        if (!res.ok) throw new Error(`score failed: ${res.status}`);
        const data = (await res.json()) as { score?: number };
        const score = typeof data.score === "number" ? Math.round(data.score) : 0;
        if (cancelled) return;
        onComplete(score);
      } catch {
        if (cancelled) return;
        setAutoError("자동 점수화를 실패했어요. 화면 아래에서 직접 눌러서 점수를 선택할 수 있어요.");
        setAutoScoring(false);
      }
    };

    void run();

    const sequence = [0, 1, 2, 3, 4, 3, 2, 1, 0];
    let step = 0;
    const id = setInterval(() => {
      if (step >= sequence.length) {
        clearInterval(id);
        setRestingAt30(true);
        return;
      }
      setScaleIndex(sequence[step]);
      step += 1;
    }, SCALE_MOVE_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleSubmit = (s: number) => {
    playPopup();
    onComplete(s);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 via-pink-50/80 to-rose-50/60">
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onBack} className="w-10 h-10 rounded-xl border-2 border-pink-200 bg-white text-gray-600 hover:bg-pink-50 flex items-center justify-center">
            ←
          </button>
          <h1 className="text-base font-semibold text-pink-700">Speech Check</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-5 px-4 py-6 max-w-sm mx-auto w-full">
        {/* 블록 1: 오늘의 문장 */}
        <section className="rounded-xl border-2 border-pink-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-pink-50/80 border-b border-pink-200/80">
            <h2 className="text-sm font-semibold text-pink-800">오늘의 문장</h2>
          </div>
          <ul className="px-4 py-4 text-gray-700 text-sm space-y-2 list-decimal list-inside">
            {sentences.map((s, i) => (
              <li key={i} className="leading-relaxed">{s}</li>
            ))}
          </ul>
        </section>

        {/* 블록 2: 오늘의 점수 */}
        <section className="rounded-xl border-2 border-pink-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-pink-50/80 border-b border-pink-200/80">
            <h2 className="text-sm font-semibold text-pink-800">오늘의 점수</h2>
          </div>
          {autoScoring ? (
            <div className="px-4 py-6 text-center text-sm text-gray-600">
              점수 계산 중...
            </div>
          ) : null}
          {autoError ? (
            <div className="px-4 pb-2 text-center text-xs text-amber-700">
              {autoError}
            </div>
          ) : null}
          <div className="relative w-full py-4 px-4 min-h-[3.5rem] flex flex-col justify-center">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-pink-200 rounded -translate-y-1/2 pointer-events-none" />
            <div className="relative flex justify-between items-center">
              {SCORE_OPTIONS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSubmit(s)}
                  disabled={autoScoring}
                  className={`relative z-10 w-10 h-10 rounded-full border-2 font-semibold text-sm transition ${
                    scaleIndex === i && restingAt30 && s === 30
                      ? "border-pink-400 bg-pink-200 text-pink-800 animate-pulse ring-4 ring-pink-300/70"
                      : scaleIndex === i
                        ? "border-pink-400 bg-pink-100 text-pink-800 ring-2 ring-pink-300/50"
                        : "border-pink-200 bg-white text-pink-700 hover:bg-pink-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
