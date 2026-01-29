"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TOPIC_KEYS, getRandomPrompt } from "@/data/writingTopics";
import SentenceLine from "./SentenceLine";
import HomeButton from "@/components/HomeButton";

const NOTE_LINE_HEIGHT = "3rem"; /* 영어 2줄 기준 회색선 높이 */

interface WritingTimePageProps {
  onBackToGate: () => void;
}

export interface LineState {
  text: string;
  corrected?: string;
  feedback?: string;
  hasError: boolean;
}

export default function WritingTimePage({ onBackToGate }: WritingTimePageProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [lines, setLines] = useState<LineState[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [fullAnalysis, setFullAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLoadingBulb, setShowLoadingBulb] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!showLoadingBulb) return;
    const t = setTimeout(() => setShowLoadingBulb(false), 2000);
    return () => clearTimeout(t);
  }, [showLoadingBulb]);

  const handleSelectTopic = useCallback((topic: string) => {
    setSelectedTopic(topic);
    setPrompt(getRandomPrompt(topic));
    setLines([]);
    setCurrentLine("");
    setFullAnalysis(null);
  }, []);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();
      const line = currentLine.trim();
      if (!line) return;

      setIsChecking(true);
      try {
        const res = await fetch("/api/writing/grammar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sentence: line }),
        });
        const data = await res.json();
        const corrected = data.corrected ?? line;
        const feedback = data.feedback ?? "";
        const hasError = corrected !== line;

        setLines((prev) => [
          ...prev,
          { text: line, corrected, feedback, hasError },
        ]);
        setCurrentLine("");
      } catch (_) {
        setLines((prev) => [...prev, { text: line, corrected: undefined, feedback: undefined, hasError: false }]);
        setCurrentLine("");
      }
      setIsChecking(false);
    },
    [currentLine]
  );

  const handleSubmit = useCallback(async () => {
    const line = currentLine.trim();
    const fullParagraph = [...lines.map((l) => l.text), line].filter(Boolean).join("\n");
    if (!fullParagraph) return;

    if (line) {
      setIsChecking(true);
      try {
        const res = await fetch("/api/writing/grammar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sentence: line }),
        });
        const data = await res.json();
        const corrected = data.corrected ?? line;
        const feedback = data.feedback ?? "";
        setLines((prev) => [
          ...prev,
          { text: line, corrected, feedback, hasError: corrected !== line },
        ]);
        setCurrentLine("");
      } catch (_) {
        setLines((prev) => [...prev, { text: line, corrected: undefined, feedback: undefined, hasError: false }]);
        setCurrentLine("");
      }
      setIsChecking(false);
    }

    const paragraphToAnalyze = [...lines.map((l) => l.text), line].filter(Boolean).join("\n");
    if (!paragraphToAnalyze) return;

    setShowLoadingBulb(true);
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/writing/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraph: paragraphToAnalyze }),
      });
      const data = await res.json();
      setFullAnalysis(data.analysis ?? "분석 결과가 없어요.");
    } catch (_) {
      setFullAnalysis("분석을 불러오지 못했어요.");
    }
    setIsAnalyzing(false);
  }, [currentLine, lines]);

  const resetWriting = useCallback(() => {
    setSelectedTopic(null);
    setPrompt("");
    setLines([]);
    setCurrentLine("");
    setFullAnalysis(null);
    setShowLoadingBulb(false);
  }, []);

  const fullParagraph = [...lines.map((l) => l.text), currentLine].filter(Boolean).join("\n");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50 via-[#f5f0ff] to-violet-100/80">
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-violet-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <HomeButton onClick={onBackToGate} />
          <h1 className="text-base font-medium text-violet-700">Writing Time</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-xl mx-auto w-full">
        {!selectedTopic ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">주제를 선택하세요.</p>
            <div className="grid grid-cols-2 gap-2">
              {TOPIC_KEYS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleSelectTopic(topic)}
                  className="rounded-xl border-2 border-violet-200 bg-white px-4 py-3 text-left text-sm font-bold text-gray-800 hover:bg-violet-50 hover:border-violet-300 transition"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 rounded-xl border-2 border-violet-200 bg-white p-4">
                <p className="text-xs text-gray-500 mb-1">질문</p>
                <p className="font-bold text-gray-800">{prompt}</p>
              </div>
              <button
                type="button"
                onClick={resetWriting}
                className="flex-shrink-0 rounded-xl border-2 border-violet-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-violet-50"
              >
                다른 주제
              </button>
            </div>

            <div className="rounded-xl border-2 border-violet-200 bg-[#fefefe] p-4 shadow-inner min-h-[320px] relative overflow-hidden">
              {/* 노트 회색선: 칸 높이 3rem, 패딩으로 텍스트 영역과 동일 시작 */}
              <div className="absolute inset-0 pointer-events-none pt-4 pb-2 px-4" aria-hidden>
                <div className="flex flex-col">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="border-b border-gray-200/80" style={{ height: NOTE_LINE_HEIGHT }} />
                  ))}
                </div>
              </div>
              {/* 텍스트 영역: 선과 같은 pt/pb/px, 각 행 정확히 3rem */}
              <div className="relative pt-4 pb-2 px-4 flex flex-col font-serif text-gray-800 text-base">
                {lines.map((line, i) => (
                  <div key={i} style={{ height: NOTE_LINE_HEIGHT }} className="flex items-start">
                    <SentenceLine
                      text={line.text}
                      corrected={line.corrected}
                      feedback={line.feedback}
                      hasError={line.hasError}
                      lineIndex={i}
                    />
                  </div>
                ))}
                <div style={{ height: NOTE_LINE_HEIGHT }} className="flex items-start">
                  <textarea
                    ref={textareaRef}
                    value={currentLine}
                    onChange={(e) => setCurrentLine(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="영어로 한 문장씩 쓰고 Enter를 누르세요."
                    className="w-full h-[3rem] resize-none bg-transparent border-none outline-none py-0 font-serif text-base text-gray-800 placeholder:text-gray-400 placeholder:text-xs placeholder:font-sans"
                    rows={1}
                    style={{ lineHeight: NOTE_LINE_HEIGHT }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!fullParagraph.trim() || isChecking || isAnalyzing}
                className="w-full rounded-xl py-3 font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-purple-600 shadow-bubble transition"
              >
                {isAnalyzing ? "분석 중..." : "제출하고 분석 보기"}
              </button>

              {showLoadingBulb && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none" aria-hidden>
                  <span className="text-5xl animate-pulse" role="img" aria-label="로딩">💡</span>
                </div>
              )}

              {fullAnalysis && !showLoadingBulb && (
                <div className="rounded-xl border-2 border-violet-200 bg-white shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3 text-white">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <span aria-hidden>📋</span> Writing Report
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">전체 글 분석</p>
                  </div>
                  <div className="p-4 text-gray-800 text-sm leading-relaxed whitespace-pre-line border-t border-gray-100">
                    {fullAnalysis}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
