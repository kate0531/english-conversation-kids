"use client";

import type { Achievement } from "@/types/conversation";

/** 상=파랑, 중=초록, 하=빨강 */
const STYLES: Record<Achievement, { bg: string; border: string; text: string; label: string }> = {
  high: {
    bg: "bg-blue-500/20",
    border: "border-blue-400",
    text: "text-blue-700",
    label: "상",
  },
  mid: {
    bg: "bg-green-500/20",
    border: "border-green-400",
    text: "text-green-700",
    label: "중",
  },
  low: {
    bg: "bg-red-500/20",
    border: "border-red-400",
    text: "text-red-700",
    label: "하",
  },
};

interface AchievementBadgeProps {
  achievement: Achievement;
  turnIndex: number;
  score: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function AchievementBadge({
  achievement,
  turnIndex,
  score,
  isSelected,
  onClick,
}: AchievementBadgeProps) {
  const s = STYLES[achievement];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition ${s.bg} ${s.border} ${s.text} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400`}
      data-turn={turnIndex}
      title="클릭하면 점수 확인"
    >
      {turnIndex}턴: {s.label}
      {isSelected && <span className="ml-1 font-semibold">({score}점)</span>}
    </button>
  );
}
