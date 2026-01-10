import { useRef, useCallback, useEffect, useState } from 'react';

interface SoundEffectsReturn {
  playHop: () => void;
  /** Gentle water swish for Tula's swimming */
  playSwim: () => void;
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
    musicOscillators: OscillatorNode[];
    musicGain: GainNode | null;
    musicInterval: ReturnType<typeof setInterval> | null;
    secondaryMusicInterval: ReturnType<typeof setInterval> | null;
    fountainNodes: {
      noiseSource: AudioBufferSourceNode | null;
      gainNode: GainNode | null;
      filterNode: BiquadFilterNode | null;
    } | null;
  }>({
    musicOscillators: [],
    musicGain: null,
    musicInterval: null,
    secondaryMusicInterval: null,
    fountainNodes: null,
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

  // Only handpan music enabled; all SFX disabled
  const allAudioDisabled = false;

  const musicVolume = 0.12;
  const sfxEnabled = false;
  const sfxVolume = 0.8;
  const ambientVolume = 0.35;

  // Global registry for WebAudio contexts
  const getGlobalAudioContextSet = () => {
    const w = window as any;
    if (!w.__lovableAudioContexts) w.__lovableAudioContexts = new Set<AudioContext>();
    return w.__lovableAudioContexts as Set<AudioContext>;
  };

  const registerAudioContext = (ctx: AudioContext) => {
    try {
      getGlobalAudioContextSet().add(ctx);
    } catch {
      // ignore
    }
  };

  const closeAllAudioContexts = () => {
    try {
      const set = getGlobalAudioContextSet();
      set.forEach((c) => {
        try {
          void c.close();
        } catch {
          // ignore
        }
      });
      set.clear();
    } catch {
      // ignore
    }
  };

  // Initialize audio context and attempt resume
  const getAudioContext = useCallback(() => {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;

    // Recreate if missing or the browser closed it (some mobile browsers do this under memory pressure)
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioCtor();
      registerAudioContext(audioContextRef.current);
    }

    const ctx = audioContextRef.current;
    registerAudioContext(ctx);

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
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

  // Very soft watery swish for Tula swimming
  const playSwim = useCallback(() => {
    if (!sfxEnabled) return;

    const ctx = getAudioContext();
    const time = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Slightly smoother noise than hop
      const n = (Math.random() * 2 - 1) * 0.22;
      data[i] = i === 0 ? n : (data[i - 1] * 0.65 + n * 0.35);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(320, time);
    band.Q.setValueAtTime(0.7, time);

    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.setValueAtTime(900, time);
    low.Q.setValueAtTime(0.3, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(sfxVolume * 0.08, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    noise.connect(band);
    band.connect(low);
    low.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.2);
  }, [getAudioContext, sfxEnabled]);

  // Crunchy eating sound
  const playEat = useCallback(() => {
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

  // Gentle sipping/lapping sound
  const playDrink = useCallback(() => {
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

  // Sweeping/brushing clean sound
  const playClean = useCallback(() => {
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

  // Playful bouncy sound
  const playPlay = useCallback(() => {
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

  // Soft, low-pitched magical poop sound
  const playPoop = useCallback(() => {
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

  // Rustling hay/straw sound
  const playHay = useCallback(() => {
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

  // Flutter/wing flapping sound for baby birds
  const playFlutter = useCallback(() => {
    if (!sfxEnabled) return;

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
  }, [getAudioContext, sfxEnabled]);

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
    // ALL AUDIO DISABLED
    if (allAudioDisabled) return;

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




  // A shared music bus so changes always take effect and we can reliably stop/restart.
  const getMusicBus = useCallback(() => {
    const ctx = getAudioContext();
    if (ambientNodesRef.current.musicGain) return ambientNodesRef.current.musicGain;

    const bus = ctx.createGain();
    // Soft but audible (overall music loudness)
    bus.gain.setValueAtTime(musicVolume * 0.22, ctx.currentTime);
    bus.connect(ctx.destination);
    ambientNodesRef.current.musicGain = bus;
    return bus;
  }, [getAudioContext, musicVolume]);

  // Play a calming Malte Marten-style handpan note
  // Handpan has warm, resonant, meditative quality with rich harmonics and long sustain
  const playHandpanNote = useCallback(
    (frequency: number, startTime: number, duration: number, velocity: number = 0.8) => {
      const ctx = getAudioContext();
      const musicBus = getMusicBus();

      const noteGain = ctx.createGain();
      
      // Reverb-like effect using delay
      const delayNode = ctx.createDelay();
      delayNode.delayTime.setValueAtTime(0.15, startTime);
      const delayGain = ctx.createGain();
      delayGain.gain.setValueAtTime(0.3, startTime);
      
      // Soft low-pass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000 + frequency * 0.5, startTime);
      filter.Q.setValueAtTime(0.7, startTime);

      noteGain.connect(filter);
      filter.connect(musicBus);
      filter.connect(delayNode);
      delayNode.connect(delayGain);
      delayGain.connect(musicBus);

      // Handpan has a soft "ping" attack then long, warm sustain
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(velocity, startTime + 0.008); // Fast ping
      noteGain.gain.linearRampToValueAtTime(velocity * 0.6, startTime + 0.08); // Quick drop
      noteGain.gain.exponentialRampToValueAtTime(velocity * 0.35, startTime + duration * 0.3);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      // Fundamental - deep and warm
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, startTime);
      
      // Sub-harmonic for depth (characteristic of handpan)
      const oscSub = ctx.createOscillator();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(frequency * 0.5, startTime);

      // Second harmonic (octave) - strong in handpan
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency * 2, startTime);
      // Slight detune for warmth
      osc2.detune.setValueAtTime(3, startTime);

      // Third harmonic - softer
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(frequency * 3, startTime);

      // Fifth harmonic for metallic shimmer (characteristic handpan sound)
      const osc5 = ctx.createOscillator();
      osc5.type = 'sine';
      osc5.frequency.setValueAtTime(frequency * 5.02, startTime); // Slightly detuned

      // Individual gains with handpan-like harmonic structure
      const gainSub = ctx.createGain();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const gain3 = ctx.createGain();
      const gain5 = ctx.createGain();

      gainSub.gain.setValueAtTime(0.4, startTime);
      gain1.gain.setValueAtTime(1.0, startTime);
      gain2.gain.setValueAtTime(0.6, startTime);
      gain3.gain.setValueAtTime(0.15, startTime);
      gain5.gain.setValueAtTime(0.08, startTime);

      // Harmonics decay at different rates - higher harmonics faster
      gainSub.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.9);
      gain2.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.5);
      gain3.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.3);
      gain5.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.15);

      oscSub.connect(gainSub);
      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);
      osc5.connect(gain5);

      gainSub.connect(noteGain);
      gain1.connect(noteGain);
      gain2.connect(noteGain);
      gain3.connect(noteGain);
      gain5.connect(noteGain);

      const oscillators = [oscSub, osc1, osc2, osc3, osc5];
      oscillators.forEach((osc) => {
        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
        osc.onended = () => {
          try { osc.disconnect(); } catch {}
        };
      });

      // Cleanup
      window.setTimeout(() => {
        try { noteGain.disconnect(); } catch {}
        try { filter.disconnect(); } catch {}
        try { delayNode.disconnect(); } catch {}
        try { delayGain.disconnect(); } catch {}
        [gainSub, gain1, gain2, gain3, gain5].forEach((g) => {
          try { g.disconnect(); } catch {}
        });
      }, Math.ceil((duration + 0.5) * 1000));
    },
    [getAudioContext, getMusicBus]
  );

  // Play a Malte Marten-style handpan phrase - melodic, flowing, rhythmic
  const playHandpanPhrase = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // D Minor / Kurd scale - common handpan tuning, very meditative
    const scale = {
      D3: 146.83,
      A3: 220.00,
      Bb3: 233.08,
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.00,
      A4: 440.00,
    };
    
    // Flowing, rhythmic phrases - faster note sequences with overlap
    const phrases = [
      // Phrase 1: Flowing ascending run
      [
        { note: scale.D3, delay: 0, dur: 2.5, vel: 0.7 },
        { note: scale.A3, delay: 0.4, dur: 2.0, vel: 0.55 },
        { note: scale.C4, delay: 0.8, dur: 1.8, vel: 0.5 },
        { note: scale.D4, delay: 1.2, dur: 2.0, vel: 0.55 },
        { note: scale.E4, delay: 1.6, dur: 2.2, vel: 0.5 },
        { note: scale.A4, delay: 2.2, dur: 2.5, vel: 0.45 },
      ],
      // Phrase 2: Rhythmic descending melody
      [
        { note: scale.A4, delay: 0, dur: 1.5, vel: 0.5 },
        { note: scale.F4, delay: 0.35, dur: 1.5, vel: 0.5 },
        { note: scale.E4, delay: 0.7, dur: 1.5, vel: 0.55 },
        { note: scale.D4, delay: 1.05, dur: 1.8, vel: 0.55 },
        { note: scale.C4, delay: 1.5, dur: 1.8, vel: 0.5 },
        { note: scale.A3, delay: 2.0, dur: 2.5, vel: 0.6 },
        { note: scale.D3, delay: 2.6, dur: 3.0, vel: 0.65 },
      ],
      // Phrase 3: Dancing pattern
      [
        { note: scale.D4, delay: 0, dur: 1.2, vel: 0.55 },
        { note: scale.E4, delay: 0.3, dur: 1.2, vel: 0.5 },
        { note: scale.D4, delay: 0.6, dur: 1.2, vel: 0.5 },
        { note: scale.C4, delay: 0.9, dur: 1.5, vel: 0.55 },
        { note: scale.A3, delay: 1.3, dur: 1.8, vel: 0.6 },
        { note: scale.C4, delay: 1.7, dur: 1.5, vel: 0.5 },
        { note: scale.D4, delay: 2.1, dur: 2.0, vel: 0.55 },
      ],
      // Phrase 4: Rhythmic bass with melody
      [
        { note: scale.D3, delay: 0, dur: 2.0, vel: 0.7 },
        { note: scale.A3, delay: 0.5, dur: 1.5, vel: 0.5 },
        { note: scale.D3, delay: 1.0, dur: 1.8, vel: 0.65 },
        { note: scale.C4, delay: 1.4, dur: 1.5, vel: 0.5 },
        { note: scale.D4, delay: 1.8, dur: 2.0, vel: 0.55 },
      ],
      // Phrase 5: Fast arpeggio up and down
      [
        { note: scale.A3, delay: 0, dur: 1.5, vel: 0.55 },
        { note: scale.C4, delay: 0.25, dur: 1.4, vel: 0.5 },
        { note: scale.D4, delay: 0.5, dur: 1.4, vel: 0.5 },
        { note: scale.E4, delay: 0.75, dur: 1.4, vel: 0.5 },
        { note: scale.F4, delay: 1.0, dur: 1.5, vel: 0.5 },
        { note: scale.E4, delay: 1.3, dur: 1.4, vel: 0.5 },
        { note: scale.D4, delay: 1.6, dur: 1.5, vel: 0.55 },
        { note: scale.C4, delay: 1.9, dur: 1.8, vel: 0.55 },
        { note: scale.A3, delay: 2.3, dur: 2.2, vel: 0.6 },
      ],
      // Phrase 6: Gentle thirds harmony
      [
        { note: scale.D4, delay: 0, dur: 1.8, vel: 0.55 },
        { note: scale.F4, delay: 0.05, dur: 1.8, vel: 0.4 },
        { note: scale.C4, delay: 0.6, dur: 1.8, vel: 0.55 },
        { note: scale.E4, delay: 0.65, dur: 1.8, vel: 0.4 },
        { note: scale.A3, delay: 1.2, dur: 2.2, vel: 0.6 },
        { note: scale.C4, delay: 1.25, dur: 2.0, vel: 0.45 },
      ],
      // Phrase 7: Playful bounce
      [
        { note: scale.E4, delay: 0, dur: 1.0, vel: 0.5 },
        { note: scale.D4, delay: 0.25, dur: 1.0, vel: 0.5 },
        { note: scale.E4, delay: 0.5, dur: 1.2, vel: 0.55 },
        { note: scale.F4, delay: 0.8, dur: 1.0, vel: 0.5 },
        { note: scale.E4, delay: 1.05, dur: 1.2, vel: 0.5 },
        { note: scale.D4, delay: 1.35, dur: 1.5, vel: 0.55 },
        { note: scale.A3, delay: 1.8, dur: 2.5, vel: 0.6 },
      ],
      // Phrase 8: Rolling wave
      [
        { note: scale.A3, delay: 0, dur: 1.8, vel: 0.6 },
        { note: scale.D4, delay: 0.3, dur: 1.5, vel: 0.5 },
        { note: scale.F4, delay: 0.6, dur: 1.5, vel: 0.5 },
        { note: scale.A4, delay: 0.9, dur: 1.8, vel: 0.45 },
        { note: scale.F4, delay: 1.3, dur: 1.5, vel: 0.5 },
        { note: scale.D4, delay: 1.6, dur: 1.5, vel: 0.5 },
        { note: scale.A3, delay: 2.0, dur: 2.0, vel: 0.6 },
        { note: scale.D3, delay: 2.5, dur: 2.5, vel: 0.65 },
      ],
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    phrase.forEach(note => {
      playHandpanNote(note.note, time + note.delay, note.dur, note.vel);
    });
  }, [getAudioContext, playHandpanNote]);

  // Start calming handpan music (Tula) - Malte Marten style
  const startHandpanMusic = useCallback(() => {
    // Handpan is the ONLY allowed sound - don't check allAudioDisabled here
    const tick = () => {
      lastMusicTickRef.current = Date.now();
      playHandpanPhrase();
    };

    // Play immediately, then stagger phrases for continuous flow
    tick();
    setTimeout(tick, 1500); // Overlap second phrase
    setTimeout(tick, 3000); // Third phrase for density

    // Continuous phrases every 2.5-3.5 seconds (randomized to feel natural)
    const musicInterval = setInterval(() => {
      tick();
    }, 2500 + Math.random() * 1000); // Always play, no gaps

    // Secondary interval for overlapping melodic density
    const secondaryInterval = setInterval(() => {
      tick();
    }, 3500 + Math.random() * 1500);

    ambientNodesRef.current.musicInterval = musicInterval;
    ambientNodesRef.current.secondaryMusicInterval = secondaryInterval;
  }, [playHandpanPhrase]);

  // Start soft flowing fountain sound - gentle water ambience
  const startFountainSound = useCallback(() => {
    // Don't start if already running
    if (ambientNodesRef.current.fountainNodes) return;

    const ctx = getAudioContext();
    const bus = getMusicBus();

    // Create filtered white noise for gentle water/fountain sound
    const bufferSize = ctx.sampleRate * 4; // 4 seconds of noise (loops)
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const output = noiseBuffer.getChannelData(channel);
      
      for (let i = 0; i < bufferSize; i++) {
        // Simple white noise
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Bandpass filter to shape water-like frequencies (soft, flowing)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800; // Center frequency for water sound
    filter.Q.value = 0.3; // Very wide bandwidth for natural flow

    // Low-pass to remove harshness
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 1500;
    lowPass.Q.value = 0.5;

    // Gain for volume control with gentle fade-in
    const gainNode = ctx.createGain();
    const t = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.75, t + 2); // Louder fountain

    // Connect: noise -> bandpass -> lowpass -> gain -> music bus
    noiseSource.connect(filter);
    filter.connect(lowPass);
    lowPass.connect(gainNode);
    gainNode.connect(bus);

    noiseSource.start();
    console.log('[audio] Fountain sound started');

    ambientNodesRef.current.fountainNodes = {
      noiseSource,
      gainNode,
      filterNode: filter,
    };
  }, [getAudioContext, getMusicBus]);

  // Stop fountain sound
  const stopFountainSound = useCallback(() => {
    const nodes = ambientNodesRef.current.fountainNodes;
    if (!nodes) return;

    try {
      if (nodes.noiseSource) {
        nodes.noiseSource.stop();
        nodes.noiseSource.disconnect();
      }
      if (nodes.gainNode) nodes.gainNode.disconnect();
      if (nodes.filterNode) nodes.filterNode.disconnect();
    } catch {}

    ambientNodesRef.current.fountainNodes = null;
  }, []);

  // Start soft lo-fi pad chords (Lola)
  const startLolaLofiMusic = useCallback(() => {
    // ALL AUDIO DISABLED except handpan
    if (allAudioDisabled) return;

    const ctx = getAudioContext();
    const bus = getMusicBus();

    const chords: number[][] = [
      [261.63, 329.63, 392.0],    // C major
      [293.66, 369.99, 440.0],    // Dm-ish (D-F#? -> keep soft; use D-F-A)
      [293.66, 349.23, 440.0],    // D-F-A
      [220.0, 261.63, 329.63],    // Am
      [196.0, 246.94, 293.66],    // Gsus-ish
    ];

    const playChord = (notes: number[]) => {
      const t = ctx.currentTime;

      const chordGain = ctx.createGain();
      chordGain.gain.setValueAtTime(0, t);
      chordGain.gain.linearRampToValueAtTime(1, t + 0.9);
      chordGain.gain.setValueAtTime(1, t + 6.0);
      chordGain.gain.exponentialRampToValueAtTime(0.001, t + 8.0);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, t);
      filter.Q.setValueAtTime(0.4, t);

      chordGain.connect(filter);
      filter.connect(bus);

      const oscs = notes.map((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, t);
        osc.connect(chordGain);
        osc.start(t);
        osc.stop(t + 8.2);
        return osc;
      });

      // Track these long-running oscillators so we can hard-stop immediately when switching pets
      oscs.forEach((osc) => {
        ambientNodesRef.current.musicOscillators.push(osc);
        osc.onended = () => {
          ambientNodesRef.current.musicOscillators = ambientNodesRef.current.musicOscillators.filter(
            (o) => o !== osc
          );
          try {
            osc.disconnect();
          } catch {}
        };
      });

      window.setTimeout(() => {
        try { chordGain.disconnect(); } catch {}
        try { filter.disconnect(); } catch {}
        // Oscillator disconnects handled in onended (above)
      }, 9000);
    };

    // Start immediately
    lastMusicTickRef.current = Date.now();
    playChord(chords[0]);

    let i = 1;
    const musicInterval = setInterval(() => {
      lastMusicTickRef.current = Date.now();
      playChord(chords[i % chords.length]);
      i++;
    }, 8000);

    ambientNodesRef.current.musicInterval = musicInterval;
  }, [getAudioContext, getMusicBus]);



  const stopAmbient = useCallback(() => {
    if (windMeterRafRef.current) {
      cancelAnimationFrame(windMeterRafRef.current);
      windMeterRafRef.current = null;
    }
    setWindIntensity(0);

    if (ambientNodesRef.current.musicInterval) {
      clearInterval(ambientNodesRef.current.musicInterval);
      ambientNodesRef.current.musicInterval = null;
    }
    if (ambientNodesRef.current.secondaryMusicInterval) {
      clearInterval(ambientNodesRef.current.secondaryMusicInterval);
      ambientNodesRef.current.secondaryMusicInterval = null;
    }

    // Hard-stop any currently playing music oscillators (lo-fi chords can ring out otherwise)
    if (ambientNodesRef.current.musicOscillators.length) {
      ambientNodesRef.current.musicOscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {}
        try {
          osc.disconnect();
        } catch {}
      });
      ambientNodesRef.current.musicOscillators = [];
    }

    // Stop music bus (prevents lingering volume / ensures new music takes effect)
    if (ambientNodesRef.current.musicGain) {
      try {
        ambientNodesRef.current.musicGain.disconnect();
      } catch {}
      ambientNodesRef.current.musicGain = null;
    }

    // Stop fountain sound
    if (ambientNodesRef.current.fountainNodes) {
      try {
        const nodes = ambientNodesRef.current.fountainNodes;
        if (nodes.noiseSource) {
          nodes.noiseSource.stop();
          nodes.noiseSource.disconnect();
        }
        if (nodes.gainNode) nodes.gainNode.disconnect();
        if (nodes.filterNode) nodes.filterNode.disconnect();
      } catch {}
      ambientNodesRef.current.fountainNodes = null;
    }


    // NOTE: Do NOT close the AudioContext here.
    // Closing/recreating contexts can break autoplay policy (resume must happen in a user gesture)
    // and can lead to "silent" audio after background rebuilds.
    // We stop/disconnect nodes above; keep the context alive.

  }, []);

  // Safety: ambience is Tula-only.
  // 1) On mount (incl. hot reload), hard-stop anything that might still be ringing.
  useEffect(() => {
    stopAmbient();

    // Hard-stop any stale WebAudio from previous hot reloads/iterations so no "ghost" audio remains.
    closeAllAudioContexts();
    audioContextRef.current = null;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Any time we are on Lola, hard-stop all ambience.
  useEffect(() => {
    if (currentPet !== 'fish') stopAmbient();
  }, [currentPet, stopAmbient]);

  const startAmbient = useCallback(() => {
    // ALL AUDIO DISABLED
    if (allAudioDisabled) return;

    const pet = currentPetRef.current;

    console.log('[audio] startAmbient called for', pet);

    // Ambient is Tula-only.
    // If we're not on Tula, ensure everything is stopped and do not start anything.
    if (pet !== 'fish') {
      stopAmbient();
      return;
    }

    // Guard: don't double-start if core nodes are already running
    const hasCoreNodes = !!ambientNodesRef.current.musicInterval;

    console.log('[audio] hasCoreNodes:', hasCoreNodes);

    if (hasCoreNodes) return;

    unlockAudio();

    console.log('[audio] Starting handpan and fountain...');

    // Tula: calming Malte Marten-style handpan + soft fountain
    startHandpanMusic();
    startFountainSound();
  }, [unlockAudio, startHandpanMusic, startFountainSound]);

  // Toggle ambient sounds (music + ambience)
  const toggleAmbient = useCallback(() => {
    // ALL AUDIO DISABLED
    if (allAudioDisabled) return;

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

  // Restart/stop ambient when pet changes.
  // Requirement: ambience is for Tula only (steel pans + water). Lola has no ambience.
  useEffect(() => {
    // Skip on initial mount
    if (prevPetRef.current === null) {
      prevPetRef.current = currentPet;
      currentPetRef.current = currentPet;
      return;
    }

    if (prevPetRef.current === currentPet) return;
    prevPetRef.current = currentPet;
    currentPetRef.current = currentPet;

    // ALWAYS stop when switching pets (even if the UI toggle says "off").
    // This prevents any older/untracked ambience from bleeding into Tula.
    stopAmbientRef.current();

    // Only restart if:
    // - user wants ambient on
    // - audio has been unlocked by a gesture
    // - Tula is selected
    if (!isAmbientPlaying) return;
    if (!hasUnlockedRef.current) return;
    if (currentPet !== 'fish') return;

    const timer = setTimeout(() => {
      currentPetRef.current = currentPet;
      startAmbientRef.current();
    }, 150);

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

       const pet = currentPetRef.current;
       if (pet !== 'fish') return;

       const hasCoreNodes = !!ambientNodesRef.current.musicInterval;

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
      if (ambientNodesRef.current.musicInterval) {
        clearInterval(ambientNodesRef.current.musicInterval);
      }
      if (ambientNodesRef.current.secondaryMusicInterval) {
        clearInterval(ambientNodesRef.current.secondaryMusicInterval);
      }
      if (ambientNodesRef.current.musicGain) {
        try {
          ambientNodesRef.current.musicGain.disconnect();
        } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playHop,
    playSwim,
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
