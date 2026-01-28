"use client";

/** 4~5턴 고급 단계 — 구성은 동일, 하늘색 테마로 업그레이드 느낌 */
export default function AdvancedView({
  introText,
  onBack,
}: {
  introText: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-gradient-to-b from-sky-50 via-sky-100/40 to-sky-50 rounded-t-3xl shadow-lg border border-sky-200/60 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-300 to-sky-400 flex items-center justify-center text-2xl mb-4 shadow-bubble text-white">
          ✨
        </div>
        <h2 className="text-lg font-semibold text-sky-800 mb-2">고급 대화 단계</h2>
        <p className="text-sky-700/90 text-sm max-w-xs mb-6 whitespace-pre-wrap">
          {introText}
        </p>
        <p className="text-sky-600/80 text-xs mb-4">
          이제 하고 싶은 주제로 자유롭게 대화해 보세요.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-sm font-medium text-sky-700 bg-sky-100/80 border border-sky-200 hover:bg-sky-200/80 transition"
          >
            1~3턴으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
