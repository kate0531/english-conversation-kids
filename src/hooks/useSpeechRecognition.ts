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

export function useSpeechRecognition(options?: { lang?: string; onResult?: (text: string) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultCb = useRef(options?.onResult);
  const lastTranscriptRef = useRef<string>("");
  onResultCb.current = options?.onResult;

  useEffect(() => {
    const SpeechRecognitionClass =
      typeof window !== "undefined"
        ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
        : undefined;
    setSupported(!!SpeechRecognitionClass);

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = options?.lang ?? "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        if (e.results.length === 0) return;
        const result = e.results[e.results.length - 1];
        const transcript = (result[0] && result[0].transcript) ? String(result[0].transcript).trim() : "";
        if (!transcript) return;
        lastTranscriptRef.current = transcript;
        if (result.isFinal) {
          onResultCb.current?.(transcript);
          lastTranscriptRef.current = "";
        }
      };
      recognition.onend = () => {
        if (lastTranscriptRef.current) {
          onResultCb.current?.(lastTranscriptRef.current);
          lastTranscriptRef.current = "";
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {
          /* ignore */
        }
        recognitionRef.current = null;
      }
    };
  }, [options?.lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    lastTranscriptRef.current = "";
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (_) {
      setIsListening(false);
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setIsListening(false);
  }, [isListening]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isListening, start, stop, toggle, supported };
}
