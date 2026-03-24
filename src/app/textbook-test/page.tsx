"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeButton from "@/components/HomeButton";
import { playClick } from "@/lib/sounds";
import StoryTextbook from "@/components/textbook/StoryTextbook";
import WordTextbook from "@/components/textbook/WordTextbook";
import GrammarTextbook from "@/components/textbook/GrammarTextbook";

type SampleKind = "hub" | "story" | "word" | "grammar";

export default function TextbookTestPage() {
  const router = useRouter();
  const [kind, setKind] = useState<SampleKind>("hub");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <HomeButton
            onClick={() => {
              playClick();
              router.push("/");
            }}
          />
          <h1 className="flex-1 text-center text-base font-semibold text-slate-800">
            교재 TEST
          </h1>
          <div className="w-10 flex-shrink-0" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {kind === "hub" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              교재 종류를 고르면 미션이 달라요. 음성은 Whisper(`/api/stt`)와 OpenAI(`/api/textbook`)로
              연결돼 있어요.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="rounded-2xl border-2 border-emerald-400 bg-white p-5 text-left shadow-sm hover:bg-emerald-50/80 transition"
                onClick={() => {
                  playClick();
                  setKind("story");
                }}
              >
                <span className="text-2xl block mb-1">📖</span>
                <span className="font-semibold text-slate-800">A. 스토리 교재</span>
                <span className="text-xs text-slate-500 block mt-1">
                  쉐도잉 · 빈칸 · 이해 질문 · 문법 바꾸기 · 자유 말하기
                </span>
              </button>
              <button
                type="button"
                className="rounded-2xl border-2 border-violet-400 bg-white p-5 text-left shadow-sm hover:bg-violet-50/80 transition"
                onClick={() => {
                  playClick();
                  setKind("word");
                }}
              >
                <span className="text-2xl block mb-1">🔤</span>
                <span className="font-semibold text-slate-800">B. Word 교재</span>
                <span className="text-xs text-slate-500 block mt-1">
                  따라하기 · 음성 인식 · 문장 속 단어
                </span>
              </button>
              <button
                type="button"
                className="rounded-2xl border-2 border-amber-400 bg-white p-5 text-left shadow-sm hover:bg-amber-50/80 transition"
                onClick={() => {
                  playClick();
                  setKind("grammar");
                }}
              >
                <span className="text-2xl block mb-1">📐</span>
                <span className="font-semibold text-slate-800">C. 문법 교재</span>
                <span className="text-xs text-slate-500 block mt-1">
                  따라하기 · 음성 인식 · 변형·음성 채점
                </span>
              </button>
            </div>
          </div>
        )}

        {kind === "story" && (
          <div className="space-y-4">
            <button
              type="button"
              className="text-sm text-emerald-700 underline"
              onClick={() => {
                playClick();
                setKind("hub");
              }}
            >
              ← 교재 선택으로
            </button>
            <StoryTextbook />
          </div>
        )}

        {kind === "word" && (
          <div className="space-y-4">
            <button
              type="button"
              className="text-sm text-violet-700 underline"
              onClick={() => {
                playClick();
                setKind("hub");
              }}
            >
              ← 교재 선택으로
            </button>
            <WordTextbook />
          </div>
        )}

        {kind === "grammar" && (
          <div className="space-y-4">
            <button
              type="button"
              className="text-sm text-amber-800 underline"
              onClick={() => {
                playClick();
                setKind("hub");
              }}
            >
              ← 교재 선택으로
            </button>
            <GrammarTextbook />
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          <Link href="/" className="underline hover:text-slate-600">
            앱 대문으로
          </Link>
        </p>
      </main>
    </div>
  );
}
