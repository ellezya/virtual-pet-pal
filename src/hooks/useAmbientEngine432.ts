import { useRef, useCallback } from 'react';
import morningBreezebirds from '@/assets/morning-breeze-birds.mp3';
import cricketsBreeze from '@/assets/crickets-breeze-thunder.mp3';

/**
 * EXPERIMENTAL: Procedural 432 Hz ambient music engine.
 * 
 * Generates warm, layered ambient music in real-time using Web Audio API.
 * All frequencies are tuned to A=432 Hz (detune -31.77 cents from standard A=440).
 * 
 * Scene moods:
 *   room   → warm, sleepy pads with slow arpeggios
 *   park   → airy, bright tones with gentle bells
 *   habitat → cozy lo-fi pads
 *   reef   → dreamy underwater shimmer
 *   castle → ethereal reverb-heavy pads
 *   shell  → intimate, close-mic warmth
 */

type SceneType = 'habitat' | 'room' | 'park' | 'reef' | 'castle' | 'shell';

// 432 Hz detune offset in cents (relative to 440 Hz standard)
const DETUNE_432 = -31.77;

// Pentatonic scales in different moods (base frequencies at 440 tuning, detuned at play time)
const SCALES = {
  // D minor pentatonic – warm, meditative
  warm: [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0],
  // C major pentatonic – bright, peaceful
  bright: [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0],
  // A minor pentatonic – dreamy, contemplative
  dreamy: [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63],
  // F lydian-ish – ethereal, floating
  ethereal: [174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0],
};

const SCENE_CONFIG: Record<SceneType, {
  scale: number[];
  padFilterFreq: number;
  padAttack: number;
  padRelease: number;
  arpeggioSpeed: number;
  arpeggioChance: number;
  padInterval: number;
  shimmerAmount: number;
  reverbMix: number;
  brightness: number;
}> = {
  room: {
    scale: SCALES.warm,
    padFilterFreq: 400,
    padAttack: 2.0,
    padRelease: 4.0,
    arpeggioSpeed: 3000,
    arpeggioChance: 0.3,
    padInterval: 8000,
    shimmerAmount: 0.05,
    reverbMix: 0.4,
    brightness: 0.3,
  },
  habitat: {
    scale: SCALES.warm,
    padFilterFreq: 500,
    padAttack: 1.5,
    padRelease: 3.5,
    arpeggioSpeed: 2500,
    arpeggioChance: 0.4,
    padInterval: 7000,
    shimmerAmount: 0.08,
    reverbMix: 0.35,
    brightness: 0.5,
  },
  park: {
    scale: SCALES.bright,
    padFilterFreq: 700,
    padAttack: 1.2,
    padRelease: 3.0,
    arpeggioSpeed: 2000,
    arpeggioChance: 0.5,
    padInterval: 6000,
    shimmerAmount: 0.12,
    reverbMix: 0.3,
    brightness: 0.7,
  },
  reef: {
    scale: SCALES.dreamy,
    padFilterFreq: 550,
    padAttack: 2.5,
    padRelease: 5.0,
    arpeggioSpeed: 3500,
    arpeggioChance: 0.35,
    padInterval: 9000,
    shimmerAmount: 0.15,
    reverbMix: 0.6,
    brightness: 0.4,
  },
  castle: {
    scale: SCALES.ethereal,
    padFilterFreq: 600,
    padAttack: 2.0,
    padRelease: 5.0,
    arpeggioSpeed: 3000,
    arpeggioChance: 0.25,
    padInterval: 9000,
    shimmerAmount: 0.1,
    reverbMix: 0.7,
    brightness: 0.45,
  },
  shell: {
    scale: SCALES.warm,
    padFilterFreq: 450,
    padAttack: 1.0,
    padRelease: 2.5,
    arpeggioSpeed: 2800,
    arpeggioChance: 0.35,
    padInterval: 6500,
    shimmerAmount: 0.06,
    reverbMix: 0.25,
    brightness: 0.4,
  },
};

interface Engine432Nodes {
  masterGain: GainNode | null;
  padInterval: ReturnType<typeof setInterval> | null;
  arpeggioInterval: ReturnType<typeof setInterval> | null;
  lfoInterval: ReturnType<typeof setInterval> | null;
  activeOscillators: OscillatorNode[];
  convolver: ConvolverNode | null;
}

