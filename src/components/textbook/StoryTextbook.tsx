"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STORY_BLANKS,
  STORY_PASSAGE,
  STORY_PASSAGE_LINES,
} from "@/data/textbookSamples";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTTS } from "@/hooks/useTTS";
import VoiceInputButton from "@/components/VoiceInputButton";
import { playClick } from "@/lib/sounds";

type StoryInit = {
  comprehension?: Array<{
    questionEn?: string;
    acceptableKeywords?: string[];
    hintKo?: string;
  }>;
  grammarDrills?: Array<{
    baseSentenceEn?: string;
    instructionKo?: string;
    instructionEn?: string;
    acceptableHints?: string[];
  }>;
};

const STEPS = [
  { id: 1, title: "교재 쉐도잉", desc: "문단을 통으로 보고, 강조된 문장을 따라 말해 보세요." },
  { id: 2, title: "빈칸 통문장", desc: "빈칸이 포함된 문장을 통째로 말해 보세요." },
  { id: 3, title: "이해 질문", desc: "질문을 듣고 영어로 답해 보세요." },
  { id: 4, title: "문법 바꿔 말하기", desc: "지시에 맞게 문장을 바꿔 말해 보세요." },
  { id: 5, title: "자유 말하기·채점", desc: "교재 내용을 설명하거나 묘사해 보세요." },
] as const;

async function apiTextbook(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/textbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  });
  const data = (await res.json()) as { error?: string; result?: unknown; raw?: string };
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data.result;
}

