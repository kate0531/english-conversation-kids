"use client";

import { playClick } from "@/lib/sounds";

interface GateScreenProps {
  onSelectWriting: () => void;
  onSelectSpeaking: () => void;
}

export default function GateScreen({ onSelectWriting, onSelectSpeaking }: GateScreenProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-100 via-slate-50 to-gray-200">
      <div className="relative text-center mb-10">
        <h1 className="text-xl font-bold text-gray-700 mb-1">English Practice</h1>
        <p className="text-sm text-gray-500">코너를 선택하세요.</p>
      </div>

      <div className="relative flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          type="button"
          onClick={() => {
            playClick();
            onSelectWriting();
          }}
          className="flex-1 rounded-2xl p-6 border-2 border-violet-400 bg-white/90 shadow-md hover:bg-violet-50 hover:border-violet-500 hover:shadow-lg transition-all duration-200 text-center"
        >
          <span className="text-2xl mb-2 block">✏️</span>
          <span className="font-semibold text-gray-800 block">Writing Time</span>
          <span className="text-sm text-gray-500 mt-1 block">한 문단 쓰기</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playClick();
            onSelectSpeaking();
          }}
          className="flex-1 rounded-2xl p-6 border-2 border-pink-400 bg-white/90 shadow-md hover:bg-pink-50 hover:border-pink-500 hover:shadow-lg transition-all duration-200 text-center"
        >
          <span className="text-2xl mb-2 block">🎙️</span>
          <span className="font-semibold text-gray-800 block">Speaking Time</span>
          <span className="text-sm text-gray-500 mt-1 block">대화 연습</span>
        </button>
      </div>
    </div>
  );
}