export const useAmbientEngine432 = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Engine432Nodes>({
    masterGain: null,
    padInterval: null,
    arpeggioInterval: null,
    lfoInterval: null,
    activeOscillators: [],
    convolver: null,
  });
  const sceneRef = useRef<SceneType>('habitat');

  const getCtx = useCallback(() => {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new Ctor();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  }, []);

  // Create a simple impulse-response reverb
  const createReverb = useCallback((ctx: AudioContext, duration: number = 2.5, decay: number = 2.0) => {
    const length = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }, []);

  // Play a warm, evolving pad chord
  const playPad = useCallback((frequencies: number[], config: typeof SCENE_CONFIG['room']) => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const master = nodesRef.current.masterGain;
    if (!master) return;

    const totalDur = config.padAttack + config.padRelease + 2;

    // Pad envelope
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0, t);
    padGain.gain.linearRampToValueAtTime(0.25, t + config.padAttack);
    padGain.gain.setValueAtTime(0.25, t + config.padAttack + 2);
    padGain.gain.exponentialRampToValueAtTime(0.001, t + totalDur);

    // Warmth filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.padFilterFreq, t);
    // Slow filter sweep for movement
    filter.frequency.linearRampToValueAtTime(
      config.padFilterFreq * (1 + config.brightness * 0.5),
      t + config.padAttack
    );
    filter.frequency.linearRampToValueAtTime(config.padFilterFreq * 0.8, t + totalDur);
    filter.Q.setValueAtTime(0.5, t);

    padGain.connect(filter);

    // Split: dry + reverb
    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(1 - config.reverbMix, t);
    filter.connect(dryGain);
    dryGain.connect(master);

    if (nodesRef.current.convolver) {
      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(config.reverbMix, t);
      filter.connect(wetGain);
      wetGain.connect(nodesRef.current.convolver);
    }

    // Create oscillators for each note in the chord
    frequencies.forEach((freq, idx) => {
      // Main tone (triangle for warmth)
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(DETUNE_432 + (Math.random() - 0.5) * 4, t);
      // Gentle vibrato
      const vibratoDepth = 2 + Math.random() * 2;
      const vibratoRate = 0.3 + Math.random() * 0.4;
      // Use a subtle sine modulation
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(vibratoRate, t);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(vibratoDepth, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start(t);
      lfo.stop(t + totalDur + 0.5);

      // Sub-octave for depth (only on lowest note)
      if (idx === 0) {
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(freq * 0.5, t);
        sub.detune.setValueAtTime(DETUNE_432, t);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.3, t);
        sub.connect(subGain);
        subGain.connect(padGain);
        sub.start(t);
        sub.stop(t + totalDur + 0.2);
        nodesRef.current.activeOscillators.push(sub);
      }

      // Shimmer overtone (sine at 2x, very quiet)
      if (config.shimmerAmount > 0) {
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(freq * 2.01, t); // slight detune for chorus
        shimmer.detune.setValueAtTime(DETUNE_432 + 5, t);
        const shimGain = ctx.createGain();
        shimGain.gain.setValueAtTime(config.shimmerAmount, t);
        shimGain.gain.exponentialRampToValueAtTime(0.001, t + totalDur * 0.6);
        shimmer.connect(shimGain);
        shimGain.connect(padGain);
        shimmer.start(t);
        shimmer.stop(t + totalDur + 0.2);
        nodesRef.current.activeOscillators.push(shimmer);
      }

      osc.connect(padGain);
      osc.start(t);
      osc.stop(t + totalDur + 0.2);

      nodesRef.current.activeOscillators.push(osc);

      osc.onended = () => {
        nodesRef.current.activeOscillators = nodesRef.current.activeOscillators.filter(o => o !== osc);
        try { osc.disconnect(); } catch {}
        try { lfo.disconnect(); } catch {}
        try { lfoGain.disconnect(); } catch {}
      };
    });

    // Cleanup
    setTimeout(() => {
      try { padGain.disconnect(); } catch {}
      try { filter.disconnect(); } catch {}
      try { dryGain.disconnect(); } catch {}
    }, (totalDur + 1) * 1000);
  }, [getCtx]);

  // Play a gentle arpeggio note
  const playArpeggioNote = useCallback((freq: number, config: typeof SCENE_CONFIG['room']) => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const master = nodesRef.current.masterGain;
    if (!master) return;

    const dur = 1.5 + Math.random() * 1.5;

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.padFilterFreq * 1.5, t);
    filter.frequency.exponentialRampToValueAtTime(config.padFilterFreq * 0.5, t + dur);

    // Delay for space
    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.15 + Math.random() * 0.1, t);
    const delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.25, t);

    noteGain.connect(filter);
    filter.connect(master);
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(master);

    if (nodesRef.current.convolver) {
      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(config.reverbMix * 0.5, t);
      filter.connect(wetGain);
      wetGain.connect(nodesRef.current.convolver);
    }

    const osc = ctx.createOscillator();
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.setValueAtTime(DETUNE_432, t);
    osc.connect(noteGain);
    osc.start(t);
    osc.stop(t + dur + 0.2);

    nodesRef.current.activeOscillators.push(osc);
    osc.onended = () => {
      nodesRef.current.activeOscillators = nodesRef.current.activeOscillators.filter(o => o !== osc);
      try { osc.disconnect(); } catch {}
    };

    setTimeout(() => {
      try { noteGain.disconnect(); } catch {}
      try { filter.disconnect(); } catch {}
      try { delay.disconnect(); } catch {}
      try { delayGain.disconnect(); } catch {}
    }, (dur + 1) * 1000);
  }, [getCtx]);

  // Pick a random chord from the scale (root + third + fifth in pentatonic)
  const getRandomChord = useCallback((scale: number[]): number[] => {
    const rootIdx = Math.floor(Math.random() * Math.max(1, scale.length - 4));
    return [scale[rootIdx], scale[rootIdx + 2], scale[rootIdx + 4]].filter(Boolean);
  }, []);

  const start = useCallback((scene: SceneType) => {
    // Stop any existing engine first
    stopEngine();

    sceneRef.current = scene;
    const config = SCENE_CONFIG[scene];
    const ctx = getCtx();

    console.log('[432hz] Starting ambient engine for scene:', scene);

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2); // Fade in
    masterGain.connect(ctx.destination);
    nodesRef.current.masterGain = masterGain;

    // Reverb
    const convolver = createReverb(ctx, 2.5 + config.reverbMix * 2, 2.0);
    convolver.connect(masterGain);
    nodesRef.current.convolver = convolver;

    // Play initial pad
    const chord = getRandomChord(config.scale);
    playPad(chord, config);

    // Schedule recurring pads
    const padInterval = setInterval(() => {
      const c = getRandomChord(SCENE_CONFIG[sceneRef.current].scale);
      playPad(c, SCENE_CONFIG[sceneRef.current]);
    }, config.padInterval + Math.random() * 2000);
    nodesRef.current.padInterval = padInterval;

    // Schedule arpeggios (probabilistic)
    const arpeggioInterval = setInterval(() => {
      const cfg = SCENE_CONFIG[sceneRef.current];
      if (Math.random() < cfg.arpeggioChance) {
        const scale = cfg.scale;
        // Pick 2-4 notes from upper half of scale for gentle melodic motion
        const upperScale = scale.slice(Math.floor(scale.length / 2));
        const noteCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < noteCount; i++) {
          setTimeout(() => {
            const note = upperScale[Math.floor(Math.random() * upperScale.length)];
            playArpeggioNote(note, cfg);
          }, i * (400 + Math.random() * 300));
        }
      }
    }, 4000 + Math.random() * 2000);
    nodesRef.current.arpeggioInterval = arpeggioInterval;
  }, [getCtx, createReverb, getRandomChord, playPad, playArpeggioNote]);

  const stopEngine = useCallback(() => {
    console.log('[432hz] Stopping ambient engine');

    // Clear intervals
    if (nodesRef.current.padInterval) {
      clearInterval(nodesRef.current.padInterval);
      nodesRef.current.padInterval = null;
    }
    if (nodesRef.current.arpeggioInterval) {
      clearInterval(nodesRef.current.arpeggioInterval);
      nodesRef.current.arpeggioInterval = null;
    }
    if (nodesRef.current.lfoInterval) {
      clearInterval(nodesRef.current.lfoInterval);
      nodesRef.current.lfoInterval = null;
    }

    // Stop all oscillators
    nodesRef.current.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch {}
      try { osc.disconnect(); } catch {}
    });
    nodesRef.current.activeOscillators = [];

    // Fade out master
    if (nodesRef.current.masterGain) {
      try {
        const ctx = audioContextRef.current;
        if (ctx && ctx.state !== 'closed') {
          nodesRef.current.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
          setTimeout(() => {
            try { nodesRef.current.masterGain?.disconnect(); } catch {}
            nodesRef.current.masterGain = null;
          }, 600);
        } else {
          try { nodesRef.current.masterGain.disconnect(); } catch {}
          nodesRef.current.masterGain = null;
        }
      } catch {
        nodesRef.current.masterGain = null;
      }
    }

    // Disconnect convolver
    if (nodesRef.current.convolver) {
      try { nodesRef.current.convolver.disconnect(); } catch {}
      nodesRef.current.convolver = null;
    }
  }, []);

  const updateScene = useCallback((scene: SceneType) => {
    if (sceneRef.current === scene) return;
    sceneRef.current = scene;
    // Scene config changes are picked up dynamically by the intervals
    console.log('[432hz] Scene updated to:', scene);
  }, []);

  const isRunning = useCallback(() => {
    return !!nodesRef.current.masterGain;
  }, []);

  return { start, stop: stopEngine, updateScene, isRunning };
};
