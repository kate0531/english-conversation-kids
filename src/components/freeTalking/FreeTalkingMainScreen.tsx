"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { SubtitleMode } from "@/types/freeTalking";
import type { FreeTalkingScenario, FreeTalkingConversationTurn } from "@/types/freeTalking";
import { getBackgroundImageUrl, PARTNER_IMAGE_FEMALE } from "@/data/freeTalkingData";
import CharacterPortrait from "./CharacterPortrait";
import CountdownOverlay from "./CountdownOverlay";
import CorrectCheck from "./CorrectCheck";
import VoiceMicIcon from "@/components/VoiceMicIcon";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTTS } from "@/hooks/useTTS";
import { playClick, playDing } from "@/lib/sounds";

interface FreeTalkingMainScreenProps {
  scenario: FreeTalkingScenario;
  userAnswers: string[];
  onTurnComplete: (userAnswer: string) => void;
  onAllComplete: () => void;
  onBack: () => void;
}

function getSubtitleTexts(turn: FreeTalkingConversationTurn | undefined): { en: string; ko: string } | null {
  if (!turn || turn.speaker !== "ai" || turn.text == null) return null;
  return { en: turn.text, ko: turn.koText ?? turn.text };
}

/** 클릭 시 보여줄 질문: 현재 턴이 AI면 현재 질문, 유저 턴이면 직전 AI 질문 */
function getLastAiQuestionTexts(
  conversation: FreeTalkingConversationTurn[],
  currentTurnIndex: number
): { en: string; ko: string } | null {
  const turn = conversation[currentTurnIndex];
  if (turn?.speaker === "ai") return getSubtitleTexts(turn);
  if (currentTurnIndex > 0) return getSubtitleTexts(conversation[currentTurnIndex - 1]);
  return null;
}

