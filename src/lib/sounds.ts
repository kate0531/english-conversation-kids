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

function runTick(ctx: AudioContext): void {
  const duration = 0.08;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(1180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** 카운트다운 째깍째깍 효과음 */
export function playTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runTick(ctx)).catch(() => {});
    } else {
      runTick(ctx);
    }
  } catch {
    /* 무시 */
  }
}

function runGoSignal(ctx: AudioContext): void {
  const duration = 0.3;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(420, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(980, ctx.currentTime + duration * 0.7);
  osc.frequency.linearRampToValueAtTime(760, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + 0.05);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.05);
}

/** "GO!" 시작 신호 효과음 */
export function playGoSignal(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runGoSignal(ctx)).catch(() => {});
    } else {
      runGoSignal(ctx);
    }
  } catch {
    /* 무시 */
  }
}

function runExplosion(ctx: AudioContext): void {
  const duration = 0.32;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const decay = 1 - i / bufferSize;
    output[i] = (Math.random() * 2 - 1) * decay;
  }
  const noise = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  noise.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1600, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + duration);
}

/** 폭탄 폭발/종료 효과음 */
export function playExplosion(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runExplosion(ctx)).catch(() => {});
    } else {
      runExplosion(ctx);
    }
  } catch {
    /* 무시 */
  }
}

function runLaserPulse(ctx: AudioContext): void {
  const duration = 0.12;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/** 대결 게이지 변동 시 레이저 효과음 */
export function playLaserPulse(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runLaserPulse(ctx)).catch(() => {});
    } else {
      runLaserPulse(ctx);
    }
  } catch {
    /* 무시 */
  }
}

function runCuteTick(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const first = ctx.createOscillator();
  const firstGain = ctx.createGain();
  first.type = "triangle";
  first.frequency.setValueAtTime(980, t);
  first.frequency.exponentialRampToValueAtTime(860, t + 0.06);
  first.connect(firstGain);
  firstGain.connect(ctx.destination);
  firstGain.gain.setValueAtTime(0.001, t);
  firstGain.gain.linearRampToValueAtTime(0.08, t + 0.01);
  firstGain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
  first.start(t);
  first.stop(t + 0.07);

  const second = ctx.createOscillator();
  const secondGain = ctx.createGain();
  second.type = "sine";
  second.frequency.setValueAtTime(1320, t + 0.05);
  second.frequency.exponentialRampToValueAtTime(1120, t + 0.11);
  second.connect(secondGain);
  secondGain.connect(ctx.destination);
  secondGain.gain.setValueAtTime(0.001, t + 0.05);
  secondGain.gain.linearRampToValueAtTime(0.07, t + 0.06);
  secondGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
  second.start(t + 0.05);
  second.stop(t + 0.12);
}

/** 대결 게임용 귀여운 째깍째깍 효과음 */
export function playCuteTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runCuteTick(ctx)).catch(() => {});
    } else {
      runCuteTick(ctx);
    }
  } catch {
    /* 무시 */
  }
}

function runVictoryBlast(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const freqs = [392, 523, 659, 880];
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, t + idx * 0.06);
    osc.frequency.linearRampToValueAtTime(f * 1.5, t + idx * 0.06 + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, t + idx * 0.06);
    gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.2);
    osc.start(t + idx * 0.06);
    osc.stop(t + idx * 0.06 + 0.2);
  });
}

/** 대결 승리 시 드라마틱 폭발 사운드 */
export function playVictoryBlast(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runVictoryBlast(ctx)).catch(() => {});
    } else {
      runVictoryBlast(ctx);
    }
  } catch {
    /* 무시 */
  }
}

function runDefeatBlast(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
  osc.start(t);
  osc.stop(t + 0.32);

  const tail = ctx.createOscillator();
  const tailGain = ctx.createGain();
  tail.type = "square";
  tail.frequency.setValueAtTime(120, t + 0.22);
  tail.frequency.exponentialRampToValueAtTime(70, t + 0.42);
  tail.connect(tailGain);
  tailGain.connect(ctx.destination);
  tailGain.gain.setValueAtTime(0.001, t + 0.22);
  tailGain.gain.linearRampToValueAtTime(0.09, t + 0.24);
  tailGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
  tail.start(t + 0.22);
  tail.stop(t + 0.45);
}

/** 대결 패배 시 드라마틱 실패 사운드 */
export function playDefeatBlast(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => runDefeatBlast(ctx)).catch(() => {});
    } else {
      runDefeatBlast(ctx);
    }
  } catch {
    /* 무시 */
  }
}

