"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import FreeTalkingGateScreen from "@/components/freeTalking/FreeTalkingGateScreen";
import FreeTalkingMainScreen from "@/components/freeTalking/FreeTalkingMainScreen";
import FreeTalkingPerfectSampleScreen from "@/components/freeTalking/FreeTalkingPerfectSampleScreen";
import FreeTalkingResultScreen from "@/components/freeTalking/FreeTalkingResultScreen";
import FreeTalkingSampleFollowScreen from "@/components/freeTalking/FreeTalkingSampleFollowScreen";
import SentenceEvaluationScreen from "@/components/freeTalking/SentenceEvaluationScreen";
import TaskScoreScreen from "@/components/freeTalking/TaskScoreScreen";
import { getScenarioForTopic } from "@/data/freeTalkingData";
import type { FreeTalkingScenario, FreeTalkingSampleLine } from "@/types/freeTalking";
import { buildThreeTurnScenario } from "@/lib/freeTalkingPlanner";
import Link from "next/link";
import {
  loadRecentProPractice,
  saveRecentProPractice,
  recentSourceLabel,
} from "@/lib/recentLearningHistory";

/** 시나리오 + (교정/추천 문장 우선, 없으면 내가 말한 문장)으로 들어보기/따라 말하기용 대화 생성 */
function buildSampleConversation(
  scenario: FreeTalkingScenario,
  userAnswers: string[],
  correctedSentences: string[]
): FreeTalkingSampleLine[] {
  const userLines =
    correctedSentences.length === userAnswers.length
      ? correctedSentences.map((s) => s.trim())
      : userAnswers.map((s) => s.trim());
  const lines: FreeTalkingSampleLine[] = [];
  let userIndex = 0;
  for (const turn of scenario.conversation) {
    if (turn.speaker === "ai" && turn.text) {
      lines.push({ speaker: "ai", text: turn.text });
    } else if (turn.speaker === "user") {
      const text = userLines[userIndex++] ?? "";
      lines.push({ speaker: "user", text });
    }
  }
  return lines;
}

type FreeTalkingStep =
  | "gate"
  | "main"
  | "result"
  | "perfectSample"
  | "sampleFollow"
  | "evaluation"
  | "taskScore";

