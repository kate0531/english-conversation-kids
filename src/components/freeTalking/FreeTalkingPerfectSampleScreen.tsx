"use client";

import { useState, useCallback } from "react";
import type { FreeTalkingSampleLine } from "@/types/freeTalking";
import { playClick, playPopup } from "@/lib/sounds";
import { playSampleConversation } from "@/hooks/useTTS";

interface FreeTalkingPerfectSampleScreenProps {
  sampleConversation: FreeTalkingSampleLine[];
  partnerName?: string;
  /** 출처 안내 (예: Conversation Time · …) */
  practiceSubtitle?: string;
  onNext: () => void;
  onBack: () => void;
}

/** 100점 샘플 대화 전용 화면 — 보라 테마, 세련된 레이아웃 */
export default function FreeTalkingPerfectSampleScreen({
  sampleConversation,
  partnerName = "Hailey",
  practiceSubtitle,
  onNext,
  onBack,
}: FreeTalkingPerfectSampleScreenProps) {
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const handlePlaySample = useCallback(() => {
    playClick();
    setIsPlayingSample(true);
    playSampleConversation(
      sampleConversation,
      () => setIsPlayingSample(false)
    );
  }, [sampleConversation]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50/95 via-white to-violet-50/80">
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-violet-200/80 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBack();
            }}
            className="w-10 h-10 rounded-xl border-2 border-violet-200 bg-white text-gray-600 hover:bg-violet-50 flex items-center justify-center text-lg transition"
          >
            ←
          </button>
          <h1 className="text-base font-semibold text-violet-700">Say It Like a Pro</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full flex flex-col">
        <p className="text-violet-600/90 text-sm font-medium mb-2 text-center">
          미션 완료까지 얼마 안 남았어요!
        </p>
        {practiceSubtitle ? (
          <p className="text-violet-500/85 text-xs font-medium mb-4 text-center rounded-full bg-violet-100/70 py-1.5 px-3 mx-auto max-w-md">
            {practiceSubtitle}
          </p>
        ) : null}

        {/* 들어보기: Hailey + 나 대화 전체 재생 */}
        <button
          type="button"
          onClick={handlePlaySample}
          disabled={isPlayingSample}
          className="mb-4 w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-70"
        >
          <span>🔊</span>
          <span>{isPlayingSample ? "재생 중..." : "들어보기"}</span>
        </button>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {sampleConversation.map((line, i) => (
            <div
              key={i}
              className={`flex ${line.speaker === "ai" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  line.speaker === "ai"
                    ? "bg-white border border-violet-100 text-gray-800 rounded-bl-md"
                    : "bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-br-md"
                }`}
              >
                {line.speaker === "ai" && (
                  <span className="text-xs font-medium text-violet-500 block mb-1">
                    {partnerName}
                  </span>
                )}
                {line.speaker === "user" && (
                  <span className="text-xs font-medium text-violet-200 block mb-1 text-right">
                    나
                  </span>
                )}
                <p className={line.speaker === "user" ? "text-right" : ""}>{line.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 pt-6 pb-2">
          <button
            type="button"
            onClick={() => {
              playPopup();
              onNext();
            }}
            className="w-full rounded-2xl py-4 font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-200/50 transition active:scale-[0.98]"
          >
            샘플 따라 말하기
          </button>
        </div>
      </main>
    </div>
  );
}