let duelMachineInterval: ReturnType<typeof setInterval> | null = null;
let duelMachineStep = 0;
let duelMachineHumOsc: OscillatorNode | null = null;
let duelMachineHumGain: GainNode | null = null;
let bombBgmInterval: ReturnType<typeof setInterval> | null = null;
let bombBgmStep = 0;
let bombPadOsc: OscillatorNode | null = null;
let bombPadGain: GainNode | null = null;
let wordChainBgmInterval: ReturnType<typeof setInterval> | null = null;
let wordChainBgmStep = 0;
let wordChainPadOsc: OscillatorNode | null = null;
let wordChainPadGain: GainNode | null = null;
let memoryBgmInterval: ReturnType<typeof setInterval> | null = null;
let memoryBgmStep = 0;
let memoryPadOsc: OscillatorNode | null = null;
let memoryPadGain: GainNode | null = null;
let frogBgmInterval: ReturnType<typeof setInterval> | null = null;
let frogBgmStep = 0;
let frogPadOsc: OscillatorNode | null = null;
let frogPadGain: GainNode | null = null;

function runMachinePulse(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  at: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.76), at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, at + duration);
  osc.start(at);
  osc.stop(at + duration);
}

function runDuelMachineStep(ctx: AudioContext, step: number): void {
  const at = ctx.currentTime + 0.005;
  const bouncePattern = [523, 659, 784, 659, 880, 784, 659, 988];
  const sparklePattern = [1046, 0, 1175, 0, 1318, 0, 1175, 0];
  const idx = step % bouncePattern.length;
  const bounce = bouncePattern[idx];
  const sparkle = sparklePattern[idx];

  runMachinePulse(ctx, bounce, 0.09, "triangle", 0.012, at);
  if (sparkle > 0) runMachinePulse(ctx, sparkle, 0.06, "sine", 0.008, at + 0.02);
}

function startMachineHum(ctx: AudioContext): void {
  if (duelMachineHumOsc || duelMachineHumGain) return;
  duelMachineHumOsc = ctx.createOscillator();
  duelMachineHumGain = ctx.createGain();
  duelMachineHumOsc.type = "triangle";
  duelMachineHumOsc.frequency.setValueAtTime(392, ctx.currentTime);
  duelMachineHumGain.gain.setValueAtTime(0.001, ctx.currentTime);
  duelMachineHumGain.gain.linearRampToValueAtTime(0.0025, ctx.currentTime + 0.08);
  duelMachineHumOsc.connect(duelMachineHumGain);
  duelMachineHumGain.connect(ctx.destination);
  duelMachineHumOsc.start(ctx.currentTime);
}

function stopMachineHum(ctx: AudioContext): void {
  if (!duelMachineHumOsc || !duelMachineHumGain) return;
  try {
    duelMachineHumGain.gain.cancelScheduledValues(ctx.currentTime);
    duelMachineHumGain.gain.setValueAtTime(duelMachineHumGain.gain.value, ctx.currentTime);
    duelMachineHumGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    duelMachineHumOsc.stop(ctx.currentTime + 0.09);
  } catch {
    /* 무시 */
  } finally {
    duelMachineHumOsc = null;
    duelMachineHumGain = null;
  }
}

/** AI vs. Me용 기계 느낌 루프 배경음 시작 */
export function startDuelMachineBgm(): void {
  try {
    if (duelMachineInterval) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const startLoop = () => {
      if (duelMachineInterval) return;
      duelMachineStep = 0;
      startMachineHum(ctx);
      runDuelMachineStep(ctx, duelMachineStep);
      duelMachineStep += 1;
      duelMachineInterval = setInterval(() => {
        runDuelMachineStep(ctx, duelMachineStep);
        duelMachineStep += 1;
      }, 240);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(startLoop).catch(() => {});
    } else {
      startLoop();
    }
  } catch {
    /* 무시 */
  }
}

/** AI vs. Me용 기계 느낌 루프 배경음 정지 */
export function stopDuelMachineBgm(): void {
  try {
    if (duelMachineInterval) {
      clearInterval(duelMachineInterval);
      duelMachineInterval = null;
    }
    const ctx = getAudioContext();
    if (ctx) stopMachineHum(ctx);
  } catch {
    /* 무시 */
  }
}

function runBombTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  at: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.linearRampToValueAtTime(frequency * 1.08, at + duration * 0.5);
  osc.frequency.linearRampToValueAtTime(frequency, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.01, at + duration);
  osc.start(at);
  osc.stop(at + duration);
}

