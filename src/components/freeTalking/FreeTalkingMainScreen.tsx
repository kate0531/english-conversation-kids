"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SubtitleMode } from "@/types/freeTalking";
import type { FreeTalkingScenario, FreeTalkingConversationTurn } from "@/types/freeTalking";
import { getBackgroundImageUrl, PARTNER_IMAGE_FEMALE } from "@/data/freeTalkingData";
import CharacterPortrait from "./CharacterPortrait";
import CountdownOverlay from "./CountdownOverlay";
import CorrectCheck from "./CorrectCheck";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTTS } from "@/hooks/useTTS";
import { playClick, playDing } from "@/lib/sounds";

type DiffKind = "same" | "removed" | "added";
type DiffPart = { kind: DiffKind; token: string };

function normalizeDiffToken(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[.,!?']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function diffTokens(original: string, corrected: string): DiffPart[] {
  const oTokens = original.trim().length ? original.trim().split(/\s+/) : [];
  const cTokens = corrected.trim().length ? corrected.trim().split(/\s+/) : [];
  const oKeys = oTokens.map(normalizeDiffToken);
  const cKeys = cTokens.map(normalizeDiffToken);

  const n = oTokens.length;
  const m = cTokens.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (oKeys[i] && cKeys[j] && oKeys[i] === cKeys[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oKeys[i] && cKeys[j] && oKeys[i] === cKeys[j]) {
      parts.push({ kind: "same", token: oTokens[i] });
      i++;
      j++;
      continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      parts.push({ kind: "removed", token: oTokens[i] });
      i++;
    } else {
      parts.push({ kind: "added", token: cTokens[j] });
      j++;
    }
  }
  while (i < n) {
    parts.push({ kind: "removed", token: oTokens[i] });
    i++;
  }
  while (j < m) {
    parts.push({ kind: "added", token: cTokens[j] });
    j++;
  }
  return parts;
}

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
  // TTS 오디오가 정책 때문에 재생되지 않을 수 있어 기본값을 En으로 두어 질문 문장을 바로 보여줌
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>("en");
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const imageRefreshKeyRef = useRef<string>(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const appendSig = useCallback(
    (url: string) => {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}sig=${imageRefreshKeyRef.current}`;
    },
    []
  );

  // 상황에 맞는 사진은 visualKeywords 기반 “고정 매핑”으로 우선 안정적으로 보여줌
  // (source.unsplash.com random은 환경에서 간헐적으로 로딩이 안 되는 케이스가 있어 제외)
  const partnerImageUrl = appendSig(scenario.partner?.imageUrl ?? PARTNER_IMAGE_FEMALE);
  const { speak, speakAndWait } = useTTS({ gender: "female" });
  const [activeVisualKeywords, setActiveVisualKeywords] = useState<string[]>(
    scenario.visualKeywords
  );
  useEffect(() => {
    setActiveVisualKeywords(scenario.visualKeywords);
  }, [scenario]);

  const bgUrl = appendSig(getBackgroundImageUrl(activeVisualKeywords));

  const conversation = scenario?.conversation ?? [];
  const currentTurn = conversation[currentTurnIndex];
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [ttsRetryToken, setTtsRetryToken] = useState(0);
  /** 이펙트가 빠르게 재실행될 때 이전 TTS 완료 콜백 무시 (Strict Mode·재시도) */
  const ttsRunIdRef = useRef(0);

  const isUserTurn = currentTurn?.speaker === "user";
  const isDone = currentTurnIndex >= conversation.length;

  const [answeredWaiting, setAnsweredWaiting] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState<string | null>(null);
  const [correctedTranscript, setCorrectedTranscript] = useState<string | null>(null);
  const [isCorrecting, setIsCorrecting] = useState(false);

  const handleVoiceResult = useCallback((text: string) => {
    if (!isUserTurn || !currentTurn || !text?.trim()) return;
    if (answeredWaiting) return;

    const answer = text.trim();
    const nextUserAnswers = [...userAnswers, answer];

    setFinalTranscript(answer);
    setCorrectedTranscript(null);
    setIsCorrecting(true);
    setAnsweredWaiting(true);

    onTurnComplete(answer);

    // 사용자가 말한 내용에 해당하는 힌트 키워드(=대답 주제)로 다음 질문/화면 배경 매칭
    setActiveVisualKeywords(
      currentTurn.keywords && currentTurn.keywords.length > 0 ? currentTurn.keywords : scenario.visualKeywords
    );

    let didAdvance = false;
    const goNext = () => {
      // correction 완료/타임아웃 모두에서 한 번만 다음 턴으로 이동
      if (didAdvance) return;
      didAdvance = true;
      setIsCorrecting(false);
      setAnsweredWaiting(false);
      const nextIndex = currentTurnIndex + 1;
      if (nextIndex >= conversation.length) {
        onAllComplete();
        return;
      }
      setCurrentTurnIndex(nextIndex);
    };

    // correction API가 느려도 UX가 멈추지 않도록 max wait
    const maxWaitMs = 3000;
    const timer = setTimeout(() => {
      goNext();
    }, maxWaitMs);

    void (async () => {
      try {
        const res = await fetch("/api/free-talking/correct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario, userAnswers: nextUserAnswers }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          corrections?: { enCorrected: string }[];
        };
        const list = Array.isArray(data.corrections) ? data.corrections : [];
        const last = list[list.length - 1];
        const corrected = typeof last?.enCorrected === "string" ? last.enCorrected.trim() : "";
        if (!corrected) return;
        setCorrectedTranscript(corrected);
      } catch {
        // correction 실패해도 maxWait 기반으로 다음 진행
      } finally {
        clearTimeout(timer);
        goNext();
      }
    })();
  }, [
    answeredWaiting,
    currentTurnIndex,
    currentTurn,
    conversation,
    isUserTurn,
    onTurnComplete,
    onAllComplete,
    scenario,
    scenario.visualKeywords,
    userAnswers,
  ]);

  // AI 턴으로 넘어가면 발화값 표시 제거(다음 문제에서 힌트 버블 다시 보이게)
  useEffect(() => {
    if (!isUserTurn) {
      setFinalTranscript(null);
      setCorrectedTranscript(null);
      setIsCorrecting(false);
    }
  }, [isUserTurn]);

  // 질문 음원 끝난 후 힌트 버블 등장 (0.8초 지연 - 초등학생용)
  useEffect(() => {
    if (!isUserTurn || !currentTurn?.keywords?.length) {
      setHintVisible(false);
      return;
    }
    const t = setTimeout(() => setHintVisible(true), 800);
    return () => clearTimeout(t);
  }, [isUserTurn, currentTurn?.keywords, currentTurnIndex]);

  const { isListening, start, stop, sttError, clearSttError, interimText, isProcessing } = useSpeechRecognition({
    lang: "en-US",
    onResult: handleVoiceResult,
  });

  // AI 턴: TTS API 재생이 끝난 뒤에만 띵동·다음 턴 (실패 시 진행 안 함 — 내장 음성 폴백 없음)
  useEffect(() => {
    if (showCountdown || !currentTurn || currentTurn.speaker !== "ai" || isDone) return;
    if (!audioUnlocked) return;
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
    audioUnlocked,
  ]);

  // 사용자가 한 번이라도 탭하면(제스처) 자동재생 정책 해제
  useEffect(() => {
    if (audioUnlocked) return;
    const unlock = () => setAudioUnlocked(true);
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [audioUnlocked]);

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

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-6 overflow-y-auto">
        {!audioUnlocked && !showCountdown && currentTurn?.speaker === "ai" ? (
          <div className="w-full max-w-[300px] mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            오디오 재생을 위해 화면을 한 번 눌러주세요.
            <button
              type="button"
              onClick={() => setAudioUnlocked(true)}
              className="mt-2 w-full rounded-lg bg-amber-600 text-white py-2 font-medium hover:bg-amber-700"
            >
              재생 시작
            </button>
          </div>
        ) : null}
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

        {/* 확인 후 최종 발화 값 + 교정 시각화(단어 단위 diff) */}
        {isUserTurn && answeredWaiting && finalTranscript ? (
          <div className="w-full max-w-[300px] mb-2 rounded-2xl border-2 border-pink-200 bg-pink-50/60 px-4 py-3 text-xs text-gray-900 shadow-sm max-h-[120px] overflow-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-pink-700">당신의 말</span>
              <span className="text-[10px] text-gray-600">
                {isCorrecting ? "교정 중..." : correctedTranscript ? "교정 완료" : "전사 완료"}
              </span>
            </div>
            {correctedTranscript ? (
              <p className="leading-relaxed break-words whitespace-pre-wrap">
                {diffTokens(finalTranscript, correctedTranscript).map((p, idx) => (
                  <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${idx}-${p.kind}`}
                    className={
                      p.kind === "same"
                        ? "text-gray-900"
                        : p.kind === "removed"
                          ? "text-red-600 line-through"
                          : "text-green-700"
                    }
                  >
                    {idx > 0 ? " " : ""}
                    {p.token}
                  </span>
                ))}
              </p>
            ) : (
              <p className="leading-relaxed break-words whitespace-pre-wrap">{finalTranscript}</p>
            )}
          </div>
        ) : null}

        {/* 말하는 중(확인 전): interim 표시 */}
        {isUserTurn && !answeredWaiting && (isListening || isProcessing) && interimText.trim() ? (
          <div className="w-full max-w-[300px] mb-2 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-3 text-xs text-gray-800 shadow-sm max-h-[120px] overflow-auto whitespace-pre-wrap">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800">당신의 말(임시)</span>
              <span className="text-[10px] text-gray-500">말하는 중...</span>
            </div>
            {interimText}
          </div>
        ) : null}

        {/* 유저 턴: 스피커→듣는중→잠시만요 */}
        <div className="mb-6">
          {isUserTurn ? (
            <div className="flex gap-2 w-full justify-center">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!answeredWaiting) start();
                }}
                disabled={answeredWaiting || isProcessing || isListening}
                className="flex-1 inline-flex items-center justify-center rounded-full border-2 border-pink-300 bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700 hover:bg-pink-100 transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap leading-none"
              >
                {isListening ? "녹음중" : "녹음"}
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (!answeredWaiting) stop();
                }}
                disabled={!isListening || answeredWaiting || isProcessing}
                className="flex-1 inline-flex items-center justify-center rounded-full border-2 border-pink-200 bg-white px-3 py-2 text-xs font-medium text-pink-700 hover:bg-pink-50 transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap leading-none"
              >
                {isProcessing ? "확인중" : "확인"}
              </button>
            </div>
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
