let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "square", volume = 0.1) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export const Sound = {
  click: () => playTone(800, 0.05, "square", 0.05),

  crush: () => {
    playTone(150, 0.3, "sawtooth", 0.08);
    setTimeout(() => playTone(100, 0.4, "sawtooth", 0.06), 150);
    setTimeout(() => playTone(60, 0.5, "sawtooth", 0.04), 350);
  },

  message: () => {
    playTone(600, 0.08, "sine", 0.06);
    setTimeout(() => playTone(900, 0.1, "sine", 0.06), 80);
  },

  typing: () => playTone(400 + Math.random() * 200, 0.03, "square", 0.03),

  notification: () => {
    playTone(523, 0.1, "sine", 0.08);
    setTimeout(() => playTone(659, 0.1, "sine", 0.08), 120);
    setTimeout(() => playTone(784, 0.15, "sine", 0.08), 240);
  },
};
