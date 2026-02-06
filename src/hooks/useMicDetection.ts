"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { playDing } from "@/lib/sounds";

/** 실제 마이크 입력 감지 - 소리 크기만 체크, STT 없음 */
export function useMicDetection(options: { onDetected: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [showGreenLight, setShowGreenLight] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { onDetected } = options;
  const threshold = 0.015; // 감지 민감도

  const stopListening = useCallback(() => {
    setIsListening(false);
    setShowGreenLight(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      options.onDetected();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        if (!analyserRef.current || !streamRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        if (avg > threshold) {
          setShowGreenLight(true);
          playDing();
          onDetected();
          stopListening();
          return;
        }
        rafRef.current = requestAnimationFrame(checkLevel);
      };
      rafRef.current = requestAnimationFrame(checkLevel);
    } catch {
      // 권한 거부 등: 폴백으로 클릭 시 바로 감지된 것처럼 처리
      setShowGreenLight(true);
      playDing();
      onDetected();
      setTimeout(() => setShowGreenLight(false), 500);
    }
  }, [onDetected, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return { isListening, showGreenLight, startListening, stopListening };
}
