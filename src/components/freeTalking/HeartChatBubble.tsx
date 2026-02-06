"use client";

interface HeartChatBubbleProps {
  text: string;
}

/** 인스타 릴스 스타일 하트 모양 채팅 버블 (하트 느낌의 둥근 버블) */
export default function HeartChatBubble({ text }: HeartChatBubbleProps) {
  return (
    <div className="relative flex justify-center">
      <div
        className="relative inline-block max-w-[85%] rounded-[2rem] px-6 py-4 text-white font-medium text-center text-base"
        style={{
          background: "linear-gradient(135deg, #ff8fab 0%, #ff6b9d 50%, #ff4d7a 100%)",
          boxShadow: "0 4px 24px rgba(255, 77, 122, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
