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
import habitatIndoorCouch from '@/assets/habitat-indoor-couch.png';
import habitatTank from '@/assets/habitat-tank.png';
import habitatPark from '@/assets/habitat-park.png';
import habitatRoom from '@/assets/habitat-room.png';
import habitatLofiCouch from '@/assets/habitat-lofi-couch.png';

// Animated video backgrounds
import lofiRoomBg from '@/assets/lofi-room-couch.mp4';
import lofiBedroomBg from '@/assets/lofi-bedroom.mp4';

const ClassroomPets = () => {
  const { signOut, user } = useAuth();
  const [currentPet, setCurrentPet] = useState('bunny');
  const [currentScene, setCurrentScene] = useState('habitat');
  
  // Sound effects
  const {
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
  } = useSoundEffects();
  const prevHoppingRef = useRef(false);

  // Hanging plants react to wind audio (0..1) with a gentle baseline.
  const plantStrength = Math.min(1, (isAmbientPlaying ? 0.3 : 0.1) + windIntensity * 1.0);
  const plantSwayDeg = 2 + plantStrength * 6; // degrees
  const plantDuration = 5.5 - plantStrength * 2.0; // seconds


  // Couch zones for the habitat scene (couch on right side of screen)
  // Tight bounds to prevent Lola from "stepping off" the couch in this cropped video.
  const couchZones = {
    seat: { xMin: 66, xMax: 94, y: 78 },    // Seat cushions
    back: { xMin: 66, xMax: 94, y: 64 },    // Back cushions
  };
  
  // Bed zones for the room/bedroom scene (bed centered-left in video)
  const bedZones = {
    seat: { xMin: 20, xMax: 55, y: 75 },    // Bed surface
    back: { xMin: 20, xMax: 55, y: 62 },    // Pillows area
  };
  
  // Track which couch zone Lola is on
  const [currentCouchZone, setCurrentCouchZone] = useState<'seat' | 'back'>('seat');
  
  // Get the active zones based on current scene
  const getActiveZones = () => {
    if (currentScene === 'room') return bedZones;
    return couchZones;
  };

  // Get ground Y position based on current scene
  const getGroundY = (scene: string) => {
    if (scene === 'park') return 78;
    if (scene === 'room') return bedZones[currentCouchZone].y;
    return couchZones[currentCouchZone].y; // habitat uses couch zones
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
    position: { x: 65, y: 88 },  // Start on couch seat cushion
    targetObject: null as null | 'food-bowl' | 'water-bowl' | 'toy-area',
    isHopping: false,
    facingRight: true,
    isNapping: false
  });
  
  // Update bunny position when scene or couch zone changes
  useEffect(() => {
    if (currentPet === 'bunny') {
      const isOnCouch = currentScene === 'habitat' || currentScene === 'room';
      if (isOnCouch) {
        const zone = getActiveZones()[currentCouchZone];
        setBunnyState(prev => ({
          ...prev,
          position: { 
            x: Math.max(zone.xMin, Math.min(zone.xMax, prev.position.x)), 
            y: zone.y 
          }
        }));
      } else {
        setBunnyState(prev => ({
          ...prev,
          position: { x: prev.position.x, y: getGroundY(currentScene) }
        }));
      }
    }
  }, [currentScene, currentPet, currentCouchZone]);

  // Poop positions in the habitat
  const [poops, setPoops] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Get toy scale based on scene
  const getToyScale = () => {
    if (currentScene === 'room') return 0.5;
    if (currentScene === 'park') return 0.7;
    return 1; // habitat
  };
  
  const toyScale = getToyScale();

  // Modern trampoline SVG component
  const TrampolineSVG = ({ large = false }: { large?: boolean }) => {
    const baseW = large ? 80 : 48;
    const baseH = large ? 40 : 24;
    return (
    <svg 
      width={baseW * toyScale} 
      height={baseH * toyScale} 
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
  )};

  // Hollow tree trunk SVG component - horizontal with transparent front
  const HollowTreeTrunkSVG = ({ large = false }: { large?: boolean }) => {
    const baseW = large ? 120 : 60;
    const baseH = large ? 50 : 25;
    return (
    <svg 
      width={baseW * toyScale} 
      height={baseH * toyScale} 
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
  )};

  // Trampoline bounce state
  const [trampolineBounceCount, setTrampolineBounceCount] = useState(0);
  const [isTrampolineBouncing, setIsTrampolineBouncing] = useState(false);
  
  // Tunnel hop-through state
  const [isHoppingThroughTunnel, setIsHoppingThroughTunnel] = useState(false);

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

  // Bowl station position and toy position - toys now placed on couch
  const bowlStationPosition = { x: 15, y: 96 };
  
  // Toy area position dynamically follows current zone (couch or bed)
  const activeZones = getActiveZones();
  const toyAreaPosition = {
    x: activeZones[currentCouchZone].xMin + 12,
    y: activeZones[currentCouchZone].y + 4
  };
  
  const envObjects = {
    'food-bowl': { x: 13, y: 94 },
    'water-bowl': { x: 19, y: 94 },
    'toy-area': toyAreaPosition,
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
    }, 3000);
    return () => clearInterval(interval);
  }, [currentPet, currentScene]);

  // Play hop sound when bunny starts hopping
  useEffect(() => {
    if (bunnyState.isHopping && !prevHoppingRef.current) {
      playHop();
    }
    prevHoppingRef.current = bunnyState.isHopping;
  }, [bunnyState.isHopping, playHop]);

  // Bunny occasionally poops - constrained to couch zones, near Lola's position
  useEffect(() => {
    if (currentPet !== 'bunny') return;
    const poopInterval = setInterval(() => {
      // Random chance to poop (higher when recently fed)
      if (Math.random() < 0.3 && poops.length < 5) {
        // Poop appears on the couch near where Lola currently is
        const zone = getActiveZones()[currentCouchZone];
        // Clamp poop near Lola's X position with small random offset
        const poopX = Math.max(
          zone.xMin,
          Math.min(zone.xMax, bunnyState.position.x + (Math.random() - 0.5) * 10)
        );
        const newPoop = {
          id: Date.now(),
          x: poopX,
          y: zone.y + 6 // Just below the cushion surface
        };
        setPoops(prev => [...prev, newPoop]);
        setBunnyState(prev => ({
          ...prev,
          cleanliness: Math.max(0, prev.cleanliness - 10)
        }));
        playPoop();
      }
    }, 12000);
    return () => clearInterval(poopInterval);
  }, [currentPet, poops.length, playPoop, currentCouchZone, bunnyState.position.x]);

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

  // Auto-move bunny with hopping to objects or idle wandering on couch
  useEffect(() => {
    if (currentPet !== 'bunny' || bunnyState.action !== 'idle') return;
    
    // For habitat/room scenes, use couch zones
    const isOnCouch = currentScene === 'habitat' || currentScene === 'room';
    
    const moveInterval = setInterval(() => {
      // If bunny has a target object, hop towards it (clamped to couch when needed)
      if (bunnyState.targetObject) {
        const rawTarget = envObjects[bunnyState.targetObject];
        const zone = getActiveZones()[currentCouchZone];

        const target = isOnCouch
          ? {
              x: Math.max(zone.xMin, Math.min(zone.xMax, rawTarget.x)),
              y: zone.y,
            }
          : rawTarget;

        const movingRight = target.x > bunnyState.position.x;

        setBunnyState((prev) => ({ ...prev, isHopping: true, facingRight: movingRight }));

        setTimeout(() => {
          setBunnyState((prev) => ({
            ...prev,
            isHopping: false,
            position: { x: target.x, y: target.y },
          }));
        }, 600);
        return;
      }
      
      if (isOnCouch) {
        // 20% chance to hop between seat and back cushions
        if (Math.random() < 0.2) {
          const newZone = currentCouchZone === 'seat' ? 'back' : 'seat';
          const targetY = getActiveZones()[newZone].y;
          const currentZoneData = getActiveZones()[currentCouchZone];
          
          // Small horizontal movement while changing zones
          const deltaX = (Math.random() - 0.5) * 8;
          const newX = Math.max(currentZoneData.xMin, Math.min(currentZoneData.xMax, bunnyState.position.x + deltaX));
          const movingRight = deltaX > 0;
          
          setBunnyState(prev => ({ ...prev, isHopping: true, facingRight: movingRight }));
          setCurrentCouchZone(newZone);
          
          setTimeout(() => {
            setBunnyState(prev => ({
              ...prev,
              isHopping: false,
              position: { x: newX, y: targetY }
            }));
          }, 600);
          return;
        }
        
        // Regular horizontal movement within current zone
        const zone = getActiveZones()[currentCouchZone];
        const deltaX = (Math.random() - 0.5) * 10;
        const newX = Math.max(zone.xMin, Math.min(zone.xMax, bunnyState.position.x + deltaX));
        const movingRight = deltaX > 0;
        
        setBunnyState(prev => ({ ...prev, isHopping: true, facingRight: movingRight }));
        
        setTimeout(() => {
          setBunnyState(prev => ({
            ...prev,
            isHopping: false,
            position: { x: newX, y: zone.y }
          }));
        }, 600);
      } else {
        // Park scene - original behavior
        const ground = { min: 75, max: 82 };
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
      }
    }, 3750);
    return () => clearInterval(moveInterval);
  }, [currentPet, bunnyState.action, bunnyState.position.x, bunnyState.position.y, bunnyState.targetObject, currentScene, currentCouchZone]);

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
    }, 6000);
    
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
      
      // Special handling for tunnel - bunny hops through it
      if (toy.id === 'tunnel') {
        setIsHoppingThroughTunnel(true);
        setBunnyState(prev => ({ ...prev, action: 'playing', targetObject: null, facingRight: true }));
        
        // Bunny hops to the left side, goes through, emerges on right
        const tunnelLeftX = 55;
        const tunnelRightX = 75;
        
        // Move to left entrance
        setBunnyState(prev => ({ ...prev, position: { x: tunnelLeftX, y: prev.position.y }, isHopping: true }));
        playHop();
        
        // After a moment, bunny goes "inside" (we'll fade/hide briefly)
        setTimeout(() => {
          setBunnyState(prev => ({ ...prev, isHopping: false }));
        }, 400);
        
        // Emerge from right side
        setTimeout(() => {
          playHop();
          setBunnyState(prev => ({ ...prev, position: { x: tunnelRightX, y: prev.position.y }, isHopping: true }));
        }, 1200);
        
        setTimeout(() => {
          setBunnyState(prev => ({ ...prev, isHopping: false, action: 'idle' }));
          setIsHoppingThroughTunnel(false);
        }, 1800);
        
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

      const playDelayMs = toy.id === 'hayPile' ? 300 : 800;

      setTimeout(() => {
        // Play hay sound for hay pile, otherwise normal play sound
        if (toy.id === 'hayPile') {
          playHay();

          // Hatch birds faster (one at a time in quick sequence)
          const hatchCount = Math.min(eggsRemaining, 3);
          for (let i = 0; i < hatchCount; i++) {
            setTimeout(() => {
              const birdId = Date.now() + i;
              setFlyingBirds((prev) => [...prev, { id: birdId, startX: 65, startY: 85 }]);
              setEggsRemaining((prev) => Math.max(0, prev - 1));
              // Play flutter sound when each bird hatches and flies away
              playFlutter();

              // Remove bird after animation
              setTimeout(() => {
                setFlyingBirds((prev) => prev.filter((b) => b.id !== birdId));
              }, 2200);
            }, i * 650);
          }

          // Reset eggs sooner after all have flown
          if (hatchCount > 0 && hatchCount === eggsRemaining) {
            setTimeout(() => setEggsRemaining(3), 2600);
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
      }, playDelayMs);
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
    <div className="w-full min-h-[100dvh] bg-background flex flex-col overflow-y-auto">
      {/* Header - Same size as toy menu */}
      <header className="shrink-0 bg-card/90 backdrop-blur-sm shadow-strong px-2 py-2 flex justify-between items-center z-10 border-b-2 border-primary/30 rounded-b-xl mx-1">
        <div className="flex gap-1 items-center">
          <h1 className="text-sm font-extrabold text-foreground">🐰 Lola</h1>
          <button 
            onClick={() => setGameState(prev => ({ ...prev, locked: !prev.locked }))} 
            className={`p-2 rounded-lg transition-colors ${gameState.locked ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}
            title={gameState.locked ? 'Unlock controls' : 'Lock controls'}
          >
            {gameState.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button 
            onClick={resetPet} 
            className="p-2 rounded-lg bg-secondary/20 text-secondary transition-colors hover:bg-secondary/30"
            title="Reset pet"
          >
            <RotateCcw size={14} />
          </button>
          <button 
            onClick={toggleAmbient} 
            className={`p-2 rounded-lg transition-colors ${isAmbientPlaying ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
            title={isAmbientPlaying ? 'Mute sounds' : 'Play ambient sounds'}
          >
            {isAmbientPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {gameState.notifications.length > 0 && (
            <div className="flex gap-1">
              {gameState.notifications.slice(0, 2).map((notif, i) => (
                <div key={i} className="text-[10px] bg-warning/20 text-warning px-1.5 py-1 rounded-lg">{notif}</div>
              ))}
            </div>
          )}
          <button 
            onClick={signOut}
            className="p-2 rounded-lg bg-muted hover:bg-destructive/20 hover:text-destructive transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Pet/Scene Selector - Same size as toy menu */}
      <nav className="shrink-0 flex gap-1 px-2 py-2 mx-1 bg-card/90 backdrop-blur-sm border-2 border-primary/30 rounded-xl">
        <button 
          onClick={() => setCurrentPet('bunny')} 
          className={`p-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${currentPet === 'bunny' ? 'bg-primary text-primary-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
        >
          🐰
          <span className="text-sm">
            {((bunnyState.hunger + bunnyState.hydration + bunnyState.happiness + bunnyState.energy + bunnyState.rest + bunnyState.cleanliness) / 6) > 50 ? '💕' : '💔'}
          </span>
        </button>
        <button 
          onClick={() => { setCurrentPet('fish'); setCurrentScene('tank'); }} 
          className={`p-2 rounded-lg font-medium transition-all duration-200 ${currentPet === 'fish' ? 'bg-secondary text-secondary-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
        >
          🐠
        </button>
        
        <div className="w-px bg-border mx-1" />
        
        {currentPet === 'bunny' && (
          <>
            <button 
              onClick={() => setCurrentScene('habitat')} 
              className={`p-2 rounded-lg font-medium transition-all duration-200 ${currentScene === 'habitat' ? 'bg-primary text-primary-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
            >
              🏠
            </button>
            <button 
              onClick={() => setCurrentScene('room')} 
              className={`p-2 rounded-lg font-medium transition-all duration-200 ${currentScene === 'room' ? 'bg-accent text-accent-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
            >
              🛋️
            </button>
            <button 
              onClick={() => setCurrentScene('park')} 
              className={`p-2 rounded-lg font-medium transition-all duration-200 ${currentScene === 'park' ? 'bg-success text-success-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
            >
              🌳
            </button>
          </>
        )}
      </nav>

      {/* Main Scene */}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        {/* Background based on pet/scene */}
        {currentPet !== 'fish' && currentScene === 'habitat' && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Animated video background for immersive scene */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
                transform: 'scale(1.2)',
                transformOrigin: 'right center',
              }}
            >
              <source src={lofiRoomBg} type="video/mp4" />
            </video>
            {/* Cozy warm overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          </div>
        )}

        {/* Breeze/wind particles */}
        {currentPet !== 'fish' && currentScene === 'habitat' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
            {[...Array(6)].map((_, i) => (
              <div
                key={`breeze-${i}`}
                className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-foreground/8 to-transparent rounded-full"
                style={{
                  top: `${20 + (i * 12)}%`,
                  left: '-10%',
                  animation: `breeze ${5 + i * 0.6}s ease-in-out infinite`,
                  animationDelay: `${i * 1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Room scene - cozy bedroom with animated video */}
        {currentPet !== 'fish' && currentScene === 'room' && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
                transform: 'scale(1.2)',
                transformOrigin: 'right center',
              }}
            >
              <source src={lofiBedroomBg} type="video/mp4" />
            </video>
            {/* Cozy warm overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            
            {/* Flickering lamp glow */}
            <div 
              className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full bg-gradient-radial from-amber-400/40 via-orange-300/20 to-transparent blur-2xl animate-flicker-glow pointer-events-none"
            />
            <div 
              className="absolute top-[25%] left-[18%] w-20 h-20 rounded-full bg-amber-300/30 blur-xl animate-flicker-glow pointer-events-none"
              style={{ animationDelay: '0.5s' }}
            />
            
            {/* Floating sparkles */}
            {[...Array(15)].map((_, i) => (
              <div
                key={`sparkle-${i}`}
                className="absolute animate-sparkle-float pointer-events-none z-10"
                style={{
                  left: `${10 + (i * 6)}%`,
                  top: `${20 + (i % 5) * 15}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${4 + (i % 3) * 2}s`,
                }}
              >
                <span className="text-amber-200/40 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]" style={{ fontSize: `${10 + (i % 4) * 4}px` }}>✦</span>
              </div>
            ))}
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
                  // Nest with visible blue eggs
                  <div className="relative">
                    <div className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">🪺</div>
                    {/* Blue eggs on top of nest */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {[...Array(eggsRemaining)].map((_, i) => (
                        <svg
                          key={i}
                          width="14"
                          height="12"
                          viewBox="0 0 14 12"
                          className="animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        >
                          <defs>
                            <linearGradient id={`egg-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.95" />
                              <stop offset="1" stopColor="hsl(var(--secondary))" stopOpacity="0.7" />
                            </linearGradient>
                          </defs>
                          <ellipse cx="7" cy="6" rx="5" ry="4.5" fill={`url(#egg-${i})`} />
                          <ellipse cx="5" cy="4" rx="2" ry="1.5" fill="hsl(var(--background))" opacity="0.22" />
                        </svg>
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
            className="absolute z-[11]"
            style={{ 
              left: `${bunnyState.position.x}%`, 
              top: `${bunnyState.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <TrampolineSVG large />
          </div>
        )}
        
        {/* Pet - anchor at feet (bottom-center) for bunny, center for fish */}
        {/* When playing with balloon, bunny floats up hanging from the string! */}
        <div 
          className={`absolute z-10 transition-all ease-out ${
            currentPet === 'bunny' && bunnyState.isHopping ? 'duration-600' : 'duration-700'
          } ${currentPet === 'bunny' && bunnyState.action === 'playing' && selectedToy.id === 'balloon' ? 'animate-balloon-float' : ''} ${
            isTrampolineBouncing ? 'animate-trampoline-bounce' : ''
          } ${isHoppingThroughTunnel && bunnyState.position.x > 58 && bunnyState.position.x < 72 ? 'opacity-0' : 'opacity-100'}`}
          style={{ 
            left: `${currentPet === 'bunny' ? bunnyState.position.x : fishState.position.x}%`, 
            top: `${currentPet === 'bunny' ? (
              bunnyState.action === 'playing' && selectedToy.id === 'balloon' ? bunnyState.position.y - 30 : 
              isTrampolineBouncing ? bunnyState.position.y - 2 : 
              bunnyState.position.y
            ) : fishState.position.y}%`,
            transform: currentPet === 'bunny' ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
            transition: isHoppingThroughTunnel ? 'left 0.6s ease-out, top 0.6s ease-out, opacity 0.2s ease-out' : undefined
          }}
        >
          {/* Balloon with string above bunny when playing */}
          {currentPet === 'bunny' && bunnyState.action === 'playing' && selectedToy.id === 'balloon' && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 flex flex-col items-center animate-balloon-sway">
              {/* Balloon */}
              <div className="text-4xl sm:text-5xl md:text-6xl drop-shadow-lg">🎈</div>
              {/* String connecting balloon to bunny's paws */}
              <svg className="w-3 h-16 sm:h-20" viewBox="0 0 12 80" preserveAspectRatio="none">
                <path 
                  d="M6 0 Q9 20 3 40 Q9 60 6 80" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth="1.5" 
                  fill="none"
                  className="animate-string-wave"
                />
              </svg>
            </div>
          )}
          
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
            (currentPet === 'bunny' && bunnyState.action === 'playing' && !isTrampolineBouncing && selectedToy.id !== 'balloon') ||
            (currentPet === 'fish' && fishState.action === 'playing')
              ? 'animate-wiggle' : ''
          }`}>
            {/* Pet Image - scaled to fit room */}
            <img 
              src={currentPet === 'bunny' ? getBunnyImage() : getFishImage()}
              alt={currentPet === 'bunny' ? 'Lola the bunny' : 'Goldie the fish'}
              className={`object-contain drop-shadow-2xl transition-all duration-500 ${
                currentScene === 'room'
                  ? 'w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32'
                  : currentScene === 'habitat'
                  ? 'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36'
                  : 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20'
              } ${
                bunnyState.action === 'eating' || bunnyState.action === 'drinking' ? 'scale-110' : ''
              } ${currentPet === 'bunny' ? 'saturate-[0.95] contrast-[1.05]' : ''}`}
              style={{
                filter: 'drop-shadow(0 4px 8px hsl(var(--foreground) / 0.25))',
                transform: `${
                  currentPet === 'bunny' && !bunnyState.facingRight ? 'scaleX(-1)' : 'scaleX(1)'
                } ${
                  bunnyState.isNapping
                    ? 'rotate(80deg) scaleY(0.85) translateX(-25%) translateY(10%)'
                    : bunnyState.action === 'playing' && selectedToy.id === 'balloon'
                    ? 'rotate(-5deg) translateY(-5%)'
                    : ''
                }`,
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
            
            {/* Sleep Z's and Dream Bubbles - alternating */}
            {currentPet === 'bunny' && bunnyState.isNapping && (
              <div className="relative">
                {/* Floating Z's - visible first 4s, hidden next 4s */}
                <div className="animate-sleep-cycle-zs">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={`z-${i}`}
                      className="absolute -top-4 left-1/2 text-amber-200 font-bold animate-sleep-z"
                      style={{
                        animationDelay: `${i * 0.7}s`,
                        animationIterationCount: 'infinite',
                        fontSize: `${14 + i * 4}px`,
                        marginLeft: `${i * 8}px`,
                      }}
                    >
                      Z
                    </div>
                  ))}
                </div>
                
                {/* Dream bubble - hidden first 4s, visible next 4s */}
                <div className="animate-sleep-cycle-dreams">
                  <div 
                    className="absolute -top-16 -right-8 animate-dream-bubble"
                  >
                    <div className="relative bg-white/90 rounded-full p-2 shadow-lg">
                      <span className="text-2xl">🥕</span>
                      {/* Bubble trail */}
                      <div className="absolute -bottom-2 -left-1 w-2 h-2 bg-white/80 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Speech Bubbles */}
            {(bunnyState.action !== 'idle' || fishState.action !== 'idle') && !bunnyState.isNapping && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card px-3 py-1.5 rounded-xl shadow-strong border-2 border-primary animate-bounce-slow whitespace-nowrap">
                <span className="text-sm font-bold">
                  {currentPet === 'bunny' && bunnyState.action === 'eating' && '🥕 Nom nom!'}
                  {currentPet === 'bunny' && bunnyState.action === 'drinking' && '💧 Gulp gulp!'}
                  {currentPet === 'bunny' && bunnyState.action === 'playing' && `${selectedToy.emoji || '🎪'} Wheee!`}
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

      {/* Controls Panel - Same size as toy menu */}
      <footer className="shrink-0 bg-card/90 backdrop-blur-sm border-2 border-primary/30 mx-1 px-2 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-strong rounded-xl">
        {/* Status Bars - 2 rows of 3 on mobile */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pb-0.5">
          {currentPet === 'bunny' ? (
            <>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">🥕</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(bunnyState.hunger)}`} style={{ width: `${bunnyState.hunger}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">💧</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(bunnyState.hydration)}`} style={{ width: `${bunnyState.hydration}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">❤️</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(bunnyState.happiness)}`} style={{ width: `${bunnyState.happiness}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">⚡</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(bunnyState.energy)}`} style={{ width: `${bunnyState.energy}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">😴</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(bunnyState.rest)}`} style={{ width: `${bunnyState.rest}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">✨</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(bunnyState.cleanliness)}`} style={{ width: `${bunnyState.cleanliness}%` }} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">🍽️</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(fishState.hunger)}`} style={{ width: `${fishState.hunger}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">❤️</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(fishState.happiness)}`} style={{ width: `${fishState.happiness}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center bg-muted/30 rounded-lg p-1">
                <span className="text-sm leading-none">🧽</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(fishState.tankCleanliness)}`} style={{ width: `${fishState.tankCleanliness}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - Same size as toy menu */}
        <div className="mt-3 flex flex-nowrap gap-6 sm:gap-8 overflow-x-auto pb-2 justify-center px-3">
          <button
            onClick={feedPet}
            disabled={gameState.locked || (currentPet === 'bunny' ? bunnyState.action !== 'idle' : fishState.action !== 'idle')}
            className="pet-button-feed w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl"
          >
            <span className="leading-none">🥕</span>
            <span className="text-[9px] font-medium leading-none">Feed</span>
          </button>
          {currentPet === 'bunny' ? (
            <button
              onClick={waterBunny}
              disabled={gameState.locked || bunnyState.action !== 'idle'}
              className="pet-button-water w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl"
            >
              <span className="leading-none">💧</span>
              <span className="text-[9px] font-medium leading-none">Water</span>
            </button>
          ) : (
            <button
              onClick={cleanHabitat}
              disabled={gameState.locked}
              className="pet-button-clean w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl"
            >
              <span className="leading-none">🧽</span>
              <span className="text-[9px] font-medium leading-none">Clean</span>
            </button>
          )}
          <button
            onClick={() => playWithToy(selectedToy)}
            disabled={gameState.locked || (currentPet === 'bunny' ? bunnyState.action !== 'idle' : fishState.action !== 'idle')}
            className="pet-button-play w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl"
          >
            <span className="leading-none">{selectedToy.emoji || '🎪'}</span>
            <span className="text-[9px] font-medium leading-none">Play</span>
          </button>
          {currentPet === 'bunny' && (
            <button
              onClick={takeNap}
              disabled={gameState.locked || bunnyState.action !== 'idle' || currentScene !== 'room' || bunnyState.isNapping}
              className={`pet-button-play w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl ${currentScene !== 'room' ? 'opacity-50' : ''}`}
              title={currentScene !== 'room' ? 'Nap only available in Room' : 'Take a nap'}
            >
              <span className="leading-none">😴</span>
              <span className="text-[9px] font-medium leading-none">Nap</span>
            </button>
          )}
          {currentPet === 'bunny' && (
            <button
              onClick={cleanHabitat}
              disabled={gameState.locked || poops.length === 0}
              className="pet-button-clean w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl"
            >
              <span className="flex items-center gap-0.5 leading-none">
                🧹{poops.length > 0 && <span className="text-xs">{poops.length}</span>}
              </span>
              <span className="text-[9px] font-medium leading-none">Clean</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ClassroomPets;