export default function StoryTextbook() {
  const { speak } = useTTS({ gender: "female", lang: "en-US" });
  const [step, setStep] = useState(1);
  const [init, setInit] = useState<StoryInit | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  const [lineIdx, setLineIdx] = useState(0);
  const [shadowScore, setShadowScore] = useState<number | null>(null);
  const [shadowResult, setShadowResult] = useState<string | null>(null);
  const [shadowLoading, setShadowLoading] = useState(false);

  const [blankIdx, setBlankIdx] = useState(0);
  const [blankResult, setBlankResult] = useState<string | null>(null);
  const [blankLoading, setBlankLoading] = useState(false);

  const [cqIdx, setCqIdx] = useState(0);
  const [cqResult, setCqResult] = useState<string | null>(null);
  const [cqLoading, setCqLoading] = useState(false);

  const [gIdx, setGIdx] = useState(0);
  const [gResult, setGResult] = useState<string | null>(null);
  const [gLoading, setGLoading] = useState(false);

  const [freeResult, setFreeResult] = useState<string | null>(null);
  const [freeLoading, setFreeLoading] = useState(false);

  const [input, setInput] = useState("");

  const { isListening, toggle, supported, sttError, clearSttError, isProcessing } =
    useSpeechRecognition({
      lang: "en-US",
      onResult: (text) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
    });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = (await apiTextbook("story_init", { passage: STORY_PASSAGE })) as StoryInit;
        if (!cancelled) setInit(r);
      } catch (e) {
        if (!cancelled) setInitError(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const blank = STORY_BLANKS[blankIdx];
  const cqList = init?.comprehension ?? [];
  const cq = cqList[cqIdx];
  const gList = init?.grammarDrills ?? [];
  const g = gList[gIdx];

  const runShadowAnalysis = useCallback(async () => {
    const t = input.trim();
    if (!t) return;
    playClick();
    setShadowScore(null);
    try {
      const r = (await apiTextbook("story_shadow_grade", {
        passage: STORY_PASSAGE,
        spoken: t,
      })) as { score?: number; feedbackKo?: string; overallComment?: string };
      setShadowScore(r.score ?? 0);
      setShadowResult(
        r.feedbackKo
          ? r.feedbackKo + (r.overallComment ? ` (${r.overallComment})` : "")
          : null
      );
    } catch (e) {
      setShadowResult(e instanceof Error ? e.message : "분석 실패");
    }
  }, [input]);

  const gradeBlank = async () => {
    if (!blank || !input.trim()) return;
    playClick();
    setBlankLoading(true);
    setBlankResult(null);
    try {
      const r = (await apiTextbook("story_grade_blank", {
        fullSentence: blank.fullSentence,
        spoken: input.trim(),
      })) as { correct?: boolean; score?: number; feedbackKo?: string };
      setBlankResult(
        `${r.correct ? "✓" : "△"} ${r.score ?? 0}점 — ${r.feedbackKo ?? ""}`
      );
    } catch (e) {
      setBlankResult(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setBlankLoading(false);
    }
  };

  const gradeCq = async () => {
    if (!cq?.questionEn || !input.trim()) return;
    playClick();
    setCqLoading(true);
    setCqResult(null);
    try {
      const r = (await apiTextbook("story_grade_comprehension", {
        questionEn: cq.questionEn,
        acceptableKeywords: cq.acceptableKeywords ?? [],
        spoken: input.trim(),
      })) as { correct?: boolean; score?: number; feedbackKo?: string };
      setCqResult(`${r.correct ? "✓" : "△"} ${r.score ?? 0}점 — ${r.feedbackKo ?? ""}`);
    } catch (e) {
      setCqResult(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setCqLoading(false);
    }
  };

  const gradeGrammar = async () => {
    if (!g?.baseSentenceEn || !input.trim()) return;
    playClick();
    setGLoading(true);
    setGResult(null);
    try {
      const r = (await apiTextbook("story_grade_grammar", {
        baseSentenceEn: g.baseSentenceEn,
        instructionEn: g.instructionEn ?? "",
        acceptableHints: g.acceptableHints ?? [],
        spoken: input.trim(),
      })) as { correct?: boolean; score?: number; feedbackKo?: string; modelAnswerEn?: string };
      setGResult(
        `${r.correct ? "✓" : "△"} ${r.score ?? 0}점 — ${r.feedbackKo ?? ""}${r.modelAnswerEn ? ` / 예: ${r.modelAnswerEn}` : ""}`
      );
    } catch (e) {
      setGResult(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setGLoading(false);
    }
  };

  const gradeFree = async () => {
    if (!input.trim()) return;
    playClick();
    setFreeLoading(true);
    setFreeResult(null);
    try {
      const r = (await apiTextbook("story_grade_free", {
        passage: STORY_PASSAGE,
        spoken: input.trim(),
      })) as { score?: number; feedbackKo?: string; highlightEn?: string };
      setFreeResult(
        `${r.score ?? 0}점 — ${r.feedbackKo ?? ""}${r.highlightEn ? ` (${r.highlightEn})` : ""}`
      );
    } catch (e) {
      setFreeResult(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setFreeLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-emerald-800 mb-1">A. 스토리 교재</h2>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
          {STORY_PASSAGE}
        </pre>
      </div>

      {initError ? (
        <p className="text-amber-800 text-sm bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          미션 3·4용 데이터를 불러오지 못했어요: {initError}
        </p>
      ) : null}
      {initLoading ? (
        <p className="text-sm text-gray-500">이해·문법 미션 준비 중…</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              playClick();
              setStep(s.id);
              setInput("");
              setShadowScore(null);
              setShadowResult(null);
              setBlankResult(null);
              setCqResult(null);
              setGResult(null);
              setFreeResult(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              step === s.id
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
            }`}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">{STEPS.find((x) => x.id === step)?.desc}</p>

      {step === 1 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
          <div className="rounded-xl border border-emerald-200/80 bg-white p-3">
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
              {STORY_PASSAGE_LINES.map((s, i) => (
                <span key={i}>
                  <span
                    className={
                      i === lineIdx
                        ? "font-semibold text-emerald-700 bg-emerald-100/60 px-0.5 -mx-0.5 rounded"
                        : "text-gray-500"
                    }
                  >
                    {s}
                  </span>
                  {i < STORY_PASSAGE_LINES.length - 1 ? "\n" : ""}
                </span>
              ))}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800"
                onClick={() => speak(STORY_PASSAGE_LINES[lineIdx] ?? "")}
              >
                현재 문장 듣기
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-lg border border-emerald-200 bg-white"
                onClick={() => setLineIdx((i) => (i + STORY_PASSAGE_LINES.length - 1) % STORY_PASSAGE_LINES.length)}
              >
                이전
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-lg border border-emerald-200 bg-white"
                onClick={() => setLineIdx((i) => (i + 1) % STORY_PASSAGE_LINES.length)}
              >
                다음
              </button>
            </div>
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
              className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <VoiceInputButton
              isListening={isListening}
              onToggle={toggle}
              supported={supported}
              disabled={isProcessing}
              theme="sky"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
              disabled={!input.trim() || shadowLoading}
              onClick={() => void runShadowAnalysis()}
            >
              {shadowLoading ? "분석 중…" : "확인"}
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
              onClick={() => {
                playClick();
                setInput("");
                setShadowScore(null);
                setShadowResult(null);
              }}
            >
              입력 지우기
            </button>
          </div>
          {shadowScore !== null ? (
            <div className="rounded-xl bg-emerald-100/60 p-3">
              <p className="text-sm font-medium text-emerald-800">쉐도잉 점수: {shadowScore} / 100</p>
              {shadowResult ? <p className="text-sm text-gray-700 mt-1">{shadowResult}</p> : null}
            </div>
          ) : null}
        </div>
      )}

      {step === 2 && blank && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 space-y-3">
          <p className="text-lg font-medium text-gray-800">{blank.display}</p>
          <div className="flex gap-2">
            {STORY_BLANKS.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={`text-xs px-2 py-1 rounded-lg border ${
                  blankIdx === i ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                }`}
                onClick={() => {
                  playClick();
                  setBlankIdx(i);
                  setBlankResult(null);
                }}
              >
                빈칸 {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <VoiceInputButton
              isListening={isListening}
              onToggle={toggle}
              supported={supported}
              disabled={blankLoading || isProcessing}
              theme="sky"
            />
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
            disabled={!input.trim() || blankLoading}
            onClick={() => void gradeBlank()}
          >
            확인
          </button>
          {blankResult ? <p className="text-sm text-gray-700">{blankResult}</p> : null}
        </div>
      )}

      {step === 3 && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 space-y-3">
          {!cq ? (
            <p className="text-sm text-gray-500">질문 데이터가 없어요. API 연결을 확인해 주세요.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-800">{cq.questionEn}</p>
              {cq.hintKo ? <p className="text-xs text-gray-500">힌트: {cq.hintKo}</p> : null}
              <div className="flex gap-2">
                {cqList.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      cqIdx === i ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                    }`}
                    onClick={() => {
                      playClick();
                      setCqIdx(i);
                      setCqResult(null);
                    }}
                  >
                    Q{i + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <VoiceInputButton
                  isListening={isListening}
                  onToggle={toggle}
                  supported={supported}
                  disabled={cqLoading || isProcessing}
                  theme="sky"
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
                disabled={!input.trim() || cqLoading}
                onClick={() => void gradeCq()}
              >
                확인
              </button>
              {cqResult ? <p className="text-sm text-gray-700">{cqResult}</p> : null}
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 space-y-3">
          {!g ? (
            <p className="text-sm text-gray-500">문법 미션이 없어요.</p>
          ) : (
            <>
              <p className="text-sm text-gray-800 font-medium">{g.baseSentenceEn}</p>
              <p className="text-sm text-emerald-800">{g.instructionKo}</p>
              <div className="flex gap-2 flex-wrap">
                {gList.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      gIdx === i ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                    }`}
                    onClick={() => {
                      playClick();
                      setGIdx(i);
                      setGResult(null);
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <VoiceInputButton
                  isListening={isListening}
                  onToggle={toggle}
                  supported={supported}
                  disabled={gLoading || isProcessing}
                  theme="sky"
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
                disabled={!input.trim() || gLoading}
                onClick={() => void gradeGrammar()}
              >
                확인
              </button>
              {gResult ? <p className="text-sm text-gray-700">{gResult}</p> : null}
            </>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 space-y-3">
          <p className="text-sm text-gray-600">
            교재에 나온 인물·상황을 영어로 설명하거나 이야기해 보세요.
          </p>
          <div className="flex gap-2 items-center">
            <textarea
              className="flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm min-h-[100px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <VoiceInputButton
              isListening={isListening}
              onToggle={toggle}
              supported={supported}
              disabled={freeLoading || isProcessing}
              theme="sky"
            />
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50"
            disabled={!input.trim() || freeLoading}
            onClick={() => void gradeFree()}
          >
            확인
          </button>
          {freeResult ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{freeResult}</p> : null}
        </div>
      )}
    </div>
  );
}
