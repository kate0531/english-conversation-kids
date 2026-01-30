/**
 * Web Audio API로 재생하는 효과음 (클릭 / 코너 전환 / 팝업 등장)
 */

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

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

/** 버튼 클릭 시 짧은 클릭음 */
export function playClick(): void {
  playTone(800, 0.06, "sine", 0.12);
}

/** 코너가 바뀌었을 때 전환 효과음 (예: Conversation → Free Talking) */
export function playTransition(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

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

/** 결과/리포트 팝업 등장 시 효과음 */
export function playPopup(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

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
