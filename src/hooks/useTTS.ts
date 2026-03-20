"use client";

import { useCallback, useRef, useEffect } from "react";
import { playDing } from "@/lib/sounds";

/** OpenAI TTS 재생 중인 Audio (stop 시 중단) */
let currentTTSAudio: HTMLAudioElement | null = null;

function stopOpenAITTS(): void {
  if (currentTTSAudio) {
    currentTTSAudio.pause();
    currentTTSAudio.src = "";
    currentTTSAudio = null;
  }
}

export type TTSVoiceType = "female" | "male" | "childFemale";

/** 아예 다른 사람 목소리 고르기 (남성용 등) */
export type TTSVoicePerson = 1 | 2 | 3;

/** TTS 언어 */
export type TTSLang = "en-US" | "ko-KR";

function normalizeForEnglish(text: string): string {
  const t = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1");
  if (!t) return t;
  const last = t.slice(-1);
  if (/[.!?]/.test(last)) return t;
  return t + ".";
}

function normalizeForKorean(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * 다정한 톤용 여성 음성 우선 선택 (en-US)
 */
function getKindFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enUS = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en-us"));
  const n = (v: SpeechSynthesisVoice) => (v.name || "").toLowerCase();
  const kind = enUS.find(
    (v) =>
      /samantha|aria|jenny|jennifer|natural.*female|neural|google.*female|ms\. zira|zira/i.test(n(v)) &&
      !/compact|mobile/i.test(n(v))
  );
  if (kind) return kind;
  const female = enUS.find((v) => /female|woman|zira|samantha|aria|jenny/i.test(n(v)));
  return female ?? enUS[0];
}

/** 한국어 발랄한 여성 음성 (다른 여자 목소리 우선) */
function getKoreanFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const ko = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("ko"));
  const n = (v: SpeechSynthesisVoice) => (v.name || "").toLowerCase();
  // 발랄한 느낌: Young, Heami, SunHi 등 / 첫 번째 외 다른 음성 우선
  const lively = ko.find((v) => /young|heami|sunhi|nara|jiyun|minjee|하이미|선희|나라/i.test(n(v)));
  if (lively) return lively;
  const female = ko.find((v) => /female|여성/i.test(n(v)));
  // 기본 첫 번째 대신 두 번째 음성 시도 (다른 여자 느낌)
  return female ?? (ko.length > 1 ? ko[1] : ko[0]);
}

function getMaleVoice(voices: SpeechSynthesisVoice[], person: TTSVoicePerson): SpeechSynthesisVoice | undefined {
  const enUS = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en-us"));
  const male = enUS.filter((v) => /male|david|daniel|mark|james|paul|george|alex/i.test((v.name || "").toLowerCase()));
  const list = male.length > 0 ? male : enUS;
  const index = Math.min(person - 1, list.length - 1);
  return index >= 0 ? list[index] : list[0];
}

function speakWithBrowser(
  text: string,
  gender: "female" | "male",
  person: TTSVoicePerson,
  lang: TTSLang
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.volume = 0.98;

  const voices = window.speechSynthesis.getVoices();
  if (lang === "ko-KR") {
    u.rate = 0.95;  // 살짝 빠르게 → 발랄하게
    u.pitch = 1.1;  // 높은 피치 → 밝고 발랄하게
    const voice = getKoreanFemaleVoice(voices);
    if (voice) u.voice = voice;
  } else if (gender === "female") {
    u.rate = 0.92;
    u.pitch = 1.15;
    const voice = getKindFemaleVoice(voices);
    if (voice) u.voice = voice;
  } else {
    u.rate = 0.85;
    u.pitch = 0.98;
    const voice = getMaleVoice(voices, person);
    if (voice) u.voice = voice;
  }

  window.speechSynthesis.speak(u);
}

/** 사용 가능한 여성 목소리 이름 목록 */
export function getAvailableFemaleVoiceNames(): string[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  const enUS = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en-us"));
  return enUS.map((v) => v.name || v.lang || "Unknown");
}

/** 나(아이) 목소리 - 남자 음성 + 높은 피치로 어린 남자아이 톤, Hailey(여성)와 확실히 구분 */
function getChildVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enUS = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en-us"));
  const n = (v: SpeechSynthesisVoice) => (v.name || "").toLowerCase();
  const child = enUS.find((v) => /child|kid|young/i.test(n(v)));
  if (child) return child;
  const male = enUS.filter((v) => /male|david|daniel|mark|james|paul|george|alex/i.test(n(v)));
  return male.length > 0 ? male[0] : (enUS.length > 1 ? enUS[enUS.length - 1] : enUS[0]);
}

export interface SampleLine {
  speaker: "ai" | "user";
  text: string;
}

const PAUSE_BETWEEN_LINES_MS = 380;
const DING_BEFORE_NEXT_MS = 180;

/** OpenAI TTS API로 한 문장 재생. API 사용 불가 시 { ok: false } 반환 */
async function playTTSViaAPI(text: string, voice: string): Promise<{ ok: true } | { ok: false }> {
  stopOpenAITTS();
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) return { ok: false };
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentTTSAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentTTSAudio === audio) currentTTSAudio = null;
      resolve({ ok: true });
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentTTSAudio === audio) currentTTSAudio = null;
      resolve({ ok: true });
    };
    audio.volume = 0.98;
    audio.play().catch(() => {
      if (currentTTSAudio === audio) currentTTSAudio = null;
      resolve({ ok: true });
    });
  });
}

