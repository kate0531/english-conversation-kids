"use client";

interface SentenceLineProps {
  text: string;
  corrected?: string;
  feedback?: string;
  hasError: boolean;
  /** 처음 5문장(0~4)은 교정/피드백이 있으면 항상 툴팁 표시 */
  lineIndex?: number;
}

const MAX_LINES_SHOW_FEEDBACK = 5;

export default function SentenceLine({ text, corrected, feedback, hasError, lineIndex = 0 }: SentenceLineProps) {
  const hasFeedback = Boolean(corrected || feedback);
  const showTooltip = hasFeedback && (lineIndex < MAX_LINES_SHOW_FEEDBACK || hasError);

  const spanClass = hasError
    ? "text-red-600 bg-red-50/50 rounded px-1"
    : hasFeedback
      ? "text-green-700 bg-green-50/50 rounded px-1"
      : "";

  const showFeedbackText = feedback && feedback !== "문법이 맞아요.";

  return (
    <div className="w-full h-[3rem] flex items-start">
      <span
        className={`group relative flex w-full h-[2rem] items-start box-border px-1 ${spanClass}`}
        style={{ lineHeight: "2rem" }}
      >
        {text || " "}
        {showTooltip && (
          <div
            className={`absolute left-0 top-full z-10 mt-0.5 hidden group-hover:block text-left ${
              hasError
                ? "w-72 max-w-[90vw] rounded-lg border border-red-200 bg-red-50/95 shadow-lg py-2 px-3"
                : "rounded-full border border-gray-200 bg-gray-100 shadow-md py-1.5 px-2.5 inline-flex"
            }`}
          >
            {hasError ? (
              <>
                {corrected && <p className="text-green-700 text-xs leading-snug">{corrected}</p>}
                {showFeedbackText && (
                  <p className="text-gray-500 text-[10px] leading-snug mt-0.5">{feedback}</p>
                )}
              </>
            ) : (
              <span className="text-2xl leading-none" aria-label="Good!">👍🏻</span>
            )}
          </div>
        )}
      </span>
    </div>
  );
}
