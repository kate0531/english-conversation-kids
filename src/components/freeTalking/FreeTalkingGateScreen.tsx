"use client";

import { playClick } from "@/lib/sounds";
import { FREE_TALK_TOPICS } from "@/data/freeTalkingData";

interface FreeTalkingGateScreenProps {
  onSelectTopic: (topic: string) => void;
  onBack: () => void;
  isLoadingScenario?: boolean;
}

export default function FreeTalkingGateScreen({
  onSelectTopic,
  onBack,
  isLoadingScenario = false,
}: FreeTalkingGateScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 via-pink-50/80 to-amber-50/60">
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-200">
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
          <h1 className="text-base font-semibold text-pink-600">Free Talking Time</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">
            {isLoadingScenario
              ? "AI가 주제에 맞는 질문과 그림을 만들고 있어요… (잠시만요)"
              : "주제를 고르면 영어 미션이 시작돼요!"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto relative z-10">
          {FREE_TALK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                onSelectTopic(topic);
                try {
                  playClick();
                } catch {
                  /* 효과음 실패해도 화면 전환은 됨 */
                }
              }}
              disabled={isLoadingScenario}
              className="relative z-10 cursor-pointer rounded-xl border-2 border-pink-200 bg-white px-4 py-4 text-left text-sm font-medium text-gray-800 hover:bg-pink-50 hover:border-pink-300 transition shadow-sm active:scale-[0.98] touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {topic}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
