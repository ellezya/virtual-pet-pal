import React, { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAmbientEngine432 } from '@/hooks/useAmbientEngine432';

type PetType = 'bunny' | 'fish';
type SceneType = 'habitat' | 'room' | 'park' | 'reef' | 'castle' | 'shell';

interface SoundContextType {
  playHop: () => void;
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
  windIntensity: number;
  setSfxMuted: (muted: boolean) => void;
  sfxMuted: boolean;
  setCurrentPet: (pet: PetType) => void;
  setCurrentScene: (scene: SceneType) => void;
  currentPet: PetType;
  currentScene: SceneType;
  /** EXPERIMENTAL: Toggle 432 Hz generative ambient engine */
  use432Hz: boolean;
  toggle432Hz: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [currentPet, setCurrentPet] = React.useState<PetType>(() => {
    const saved = localStorage.getItem('selectedPet');
    return saved === 'fish' ? 'fish' : 'bunny';
  });
  
  const [currentScene, setCurrentScene] = React.useState<SceneType>(() => {
    const savedScene = localStorage.getItem('selectedScene');
    if (savedScene === 'habitat' || savedScene === 'room' || savedScene === 'park') {
      return savedScene;
    }
    return 'room';
  });

  // EXPERIMENTAL: 432 Hz engine toggle
  const [use432Hz, setUse432Hz] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('lola_432hz') === '1';
    } catch {
      return false;
    }
  });

  const soundEffects = useSoundEffects(currentPet, currentScene);
  const engine432 = useAmbientEngine432();

  // When 432 Hz is toggled on, stop standard ambient and start engine; vice versa
  const toggle432Hz = React.useCallback(() => {
    setUse432Hz(prev => {
      const next = !prev;
      try { localStorage.setItem('lola_432hz', next ? '1' : '0'); } catch {}

      if (next) {
        // Stop standard ambient if playing, then start 432 engine
        if (soundEffects.isAmbientPlaying) {
          soundEffects.toggleAmbient(); // turns off standard
        }
        engine432.start(currentScene);
      } else {
        // Stop 432 engine, restart standard ambient
        engine432.stop();
        if (!soundEffects.isAmbientPlaying) {
          soundEffects.toggleAmbient(); // turns on standard
        }
      }
      return next;
    });
  }, [soundEffects, engine432, currentScene]);

  // Keep 432 engine scene in sync
  React.useEffect(() => {
    if (use432Hz && engine432.isRunning()) {
      engine432.updateScene(currentScene);
    }
  }, [currentScene, use432Hz, engine432]);

  // If 432 is active and ambient toggle is triggered, route to 432 engine
  const wrappedToggleAmbient = React.useCallback(() => {
    if (use432Hz) {
      if (engine432.isRunning()) {
        engine432.stop();
      } else {
        engine432.start(currentScene);
      }
      // Still toggle the standard state for UI consistency
      soundEffects.toggleAmbient();
    } else {
      soundEffects.toggleAmbient();
    }
  }, [use432Hz, engine432, soundEffects, currentScene]);

  // Auto-start 432 engine on mount if preference is saved
  const hasAutoStarted = React.useRef(false);
  React.useEffect(() => {
    if (use432Hz && !hasAutoStarted.current) {
      // Wait for user gesture (handled by first interaction)
      const onGesture = () => {
        if (hasAutoStarted.current) return;
        hasAutoStarted.current = true;
        // Stop standard ambient if it auto-started
        if (soundEffects.isAmbientPlaying) {
          soundEffects.toggleAmbient();
        }
        engine432.start(currentScene);
      };
      window.addEventListener('pointerdown', onGesture, { once: true, passive: true });
      window.addEventListener('keydown', onGesture, { once: true });
      return () => {
        window.removeEventListener('pointerdown', onGesture);
        window.removeEventListener('keydown', onGesture);
      };
    }
  }, [use432Hz]); // intentionally minimal deps

  return (
    <SoundContext.Provider value={{
      ...soundEffects,
      toggleAmbient: wrappedToggleAmbient,
      setCurrentPet,
      setCurrentScene,
      currentPet,
      currentScene,
      use432Hz,
      toggle432Hz,
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
