"use client";

import { useState, useCallback, useRef, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionEventLike {
  results: Array<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}

function pickRecorderMime(): string {
  const c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const m of c) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "audio/webm";
}

function langToWhisperCode(lang: string): string {
  const l = (lang || "en-US").toLowerCase();
  if (l.startsWith("ko")) return "ko";
  return "en";
}

function audioFilenameForBlob(blob: Blob): string {
  const m = (blob.type || "").toLowerCase();
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac") || m.includes("caf")) return "audio.m4a";
  if (m.includes("mpeg") || m.includes("mp3")) return "audio.mp3";
  if (m.includes("wav")) return "audio.wav";
  if (m.includes("ogg")) return "audio.ogg";
  return "audio.webm";
}

const MAX_RECORDING_MS = 9000;

/**
 * 음성 인식: Whisper(/api/stt)로 최종 확정.
 * 동시에 Web Speech API로 "임시(interim) 텍스트"를 보여줘서 UX를 빠르게 만듭니다.
 * 단, 최종 진행(onResult)은 Whisper 성공일 때만 일어납니다.
 */
export function useSpeechRecognition(options?: {
  lang?: string;
  onResult?: (text: string) => void;
  onInterim?: (text: string) => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onResultCb = useRef(options?.onResult);
  const onInterimCb = useRef(options?.onInterim);
  onResultCb.current = options?.onResult;
  onInterimCb.current = options?.onInterim;

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const webSpeechStartedRef = useRef(false);

  const ensureWebSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognitionClass =
      typeof window !== "undefined" ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined;
    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass() as SpeechRecognitionInstance;
    recognition.lang = options?.lang ?? "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e: SpeechRecognitionEventLike) => {
      if (!e?.results?.length) return;
      const last = e.results[e.results.length - 1];
      const transcript = last?.[0]?.transcript ? String(last[0].transcript).trim() : "";
      if (!transcript) return;
      setInterimText(transcript);
      onInterimCb.current?.(transcript);
    };
    recognition.onerror = () => {
      // interim 전용: 에러는 조용히 무시
    };
    recognition.onend = () => {
      webSpeechStartedRef.current = false;
    };

    recognitionRef.current = recognition;
    return recognitionRef.current;
  }, [options?.lang]);

  const stopWebSpeech = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    webSpeechStartedRef.current = false;
  }, []);

  const stopStream = useCallback(() => {
    stopWebSpeech();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, [stopWebSpeech]);

  const startWebSpeechInterim = useCallback(() => {
    const r = ensureWebSpeechRecognition();
    if (!r) return;
    try {
      if (webSpeechStartedRef.current) return;
      webSpeechStartedRef.current = true;
      // continuous=true + interimResults=true 상태에서 start만 호출
      r.start();
    } catch {
      /* ignore */
    }
  }, [ensureWebSpeechRecognition]);

  const transcribeBlob = useCallback(
    async (blob: Blob): Promise<boolean> => {
      if (blob.size < 80) {
        setSttError("녹음이 너무 짧거나 비어 있어요. 조금 더 길게 말한 뒤 다시 눌러 주세요.");
        return false;
      }
      const fd = new FormData();
      fd.append("file", blob, audioFilenameForBlob(blob));
      fd.append("language", langToWhisperCode(options?.lang ?? "en-US"));
      try {
        const res = await fetch("/api/stt", { method: "POST", body: fd, cache: "no-store" });
        if (!res.ok) {
          let detail = res.statusText;
          try {
            const errJson = (await res.json()) as { error?: string };
            if (errJson?.error) detail = errJson.error;
          } catch {
            /* ignore */
          }
          console.warn("[STT] /api/stt 실패:", res.status, detail);
          setSttError(
            `음성 인식 서버를 쓸 수 없어요. (${res.status}) Vercel에 OPENAI_API_KEY가 있는지 확인해 주세요.`
          );
          return false;
        }

        const data = (await res.json()) as { text?: string };
        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (!text) {
          console.warn("[STT] Whisper 빈 텍스트, blob 크기:", blob.size);
          setSttError("음성을 텍스트로 바꾸지 못했어요. 마이크·말하기 언어를 확인해 주세요.");
          return false;
        }

        // API로 확정된 텍스트로 interim 화면도 "수정"
        setInterimText(text);
        onInterimCb.current?.(text);

        setSttError(null);
        onResultCb.current?.(text);
        return true;
      } catch (e) {
        console.warn("[STT] 네트워크/요청 오류:", e);
        setSttError("음성 인식 요청에 실패했어요. 인터넷 연결을 확인해 주세요.");
        return false;
      }
    },
    [options?.lang]
  );

  const armTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (recorderRef.current && recorderRef.current.state === "recording") {
        try {
          const rec = recorderRef.current;
          if (typeof rec.requestData === "function") rec.requestData();
          rec.stop();
        } catch (_) {
          stopStream();
          setIsListening(false);
        }
      }
    }, MAX_RECORDING_MS);
  }, [stopStream]);

  const startMediaRecorder = useCallback(async (): Promise<void> => {
    setSttError(null);
    setInterimText("");
    setIsProcessing(false);
    startWebSpeechInterim();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      stopWebSpeech();
      setSttError("이 브라우저에서는 마이크 녹음(음성 인식 API)을 쓸 수 없어요. Chrome을 사용해 주세요.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        const chunkParts = chunksRef.current.slice();
        chunksRef.current = [];
        stopStream();
        setIsListening(false);
        const blob = new Blob(chunkParts, { type: mime });
        setIsProcessing(true);
        try {
          await transcribeBlob(blob);
        } finally {
          setIsProcessing(false);
        }
      };

      rec.start(250);
      recorderRef.current = rec;
      setIsListening(true);
    } catch {
      stopWebSpeech();
      setSttError("마이크 권한이 없거나 사용할 수 없어요. 브라우저 설정에서 마이크를 허용해 주세요.");
    }
  }, [stopStream, transcribeBlob, startWebSpeechInterim, stopWebSpeech]);

  useEffect(() => {
    const canMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";
    setSupported(canMedia);

    // 웹스피치 interim은 on-demand로 시작하므로 여기선 생성만 해두되,
    // 실제 start는 녹음 버튼 누른 순간에만 수행합니다.
    ensureWebSpeechRecognition();

    return () => {
      stopStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
        recognitionRef.current = null;
      }
      webSpeechStartedRef.current = false;
    };
  }, [options?.lang, stopStream, ensureWebSpeechRecognition]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        const rec = recorderRef.current;
        if (typeof rec.requestData === "function") rec.requestData();
      } catch {
        /* ignore */
      }
      try {
        recorderRef.current.stop();
      } catch (_) {
        stopStream();
        setIsListening(false);
      }
      return;
    }
    stopWebSpeech();
    setIsListening(false);
  }, [stopStream, stopWebSpeech]);

  const start = useCallback(() => {
    if (isListening) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    void startMediaRecorder().then(() => {
      if (recorderRef.current?.state === "recording") armTimeout();
    });
  }, [isListening, startMediaRecorder, armTimeout]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  const clearSttError = useCallback(() => setSttError(null), []);
  return { isListening, start, stop, toggle, supported, sttError, clearSttError, interimText, isProcessing };
}