function runBombLoopStep(ctx: AudioContext, step: number): void {
  const at = ctx.currentTime + 0.005;
  const popPattern = [523, 659, 784, 659, 880, 784, 659, 523];
  const pluckPattern = [1046, 0, 988, 1175, 0, 988, 1318, 0];
  const idx = step % popPattern.length;
  const pop = popPattern[idx];
  const pluck = pluckPattern[idx];
  runBombTone(ctx, pop, 0.14, "triangle", 0.05, at);
  if (pluck > 0) runBombTone(ctx, pluck, 0.09, "sine", 0.035, at + 0.03);
}

function startBombPad(ctx: AudioContext): void {
  if (bombPadOsc || bombPadGain) return;
  bombPadOsc = ctx.createOscillator();
  bombPadGain = ctx.createGain();
  bombPadOsc.type = "triangle";
  bombPadOsc.frequency.setValueAtTime(262, ctx.currentTime);
  bombPadGain.gain.setValueAtTime(0.001, ctx.currentTime);
  bombPadGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
  bombPadOsc.connect(bombPadGain);
  bombPadGain.connect(ctx.destination);
  bombPadOsc.start(ctx.currentTime);
}

function stopBombPad(ctx: AudioContext): void {
  if (!bombPadOsc || !bombPadGain) return;
  try {
    bombPadGain.gain.cancelScheduledValues(ctx.currentTime);
    bombPadGain.gain.setValueAtTime(bombPadGain.gain.value, ctx.currentTime);
    bombPadGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    bombPadOsc.stop(ctx.currentTime + 0.09);
  } catch {
    /* 무시 */
  } finally {
    bombPadOsc = null;
    bombPadGain = null;
  }
}

/** 폭탄 돌리기용 통통 튀는 루프 배경음 시작 */
export function startBombBgm(): void {
  try {
    if (bombBgmInterval) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const startLoop = () => {
      if (bombBgmInterval) return;
      bombBgmStep = 0;
      startBombPad(ctx);
      runBombLoopStep(ctx, bombBgmStep);
      bombBgmStep += 1;
      bombBgmInterval = setInterval(() => {
        runBombLoopStep(ctx, bombBgmStep);
        bombBgmStep += 1;
      }, 240);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(startLoop).catch(() => {});
    } else {
      startLoop();
    }
  } catch {
    /* 무시 */
  }
}

/** 폭탄 돌리기용 루프 배경음 정지 */
export function stopBombBgm(): void {
  try {
    if (bombBgmInterval) {
      clearInterval(bombBgmInterval);
      bombBgmInterval = null;
    }
    const ctx = getAudioContext();
    if (ctx) stopBombPad(ctx);
  } catch {
    /* 무시 */
  }
}

function runWordChainTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  at: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.linearRampToValueAtTime(frequency * 1.04, at + duration * 0.55);
  osc.frequency.linearRampToValueAtTime(frequency * 0.98, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, at + duration);
  osc.start(at);
  osc.stop(at + duration);
}

function runWordChainLoopStep(ctx: AudioContext, step: number): void {
  const at = ctx.currentTime + 0.005;
  const melodyPattern = [523, 659, 784, 880, 784, 988, 1046, 1175];
  const chordPattern = [262, 330, 392, 330, 294, 370, 440, 370];
  const idx = step % melodyPattern.length;
  const melody = melodyPattern[idx];
  const chord = chordPattern[idx];
  runWordChainTone(ctx, chord, 0.15, "triangle", 0.012, at);
  runWordChainTone(ctx, melody, 0.1, "square", 0.02, at + 0.03);
  if (idx % 2 === 0) runWordChainTone(ctx, melody * 2, 0.07, "sine", 0.012, at + 0.08);
}

function startWordChainPad(ctx: AudioContext): void {
  if (wordChainPadOsc || wordChainPadGain) return;
  wordChainPadOsc = ctx.createOscillator();
  wordChainPadGain = ctx.createGain();
  wordChainPadOsc.type = "sine";
  wordChainPadOsc.frequency.setValueAtTime(196, ctx.currentTime);
  wordChainPadGain.gain.setValueAtTime(0.001, ctx.currentTime);
  wordChainPadGain.gain.linearRampToValueAtTime(0.003, ctx.currentTime + 0.08);
  wordChainPadOsc.connect(wordChainPadGain);
  wordChainPadGain.connect(ctx.destination);
  wordChainPadOsc.start(ctx.currentTime);
}

function stopWordChainPad(ctx: AudioContext): void {
  if (!wordChainPadOsc || !wordChainPadGain) return;
  try {
    wordChainPadGain.gain.cancelScheduledValues(ctx.currentTime);
    wordChainPadGain.gain.setValueAtTime(wordChainPadGain.gain.value, ctx.currentTime);
    wordChainPadGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    wordChainPadOsc.stop(ctx.currentTime + 0.09);
  } catch {
    /* 무시 */
  } finally {
    wordChainPadOsc = null;
    wordChainPadGain = null;
  }
}

