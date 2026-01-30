"use client";

import { playClick } from "@/lib/sounds";
import type { Achievement } from "@/types/conversation";

/** 상=파랑, 중=초록, 하=빨강 — 파스텔톤, 팔모양 이모지 제외 */
const TOAST_STYLES: Record<
  Achievement,
  { bg: string; border: string; accent: string; text: string; label: string }
> = {
  high: {
    bg: "bg-gradient-to-br from-sky-50/95 to-sky-100/90",
    border: "border-sky-200/90",
    accent: "bg-gradient-to-r from-sky-300/80 to-sky-400/60",
    text: "text-sky-900",
    label: "상",
  },
  mid: {
    bg: "bg-gradient-to-br from-green-50/95 to-emerald-100/90",
    border: "border-green-200/90",
    accent: "bg-gradient-to-r from-green-300/80 to-emerald-400/60",
    text: "text-green-900",
    label: "중",
  },
  low: {
    bg: "bg-gradient-to-br from-rose-50/95 to-rose-100/90",
    border: "border-rose-200/90",
    accent: "bg-gradient-to-r from-rose-300/80 to-rose-400/60",
    text: "text-rose-900",
    label: "하",
  },
};

interface ScoreToastProps {
  achievement: Achievement;
  score: number;
  reaction: string;
  corrected?: string;
  feedback?: string;
  onClose: () => void;
}

export default function ScoreToast({
  achievement,
  score,
  reaction,
  corrected,
  feedback,
  onClose,
}: ScoreToastProps) {
  const s = TOAST_STYLES[achievement];
  const hasCorrection = corrected && corrected.trim() !== "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/15 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        playClick();
        onClose();
      }}
      role="dialog"
      aria-label="점수 결과"
    >
      <div
        className={`w-full max-w-sm rounded-2xl ${s.bg} ${s.text} shadow-xl shadow-black/8 border ${s.border} overflow-hidden ring-1 ring-black/5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-2 rounded-t-2xl ${s.accent}`} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-black/5 text-sm font-medium shadow-sm">
              성취도: {s.label}
            </span>
            <button
              type="button"
              onClick={() => {
                playClick();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white/60 transition"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
          <div className="flex items-baseline gap-2 mb-4 py-3 px-4 rounded-xl bg-white/50 border border-black/5 shadow-inner">
            <span className="text-3xl font-bold tabular-nums">{score}</span>
            <span className="text-base font-medium opacity-80">점</span>
          </div>

          {hasCorrection && (
            <div className="mb-3 p-3 rounded-xl bg-white/60 border border-black/5 shadow-sm">
              <p className="text-xs font-medium mb-1.5 opacity-80">교정된 문장</p>
              <p className="text-sm font-medium leading-relaxed">{corrected}</p>
            </div>
          )}

          {feedback && (
            <div className="mb-3 p-3 rounded-xl bg-white/40 border border-black/5">
              <p className="text-xs font-medium mb-1.5 opacity-80">피드백</p>
              <p className="text-sm opacity-90 whitespace-pre-line leading-relaxed">{feedback}</p>
            </div>
          )}

          <p className="text-sm opacity-90 leading-relaxed pt-1">{reaction}</p>
        </div>
      </div>
    </div>
  );
}
