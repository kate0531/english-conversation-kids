"use client";

import { useState, useCallback, useMemo } from "react";
import type { FreeTalkingSampleLine } from "@/types/freeTalking";
import VoiceMicIcon from "@/components/VoiceMicIcon";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { playClick, playDing, playBuzzer } from "@/lib/sounds";

interface FreeTalkingSampleFollowScreenProps {
  sampleConversation: FreeTalkingSampleLine[];
  onComplete: () => void;
  onBack: () => void;
}

/** 따라 말할 문장만 추출 (user 발화만, 빈 문장 제외) */
function getUserSentences(conversation: FreeTalkingSampleLine[]): string[] {
  return conversation
    .filter((line) => line.speaker === "user" && line.text.trim().length > 0)
    .map((line) => line.text.trim());
}

/** 단어 단위로 정오답 비교 → 맞으면 초록, 틀리면 빨강 */
function compareWithTarget(target: string, spoken: string): { text: string; correct: boolean }[] {
  const norm = (s: string) => s.toLowerCase().replace(/[.,!?']/g, "").trim();
  const targetWords = target.split(/\s+/).filter(Boolean);
  const spokenWords = spoken.trim().split(/\s+/).filter(Boolean);
  return spokenWords.map((word, i) => {
    const expected = targetWords[i];
    const correct = expected != null && norm(word) === norm(expected);
    return { text: word, correct };
  });
}

export default function FreeTalkingSampleFollowScreen({
  sampleConversation,
  onComplete,
  onBack,
}: FreeTalkingSampleFollowScreenProps) {
  const sentences = useMemo(() => getUserSentences(sampleConversation), [sampleConversation]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSpokenText, setUserSpokenText] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const targetSentence = sentences[currentIndex] ?? "";
  const isDone = currentIndex >= sentences.length;

  const handleVoiceResult = useCallback(
    (text: string) => {
      if (!text?.trim()) return;
      const spoken = text.trim();
      setUserSpokenText(spoken);
      setAnswered(true);
      const parts = compareWithTarget(targetSentence, spoken);
      if (parts.every((p) => p.correct)) {
        playDing();
      } else if (parts.some((p) => !p.correct)) {
        playBuzzer();
      }
    },
    [targetSentence]
  );

  const { isListening, toggle, supported } = useSpeechRecognition({
    lang: "en-US",
    onResult: handleVoiceResult,
  });

  const handleNext = useCallback(() => {
    playClick();
    const next = currentIndex + 1;
    if (next >= sentences.length) {
      onComplete();
      return;
    }
    setCurrentIndex(next);
    setUserSpokenText(null);
    setAnswered(false);
  }, [currentIndex, sentences.length, onComplete]);

  if (!sentences.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-500">따라 말할 문장이 없습니다.</p>
        <button type="button" onClick={onBack} className="mt-4 text-pink-600 underline">
          돌아가기
        </button>
      </div>
    );
  }

  if (isDone) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50 via-pink-50/60 to-amber-50/70">
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-violet-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              playClick();
              onBack();
            }}
            className="w-10 h-10 rounded-xl border-2 border-violet-200 bg-white text-gray-600 hover:bg-violet-50 flex items-center justify-center text-lg"
          >
            ←
          </button>
          <h1 className="text-base font-semibold text-violet-600">Say It Like a Pro</h1>
          <span className="text-sm text-gray-500">
            {currentIndex + 1}/{sentences.length}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
        {/* 위: 따라 말할 문장 (샘플) */}
        <div className="w-full max-w-md rounded-2xl border-2 border-violet-200 bg-white p-6 shadow-lg mb-6">
          <p className="text-center text-lg font-medium text-violet-800">
            {targetSentence}
          </p>
        </div>

        {/* 아래: 내가 말한 문장 (떨어지는 애니메이션) */}
        <div className="w-full max-w-md min-h-[80px] rounded-2xl border-2 border-dashed border-violet-100 bg-violet-50/50 p-4 mb-6 flex items-center justify-center">
          {userSpokenText ? (
            (() => {
              const parts = compareWithTarget(targetSentence, userSpokenText);
              return (
                <p className="text-center text-base font-medium animate-fall-down leading-relaxed">
                  {parts.map(({ text, correct }, i) => (
                    <span key={i} className={correct ? "text-green-600" : "text-red-600"}>
                      {text}
                      {i < parts.length - 1 ? " " : ""}
                    </span>
                  ))}
                </p>
              );
            })()
          ) : !supported ? (
            <p className="text-sm text-amber-700 text-center">
              이 브라우저는 음성 인식을 지원하지 않습니다. Chrome(크롬)에서 시도해 주세요.
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              {isListening ? "듣는 중..." : "마이크를 눌러 따라 말해보세요"}
            </p>
          )}
        </div>

        {/* 게임 버튼: 마이크 / 다음 */}
        <div className="flex flex-col items-center gap-4">
          {answered ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl px-8 py-3 font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-md transition active:scale-95"
            >
              다음 →
            </button>
          ) : (
            <button
              type="button"
              onClick={supported ? toggle : undefined}
              disabled={!supported}
              className="inline-flex items-center gap-3 rounded-full px-8 py-4 font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg transition active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              <VoiceMicIcon size={24} className="text-white" />
              <span className="leading-none">{isListening ? "듣는 중..." : supported ? "따라 말하기" : "음성 인식 미지원"}</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
