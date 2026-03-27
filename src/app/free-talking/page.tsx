"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import FreeTalkingGateScreen from "@/components/freeTalking/FreeTalkingGateScreen";
import FreeTalkingMainScreen from "@/components/freeTalking/FreeTalkingMainScreen";
import FreeTalkingPerfectSampleScreen from "@/components/freeTalking/FreeTalkingPerfectSampleScreen";
import FreeTalkingResultScreen from "@/components/freeTalking/FreeTalkingResultScreen";
import FreeTalkingSampleFollowScreen from "@/components/freeTalking/FreeTalkingSampleFollowScreen";
import SentenceEvaluationScreen from "@/components/freeTalking/SentenceEvaluationScreen";
import TaskScoreScreen from "@/components/freeTalking/TaskScoreScreen";
import { getScenarioForTopic, getRandomAdultFemalePartnerImageUrl } from "@/data/freeTalkingData";
import type {
  FreeTalkingScenario,
  FreeTalkingSampleLine,
  FreeTalkingConversationTurn,
} from "@/types/freeTalking";
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

function applyRandomPartnerPhoto(s: FreeTalkingScenario): FreeTalkingScenario {
  return {
    ...s,
    partner: {
      ...s.partner,
      imageUrl: getRandomAdultFemalePartnerImageUrl(),
      gender: "female",
    },
  };
}

function fallbackKeywords(topic: string): string[] {
  return topic
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 4);
}

function ensureSevenTurnsWithClosing(s: FreeTalkingScenario): FreeTalkingScenario {
  const pairs: Array<{
    qEn: string;
    qKo: string;
    hint: string;
    keywords: string[];
  }> = [];

  for (let i = 0; i < s.conversation.length; i++) {
    const ai = s.conversation[i];
    const user = s.conversation[i + 1];
    if (ai?.speaker !== "ai" || !ai.text?.trim()) continue;
    if (user?.speaker !== "user") continue;
    pairs.push({
      qEn: ai.text.trim(),
      qKo: ai.koText?.trim() || ai.text.trim(),
      hint: user.hint?.trim() || "I can say a short sentence.",
      keywords: user.keywords?.length ? user.keywords : fallbackKeywords(s.topic),
    });
    i += 1;
  }

  const genericQ = [
    "Can you tell me one more detail?",
    "Why do you feel that way?",
    "When do you usually do that?",
    "Who do you do it with?",
    "What is your favorite part?",
    "Can you give me an example?",
    "How do you feel after that?",
  ];
  const genericKo = [
    "한 가지 더 자세히 말해 줄래?",
    "왜 그렇게 느끼는지 말해 줄래?",
    "보통 언제 그렇게 해?",
    "누구와 함께 해?",
    "가장 좋아하는 부분은 뭐야?",
    "예시를 하나 말해 줄래?",
    "그 후에 기분이 어때?",
  ];

  while (pairs.length < 7) {
    const idx = pairs.length;
    pairs.push({
      qEn: genericQ[idx] ?? "Can you tell me more?",
      qKo: genericKo[idx] ?? "조금 더 말해 줄래?",
      hint: "I can explain it in one short sentence.",
      keywords: fallbackKeywords(s.topic),
    });
  }

  const normalizedPairs = pairs.slice(0, 7);
  const normalizedConversation: FreeTalkingConversationTurn[] = [];
  const normalizedSample: FreeTalkingSampleLine[] = [];

  let turnNo = 1;
  for (const p of normalizedPairs) {
    normalizedConversation.push({
      turn: turnNo++,
      speaker: "ai",
      text: p.qEn,
      koText: p.qKo,
    });
    normalizedConversation.push({
      turn: turnNo++,
      speaker: "user",
      expectedLevel: "short sentence",
      hint: p.hint,
      keywords: p.keywords.length ? p.keywords : fallbackKeywords(s.topic),
    });
    normalizedSample.push({ speaker: "ai", text: p.qEn });
    normalizedSample.push({ speaker: "user", text: p.hint.split("/")[0]?.trim() || p.hint });
  }

  normalizedConversation.push({
    turn: turnNo,
    speaker: "ai",
    text: `Thanks for sharing about ${s.topic}. You did great today.`,
    koText: `${s.topic}에 대해 이야기해줘서 고마워. 오늘 정말 잘했어.`,
  });
  normalizedSample.push({
    speaker: "ai",
    text: `Thanks for sharing about ${s.topic}. You did great today.`,
  });

  return {
    ...s,
    conversation: normalizedConversation,
    perfectSampleConversation: normalizedSample,
  };
}

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
      const genRes = await fetch("/api/free-talking/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        cache: "no-store",
      });
      if (genRes.ok) {
        const data = (await genRes.json()) as { scenario?: FreeTalkingScenario };
        if (data.scenario?.conversation?.length) {
          setScenario(applyRandomPartnerPhoto(ensureSevenTurnsWithClosing(data.scenario)));
          setStep("main");
          return;
        }
      }
      const generated = await buildThreeTurnScenario(topic);
      const s = generated ?? getScenarioForTopic(topic);
      setScenario(applyRandomPartnerPhoto(ensureSevenTurnsWithClosing(s)));
      setStep("main");
    } catch {
      const fallback = getScenarioForTopic(topic);
      setScenario(applyRandomPartnerPhoto(ensureSevenTurnsWithClosing(fallback)));
      setStep("main");
    } finally {
      setIsBuildingScenario(false);
    }
  }, [isBuildingScenario]);

  const handleTurnComplete = useCallback((answer: string) => {
    setUserAnswers((prev) => [...prev, answer]);
  }, []);

  const handleMainComplete = useCallback((finalConversation?: FreeTalkingConversationTurn[]) => {
    if (finalConversation?.length) {
      setScenario((prev) => (prev ? { ...prev, conversation: finalConversation } : prev));
    }
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
