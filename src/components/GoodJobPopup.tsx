"use client";

interface GoodJobPopupProps {
  onClose: () => void;
}

export default function GoodJobPopup({ onClose }: GoodJobPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/15 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-label="완료"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200/90 text-sky-900 shadow-toast border-2 border-sky-300/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-sky-300/70" />
        <div className="p-6 text-center">
          <p className="text-2xl font-bold mb-4">Good job!</p>
          <p className="text-sm opacity-90 mb-6 whitespace-pre-line">
            Free Talking을 모두 마쳤어요.
            {"\n"}처음부터 다시 도전해 볼까요?
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium text-sky-700 bg-sky-100/90 border border-sky-200 hover:bg-sky-200/80 transition"
          >
            처음으로
          </button>
        </div>
      </div>
    </div>
  );
}
