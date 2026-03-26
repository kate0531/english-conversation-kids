"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { playClick, playPopup } from "@/lib/sounds";
import CorrectCheck from "./CorrectCheck";
import VoiceMicIcon from "@/components/VoiceMicIcon";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import CelebrationEffect from "./CelebrationEffect";

interface Task {
  id: string;
  sentence: string;
  targetScore: number;
  completed: boolean;
}

interface TaskScoreScreenProps {
  totalScore: number;
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onBack: () => void;
}

export default function TaskScoreScreen({
  totalScore,
  tasks,
  onTaskComplete,
  onBack,
}: TaskScoreScreenProps) {
  const [showPlusTen, setShowPlusTen] = useState(false);
  const [practicingTask, setPracticingTask] = useState<Task | null>(null);
  const [practiceSpoken, setPracticeSpoken] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const celebrateTriggeredRef = useRef(false);

  const handleVoiceResult = useCallback((text: string) => {
    if (!text?.trim()) return;
    setPracticeSpoken(true);
  }, []);

  const { isListening, toggle, sttError, clearSttError } = useSpeechRecognition({
    lang: "en-US",
    onResult: handleVoiceResult,
  });

  const handlePracticeClick = (task: Task) => {
    if (task.completed) return;
    playClick();
    setPracticingTask(task);
    setPracticeSpoken(false);
  };

  const handlePracticeComplete = () => {
    if (!practicingTask) return;
    const taskId = practicingTask.id;
    playPopup();
    setShowPlusTen(true);
    setPracticingTask(null);
    setPracticeSpoken(false);
    setTimeout(() => {
      onTaskComplete(taskId);
      setShowPlusTen(false);
    }, 800);
  };

  const allTasksCompleted = tasks.length > 0 && tasks.every((t) => t.completed);

  useEffect(() => {
    if (celebrateTriggeredRef.current) return;
    celebrateTriggeredRef.current = true;
    setShowCelebrate(true);
    const t = setTimeout(() => setShowCelebrate(false), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 via-pink-50/80 to-rose-50/60 overflow-y-auto">
      <CelebrationEffect show={showCelebrate} message="잘했어요!" />
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-pink-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl border-2 border-pink-200 bg-white text-gray-600 hover:bg-pink-50 flex items-center justify-center"
          >
            ←
          </button>
          <h1 className="text-base font-semibold text-pink-700">오늘의 점수</h1>
          <div className="w-16 text-right font-bold text-pink-600">{totalScore}점</div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full space-y-6">
        <section className="rounded-xl border-2 border-pink-200 bg-white p-4 shadow-md">
          <h2 className="text-sm font-bold text-pink-700 mb-2">Mission</h2>
          <p className="text-gray-500 text-xs mb-4">
            점수가 낮았던 문장들을 연습하고 완료하면 점수가 쌓여요.
          </p>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  task.completed
                    ? "bg-gray-100 text-gray-400"
                    : "bg-pink-50 border border-pink-200 text-gray-800"
                }`}
              >
                <span className={task.completed ? "line-through flex-1" : "flex-1"}>
                  {task.sentence}
                </span>
                {!task.completed && (
                  <button
                    type="button"
                    onClick={() => handlePracticeClick(task)}
                    className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium bg-pink-200 text-pink-800 hover:bg-pink-300 transition"
                  >
                    연습
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 연습 화면: 따라해보세요 + 초록 체크마크 + 취소선 */}
      {practicingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col items-center gap-6">
            <h3 className="text-lg font-semibold text-gray-800">따라해보세요</h3>
            <p className="text-center text-base text-gray-700">{practicingTask.sentence}</p>
            {sttError ? (
              <p className="text-xs text-red-700 text-center bg-red-50 border border-red-200 rounded-lg px-2 py-2">
                {sttError}
                <button type="button" className="block mx-auto mt-1 underline" onClick={() => clearSttError()}>
                  닫기
                </button>
              </p>
            ) : null}
            <button
              type="button"
              onClick={toggle}
              title={isListening ? "클릭하면 중지" : "마이크로 따라 말하기"}
              className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 disabled:opacity-70 transition"
            >
              <VoiceMicIcon size={24} className="text-pink-600" />
            </button>
            {practiceSpoken && (
              <button
                type="button"
                onClick={handlePracticeComplete}
                className="focus:outline-none focus:ring-2 focus:ring-green-400 rounded-full"
              >
                <CorrectCheck />
              </button>
            )}
          </div>
        </div>
      )}

      {showPlusTen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-8 py-6 text-white font-bold text-2xl shadow-xl animate-pop-in">
            +10점! 🎉
          </div>
        </div>
      )}

      {/* 코너 완료 시 어두운 막 + 클릭하면 홈으로 */}
      {allTasksCompleted && (
        <button
          type="button"
          onClick={() => {
            playClick();
            onBack();
          }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400"
          aria-label="홈으로 돌아가기"
        >
          <p className="text-white/90 text-sm font-medium mt-32">클릭하면 홈으로</p>
        </button>
      )}
    </div>
  );
}
