import { useRef, useCallback, useEffect, useState } from 'react';

interface SoundEffectsReturn {
  playHop: () => void;
  playEat: () => void;
  playDrink: () => void;
  playClean: () => void;
  playPlay: () => void;
  playPoop: () => void;
  toggleMusic: () => void;
  isMusicPlaying: boolean;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
}

export const useSoundEffects = (): SoundEffectsReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const sfxVolumeRef = useRef(0.5);
  const musicVolumeRef = useRef(0.3);

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

  // Soft thump for hopping
  const playHop = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Create a soft thump using a low-frequency oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, time);
    
    gain.gain.setValueAtTime(sfxVolumeRef.current * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }, [getAudioContext]);

  // Crunchy eating sound
  const playEat = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Multiple short crunchy sounds
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, time + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(200, time + i * 0.12 + 0.05);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.Q.setValueAtTime(2, time);
      
      gain.gain.setValueAtTime(0, time + i * 0.12);
      gain.gain.linearRampToValueAtTime(sfxVolumeRef.current * 0.15, time + i * 0.12 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.12 + 0.06);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.12);
      osc.stop(time + i * 0.12 + 0.08);
    }
  }, [getAudioContext]);

  // Gentle sipping/lapping sound
  const playDrink = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + Math.random() * 100, time + i * 0.25);
      osc.frequency.exponentialRampToValueAtTime(200, time + i * 0.25 + 0.1);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      
      gain.gain.setValueAtTime(0, time + i * 0.25);
      gain.gain.linearRampToValueAtTime(sfxVolumeRef.current * 0.2, time + i * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.25 + 0.15);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.25);
      osc.stop(time + i * 0.25 + 0.18);
    }
  }, [getAudioContext]);

  // Sweeping/brushing clean sound
  const playClean = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // White noise sweep
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.linearRampToValueAtTime(4000, time + 0.25);
    filter.frequency.linearRampToValueAtTime(1500, time + 0.5);
    filter.Q.setValueAtTime(1, time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(sfxVolumeRef.current * 0.25, time + 0.1);
    gain.gain.linearRampToValueAtTime(0, time + 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.5);
  }, [getAudioContext]);

  // Playful bouncy sound
  const playPlay = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    // Bouncy ball sound
    const notes = [523, 659, 784, 659]; // C5, E5, G5, E5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time + i * 0.12);
      
      gain.gain.setValueAtTime(sfxVolumeRef.current * 0.2, time + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.12 + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time + i * 0.12);
      osc.stop(time + i * 0.12 + 0.12);
    });
  }, [getAudioContext]);

  // Subtle poop sound (plop)
  const playPoop = useCallback(() => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.15);
    
    gain.gain.setValueAtTime(sfxVolumeRef.current * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }, [getAudioContext]);

  // Background music toggle using lo-fi ambient generation
  const toggleMusic = useCallback(() => {
    if (!musicRef.current) {
      // Create ambient background music using oscillators
      const ctx = getAudioContext();
      
      // Simple ambient pad
      const playAmbientLoop = () => {
        if (!isMusicPlaying) return;
        
        const time = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4
        
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, time);
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(musicVolumeRef.current * 0.08, time + 0.5);
          gain.gain.setValueAtTime(musicVolumeRef.current * 0.08, time + 3);
          gain.gain.linearRampToValueAtTime(0, time + 4);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(time + i * 0.3);
          osc.stop(time + 4 + i * 0.3);
        });
      };
      
      setIsMusicPlaying(true);
      playAmbientLoop();
      
      // Loop the ambient music
      const musicInterval = setInterval(() => {
        if (isMusicPlaying) {
          playAmbientLoop();
        } else {
          clearInterval(musicInterval);
        }
      }, 4000);
      
      (musicRef as any).current = musicInterval;
    } else {
      // Stop music
      clearInterval(musicRef.current as any);
      musicRef.current = null;
      setIsMusicPlaying(false);
    }
  }, [getAudioContext, isMusicPlaying]);

  const setMusicVolume = useCallback((volume: number) => {
    musicVolumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    sfxVolumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        clearInterval(musicRef.current as any);
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
    toggleMusic,
    isMusicPlaying,
    setMusicVolume,
    setSfxVolume
  };
};
