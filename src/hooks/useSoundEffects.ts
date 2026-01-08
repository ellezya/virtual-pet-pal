import { useRef, useCallback, useEffect, useState } from 'react';

interface SoundEffectsReturn {
  playHop: () => void;
  playEat: () => void;
  playDrink: () => void;
  playClean: () => void;
  playPlay: () => void;
  playPoop: () => void;
  toggleAmbient: () => void;
  isAmbientPlaying: boolean;
}

export const useSoundEffects = (): SoundEffectsReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<{
    wind: OscillatorNode | null;
    windGain: GainNode | null;
    birdInterval: NodeJS.Timeout | null;
    childrenInterval: NodeJS.Timeout | null;
  }>({ wind: null, windGain: null, birdInterval: null, childrenInterval: null });
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const sfxVolume = 0.8;
  const ambientVolume = 0.35;

  // Initialize audio context on first user interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Soft scratchy hop sound - like landing on hay/straw barn floor
  const playHop = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Create scratchy noise for hay/straw texture
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Bandpass filter for scratchy texture
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(1.5, time);
    
    // Highpass to remove low rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(200, time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(sfxVolume * 0.25, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
    
    noise.connect(filter);
    filter.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.15);
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

  // Subtle poop sound (plop)
  const playPoop = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(70, time + 0.12);
    
    gain.gain.setValueAtTime(sfxVolume * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.2);
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

  // Start continuous wind/breeze sound
  const startWindSound = useCallback(() => {
    const ctx = getAudioContext();
    
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
    gain.gain.setValueAtTime(ambientVolume * 0.5, ctx.currentTime);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    lfo.start();
    noise.start();
    
    ambientNodesRef.current.wind = lfo as any;
    ambientNodesRef.current.windGain = gain;
    
    // Store references for cleanup
    (noise as any)._source = noise;
    (lfo as any)._lfo = lfo;
    ambientNodesRef.current.wind = noise as any;
  }, [getAudioContext]);

  // Toggle ambient sounds
  const toggleAmbient = useCallback(() => {
    if (isAmbientPlaying) {
      // Stop all ambient sounds
      if (ambientNodesRef.current.wind) {
        try {
          (ambientNodesRef.current.wind as any).stop();
        } catch {}
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
      setIsAmbientPlaying(false);
    } else {
      // Start ambient sounds
      startWindSound();
      
      // Random bird chirps
      const birdInterval = setInterval(() => {
        if (Math.random() < 0.5) {
          playBirdChirp();
        }
      }, 2000 + Math.random() * 3000);
      ambientNodesRef.current.birdInterval = birdInterval;
      
      // Random children sounds
      const childrenInterval = setInterval(() => {
        if (Math.random() < 0.3) {
          playChildrenSound();
        }
      }, 4000 + Math.random() * 4000);
      ambientNodesRef.current.childrenInterval = childrenInterval;
      
      setIsAmbientPlaying(true);
    }
  }, [isAmbientPlaying, startWindSound, playBirdChirp, playChildrenSound]);

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
    toggleAmbient,
    isAmbientPlaying,
  };
};