/** 끝말잇기용 신나는 아케이드 루프 배경음 시작 */
export function startWordChainBgm(): void {
  try {
    if (wordChainBgmInterval) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const startLoop = () => {
      if (wordChainBgmInterval) return;
      wordChainBgmStep = 0;
      startWordChainPad(ctx);
      runWordChainLoopStep(ctx, wordChainBgmStep);
      wordChainBgmStep += 1;
      wordChainBgmInterval = setInterval(() => {
        runWordChainLoopStep(ctx, wordChainBgmStep);
        wordChainBgmStep += 1;
      }, 210);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(startLoop).catch(() => {});
    } else {
      startLoop();
    }
  } catch {
    /* 무시 */
  }
}

/** 끝말잇기용 신나는 아케이드 루프 배경음 정지 */
export function stopWordChainBgm(): void {
  try {
    if (wordChainBgmInterval) {
      clearInterval(wordChainBgmInterval);
      wordChainBgmInterval = null;
    }
    const ctx = getAudioContext();
    if (ctx) stopWordChainPad(ctx);
  } catch {
    /* 무시 */
  }
}

function runMemoryTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  at: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.linearRampToValueAtTime(frequency * 1.02, at + duration * 0.45);
  osc.frequency.linearRampToValueAtTime(frequency * 0.96, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.01, at + duration);
  osc.start(at);
  osc.stop(at + duration);
}

function runMemoryLoopStep(ctx: AudioContext, step: number): void {
  const at = ctx.currentTime + 0.005;
  const leadPattern = [392, 784, 523, 1046, 659, 1318, 587, 1175];
  const bassPattern = [110, 165, 123, 196, 146, 220, 130, 196];
  const idx = step % leadPattern.length;
  const lead = leadPattern[idx];
  const bass = bassPattern[idx];
  runMemoryTone(ctx, bass, 0.2, "sawtooth", 0.013, at);
  runMemoryTone(ctx, lead, 0.09, "triangle", 0.02, at + 0.03);
  runMemoryTone(ctx, lead * 1.5, 0.06, "sine", 0.01, at + 0.1);
  if (idx % 2 === 0) runMemoryTone(ctx, lead * 0.75, 0.05, "sawtooth", 0.008, at + 0.13);
}

function startMemoryPad(ctx: AudioContext): void {
  if (memoryPadOsc || memoryPadGain) return;
  memoryPadOsc = ctx.createOscillator();
  memoryPadGain = ctx.createGain();
  memoryPadOsc.type = "sawtooth";
  memoryPadOsc.frequency.setValueAtTime(98, ctx.currentTime);
  memoryPadGain.gain.setValueAtTime(0.001, ctx.currentTime);
  memoryPadGain.gain.linearRampToValueAtTime(0.0015, ctx.currentTime + 0.08);
  memoryPadOsc.connect(memoryPadGain);
  memoryPadGain.connect(ctx.destination);
  memoryPadOsc.start(ctx.currentTime);
}

function stopMemoryPad(ctx: AudioContext): void {
  if (!memoryPadOsc || !memoryPadGain) return;
  try {
    memoryPadGain.gain.cancelScheduledValues(ctx.currentTime);
    memoryPadGain.gain.setValueAtTime(memoryPadGain.gain.value, ctx.currentTime);
    memoryPadGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    memoryPadOsc.stop(ctx.currentTime + 0.09);
  } catch {
    /* 무시 */
  } finally {
    memoryPadOsc = null;
    memoryPadGain = null;
  }
}

/** 메모리 게임용 디지털 아르페지오 루프 배경음 시작 */
export function startMemoryBgm(): void {
  try {
    if (memoryBgmInterval) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const startLoop = () => {
      if (memoryBgmInterval) return;
      memoryBgmStep = 0;
      startMemoryPad(ctx);
      runMemoryLoopStep(ctx, memoryBgmStep);
      memoryBgmStep += 1;
      memoryBgmInterval = setInterval(() => {
        runMemoryLoopStep(ctx, memoryBgmStep);
        memoryBgmStep += 1;
      }, 220);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(startLoop).catch(() => {});
    } else {
      startLoop();
    }
  } catch {
    /* 무시 */
  }
}

/** 메모리 게임용 디지털 아르페지오 루프 배경음 정지 */
export function stopMemoryBgm(): void {
  try {
    if (memoryBgmInterval) {
      clearInterval(memoryBgmInterval);
      memoryBgmInterval = null;
    }
    const ctx = getAudioContext();
    if (ctx) stopMemoryPad(ctx);
  } catch {
    /* 무시 */
  }
}

