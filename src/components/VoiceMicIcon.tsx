"use client";

interface VoiceMicIconProps {
  className?: string;
  size?: number;
}

/** 음성 입력용 마이크 아이콘 (노래방 스타일이 아닌 심플한 보이스 입력 느낌) */
export default function VoiceMicIcon({ className = "", size = 24 }: VoiceMicIconProps) {
  return (
    <span className={`inline-flex items-center justify-center shrink-0 self-center ${className}`} aria-hidden>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="음성 입력"
        className="block"
      >
        {/* 헤드: viewBox 세로 중앙에 맞춰 그려서 버튼에서 텍스트와 정렬 맞음 */}
        <rect x="9.25" y="5.5" width="5.5" height="7" rx="2.75" ry="2.75" fill="currentColor" />
        <path d="M10.2 7v4M12 6.3v5.4M13.8 7v4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.65" />
        <path d="M12 12.7v3.5M9.5 16.2h5M12 16.2v2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8.5 18.4h7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
      </svg>
    </span>
  );
}
