"use client";

import { useState, useEffect, useRef } from "react";
import { playClick, playPopup } from "@/lib/sounds";

interface CountdownOverlayProps {
  onComplete: () => void;
}

const STEPS = [3, 2, 1, "Go!"] as const;
const STEP_MS = 900;
const FADEOUT_MS = 650;

/** 연한 막 그라데이션 */
const OVERLAY_GRADIENT =
  "linear-gradient(160deg, rgba(255, 218, 225, 0.52) 0%, rgba(255, 182, 193, 0.48) 35%, rgba(230, 200, 230, 0.5) 70%, rgba(255, 218, 225, 0.52) 100%)";

/** 스파클 점 8개 방사형 배치용 각도 */
const SPARKLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/** 랜덤 대화 진입 시 3, 2, 1, Go! — 끝나면 막이 서서히 페이드아웃 */
export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (fadingOut) return;

    const value = STEPS[stepIndex];
    if (value === "Go!") {
      playPopup();
    } else {
      playClick();
    }

    if (stepIndex >= STEPS.length - 1) {
      const t = setTimeout(() => {
        if (!mounted.current) return;
        setFadingOut(true);
        const t2 = setTimeout(() => {
          if (mounted.current) onComplete();
        }, FADEOUT_MS);
        return () => clearTimeout(t2);
      }, STEP_MS);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (mounted.current) setStepIndex((i) => i + 1);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [stepIndex, fadingOut, onComplete]);

  const isGo = STEPS[stepIndex] === "Go!";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${
        fadingOut ? "animate-curtain-fade-out" : ""
      }`}
      style={{ background: OVERLAY_GRADIENT }}
      aria-live="polite"
      aria-label={`${STEPS[stepIndex]} 준비`}
    >
      <CountdownContent stepIndex={stepIndex} isGo={isGo} />
    </div>
  );
}

function CountdownContent({
  stepIndex,
  isGo,
}: {
  stepIndex: number;
  isGo: boolean;
}) {
  return (
    <div className="text-center relative">
      {isGo && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "scale(0.4)" }} aria-hidden>
          <>
            <div
              className="absolute inset-0 flex items-center justify-center -m-16"
              aria-hidden
            >
              <div
                className="w-32 h-32 rounded-full animate-go-glow opacity-60"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,182,193,0.6) 40%, transparent 70%)",
                  boxShadow: "0 0 60px rgba(255, 105, 180, 0.5)",
                }}
              />
            </div>
            {SPARKLE_ANGLES.map((deg, i) => (
              <span
                key={i}
                className="absolute top-1/2 left-1/2 -ml-1 -mt-1"
                style={{ transform: `rotate(${deg}deg) translateY(-52px)` }}
                aria-hidden
              >
                <span
                  className="block w-2 h-2 rounded-full bg-white animate-sparkle"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    boxShadow: "0 0 8px rgba(255,255,255,0.9)",
                  }}
                />
              </span>
            ))}
          </>
        </div>
      )}

      <span
        key={stepIndex}
        className={`relative inline-block font-lovely font-extrabold ${
          isGo
            ? "text-3xl sm:text-4xl animate-go-burst"
            : "text-6xl sm:text-7xl animate-countdown-bounce"
        }`}
        style={{
          color: "#fff",
          textShadow:
            "0 0 20px rgba(255,182,193,0.9), 0 0 40px rgba(255,105,180,0.5), 0 2px 12px rgba(0,0,0,0.15)",
          WebkitTextStroke: isGo ? "2px rgba(255,255,255,0.9)" : "1px rgba(255,255,255,0.6)",
        }}
      >
        {STEPS[stepIndex]}
      </span>
    </div>
  );
}
