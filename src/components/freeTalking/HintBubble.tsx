"use client";

import { useState } from "react";
import { playPop } from "@/lib/sounds";

interface HintBubbleProps {
  /** 한 개 키워드 (버블 하나당 하나) */
  keyword: string;
  /** 부모에서 사라짐 애니 제어 시 사용 */
  popping?: boolean;
  onDismiss?: () => void;
}

/** 카드 내부 힌트 버블 1개 - 클릭 시 위로 올라가며 희미해지고 사라짐 */
export default function HintBubble({ keyword, popping: controlledPopping, onDismiss }: HintBubbleProps) {
  const [internalPopping, setInternalPopping] = useState(false);
  const popping = controlledPopping ?? internalPopping;

  const handleClick = () => {
    if (popping) return;
    if (controlledPopping !== undefined) {
      onDismiss?.();
      return;
    }
    setInternalPopping(true);
    playPop();
    setTimeout(() => onDismiss?.(), 500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={popping}
      className={`inline-flex items-center gap-1.5 rounded-[2rem] px-3 py-2 text-white font-medium text-sm cursor-pointer touch-manipulation ${
        popping ? "animate-hint-fade-up-out pointer-events-none" : "animate-hint-blink"
      }`}
      style={{
        background: "linear-gradient(135deg, #ff8fab 0%, #ff6b9d 50%, #ff4d7a 100%)",
        boxShadow: "0 2px 12px rgba(255, 77, 122, 0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      <span aria-hidden>❤️</span>
      <span>{keyword}</span>
    </button>
  );
}