/** Say It Like a Pro 전용: OpenAI TTS로 대화 재생 (nova=활기차고 감정 있는 여성, echo=대화형 남성/아이). API 불가 시 내장 TTS로 대체 */
export function playSampleConversationWithOpenAI(
  lines: SampleLine[],
  onEnd?: () => void
): () => void {
  let cancelled = false;
  let index = 0;
  let prevSpeaker: "ai" | "user" | null = null;

  async function playNext() {
    if (cancelled || index >= lines.length) {
      if (!cancelled) onEnd?.();
      return;
    }
    const line = lines[index++];
    const text = line.text?.trim();
    const speakerChanged = prevSpeaker != null && prevSpeaker !== line.speaker;
    prevSpeaker = line.speaker;

    if (!text) {
      setTimeout(playNext, PAUSE_BETWEEN_LINES_MS);
      return;
    }

    const doPlay = async () => {
      if (cancelled) return;
      const voice = line.speaker === "ai" ? "nova" : "echo";
      const normalized = normalizeForEnglish(text);
      const result = await playTTSViaAPI(normalized, voice);
      if (cancelled) return;
      if (!result.ok) {
        cancelled = true;
        playSampleConversation(lines, onEnd);
        return;
      }
      setTimeout(playNext, PAUSE_BETWEEN_LINES_MS);
    };

    if (speakerChanged) {
      playDing();
      setTimeout(() => doPlay(), DING_BEFORE_NEXT_MS);
    } else {
      doPlay();
    }
  }

  playNext();
  return () => {
    cancelled = true;
    stopOpenAITTS();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };
}

/** Hailey + 나 대화 전체 순차 재생 (Hailey=여성, 나=어린아이, 턴마다 띵!) - 내장 TTS */
export function playSampleConversation(
  lines: SampleLine[],
  onEnd?: () => void
): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  window.speechSynthesis.cancel();

  let index = 0;
  let prevSpeaker: "ai" | "user" | null = null;

  function playNext() {
    if (index >= lines.length) {
      onEnd?.();
      return;
    }
    const line = lines[index++];
    const text = line.text?.trim();

    const speakerChanged = prevSpeaker != null && prevSpeaker !== line.speaker;
    prevSpeaker = line.speaker;

    if (!text) {
      setTimeout(playNext, PAUSE_BETWEEN_LINES_MS);
      return;
    }

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const haileyVoice = getKindFemaleVoice(voices);
      const childVoice = getChildVoice(voices);

      const u = new SpeechSynthesisUtterance(normalizeForEnglish(text));
      u.lang = "en-US";
      u.volume = 0.98;

      if (line.speaker === "ai") {
        u.rate = 0.9;
        u.pitch = 1.08;
        if (haileyVoice) u.voice = haileyVoice;
      } else {
        u.rate = 0.82;  // 나: 느리게 → Hailey와 확실히 구분
        u.pitch = 1.18;
        if (childVoice) u.voice = childVoice;
      }

      u.onend = () => setTimeout(playNext, PAUSE_BETWEEN_LINES_MS);
      u.onerror = () => setTimeout(playNext, PAUSE_BETWEEN_LINES_MS);
      window.speechSynthesis.speak(u);
    };

    if (speakerChanged) {
      playDing();
      setTimeout(doSpeak, DING_BEFORE_NEXT_MS);
    } else {
      doSpeak();
    }
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      if (window.speechSynthesis.getVoices().length > 0) {
        window.speechSynthesis.onvoiceschanged = null;
        playNext();
      }
    };
  } else {
    playNext();
  }

  return () => window.speechSynthesis.cancel();
}

function pickOpenAIVoice(
  gender: TTSVoiceType,
  lang: TTSLang
): string {
  if (lang === "ko-KR") return "shimmer";
  if (gender === "male") return "onyx";
  if (gender === "childFemale") return "echo";
  return "nova";
}

export function useTTS(options: { gender?: TTSVoiceType; voicePerson?: TTSVoicePerson; lang?: TTSLang }) {
  const gender = options?.gender ?? "female";
  const voicePerson = options?.voicePerson ?? 1;
  const lang = options?.lang ?? "en-US";
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !text?.trim()) return;
      const normalized =
        lang === "ko-KR" ? normalizeForKorean(text) : normalizeForEnglish(text);
      if (!normalized) return;
      window.speechSynthesis?.cancel();
      stopOpenAITTS();

      const voice = pickOpenAIVoice(gender, lang);

      void (async () => {
        const result = await playTTSViaAPI(normalized, voice);
        if (!mountedRef.current) return;
        if (!result.ok) {
          const mapped: "female" | "male" = gender === "childFemale" ? "female" : gender;
          speakWithBrowser(normalized, mapped, voicePerson, lang);
        }
      })();
    },
    [gender, voicePerson, lang]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    stopOpenAITTS();
  }, []);

  return { speak, stop };
}
