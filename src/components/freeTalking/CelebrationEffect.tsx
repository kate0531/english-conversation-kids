"use client";

interface CelebrationEffectProps {
  show: boolean;
  message?: string;
}

export default function CelebrationEffect({
  show,
  message = "Great job!",
}: CelebrationEffectProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-200/45 via-red-200/25 to-transparent" />

      <div className="absolute inset-x-0 top-16 mx-auto w-fit rounded-2xl px-6 py-3 bg-gradient-to-r from-red-500 via-yellow-300 to-red-500 border-4 border-black/70 shadow-xl">
        <p className="text-black font-extrabold text-lg tracking-wide">{message}</p>
      </div>

      {/* 가운데 커다란 몬스터볼 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-44 h-44 rounded-full border-[10px] border-black overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.35)] animate-[spin_3.6s_linear_infinite]">
          <div className="h-1/2 bg-red-500" />
          <div className="h-1/2 bg-white" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-black" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white border-[8px] border-black shadow-inner" />
          </div>
        </div>
      </div>

      {/* 팡팡팡 빛 효과 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-56 h-56 rounded-full bg-yellow-300/45 animate-ping" />
        <div
          className="absolute w-64 h-64 rounded-full bg-red-300/35 animate-ping"
          style={{ animationDelay: "220ms" }}
        />
        <div
          className="absolute w-72 h-72 rounded-full bg-white/35 animate-ping"
          style={{ animationDelay: "420ms" }}
        />
      </div>

      {/* 반짝이(동물 제거) */}
      <div className="absolute inset-0">
        {["⚡", "✨", "⭐", "💥", "✨", "⚡", "⭐", "💥"].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="absolute text-3xl animate-bounce"
            style={{
              left: `${10 + i * 10}%`,
              top: `${18 + (i % 3) * 17}%`,
              animationDelay: `${(i % 4) * 130}ms`,
              animationDuration: `${1100 + (i % 3) * 220}ms`,
            }}
          >
            {item}
          </span>
        ))}
      </div>

      {/* 바닥 반사광 */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-20 w-56 h-8 rounded-full bg-black/20 blur-md" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[5.2rem] w-48 h-3 rounded-full bg-yellow-200/55 blur-sm" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[4.7rem] w-40 h-2 rounded-full bg-white/65 blur-sm" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute top-[42%] w-72 h-72 rounded-full border-4 border-yellow-300/40 animate-pulse" />
        <div
          className="absolute top-[41%] w-80 h-80 rounded-full border-4 border-red-300/25 animate-pulse"
          style={{ animationDelay: "260ms" }}
        />
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-1 h-24 bg-yellow-100/80 origin-bottom animate-pulse"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 120}deg)`,
              animationDelay: `${i * 180}ms`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white animate-ping" />
      </div>

      <div className="absolute inset-x-0 bottom-8 mx-auto w-fit text-yellow-100/90 text-xl tracking-widest">
        ⚡ ⚡ ⚡
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={`flash-${i}`}
            className="absolute inset-0 bg-white/10 animate-ping"
            style={{ animationDelay: `${i * 240}ms`, animationDuration: "1200ms" }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={`spark-${i}`}
            className="absolute w-4 h-4 rounded-full bg-yellow-200/80 animate-bounce"
            style={{
              left: `${20 + i * 10}%`,
              top: `${35 + (i % 2) * 18}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={`burst-${i}`}
            className="absolute left-1/2 top-1/2 w-60 h-60 rounded-full border-4 border-yellow-200/50 animate-ping"
            style={{
              transform: "translate(-50%, -50%)",
              animationDelay: `${i * 280}ms`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`line-${i}`}
            className="absolute left-1/2 top-1/2 w-1 h-32 bg-gradient-to-t from-yellow-200/0 to-yellow-100/80 animate-pulse"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 90}deg)`,
              animationDelay: `${i * 160}ms`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1].map((i) => (
          <div
            key={`core-${i}`}
            className="absolute left-1/2 top-1/2 w-20 h-20 rounded-full bg-white/20 animate-ping"
            style={{
              transform: "translate(-50%, -50%)",
              animationDelay: `${i * 300}ms`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={`tiny-${i}`}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-white animate-ping"
            style={{
              transform: `translate(${(i - 1) * 34}px, ${i % 2 === 0 ? -26 : 26}px)`,
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={`ring-${i}`}
            className="absolute left-1/2 top-1/2 rounded-full border border-yellow-100/45 animate-ping"
            style={{
              width: `${180 + i * 24}px`,
              height: `${180 + i * 24}px`,
              transform: "translate(-50%, -50%)",
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={`pop-${i}`}
            className="absolute left-1/2 top-1/2 text-2xl animate-bounce"
            style={{
              transform: `translate(${(i - 1) * 70}px, -110px)`,
              animationDelay: `${i * 140}ms`,
            }}
          >
            💥
          </div>
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={`zap-${i}`}
            className="absolute left-1/2 top-1/2 text-xl animate-pulse"
            style={{
              transform: `translate(${(i - 1) * 80}px, 92px)`,
              animationDelay: `${i * 160}ms`,
            }}
          >
            ⚡
          </div>
        ))}
      </div>

      <div className="absolute inset-0">
        {[0, 1].map((i) => (
          <div
            key={`flare-${i}`}
            className="absolute left-1/2 top-1/2 w-28 h-28 rounded-full bg-yellow-100/20 blur-2xl animate-pulse"
            style={{
              transform: `translate(${i === 0 ? -120 : 60}px, ${i === 0 ? -40 : -80}px)`,
              animationDelay: `${i * 240}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

