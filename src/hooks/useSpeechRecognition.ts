"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
  resultIndex: number;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function pickRecorderMime(): string {
  const c = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
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

/**
 * 음성 인식: OpenAI Whisper(/api/stt) 우선(마이크 녹음), 실패 시 브라우저 Web Speech API
 */
export function useSpeechRecognition(options?: { lang?: string; onResult?: (text: string) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const onResultCb = useRef(options?.onResult);
  const lastTranscriptRef = useRef<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usingWebRef = useRef(false);
  onResultCb.current = options?.onResult;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const transcribeBlob = useCallback(
    async (blob: Blob): Promise<boolean> => {
      if (blob.size < 80) return true;
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");
      fd.append("language", langToWhisperCode(options?.lang ?? "en-US"));
      try {
        const res = await fetch("/api/stt", { method: "POST", body: fd });
        if (!res.ok) return false;
        const data = (await res.json()) as { text?: string };
        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (text) onResultCb.current?.(text);
        return true;
      } catch {
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
          recorderRef.current.stop();
        } catch (_) {
          stopStream();
          setIsListening(false);
        }
      } else if (usingWebRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {
          /* ignore */
        }
        setIsListening(false);
      }
    }, 12000);
  }, [stopStream]);

  const startWebSpeech = useCallback(() => {
    const SpeechRecognitionClass =
      typeof window !== "undefined"
        ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
        : undefined;
    if (!SpeechRecognitionClass || !recognitionRef.current) return;
    usingWebRef.current = true;
    lastTranscriptRef.current = "";
    try {
      recognitionRef.current.start();
      setIsListening(true);
      armTimeout();
    } catch {
      setIsListening(false);
    }
  }, [armTimeout]);

  const startMediaRecorder = useCallback(async (): Promise<void> => {
    usingWebRef.current = false;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      startWebSpeech();
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
        stopStream();
        setIsListening(false);
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        const ok = await transcribeBlob(blob);
        if (!ok) startWebSpeech();
      };
      rec.start();
      recorderRef.current = rec;
      setIsListening(true);
    } catch {
      startWebSpeech();
    }
  }, [startWebSpeech, stopStream, transcribeBlob]);

  useEffect(() => {
    const SpeechRecognitionClass =
      typeof window !== "undefined"
        ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
        : undefined;
    const canWeb = !!SpeechRecognitionClass;
    const canMedia = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    setSupported(canWeb || canMedia);

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = options?.lang ?? "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        if (e.results.length === 0) return;
        const result = e.results[e.results.length - 1];
        const transcript =
          result[0] && result[0].transcript ? String(result[0].transcript).trim() : "";
        if (!transcript) return;
        lastTranscriptRef.current = transcript;
        if (result.isFinal) {
          onResultCb.current?.(transcript);
          lastTranscriptRef.current = "";
        }
      };
      recognition.onend = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (usingWebRef.current && lastTranscriptRef.current) {
          onResultCb.current?.(lastTranscriptRef.current);
          lastTranscriptRef.current = "";
        }
        usingWebRef.current = false;
        setIsListening(false);
      };
      recognition.onerror = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }

    return () => {
      stopStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {
          /* ignore */
        }
        recognitionRef.current = null;
      }
    };
  }, [options?.lang, stopStream]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch (_) {
        stopStream();
        setIsListening(false);
      }
      return;
    }
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, [isListening, stopStream]);

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

  return { isListening, start, stop, toggle, supported };
}
