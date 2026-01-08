import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Lock, Unlock, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { removeSolidBackgroundToDataUrl } from '@/lib/removeSolidBackground';
import BowlStation from '@/components/BowlStation';
import { useSoundEffects } from '@/hooks/useSoundEffects';
// Pet images
import bunnyHappy from '@/assets/bunny-happy.png';
import bunnySad from '@/assets/bunny-sad.png';
import bunnyEating from '@/assets/bunny-eating.png';
import bunnyDrinking from '@/assets/bunny-drinking.png';
import bunnyPlaying from '@/assets/bunny-playing.png';
import fishHappy from '@/assets/fish-happy.png';
import fishSad from '@/assets/fish-sad.png';
import fishEating from '@/assets/fish-eating.png';

// Habitat images
import habitatIndoor from '@/assets/habitat-indoor.png';
import habitatTank from '@/assets/habitat-tank.png';
import habitatPark from '@/assets/habitat-park.png';
import habitatRoom from '@/assets/habitat-room.png';

// Video backgrounds
import lofiRoomVideo from '@/assets/lofi-room-bg.mp4';

const ClassroomPets = () => {
  const { signOut, user } = useAuth();
  const [currentPet, setCurrentPet] = useState('bunny');
  const [currentScene, setCurrentScene] = useState('habitat');
  
  // Sound effects
  const { playHop, playEat, playDrink, playClean, playPlay, playPoop, playHay, toggleAmbient, isAmbientPlaying } = useSoundEffects();
  const prevHoppingRef = useRef(false);
  
  // Get ground Y position based on current scene
  const getGroundY = (scene: string) => {
    if (scene === 'park') return 78;
    if (scene === 'room') return 84;
    return 88; // habitat
  };
  
  const [bunnyState, setBunnyState] = useState({
    hunger: 80,
    happiness: 85,
    hydration: 75,
    energy: 70,
    rest: 80,
    cleanliness: 90,
    mood: 'happy' as 'happy' | 'sad' | 'neutral',
    action: 'idle' as 'idle' | 'eating' | 'drinking' | 'playing' | 'napping' | 'asking-food' | 'asking-water',
    idleBehavior: 'none' as 'none' | 'sniffing' | 'ear-scratch' | 'nibbling' | 'looking',
    position: { x: 50, y: 88 },
    targetObject: null as null | 'food-bowl' | 'water-bowl' | 'toy-area',
    isHopping: false,
    facingRight: true,
    isNapping: false
  });
  
  // Update bunny position when scene changes
  useEffect(() => {
    if (currentPet === 'bunny') {
      setBunnyState(prev => ({
        ...prev,
        position: { x: prev.position.x, y: getGroundY(currentScene) }
      }));
    }
  }, [currentScene, currentPet]);

  // Poop positions in the habitat
  const [poops, setPoops] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Modern trampoline SVG component
  const TrampolineSVG = ({ large = false }: { large?: boolean }) => (
    <svg 
      width={large ? "80" : "48"} 
      height={large ? "40" : "24"} 
      viewBox="0 0 48 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className="drop-shadow-lg"
    >
      {/* Legs */}
      <path d="M6 24L10 12" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"/>
      <path d="M42 24L38 12" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"/>
      {/* Frame */}
      <ellipse cx="24" cy="12" rx="20" ry="4" fill="hsl(var(--primary))" opacity="0.2"/>
      <ellipse cx="24" cy="12" rx="20" ry="4" stroke="hsl(var(--primary))" strokeWidth="2"/>
      {/* Bouncing surface - mesh pattern */}
      <ellipse cx="24" cy="12" rx="17" ry="3" fill="hsl(var(--secondary))" opacity="0.4"/>
      {/* Cross pattern for mesh effect */}
      <line x1="10" y1="12" x2="38" y2="12" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.5"/>
      <line x1="24" y1="9" x2="24" y2="15" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.5"/>
      <line x1="16" y1="10" x2="16" y2="14" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.3"/>
      <line x1="32" y1="10" x2="32" y2="14" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  );

  // Hollow tree trunk SVG component - horizontal with transparent front
  const HollowTreeTrunkSVG = ({ large = false }: { large?: boolean }) => (
    <svg 
      width={large ? "120" : "60"} 
      height={large ? "50" : "25"} 
      viewBox="0 0 120 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className="drop-shadow-lg"
    >
      {/* Back wall of hollow (visible through cutaway) */}
      <path d="M15 8 L105 8 L105 42 L15 42 Z" fill="hsl(25 30% 15%)" />
      
      {/* Left opening - bark ring */}
      <ellipse cx="15" cy="25" rx="14" ry="22" fill="hsl(25 40% 28%)" />
      <ellipse cx="15" cy="25" rx="10" ry="17" fill="hsl(25 30% 12%)" />
      
      {/* Right opening - bark ring */}
      <ellipse cx="105" cy="25" rx="14" ry="22" fill="hsl(25 40% 28%)" />
      <ellipse cx="105" cy="25" rx="10" ry="17" fill="hsl(25 30% 12%)" />
      
      {/* Top bark (curved log top) */}
      <path d="M15 3 Q60 0 105 3 L105 8 Q60 5 15 8 Z" fill="hsl(25 45% 32%)" />
      <path d="M20 4 Q60 2 100 4" stroke="hsl(25 35% 22%)" strokeWidth="1.5" opacity="0.6"/>
      
      {/* Bottom bark (curved log bottom) */}
      <path d="M15 47 Q60 50 105 47 L105 42 Q60 45 15 42 Z" fill="hsl(25 45% 32%)" />
      <path d="M20 46 Q60 48 100 46" stroke="hsl(25 35% 22%)" strokeWidth="1.5" opacity="0.6"/>
      
      {/* Wood grain lines on back wall */}
      <line x1="30" y1="12" x2="30" y2="38" stroke="hsl(25 25% 12%)" strokeWidth="1" opacity="0.4"/>
      <line x1="55" y1="10" x2="55" y2="40" stroke="hsl(25 25% 12%)" strokeWidth="1" opacity="0.3"/>
      <line x1="80" y1="12" x2="80" y2="38" stroke="hsl(25 25% 12%)" strokeWidth="1" opacity="0.4"/>
      
      {/* Moss accents on top */}
      <circle cx="35" cy="5" r="3" fill="hsl(85 40% 35%)" opacity="0.7"/>
      <circle cx="70" cy="3" r="2.5" fill="hsl(85 35% 38%)" opacity="0.6"/>
      <circle cx="90" cy="5" r="2" fill="hsl(85 45% 40%)" opacity="0.5"/>
      
      {/* Small mushroom on log */}
      <ellipse cx="45" cy="4" rx="2" ry="1" fill="hsl(15 60% 45%)" opacity="0.8"/>
      <rect x="44.5" y="4" width="1" height="2" fill="hsl(30 30% 80%)" opacity="0.7"/>
    </svg>
  );

  // Trampoline bounce state
  const [trampolineBounceCount, setTrampolineBounceCount] = useState(0);
  const [isTrampolineBouncing, setIsTrampolineBouncing] = useState(false);

  // Toys configuration
  const toys = [
    { id: 'trampoline', emoji: null, component: TrampolineSVG, name: 'Trampoline', energyCost: 25, happinessBoost: 30, lowEnergy: false },
    { id: 'tunnel', emoji: null, component: HollowTreeTrunkSVG, name: 'Tree Trunk', energyCost: 15, happinessBoost: 20, lowEnergy: false },
    { id: 'hayPile', emoji: '🪺', component: null, name: 'Hay Pile', energyCost: 8, happinessBoost: 15, lowEnergy: true },
    { id: 'balloon', emoji: '🎈', component: null, name: 'Balloon', energyCost: 5, happinessBoost: 12, lowEnergy: true },
    { id: 'cardboard', emoji: '📦', component: null, name: 'Box', energyCost: 10, happinessBoost: 18, lowEnergy: true },
    { id: 'yarn', emoji: '🧶', component: null, name: 'Yarn', energyCost: 6, happinessBoost: 14, lowEnergy: true },
  ];
  
  const [selectedToy, setSelectedToy] = useState(toys[0]);
  
  // Flying baby birds state (for hay pile nest)
  const [flyingBirds, setFlyingBirds] = useState<Array<{ id: number; startX: number; startY: number }>>([]);
  const [eggsRemaining, setEggsRemaining] = useState(3);
  
  // Get available toys based on scene (room = low energy only)
  const availableToys = currentScene === 'room' 
    ? toys.filter(t => t.lowEnergy) 
    : toys;

  // Bowl fill levels (0-100)
  const [bowlLevels, setBowlLevels] = useState({
    food: 0,
    water: 0
  });

  // Bowl station position (centered at bottom) and toy position
  const bowlStationPosition = { x: 20, y: 96 };
  const envObjects = {
    'food-bowl': { x: 18, y: 94 },
    'water-bowl': { x: 24, y: 94 },
    'toy-area': { x: 65, y: 94 },
  };
  const [fishState, setFishState] = useState({
    hunger: 70,
    happiness: 80,
    tankCleanliness: 95,
    mood: 'happy' as 'happy' | 'sad' | 'calm',
    action: 'idle' as 'idle' | 'eating' | 'playing',
    position: { x: 50, y: 50 }
  });

  const [gameState, setGameState] = useState({
    locked: false,
    notifications: [] as string[]
  });

  // Create truly transparent bunny sprites at runtime (removes baked-in white/checkerboard background)
  const [bunnySpriteAlpha, setBunnySpriteAlpha] = useState<{
    happy: string;
    sad: string;
    eating: string;
    drinking: string;
    playing: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [happy, sad, eating, drinking, playing] = await Promise.all([
          removeSolidBackgroundToDataUrl(bunnyHappy),
          removeSolidBackgroundToDataUrl(bunnySad),
          removeSolidBackgroundToDataUrl(bunnyEating),
          removeSolidBackgroundToDataUrl(bunnyDrinking),
          removeSolidBackgroundToDataUrl(bunnyPlaying),
        ]);

        if (!cancelled) {
          setBunnySpriteAlpha({ happy, sad, eating, drinking, playing });
        }
      } catch {
        // If anything fails, we just fall back to original sprites.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Bunny decay and scene-based effects
  useEffect(() => {
    if (currentPet !== 'bunny') return;
    const interval = setInterval(() => {
      setBunnyState(prev => {
        // Base decay rates
        let energyChange = -0.2;
        let happinessChange = -0.3;
        let restChange = -0.15;
        
        // Scene-based effects
        if (currentScene === 'room') {
          // Room restores energy and rest
          energyChange = 0.5;
          restChange = 0.3;
        } else if (currentScene === 'park') {
          // Park drains energy faster but boosts happiness
          energyChange = -0.5;
          happinessChange = 0.2;
        }
        
        // Napping boosts rest and energy even more
        if (prev.isNapping) {
          energyChange = 1.0;
          restChange = 0.8;
        }
        
        const newState = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.5),
          hydration: Math.max(0, prev.hydration - 0.4),
          energy: Math.max(0, Math.min(100, prev.energy + energyChange)),
          happiness: Math.max(0, Math.min(100, prev.happiness + happinessChange)),
          rest: Math.max(0, Math.min(100, prev.rest + restChange)),
          cleanliness: Math.max(0, prev.cleanliness - 0.15)
        };
        if (newState.hunger < 30 || newState.hydration < 30 || newState.cleanliness < 30 || newState.rest < 20) newState.mood = 'sad';
        else if (newState.happiness > 70) newState.mood = 'happy';
        else newState.mood = 'neutral';
        return newState;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [currentPet, currentScene]);

  // Play hop sound when bunny starts hopping
  useEffect(() => {
    if (bunnyState.isHopping && !prevHoppingRef.current) {
      playHop();
    }
    prevHoppingRef.current = bunnyState.isHopping;
  }, [bunnyState.isHopping, playHop]);

  // Bunny occasionally poops
  useEffect(() => {
    if (currentPet !== 'bunny') return;
    const poopInterval = setInterval(() => {
      // Random chance to poop (higher when recently fed)
      if (Math.random() < 0.3 && poops.length < 5) {
        const newPoop = {
          id: Date.now(),
          x: 25 + Math.random() * 50, // Random position in habitat
          y: 90 + Math.random() * 6
        };
        setPoops(prev => [...prev, newPoop]);
        setBunnyState(prev => ({
          ...prev,
          cleanliness: Math.max(0, prev.cleanliness - 10)
        }));
        playPoop();
      }
    }, 8000);
    return () => clearInterval(poopInterval);
  }, [currentPet, poops.length, playPoop]);

  // Fish decay
  useEffect(() => {
    if (currentPet !== 'fish') return;
    const interval = setInterval(() => {
      setFishState(prev => {
        const newState = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.3),
          happiness: Math.max(0, prev.happiness - 0.2),
          tankCleanliness: Math.max(0, prev.tankCleanliness - 0.4)
        };
        if (newState.hunger < 30) newState.mood = 'sad';
        else if (newState.happiness > 70) newState.mood = 'happy';
        else newState.mood = 'calm';
        return newState;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [currentPet]);

  // Auto-move bunny with hopping to objects or idle wandering
  useEffect(() => {
    if (currentPet !== 'bunny' || bunnyState.action !== 'idle') return;
    
    // Different Y positions based on scene (where the ground is visible)
    const getGroundY = () => {
      if (currentScene === 'park') return { min: 75, max: 82 };
      if (currentScene === 'room') return { min: 80, max: 88 };
      return { min: 86, max: 92 }; // habitat
    };
    
    const ground = getGroundY();
    
    const moveInterval = setInterval(() => {
      // If bunny has a target object, hop towards it
      if (bunnyState.targetObject) {
        const target = envObjects[bunnyState.targetObject];
        const movingRight = target.x > bunnyState.position.x;
        
        setBunnyState(prev => ({ ...prev, isHopping: true, facingRight: movingRight }));
        
        setTimeout(() => {
          setBunnyState(prev => ({
            ...prev,
            isHopping: false,
            position: { x: target.x, y: ground.max }
          }));
        }, 600);
        return;
      }
      
      // Random idle wandering
      const deltaX = (Math.random() - 0.5) * 12;
      const newX = Math.max(30, Math.min(70, bunnyState.position.x + deltaX));
      const newY = Math.max(ground.min, Math.min(ground.max, bunnyState.position.y + (Math.random() - 0.5) * 3));
      const movingRight = deltaX > 0;
      
      setBunnyState(prev => ({ ...prev, isHopping: true, facingRight: movingRight }));
      
      setTimeout(() => {
        setBunnyState(prev => ({
          ...prev,
          isHopping: false,
          position: { x: newX, y: newY }
        }));
      }, 600);
    }, 2500);
    return () => clearInterval(moveInterval);
  }, [currentPet, bunnyState.action, bunnyState.position.x, bunnyState.position.y, bunnyState.targetObject]);

  // Idle behaviors (sniffing, scratching, looking around)
  useEffect(() => {
    if (currentPet !== 'bunny' || bunnyState.action !== 'idle') return;
    
    const idleInterval = setInterval(() => {
      const behaviors: Array<'sniffing' | 'ear-scratch' | 'nibbling' | 'looking'> = ['sniffing', 'ear-scratch', 'nibbling', 'looking'];
      const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      
      setBunnyState(prev => ({ ...prev, idleBehavior: randomBehavior }));
      
      // Clear behavior after animation
      setTimeout(() => {
        setBunnyState(prev => ({ ...prev, idleBehavior: 'none' }));
      }, randomBehavior === 'nibbling' ? 2000 : 1200);
    }, 4000);
    
    return () => clearInterval(idleInterval);
  }, [currentPet, bunnyState.action]);

  // Auto-move fish
  useEffect(() => {
    if (currentPet !== 'fish' || fishState.action !== 'idle') return;
    const swimInterval = setInterval(() => {
      setFishState(prev => ({
        ...prev,
        position: {
          x: Math.max(15, Math.min(85, prev.position.x + (Math.random() - 0.5) * 20)),
          y: Math.max(20, Math.min(70, prev.position.y + (Math.random() - 0.5) * 15))
        }
      }));
    }, 2000);
    return () => clearInterval(swimInterval);
  }, [currentPet, fishState.action]);

  // Notifications
  useEffect(() => {
    const checkNeeds = setInterval(() => {
      const notifications: string[] = [];
      if (currentPet === 'bunny') {
        if (bunnyState.hunger < 30) notifications.push('🥕 Lola is hungry!');
        if (bunnyState.hydration < 30) notifications.push('💧 Water low!');
        if (bunnyState.cleanliness < 40) notifications.push('💩 Habitat needs cleaning!');
        if (bunnyState.happiness < 30) notifications.push('😢 Bunny is sad!');
        if (bunnyState.rest < 30 && bunnyState.energy < 40) notifications.push('😴 Lola needs rest!');
      } else if (currentPet === 'fish') {
        if (fishState.hunger < 30) notifications.push('🐠 Fish hungry!');
        if (fishState.tankCleanliness < 40) notifications.push('🧽 Tank dirty!');
      }
      setGameState(prev => ({ ...prev, notifications }));
    }, 3000);
    return () => clearInterval(checkNeeds);
  }, [currentPet, bunnyState, fishState]);

  const doAction = (actionType: 'eating' | 'drinking' | 'playing', targetObj: 'food-bowl' | 'water-bowl' | 'toy-area' | null, duration = 3000) => {
    if (gameState.locked) return;
    if (currentPet === 'bunny') {
      // Set target and start hopping towards it
      setBunnyState(prev => ({ ...prev, targetObject: targetObj, idleBehavior: 'none' }));
      
      // After hopping to object, start the action
      setTimeout(() => {
        setBunnyState(prev => ({ ...prev, action: actionType, targetObject: null }));
        
        // End action after duration
        setTimeout(() => {
          setBunnyState(prev => ({ ...prev, action: 'idle' }));
        }, duration);
      }, 800);
    } else {
      setFishState(prev => ({ ...prev, action: actionType as 'eating' | 'playing' }));
      setTimeout(() => {
        setFishState(prev => ({ ...prev, action: 'idle' }));
      }, duration);
    }
  };

  const feedPet = () => {
    if (gameState.locked) return;
    if (currentPet === 'bunny') {
      // Fill the food bowl first
      setBowlLevels(prev => ({ ...prev, food: 100 }));
      doAction('eating', 'food-bowl', 4000);
      setTimeout(() => {
        playEat();
        setBunnyState(prev => ({ 
          ...prev, 
          hunger: Math.min(100, prev.hunger + 40), 
          happiness: Math.min(100, prev.happiness + 10) 
        }));
        // Drain the bowl as bunny eats
        setBowlLevels(prev => ({ ...prev, food: Math.max(0, prev.food - 60) }));
      }, 800);
    } else {
      doAction('eating', null, 3000);
      setFishState(prev => ({ 
        ...prev, 
        hunger: Math.min(100, prev.hunger + 50), 
        happiness: Math.min(100, prev.happiness + 10) 
      }));
    }
  };

  const waterBunny = () => {
    if (gameState.locked || currentPet !== 'bunny') return;
    // Fill the water bowl first
    setBowlLevels(prev => ({ ...prev, water: 100 }));
    doAction('drinking', 'water-bowl', 3000);
    setTimeout(() => {
      playDrink();
      setBunnyState(prev => ({ 
        ...prev, 
        hydration: Math.min(100, prev.hydration + 50), 
        happiness: Math.min(100, prev.happiness + 5) 
      }));
      // Drain the bowl as bunny drinks
      setBowlLevels(prev => ({ ...prev, water: Math.max(0, prev.water - 50) }));
    }, 800);
  };

  const playWithToy = (toy: typeof toys[0]) => {
    if (gameState.locked) return;
    if (currentPet === 'bunny') {
      // Special handling for trampoline - bunny jumps directly on it
      if (toy.id === 'trampoline') {
        setIsTrampolineBouncing(true);
        setTrampolineBounceCount(0);
        setBunnyState(prev => ({ ...prev, action: 'playing', targetObject: null }));
        
        // Do 3 bounces
        let bounceNum = 0;
        const bounceInterval = setInterval(() => {
          bounceNum++;
          setTrampolineBounceCount(bounceNum);
          playHop();
          
          if (bounceNum >= 3) {
            clearInterval(bounceInterval);
            setTimeout(() => {
              setIsTrampolineBouncing(false);
              setTrampolineBounceCount(0);
              setBunnyState(prev => ({ ...prev, action: 'idle' }));
            }, 600);
          }
        }, 700);
        
        playPlay();
        const parkMultiplier = currentScene === 'park' ? 1.5 : 1;
        const happinessBoost = Math.round(toy.happinessBoost * parkMultiplier);
        setBunnyState(prev => ({ 
          ...prev, 
          happiness: Math.min(100, prev.happiness + happinessBoost), 
          energy: Math.max(0, prev.energy - toy.energyCost) 
        }));
        return;
      }
      
      doAction('playing', 'toy-area' as any, 5000);
      setTimeout(() => {
        // Play hay sound for hay pile, otherwise normal play sound
        if (toy.id === 'hayPile') {
          playHay();
          // Hatch a baby bird and fly away
          if (eggsRemaining > 0) {
            const birdId = Date.now();
            setFlyingBirds(prev => [...prev, { id: birdId, startX: 65, startY: 85 }]);
            setEggsRemaining(prev => prev - 1);
            // Remove bird after animation
            setTimeout(() => {
              setFlyingBirds(prev => prev.filter(b => b.id !== birdId));
            }, 3000);
            // Reset eggs after all have flown
            if (eggsRemaining === 1) {
              setTimeout(() => setEggsRemaining(3), 5000);
            }
          }
        } else {
          playPlay();
        }
        // Happiness boost is higher at the park
        const parkMultiplier = currentScene === 'park' ? 1.5 : 1;
        const happinessBoost = Math.round(toy.happinessBoost * parkMultiplier);
        const energyDrain = toy.energyCost;
        setBunnyState(prev => ({ 
          ...prev, 
          happiness: Math.min(100, prev.happiness + happinessBoost), 
          energy: Math.max(0, prev.energy - energyDrain) 
        }));
      }, 800);
    } else {
      doAction('playing', null, 3000);
      setFishState(prev => ({ 
        ...prev, 
        happiness: Math.min(100, prev.happiness + 20) 
      }));
    }
  };

  const takeNap = () => {
    if (gameState.locked || currentPet !== 'bunny' || currentScene !== 'room') return;
    setBunnyState(prev => ({ ...prev, action: 'napping', isNapping: true, idleBehavior: 'none' }));
    
    // Nap for 6 seconds
    setTimeout(() => {
      setBunnyState(prev => ({ 
        ...prev, 
        action: 'idle', 
        isNapping: false,
        rest: Math.min(100, prev.rest + 30),
        energy: Math.min(100, prev.energy + 20)
      }));
    }, 6000);
  };

  const cleanHabitat = () => {
    if (gameState.locked) return;
    playClean();
    if (currentPet === 'bunny') {
      // Clean all poops and restore cleanliness
      setPoops([]);
      setBunnyState(prev => ({
        ...prev,
        cleanliness: 100,
        happiness: Math.min(100, prev.happiness + 10)
      }));
    } else {
      setFishState(prev => ({ 
        ...prev, 
        tankCleanliness: 100, 
        happiness: Math.min(100, prev.happiness + 15) 
      }));
    }
  };

  const resetPet = () => {
    if (currentPet === 'bunny') {
      setBunnyState({
        hunger: 80,
        happiness: 85,
        hydration: 75,
        energy: 70,
        rest: 80,
        cleanliness: 90,
        mood: 'happy',
        action: 'idle',
        idleBehavior: 'none',
        position: { x: 50, y: 88 },
        targetObject: null,
        isHopping: false,
        facingRight: true,
        isNapping: false
      });
      setBowlLevels({ food: 0, water: 0 });
      setPoops([]);
    } else {
      setFishState({
        hunger: 70,
        happiness: 80,
        tankCleanliness: 95,
        mood: 'happy',
        action: 'idle',
        position: { x: 50, y: 50 }
      });
    }
  };

  const getStatusColor = (value: number) => {
    if (value > 70) return 'bg-status-good';
    if (value > 40) return 'bg-status-medium';
    return 'bg-status-low';
  };

  const getBunnyImage = () => {
    const alpha = bunnySpriteAlpha;

    if (bunnyState.action === 'eating') return alpha?.eating ?? bunnyEating;
    if (bunnyState.action === 'drinking') return alpha?.drinking ?? bunnyDrinking;
    if (bunnyState.action === 'playing') return alpha?.playing ?? bunnyPlaying;
    if (bunnyState.mood === 'sad') return alpha?.sad ?? bunnySad;
    return alpha?.happy ?? bunnyHappy;
  };

  const getFishImage = () => {
    if (fishState.action === 'eating') return fishEating;
    if (fishState.mood === 'sad') return fishSad;
    return fishHappy;
  };

  const habitatSrc =
    currentPet === 'fish'
      ? habitatTank
      : currentScene === 'park'
      ? habitatPark
      : currentScene === 'room'
      ? habitatRoom
      : habitatIndoor;


  return (
    <div className="w-full h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card shadow-medium p-4 flex justify-between items-center z-10">
        <div className="flex gap-3 items-center">
          <h1 className="text-2xl font-extrabold text-foreground">🐰 Lola's Classroom</h1>
          <button 
            onClick={() => setGameState(prev => ({ ...prev, locked: !prev.locked }))} 
            className={`control-button ${gameState.locked ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}
            title={gameState.locked ? 'Unlock controls' : 'Lock controls'}
          >
            {gameState.locked ? <Lock size={20} /> : <Unlock size={20} />}
          </button>
          <button 
            onClick={resetPet} 
            className="control-button bg-secondary/20 text-secondary"
            title="Reset pet"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={toggleAmbient} 
            className={`control-button ${isAmbientPlaying ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
            title={isAmbientPlaying ? 'Mute sounds' : 'Play ambient sounds'}
          >
            {isAmbientPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {gameState.notifications.length > 0 && (
            <div className="flex flex-col gap-1">
              {gameState.notifications.map((notif, i) => (
                <div key={i} className="notification-badge">{notif}</div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground hidden sm:inline">
              {user?.email?.split('@')[0]}
            </span>
            <button 
              onClick={signOut}
              className="control-button bg-muted hover:bg-destructive/20 hover:text-destructive"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Pet/Scene Selector */}
      <nav className="flex gap-2 p-3 bg-card/80 backdrop-blur-sm border-b border-border">
        <button 
          onClick={() => setCurrentPet('bunny')} 
          className={currentPet === 'bunny' ? 'scene-button-active bg-primary text-primary-foreground' : 'scene-button-inactive'}
        >
          🐰 Bunny
        </button>
        <button 
          onClick={() => { setCurrentPet('fish'); setCurrentScene('tank'); }} 
          className={currentPet === 'fish' ? 'scene-button-active bg-secondary text-secondary-foreground' : 'scene-button-inactive'}
        >
          🐠 Fish
        </button>
        
        <div className="w-px bg-border mx-2" />
        
        {currentPet === 'bunny' && (
          <>
            <button 
              onClick={() => setCurrentScene('habitat')} 
              className={currentScene === 'habitat' ? 'scene-button-active bg-primary text-primary-foreground' : 'scene-button-inactive'}
            >
              🏠 Habitat
            </button>
            <button 
              onClick={() => setCurrentScene('room')} 
              className={currentScene === 'room' ? 'scene-button-active bg-accent text-accent-foreground' : 'scene-button-inactive'}
            >
              🛋️ Room
            </button>
            <button 
              onClick={() => setCurrentScene('park')} 
              className={currentScene === 'park' ? 'scene-button-active bg-success text-success-foreground' : 'scene-button-inactive'}
            >
              🌳 Park
            </button>
          </>
        )}
      </nav>

      {/* Main Scene */}
      <main className="flex-1 relative overflow-hidden">
        {/* Background based on pet/scene */}
        {currentPet !== 'fish' && currentScene === 'habitat' && (
          <div className="absolute inset-0 z-0 bg-room-wall">
            <video
              key="lofi-video-bg"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={lofiRoomVideo} type="video/mp4" />
            </video>
          </div>
        )}

        {/* Room scene */}
        {currentPet !== 'fish' && currentScene === 'room' && (
          <div className="absolute inset-0 z-0 bg-room-floor">
            <img 
              src={habitatRoom} 
              alt="Room" 
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Park scene */}
        {currentPet !== 'fish' && currentScene === 'park' && (
          <div className="absolute inset-0 z-0 bg-park-grass">
            <img 
              src={habitatPark} 
              alt="Park" 
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Fish tank static background */}
        {currentPet === 'fish' && (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-tank-water via-tank-water to-tank-deep">
            <img 
              key={habitatSrc}
              src={habitatSrc} 
              alt="Fish tank" 
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Lofi overlays */}
        <div className="lofi-overlay z-[1]" />
        <div className="lofi-vignette z-[1]" />
        <div className="lofi-grain z-[1]" />
        
        {/* Animated warm sunlight rays */}
        <div className="absolute inset-0 pointer-events-none opacity-50 z-[2]">
          <div 
            className="absolute top-0 right-[15%] w-[250px] h-[130%] bg-gradient-to-b from-primary/40 via-primary/15 to-transparent rotate-[12deg] blur-2xl animate-pulse-soft"
            style={{ animationDuration: '6s' }}
          />
          <div 
            className="absolute top-0 right-[30%] w-[120px] h-[110%] bg-gradient-to-b from-warning/30 via-warning/10 to-transparent rotate-[18deg] blur-xl animate-pulse-soft"
            style={{ animationDuration: '8s', animationDelay: '2s' }}
          />
          <div 
            className="absolute top-0 right-[45%] w-[80px] h-[90%] bg-gradient-to-b from-primary/20 via-transparent to-transparent rotate-[22deg] blur-lg animate-pulse-soft"
            style={{ animationDuration: '5s', animationDelay: '1s' }}
          />
        </div>

        {/* Floating dust particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/50 animate-float-dust"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${8 + Math.random() * 6}s`,
              }}
            />
          ))}
        </div>

        {/* Animated Bubbles for Fish Tank */}
        {currentPet === 'fish' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[4]">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-secondary/40 rounded-full animate-bubble"
                style={{
                  width: `${6 + Math.random() * 10}px`,
                  height: `${6 + Math.random() * 10}px`,
                  left: `${10 + Math.random() * 80}%`,
                  bottom: `-5%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Interactive Environment Objects for Bunny */}
        {currentPet === 'bunny' && (
          <div className="absolute inset-0 z-[5] pointer-events-none">
            {/* Bowl Station with mat and named bowls */}
            <div 
              className="absolute transition-transform duration-200"
              style={{ 
                left: `${bowlStationPosition.x}%`, 
                top: `${bowlStationPosition.y}%`, 
                transform: 'translate(-50%, -100%)' 
              }}
            >
              <BowlStation
                petName="Lola"
                foodLevel={bowlLevels.food}
                waterLevel={bowlLevels.water}
                scene={currentScene as 'habitat' | 'room' | 'park'}
                targetObject={bunnyState.targetObject}
              />
            </div>
            
            {/* Selected Toy Display - with special handling for trampoline and balloon */}
            {!isTrampolineBouncing && (
              <div 
                className={`absolute transition-transform duration-200 ${
                  bunnyState.targetObject === 'toy-area' ? 'scale-110' : ''
                } ${bunnyState.action === 'playing' && selectedToy.id !== 'trampoline' ? 'animate-bounce-slow' : ''}`}
                style={{ left: `${envObjects['toy-area'].x}%`, top: `${envObjects['toy-area'].y}%`, transform: 'translate(-50%, -100%)' }}
              >
                {bunnyState.action === 'playing' && selectedToy.id === 'balloon' ? (
                  // Show balloon with string when bunny is floating
                  <div className="relative">
                    <div className="text-3xl sm:text-4xl md:text-5xl animate-balloon-sway">🎈</div>
                    {/* Balloon string going down */}
                    <svg className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-24" viewBox="0 0 16 96">
                      <path 
                        d="M8 0 Q12 24 4 48 Q12 72 8 96" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeWidth="1.5" 
                        fill="none"
                        className="animate-string-wave"
                      />
                    </svg>
                  </div>
                ) : selectedToy.id === 'hayPile' ? (
                  // Nest with eggs
                  <div className="relative">
                    <div className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">🪺</div>
                    {/* Show remaining eggs */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {[...Array(eggsRemaining)].map((_, i) => (
                        <span key={i} className="text-xs">🥚</span>
                      ))}
                    </div>
                  </div>
                ) : selectedToy.id === 'tunnel' && selectedToy.component ? (
                  // Hollow tree trunk - larger display
                  <HollowTreeTrunkSVG large />
                ) : selectedToy.component ? (
                  <selectedToy.component large />
                ) : (
                  <div className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">{selectedToy.emoji}</div>
                )}
              </div>
            )}
            
            {/* Flying baby birds */}
            {flyingBirds.map((bird) => (
              <div
                key={bird.id}
                className="absolute animate-bird-fly pointer-events-none z-40"
                style={{ 
                  left: `${bird.startX}%`, 
                  top: `${bird.startY}%`,
                }}
              >
                <span className="text-xl">🐣</span>
              </div>
            ))}
            
            {/* Poops */}
            {poops.map((poop) => (
              <div
                key={poop.id}
                className="absolute transition-all duration-300 animate-fade-in"
                style={{ 
                  left: `${poop.x}%`, 
                  top: `${poop.y}%`, 
                  transform: 'translate(-50%, -100%)' 
                }}
              >
                <div className="text-base sm:text-lg md:text-xl drop-shadow-md">💩</div>
              </div>
            ))}
          </div>
        )}
        {/* Trampoline displayed under bunny when bouncing */}
        {isTrampolineBouncing && currentPet === 'bunny' && (
          <div 
            className="absolute z-[9]"
            style={{ 
              left: `${bunnyState.position.x}%`, 
              top: `${bunnyState.position.y + 2}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <TrampolineSVG large />
          </div>
        )}
        
        {/* Pet - anchor at feet (bottom-center) for bunny, center for fish */}
        {/* When playing with balloon, bunny floats up! When on trampoline, bunny bounces! */}
        <div 
          className={`absolute z-10 transition-all ease-out ${
            currentPet === 'bunny' && bunnyState.isHopping ? 'duration-600' : 'duration-700'
          } ${currentPet === 'bunny' && bunnyState.action === 'playing' && selectedToy.id === 'balloon' ? 'animate-balloon-float' : ''} ${
            isTrampolineBouncing ? 'animate-trampoline-bounce' : ''
          }`}
          style={{ 
            left: `${currentPet === 'bunny' ? bunnyState.position.x : fishState.position.x}%`, 
            top: `${currentPet === 'bunny' ? (
              bunnyState.action === 'playing' && selectedToy.id === 'balloon' ? bunnyState.position.y - 25 : 
              isTrampolineBouncing ? bunnyState.position.y - 8 : 
              bunnyState.position.y
            ) : fishState.position.y}%`,
            transform: currentPet === 'bunny' ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)'
          }}
        >
          <div className={`relative ${
            currentPet === 'fish' ? 'animate-swim' : ''
          } ${
            currentPet === 'bunny' && bunnyState.isHopping && !isTrampolineBouncing ? 'animate-hop' : ''
          } ${
            currentPet === 'bunny' && bunnyState.idleBehavior === 'sniffing' ? 'animate-sniff' : ''
          } ${
            currentPet === 'bunny' && bunnyState.idleBehavior === 'ear-scratch' ? 'animate-ear-scratch' : ''
          } ${
            currentPet === 'bunny' && bunnyState.idleBehavior === 'nibbling' ? 'animate-nibble' : ''
          } ${
            currentPet === 'bunny' && bunnyState.idleBehavior === 'looking' ? 'animate-look-around' : ''
          } ${
            (currentPet === 'bunny' && bunnyState.action === 'playing' && !isTrampolineBouncing) ||
            (currentPet === 'fish' && fishState.action === 'playing')
              ? 'animate-wiggle' : ''
          }`}>
            {/* Pet Image - scaled to fit room */}
            <img 
              src={currentPet === 'bunny' ? getBunnyImage() : getFishImage()}
              alt={currentPet === 'bunny' ? 'Lola the bunny' : 'Goldie the fish'}
              className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-2xl transition-all duration-500 ${
                bunnyState.action === 'eating' || bunnyState.action === 'drinking' ? 'scale-110' : ''
              } ${bunnyState.isNapping ? 'scale-75 rounded-full' : ''} ${currentPet === 'bunny' ? 'saturate-[0.95] contrast-[1.05]' : ''}`}
              style={{
                filter: 'drop-shadow(0 4px 8px hsl(var(--foreground) / 0.25))',
                transform: `${currentPet === 'bunny' && !bunnyState.facingRight ? 'scaleX(-1)' : 'scaleX(1)'} ${bunnyState.isNapping ? 'rotate(15deg) scaleY(0.7)' : ''}`
              }}
            />
            
            {/* Idle behavior indicators */}
            {currentPet === 'bunny' && bunnyState.idleBehavior !== 'none' && bunnyState.action === 'idle' && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-base animate-bounce-slow">
                {bunnyState.idleBehavior === 'sniffing' && '👃'}
                {bunnyState.idleBehavior === 'ear-scratch' && '✋'}
                {bunnyState.idleBehavior === 'nibbling' && '🌿'}
                {bunnyState.idleBehavior === 'looking' && '👀'}
              </div>
            )}
            
            {/* Speech Bubbles */}
            {(bunnyState.action !== 'idle' || fishState.action !== 'idle') && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card px-3 py-1.5 rounded-xl shadow-strong border-2 border-primary animate-bounce-slow whitespace-nowrap">
                <span className="text-sm font-bold">
                  {currentPet === 'bunny' && bunnyState.action === 'eating' && '🥕 Nom nom!'}
                  {currentPet === 'bunny' && bunnyState.action === 'drinking' && '💧 Gulp gulp!'}
                  {currentPet === 'bunny' && bunnyState.action === 'playing' && `${selectedToy.emoji || '🎪'} Wheee!`}
                  {currentPet === 'bunny' && bunnyState.action === 'napping' && '💤 Zzz...'}
                  {currentPet === 'fish' && fishState.action === 'eating' && '😋 Yummy!'}
                  {currentPet === 'fish' && fishState.action === 'playing' && '💫 Splash!'}
                </span>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-b-2 border-r-2 border-primary rotate-45" />
              </div>
            )}

            {/* Mood Indicator */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg">
              {currentPet === 'bunny' && (
                bunnyState.mood === 'happy' ? '💕' : 
                bunnyState.mood === 'sad' ? '💔' : '💭'
              )}
              {currentPet === 'fish' && (
                fishState.mood === 'happy' ? '✨' : 
                fishState.mood === 'sad' ? '💔' : '💤'
              )}
            </div>
          </div>
        </div>

        {/* Toy Selection Menu - Right Side - Scrollable Loop */}
        {currentPet === 'bunny' && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col bg-card/90 backdrop-blur-sm rounded-xl p-2 shadow-strong border-2 border-primary/30 max-h-[60vh]">
            <div className="text-xs font-bold text-center text-muted-foreground uppercase mb-1">Toys</div>
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent flex flex-col gap-2 pr-1" style={{ maxHeight: 'calc(60vh - 40px)' }}>
              {/* Triple the toys for infinite scroll illusion */}
              {[...availableToys, ...availableToys, ...availableToys].map((toy, idx) => (
                <button
                  key={`${toy.id}-${idx}`}
                  onClick={() => setSelectedToy(toy)}
                  disabled={gameState.locked || bunnyState.action !== 'idle'}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 min-w-[50px] ${
                    selectedToy.id === toy.id 
                      ? 'bg-primary text-primary-foreground scale-110 shadow-md' 
                      : 'bg-muted/50 hover:bg-muted text-foreground hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={`${toy.name} (⚡-${toy.energyCost} 😊+${toy.happinessBoost})`}
                >
                  {toy.component ? (
                    <div className="w-6 h-4 flex items-center justify-center">
                      <svg width="24" height="12" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="24" cy="12" rx="20" ry="4" stroke="currentColor" strokeWidth="3"/>
                        <path d="M6 24L10 12M42 24L38 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  ) : (
                    <span className="text-xl">{toy.emoji}</span>
                  )}
                  <span className="text-[10px] font-medium leading-tight">{toy.name}</span>
                  <span className="text-[9px] text-muted-foreground">⚡{toy.energyCost}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Foreground matte so the bunny feels "in" the scene */}
        {currentPet === 'bunny' && (
          <div
            className={`absolute inset-x-0 bottom-0 z-20 h-28 sm:h-32 pointer-events-none ${
              currentScene === 'park'
                ? 'bg-gradient-to-t from-park-path/45 via-park-grass/15 to-transparent'
                : currentScene === 'room'
                ? 'bg-gradient-to-t from-room-floor/55 via-room-floor/15 to-transparent'
                : 'bg-gradient-to-t from-habitat-ground/55 via-habitat-grass/15 to-transparent'
            }`}
          />
        )}
      </main>

      {/* Controls Panel */}
      <footer className="bg-card border-t-4 border-primary p-4 shadow-strong">
        {/* Status Bars */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {currentPet === 'bunny' ? (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🥕</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Hunger</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.hunger)}`} 
                    style={{ width: `${bunnyState.hunger}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💧</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Water</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.hydration)}`} 
                    style={{ width: `${bunnyState.hydration}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">😊</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Happy</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.happiness)}`} 
                    style={{ width: `${bunnyState.happiness}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⚡</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Energy</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.energy)}`} 
                    style={{ width: `${bunnyState.energy}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">😴</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Rest</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.rest)}`} 
                    style={{ width: `${bunnyState.rest}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">✨</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Clean</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.cleanliness)}`} 
                    style={{ width: `${bunnyState.cleanliness}%` }} 
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍽️</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Hunger</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(fishState.hunger)}`} 
                    style={{ width: `${fishState.hunger}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">😊</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Happy</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(fishState.happiness)}`} 
                    style={{ width: `${fishState.happiness}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🧽</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Clean</span>
                </div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(fishState.tankCleanliness)}`} 
                    style={{ width: `${fishState.tankCleanliness}%` }} 
                  />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-4xl">
                  {fishState.mood === 'happy' ? '🐠✨' : fishState.mood === 'sad' ? '🐠😢' : '🐠💤'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button 
            onClick={feedPet} 
            disabled={gameState.locked || (currentPet === 'bunny' ? bunnyState.action !== 'idle' : fishState.action !== 'idle')} 
            className="pet-button-feed"
          >
            🥕 Feed
          </button>
          {currentPet === 'bunny' ? (
            <button 
              onClick={waterBunny} 
              disabled={gameState.locked || bunnyState.action !== 'idle'} 
              className="pet-button-water"
            >
              💧 Water
            </button>
          ) : (
            <button 
              onClick={cleanHabitat} 
              disabled={gameState.locked} 
              className="pet-button-clean"
            >
              🧽 Clean Tank
            </button>
          )}
          <button 
            onClick={() => playWithToy(selectedToy)} 
            disabled={gameState.locked || (currentPet === 'bunny' ? bunnyState.action !== 'idle' : fishState.action !== 'idle')} 
            className="pet-button-play"
          >
            {selectedToy.emoji} Play
          </button>
          {currentPet === 'bunny' && (
            <button 
              onClick={takeNap} 
              disabled={gameState.locked || bunnyState.action !== 'idle' || currentScene !== 'room' || bunnyState.isNapping} 
              className={`pet-button-play ${currentScene !== 'room' ? 'opacity-50' : ''}`}
              title={currentScene !== 'room' ? 'Nap only available in Room' : 'Take a nap'}
            >
              😴 Nap {currentScene !== 'room' && '🔒'}
            </button>
          )}
          {currentPet === 'bunny' && (
            <button 
              onClick={cleanHabitat} 
              disabled={gameState.locked || poops.length === 0} 
              className="pet-button-clean"
            >
              🧹 Clean {poops.length > 0 && `(${poops.length})`}
            </button>
          )}
          <div className="flex items-center justify-center text-3xl font-bold">
            {currentPet === 'bunny' 
              ? (bunnyState.isNapping ? '🐰💤' : bunnyState.mood === 'happy' ? '🐰💕' : bunnyState.mood === 'sad' ? '🐰😢' : '🐰')
              : (fishState.mood === 'happy' ? '🐠💕' : fishState.mood === 'sad' ? '🐠😢' : '🐠')
            }
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClassroomPets;
