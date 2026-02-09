"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FreeTalkingScenario } from "@/types/freeTalking";
import type { CorrectionPoint } from "@/types/freeTalking";
import { MOCK_CORRECTIONS, MOCK_SUMMARY } from "@/data/freeTalkingCorrections";
import { useTTS } from "@/hooks/useTTS";
import { playClick } from "@/lib/sounds";

interface FreeTalkingResultScreenProps {
  scenario: FreeTalkingScenario;
  userAnswers: string[];
  onNext: () => void;
  onBack: () => void;
}

export default function FreeTalkingResultScreen({
  scenario,
  userAnswers,
  onNext,
  onBack,
}: FreeTalkingResultScreenProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const corrections: CorrectionPoint[] = MOCK_CORRECTIONS;
  const { speak } = useTTS({ gender: "female" });

  const playGuide = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.38;
    audio.currentTime = 0;
    const play = () => {
      audio.play().catch(() => setShowContent(true));
    };
    if (audio.readyState >= 2) {
      play();
    } else {
      audio.addEventListener("canplay", play, { once: true });
    }
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      const audio = audioRef.current;
      if (!audio) {
        setShowContent(true);
        return;
      }
      const onEnded = () => setTimeout(() => setShowContent(true), 300);
      const onError = () => setShowContent(true);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);
      cleanup = () => {
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
      };
      playGuide();
    }, 100);
    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [playGuide]);

  const handlePlayCorrection = (index: number) => {
    playClick();
    setPlayingIndex(index);
    speak(corrections[index].enCorrected);
    setTimeout(() => setPlayingIndex(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 via-pink-50/80 to-amber-50/70 overflow-y-auto">
      <audio ref={audioRef} src="/sample1.mp3" preload="auto" className="hidden" />
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-pink-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBack();
            }}
            className="w-10 h-10 rounded-xl border-2 border-pink-200 bg-white text-gray-600 hover:bg-pink-50 flex items-center justify-center text-lg"
          >
            ←
          </button>
          <h1 className="text-base font-semibold text-pink-600">결과</h1>
          <button
            type="button"
            onClick={() => {
              playClick();
              playGuide();
            }}
            className="text-sm font-medium text-pink-600 hover:text-pink-700 underline"
          >
            가이드 듣기
          </button>
        </div>
      </header>

      <main
        className={`flex-1 px-4 py-6 max-w-xl mx-auto w-full space-y-6 transition-opacity duration-500 ${
          showContent ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* 교정 포인트 5줄 */}
        <section className="rounded-xl border-2 border-pink-200 bg-white p-4 shadow-md">
          <h2 className="text-sm font-bold text-pink-600 mb-3">교정 포인트</h2>
          <div className="space-y-3">
            {corrections.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-pink-100 bg-pink-50/50 p-3 flex flex-col gap-2"
              >
                <p className="text-gray-700 text-sm">{c.koExplanation}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-green-700 font-medium text-sm">{c.enCorrected}</p>
                  <button
                    type="button"
                    onClick={() => handlePlayCorrection(i)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-200 text-pink-600 hover:bg-pink-300 flex items-center justify-center text-sm"
                  >
                    {playingIndex === i ? "▶" : "🔊"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 전체 대화 맥락 요약 */}
        <section className="rounded-xl border-2 border-pink-200 bg-white p-4 shadow-md">
          <h2 className="text-sm font-bold text-pink-600 mb-2">대화 요약</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{MOCK_SUMMARY}</p>
        </section>

        <button
          type="button"
          onClick={() => {
            playClick();
            onNext();
          }}
          className="w-full rounded-xl py-3 font-medium text-white bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 shadow-md transition mt-2"
        >
          다음
        </button>
      </main>
    </div>
  );
}
