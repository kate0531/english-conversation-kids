"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FreeTalkingScenario } from "@/types/freeTalking";
import type { CorrectionPoint } from "@/types/freeTalking";
import { useTTS } from "@/hooks/useTTS";
import { playClick } from "@/lib/sounds";

interface FreeTalkingResultScreenProps {
  scenario: FreeTalkingScenario;
  userAnswers: string[];
  onNext: () => void;
  onBack: () => void;
  onCorrectionsLoaded?: (correctedSentences: string[]) => void;
}

const API_FAIL =
  "교정 API를 불러오지 못했어요. Vercel에 OPENAI_API_KEY가 설정되어 있는지, 재배포했는지 확인해 주세요. (목업·임시 문장은 보여 주지 않습니다)";

export default function FreeTalkingResultScreen({
  scenario,
  userAnswers,
  onNext,
  onBack,
  onCorrectionsLoaded,
}: FreeTalkingResultScreenProps) {
  const onLoadedRef = useRef(onCorrectionsLoaded);
  onLoadedRef.current = onCorrectionsLoaded;

  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [corrections, setCorrections] = useState<CorrectionPoint[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { speak } = useTTS({ gender: "female" });

  useEffect(() => {
    if (!userAnswers.length) {
      setLoading(false);
      setApiError(null);
      setCorrections([]);
      setSummary("");
      return;
    }
    let cancelled = false;
    setApiError(null);
    setLoading(true);
    fetch("/api/free-talking/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, userAnswers }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setApiError(API_FAIL);
          setCorrections([]);
          setSummary("");
          return;
        }
        const data = (await res.json()) as { corrections?: CorrectionPoint[]; summary?: string };
        const list = Array.isArray(data.corrections) ? data.corrections : [];
        if (list.length === 0) {
          setApiError(API_FAIL);
          setCorrections([]);
          setSummary("");
          return;
        }
        setCorrections(list);
        onLoadedRef.current?.(list.map((c) => c.enCorrected));
        if (typeof data.summary === "string" && data.summary.trim()) {
          setSummary(data.summary.trim());
        } else {
          setSummary("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiError(API_FAIL);
          setCorrections([]);
          setSummary("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scenario, userAnswers]);

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
    speak(corrections[index]?.enCorrected ?? "");
    setTimeout(() => setPlayingIndex(null), 2000);
  };

  const canProceed = !loading && !apiError && corrections.length > 0;

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
        {apiError && (
          <section className="rounded-xl border-2 border-red-200 bg-red-50 p-4 shadow-md">
            <h2 className="text-sm font-bold text-red-700 mb-2">교정을 불러오지 못했어요</h2>
            <p className="text-red-800 text-sm leading-relaxed">{apiError}</p>
          </section>
        )}

        <section className="rounded-xl border-2 border-pink-200 bg-white p-4 shadow-md">
          <h2 className="text-sm font-bold text-pink-600 mb-3">교정 포인트</h2>
          {loading && <p className="text-gray-500 text-sm mb-3">교정 내용을 불러오는 중이에요...</p>}
          {!loading && !apiError && corrections.length === 0 && userAnswers.length > 0 && (
            <p className="text-gray-500 text-sm">표시할 교정이 없어요.</p>
          )}
          <div className="space-y-3">
            {corrections.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-pink-100 bg-pink-50/50 p-3 flex flex-col gap-2"
              >
                <p className="text-gray-700 text-sm leading-relaxed break-words">{c.koExplanation}</p>
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
                    <span className="text-xs text-pink-600/80">들어보고 따라 말해보기</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {summary ? (
          <section className="rounded-xl border-2 border-pink-200 bg-white p-4 shadow-md">
            <h2 className="text-sm font-bold text-pink-600 mb-2">문법·발화 코멘트</h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{summary}</p>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => {
            playClick();
            onNext();
          }}
          disabled={!canProceed}
          className="w-full rounded-xl py-3 font-medium text-white bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 shadow-md transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </main>
    </div>
  );
}
