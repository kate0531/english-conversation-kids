"use client";

import { useCallback, useEffect, useState } from "react";
import { WORD_LIST, WORD_KO } from "@/data/textbookSamples";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTTS } from "@/hooks/useTTS";
import VoiceInputButton from "@/components/VoiceInputButton";
import { playClick } from "@/lib/sounds";

type QuizItem = { target?: string; sentenceEn?: string };

async function apiTextbook(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/textbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  });
  const data = (await res.json()) as { error?: string; result?: unknown };
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data.result;
}

export default function WordTextbook() {
  const { speak } = useTTS({ gender: "female", lang: "en-US" });
  const [section, setSection] = useState<1 | 2 | 3>(1);
  const [wordIdx, setWordIdx] = useState(0);
  const [input, setInput] = useState("");
  const [gradeText, setGradeText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const word = WORD_LIST[wordIdx] ?? "";
  const quiz = quizItems[quizIdx];

  const { isListening, toggle, supported, sttError, clearSttError, interimText, isProcessing } =
    useSpeechRecognition({
      lang: "en-US",
      onResult: (text) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
    });

  const loadQuiz = useCallback(async () => {
    setQuizLoading(true);
    setQuizError(null);
    try {
      const r = (await apiTextbook("word_quiz_build", {
        words: [...WORD_LIST],
      })) as { items?: QuizItem[] };
      const items = Array.isArray(r?.items) ? r.items : [];
      setQuizItems(items);
      setQuizIdx(0);
    } catch (e) {
      setQuizError(e instanceof Error ? e.message : "퀴즈 생성 실패");
    } finally {
      setQuizLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === 3 && quizItems.length === 0 && !quizLoading && !quizError) {
      void loadQuiz();
    }
  }, [section, quizItems.length, quizLoading, quizError, loadQuiz]);

  const gradeRepeat = async () => {
    if (!input.trim()) return;
    playClick();
    setLoading(true);
    setGradeText(null);
    try {
      const r = (await apiTextbook("word_match_simple", {
        target: word,
        spoken: input.trim(),
      })) as { correct?: boolean; score?: number; feedbackKo?: string };
      setGradeText(`${r.correct ? "✓" : "△"} ${r.score ?? 0}점 — ${r.feedbackKo ?? ""}`);
    } catch (e) {
      setGradeText(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setLoading(false);
    }
  };

  const gradeQuiz = async () => {
    if (!quiz?.target || !input.trim()) return;
    playClick();
    setLoading(true);
    setGradeText(null);
    try {
      const r = (await apiTextbook("word_quiz_grade", {
        target: quiz.target,
        sentenceEn: quiz.sentenceEn ?? "",
        spoken: input.trim(),
      })) as { correct?: boolean; score?: number; feedbackKo?: string };
      setGradeText(`${r.correct ? "✓" : "△"} ${r.score ?? 0}점 — ${r.feedbackKo ?? ""}`);
    } catch (e) {
      setGradeText(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
        <h2 className="text-sm font-semibold text-violet-900 mb-2">B. Word 교재</h2>
        <p className="text-xs text-violet-800/80 mb-2">단어 목록</p>
        <div className="flex flex-wrap gap-1.5">
          {WORD_LIST.map((w) => (
            <span
              key={w}
              className="text-xs px-2 py-0.5 rounded-full bg-white border border-violet-200 text-violet-900"
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 1 as const, title: "따라하기" },
            { id: 2 as const, title: "음성 인식" },
            { id: 3 as const, title: "문장 속 단어" },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              playClick();
              setSection(s.id);
              setInput("");
              setGradeText(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              section === s.id
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      {section === 1 && (
        <div className="rounded-2xl border border-violet-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-semibold text-violet-950">{word}</p>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg bg-violet-100 text-violet-900"
              onClick={() => speak(word)}
            >
              듣기
            </button>
          </div>
          <p className="text-xs text-gray-500">단어를 듣고 같은 말로 따라 해 보세요.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-violet-200"
              onClick={() => {
                playClick();
                setWordIdx((i) => (i + WORD_LIST.length - 1) % WORD_LIST.length);
                setGradeText(null);
              }}
            >
              이전
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-violet-200"
              onClick={() => {
                playClick();
                setWordIdx((i) => (i + 1) % WORD_LIST.length);
                setGradeText(null);
              }}
            >
              다음
            </button>
          </div>
          {sttError ? (
            <p className="text-amber-900 text-xs bg-amber-100 border border-amber-300 rounded-lg px-2 py-1.5">
              {sttError}
              <button type="button" className="ml-2 underline" onClick={() => clearSttError()}>
                닫기
              </button>
            </p>
          ) : null}
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 rounded-xl border border-violet-200 px-3 py-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <VoiceInputButton
              isListening={isListening}
              onToggle={toggle}
              supported={supported}
              disabled={loading || isProcessing}
              theme="sky"
            />
          </div>
          {interimText ? <p className="text-xs text-gray-500">{interimText}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm disabled:opacity-50"
              disabled={!input.trim() || loading}
              onClick={() => void gradeRepeat()}
            >
              확인
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
              onClick={() => {
                playClick();
                setInput("");
                setGradeText(null);
              }}
            >
              지우기
            </button>
          </div>
          {gradeText ? <p className="text-sm text-gray-700">{gradeText}</p> : null}
        </div>
      )}

      {section === 2 && (
        <div className="rounded-2xl border border-violet-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-semibold text-violet-950">{WORD_KO[word] ?? word}</p>
          </div>
          <p className="text-xs text-gray-500">한글 뜻을 보고 영어로 말해 보세요.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-violet-200"
              onClick={() => {
                playClick();
                setWordIdx((i) => (i + WORD_LIST.length - 1) % WORD_LIST.length);
                setGradeText(null);
              }}
            >
              이전
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-violet-200"
              onClick={() => {
                playClick();
                setWordIdx((i) => (i + 1) % WORD_LIST.length);
                setGradeText(null);
              }}
            >
              다음
            </button>
          </div>
          {sttError ? (
            <p className="text-amber-900 text-xs bg-amber-100 border border-amber-300 rounded-lg px-2 py-1.5">
              {sttError}
              <button type="button" className="ml-2 underline" onClick={() => clearSttError()}>
                닫기
              </button>
            </p>
          ) : null}
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 rounded-xl border border-violet-200 px-3 py-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <VoiceInputButton
              isListening={isListening}
              onToggle={toggle}
              supported={supported}
              disabled={loading || isProcessing}
              theme="sky"
            />
          </div>
          {interimText ? <p className="text-xs text-gray-500">{interimText}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm disabled:opacity-50"
              disabled={!input.trim() || loading}
              onClick={() => void gradeRepeat()}
            >
              확인
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
              onClick={() => {
                playClick();
                setInput("");
                setGradeText(null);
              }}
            >
              지우기
            </button>
          </div>
          {gradeText ? <p className="text-sm text-gray-700">{gradeText}</p> : null}
        </div>
      )}

      {section === 3 && (
        <div className="rounded-2xl border border-violet-100 bg-white p-4 space-y-3">
          <p className="text-sm text-gray-600">
            문장을 읽고, 강조된 단어(어구)를 말로 짚어 보세요. API가 문맥 속 인식 여부를 채점합니다.
          </p>
          {quizLoading ? <p className="text-sm text-gray-500">문장 생성 중…</p> : null}
          {quizError ? (
            <p className="text-amber-800 text-sm">{quizError}</p>
          ) : null}
          {!quizLoading && quizItems.length === 0 && !quizError ? (
            <button
              type="button"
              className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm"
              onClick={() => void loadQuiz()}
            >
              문장 퀴즈 불러오기
            </button>
          ) : null}
          {quiz ? (
            <>
              <p className="text-base text-gray-900 leading-relaxed">{quiz.sentenceEn}</p>
              <p className="text-xs text-violet-700">찾을 단어/어구: {quiz.target}</p>
              <div className="flex gap-2 flex-wrap">
                {quizItems.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      quizIdx === i ? "border-violet-500 bg-violet-50" : "border-gray-200"
                    }`}
                    onClick={() => {
                      playClick();
                      setQuizIdx(i);
                      setGradeText(null);
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 rounded-xl border border-violet-200 px-3 py-2 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <VoiceInputButton
                  isListening={isListening}
                  onToggle={toggle}
                  supported={supported}
                  disabled={loading || isProcessing}
                  theme="sky"
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm disabled:opacity-50"
                disabled={!input.trim() || loading}
                onClick={() => void gradeQuiz()}
              >
                확인
              </button>
            </>
          ) : null}
          {gradeText ? <p className="text-sm text-gray-700">{gradeText}</p> : null}
        </div>
      )}
    </div>
  );
}