function runFrogCroak(ctx: AudioContext, at: number, volume = 0.06): void {
  const main = ctx.createOscillator();
  const body = ctx.createOscillator();
  const mix = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  main.type = "triangle";
  main.frequency.setValueAtTime(235, at);
  main.frequency.exponentialRampToValueAtTime(178, at + 0.085);

  body.type = "sine";
  body.frequency.setValueAtTime(330, at);
  body.frequency.exponentialRampToValueAtTime(245, at + 0.085);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, at);
  filter.frequency.exponentialRampToValueAtTime(650, at + 0.09);

  main.connect(mix);
  body.connect(mix);
  mix.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  mix.gain.setValueAtTime(0.58, at);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, at + 0.1);

  main.start(at);
  body.start(at);
  main.stop(at + 0.1);
  body.stop(at + 0.1);
}

/** 청개구리 게임용 짧은 개구리 효과음 */
export function playFrogCroak(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const playNow = () => runFrogCroak(ctx, ctx.currentTime + 0.005, 0.08);
    if (ctx.state === "suspended") {
      ctx.resume().then(playNow).catch(() => {});
    } else {
      playNow();
    }
  } catch {
    /* 무시 */
  }
}

function runFrogTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  at: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.linearRampToValueAtTime(frequency * 1.03, at + duration * 0.45);
  osc.frequency.linearRampToValueAtTime(frequency * 0.92, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, at + duration);
  osc.start(at);
  osc.stop(at + duration);
}

function runFrogLoopStep(ctx: AudioContext, step: number): void {
  const at = ctx.currentTime + 0.005;
  const bellPattern = [392, 0, 523, 659, 0, 523, 440, 0];
  const pulsePattern = [196, 220, 196, 165, 196, 220, 247, 220];
  const idx = step % bellPattern.length;
  const bell = bellPattern[idx];
  runFrogTone(ctx, pulsePattern[idx], 0.16, "triangle", 0.012, at);
  if (bell > 0) runFrogTone(ctx, bell, 0.08, "sine", 0.02, at + 0.03);
  // 크로크 빈도는 낮춰서 실제 개구리처럼 간헐적으로 배치
  if (idx === 3) runFrogCroak(ctx, at + 0.09, 0.05);
  if (idx === 7) runFrogCroak(ctx, at + 0.1, 0.042);
}

function startFrogPad(ctx: AudioContext): void {
  if (frogPadOsc || frogPadGain) return;
  frogPadOsc = ctx.createOscillator();
  frogPadGain = ctx.createGain();
  frogPadOsc.type = "triangle";
  frogPadOsc.frequency.setValueAtTime(123, ctx.currentTime);
  frogPadGain.gain.setValueAtTime(0.001, ctx.currentTime);
  frogPadGain.gain.linearRampToValueAtTime(0.0018, ctx.currentTime + 0.08);
  frogPadOsc.connect(frogPadGain);
  frogPadGain.connect(ctx.destination);
  frogPadOsc.start(ctx.currentTime);
}

function stopFrogPad(ctx: AudioContext): void {
  if (!frogPadOsc || !frogPadGain) return;
  try {
    frogPadGain.gain.cancelScheduledValues(ctx.currentTime);
    frogPadGain.gain.setValueAtTime(frogPadGain.gain.value, ctx.currentTime);
    frogPadGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    frogPadOsc.stop(ctx.currentTime + 0.09);
  } catch {
    /* 무시 */
  } finally {
    frogPadOsc = null;
    frogPadGain = null;
  }
}

/** 청개구리 게임용 개구리+벨 루프 배경음 시작 */
export function startFrogBgm(): void {
  try {
    if (frogBgmInterval) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const startLoop = () => {
      if (frogBgmInterval) return;
      frogBgmStep = 0;
      startFrogPad(ctx);
      runFrogLoopStep(ctx, frogBgmStep);
      frogBgmStep += 1;
      frogBgmInterval = setInterval(() => {
        runFrogLoopStep(ctx, frogBgmStep);
        frogBgmStep += 1;
      }, 230);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(startLoop).catch(() => {});
    } else {
      startLoop();
    }
  } catch {
    /* 무시 */
  }
}

/** 청개구리 게임용 배경음 정지 */
export function stopFrogBgm(): void {
  try {
    if (frogBgmInterval) {
      clearInterval(frogBgmInterval);
      frogBgmInterval = null;
    }
    const ctx = getAudioContext();
    if (ctx) stopFrogPad(ctx);
  } catch {
    /* 무시 */
  }
}
