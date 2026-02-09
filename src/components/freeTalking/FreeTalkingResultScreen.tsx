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
  onCorrectionsLoaded?: (correctedSentences: string[]) => void;
}

export default function FreeTalkingResultScreen({
  scenario,
  userAnswers,
  onNext,
  onBack,
  onCorrectionsLoaded,
}: FreeTalkingResultScreenProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [corrections, setCorrections] = useState<CorrectionPoint[]>(MOCK_CORRECTIONS);
  const [summary, setSummary] = useState<string>(MOCK_SUMMARY);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { speak } = useTTS({ gender: "female" });

  useEffect(() => {
    if (!userAnswers.length) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/free-talking/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, userAnswers }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data: { corrections?: CorrectionPoint[]; summary?: string }) => {
        if (cancelled) return;
        const nextCorrections = Array.isArray(data.corrections) && data.corrections.length > 0
          ? data.corrections
          : MOCK_CORRECTIONS;
        setCorrections(nextCorrections);
        onCorrectionsLoaded?.(nextCorrections.map((c) => c.enCorrected));
        if (typeof data.summary === "string" && data.summary.trim()) {
          setSummary(data.summary.trim());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCorrections(MOCK_CORRECTIONS);
          setSummary(MOCK_SUMMARY);
          onCorrectionsLoaded?.(MOCK_CORRECTIONS.map((c) => c.enCorrected));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scenario, userAnswers]);

  useEffect(() => {
    onCorrectionsLoaded?.(corrections.map((c) => c.enCorrected));
  }, [corrections, onCorrectionsLoaded]);

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
        {/* 교정 포인트 */}
        <section className="rounded-xl border-2 border-pink-200 bg-white p-4 shadow-md">
          <h2 className="text-sm font-bold text-pink-600 mb-3">교정 포인트</h2>
          {loading && (
            <p className="text-gray-500 text-sm mb-3">교정 내용을 불러오는 중이에요...</p>
          )}
          <div className="space-y-3">
            {corrections.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-pink-100 bg-pink-50/50 p-3 flex flex-col gap-2"
              >
                <p className="text-gray-700 text-sm leading-relaxed break-words">
                  {c.koExplanation}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-green-700 font-medium text-sm break-words flex-1 min-w-0">
                    {c.enCorrected}
                  </p>
                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => handlePlayCorrection(i)}
                      className="w-9 h-9 rounded-full bg-pink-200 text-pink-600 hover:bg-pink-300 flex items-center justify-center text-sm"
                    >
                      {playingIndex === i ? "▶" : "🔊"}
                    </button>
                    <span className="text-xs text-pink-600/80">
                      들어보고 따라 말해보기
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 문법·발화 코멘트 */}
        <section className="rounded-xl border-2 border-pink-200 bg-white p-4 shadow-md">
          <h2 className="text-sm font-bold text-pink-600 mb-2">문법·발화 코멘트</h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{summary}</p>
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
