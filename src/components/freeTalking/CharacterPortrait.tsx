"use client";

import { useEffect, useMemo, useState } from "react";
import { PARTNER_IMAGE_FEMALE } from "@/data/freeTalkingData";
import { playPop } from "@/lib/sounds";
import HintBubble from "./HintBubble";
import SubtitleToggle from "./SubtitleToggle";
import type { SubtitleMode } from "@/types/freeTalking";

interface CharacterPortraitProps {
  imageUrl?: string;
  backgroundUrl?: string;
  partnerName?: string;
  /** 질문 음원 끝난 후 카드 내부에 표시할 힌트 키워드 (지연 표시용) */
  hintKeywords?: string[] | null;
  /** 턴이 바뀌면 힌트 다시 보이게 (각 턴마다 힌트 초기화) */
  turnIndex?: number;
  /** 자막 토글: 카드 내부 이름↔사진 사이 */
  subtitleMode?: SubtitleMode;
  onSubtitleChange?: (mode: SubtitleMode) => void;
  subtitleTexts?: { en: string; ko: string } | null;
}

/** 틴더 스타일 프로필 카드 - 이름 / 전구·자막 / 사진 / 힌트, 세로로 길게 */
export default function CharacterPortrait({
  imageUrl = PARTNER_IMAGE_FEMALE,
  backgroundUrl,
  partnerName,
  hintKeywords,
  turnIndex = 0,
  subtitleMode = "none",
  onSubtitleChange,
  subtitleTexts,
}: CharacterPortraitProps) {
  const [hintDismissed, setHintDismissed] = useState(false);
  const [hintPopping, setHintPopping] = useState(false);
  const showHint = hintKeywords && hintKeywords.length > 0 && !hintDismissed;

  // 턴이 바뀌면 이번 턴 힌트를 다시 보이게 초기화
  useEffect(() => {
    setHintDismissed(false);
    setHintPopping(false);
  }, [turnIndex]);

  const bgStyle = useMemo(
    () =>
      backgroundUrl
        ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
        : undefined,
    [backgroundUrl]
  );

  return (
    <div className="flex flex-col w-full max-w-[260px] aspect-[2.3/5] mx-auto rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100">
      {/* 이름 - 카드 상단 */}
      {partnerName && (
        <div className="flex-shrink-0 pt-3 pb-2 text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-white/90 backdrop-blur-sm text-sm font-semibold text-gray-800 shadow-sm">
            {partnerName}
          </span>
        </div>
      )}
      {/* 전구/En/Ko 영역: 고정 높이로 토글해도 사진 흔들리지 않음 */}
      <div className="flex-shrink-0 h-[120px] flex flex-col items-center justify-center py-2 px-2">
        <SubtitleToggle
          mode={subtitleMode}
          onChange={onSubtitleChange ?? (() => {})}
          subtitleTexts={subtitleTexts}
        />
      </div>
      {/* 사진 영역 - 배경 있으면 톤다운 오버레이로 얼굴이 잘 보이게 */}
      <div
        className="relative flex-1 min-h-0 bg-gray-50 flex items-center justify-center"
        style={bgStyle}
      >
        {backgroundUrl && (
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/65 to-white/75"
            aria-hidden
          />
        )}
        <div className="relative w-[65%] aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="대화 상대"
            className="absolute inset-0 w-full h-full object-cover object-top rounded-full"
          />
        </div>
      </div>
      {/* 힌트 영역: 사진 아래, 여러 개면 객관식처럼 버블 분리 */}
      <div className="flex-shrink-0 min-h-[52px] relative pb-4 pt-2">
        {showHint && hintKeywords && hintKeywords.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-2 px-2">
            {hintKeywords.length === 1 ? (
              <HintBubble
                keyword={hintKeywords[0]}
                onDismiss={() => setHintDismissed(true)}
              />
            ) : (
              hintKeywords.map((kw) => (
                <HintBubble
                  key={kw}
                  keyword={kw}
                  popping={hintPopping}
                  onDismiss={() => {
                    setHintPopping(true);
                    playPop();
                    setTimeout(() => setHintDismissed(true), 500);
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
