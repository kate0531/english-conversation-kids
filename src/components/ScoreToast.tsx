"use client";

import type { Achievement } from "@/types/conversation";

/** 상=파랑, 중=초록, 하=빨강 — 파스텔톤으로 통일 */
const TOAST_STYLES: Record<
  Achievement,
  { bg: string; border: string; accent: string; text: string; label: string; emoji: string }
> = {
  high: {
    bg: "bg-gradient-to-br from-sky-100 to-sky-200/90",
    border: "border-sky-300/80",
    accent: "bg-sky-300/70",
    text: "text-sky-900",
    label: "상",
    emoji: "🌟",
  },
  mid: {
    bg: "bg-gradient-to-br from-green-100 to-emerald-200/90",
    border: "border-green-300/80",
    accent: "bg-green-300/70",
    text: "text-green-900",
    label: "중",
    emoji: "👍",
  },
  low: {
    bg: "bg-gradient-to-br from-red-100 to-rose-200/90",
    border: "border-red-300/80",
    accent: "bg-red-300/70",
    text: "text-red-900",
    label: "하",
    emoji: "💪",
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
      onClick={onClose}
      role="dialog"
      aria-label="점수 결과"
    >
      <div
        className={`w-full max-w-sm rounded-2xl ${s.bg} ${s.text} shadow-toast border-2 ${s.border} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 ${s.accent}`} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">
              {s.emoji} 성취도: {s.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
          <p className="text-2xl font-bold mb-3">{score}점</p>
          
          {hasCorrection && (
            <div className="mb-3 p-3 rounded-lg bg-white/60 border border-white/80">
              <p className="text-xs font-medium mb-1 opacity-80">교정된 문장:</p>
              <p className="text-sm font-medium">{corrected}</p>
            </div>
          )}
          
          {feedback && (
            <div className="mb-3">
              <p className="text-xs font-medium mb-1 opacity-80">피드백:</p>
              <p className="text-sm opacity-90 whitespace-pre-line">{feedback}</p>
            </div>
          )}
          
          <p className="text-sm opacity-90">{reaction}</p>
        </div>
      </div>
    </div>
  );
}
