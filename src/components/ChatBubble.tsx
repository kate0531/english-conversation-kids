"use client";

type Side = "left" | "right";

interface ChatBubbleProps {
  side: Side;
  text: string;
  turnIndex?: number;
  /** 대답 말풍선 테마. 미지정 시 연분홍 */
  theme?: "pink" | "sky";
}

/** 질문용: 이미지 없음. 대답용: 말풍선만 (이미지는 부모에서 별도 배치) */
export default function ChatBubble({ side, text, turnIndex, theme = "pink" }: ChatBubbleProps) {
  const isLeft = side === "left";

  const rightBubbleClass =
    theme === "sky"
      ? "bg-gradient-to-br from-sky-100 to-sky-200 text-sky-900 rounded-br-md border border-sky-200/80"
      : "bg-gradient-to-br from-[#ffe8ec] to-[#ffd4dd] text-gray-800 rounded-br-md border border-white/60";

  return (
    <div
      className={`flex w-full max-w-[85%] sm:max-w-[75%] ${
        isLeft ? "mr-auto" : "ml-auto"
      }`}
      data-turn={turnIndex}
    >
      <div
        className={`rounded-2xl px-4 py-3 shadow-bubble ${
          isLeft
            ? "bg-gray-100 text-gray-700 rounded-bl-md"
            : rightBubbleClass
        }`}
      >
        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
