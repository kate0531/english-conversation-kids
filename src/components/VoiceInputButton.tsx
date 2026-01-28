"use client";

interface VoiceInputButtonProps {
  isListening: boolean;
  onToggle: () => void;
  supported: boolean;
  disabled?: boolean;
  theme?: "pink" | "sky";
}

export default function VoiceInputButton({
  isListening,
  onToggle,
  supported,
  disabled,
  theme = "pink",
}: VoiceInputButtonProps) {
  if (!supported) return null;

  const baseClass =
    theme === "sky"
      ? "rounded-xl p-3.5 border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
      : "rounded-xl p-3.5 border border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition";

  const listeningClass = isListening
    ? "animate-[pulse_1s_ease-in-out_infinite] ring-4 shadow-lg " +
      (theme === "sky"
        ? "ring-sky-500 bg-sky-200 text-sky-700 border-sky-400"
        : "ring-pink-500 bg-pink-200 text-pink-700 border-pink-400")
    : "";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex-shrink-0 ${baseClass} ${listeningClass} disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isListening ? "음성 인식 중지" : "음성으로 입력"}
      aria-label={isListening ? "음성 인식 중지" : "음성으로 입력"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden
      >
        <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm-1 2a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1zm-4 4a1 1 0 0 0-1 1v2a5 5 0 0 0 10 0V9a1 1 0 1 0-2 0v2a3 3 0 0 1-6 0V9a1 1 0 0 0-1-1z" />
      </svg>
    </button>
  );
}
