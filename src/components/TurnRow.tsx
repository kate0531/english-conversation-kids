"use client";

import Image from "next/image";
import ChatBubble from "./ChatBubble";

interface TurnRowProps {
  turnIndex: number;
  questionText: string;
  imageUrl?: string;
  answerText?: string;
  /** 대답 말풍선 테마. Free Talking(4~5턴)일 때 "sky" */
  bubbleTheme?: "pink" | "sky";
  /** 질문 말풍선 클릭 시 TTS 재생 */
  onQuestionSpeak?: (text: string) => void;
}

/** 1~3턴용: 왼쪽 질문 말풍선(글만), 오른쪽 위에 사진·아래에 답 말풍선 */
export default function TurnRow({
  turnIndex,
  questionText,
  imageUrl,
  answerText,
  bubbleTheme = "pink",
  onQuestionSpeak,
}: TurnRowProps) {
  return (
    <div className="flex gap-3 items-start w-full" data-turn={turnIndex}>
      {/* 왼쪽: 질문만 (사진 없음) */}
      <div className="flex-1 min-w-0">
        <ChatBubble
          side="left"
          text={questionText}
          turnIndex={turnIndex}
          onSpeak={onQuestionSpeak}
        />
      </div>
      {/* 오른쪽: 사진 위, 말풍선 아래 */}
      <div className="flex flex-col items-end gap-2 w-[120px] sm:w-[140px] flex-shrink-0">
        {imageUrl && (
          <div className="rounded-xl overflow-hidden bg-white/80 shadow-bubble w-full aspect-square">
            <Image
              src={imageUrl}
              alt=""
              width={140}
              height={140}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
        )}
        {answerText != null && (
          <ChatBubble
            side="right"
            text={answerText}
            turnIndex={turnIndex}
            theme={bubbleTheme}
          />
        )}
      </div>
    </div>
  );
}
