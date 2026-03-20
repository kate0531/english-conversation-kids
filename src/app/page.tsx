"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  QUESTIONS,
  FIRST_QUESTION_ID,
  FREE_TALK_FIRST_ID,
  getNextQuestion,
} from "@/data/questions";
import type { QuestionItem } from "@/types/conversation";
import type { TurnMessage, TurnResult } from "@/types/conversation";
import { evaluateAnswer } from "@/lib/score";
import { playClick, playTransition, playPopup } from "@/lib/sounds";
import { useTTS } from "@/hooks/useTTS";
import ChatBubble from "@/components/ChatBubble";
import ScoreToast from "@/components/ScoreToast";
import AchievementBadge from "@/components/AchievementBadge";
import TurnRow from "@/components/TurnRow";
import GoodJobPopup from "@/components/GoodJobPopup";
import VoiceInputButton from "@/components/VoiceInputButton";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import GateScreen from "@/components/GateScreen";
import WritingTimePage from "@/components/writing/WritingTimePage";
import HomeButton from "@/components/HomeButton";
import {
  buildSampleLinesFromSpeaking,
  saveRecentProPractice,
} from "@/lib/recentLearningHistory";

type AppMode = "gate" | "speaking" | "writing";

export default function ConversationPage() {
  const [mode, setMode] = useState<AppMode>("gate");

  const [messages, setMessages] = useState<TurnMessage[]>([]);
  const [results, setResults] = useState<TurnResult[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(
    QUESTIONS[FIRST_QUESTION_ID] ?? null
  );
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number | null>(null);
  const [freeTalkingIntro, setFreeTalkingIntro] = useState(false);
  const [showGoodJobPopup, setShowGoodJobPopup] = useState(false);
  const goodJobPendingRef = useRef(false);
  const lastSpokenQuestionIndexRef = useRef(-1);
  const prevFreeTalkingIntroRef = useRef(false);

  const { speak: speakMale } = useTTS({ gender: "male" });
  const { speak: speakGirl } = useTTS({ gender: "childFemale" });

  const [toast, setToast] = useState<{
    achievement: TurnResult["achievement"];
    score: number;
    reaction: string;
    corrected?: string;
    feedback?: string;
  } | null>(null);

  const { isListening, toggle, supported, sttError, clearSttError } = useSpeechRecognition({
    lang: "en-US",
    onResult: (text) => {
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    },
  });

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !currentQuestion || isSubmitting) return;

    playClick();
    setIsSubmitting(true);
    const result = await evaluateAnswer(trimmed, currentQuestion);
    if (result.evaluationUnavailable) {
      setToast({
        achievement: "low",
        score: 0,
        reaction: "연결 오류",
        feedback: result.feedback,
      });
      setIsSubmitting(false);
      return;
    }
    const { score, achievement, corrected, feedback } = result;
    const reaction = currentQuestion.reactions[achievement];
    const next = getNextQuestion(currentQuestion.id, achievement);

    const answerMsg: TurnMessage = {
      role: "answer",
      text: trimmed,
      turnIndex: currentQuestion.turn,
      timestamp: Date.now(),
    };

    const nextIsFreeTalking = next?.turn === 4;

    if (nextIsFreeTalking) {
      setMessages((prev) => [...prev, answerMsg]);
      setCurrentQuestion(null);
      setFreeTalkingIntro(true);
    } else {
      const nextQuestionMsg: TurnMessage | null = next
        ? {
            role: "question",
            text: next.questionEn,
            imageUrl: next.imageUrl,
            turnIndex: next.turn,
            timestamp: Date.now(),
          }
        : null;
      setMessages((prev) =>
        nextQuestionMsg ? [...prev, answerMsg, nextQuestionMsg] : [...prev, answerMsg]
      );
      setCurrentQuestion(next ?? null);

      if (!next && currentQuestion.turn === 5) {
        goodJobPendingRef.current = true;
      }
    }

    setResults((prev) => [
      ...prev,
      {
        turnIndex: currentQuestion.turn,
        userAnswer: trimmed,
        score,
        achievement,
        corrected,
        feedback,
        reaction,
      },
    ]);
    setToast({
      achievement,
      score,
      reaction,
      corrected,
      feedback,
    });
    setInput("");
    setIsSubmitting(false);
  }, [input, currentQuestion, isSubmitting]);

  const startConversation = () => {
    playClick();
    const first = QUESTIONS[FIRST_QUESTION_ID];
    if (!first) return;
    setCurrentQuestion(first);
    setMessages([
      {
        role: "question",
        text: first.questionEn,
        imageUrl: first.imageUrl,
        turnIndex: 1,
        timestamp: Date.now(),
      },
    ]);
    setResults([]);
    setSelectedTurnIndex(null);
    setFreeTalkingIntro(false);
  };

  const startFreeTalking = () => {
    playClick();
    const q4 = QUESTIONS[FREE_TALK_FIRST_ID];
    if (!q4) return;
    setFreeTalkingIntro(false);
    setCurrentQuestion(q4);
    setMessages((prev) => [
      ...prev,
      {
        role: "question",
        text: q4.questionEn,
        imageUrl: q4.imageUrl,
        turnIndex: 4,
        timestamp: Date.now(),
      },
    ]);
  };

  const goBackToStart = () => {
    setCurrentQuestion(QUESTIONS[FIRST_QUESTION_ID] ?? null);
    setMessages([]);
    setResults([]);
    setSelectedTurnIndex(null);
    setFreeTalkingIntro(false);
    setShowGoodJobPopup(false);
  };

  const speakMaleRef = useRef(speakMale);
  const speakGirlRef = useRef(speakGirl);
  speakMaleRef.current = speakMale;
  speakGirlRef.current = speakGirl;

  useEffect(() => {
    if (messages.length === 0) {
      lastSpokenQuestionIndexRef.current = -1;
      return;
    }
    const last = messages[messages.length - 1];
    if (last.role === "question" && lastSpokenQuestionIndexRef.current !== messages.length - 1) {
      lastSpokenQuestionIndexRef.current = messages.length - 1;
      const isFreeTalking = last.turnIndex >= 4;
      const speak = isFreeTalking ? speakGirlRef.current : speakMaleRef.current;
      speak(last.text);
    }
  }, [messages]);

  useEffect(() => {
    if (freeTalkingIntro && !prevFreeTalkingIntroRef.current) {
      prevFreeTalkingIntroRef.current = true;
      playTransition();
    }
    if (!freeTalkingIntro) prevFreeTalkingIntroRef.current = false;
  }, [freeTalkingIntro]);

  useEffect(() => {
    if (toast) playPopup();
  }, [toast]);

  useEffect(() => {
    if (showGoodJobPopup) playPopup();
  }, [showGoodJobPopup]);

  /** Say It Like a Pro용: 최근 스피킹 학습 대화 저장 */
  useEffect(() => {
    const lines = buildSampleLinesFromSpeaking(messages, results);
    if (!lines.some((l) => l.speaker === "user" && l.text.trim())) return;
    const partnerName =
      results.some((r) => r.turnIndex >= 4) || messages.some((m) => m.turnIndex >= 4)
        ? "Hailey"
        : "Teacher";
    saveRecentProPractice({
      updatedAt: Date.now(),
      source: "speaking",
      label: "Conversation · Free Talking Time",
      partnerName,
      lines,
    });
  }, [messages, results]);

  const hasStarted = messages.length > 0;
  const isWaitingAnswer = currentQuestion && messages[messages.length - 1]?.role === "question";
  const isAdvancedPhase =
    (currentQuestion != null && currentQuestion.turn >= 4) ||
    (currentQuestion === null && results.some((r) => r.turnIndex >= 4));
  const showFreeTalkingUI = freeTalkingIntro || isAdvancedPhase;

  /** 1~3턴용 */
  const turnRows = useMemo(() => {
    const questions = messages.filter((m) => m.role === "question") as (TurnMessage & { imageUrl?: string })[];
    return questions
      .filter((q) => q.turnIndex <= 3)
      .map((q) => {
        const answer = messages.find((m) => m.role === "answer" && m.turnIndex === q.turnIndex);
        return {
          turnIndex: q.turnIndex,
          questionText: q.text,
          imageUrl: q.imageUrl ?? "",
          answerText: answer?.text,
        };
      });
  }, [messages]);

  /** 4~5턴용 */
  const advancedTurnRows = useMemo(() => {
    const questions = messages.filter((m) => m.role === "question") as (TurnMessage & { imageUrl?: string })[];
    return questions
      .filter((q) => q.turnIndex >= 4)
      .map((q) => {
        const answer = messages.find((m) => m.role === "answer" && m.turnIndex === q.turnIndex);
        return {
          turnIndex: q.turnIndex,
          questionText: q.text,
          imageUrl: q.imageUrl ?? "",
          answerText: answer?.text,
        };
      });
  }, [messages]);

  if (mode === "gate") {
    return (
      <GateScreen
        onSelectWriting={() => setMode("writing")}
        onSelectSpeaking={() => setMode("speaking")}
      />
    );
  }

  if (mode === "writing") {
    return (
      <WritingTimePage
        onBackToGate={() => {
          playClick();
          setMode("gate");
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        showFreeTalkingUI
          ? "bg-gradient-to-b from-sky-50 via-sky-100/50 to-sky-50"
          : "bg-gradient-to-b from-[#fff5f7] via-[#ffe8ec] to-[#ffd4dd]"
      }`}
    >
      <header
        className={`flex-shrink-0 sticky top-0 z-10 backdrop-blur-md border-b ${
          showFreeTalkingUI
            ? "bg-sky-50/90 border-sky-200"
            : "bg-white/80 border-pink-100"
        }`}
      >
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <HomeButton
            onClick={() => {
              playClick();
              setMode("gate");
            }}
          />
          <h1
            className={`flex-1 text-center text-base font-medium ${
              showFreeTalkingUI ? "text-sky-600" : "text-gray-500"
            }`}
          >
            {showFreeTalkingUI ? "Free Talking Time" : "Conversation Time"}
          </h1>
          {results.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
              {results.map((r) => (
                <AchievementBadge
                  key={r.turnIndex}
                  achievement={r.achievement}
                  turnIndex={r.turnIndex}
                  score={r.score}
                  isSelected={selectedTurnIndex === r.turnIndex}
                  onClick={() =>
                    setSelectedTurnIndex((prev) =>
                      prev === r.turnIndex ? null : r.turnIndex
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="w-10 flex-shrink-0" />
          )}
        </div>
      </header>

      {!hasStarted ? (
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ffe8ec] to-[#ffb3c1] flex items-center justify-center text-3xl mb-4 shadow-bubble">
              💬
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              영어로 대화해 볼까요?
            </h2>
            <p className="text-gray-600 text-sm mb-6 max-w-xs whitespace-pre-line">
              질문에 영어로 답해 보세요.
              {"\n"}수준에 맞는 반응과 다음 질문이 나와요.
            </p>
            <button
              type="button"
              onClick={startConversation}
              className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 shadow-bubble transition duration-200"
            >
              시작하기
            </button>
          </div>
        </main>
      ) : freeTalkingIntro ? (
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-300 to-sky-400 flex items-center justify-center text-3xl mb-4 shadow-bubble text-white">
              ✨
            </div>
            <h2 className="text-xl font-semibold text-sky-800 mb-2">
              Free Talking 단계
            </h2>
            <p className="text-sky-700/90 text-sm mb-6 max-w-xs whitespace-pre-line">
              1~3턴을 잘 마쳤어요.
              {"\n"}이제 하고 싶은 주제로 자유롭게 대화해 보세요.
            </p>
            <button
              type="button"
              onClick={startFreeTalking}
              className="px-6 py-3 rounded-xl font-medium text-sky-600 bg-sky-100 border border-sky-200 hover:bg-sky-200/80 shadow-bubble transition duration-200"
            >
              시작하기
            </button>
          </div>
        </main>
      ) : isAdvancedPhase ? (
        <>
          <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-xl mx-auto w-full pb-24">
            {advancedTurnRows.map((row) => (
              <TurnRow
                key={row.turnIndex}
                turnIndex={row.turnIndex}
                questionText={row.questionText}
                imageUrl={row.imageUrl}
                answerText={row.answerText}
                bubbleTheme="sky"
                onQuestionSpeak={speakGirl}
              />
            ))}
          </main>
          {isWaitingAnswer && (
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-sky-50/95 backdrop-blur border-t border-sky-200 px-4 py-3 max-w-xl mx-auto">
              {sttError ? (
                <p className="text-amber-900 text-xs mb-2 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1.5">
                  {sttError}
                  <button type="button" className="ml-2 underline" onClick={() => clearSttError()}>
                    닫기
                  </button>
                </p>
              ) : null}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="영어로 답해 보세요"
                  className="flex-1 rounded-xl border border-sky-200 bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                  autoFocus
                />
                <VoiceInputButton
                  isListening={isListening}
                  onToggle={toggle}
                  supported={supported}
                  disabled={isSubmitting}
                  theme="sky"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() || isSubmitting}
                  className="flex-shrink-0 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-sky-500 to-sky-400 disabled:opacity-50 disabled:cursor-not-allowed hover:from-sky-600 hover:to-sky-500 shadow-bubble transition"
                >
                  전송
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-xl mx-auto w-full pb-24">
            {turnRows.map((row) => (
              <TurnRow
                key={row.turnIndex}
                turnIndex={row.turnIndex}
                questionText={row.questionText}
                imageUrl={row.imageUrl}
                answerText={row.answerText}
                onQuestionSpeak={speakMale}
              />
            ))}
          </main>
          {isWaitingAnswer && (
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-pink-100 px-4 py-3 max-w-xl mx-auto">
              {sttError ? (
                <p className="text-amber-900 text-xs mb-2 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1.5">
                  {sttError}
                  <button type="button" className="ml-2 underline" onClick={() => clearSttError()}>
                    닫기
                  </button>
                </p>
              ) : null}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="영어로 답해 보세요"
                  className="flex-1 rounded-xl border border-pink-200 bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  autoFocus
                />
                <VoiceInputButton
                  isListening={isListening}
                  onToggle={toggle}
                  supported={supported}
                  disabled={isSubmitting}
                  theme="pink"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() || isSubmitting}
                  className="flex-shrink-0 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-pink-500 to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-rose-500 shadow-bubble transition"
                >
                  전송
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {toast && (
        <ScoreToast
          achievement={toast.achievement}
          score={toast.score}
          reaction={toast.reaction}
          corrected={toast.corrected}
          feedback={toast.feedback}
          onClose={() => {
            setToast(null);
            if (goodJobPendingRef.current) {
              goodJobPendingRef.current = false;
              setShowGoodJobPopup(true);
            }
          }}
        />
      )}

      {showGoodJobPopup && (
        <GoodJobPopup results={results} onClose={goBackToStart} />
      )}
    </div>
  );
}
