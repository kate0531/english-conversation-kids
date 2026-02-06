"use client";

import { useEffect, useRef } from "react";
import { unlockAudioContext } from "@/lib/sounds";

/**
 * 브라우저 autoplay 정책: 첫 사용자 상호작용 시 AudioContext 해제
 * 페이지 로드 후 첫 클릭/터치 시 오디오를 즉시 재생 가능하게 함
 */
export default function AudioUnlock() {
  const unlockedRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      unlockAudioContext();
    };

    const events = ["click", "touchstart", "keydown"] as const;
    events.forEach((e) => document.addEventListener(e, handler, { once: true, passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, handler));
  }, []);

  return null;
}