export default function FreeTalkingMainScreen({
  scenario,
  userAnswers,
  onTurnComplete,
  onAllComplete,
  onBack,
}: FreeTalkingMainScreenProps) {
  const [showCountdown, setShowCountdown] = useState(true);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>("none");
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  const partnerImageUrl = scenario.partner?.imageUrl ?? PARTNER_IMAGE_FEMALE;
  const { speak } = useTTS({ gender: "female" }); // OpenAI TTS nova 우선 (질문 음원)
  const bgUrl = getBackgroundImageUrl(scenario.visualKeywords);

  const conversation = scenario?.conversation ?? [];
  const currentTurn = conversation[currentTurnIndex];

  /** 질문 길이에 맞춰 Hailey 음성 들을 시간 (OpenAI TTS 대비) */
  const aiListenDelayMs = useMemo(() => {
    const t = currentTurn?.speaker === "ai" ? (currentTurn.text ?? "") : "";
    const base = 2600;
    const perChar = 52;
    return Math.min(11000, base + t.length * perChar);
  }, [currentTurn?.speaker, currentTurn?.text]);

  const isUserTurn = currentTurn?.speaker === "user";
  const isDone = currentTurnIndex >= conversation.length;

  const [answeredWaiting, setAnsweredWaiting] = useState(false);

  const handleVoiceResult = useCallback((text: string) => {
    if (!isUserTurn || !currentTurn || !text?.trim()) return;
    const answer = text.trim();
    onTurnComplete(answer);
    setAnsweredWaiting(true);

    // 다음 턴으로 천천히 전환 (3.5초 대기 - 초등학생용 여유)
    setTimeout(() => {
      setAnsweredWaiting(false);
      const nextIndex = currentTurnIndex + 1;
      if (nextIndex >= conversation.length) {
        onAllComplete();
        return;
      }
      setCurrentTurnIndex(nextIndex);
    }, 3500);
  }, [currentTurnIndex, currentTurn, conversation, isUserTurn, onTurnComplete, onAllComplete]);

  // 질문 음원 끝난 후 힌트 버블 등장 (0.8초 지연 - 초등학생용)
  useEffect(() => {
    if (!isUserTurn || !currentTurn?.keywords?.length) {
      setHintVisible(false);
      return;
    }
    const t = setTimeout(() => setHintVisible(true), 800);
    return () => clearTimeout(t);
  }, [isUserTurn, currentTurn?.keywords, currentTurnIndex]);

  const { isListening, toggle } = useSpeechRecognition({
    lang: "en-US",
    onResult: handleVoiceResult,
  });

  // AI 턴: 카운트다운 끝난 뒤 질문 음원(TTS) 재생 → 띵동 → 다음 턴(유저)으로 전환
  useEffect(() => {
    if (showCountdown || !currentTurn || currentTurn.speaker !== "ai" || isDone) return;
    speak(currentTurn.text ?? "");
    const isLastTurn = currentTurnIndex === conversation.length - 1;
    const delay = aiListenDelayMs;
    const t = setTimeout(() => {
      playDing(); // 음원 끝난 다음에 띵동
      if (isLastTurn) {
        onAllComplete();
      } else {
        setCurrentTurnIndex((i) => i + 1);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [
    showCountdown,
    currentTurnIndex,
    currentTurn?.speaker,
    currentTurn?.text,
    conversation.length,
    isDone,
    speak,
    onAllComplete,
    aiListenDelayMs,
  ]);

  const handleReplayHaileyQuestion = useCallback(() => {
    const texts = getLastAiQuestionTexts(conversation, currentTurnIndex);
    if (!texts?.en?.trim()) return;
    playClick();
    speak(texts.en);
  }, [conversation, currentTurnIndex, speak]);

  if (isDone || !currentTurn) return null;

  const subtitleTexts = getLastAiQuestionTexts(conversation, currentTurnIndex);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/90 via-pink-50/60 to-amber-50/80">
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-200">
        <div className="max-w-[300px] mx-auto px-4 py-3 flex items-center justify-between">
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
          <h1 className="text-base font-semibold text-pink-600">Free Talking</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
        {/* 프로필 카드: 세로로 세운 좁은 컬럼 */}
        <div className="w-full max-w-[300px] flex flex-col items-center mb-2">
          <CharacterPortrait
            imageUrl={partnerImageUrl}
            backgroundUrl={bgUrl}
            partnerName={scenario.partner?.name}
            hintKeywords={hintVisible ? currentTurn?.keywords ?? null : null}
            turnIndex={currentTurnIndex}
            subtitleMode={subtitleMode}
            onSubtitleChange={setSubtitleMode}
            subtitleTexts={subtitleTexts}
          />
        </div>

        {/* Hailey 질문 음원 다시 듣기 (테마별 질문 TTS) */}
        {subtitleTexts?.en && (
          <div className="mb-3 w-full max-w-[300px] flex justify-center">
            <button
              type="button"
              onClick={handleReplayHaileyQuestion}
              className="inline-flex items-center gap-1.5 rounded-full border border-pink-200/90 bg-white/90 px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-50 shadow-sm"
            >
              <span aria-hidden>🔊</span>
              Hailey 질문 다시 듣기
            </button>
          </div>
        )}

        {/* 유저 턴: 스피커→듣는중→잠시만요 */}
        <div className="mb-6">
          {isUserTurn ? (
            <button
              type="button"
              onClick={answeredWaiting ? undefined : toggle}
              disabled={answeredWaiting}
              className="inline-flex items-center gap-2 rounded-full border-2 border-pink-300 bg-pink-50 px-5 py-2.5 text-sm font-medium text-pink-700 hover:bg-pink-100 transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <VoiceMicIcon size={20} className="text-pink-700" />
              <span className="leading-none">
                {answeredWaiting
                  ? "잠시만요..."
                  : isListening
                    ? "듣는 중..."
                    : "스피커를 눌러 대답하세요"}
              </span>
            </button>
          ) : currentTurnIndex > 0 ? (
            <CorrectCheck />
          ) : null}
        </div>

      </main>

      {showCountdown && (
        <CountdownOverlay onComplete={() => setShowCountdown(false)} />
      )}
    </div>
  );
}
