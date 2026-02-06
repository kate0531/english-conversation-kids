"use client";

import { useState, useCallback } from "react";
import FreeTalkingGateScreen from "@/components/freeTalking/FreeTalkingGateScreen";
import FreeTalkingMainScreen from "@/components/freeTalking/FreeTalkingMainScreen";
import FreeTalkingPerfectSampleScreen from "@/components/freeTalking/FreeTalkingPerfectSampleScreen";
import FreeTalkingResultScreen from "@/components/freeTalking/FreeTalkingResultScreen";
import FreeTalkingSampleFollowScreen from "@/components/freeTalking/FreeTalkingSampleFollowScreen";
import SentenceEvaluationScreen from "@/components/freeTalking/SentenceEvaluationScreen";
import TaskScoreScreen from "@/components/freeTalking/TaskScoreScreen";
import { getScenarioForTopic } from "@/data/freeTalkingData";
import type { FreeTalkingScenario } from "@/types/freeTalking";
import Link from "next/link";

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
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [tasks, setTasks] = useState<
    { id: string; sentence: string; targetScore: number; completed: boolean }[]
  >([]);
  const [evalSentences, setEvalSentences] = useState<string[]>([]);

  const handleSelectTopic = useCallback((topic: string) => {
    const s = getScenarioForTopic(topic);
    setScenario(s);
    setStep("main");
  }, []);

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
    // 목업: 말한 문장 3개 (고정)
    setEvalSentences([
      "I play soccer.",
      "I play with my friends.",
      "We play at the playground.",
    ]);
    setStep("evaluation");
  }, []);

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

  if (step === "gate") {
    return (
      <FreeTalkingGateScreen
        onSelectTopic={handleSelectTopic}
        onBack={() => (window.location.href = "/")}
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
      />
    );
  }

  if (step === "perfectSample") {
    return (
      <FreeTalkingPerfectSampleScreen
        sampleConversation={scenario.perfectSampleConversation}
        partnerName={scenario.partner?.name}
        onNext={handlePerfectSampleNext}
        onBack={handleBackFromPerfectSample}
      />
    );
  }

  if (step === "sampleFollow") {
    return (
      <FreeTalkingSampleFollowScreen
        sampleConversation={scenario.perfectSampleConversation}
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