export default function FreeTalkingPage() {
  const [step, setStep] = useState<FreeTalkingStep>("gate");
  const [scenario, setScenario] = useState<FreeTalkingScenario | null>(null);
  const [isBuildingScenario, setIsBuildingScenario] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [correctedSentences, setCorrectedSentences] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [tasks, setTasks] = useState<
    { id: string; sentence: string; targetScore: number; completed: boolean }[]
  >([]);
  const [evalSentences, setEvalSentences] = useState<string[]>([]);

  const handleSelectTopic = useCallback(async (topic: string) => {
    if (isBuildingScenario) return;
    setIsBuildingScenario(true);
    try {
      const generated = await buildThreeTurnScenario(topic);
      const s = generated ?? getScenarioForTopic(topic);
      setScenario(s);
      setStep("main");
    } catch {
      const fallback = getScenarioForTopic(topic);
      setScenario(fallback);
      setStep("main");
    } finally {
      setIsBuildingScenario(false);
    }
  }, [isBuildingScenario]);

  const handleTurnComplete = useCallback((answer: string) => {
    setUserAnswers((prev) => [...prev, answer]);
  }, []);

  const handleMainComplete = useCallback(() => {
    setStep("result");
  }, []);

  const handleResultNext = useCallback(() => {
    setStep("perfectSample");
  }, []);

  const handlePerfectSampleNext = useCallback(() => {
    setStep("sampleFollow");
  }, []);

  const handleSampleComplete = useCallback(() => {
    const sentences =
      correctedSentences.length === userAnswers.length
        ? correctedSentences.filter((s) => s.trim().length > 0)
        : userAnswers.filter((s) => s.trim().length > 0);
    setEvalSentences(sentences);
    setStep("evaluation");
  }, [userAnswers, correctedSentences]);

  const handleEvaluationComplete = useCallback((score: number) => {
    setTotalScore((prev) => prev + score);
    // 점수가 낮으면 task 추가 (mock)
    if (score <= 50 && evalSentences.length > 0) {
      setTasks((prev) => [
        ...prev,
        {
          id: `task-${Date.now()}`,
          sentence: evalSentences[0],
          targetScore: 70,
          completed: false,
        },
      ]);
    }
    setStep("taskScore");
  }, [evalSentences]);

  const handleTaskComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    setTotalScore((prev) => prev + 10);
  }, []);

  const handleBackToGate = useCallback(() => {
    setStep("gate");
    setScenario(null);
    setUserAnswers([]);
    setCorrectedSentences([]);
  }, []);

  const handleCorrectionsLoaded = useCallback((corrected: string[]) => {
    setCorrectedSentences(corrected);
  }, []);

  const handleBackFromResult = useCallback(() => {
    setStep("main");
  }, []);

  const handleBackFromPerfectSample = useCallback(() => {
    setStep("result");
  }, []);

  const handleBackFromSample = useCallback(() => {
    setStep("perfectSample");
  }, []);

  const handleBackFromEval = useCallback(() => {
    setStep("sampleFollow");
  }, []);

  const handleBackFromTask = useCallback(() => {
    setStep("gate");
    setTotalScore(0);
    setTasks([]);
  }, []);

  const sampleConversationFromUser = useMemo(() => {
    if (!scenario) return [];
    return buildSampleConversation(scenario, userAnswers, correctedSentences);
  }, [scenario, userAnswers, correctedSentences]);
  const hasUserAnswers = userAnswers.length > 0;

  /** 이번 Free Talking 세션 복습용으로 최근 학습에 저장 */
  useEffect(() => {
    if (!scenario || userAnswers.length === 0) return;
    const lines = buildSampleConversation(scenario, userAnswers, correctedSentences);
    if (!lines.some((l) => l.speaker === "user" && l.text.trim())) return;
    saveRecentProPractice({
      updatedAt: Date.now(),
      source: "freeTalking",
      label: scenario.topic,
      partnerName: scenario.partner?.name ?? "Hailey",
      lines,
    });
  }, [scenario, userAnswers, correctedSentences]);

  /** Pro 단계에서만 저장된 최근 학습 불러오기 (같은 탭에서 Conversation 등을 마친 직후 반영) */
  const storedForPro = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (step !== "perfectSample" && step !== "sampleFollow") return null;
    return loadRecentProPractice();
  }, [step]);

  const sayItLikeAProConversation = useMemo(() => {
    if (scenario && hasUserAnswers) {
      return sampleConversationFromUser;
    }
    if (storedForPro?.lines?.length) {
      return storedForPro.lines;
    }
    return scenario?.perfectSampleConversation ?? [];
  }, [scenario, hasUserAnswers, sampleConversationFromUser, storedForPro]);

  const proPracticePartnerName =
    scenario && hasUserAnswers
      ? scenario.partner?.name ?? "Hailey"
      : storedForPro?.partnerName ?? scenario?.partner?.name ?? "Hailey";

  const proPracticeSubtitle = useMemo(() => {
    if (scenario && hasUserAnswers) {
      return `이번 주제 · ${scenario.topic}`;
    }
    if (storedForPro?.lines?.length) {
      const src = recentSourceLabel(storedForPro.source);
      const lb = storedForPro.label?.trim();
      return lb ? `${src} · ${lb}` : `${src}에서 한 학습을 따라 말해요`;
    }
    return "샘플 대화를 들어보고 따라 말해요";
  }, [scenario, hasUserAnswers, storedForPro]);

  if (step === "gate") {
    return (
      <FreeTalkingGateScreen
        onSelectTopic={handleSelectTopic}
        onBack={() => (window.location.href = "/")}
        isLoadingScenario={isBuildingScenario}
      />
    );
  }

  if (!scenario) return null;

  if (step === "main") {
    return (
      <FreeTalkingMainScreen
        scenario={scenario}
        userAnswers={userAnswers}
        onTurnComplete={handleTurnComplete}
        onAllComplete={handleMainComplete}
        onBack={handleBackToGate}
      />
    );
  }

  if (step === "result") {
    return (
      <FreeTalkingResultScreen
        scenario={scenario}
        userAnswers={userAnswers}
        onNext={handleResultNext}
        onBack={handleBackFromResult}
        onCorrectionsLoaded={handleCorrectionsLoaded}
      />
    );
  }

  if (step === "perfectSample") {
    return (
      <FreeTalkingPerfectSampleScreen
        sampleConversation={sayItLikeAProConversation}
        partnerName={proPracticePartnerName}
        practiceSubtitle={proPracticeSubtitle}
        onNext={handlePerfectSampleNext}
        onBack={handleBackFromPerfectSample}
      />
    );
  }

  if (step === "sampleFollow") {
    return (
      <FreeTalkingSampleFollowScreen
        sampleConversation={sayItLikeAProConversation}
        practiceSubtitle={proPracticeSubtitle}
        onComplete={handleSampleComplete}
        onBack={handleBackFromSample}
      />
    );
  }

  if (step === "evaluation" && evalSentences.length > 0) {
    return (
      <SentenceEvaluationScreen
        sentences={evalSentences}
        onComplete={handleEvaluationComplete}
        onBack={handleBackFromEval}
      />
    );
  }

  if (step === "taskScore") {
    return (
      <TaskScoreScreen
        totalScore={totalScore}
        tasks={tasks}
        onTaskComplete={handleTaskComplete}
        onBack={handleBackFromTask}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Link href="/" className="text-pink-600 hover:underline">
        홈으로
      </Link>
    </div>
  );
}
