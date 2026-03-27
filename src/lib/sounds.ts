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

function runMachineHat(ctx: AudioContext, at: number): void {
  const duration = 0.045;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const decay = 1 - i / bufferSize;
    output[i] = (Math.random() * 2 - 1) * decay;
  }
  const src = ctx.createBufferSource();
  const band = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buffer;
  band.type = "highpass";
  band.frequency.setValueAtTime(4800, at);
  src.connect(band);
  band.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(0.03, at + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.01, at + duration);
  src.start(at);
  src.stop(at + duration);
}

function runDuelMachineStep(ctx: AudioContext, step: number): void {
  const at = ctx.currentTime + 0.005;
  const bassPattern = [110, 0, 98, 0, 123, 0, 92, 0];
  const leadPattern = [660, 0, 740, 620, 0, 700, 0, 780];
  const idx = step % bassPattern.length;
  const bass = bassPattern[idx];
  const lead = leadPattern[idx];

  if (bass > 0) runMachinePulse(ctx, bass, 0.13, "square", 0.05, at);
  if (lead > 0) runMachinePulse(ctx, lead, 0.09, "triangle", 0.035, at + 0.01);
  runMachineHat(ctx, at + 0.02);
}

function startMachineHum(ctx: AudioContext): void {
  if (duelMachineHumOsc || duelMachineHumGain) return;
  duelMachineHumOsc = ctx.createOscillator();
  duelMachineHumGain = ctx.createGain();
  duelMachineHumOsc.type = "sawtooth";
  duelMachineHumOsc.frequency.setValueAtTime(58, ctx.currentTime);
  duelMachineHumGain.gain.setValueAtTime(0.001, ctx.currentTime);
  duelMachineHumGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.08);
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
  osc.frequency.linearRampToValueAtTime(frequency * 0.92, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, at + duration);
  osc.start(at);
  osc.stop(at + duration);
}

function runBombLoopStep(ctx: AudioContext, step: number): void {
  const at = ctx.currentTime + 0.005;
  const bassPattern = [196, 0, 185, 0, 208, 0, 174, 0];
  const bellPattern = [784, 0, 880, 0, 784, 0, 988, 0];
  const idx = step % bassPattern.length;
  const bass = bassPattern[idx];
  const bell = bellPattern[idx];
  if (bass > 0) runBombTone(ctx, bass, 0.2, "triangle", 0.045, at);
  if (bell > 0) runBombTone(ctx, bell, 0.12, "sine", 0.03, at + 0.04);
}

function startBombPad(ctx: AudioContext): void {
  if (bombPadOsc || bombPadGain) return;
  bombPadOsc = ctx.createOscillator();
  bombPadGain = ctx.createGain();
  bombPadOsc.type = "sine";
  bombPadOsc.frequency.setValueAtTime(146, ctx.currentTime);
  bombPadGain.gain.setValueAtTime(0.001, ctx.currentTime);
  bombPadGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.08);
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

/** 폭탄 돌리기용 긴장+귀여운 루프 배경음 시작 */
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
      }, 280);
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
