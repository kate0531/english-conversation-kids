"use client";

import { playClick } from "@/lib/sounds";
import type { TurnResult } from "@/types/conversation";
import type { Achievement } from "@/types/conversation";

const ACHIEVEMENT_STYLES: Record<
  Achievement,
  { label: string; border: string; bg: string; text: string }
> = {
  high: {
    label: "상",
    border: "border-sky-300/70",
    bg: "bg-sky-50/90",
    text: "text-sky-800",
  },
  mid: {
    label: "중",
    border: "border-green-300/70",
    bg: "bg-green-50/90",
    text: "text-green-800",
  },
  low: {
    label: "하",
    border: "border-rose-300/70",
    bg: "bg-rose-50/90",
    text: "text-rose-800",
  },
};

interface GoodJobPopupProps {
  results: TurnResult[];
  onClose: () => void;
}

function SentenceItem({
  r,
  turnLabel,
  sectionTheme,
}: {
  r: TurnResult;
  turnLabel: string;
  sectionTheme: "pink" | "blue";
}) {
  const s = ACHIEVEMENT_STYLES[r.achievement];
  const hasCorrection = r.corrected && r.corrected.trim() !== "";
  const cardBorder =
    sectionTheme === "pink"
      ? "border-pink-200/60"
      : "border-sky-200/60";

  return (
    <div
      className={`rounded-xl border ${cardBorder} ${s.border} ${s.bg} ${s.text} p-3 text-left shadow-sm`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold opacity-80">{turnLabel}</span>
        <span className="text-sm font-bold">
          {s.label} · {r.score}점
        </span>
      </div>
      <p className="text-sm font-medium mb-1 break-words">"{r.userAnswer}"</p>
      {hasCorrection && (
        <div className="mt-2 pt-2 border-t border-black/10">
          <p className="text-xs font-medium opacity-80 mb-0.5">교정</p>
          <p className="text-sm font-medium">{r.corrected}</p>
        </div>
      )}
      {r.feedback && r.feedback.trim() !== "" && (
        <p className="text-xs mt-1.5 opacity-90 whitespace-pre-line">
          {r.feedback}
        </p>
      )}
    </div>
  );
}

/** 오늘 결과로 Daily Comment 문구 생성 (1~2줄) */
function getDailyComment(results: TurnResult[]): string {
  if (results.length === 0) return "오늘도 수고했어요.";
  const avg = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );
  const high = results.filter((r) => r.achievement === "high").length;
  const low = results.filter((r) => r.achievement === "low").length;

  if (avg >= 75 && high >= 3)
    return "오늘 발화가 특히 좋았어요. 문장도 자연스럽고 표현이 풍부해요. 이대로 꾸준히 연습해 보세요!";
  if (avg >= 60)
    return "전반적으로 잘 말했어요. 조금만 더 다듬으면 더 자연스러운 문장이 될 거예요.";
  if (low >= 2)
    return "오늘은 조금 어려웠을 수 있어요. 교정 문장을 참고해서 다시 읽어 보면 도움이 될 거예요.";
  return "오늘도 5문장 끝까지 잘 마쳤어요. 내일도 조금씩 연습해 보세요.";
}

export default function GoodJobPopup({ results, onClose }: GoodJobPopupProps) {
  const conversationResults = results.filter((r) => r.turnIndex <= 3);
  const freeTalkingResults = results.filter((r) => r.turnIndex >= 4);
  const dailyComment = getDailyComment(results);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/15 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        playClick();
        onClose();
      }}
      role="dialog"
      aria-label="발화 분석 리포트"
    >
      <div
        className="w-full max-w-md max-h-[85vh] rounded-2xl bg-gradient-to-b from-gray-100 to-gray-200/90 text-gray-800 shadow-xl shadow-black/10 border border-gray-300/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2 bg-gray-400/50 rounded-t-2xl flex-shrink-0" />
        <div className="p-4 flex-shrink-0 bg-gray-50/80 border-b border-gray-200/80">
          <h2 className="text-lg font-bold text-center text-gray-800">
            오늘의 발화 분석 리포트
          </h2>
          <p className="text-xs text-center text-gray-600 mt-1">
            총 5문장 · Conversation 3문장 + Free Talking 2문장
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {conversationResults.length > 0 && (
            <section className="rounded-xl overflow-hidden border border-pink-200/70 bg-gradient-to-br from-pink-50/90 to-rose-50/80 shadow-sm">
              <div className="px-3 py-2 bg-pink-100/80 border-b border-pink-200/60">
                <h3 className="text-sm font-semibold text-pink-800">
                  Conversation (1~3턴)
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {conversationResults.map((r) => (
                  <SentenceItem
                    key={r.turnIndex}
                    r={r}
                    turnLabel={`${r.turnIndex}턴`}
                    sectionTheme="pink"
                  />
                ))}
              </div>
            </section>
          )}

          {freeTalkingResults.length > 0 && (
            <section className="rounded-xl overflow-hidden border border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-blue-50/80 shadow-sm">
              <div className="px-3 py-2 bg-sky-100/80 border-b border-sky-200/60">
                <h3 className="text-sm font-semibold text-sky-800">
                  Free Talking (4~5턴)
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {freeTalkingResults.map((r) => (
                  <SentenceItem
                    key={r.turnIndex}
                    r={r}
                    turnLabel={`${r.turnIndex}턴`}
                    sectionTheme="blue"
                  />
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl overflow-hidden border border-gray-300/70 bg-gray-50/90 shadow-sm">
            <div className="px-3 py-2 bg-gray-200/70 border-b border-gray-300/60">
              <h3 className="text-sm font-semibold text-gray-700">
                Daily Comment
              </h3>
            </div>
            <div className="p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {dailyComment}
              </p>
            </div>
          </section>
        </div>

        <div className="p-4 pt-2 flex-shrink-0 border-t border-gray-300/80 bg-gray-100/80">
          <button
            type="button"
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full py-3 rounded-xl font-medium text-gray-700 bg-gray-200/90 border border-gray-300/80 hover:bg-gray-300/80 transition shadow-sm"
          >
            처음으로
          </button>
        </div>
      </div>
    </div>
  );
}
