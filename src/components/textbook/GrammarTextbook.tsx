"use client";

import { useCallback, useEffect, useState } from "react";
import { GRAMMAR_ITEMS, GRAMMAR_KO } from "@/data/textbookSamples";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTTS } from "@/hooks/useTTS";
import VoiceInputButton from "@/components/VoiceInputButton";
import { playClick } from "@/lib/sounds";

type GrammarIntro = {
  firstPromptKo?: string;
  firstSentenceEn?: string;
  drills?: Array<{
    promptKo?: string;
    targetPhrase?: string;
    acceptableHints?: string[];
  }>;
};

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

export default function GrammarTextbook() {
  const { speak } = useTTS({ gender: "female", lang: "en-US" });
  const [section, setSection] = useState<1 | 2 | 3>(1);
  const [itemIdx, setItemIdx] = useState(0);
  const [input, setInput] = useState("");
  const [gradeText, setGradeText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [intro, setIntro] = useState<GrammarIntro | null>(null);
  const [introError, setIntroError] = useState<string | null>(null);
  const [introLoading, setIntroLoading] = useState(true);

  const [drillIdx, setDrillIdx] = useState(0);

  const phrase = GRAMMAR_ITEMS[itemIdx] ?? "";
  const drills = intro?.drills ?? [];
  const drill = drills[drillIdx];

  const { isListening, toggle, supported, sttError, clearSttError, interimText, isProcessing } =
    useSpeechRecognition({
      lang: "en-US",
      onResult: (text) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
    });

  const loadIntro = useCallback(async () => {
    setIntroLoading(true);
    setIntroError(null);
    try {
      const r = (await apiTextbook("grammar_intro", {
        items: [...GRAMMAR_ITEMS],
      })) as GrammarIntro;
      setIntro(r);
    } catch (e) {
      setIntroError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setIntroLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIntro();
  }, [loadIntro]);

  const gradeRepeat = async () => {
    if (!input.trim()) return;
    playClick();
    setLoading(true);
    setGradeText(null);
    try {
      const r = (await apiTextbook("word_match_simple", {
        target: phrase,
        spoken: input.trim(),
      })) as { correct?: boolean; score?: number; feedbackKo?: string };
      setGradeText(`${r.correct ? "✓" : "△"} ${r.score ?? 0}점 — ${r.feedbackKo ?? ""}`);
    } catch (e) {
      setGradeText(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setLoading(false);
    }
  };

  const gradeDrill = async () => {
    if (!drill?.promptKo || !drill?.targetPhrase || !input.trim()) return;
    playClick();
    setLoading(true);
    setGradeText(null);
    try {
      const r = (await apiTextbook("grammar_grade", {
        promptKo: drill.promptKo,
        targetPhrase: drill.targetPhrase,
        acceptableHints: drill.acceptableHints ?? [],
        spoken: input.trim(),
      })) as { correct?: boolean; score?: number; feedbackKo?: string; modelAnswerEn?: string };
      setGradeText(
        `${r.correct ? "✓" : "△"} ${r.score ?? 0}점 — ${r.feedbackKo ?? ""}${r.modelAnswerEn ? ` / 예: ${r.modelAnswerEn}` : ""}`
      );
    } catch (e) {
      setGradeText(e instanceof Error ? e.message : "채점 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
        <h2 className="text-sm font-semibold text-amber-900 mb-2">C. 문법 교재 (a / an)</h2>
        <p className="text-xs text-amber-900/80 mb-2">연습 어구</p>
        <div className="flex flex-wrap gap-1.5">
          {GRAMMAR_ITEMS.map((w) => (
            <span
              key={w}
              className="text-xs px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-950"
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {introLoading ? <p className="text-sm text-gray-500">문법 미션 불러오는 중…</p> : null}
      {introError ? (
        <p className="text-amber-800 text-sm bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {introError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 1 as const, title: "따라하기" },
            { id: 2 as const, title: "음성 인식" },
            { id: 3 as const, title: "변형·음성 채점" },
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
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      {section === 1 && (
        <div className="rounded-2xl border border-amber-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-semibold text-amber-950">{phrase}</p>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-950"
              onClick={() => speak(phrase)}
            >
              듣기
            </button>
          </div>
          <p className="text-xs text-gray-500">표현을 듣고 따라 말해 보세요.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-amber-200"
              onClick={() => {
                playClick();
                setItemIdx((i) => (i + GRAMMAR_ITEMS.length - 1) % GRAMMAR_ITEMS.length);
                setGradeText(null);
              }}
            >
              이전
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-amber-200"
              onClick={() => {
                playClick();
                setItemIdx((i) => (i + 1) % GRAMMAR_ITEMS.length);
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
              className="flex-1 rounded-xl border border-amber-200 px-3 py-2 text-sm"
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
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm disabled:opacity-50"
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
        <div className="rounded-2xl border border-amber-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-semibold text-amber-950">{GRAMMAR_KO[phrase] ?? phrase}</p>
          </div>
          <p className="text-xs text-gray-500">한글 뜻을 보고 영어로 말해 보세요. (a/an 사용)</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-amber-200"
              onClick={() => {
                playClick();
                setItemIdx((i) => (i + GRAMMAR_ITEMS.length - 1) % GRAMMAR_ITEMS.length);
                setGradeText(null);
              }}
            >
              이전
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-amber-200"
              onClick={() => {
                playClick();
                setItemIdx((i) => (i + 1) % GRAMMAR_ITEMS.length);
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
              className="flex-1 rounded-xl border border-amber-200 px-3 py-2 text-sm"
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
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm disabled:opacity-50"
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
        <div className="rounded-2xl border border-amber-100 bg-white p-4 space-y-3">
          {!drill ? (
            <p className="text-sm text-gray-500">
              변형 미션이 없어요. 위쪽 오류 메시지를 확인하거나 새로고침 해 보세요.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-amber-950">
                {(drill.promptKo ?? "").replace(/\s*[.,]?\s*영어로\s*말해\s*(봐|보세요)\.?\s*$/i, "").trim()}
              </p>
              <p className="text-xs text-gray-500">영어로 말해 보세요. (문법 요소 a/an 포함)</p>
              <div className="flex gap-2 flex-wrap">
                {drills.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      drillIdx === i ? "border-amber-500 bg-amber-50" : "border-gray-200"
                    }`}
                    onClick={() => {
                      playClick();
                      setDrillIdx(i);
                      setGradeText(null);
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 rounded-xl border border-amber-200 px-3 py-2 text-sm"
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
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm disabled:opacity-50"
                disabled={!input.trim() || loading}
                onClick={() => void gradeDrill()}
              >
                확인
              </button>
            </>
          )}
          {gradeText ? <p className="text-sm text-gray-700">{gradeText}</p> : null}
        </div>
      )}
    </div>
  );
}
