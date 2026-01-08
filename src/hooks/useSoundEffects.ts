import { useRef, useCallback, useEffect, useState } from 'react';

interface SoundEffectsReturn {
  playHop: () => void;
  playEat: () => void;
  playDrink: () => void;
  playClean: () => void;
  playPlay: () => void;
  playPoop: () => void;
  playHay: () => void;
  toggleAmbient: () => void;
  isAmbientPlaying: boolean;
}

export const useSoundEffects = (): SoundEffectsReturn => {
  /**
   * CRITICAL: WebAudio sound engine for Lola.
   * Keep this hook stable and self-contained (UI should only call the exported functions).
   */
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<{
    wind: AudioBufferSourceNode | null;
    windGain: GainNode | null;
    birdInterval: NodeJS.Timeout | null;
    childrenInterval: NodeJS.Timeout | null;
    musicOscillators: OscillatorNode[];
    musicGain: GainNode | null;
    musicInterval: NodeJS.Timeout | null;
  }>({ wind: null, windGain: null, birdInterval: null, childrenInterval: null, musicOscillators: [], musicGain: null, musicInterval: null });

  // Default ON so “music and sounds are back” after the first user interaction unlocks audio.
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(true);

  const musicVolume = 0.12;
  const sfxVolume = 0.8;
  const ambientVolume = 0.35;

  // Initialize audio context and attempt resume (resume may be ignored until a real user gesture).
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        // Autoplay policy: resume can fail until a user gesture.
      });
    }
    return ctx;
  }, []);

  const unlockAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        // ignore
      });
    }
  }, [getAudioContext]);

  // Soft puff sound for hopping - like a gentle landing
  const playHop = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Soft air puff using filtered noise
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

  // Play a single bird chirp
  const playBirdChirp = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Random bird frequencies for variety
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
    
    // Filtered noise to simulate distant voices
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

  // Play a lofi music chord
  const playLofiChord = useCallback((frequencies: number[], duration: number) => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(musicVolume, time);
    masterGain.gain.linearRampToValueAtTime(musicVolume * 0.8, time + duration * 0.7);
    masterGain.gain.linearRampToValueAtTime(0, time + duration);
    masterGain.connect(ctx.destination);
    
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      // Warm lowpass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.Q.setValueAtTime(1, time);
      
      oscGain.gain.setValueAtTime(0.15, time);
      
      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(masterGain);
      
      osc.start(time);
      osc.stop(time + duration);
    });
  }, [getAudioContext, musicVolume]);

  // Start lofi background music
  const startLofiMusic = useCallback(() => {
    console.log('Starting lofi music...');
    
    // Lofi chord progression (Cmaj7 - Am7 - Fmaj7 - G7)
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];
    
    let chordIndex = 0;
    
    // Play first chord immediately
    playLofiChord(chords[chordIndex], 3.5);
    chordIndex = 1;
    
    // Play chords in sequence
    const musicInterval = setInterval(() => {
      playLofiChord(chords[chordIndex], 3.5);
      chordIndex = (chordIndex + 1) % chords.length;
    }, 4000);
    
    ambientNodesRef.current.musicInterval = musicInterval;
  }, [playLofiChord]);

  // Start continuous wind/breeze sound
  const startWindSound = useCallback(() => {
    const ctx = getAudioContext();
    console.log('Starting wind sound...');
    
    // Create wind using filtered noise
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
    
    // LFO for wind variation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    lfoGain.gain.setValueAtTime(100, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(ambientVolume, ctx.currentTime);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    lfo.start();
    noise.start();
    
    // Store the noise source for later cleanup
    ambientNodesRef.current.wind = noise as any;
    ambientNodesRef.current.windGain = gain;
    
    console.log('Wind sound started');
  }, [getAudioContext, ambientVolume]);

  const stopAmbient = useCallback(() => {
    if (ambientNodesRef.current.wind) {
      try {
        (ambientNodesRef.current.wind as any).stop();
      } catch {
        // ignore
      }
      ambientNodesRef.current.wind = null;
    }
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
  }, []);

  const startAmbient = useCallback(() => {
    // Guard: don't double-start intervals/sources
    if (
      ambientNodesRef.current.wind ||
      ambientNodesRef.current.birdInterval ||
      ambientNodesRef.current.childrenInterval ||
      ambientNodesRef.current.musicInterval
    ) {
      return;
    }

    // Must be called after a user gesture (or after audio has been unlocked)
    unlockAudio();

    // Start ambient layers
    startWindSound();
    startLofiMusic();

    // Random bird chirps every ~2s
    ambientNodesRef.current.birdInterval = setInterval(() => {
      if (Math.random() < 0.6) playBirdChirp();
    }, 2000);

    // Random children sounds every ~4s
    ambientNodesRef.current.childrenInterval = setInterval(() => {
      if (Math.random() < 0.4) playChildrenSound();
    }, 4000);

    // Kick off a bit of life immediately
    playBirdChirp();
    setTimeout(() => playChildrenSound(), 900);
  }, [unlockAudio, startWindSound, startLofiMusic, playBirdChirp, playChildrenSound]);

  // Toggle ambient sounds (music + ambience)
  const toggleAmbient = useCallback(() => {
    setIsAmbientPlaying((prev) => {
      const next = !prev;
      if (next) startAmbient();
      else stopAmbient();
      return next;
    });
  }, [startAmbient, stopAmbient]);

  // IMPORTANT: reliably unlock audio on *any* first interaction.
  // This makes SFX work even if the first “sound” is triggered by a timer.
  useEffect(() => {
    const onFirstInteraction = () => {
      unlockAudio();
      if (isAmbientPlaying) startAmbient();
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, [unlockAudio, isAmbientPlaying, startAmbient]);

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
    toggleAmbient,
    isAmbientPlaying,
  };
};
