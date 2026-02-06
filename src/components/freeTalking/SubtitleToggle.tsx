"use client";

import type { SubtitleMode } from "@/types/freeTalking";
import { playClick } from "@/lib/sounds";

interface SubtitleToggleProps {
  mode: SubtitleMode;
  onChange: (mode: SubtitleMode) => void;
  /** 물어본 질문 영어/한글 텍스트 */
  subtitleTexts?: { en: string; ko: string } | null;
}

/** none → En → Ko → none 순환, 클릭 시 작은 회색 박스에 영어/한글 질문 노출 */
const CYCLE: SubtitleMode[] = ["none", "en", "ko"];
const MODE_LABELS: Record<SubtitleMode, string> = {
  none: "전구",
  en: "En",
  ko: "Ko",
};

export default function SubtitleToggle({ mode, onChange, subtitleTexts }: SubtitleToggleProps) {
  const idx = CYCLE.indexOf(mode);
  const nextIdx = (idx + 1) % CYCLE.length;
  const nextMode = CYCLE[nextIdx];
  const showBox = (mode === "en" || mode === "ko") && subtitleTexts;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          playClick();
          onChange(nextMode);
        }}
        title="자막: 없음 / 영어 / 한글"
        className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-pink-200 bg-white/90 text-gray-600 hover:bg-pink-50 active:scale-[0.98] transition shadow-sm select-none touch-manipulation flex-shrink-0"
      >
        {mode === "none" ? (
          <span className="text-lg" aria-label="자막 없음">💡</span>
        ) : (
          <span className="text-sm font-semibold text-pink-600">{MODE_LABELS[mode]}</span>
        )}
      </button>
      {/* 고정 높이로 전구/En/Ko 전환해도 사진 영역 흔들림 방지 */}
      <div className="h-[52px] w-full max-w-[260px] flex items-center justify-center px-2 flex-shrink-0">
        {showBox && subtitleTexts && (
          <div className="w-full rounded-lg bg-gray-100/90 border border-gray-200 px-3 py-2 max-h-[48px] overflow-hidden">
            <p className="text-[11px] leading-relaxed text-gray-600 line-clamp-2">
              {mode === "en" ? subtitleTexts.en : subtitleTexts.ko}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
