"use client";

/** 마이크 감지 시 초록색 그린라이트 */
export default function GreenLight({ show }: { show: boolean }) {
  return (
    <div
      className={`w-20 h-20 rounded-full transition-all duration-300 ${
        show
          ? "bg-green-400 shadow-[0_0_30px_rgba(74,222,128,0.8)] scale-110"
          : "bg-gray-200 scale-100"
      }`}
    />
  );
}
