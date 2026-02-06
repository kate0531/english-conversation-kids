"use client";

import { useCallback } from "react";

const LANG = "en-US";

export type TTSVoiceType = "female" | "male" | "childFemale";

/** 아예 다른 사람 목소리 고르기 (남성용 등) */
export type TTSVoicePerson = 1 | 2 | 3;

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
 * 다정한 톤용 여성 음성 우선 선택
 * (Samantha, Aria, Jenny, Natural/Neural 계열 = 부드럽고 말걸기 좋은 느낌)
 */
function getKindFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enUS = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en-us"));
  const n = (v: SpeechSynthesisVoice) => (v.name || "").toLowerCase();
  // 1순위: 보통 가장 부드럽다고 알려진 음성
  const kind = enUS.find(
    (v) =>
      /samantha|aria|jenny|jennifer|natural.*female|neural|google.*female|ms\. zira|zira/i.test(n(v)) &&
      !/compact|mobile/i.test(n(v))
  );
  if (kind) return kind;
  // 2순위: 여성 표시된 것
  const female = enUS.find((v) => /female|woman|zira|samantha|aria|jenny/i.test(n(v)));
  return female ?? enUS[0];
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
  person: TTSVoicePerson
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG;
  u.volume = 0.98;

  const voices = window.speechSynthesis.getVoices();
  if (gender === "female") {
    // 에너지 넘치고 신난 목소리 (피치는 유지, 속도만 완화)
    u.rate = 0.92;  // 조금 느리게 → 무리 없이
    u.pitch = 1.15; // 높은 피치 → 신나고 밝게
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

export function useTTS(options: { gender: TTSVoiceType; voicePerson?: TTSVoicePerson }) {
  const gender = options?.gender ?? "female";
  const voicePerson = options?.voicePerson ?? 1;
  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !text?.trim()) return;
      const normalized = normalizeForSpeech(text);
      if (!normalized) return;
      window.speechSynthesis?.cancel();
      const mapped: "female" | "male" = gender === "childFemale" ? "female" : gender;
      speakWithBrowser(normalized, mapped, voicePerson);
    },
    [gender, voicePerson]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  return { speak, stop };
}
