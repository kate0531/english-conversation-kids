"use client";

import { useState, useCallback, useMemo } from "react";
import type { FreeTalkingSampleLine } from "@/types/freeTalking";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { playClick, playDing, playBuzzer } from "@/lib/sounds";

interface FreeTalkingSampleFollowScreenProps {
  sampleConversation: FreeTalkingSampleLine[];
  practiceSubtitle?: string;
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
  practiceSubtitle,
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

  const { isListening, start, stop, supported, sttError, clearSttError, interimText, isProcessing } =
    useSpeechRecognition({
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
        {practiceSubtitle ? (
          <p className="text-violet-500/90 text-xs font-medium mb-4 text-center rounded-full bg-violet-100/80 py-1.5 px-3 max-w-md">
            {practiceSubtitle}
          </p>
        ) : null}
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
          ) : sttError ? (
            <p className="text-sm text-red-700 text-center">
              {sttError}
              <button type="button" className="block mx-auto mt-2 text-xs underline" onClick={() => clearSttError()}>
                닫기
              </button>
            </p>
          ) : !supported ? (
            <p className="text-sm text-amber-700 text-center">
              마이크 녹음을 사용할 수 없어요. Chrome에서 시도하거나 /api/stt(Whisper) 설정을 확인해 주세요.
            </p>
          ) : (
            <p className="text-sm text-center">
              {isListening && interimText.trim() ? (
                <span className="text-gray-800/90 italic">말한 내용(예상): {interimText}</span>
              ) : (
                <span className="text-gray-400">
                  {isProcessing ? "전사 중..." : isListening ? "듣는 중..." : "녹음 후 확인을 눌러주세요"}
                </span>
              )}
            </p>
          )}
        </div>

        {/* 게임 버튼: 녹음 / 확인 / 다음 */}
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
            <div className="flex gap-2 w-full justify-center max-w-md">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!answered && !isProcessing) start();
                }}
                disabled={!supported || isProcessing || isListening}
                className="flex-1 inline-flex items-center justify-center rounded-full border-2 border-violet-300 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-100 transition disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap leading-none"
              >
                녹음
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!answered && isListening) stop();
                }}
                disabled={!supported || isProcessing || !isListening}
                className="flex-1 inline-flex items-center justify-center rounded-full border-2 border-violet-200 bg-white px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 transition disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap leading-none"
              >
                {isProcessing ? "확인중" : "확인"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
