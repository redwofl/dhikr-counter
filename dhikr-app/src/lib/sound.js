let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Browsers start the AudioContext in a "suspended" state until a user
  // gesture resumes it — without this, no sound is ever heard.
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a single tone with a smooth attack and exponential decay.
 */
function tone({ freq, type = "sine", start = 0, duration = 0.15, peak = 0.15, attack = 0.005, detune = 0 }) {
  const ctx = getCtx();
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// --- Tap sound variants -------------------------------------------------
// Each variant is a small layered composition using tone().

const TAP_VARIANTS = {
  // Soft "wood block" — tactile, traditional tasbih feel
  wood() {
    tone({ freq: 220, type: "sine", duration: 0.12, peak: 0.45, attack: 0.002 });
    tone({ freq: 880, type: "sine", duration: 0.22, peak: 0.28, attack: 0.004 });
    tone({ freq: 1320, type: "sine", duration: 0.14, peak: 0.14, attack: 0.003 });
  },
  // Gentle bell chime — peaceful and calm
  chime() {
    tone({ freq: 660, type: "sine", duration: 0.4, peak: 0.28, attack: 0.006 });
    tone({ freq: 990, type: "sine", duration: 0.3, peak: 0.16, attack: 0.006 });
    tone({ freq: 1980, type: "sine", duration: 0.16, peak: 0.07, attack: 0.004 });
  },
  // Glass tap — bright, clean tap like tapping a glass
  crystal() {
    tone({ freq: 1400, type: "sine", duration: 0.07, peak: 0.4, attack: 0.001 });
    tone({ freq: 2800, type: "sine", duration: 0.04, peak: 0.2, attack: 0.001 });
    tone({ freq: 4200, type: "sine", duration: 0.03, peak: 0.1, attack: 0.001 });
  },
  // Soft pop — gentle bubble pop sound
  pop() {
    const ctx = getCtx();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(500, t0);
    osc.frequency.exponentialRampToValueAtTime(150, t0 + 0.1);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.4, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  },
  // Mechanical tick — sharp, crisp click like a physical counter
  tick() {
    tone({ freq: 800, type: "square", duration: 0.06, peak: 0.4, attack: 0.001 });
    tone({ freq: 1600, type: "square", duration: 0.03, peak: 0.2, attack: 0.001 });
  },
  // Digital beep — modern electronic beep
  beep() {
    tone({ freq: 1000, type: "square", duration: 0.1, peak: 0.3, attack: 0.002 });
    tone({ freq: 2000, type: "square", duration: 0.06, peak: 0.15, attack: 0.002 });
  },
  // Marimba — warm wooden tone
  marimba() {
    tone({ freq: 440, type: "sine", duration: 0.25, peak: 0.35, attack: 0.003 });
    tone({ freq: 880, type: "sine", duration: 0.18, peak: 0.2, attack: 0.004 });
    tone({ freq: 1320, type: "sine", duration: 0.12, peak: 0.1, attack: 0.003 });
  },
  // Misbaha — traditional wooden prayer beads click, deep and resonant
  misbaha() {
    tone({ freq: 180, type: "sine", duration: 0.18, peak: 0.5, attack: 0.002 });
    tone({ freq: 360, type: "sine", duration: 0.25, peak: 0.3, attack: 0.003 });
    tone({ freq: 540, type: "sine", duration: 0.12, peak: 0.15, attack: 0.002 });
  },
  // Minbar — soft wooden pulpit tap, warm and grounding
  minbar() {
    tone({ freq: 220, type: "sine", duration: 0.2, peak: 0.4, attack: 0.003 });
    tone({ freq: 440, type: "triangle", duration: 0.15, peak: 0.2, attack: 0.002 });
    tone({ freq: 660, type: "sine", duration: 0.1, peak: 0.1, attack: 0.002 });
  },
  // Tasbih — traditional bead sound, bright wooden click
  tasbih() {
    tone({ freq: 300, type: "sine", duration: 0.1, peak: 0.45, attack: 0.001 });
    tone({ freq: 900, type: "sine", duration: 0.08, peak: 0.25, attack: 0.002 });
    tone({ freq: 1500, type: "sine", duration: 0.05, peak: 0.1, attack: 0.001 });
  },
  // Adhan — subtle melodic tone reminiscent of call to prayer
  adhan() {
    tone({ freq: 329.63, type: "sine", duration: 0.35, peak: 0.25, attack: 0.01 });
    tone({ freq: 415.3, type: "sine", duration: 0.25, peak: 0.15, attack: 0.01 });
    tone({ freq: 493.88, type: "sine", duration: 0.2, peak: 0.1, attack: 0.008 });
  },
  // Quran — gentle reverent tone, soft and contemplative
  quran() {
    tone({ freq: 261.63, type: "sine", duration: 0.3, peak: 0.2, attack: 0.015 });
    tone({ freq: 329.63, type: "sine", duration: 0.25, peak: 0.12, attack: 0.01 });
    tone({ freq: 392, type: "sine", duration: 0.2, peak: 0.08, attack: 0.01 });
  }
};

export function playTapSound(variant = "wood") {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    (TAP_VARIANTS[variant] || TAP_VARIANTS.wood)();
  } catch (e) {
    /* audio unsupported, fail silently */
  }
}

export function playCompleteSound() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  // Warm ascending arpeggio: C6 → E6 → G6 (major triad)
  [523.25, 659.25, 783.99].forEach((f, i) => {
    tone({
      freq: f,
      type: "sine",
      start: i * 0.12,
      duration: 0.55,
      peak: 0.3,
      attack: 0.01,
    });
    // soft octave doubling for richness
    tone({
      freq: f * 2,
      type: "sine",
      start: i * 0.12,
      duration: 0.35,
      peak: 0.1,
      attack: 0.01,
    });
  });
  } catch (e) {
    /* audio unsupported, fail silently */
  }
}

export function vibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {
    /* vibration unsupported, fail silently */
  }
}

/**
 * Call once on app mount: unlocks audio on the first user interaction.
 * Some browsers require the AudioContext to be resumed inside a real
 * user-gesture event before any sound can play.
 */
export function unlockAudioOnFirstInteraction() {
  const unlock = () => {
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch (e) {
      /* ignore */
    }
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("touchstart", unlock);
  };
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true });
}

/**
 * Force unlock audio context - call before playing any sound.
 * Useful for sound previews in settings where user click is the gesture.
 */
export function forceUnlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      return ctx.resume().catch(() => {});
    }
  } catch (e) {
    /* ignore */
  }
  return Promise.resolve();
}
