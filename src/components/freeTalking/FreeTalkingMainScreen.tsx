"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const { speak, speakAndWait } = useTTS({ gender: "female" });
  const bgUrl = getBackgroundImageUrl(scenario.visualKeywords);

  const conversation = scenario?.conversation ?? [];
  const currentTurn = conversation[currentTurnIndex];
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [ttsRetryToken, setTtsRetryToken] = useState(0);
  /** 이펙트가 빠르게 재실행될 때 이전 TTS 완료 콜백 무시 (Strict Mode·재시도) */
  const ttsRunIdRef = useRef(0);

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

  const { isListening, toggle, sttError, clearSttError } = useSpeechRecognition({
    lang: "en-US",
    onResult: handleVoiceResult,
  });

  // AI 턴: TTS API 재생이 끝난 뒤에만 띵동·다음 턴 (실패 시 진행 안 함 — 내장 음성 폴백 없음)
  useEffect(() => {
    if (showCountdown || !currentTurn || currentTurn.speaker !== "ai" || isDone) return;
    let cancelled = false;
    const runId = ++ttsRunIdRef.current;
    setTtsError(null);

    void (async () => {
      const ok = await speakAndWait(currentTurn.text ?? "");
      if (cancelled || runId !== ttsRunIdRef.current) return;
      if (!ok) {
        setTtsError(
          "질문 음성(TTS)을 재생할 수 없어요. Vercel의 OPENAI_API_KEY·재배포를 확인한 뒤 아래에서 다시 시도해 주세요."
        );
        return;
      }
      playDing();
      const isLastTurn = currentTurnIndex === conversation.length - 1;
      if (isLastTurn) {
        onAllComplete();
      } else {
        setCurrentTurnIndex((i) => i + 1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    showCountdown,
    currentTurnIndex,
    currentTurn?.speaker,
    currentTurn?.text,
    conversation.length,
    isDone,
    speakAndWait,
    onAllComplete,
    ttsRetryToken,
  ]);

  const handleReplayHaileyQuestion = useCallback(() => {
    const texts = getLastAiQuestionTexts(conversation, currentTurnIndex);
    if (!texts?.en?.trim()) return;
    playClick();
    speak(texts.en);
  }, [conversation, currentTurnIndex, speak]);

  const handleTtsRetry = useCallback(() => {
    playClick();
    setTtsRetryToken((t) => t + 1);
  }, []);

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
        {ttsError ? (
          <div className="w-full max-w-[300px] mb-3 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <p className="font-medium mb-2">{ttsError}</p>
            <button
              type="button"
              onClick={handleTtsRetry}
              className="w-full rounded-lg bg-red-600 text-white py-2 font-medium hover:bg-red-700"
            >
              TTS 다시 시도
            </button>
          </div>
        ) : null}
        {sttError ? (
          <div className="w-full max-w-[300px] mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {sttError}
            <button
              type="button"
              onClick={() => clearSttError()}
              className="block mt-2 text-amber-700 underline"
            >
              메시지 닫기
            </button>
          </div>
        ) : null}
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
