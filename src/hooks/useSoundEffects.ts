import { useRef, useCallback, useEffect, useState } from 'react';

interface SoundEffectsReturn {
  playHop: () => void;
  playEat: () => void;
  playDrink: () => void;
  playClean: () => void;
  playPlay: () => void;
  playPoop: () => void;
  playHay: () => void;
  playFlutter: () => void;
  toggleAmbient: () => void;
  isAmbientPlaying: boolean;
  /** 0..1 wind loudness estimate for UI effects (curtains, particles, etc.) */
  windIntensity: number;
}

type PetType = 'bunny' | 'fish';

export const useSoundEffects = (currentPet: PetType = 'bunny'): SoundEffectsReturn => {
  /**
   * CRITICAL: WebAudio sound engine for Lola and Tula.
   * Keep this hook stable and self-contained (UI should only call the exported functions).
   */
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentPetRef = useRef<PetType>(currentPet);
  const ambientNodesRef = useRef<{
    wind: AudioBufferSourceNode | null;
    windGain: GainNode | null;
    windAnalyser: AnalyserNode | null;
    windLfo: OscillatorNode | null;
    birdInterval: ReturnType<typeof setInterval> | null;
    childrenInterval: ReturnType<typeof setInterval> | null;
    waterBubblesInterval: ReturnType<typeof setInterval> | null;
    waterFlowNode: AudioBufferSourceNode | null;
    waterFlowGain: GainNode | null;
    musicOscillators: OscillatorNode[];
    musicGain: GainNode | null;
    musicInterval: ReturnType<typeof setInterval> | null;
  }>({
    wind: null,
    windGain: null,
    windAnalyser: null,
    windLfo: null,
    birdInterval: null,
    childrenInterval: null,
    waterBubblesInterval: null,
    waterFlowNode: null,
    waterFlowGain: null,
    musicOscillators: [],
    musicGain: null,
    musicInterval: null,
  });
  
  // Keep currentPet ref updated
  useEffect(() => {
    currentPetRef.current = currentPet;
  }, [currentPet]);


  // Track if audio has been unlocked by user gesture
  const hasUnlockedRef = useRef(false);

  // Read persisted preference once per render; React will only use it on mount.
  // IMPORTANT: keep this in sync with shouldStartAmbientRef to avoid "turning back on" after remounts.
  const initialAmbientOn = (() => {
    try {
      const raw = window.localStorage.getItem('lola_ambient_on');
      if (raw === null) return true;
      return raw === '1';
    } catch {
      return true;
    }
  })();

  // Track if ambient should start once unlocked
  const shouldStartAmbientRef = useRef(initialAmbientOn);

  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(initialAmbientOn);

  // Expose a small (0..1) proxy value to drive UI animations.
  const [windIntensity, setWindIntensity] = useState(0);
  const windMeterRafRef = useRef<number | null>(null);

  // Used to detect when timers/audio stall (e.g. aggressive background throttling)
  const lastMusicTickRef = useRef<number>(Date.now());

  const musicVolume = 0.12;
  const sfxVolume = 0.8;
  const ambientVolume = 0.35;

  // Initialize audio context and attempt resume
  const getAudioContext = useCallback(() => {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;

    // Recreate if missing or the browser closed it (some mobile browsers do this under memory pressure)
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioCtor();
    }

    const ctx = audioContextRef.current;

    // Lightweight debug trail for when browsers suspend/close audio (helps diagnose random cut-outs)
    ctx.onstatechange = () => {
      // eslint-disable-next-line no-console
      console.debug('[audio] AudioContext state:', ctx.state);
    };

    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    return ctx;
  }, []);

  const unlockAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') {
      void ctx.resume().catch(() => {});
    }
  }, [getAudioContext]);

  // Soft puff sound for hopping - like a gentle landing
  const playHop = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.06);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(sfxVolume * 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.1);
  }, [getAudioContext]);

  // Crunchy eating sound
  const playEat = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600 + Math.random() * 300, time + i * 0.15);
      osc.frequency.exponentialRampToValueAtTime(150, time + i * 0.15 + 0.06);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, time);
      filter.Q.setValueAtTime(3, time);
      
      gain.gain.setValueAtTime(0, time + i * 0.15);
      gain.gain.linearRampToValueAtTime(sfxVolume * 0.25, time + i * 0.15 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.15 + 0.08);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.15);
      osc.stop(time + i * 0.15 + 0.1);
    }
  }, [getAudioContext]);

  // Gentle sipping/lapping sound
  const playDrink = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350 + Math.random() * 80, time + i * 0.2);
      osc.frequency.exponentialRampToValueAtTime(180, time + i * 0.2 + 0.08);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, time);
      
      gain.gain.setValueAtTime(0, time + i * 0.2);
      gain.gain.linearRampToValueAtTime(sfxVolume * 0.3, time + i * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.2 + 0.12);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.2);
      osc.stop(time + i * 0.2 + 0.15);
    }
  }, [getAudioContext]);

  // Sweeping/brushing clean sound
  const playClean = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, time);
    filter.frequency.linearRampToValueAtTime(3500, time + 0.3);
    filter.frequency.linearRampToValueAtTime(1200, time + 0.6);
    filter.Q.setValueAtTime(1.5, time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(sfxVolume * 0.35, time + 0.1);
    gain.gain.linearRampToValueAtTime(0, time + 0.6);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.6);
  }, [getAudioContext]);

  // Playful bouncy sound
  const playPlay = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const notes = [523, 659, 784, 880, 784];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time + i * 0.1);
      
      gain.gain.setValueAtTime(sfxVolume * 0.3, time + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.1);
      osc.stop(time + i * 0.1 + 0.15);
    });
  }, [getAudioContext]);

  // Soft, low-pitched magical poop sound
  const playPoop = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Soft low whoosh
    const whooshOsc = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    const whooshFilter = ctx.createBiquadFilter();
    
    whooshOsc.type = 'sine';
    whooshOsc.frequency.setValueAtTime(120, time);
    whooshOsc.frequency.exponentialRampToValueAtTime(60, time + 0.2);
    
    whooshFilter.type = 'lowpass';
    whooshFilter.frequency.setValueAtTime(300, time);
    
    whooshGain.gain.setValueAtTime(0, time);
    whooshGain.gain.linearRampToValueAtTime(sfxVolume * 0.12, time + 0.05);
    whooshGain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
    
    whooshOsc.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    
    whooshOsc.start(time);
    whooshOsc.stop(time + 0.3);
    
    // Soft bubbles (lower pitch, quieter)
    for (let i = 0; i < 3; i++) {
      const bubbleOsc = ctx.createOscillator();
      const bubbleGain = ctx.createGain();
      
      bubbleOsc.type = 'sine';
      const startFreq = 150 + Math.random() * 80;
      bubbleOsc.frequency.setValueAtTime(startFreq, time + 0.15 + i * 0.08);
      bubbleOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.6, time + 0.15 + i * 0.08 + 0.1);
      
      bubbleGain.gain.setValueAtTime(0, time + 0.15 + i * 0.08);
      bubbleGain.gain.linearRampToValueAtTime(sfxVolume * 0.1, time + 0.15 + i * 0.08 + 0.02);
      bubbleGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15 + i * 0.08 + 0.12);
      
      bubbleOsc.connect(bubbleGain);
      bubbleGain.connect(ctx.destination);
      
      bubbleOsc.start(time + 0.15 + i * 0.08);
      bubbleOsc.stop(time + 0.15 + i * 0.08 + 0.15);
    }
    
    // Gentle sparkle (lower frequencies, softer)
    const sparkleNotes = [1200, 1600, 1400];
    sparkleNotes.forEach((freq, i) => {
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      
      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(freq, time + 0.4 + i * 0.05);
      
      sparkleGain.gain.setValueAtTime(0, time + 0.4 + i * 0.05);
      sparkleGain.gain.linearRampToValueAtTime(sfxVolume * 0.06, time + 0.4 + i * 0.05 + 0.01);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4 + i * 0.05 + 0.2);
      
      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      
      sparkleOsc.start(time + 0.4 + i * 0.05);
      sparkleOsc.stop(time + 0.4 + i * 0.05 + 0.25);
    });
  }, [getAudioContext]);

  // Rustling hay/straw sound
  const playHay = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Multiple rustling bursts
    for (let burst = 0; burst < 4; burst++) {
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000 + Math.random() * 1000, time + burst * 0.18);
      filter.Q.setValueAtTime(2, time);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time + burst * 0.18);
      gain.gain.linearRampToValueAtTime(sfxVolume * 0.25, time + burst * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + burst * 0.18 + 0.12);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start(time + burst * 0.18);
      noise.stop(time + burst * 0.18 + 0.15);
    }
  }, [getAudioContext]);

  // Flutter/wing flapping sound for baby birds
  const playFlutter = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Quick flapping bursts (6-8 rapid flaps)
    const flapCount = 6 + Math.floor(Math.random() * 3);
    for (let flap = 0; flap < flapCount; flap++) {
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1500 + Math.random() * 500, time + flap * 0.05);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time + flap * 0.05);
      gain.gain.linearRampToValueAtTime(sfxVolume * 0.2, time + flap * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + flap * 0.05 + 0.04);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start(time + flap * 0.05);
      noise.stop(time + flap * 0.05 + 0.05);
    }
    
    // Add a little chirp with the flutter
    const chirpOsc = ctx.createOscillator();
    const chirpGain = ctx.createGain();
    
    chirpOsc.type = 'sine';
    chirpOsc.frequency.setValueAtTime(2200 + Math.random() * 400, time + 0.1);
    chirpOsc.frequency.exponentialRampToValueAtTime(1800, time + 0.18);
    
    chirpGain.gain.setValueAtTime(0, time + 0.1);
    chirpGain.gain.linearRampToValueAtTime(sfxVolume * 0.15, time + 0.12);
    chirpGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    chirpOsc.connect(chirpGain);
    chirpGain.connect(ctx.destination);
    
    chirpOsc.start(time + 0.1);
    chirpOsc.stop(time + 0.25);
  }, [getAudioContext]);

  // Play a single bird chirp
  const playBirdChirp = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const baseFreq = 1800 + Math.random() * 800;
    const chirpCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < chirpCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const startFreq = baseFreq + Math.random() * 400;
      osc.frequency.setValueAtTime(startFreq, time + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.3, time + i * 0.08 + 0.03);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.9, time + i * 0.08 + 0.06);
      
      gain.gain.setValueAtTime(0, time + i * 0.08);
      gain.gain.linearRampToValueAtTime(ambientVolume * 0.4, time + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.08 + 0.07);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.08);
      osc.stop(time + i * 0.08 + 0.1);
    }
  }, [getAudioContext]);

  // Play distant children laughing/playing
  const playChildrenSound = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800 + Math.random() * 400, time);
    filter.Q.setValueAtTime(4, time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(ambientVolume * 0.2, time + 0.05);
    gain.gain.setValueAtTime(ambientVolume * 0.2, time + 0.2);
    gain.gain.linearRampToValueAtTime(0, time + 0.4);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.4);
  }, [getAudioContext]);

  // Play underwater bubble sounds for fish tank
  const playWaterBubble = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Random number of bubbles (2-5)
    const bubbleCount = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < bubbleCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      // Rising pitch as bubble goes up
      const startFreq = 180 + Math.random() * 120;
      osc.frequency.setValueAtTime(startFreq, time + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.8, time + i * 0.12 + 0.15);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time + i * 0.12);
      
      gain.gain.setValueAtTime(0, time + i * 0.12);
      gain.gain.linearRampToValueAtTime(ambientVolume * 0.25, time + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.12 + 0.18);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.12);
      osc.stop(time + i * 0.12 + 0.2);
    }
  }, [getAudioContext]);

  // Start continuous relaxing underwater water flow sound
  const startWaterFlowSound = useCallback(() => {
    const ctx = getAudioContext();
    
    // Create filtered noise for gentle water flow
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create smoother noise by averaging consecutive samples
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    // Smooth the noise for a more gentle water sound
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < bufferSize - 1; i++) {
        data[i] = (data[i - 1] + data[i] + data[i + 1]) / 3;
      }
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    // Low-pass filter for soft, muffled underwater sound
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(250, ctx.currentTime);
    filter1.Q.setValueAtTime(0.5, ctx.currentTime);
    
    // Second filter for extra smoothness
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(400, ctx.currentTime);
    filter2.Q.setValueAtTime(0.3, ctx.currentTime);
    
    // Very slow modulation for gentle wave movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // Very slow waves
    lfoGain.gain.setValueAtTime(60, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter1.frequency);
    
    // Second LFO for more organic movement
    const lfo2 = ctx.createOscillator();
    const lfo2Gain = ctx.createGain();
    lfo2.type = 'sine';
    lfo2.frequency.setValueAtTime(0.12, ctx.currentTime);
    lfo2Gain.gain.setValueAtTime(40, ctx.currentTime);
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(filter2.frequency);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(ambientVolume * 0.5, ctx.currentTime);
    
    noise.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(ctx.destination);
    
    lfo.start();
    lfo2.start();
    noise.start();
    
    ambientNodesRef.current.waterFlowNode = noise;
    ambientNodesRef.current.waterFlowGain = gain;
  }, [getAudioContext, ambientVolume]);

  // Play a steel pan note with metallic, bell-like quality
  const playSteelPanNote = useCallback(
    (frequency: number, startTime: number, duration: number) => {
      const ctx = getAudioContext();
      
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      
      // Steel pan has quick attack, medium decay with bell-like harmonics
      masterGain.gain.setValueAtTime(0, startTime);
      masterGain.gain.linearRampToValueAtTime(musicVolume * 0.4, startTime + 0.01); // Quick attack
      masterGain.gain.exponentialRampToValueAtTime(musicVolume * 0.15, startTime + 0.15); // Quick initial decay
      masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Slow fade
      
      // Fundamental frequency
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, startTime);
      
      // Second harmonic (octave) - gives brightness
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency * 2, startTime);
      
      // Third harmonic for metallic shimmer
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(frequency * 3, startTime);
      
      // Fourth harmonic - subtle
      const osc4 = ctx.createOscillator();
      osc4.type = 'sine';
      osc4.frequency.setValueAtTime(frequency * 4, startTime);
      
      // Gains for each harmonic (fundamental strongest, diminishing harmonics)
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const gain3 = ctx.createGain();
      const gain4 = ctx.createGain();
      
      gain1.gain.setValueAtTime(1.0, startTime);
      gain2.gain.setValueAtTime(0.5, startTime);
      gain3.gain.setValueAtTime(0.25, startTime);
      gain4.gain.setValueAtTime(0.1, startTime);
      
      // Faster decay for higher harmonics (characteristic of steel pan)
      gain2.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.6);
      gain3.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.4);
      gain4.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.3);
      
      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);
      osc4.connect(gain4);
      
      gain1.connect(masterGain);
      gain2.connect(masterGain);
      gain3.connect(masterGain);
      gain4.connect(masterGain);
      
      [osc1, osc2, osc3, osc4].forEach(osc => {
        osc.start(startTime);
        osc.stop(startTime + duration);
        osc.onended = () => {
          try { osc.disconnect(); } catch {}
        };
      });
      
      // Cleanup
      window.setTimeout(() => {
        try { masterGain.disconnect(); } catch {}
        [gain1, gain2, gain3, gain4].forEach(g => {
          try { g.disconnect(); } catch {}
        });
      }, Math.ceil((duration + 0.5) * 1000));
    },
    [getAudioContext, musicVolume]
  );

  // Play a steel pan melody phrase
  const playSteelPanPhrase = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Caribbean/tropical pentatonic patterns
    const phrases = [
      // Phrase 1: Ascending melody
      [
        { freq: 523.25, delay: 0, dur: 0.8 },     // C5
        { freq: 587.33, delay: 0.4, dur: 0.6 },   // D5
        { freq: 659.25, delay: 0.8, dur: 1.0 },   // E5
        { freq: 783.99, delay: 1.4, dur: 1.2 },   // G5
      ],
      // Phrase 2: Descending with pause
      [
        { freq: 783.99, delay: 0, dur: 0.6 },     // G5
        { freq: 659.25, delay: 0.5, dur: 0.8 },   // E5
        { freq: 523.25, delay: 1.2, dur: 1.4 },   // C5
      ],
      // Phrase 3: Playful jump
      [
        { freq: 392.00, delay: 0, dur: 0.5 },     // G4
        { freq: 587.33, delay: 0.3, dur: 0.6 },   // D5
        { freq: 523.25, delay: 0.7, dur: 0.5 },   // C5
        { freq: 659.25, delay: 1.1, dur: 1.0 },   // E5
        { freq: 783.99, delay: 1.8, dur: 1.2 },   // G5
      ],
      // Phrase 4: Gentle waves
      [
        { freq: 523.25, delay: 0, dur: 1.0 },     // C5
        { freq: 659.25, delay: 0.6, dur: 0.8 },   // E5
        { freq: 587.33, delay: 1.2, dur: 1.0 },   // D5
        { freq: 523.25, delay: 1.9, dur: 1.4 },   // C5
      ],
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    phrase.forEach(note => {
      playSteelPanNote(note.freq, time + note.delay, note.dur);
    });
  }, [getAudioContext, playSteelPanNote]);

  // Start steel pan background music
  const startSteelPanMusic = useCallback(() => {
    let phraseIndex = 0;
    
    const tick = () => {
      lastMusicTickRef.current = Date.now();
      playSteelPanPhrase();
      phraseIndex++;
    };
    
    tick();
    
    // Play phrases with natural pauses (5-7 seconds apart)
    const musicInterval = setInterval(() => {
      if (Math.random() < 0.7) { // Sometimes skip for more natural feel
        tick();
      }
    }, 5500);
    
    ambientNodesRef.current.musicInterval = musicInterval;
  }, [playSteelPanPhrase]);

  // Start continuous wind/breeze sound
  const startWindSound = useCallback(() => {
    const ctx = getAudioContext();

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    // Slow gust movement: modulate filter cutoff
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    lfoGain.gain.setValueAtTime(100, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(ambientVolume, ctx.currentTime);

    // Analyser to drive curtains (UI only)
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.connect(analyser);

    lfo.start();
    noise.start();

    ambientNodesRef.current.wind = noise as any;
    ambientNodesRef.current.windGain = gain;
    ambientNodesRef.current.windAnalyser = analyser;
    ambientNodesRef.current.windLfo = lfo;
  }, [getAudioContext, ambientVolume]);


  const stopAmbient = useCallback(() => {
    if (windMeterRafRef.current) {
      cancelAnimationFrame(windMeterRafRef.current);
      windMeterRafRef.current = null;
    }
    setWindIntensity(0);

    if (ambientNodesRef.current.wind) {
      try {
        (ambientNodesRef.current.wind as any).stop();
      } catch {}
      ambientNodesRef.current.wind = null;
    }
    if (ambientNodesRef.current.windLfo) {
      try {
        ambientNodesRef.current.windLfo.stop();
      } catch {}
      try {
        ambientNodesRef.current.windLfo.disconnect();
      } catch {}
      ambientNodesRef.current.windLfo = null;
    }
    ambientNodesRef.current.windGain = null;
    ambientNodesRef.current.windAnalyser = null;

    if (ambientNodesRef.current.birdInterval) {
      clearInterval(ambientNodesRef.current.birdInterval);
      ambientNodesRef.current.birdInterval = null;
    }
    if (ambientNodesRef.current.childrenInterval) {
      clearInterval(ambientNodesRef.current.childrenInterval);
      ambientNodesRef.current.childrenInterval = null;
    }
    if (ambientNodesRef.current.musicInterval) {
      clearInterval(ambientNodesRef.current.musicInterval);
      ambientNodesRef.current.musicInterval = null;
    }
    
    // Stop water sounds
    if (ambientNodesRef.current.waterBubblesInterval) {
      clearInterval(ambientNodesRef.current.waterBubblesInterval);
      ambientNodesRef.current.waterBubblesInterval = null;
    }
    if (ambientNodesRef.current.waterFlowNode) {
      try {
        ambientNodesRef.current.waterFlowNode.stop();
      } catch {}
      ambientNodesRef.current.waterFlowNode = null;
    }
    ambientNodesRef.current.waterFlowGain = null;
  }, []);


  const startAmbient = useCallback(() => {
    const pet = currentPetRef.current;
    
    // Guard: don't double-start if core nodes are already running
    const hasCoreNodes = pet === 'fish'
      ? !!ambientNodesRef.current.waterFlowNode && !!ambientNodesRef.current.musicInterval
      : !!ambientNodesRef.current.wind && !!ambientNodesRef.current.windGain && !!ambientNodesRef.current.musicInterval;

    if (hasCoreNodes) return;

    // Clear any partial/stale nodes inline (avoid calling stopAmbient to prevent circular dep)
    if (ambientNodesRef.current.wind) {
      try { (ambientNodesRef.current.wind as any).stop(); } catch {}
      ambientNodesRef.current.wind = null;
    }
    if (ambientNodesRef.current.windLfo) {
      try { ambientNodesRef.current.windLfo.stop(); } catch {}
      try { ambientNodesRef.current.windLfo.disconnect(); } catch {}
      ambientNodesRef.current.windLfo = null;
    }
    ambientNodesRef.current.windGain = null;
    ambientNodesRef.current.windAnalyser = null;
    if (ambientNodesRef.current.birdInterval) {
      clearInterval(ambientNodesRef.current.birdInterval);
      ambientNodesRef.current.birdInterval = null;
    }
    if (ambientNodesRef.current.childrenInterval) {
      clearInterval(ambientNodesRef.current.childrenInterval);
      ambientNodesRef.current.childrenInterval = null;
    }
    if (ambientNodesRef.current.musicInterval) {
      clearInterval(ambientNodesRef.current.musicInterval);
      ambientNodesRef.current.musicInterval = null;
    }
    // Clear water sounds
    if (ambientNodesRef.current.waterBubblesInterval) {
      clearInterval(ambientNodesRef.current.waterBubblesInterval);
      ambientNodesRef.current.waterBubblesInterval = null;
    }
    if (ambientNodesRef.current.waterFlowNode) {
      try { ambientNodesRef.current.waterFlowNode.stop(); } catch {}
      ambientNodesRef.current.waterFlowNode = null;
    }
    ambientNodesRef.current.waterFlowGain = null;

    unlockAudio();
    
    if (pet === 'fish') {
      // Fish tank: steel pan music + relaxing water flow + bubbles
      startSteelPanMusic();
      startWaterFlowSound();
      
      ambientNodesRef.current.waterBubblesInterval = setInterval(() => {
        if (Math.random() < 0.4) playWaterBubble();
      }, 3000);
      
      playWaterBubble();
    } else {
      // Bunny: lofi chords + wind + birds + children
      startSteelPanMusic(); // Use steel pan for both now for consistency
      startWindSound();

      ambientNodesRef.current.birdInterval = setInterval(() => {
        if (Math.random() < 0.6) playBirdChirp();
      }, 2000);

      ambientNodesRef.current.childrenInterval = setInterval(() => {
        if (Math.random() < 0.4) playChildrenSound();
      }, 4000);

      playBirdChirp();
      setTimeout(() => playChildrenSound(), 900);
    }
  }, [unlockAudio, startWindSound, startWaterFlowSound, startSteelPanMusic, playBirdChirp, playChildrenSound, playWaterBubble]);

  // Toggle ambient sounds (music + ambience)
  const toggleAmbient = useCallback(() => {
    setIsAmbientPlaying((prev) => {
      const next = !prev;
      shouldStartAmbientRef.current = next;
      try {
        window.localStorage.setItem('lola_ambient_on', next ? '1' : '0');
      } catch {}
      if (next) {
        // Ensure the context is resumed and ambient nodes exist
        unlockAudio();
        if (hasUnlockedRef.current) {
          startAmbient();
        }
      } else {
        stopAmbient();
      }
      return next;
    });
  }, [startAmbient, stopAmbient, unlockAudio]);

  // Measure wind loudness (proxy) from WebAudio analyser so visuals can match the breeze.
  useEffect(() => {
    if (!isAmbientPlaying) {
      setWindIntensity(0);
      return;
    }

    const tick = () => {
      const analyser = ambientNodesRef.current.windAnalyser;
      if (analyser) {
        const buf = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buf);

        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length); // ~0..0.25
        const normalized = Math.max(0, Math.min(1, (rms - 0.05) / 0.15));
        setWindIntensity(normalized);
      }

      windMeterRafRef.current = requestAnimationFrame(tick);
    };

    windMeterRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (windMeterRafRef.current) {
        cancelAnimationFrame(windMeterRafRef.current);
        windMeterRafRef.current = null;
      }
    };
  }, [isAmbientPlaying]);

  // Unlock audio on first user interaction and start ambient if enabled
  useEffect(() => {
    const onFirstInteraction = () => {
      if (hasUnlockedRef.current) return;
      hasUnlockedRef.current = true;

      // IMPORTANT: start audio inside the user gesture to satisfy browser autoplay policies
      unlockAudio();
      if (shouldStartAmbientRef.current) {
        startAmbient();
      }
    };

    const onAnyPointerDown = () => {
      // Keep audio alive; do NOT stop anything unless the user toggles it off
      if (!shouldStartAmbientRef.current) return;
      unlockAudio();
      if (hasUnlockedRef.current) {
        startAmbient(); // guarded against double-start
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!shouldStartAmbientRef.current) return;
      if (!hasUnlockedRef.current) return;

      unlockAudio();
      startAmbient(); // guarded against double-start
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);

    window.addEventListener('pointerdown', onAnyPointerDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('pointerdown', onAnyPointerDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [unlockAudio, startAmbient]);

  // Keep refs to the latest callbacks (avoids hook-deps churn and accidental restart loops)
  const startAmbientRef = useRef(startAmbient);
  const stopAmbientRef = useRef(stopAmbient);

  useEffect(() => {
    startAmbientRef.current = startAmbient;
  }, [startAmbient]);

  useEffect(() => {
    stopAmbientRef.current = stopAmbient;
  }, [stopAmbient]);

  useEffect(() => {
    // Keep this in sync with the UI toggle + persisted preference
    shouldStartAmbientRef.current = isAmbientPlaying;
  }, [isAmbientPlaying]);

  // Track previous pet to detect changes (skip initial mount)
  const prevPetRef = useRef<PetType | null>(null);
  
  // Restart ambient sounds when pet changes to switch between bird/water sounds
  useEffect(() => {
    // Skip on initial mount
    if (prevPetRef.current === null) {
      prevPetRef.current = currentPet;
      return;
    }
    
    // Only restart if pet actually changed
    if (prevPetRef.current === currentPet) return;
    prevPetRef.current = currentPet;
    
    if (!isAmbientPlaying || !hasUnlockedRef.current) return;
    
    // Stop current sounds and restart with new pet's sounds
    stopAmbientRef.current();
    // Small delay to ensure cleanup completes
    const timer = setTimeout(() => {
      startAmbientRef.current();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentPet, isAmbientPlaying]);

  // If ambient is enabled and audio is unlocked, ensure it stays running.
  // Some browsers will silently suspend WebAudio; we "heal" by resuming + rebuilding nodes when needed.
  useEffect(() => {
    if (!isAmbientPlaying) return;
    if (!hasUnlockedRef.current) return;

    startAmbientRef.current();

    const watchdog = window.setInterval(() => {
      if (!shouldStartAmbientRef.current) return;
      if (!hasUnlockedRef.current) return;

      const ctx = audioContextRef.current;
      if (ctx?.state === 'closed') {
        // Browser killed the context; recreate on next getAudioContext()
        audioContextRef.current = null;
      } else if (ctx?.state === 'suspended') {
        void ctx.resume().catch(() => {});
      }

      const hasCoreNodes =
        !!ambientNodesRef.current.wind &&
        !!ambientNodesRef.current.windGain &&
        !!ambientNodesRef.current.musicInterval;

      const now = Date.now();
      const musicStalled =
        document.visibilityState === 'visible' &&
        now - lastMusicTickRef.current > 12000;

      // If timers/audio stall (common on mobile / aggressive throttling), fully rebuild.
      if (!hasCoreNodes || musicStalled) {
        // eslint-disable-next-line no-console
        console.debug('[audio] watchdog rebuild', {
          hasCoreNodes,
          musicStalled,
          ctxState: audioContextRef.current?.state ?? 'none',
          msSinceMusicTick: now - lastMusicTickRef.current,
        });

        stopAmbientRef.current();
        startAmbientRef.current();
      }
    }, 5000);

    return () => window.clearInterval(watchdog);
  }, [isAmbientPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ambientNodesRef.current.wind) {
        try {
          (ambientNodesRef.current.wind as any).stop();
        } catch {}
      }
      if (ambientNodesRef.current.birdInterval) {
        clearInterval(ambientNodesRef.current.birdInterval);
      }
      if (ambientNodesRef.current.childrenInterval) {
        clearInterval(ambientNodesRef.current.childrenInterval);
      }
      if (ambientNodesRef.current.musicInterval) {
        clearInterval(ambientNodesRef.current.musicInterval);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playHop,
    playEat,
    playDrink,
    playClean,
    playPlay,
    playPoop,
    playHay,
    playFlutter,
    toggleAmbient,
    isAmbientPlaying,
    windIntensity,
  };

};
