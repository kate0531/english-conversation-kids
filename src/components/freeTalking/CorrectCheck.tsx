"use client";

/** 정답 표시: 흰 바탕에 초록색 체크 마크 */
export default function CorrectCheck() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white border-2 border-green-400 shadow-md">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 text-green-500"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}
