/**
 * Web Audio API로 재생하는 효과음 (클릭 / 코너 전환 / 팝업 등장)
 * 브라우저 autoplay 정책: 사용자 상호작용 후 AudioContext.resume() 필요
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioContext = new Ctx();
  return audioContext;
}

/** 첫 사용자 상호작용 시 호출하여 오디오 잠금 해제 (브라우저 autoplay 정책) */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") {
    ctx.resume();
  }
}

function runTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 0.8,
    ctx.currentTime + duration
  );

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().then(() => runTone(ctx, frequency, duration, type, volume)).catch(() => {});
  } else {
    runTone(ctx, frequency, duration, type, volume);
  }
}

/** 버튼 클릭 시 짧은 클릭음 (예외 발생해도 호출자에 영향 없도록 처리) */
export function playClick(): void {
  try {
    playTone(800, 0.06, "sine", 0.12);
  } catch {
    /* 무시 */
  }
}

function runTransition(ctx: AudioContext): void {
  const duration = 0.25;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.setValueAtTime(659, ctx.currentTime + duration * 0.5);
  osc.frequency.setValueAtTime(784, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
  gain.gain.setValueAtTime(0.12, ctx.currentTime + duration);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.1);
}

/** 코너가 바뀌었을 때 전환 효과음 (예: Conversation → Free Talking) */
export function playTransition(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().then(() => runTransition(ctx));
  } else {
    runTransition(ctx);
  }
}

function runDing(ctx: AudioContext): void {
  const duration = 0.15;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + duration * 0.5);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** 그린라이트 + 띵동 (마이크 감지 시) */
export function playDing(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().then(() => runDing(ctx));
  } else {
    runDing(ctx);
  }
}

function runPopup(ctx: AudioContext): void {
  const duration = 0.2;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(392, ctx.currentTime);
  osc.frequency.setValueAtTime(523, ctx.currentTime + duration * 0.5);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.03);
  gain.gain.setValueAtTime(0.15, ctx.currentTime + duration);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + 0.08);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.08);
}

/** 힌트 버블 클릭 시 펑! 터지는 효과음 */
export function playPop(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runPop(ctx)).catch(() => {});
    } else {
      runPop(ctx);
    }
  } catch {
    /* 무시 */
  }
}

function runPop(ctx: AudioContext): void {
  const duration = 0.15;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + duration * 0.3);
  osc.frequency.setValueAtTime(800, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** 결과/리포트 팝업 등장 시 효과음 */
export function playPopup(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().then(() => runPopup(ctx));
  } else {
    runPopup(ctx);
  }
}

function runBuzzer(ctx: AudioContext): void {
  const duration = 0.2;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** 정답 아님 / 틀렸을 때 땡! 효과음 */
export function playBuzzer(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runBuzzer(ctx)).catch(() => {});
    } else {
      runBuzzer(ctx);
    }
  } catch {
    /* 무시 */
  }
}
