"use client";

import { useState, useCallback } from "react";
import { playDing } from "@/lib/sounds";

/** 마이크 입력 감지 mock - 정확한 STT 없이 버튼 클릭으로 시뮬레이션 */
export function useMockMicDetection(options: { onDetected: () => void }) {
  const [showGreenLight, setShowGreenLight] = useState(false);
  const { onDetected } = options;

  const simulateDetected = useCallback(() => {
    setShowGreenLight(true);
    playDing();
    onDetected();
    setTimeout(() => setShowGreenLight(false), 500);
  }, [onDetected]);

  return { showGreenLight, simulateDetected };
}
