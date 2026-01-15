import React, { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

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

  const soundEffects = useSoundEffects(currentPet, currentScene);

  return (
    <SoundContext.Provider value={{
      ...soundEffects,
      setCurrentPet,
      setCurrentScene,
      currentPet,
      currentScene,
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
