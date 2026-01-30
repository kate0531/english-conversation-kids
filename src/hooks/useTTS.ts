"use client";

import { useCallback, useEffect, useRef } from "react";

/** Puter AI TTS 기본 언어 (자연스러운 미국 영어) */
const LANG = "en-US";
const PUTER_SCRIPT_URL = "https://js.puter.com/v2/";

export type TTSVoiceType = "female" | "male" | "childFemale";

declare global {
  interface Window {
    puter?: {
      ai?: {
        txt2speech: (
          text: string,
          language?: string,
          testMode?: boolean
        ) => Promise<{ play: () => void; pause?: () => void }>;
      };
    };
  }
}

function normalizeForSpeech(text: string): string {
  const t = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1");
  if (!t) return t;
  const last = t.slice(-1);
  if (/[.!?]/.test(last)) return t;
  return t + ".";
}

/**
 * 브라우저 내장 SpeechSynthesis 폴백 (Puter 미사용 시)
 */
function speakWithBrowser(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG;
  u.rate = 1;
  u.pitch = 1;
  u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const enUS = voices.find(
    (v) => (v.lang || "").toLowerCase().startsWith("en-us")
  );
  if (enUS) u.voice = enUS;
  window.speechSynthesis.speak(u);
}

/** Puter 스크립트를 클라이언트에서 한 번만 주입 (화면 깨짐 방지) */
function loadPuterScript(): void {
  if (typeof window === "undefined") return;
  if (window.puter?.ai?.txt2speech) return;
  if (document.querySelector(`script[src="${PUTER_SCRIPT_URL}"]`)) return;
  const s = document.createElement("script");
  s.src = PUTER_SCRIPT_URL;
  s.async = true;
  s.crossOrigin = "anonymous";
  document.body.appendChild(s);
}

/**
 * TTS: Puter AI 음성 우선, 미로드/실패 시 브라우저 내장 폴백
 */
export function useTTS(_options: { gender: TTSVoiceType }) {
  const currentAudioRef = useRef<{ play: () => void; pause?: () => void } | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    loadPuterScript();
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !text?.trim()) return;

    const normalized = normalizeForSpeech(text);
    if (!normalized) return;

    // 이전 재생 중지
    try {
      if (currentAudioRef.current?.pause) {
        currentAudioRef.current.pause();
      }
      currentAudioRef.current = null;
    } catch (_) {}

    window.speechSynthesis?.cancel();

    const puter = window.puter?.ai?.txt2speech;
    if (typeof puter === "function") {
      puter(normalized, LANG, false)
        .then((audio) => {
          currentAudioRef.current = audio;
          audio.play();
        })
        .catch(() => {
          speakWithBrowser(normalized);
        });
      return;
    }

    speakWithBrowser(normalized);
  }, []);

  const stop = useCallback(() => {
    try {
      if (currentAudioRef.current?.pause) {
        currentAudioRef.current.pause();
      }
      currentAudioRef.current = null;
    } catch (_) {}
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, stop };
}
