import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { RotateCcw, Lock, Unlock, LogOut, Volume2, VolumeX, Bug } from 'lucide-react';
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
import bunnySleeping from '@/assets/bunny-sleeping.png';
import fishHappy from '@/assets/fish-happy.png';
import fishSad from '@/assets/fish-sad.png';
import fishEating from '@/assets/fish-eating.png';
import fishPlaying from '@/assets/fish-playing.png';

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
import lofiParkBg from '@/assets/lofi-park-wide.mp4';
import lofiTankBg from '@/assets/lofi-tank.mp4';
import lofiReefBg from '@/assets/lofi-reef.mp4';
import lofiCastleBg from '@/assets/lofi-castle.mp4';
import lofiShellBg from '@/assets/lofi-shell.mp4';

const ClassroomPets = () => {
  const { signOut, user } = useAuth();
  const [currentPet, setCurrentPet] = useState<'bunny' | 'fish'>(() => {
    const saved = localStorage.getItem('selectedPet');
    return saved === 'fish' ? 'fish' : 'bunny';
  });
  const [currentScene, setCurrentScene] = useState<'habitat' | 'room' | 'park' | 'reef' | 'castle' | 'shell'>(() => {
    const savedPet = localStorage.getItem('selectedPet');
    return savedPet === 'fish' ? 'reef' : 'habitat';
  });
  // Fish scene type for cleaner logic
  type FishScene = 'reef' | 'castle' | 'shell';
  const [showBoundsDebug, setShowBoundsDebug] = useState(false);

  const sceneRef = useRef<HTMLElement | null>(null);
  const bunnyImgRef = useRef<HTMLImageElement | null>(null);
  const toyMeasureRef = useRef<HTMLDivElement | null>(null);
  const [edgeClamp, setEdgeClamp] = useState({ bunnyHalfPct: 0, toyHalfPct: 0 });


  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isD = e.code === 'KeyD' || e.key === 'D' || e.key === 'd';
      if (e.shiftKey && isD) {
        e.preventDefault();
        setShowBoundsDebug((v) => !v);
      }
    };

    // Use capture to work even when focus is inside the preview/other elements.
    window.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  // HARD MUTE ALL MEDIA: guarantees that any video/audio elements never contribute sound.
  // This is separate from the WebAudio SFX engine.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLMediaElement>('audio, video');
    els.forEach((el) => {
      try {
        el.muted = true;
        (el as any).defaultMuted = true;
        el.volume = 0;
      } catch {
        // ignore
      }
    });
  }, [currentPet, currentScene]);

  // Create truly transparent fish sprites at runtime (removes baked-in white/checkerboard background)
  const [fishSpriteAlpha, setFishSpriteAlpha] = useState<{
    happy: string;
    sad: string;
    eating: string;
    playing: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Use higher feather and tolerance for fish sprites for smoother blending with underwater scenes
        const fishBgOptions = { tolerance: 50, feather: 45, sampleSize: 12 };
        const [happy, sad, eating, playing] = await Promise.all([
          removeSolidBackgroundToDataUrl(fishHappy, fishBgOptions),
          removeSolidBackgroundToDataUrl(fishSad, fishBgOptions),
          removeSolidBackgroundToDataUrl(fishEating, fishBgOptions),
          removeSolidBackgroundToDataUrl(fishPlaying, fishBgOptions),
        ]);

        if (!cancelled) {
          setFishSpriteAlpha({ happy, sad, eating, playing });
        }
      } catch {
        // If anything fails, we just fall back to original sprites.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);


  // Sound effects
  const {
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
  } = useSoundEffects(currentPet);
  const prevHoppingRef = useRef(false);

  // Hanging plants were previously driven by wind audio; wind ambience is disabled now.
  // Keep a gentle baseline sway so the scene still feels alive.
  const plantStrength = Math.min(1, 0.12 + windIntensity * 1.0);
  const plantSwayDeg = 2 + plantStrength * 6; // degrees
  const plantDuration = 5.5 - plantStrength * 2.0; // seconds


  // Couch zones for the habitat scene (couch on right side of screen)
  // Tight bounds to prevent Lola from "stepping off" the couch in this cropped video.
  const couchZones = {
    seat: { xMin: 62, xMax: 88, y: 75 },    // Seat cushions - adjusted to be more visible
    back: { xMin: 62, xMax: 88, y: 62 },    // Back cushions
  };
  
  // Bed Y calibration (persisted to localStorage)
  const [roomBedY, setRoomBedY] = useState<{ seat: number; back: number }>(() => {
    if (typeof window === 'undefined') return { seat: 71, back: 61 };
    try {
      const raw = window.localStorage.getItem('roomBedY');
      if (!raw) return { seat: 71, back: 61 };
      const parsed = JSON.parse(raw);
      const seat = Number(parsed?.seat);
      const back = Number(parsed?.back);
      return {
        seat: Number.isFinite(seat) ? seat : 71,
        back: Number.isFinite(back) ? back : 61,
      };
    } catch {
      return { seat: 71, back: 61 };
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('roomBedY', JSON.stringify(roomBedY));
    } catch {
      // ignore
    }
  }, [roomBedY]);

  // Bed zones for the room/bedroom scene
  // NOTE: y is the "ground" line (where paws sit) — set to the top edge where the bed shadow begins.
  const bedZones = {
    seat: { xMin: 20, xMax: 90, y: roomBedY.seat },
    back: { xMin: 20, xMax: 90, y: roomBedY.back },
  };
  
  // Park zones - interactive play areas with depth perception
  // Lower y = higher on screen = further away = smaller scale
  // Higher y = lower on screen = closer = larger scale
  const parkZones = {
    grass: { xMin: 35, xMax: 65, y: 84, scale: 1.0, label: '🌿 Grassy Field' },      // Foreground grass only - aligned to ground path
  };
  
  // Track which park zone Lola is in (only grass now)
  const [currentParkZone, setCurrentParkZone] = useState<'grass'>('grass');
  
  // Track which couch zone Lola is on
  const [currentCouchZone, setCurrentCouchZone] = useState<'seat' | 'back'>('seat');
  
  // Get the active zones based on current scene
  const getActiveZones = () => {
    if (currentScene === 'park') return parkZones;
    if (currentScene === 'room') return bedZones;
    return couchZones;
  };

  const [roomVisualPad, setRoomVisualPad] = useState<{ left: number; right: number }>(() => {
    if (typeof window === 'undefined') return { left: 18, right: 0 };
    try {
      const raw = window.localStorage.getItem('roomVisualPad');
      if (!raw) return { left: 18, right: 0 };
      const parsed = JSON.parse(raw);
      const left = Number(parsed?.left);
      const right = Number(parsed?.right);
      return {
        left: Number.isFinite(left) ? left : 18,
        right: Number.isFinite(right) ? right : 0,
      };
    } catch {
      return { left: 18, right: 0 };
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('roomVisualPad', JSON.stringify(roomVisualPad));
    } catch {
      // ignore
    }
  }, [roomVisualPad]);

  const clampZoneX = (
    zone: { xMin: number; xMax: number },
    x: number,
    extraPad?: { left?: number; right?: number }
  ) => {
    // Room bed has a prominent left footboard banister + right headboard post.
    // These pads are for the *sprite center point* (because we translate(-50%) when rendering).
    const baseLeftPad = currentScene === 'room' ? roomVisualPad.left : 0;
    const baseRightPad = currentScene === 'room' ? roomVisualPad.right : 0;

    const leftPad = baseLeftPad + (extraPad?.left ?? 0);
    const rightPad = baseRightPad + (extraPad?.right ?? 0);

    const min = zone.xMin + leftPad;
    const max = Math.max(min, zone.xMax - rightPad);
    return Math.max(min, Math.min(max, x));
  };

  // Clamp using the sprite's *visual half-width* so edges never cross the safe bounds.
  const clampZoneXWithHalfWidth = (
    zone: { xMin: number; xMax: number },
    x: number,
    halfWidthPct: number,
    extraPad?: { left?: number; right?: number }
  ) => {
    const base = clampZoneX(zone, x, extraPad);
    if (!halfWidthPct || halfWidthPct <= 0) return base;

    const baseMin = clampZoneX(zone, zone.xMin, extraPad);
    const baseMax = clampZoneX(zone, zone.xMax, extraPad);

    const min = baseMin + halfWidthPct;
    const max = baseMax - halfWidthPct;

    if (max <= min) return (min + max) / 2;
    return Math.max(min, Math.min(max, base));
  };

  // Get ground Y position based on current scene
  const getGroundY = (scene: string) => {
    if (scene === 'park') return parkZones[currentParkZone].y;
    if (scene === 'room') return bedZones[currentCouchZone].y;
    return couchZones[currentCouchZone].y; // habitat uses couch zones
  };
  
  // Get depth scale for park scene (smaller = further away)
  const getParkDepthScale = () => {
    if (currentScene !== 'park') return 1;
    return parkZones[currentParkZone].scale;
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
    position: { x: 75, y: 75 },  // Start on couch seat cushion (centered)
    targetObject: null as null | 'food-bowl' | 'water-bowl' | 'toy-area',
    isHopping: false,
    facingRight: true,
    isNapping: false
  });

  const bunnyStateRef = useRef(bunnyState);
  useEffect(() => {
    bunnyStateRef.current = bunnyState;
  }, [bunnyState]);

  // Update bunny position when scene or zone changes
  useEffect(() => {
    if (currentPet === 'bunny') {
      if (currentScene === 'park') {
        const zone = parkZones[currentParkZone];
        setBunnyState(prev => ({
          ...prev,
          position: {
            x: clampZoneX(zone, prev.position.x),
            y: zone.y
          }
        }));
      } else if (currentScene === 'habitat' || currentScene === 'room') {
        const zone = getActiveZones()[currentCouchZone];
        setBunnyState(prev => ({
          ...prev,
          position: {
            x: clampZoneX(zone, prev.position.x),
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
  }, [currentScene, currentPet, currentCouchZone, currentParkZone]);

  // Poop positions - store x and zone, compute y dynamically from roomBedY
  const [poops, setPoops] = useState<Array<{ id: number; x: number; zone: 'seat' | 'back' }>>([])
  const poopsRef = useRef(poops);
  useEffect(() => {
    poopsRef.current = poops;
  }, [poops]);

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
  const [yarnTanglePhase, setYarnTanglePhase] = useState<'none' | 'batting' | 'tangled' | 'free'>('none');

  // Measure visual widths (post-transform) and convert to %-based half-widths.
  useLayoutEffect(() => {
    if (!sceneRef.current) return;

    let raf = 0;

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sceneW = sceneRef.current?.getBoundingClientRect().width ?? 0;
        if (!sceneW) return;

        const bunnyW = bunnyImgRef.current?.getBoundingClientRect().width ?? 0;
        const toyW = toyMeasureRef.current?.getBoundingClientRect().width ?? 0;

        const bunnyHalfPct = bunnyW ? (bunnyW / sceneW) * 50 : 0;
        const toyHalfPct = toyW ? (toyW / sceneW) * 50 : 0;

        setEdgeClamp((prev) => {
          const next = {
            bunnyHalfPct: Math.round(bunnyHalfPct * 10) / 10,
            toyHalfPct: Math.round(toyHalfPct * 10) / 10,
          };
          if (prev.bunnyHalfPct === next.bunnyHalfPct && prev.toyHalfPct === next.toyHalfPct) return prev;
          return next;
        });
      });
    };

    measure();

    const hasRO = typeof ResizeObserver !== 'undefined';
    const ro = hasRO ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(sceneRef.current);

    window.addEventListener('resize', measure);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
    };
  }, [currentScene, currentPet, bunnyState.action, bunnyState.isNapping, selectedToy.id, yarnTanglePhase, isTrampolineBouncing]);

  // Flying baby birds state (for hay pile nest)
  const [flyingBirds, setFlyingBirds] = useState<Array<{ id: number; startX: number; startY: number }>>([]);
  const [eggsRemaining, setEggsRemaining] = useState(3);
  const [isInBox, setIsInBox] = useState(false);

  
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
  
  // Toy area position dynamically follows current zone (couch, bed, or park)
  const activeZones = getActiveZones();
  const getCurrentZoneData = () => {
    if (currentScene === 'park') {
      return parkZones[currentParkZone];
    }
    return activeZones[currentCouchZone];
  };
  const currentZoneData = getCurrentZoneData();
  
  // Toys only appear on grass in park scene
  // Clamp toy position using the same banister-aware logic as Lola (with extra padding for toy width)
  const toyZone = currentScene === 'park' ? parkZones.grass : currentZoneData;
  const toyAnchorX = currentScene === 'park'
    ? toyZone.xMin + 12
    : (toyZone.xMin + toyZone.xMax) / 2;

  const toyHalfUsedForPos = currentScene === 'room' ? Math.max(edgeClamp.toyHalfPct, 3) : edgeClamp.toyHalfPct;

  const toyAreaPosition = {
    x: clampZoneXWithHalfWidth(toyZone, toyAnchorX, toyHalfUsedForPos, { left: 4, right: 4 }),
    y: currentScene === 'park' ? parkZones.grass.y + 4 : currentZoneData.y + 4
  };
  
  // Check if toys should be visible (grass only in park)
  const showToys = currentScene !== 'park' || currentParkZone === 'grass';
  
  const envObjects = {
    'food-bowl': { x: 13, y: 94 },
    'water-bowl': { x: 19, y: 94 },
    'toy-area': toyAreaPosition,
  };
  const [fishState, setFishState] = useState({
    hunger: 80,
    happiness: 85,
    energy: 75,
    tankCleanliness: 95,
    mood: 'happy' as 'happy' | 'sad' | 'calm',
    action: 'idle' as 'idle' | 'eating' | 'playing' | 'resting',
    position: { x: 50, y: 50 },
    facingRight: true,
    targetFoodId: null as number | null,
    // Natural swimming state
    swimTarget: { x: 50, y: 50 } as { x: number; y: number },
    swimSpeed: 1, // varies based on mood
    isResting: false,
  });

  const fishStateRef = useRef(fishState);
  useEffect(() => {
    fishStateRef.current = fishState;
  }, [fishState]);

  const [fishPoops, setFishPoops] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    createdAt: number; // timestamp for algae growth
  }>>([]);
  
  const [fishFood, setFishFood] = useState<Array<{
    id: number;
    x: number;
    y: number;
    falling: boolean;
  }>>([]);
  
  // Fish scene decorations removed - clean immersive backgrounds only
  // The lofi video backgrounds provide all the visual atmosphere needed
  
  // Tank toys for Tula - with clear emoji icons
  const fishToys = [
    { id: 'ring', name: 'Swim Ring', emoji: '⭕', happinessBoost: 15, energyCost: 10 },
    { id: 'bubbler', name: 'Bubbles', emoji: '🫧', happinessBoost: 12, energyCost: 5 },
    { id: 'snail', name: 'Shelly', emoji: '🐌', happinessBoost: 18, energyCost: 8 },
    { id: 'crab', name: 'Clawdia', emoji: '🦀', happinessBoost: 20, energyCost: 12 },
  ];
  
  const [selectedFishToy, setSelectedFishToy] = useState(fishToys[0]);
  const [fishIsResting, setFishIsResting] = useState(false);
  const [activeFishFriend, setActiveFishFriend] = useState<{ id: string; x: number; y: number } | null>(null);

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
    sleeping: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [happy, sad, eating, drinking, playing, sleeping] = await Promise.all([
          removeSolidBackgroundToDataUrl(bunnyHappy),
          removeSolidBackgroundToDataUrl(bunnySad),
          removeSolidBackgroundToDataUrl(bunnyEating),
          removeSolidBackgroundToDataUrl(bunnyDrinking),
          removeSolidBackgroundToDataUrl(bunnyPlaying),
          removeSolidBackgroundToDataUrl(bunnySleeping),
        ]);

        if (!cancelled) {
          setBunnySpriteAlpha({ happy, sad, eating, drinking, playing, sleeping });
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

  // Bunny occasionally poops - interval must NOT depend on position (it would restart constantly)
  useEffect(() => {
    if (currentPet !== 'bunny') return;

    const poopInterval = setInterval(() => {
      const bs = bunnyStateRef.current;

      // Random chance to poop
      if (Math.random() < 0.3 && poopsRef.current.length < 5) {
        const zone = currentScene === 'park'
          ? parkZones[currentParkZone]
          : getActiveZones()[currentCouchZone];

        const poopX = clampZoneX(
          zone,
          bs.position.x + (Math.random() - 0.5) * 10,
          { left: 10, right: 8 }
        );

        const newPoop = {
          id: Date.now(),
          x: poopX,
          zone: currentCouchZone,
        };

        setPoops((prev) => [...prev, newPoop]);
        setBunnyState((prev) => ({
          ...prev,
          cleanliness: Math.max(0, prev.cleanliness - 10),
        }));
        playPoop();
      }
    }, 12000);

    return () => clearInterval(poopInterval);
  }, [currentPet, currentScene, currentCouchZone, currentParkZone, playPoop]);

  // Fish decay + poop generation (same care rate as Lola; interval must not depend on position)
  useEffect(() => {
    if (currentPet !== 'fish') return;

    const interval = setInterval(() => {
      setFishState((prev) => {
        const newState = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.5),
          happiness: Math.max(0, prev.happiness - 0.3),
        };
        if (newState.hunger < 30) newState.mood = 'sad';
        else if (newState.happiness > 70) newState.mood = 'happy';
        else newState.mood = 'calm';
        return newState;
      });

      // Fish tank should get dirty *slowly* over a long play session.
      // ~3.5% every 3s ≈ 1 poop / 86s (much slower than bunny)
      const FISH_POOP_CHANCE_PER_TICK = 0.035;
      const FISH_POOP_MAX = 30;

      if (Math.random() < FISH_POOP_CHANCE_PER_TICK) {
        const pos = fishStateRef.current.position;
        setFishPoops((prev) => {
          const next = [
            ...prev,
            {
              id: Date.now(),
              x: pos.x + (Math.random() - 0.5) * 15,
              y: Math.min(85, pos.y + 15 + Math.random() * 10),
              createdAt: Date.now(),
            },
          ];
          // Keep list bounded for performance and to prevent instant max-filth.
          return next.length > FISH_POOP_MAX ? next.slice(next.length - FISH_POOP_MAX) : next;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPet]);

  // Calculate tank cleanliness based on poop/algae buildup (slow burn)
  useEffect(() => {
    if (currentPet !== 'fish') return;
    const now = Date.now();

    // Each poop adds a little dirt immediately; algae growth ramps that up over ~40 minutes.
    const totalDirtiness = fishPoops.reduce((acc, poop) => {
      const ageMinutes = (now - poop.createdAt) / 60000;
      const algaeMultiplier = Math.min(2.6, 1 + ageMinutes * 0.04);
      const dirtPerPoop = 2.2;
      return acc + dirtPerPoop * algaeMultiplier;
    }, 0);

    const cleanliness = Math.max(0, 100 - totalDirtiness);
    setFishState((prev) => ({ ...prev, tankCleanliness: cleanliness }));
  }, [currentPet, fishPoops]);

  // Helper to check if current scene is a fish scene
  const isFishScene = (scene: string): scene is FishScene => {
    return scene === 'reef' || scene === 'castle' || scene === 'shell';
  };

  // Food particles fall and Tula swims to eat them
  useEffect(() => {
    if (currentPet !== 'fish' || fishFood.length === 0) return;
    
    const interval = setInterval(() => {
      setFishFood(prev => {
        const updated = prev.map(food => ({
          ...food,
          y: Math.min(85, food.y + 2), // Fall down
          falling: food.y < 85
        })).filter(food => food.y < 90); // Remove when settled too long
        
        return updated;
      });
      
      // Tula swims towards nearest food if hungry
      const nearestFood = fishFood.find(f => f.falling || f.y >= 80);
      if (nearestFood && fishState.action === 'idle') {
        const dx = nearestFood.x - fishState.position.x;
        const dy = nearestFood.y - fishState.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 8) {
          // Eat the food!
          setFishFood(prev => prev.filter(f => f.id !== nearestFood.id));
          setFishState(prev => ({
            ...prev,
            action: 'eating',
            hunger: Math.min(100, prev.hunger + 15),
            happiness: Math.min(100, prev.happiness + 5)
          }));
          setTimeout(() => {
            setFishState(prev => ({ ...prev, action: 'idle' }));
          }, 500);
        } else {
          // Swim towards food
          const moveX = (dx / distance) * 5;
          const moveY = (dy / distance) * 3;
          setFishState(prev => ({
            ...prev,
            position: {
              x: Math.max(10, Math.min(90, prev.position.x + moveX)),
              y: Math.max(15, Math.min(80, prev.position.y + moveY))
            },
            facingRight: dx > 0
          }));
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentPet, fishFood, fishState.action, fishState.position.x, fishState.position.y]);

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
              x: clampZoneX(zone, rawTarget.x),
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
          const newX = clampZoneX(currentZoneData, bunnyState.position.x + deltaX);
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
        const newX = clampZoneX(zone, bunnyState.position.x + deltaX);
        const movingRight = deltaX > 0;
        
        setBunnyState(prev => ({ ...prev, isHopping: true, facingRight: movingRight }));
        
        setTimeout(() => {
          setBunnyState(prev => ({
            ...prev,
            isHopping: false,
            position: { x: newX, y: zone.y }
          }));
        }, 600);
      } else if (currentScene === 'park') {
        // Park scene - only grass zone, just move within it
        const parkZone = parkZones.grass;
        const parkDeltaX = (Math.random() - 0.5) * 10;
        const parkNewX = clampZoneX(parkZone, bunnyState.position.x + parkDeltaX);
        const parkMovingRight = parkDeltaX > 0;
        
        setBunnyState(prev => ({ ...prev, isHopping: true, facingRight: parkMovingRight }));
        
        setTimeout(() => {
          setBunnyState(prev => ({
            ...prev,
            isHopping: false,
            position: { x: parkNewX, y: parkZone.y }
          }));
        }, 600);
      }
    }, 3750);
    return () => clearInterval(moveInterval);
  }, [currentPet, bunnyState.action, bunnyState.position.x, bunnyState.position.y, bunnyState.targetObject, currentScene, currentCouchZone, currentParkZone]);

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

  // Auto-move fish with natural swimming behavior (only when no food to chase)
  useEffect(() => {
    if (currentPet !== 'fish' || fishState.action !== 'idle' || fishFood.length > 0) return;

    // Pick a new swim target periodically
    const pickNewTarget = () => {
      const speed = fishState.mood === 'happy' ? 1.5 : fishState.mood === 'calm' ? 0.8 : 0.5;
      setFishState((prev) => ({
        ...prev,
        swimTarget: {
          x: Math.max(12, Math.min(88, 50 + (Math.random() - 0.5) * 70)),
          y: Math.max(15, Math.min(75, 45 + (Math.random() - 0.5) * 50)),
        },
        swimSpeed: speed,
      }));
    };

    // Pick new target every 3-6 seconds
    const targetInterval = setInterval(pickNewTarget, 3000 + Math.random() * 3000);
    pickNewTarget(); // Initial target

    // Smooth swimming towards target - gentle pace for calming effect
    const swimInterval = setInterval(() => {
      setFishState((prev) => {
        const dx = prev.swimTarget.x - prev.position.x;
        const dy = prev.swimTarget.y - prev.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 2) return prev; // Close enough, wait for new target

        // Slow, gentle easing movement - calming pace
        const ease = Math.min(1, distance / 50);
        const moveSpeed = prev.swimSpeed * ease * 0.8; // Halved speed
        const moveX = (dx / distance) * moveSpeed;
        const moveY = (dy / distance) * moveSpeed * 0.5; // Even less vertical movement

        // Add slight sine wave wobble for natural fish movement
        const wobble = Math.sin(Date.now() / 400) * 0.15; // Slower, gentler wobble

        return {
          ...prev,
          position: {
            x: Math.max(12, Math.min(88, prev.position.x + moveX)),
            y: Math.max(15, Math.min(75, prev.position.y + moveY + wobble)),
          },
          facingRight: dx > 0.5 ? true : dx < -0.5 ? false : prev.facingRight,
        };
      });
    }, 60); // Slightly slower update rate for smoother motion

    return () => {
      clearInterval(targetInterval);
      clearInterval(swimInterval);
    };
  }, [currentPet, fishState.action, fishFood.length, fishState.mood]);

  // Gentle swim swish SFX for Tula (throttled)
  useEffect(() => {
    if (currentPet !== 'fish') return;

    const prevPosRef = { current: fishStateRef.current.position };
    let lastAt = 0;

    const id = window.setInterval(() => {
      const cur = fishStateRef.current.position;
      const prev = prevPosRef.current;
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      prevPosRef.current = cur;

      const moved = dx * dx + dy * dy > 3.5;
      if (!moved) return;

      const now = Date.now();
      if (now - lastAt < 650) return;
      lastAt = now;
      playSwim();
    }, 420);

    return () => window.clearInterval(id);
  }, [currentPet, playSwim]);

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
        if (fishState.hunger < 30) notifications.push('🐠 Tula is hungry!');
        if (fishState.tankCleanliness < 40) notifications.push('🧽 Tank needs cleaning!');
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
      // Sprinkle food from top of tank
      playEat();
      const foodCount = 5 + Math.floor(Math.random() * 4);
      const newFood = Array.from({ length: foodCount }, (_, i) => ({
        id: Date.now() + i,
        x: 20 + Math.random() * 60,
        y: 5 + Math.random() * 5,
        falling: true
      }));
      setFishFood(prev => [...prev, ...newFood]);
      // Tula will swim to eat them via the useEffect
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
        
        // Use actual toy position instead of hardcoded values
        const playZone = currentScene === 'park'
          ? parkZones[currentParkZone]
          : getActiveZones()[currentCouchZone];

        const tunnelCenterX = clampZoneX(playZone, envObjects['toy-area'].x);
        const tunnelLeftX = clampZoneX(playZone, tunnelCenterX - 8);  // Left entrance of log
        const tunnelRightX = clampZoneX(playZone, tunnelCenterX + 8); // Right exit of log
        const tunnelY = envObjects['toy-area'].y - 4; // Align with log's ground level
        
        // Move to left entrance
        setBunnyState(prev => ({ ...prev, position: { x: tunnelLeftX, y: tunnelY }, isHopping: true }));
        playHop();
        
        // After a moment, bunny goes "inside" (we'll fade/hide briefly)
        setTimeout(() => {
          setBunnyState(prev => ({ ...prev, isHopping: false }));
        }, 400);
        
        // Emerge from right side
        setTimeout(() => {
          playHop();
          setBunnyState(prev => ({ ...prev, position: { x: tunnelRightX, y: tunnelY }, isHopping: true }));
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

      // Special handling for balloon - bunny plays with it in place, balloon appears above her
      if (toy.id === 'balloon') {
        setBunnyState(prev => ({ ...prev, targetObject: null, action: 'playing' }));
        playPlay();
        setTimeout(() => {
          setBunnyState(prev => ({ ...prev, action: 'idle' }));
        }, 4000);
        
        const parkMultiplier = currentScene === 'park' ? 1.5 : 1;
        const happinessBoost = Math.round(toy.happinessBoost * parkMultiplier);
        setBunnyState(prev => ({ 
          ...prev, 
          happiness: Math.min(100, prev.happiness + happinessBoost), 
          energy: Math.max(0, prev.energy - toy.energyCost) 
        }));
        return;
      }

      // Special handling for yarn - bunny hops to it, bats at it, gets tangled, then wiggles free
      if (toy.id === 'yarn') {
        const playZone = currentScene === 'park'
          ? parkZones[currentParkZone]
          : getActiveZones()[currentCouchZone];

        const yarnX = clampZoneX(playZone, envObjects['toy-area'].x);
        const yarnY = envObjects['toy-area'].y;
        // Approach from slightly left, but keep it clamped so it can never hit the posts.
        const yarnApproachX = clampZoneX(playZone, yarnX - 2);
        
        // First hop to yarn
        setBunnyState(prev => ({ ...prev, targetObject: null, isHopping: true, facingRight: yarnApproachX > prev.position.x }));
        playHop();
        
        setTimeout(() => {
          setBunnyState(prev => ({ 
            ...prev, 
            position: { x: yarnApproachX, y: yarnY },
            isHopping: false,
            action: 'playing'
          }));
          
          // Start batting phase
          setYarnTanglePhase('batting');
          playPlay();
        }, 600);
        
        // Phase 2: Get tangled (after batting)
        setTimeout(() => {
          setYarnTanglePhase('tangled');
        }, 2100);
        
        // Phase 3: Wiggle free
        setTimeout(() => {
          setYarnTanglePhase('free');
          playHop();
        }, 4000);
        
        // Phase 4: Done
        setTimeout(() => {
          setYarnTanglePhase('none');
          setBunnyState(prev => ({ ...prev, action: 'idle' }));
        }, 5000);
        
        const parkMultiplier = currentScene === 'park' ? 1.5 : 1;
        const happinessBoost = Math.round(toy.happinessBoost * parkMultiplier);
        setBunnyState(prev => ({ 
          ...prev, 
          happiness: Math.min(100, prev.happiness + happinessBoost), 
          energy: Math.max(0, prev.energy - toy.energyCost) 
        }));
        return;
      }

      // Special handling for cardboard box - bunny hops in, peeks out, then hops out
      if (toy.id === 'cardboard') {
        const playZone = currentScene === 'park'
          ? parkZones[currentParkZone]
          : getActiveZones()[currentCouchZone];

        const boxX = clampZoneX(playZone, envObjects['toy-area'].x);
        const boxY = envObjects['toy-area'].y;
        
        setBunnyState(prev => ({ ...prev, targetObject: null, isHopping: true, facingRight: boxX > prev.position.x }));
        playHop();
        
        // Hop to box
        setTimeout(() => {
          setBunnyState(prev => ({ 
            ...prev, 
            position: { x: boxX, y: boxY },
            isHopping: false
          }));
        }, 500);
        
        // Hop INTO the box (bunny disappears)
        setTimeout(() => {
          setIsInBox(true);
          setBunnyState(prev => ({ ...prev, action: 'playing' }));
          playPlay();
        }, 800);
        
        // Peek out (show ears)
        setTimeout(() => {
          // Peek phase handled in render
        }, 2000);
        
        // Hop out!
        setTimeout(() => {
          setIsInBox(false);
          playHop();
          setBunnyState(prev => ({ 
            ...prev, 
            position: { x: clampZoneX(playZone, boxX + 6), y: boxY },
            isHopping: true
          }));
        }, 3500);
        
        // Done
        setTimeout(() => {
          setBunnyState(prev => ({ ...prev, isHopping: false, action: 'idle' }));
        }, 4200);
        
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
      // Fish play with selected fish toy
      const toy = selectedFishToy;
      doAction('playing', null, 4000);
      
      // Show fish friend if playing with snail or crab
      if (toy.id === 'snail' || toy.id === 'crab') {
        setActiveFishFriend({
          id: toy.id,
          x: fishState.position.x + (Math.random() > 0.5 ? 15 : -15),
          y: fishState.position.y + 5,
        });
        setTimeout(() => setActiveFishFriend(null), 4000);
      }
      
      setFishState(prev => ({ 
        ...prev, 
        happiness: Math.min(100, prev.happiness + toy.happinessBoost),
        energy: Math.max(0, prev.energy - toy.energyCost)
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

  const takeFishRest = () => {
    if (gameState.locked || currentPet !== 'fish' || currentScene !== 'shell') return;
    setFishState(prev => ({ ...prev, action: 'resting', isResting: true }));
    
    // Rest for 5 seconds in the shell cave
    setTimeout(() => {
      setFishState(prev => ({ 
        ...prev, 
        action: 'idle', 
        isResting: false,
        energy: Math.min(100, prev.energy + 25),
        happiness: Math.min(100, prev.happiness + 10)
      }));
    }, 5000);
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
      // Clear all fish poops (but not algae - use filter for that)
      setFishPoops([]);
      setFishState(prev => ({ 
        ...prev, 
        tankCleanliness: Math.min(100, prev.tankCleanliness + 40), 
        happiness: Math.min(100, prev.happiness + 10) 
      }));
    }
  };

  // Water filter cleans algae buildup but not poop
  const runWaterFilter = () => {
    if (gameState.locked || currentPet !== 'fish') return;
    playClean();
    // Reset algae growth by updating createdAt to now
    setFishPoops(prev => prev.map(poop => ({
      ...poop,
      createdAt: Date.now() // Reset algae age
    })));
    setFishState(prev => ({ 
      ...prev, 
      tankCleanliness: Math.min(100, prev.tankCleanliness + 30),
      happiness: Math.min(100, prev.happiness + 5)
    }));
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
        energy: 75,
        tankCleanliness: 95,
        mood: 'happy',
        action: 'idle',
        position: { x: 50, y: 50 },
        facingRight: true,
        targetFoodId: null,
        swimTarget: { x: 50, y: 50 },
        swimSpeed: 1,
        isResting: false
      });
      setFishPoops([]);
      setFishFood([]);
    }
  };

  const getStatusColor = (value: number) => {
    if (value > 70) return 'bg-status-good';
    if (value > 40) return 'bg-status-medium';
    return 'bg-status-low';
  };

  const getBunnyImage = () => {
    const alpha = bunnySpriteAlpha;

    if (bunnyState.isNapping) return alpha?.sleeping ?? bunnySleeping;
    if (bunnyState.action === 'eating') return alpha?.eating ?? bunnyEating;
    if (bunnyState.action === 'drinking') return alpha?.drinking ?? bunnyDrinking;
    if (bunnyState.action === 'playing') return alpha?.playing ?? bunnyPlaying;
    if (bunnyState.mood === 'sad') return alpha?.sad ?? bunnySad;
    return alpha?.happy ?? bunnyHappy;
  };

  const getFishImage = () => {
    // IMPORTANT: The dedicated fish-eating sprite reads as "throwing up".
    // Keep the base sprite cute/neutral and add a separate eating face overlay instead.
    if (fishState.action === 'eating') return fishSpriteAlpha?.happy ?? fishHappy;
    if (fishState.action === 'playing') return fishSpriteAlpha?.playing ?? fishPlaying;
    if (fishState.mood === 'sad') return fishSpriteAlpha?.sad ?? fishSad;
    return fishSpriteAlpha?.happy ?? fishHappy;
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
            type="button"
          >
            {isAmbientPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button
            onClick={() => setShowBoundsDebug((v) => !v)}
            className={`p-2 rounded-lg transition-colors ${showBoundsDebug ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
            title={showBoundsDebug ? 'Hide bounds debug (Shift+D)' : 'Show bounds debug (Shift+D)'}
            type="button"
          >
            <Bug size={14} />
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
          onClick={() => { setCurrentPet('bunny'); localStorage.setItem('selectedPet', 'bunny'); }} 
          className={`p-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${currentPet === 'bunny' ? 'bg-primary text-primary-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
        >
          🐰
          <span className="text-sm">
            {((bunnyState.hunger + bunnyState.hydration + bunnyState.happiness + bunnyState.energy + bunnyState.rest + bunnyState.cleanliness) / 6) > 50 ? '💕' : '💔'}
          </span>
        </button>
        <button 
          onClick={() => { setCurrentPet('fish'); setCurrentScene('reef'); localStorage.setItem('selectedPet', 'fish'); }} 
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
        
        {currentPet === 'fish' && (
          <>
            <button 
              onClick={() => setCurrentScene('reef')} 
              className={`p-2 rounded-lg font-medium transition-all duration-200 ${currentScene === 'reef' ? 'bg-primary text-primary-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
              title="Coral Reef"
            >
              🪸
            </button>
            <button 
              onClick={() => setCurrentScene('castle')} 
              className={`p-2 rounded-lg font-medium transition-all duration-200 ${currentScene === 'castle' ? 'bg-accent text-accent-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
              title="Play Castle"
            >
              🏰
            </button>
            <button 
              onClick={() => setCurrentScene('shell')} 
              className={`p-2 rounded-lg font-medium transition-all duration-200 ${currentScene === 'shell' ? 'bg-success text-success-foreground scale-105 shadow-md' : 'bg-muted/50 hover:bg-muted hover:scale-105'}`}
              title="Shell Cave (Rest)"
            >
              🐚
            </button>
          </>
        )}
      </nav>

      {/* Main Scene */}
      <main ref={(el) => { sceneRef.current = el; }} className="flex-1 min-h-0 relative overflow-hidden">
        {/* Background based on pet/scene */}
        {currentPet !== 'fish' && currentScene === 'habitat' && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Animated video background for immersive scene */}
            <video
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={(e) => {
                // HARD MUTE: some browsers can still leak audio from MP4s; force it off.
                e.currentTarget.muted = true;
                e.currentTarget.defaultMuted = true;
                e.currentTarget.volume = 0;
              }}
              onVolumeChange={(e) => {
                if (!e.currentTarget.muted || e.currentTarget.volume !== 0) {
                  e.currentTarget.muted = true;
                  e.currentTarget.defaultMuted = true;
                  e.currentTarget.volume = 0;
                }
              }}
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
              onLoadedMetadata={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.defaultMuted = true;
                e.currentTarget.volume = 0;
              }}
              onVolumeChange={(e) => {
                if (!e.currentTarget.muted || e.currentTarget.volume !== 0) {
                  e.currentTarget.muted = true;
                  e.currentTarget.defaultMuted = true;
                  e.currentTarget.volume = 0;
                }
              }}
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

        {/* Park scene - video background */}
        {currentPet !== 'fish' && currentScene === 'park' && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              key={lofiParkBg}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.defaultMuted = true;
                e.currentTarget.volume = 0;
              }}
              onVolumeChange={(e) => {
                if (!e.currentTarget.muted || e.currentTarget.volume !== 0) {
                  e.currentTarget.muted = true;
                  e.currentTarget.defaultMuted = true;
                  e.currentTarget.volume = 0;
                }
              }}
              className="w-full h-full object-cover"
              style={{
                transform: 'scale(1.0)',
                transformOrigin: 'center center',
              }}
            >
              <source src={lofiParkBg} type="video/mp4" />
            </video>
            {/* Sunny warm overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/10 via-transparent to-green-200/5 pointer-events-none" />
            
            {/* Park zone indicators - subtle ground markers */}
          </div>
        )}

        {/* Fish scene animated video backgrounds */}
        {currentPet === 'fish' && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              key={currentScene}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.defaultMuted = true;
                e.currentTarget.volume = 0;
              }}
              onVolumeChange={(e) => {
                if (!e.currentTarget.muted || e.currentTarget.volume !== 0) {
                  e.currentTarget.muted = true;
                  e.currentTarget.defaultMuted = true;
                  e.currentTarget.volume = 0;
                }
              }}
              className="w-full h-full object-cover scale-110"
              style={{ filter: currentScene === 'shell' ? 'saturate(0.9) brightness(0.8)' : 'saturate(1.3) brightness(1.1)' }}
            >
              <source src={currentScene === 'reef' ? lofiReefBg : currentScene === 'castle' ? lofiCastleBg : lofiShellBg} type="video/mp4" />
            </video>
            {/* Underwater gradient overlay for depth */}
            <div className={`absolute inset-0 pointer-events-none ${
              currentScene === 'shell' 
                ? 'bg-gradient-to-b from-blue-900/30 via-indigo-900/20 to-purple-900/40' 
                : 'bg-gradient-to-b from-cyan-400/20 via-transparent to-blue-900/40'
            }`} />
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

        {/* DEBUG: Safe bounds overlay - toggle with Shift+D */}
        {showBoundsDebug && currentScene !== 'park' && (() => {
          const zone = getActiveZones()[currentCouchZone];
          const safeMin = clampZoneX(zone, zone.xMin);
          const safeMax = clampZoneX(zone, zone.xMax);

          const bunnyHalfUsed = currentScene === 'room' ? Math.max(edgeClamp.bunnyHalfPct, 5) : edgeClamp.bunnyHalfPct;
          const toyHalfUsed = currentScene === 'room' ? Math.max(edgeClamp.toyHalfPct, 3) : edgeClamp.toyHalfPct;

          const bunnyXRaw = bunnyState.position.x;
          const bunnyXCenterClamped = clampZoneX(zone, bunnyXRaw);
          const bunnyXEdgeClamped = clampZoneXWithHalfWidth(zone, bunnyXRaw, bunnyHalfUsed);

          const toyXRaw = envObjects['toy-area'].x;
          const toyXEdgeClamped = clampZoneXWithHalfWidth(
            zone,
            toyXRaw,
            toyHalfUsed,
            currentScene === 'room' ? { left: 4, right: 4 } : undefined
          );

          const bunnyMin = safeMin + bunnyHalfUsed;
          const bunnyMax = safeMax - bunnyHalfUsed;
          const toyMin = safeMin + toyHalfUsed;
          const toyMax = safeMax - toyHalfUsed;

          return (
            <div className="absolute inset-0 pointer-events-none z-[50]">
              {/* Base safe bounds */}
              <div className="absolute top-0 bottom-0 w-px bg-destructive/70" style={{ left: `${safeMin}%` }} />
              <div className="absolute top-0 bottom-0 w-px bg-destructive/70" style={{ left: `${safeMax}%` }} />

              {/* Effective edge bounds (bunny) */}
              {bunnyHalfUsed > 0 && (
                <>
                  <div className="absolute top-0 bottom-0 w-px bg-primary/60" style={{ left: `${bunnyMin}%` }} />
                  <div className="absolute top-0 bottom-0 w-px bg-primary/60" style={{ left: `${bunnyMax}%` }} />
                </>
              )}

              {/* Effective edge bounds (toy) */}
              {toyHalfUsed > 0 && (
                <>
                  <div className="absolute top-0 bottom-0 w-px bg-secondary/60" style={{ left: `${toyMin}%` }} />
                  <div className="absolute top-0 bottom-0 w-px bg-secondary/60" style={{ left: `${toyMax}%` }} />
                </>
              )}

              {/* Room scene: horizontal Y ground lines for Seat and Back */}
              {currentScene === 'room' && (
                <>
                  {/* Seat Y line - cyan/teal */}
                  <div 
                    className="absolute left-0 right-0 h-px bg-cyan-400/80" 
                    style={{ top: `${roomBedY.seat}%` }} 
                  />
                  <div 
                    className="absolute text-[9px] text-cyan-400 font-mono bg-background/70 px-1 rounded"
                    style={{ top: `${roomBedY.seat}%`, left: `${safeMax + 1}%`, transform: 'translateY(-50%)' }}
                  >
                    Seat Y: {roomBedY.seat}%
                  </div>

                  {/* Back Y line - magenta/pink */}
                  <div 
                    className="absolute left-0 right-0 h-px bg-pink-400/80" 
                    style={{ top: `${roomBedY.back}%` }} 
                  />
                  <div 
                    className="absolute text-[9px] text-pink-400 font-mono bg-background/70 px-1 rounded"
                    style={{ top: `${roomBedY.back}%`, left: `${safeMax + 1}%`, transform: 'translateY(-50%)' }}
                  >
                    Back Y: {roomBedY.back}%
                  </div>
                </>
              )}

              <div className="absolute top-2 left-2 rounded border border-border bg-background/80 text-foreground text-xs p-2 font-mono">
                Safe X (edge): {safeMin.toFixed(1)}% – {safeMax.toFixed(1)}%<br />
                Bunny half used: {bunnyHalfUsed.toFixed(1)}% (measured {edgeClamp.bunnyHalfPct.toFixed(1)}%)<br />
                Bunny X: {bunnyXRaw.toFixed(1)}% → center {bunnyXCenterClamped.toFixed(1)}% → edge {bunnyXEdgeClamped.toFixed(1)}%<br />
                Toy half used: {toyHalfUsed.toFixed(1)}% (measured {edgeClamp.toyHalfPct.toFixed(1)}%)<br />
                Toy X: {toyXRaw.toFixed(1)}% → edge {toyXEdgeClamped.toFixed(1)}%

                {currentScene === 'room' && (
                  <div className="mt-2 pt-2 border-t border-border/60 space-y-2 pointer-events-auto">
                    <div className="text-[10px] text-muted-foreground">
                      Adjust pads until the red lines sit exactly on the bed posts.
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-[62px] text-[10px] text-muted-foreground">Left pad</span>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={1}
                        value={roomVisualPad.left}
                        onChange={(e) => setRoomVisualPad((p) => ({ ...p, left: Number(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-8 text-right text-[10px]">{roomVisualPad.left}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-[62px] text-[10px] text-muted-foreground">Right pad</span>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={1}
                        value={roomVisualPad.right}
                        onChange={(e) => setRoomVisualPad((p) => ({ ...p, right: Number(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-8 text-right text-[10px]">{roomVisualPad.right}</span>
                    </div>

                    <div className="text-[10px] text-muted-foreground mt-2">
                      Bed Y (surface) – lower ↑ moves Lola up on bed.
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-[62px] text-[10px] text-muted-foreground">Seat Y</span>
                      <input
                        type="range"
                        min={50}
                        max={90}
                        step={1}
                        value={roomBedY.seat}
                        onChange={(e) => setRoomBedY((p) => ({ ...p, seat: Number(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-8 text-right text-[10px]">{roomBedY.seat}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-[62px] text-[10px] text-muted-foreground">Back Y</span>
                      <input
                        type="range"
                        min={40}
                        max={80}
                        step={1}
                        value={roomBedY.back}
                        onChange={(e) => setRoomBedY((p) => ({ ...p, back: Number(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-8 text-right text-[10px]">{roomBedY.back}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

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

        {/* Tank decorations removed - clean immersive lofi backgrounds only */}

        {/* Fish playmates - appear when playing with snail or crab toy */}
        {currentPet === 'fish' && activeFishFriend && (
          <div className="absolute inset-0 pointer-events-none z-[6]">
            <div
              className="absolute transition-all duration-1000 ease-out"
              style={{
                left: `${activeFishFriend.x}%`,
                top: `${activeFishFriend.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Stylized friend shape - organic blending */}
              {activeFishFriend.id === 'snail' && (
                <div className="relative">
                  <div 
                    className="w-8 h-6 rounded-full"
                    style={{
                      background: 'radial-gradient(ellipse at 30% 40%, rgba(180, 140, 100, 0.7), rgba(120, 90, 60, 0.5))',
                      boxShadow: '0 2px 8px rgba(80, 60, 40, 0.3)',
                    }}
                  />
                  <div 
                    className="absolute -top-1 left-1 w-3 h-4 rounded-full"
                    style={{
                      background: 'radial-gradient(ellipse, rgba(200, 160, 120, 0.6), rgba(140, 100, 70, 0.4))',
                    }}
                  />
                </div>
              )}
              {activeFishFriend.id === 'crab' && (
                <div className="relative">
                  <div 
                    className="w-10 h-6 rounded-lg"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 60%, rgba(200, 100, 80, 0.7), rgba(160, 70, 50, 0.5))',
                      boxShadow: '0 2px 8px rgba(100, 50, 40, 0.3)',
                    }}
                  />
                  {/* Claws */}
                  <div 
                    className="absolute -left-2 top-1 w-3 h-2 rounded-full"
                    style={{
                      background: 'rgba(180, 90, 70, 0.6)',
                    }}
                  />
                  <div 
                    className="absolute -right-2 top-1 w-3 h-2 rounded-full"
                    style={{
                      background: 'rgba(180, 90, 70, 0.6)',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tank decorations removed - clean immersive lofi backgrounds only */}

        {/* Heart-shaped bubbles rising from aquarium floor */}
        {currentPet === 'fish' && (
          <div className="absolute inset-0 pointer-events-none z-[5]">
            {[
              { x: 8, delay: 0, duration: 6, size: 12 },
              { x: 22, delay: 1.5, duration: 7, size: 10 },
              { x: 38, delay: 3, duration: 5.5, size: 14 },
              { x: 55, delay: 0.8, duration: 6.5, size: 11 },
              { x: 72, delay: 2.2, duration: 5.8, size: 13 },
              { x: 88, delay: 4, duration: 6.2, size: 10 },
              { x: 15, delay: 5, duration: 7.2, size: 9 },
              { x: 45, delay: 2.8, duration: 5.2, size: 12 },
              { x: 65, delay: 4.5, duration: 6.8, size: 11 },
              { x: 82, delay: 1, duration: 5.5, size: 10 },
            ].map((bubble, i) => (
              <div
                key={`heart-bubble-${i}`}
                className="absolute"
                style={{
                  left: `${bubble.x}%`,
                  bottom: '5%',
                  width: bubble.size,
                  height: bubble.size,
                  animation: `heart-bubble-rise ${bubble.duration}s ease-out infinite`,
                  animationDelay: `${bubble.delay}s`,
                  opacity: 0,
                }}
              >
                {/* Heart shape using CSS */}
                <svg
                  viewBox="0 0 24 24"
                  width={bubble.size}
                  height={bubble.size}
                  style={{
                    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                  }}
                >
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill="rgba(255, 180, 200, 0.6)"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="0.5"
                  />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Fish Waste with subtle organic algae growth - immersive design */}
        {currentPet === 'fish' && (
          <div className="absolute inset-0 pointer-events-none z-[7]">
            {fishPoops.map(poop => {
              const ageMinutes = (Date.now() - poop.createdAt) / 60000;
              const algaeLevel = Math.min(1, ageMinutes * 0.25); // Full algae in ~4 minutes
              const algaeSize = 0.3 + algaeLevel * 1.2;
              
              return (
                <div
                  key={poop.id}
                  className="absolute transform -translate-x-1/2"
                  style={{
                    left: `${poop.x}%`,
                    top: `${poop.y}%`,
                  }}
                >
                  {/* Organic waste dot with growing algae halo */}
                  <div 
                    className="relative"
                    style={{
                      width: `${8 + algaeLevel * 12}px`,
                      height: `${8 + algaeLevel * 12}px`,
                    }}
                  >
                    {/* Algae growth halo */}
                    <div 
                      className="absolute inset-0 rounded-full transition-all duration-1000"
                      style={{
                        background: `radial-gradient(circle, rgba(85, 107, 47, ${0.2 + algaeLevel * 0.4}) 0%, rgba(60, 80, 40, ${0.1 + algaeLevel * 0.2}) 50%, transparent 80%)`,
                        transform: `scale(${algaeSize})`,
                        filter: `blur(${1 + algaeLevel * 2}px)`,
                      }}
                    />
                    {/* Core waste particle */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: '4px',
                        height: '4px',
                        background: `rgba(90, 70, 50, ${0.5 + algaeLevel * 0.3})`,
                        boxShadow: `0 0 3px rgba(70, 90, 50, ${0.3 + algaeLevel * 0.4})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Falling Fish Food */}
        {currentPet === 'fish' && fishFood.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-[8]">
            {fishFood.map(food => (
              <div
                key={food.id}
                className="absolute transform -translate-x-1/2 transition-all duration-100"
                style={{
                  left: `${food.x}%`,
                  top: `${food.y}%`,
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full bg-amber-600 shadow-sm"
                  style={{ 
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    animation: food.falling ? 'none' : 'pulse-soft 1s infinite'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Tank Dirtiness Overlay - gets murky green with algae */}
        {currentPet === 'fish' && fishState.tankCleanliness < 100 && (
          <>
            {/* Main murky green overlay */}
            <div 
              className="absolute inset-0 pointer-events-none z-[3] transition-all duration-1000"
              style={{
                background: `linear-gradient(
                  180deg, 
                  hsla(95, 60%, 30%, ${(100 - fishState.tankCleanliness) * 0.012}) 0%,
                  hsla(85, 55%, 25%, ${(100 - fishState.tankCleanliness) * 0.015}) 40%,
                  hsla(75, 50%, 20%, ${(100 - fishState.tankCleanliness) * 0.018}) 100%
                )`,
                opacity: Math.min(0.9, (100 - fishState.tankCleanliness) / 80)
              }}
            />
            {/* Floating algae particles for extra murkiness */}
            {fishState.tankCleanliness < 70 && (
              <div className="absolute inset-0 pointer-events-none z-[4]">
                {Array.from({ length: Math.floor((100 - fishState.tankCleanliness) / 10) }).map((_, i) => (
                  <div
                    key={`algae-particle-${i}`}
                    className="absolute rounded-full animate-float-slow"
                    style={{
                      left: `${10 + (i * 17) % 80}%`,
                      top: `${20 + (i * 23) % 60}%`,
                      width: `${3 + (i % 3) * 2}px`,
                      height: `${3 + (i % 3) * 2}px`,
                      background: `hsla(90, 50%, 35%, ${0.2 + (100 - fishState.tankCleanliness) * 0.005})`,
                      animationDelay: `${i * 0.7}s`,
                      animationDuration: `${4 + (i % 3)}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </>
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
            
            {/* Selected Toy Display - only visible on grass in park, with special handling for trampoline and balloon */}
            {!isTrampolineBouncing && showToys && !(bunnyState.action === 'playing' && selectedToy.id === 'balloon') && (
                <div 
                  ref={toyMeasureRef}
                  className={`absolute transition-transform duration-200 ${
                    bunnyState.targetObject === 'toy-area' ? 'scale-110' : ''
                  } ${bunnyState.action === 'playing' && selectedToy.id !== 'trampoline' ? 'animate-bounce-slow' : ''}`}
                  style={{
                    left: `${clampZoneXWithHalfWidth(
                      currentScene === 'park' ? parkZones[currentParkZone] : getActiveZones()[currentCouchZone],
                      envObjects['toy-area'].x,
                      currentScene === 'room' ? Math.max(edgeClamp.toyHalfPct, 3) : edgeClamp.toyHalfPct,
                      currentScene === 'room' ? { left: 4, right: 4 } : undefined
                    )}%`,
                    top: `${envObjects['toy-area'].y}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
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
                ) : selectedToy.id === 'yarn' ? (
                  // Yarn ball with animated state based on phase
                  <div className={`relative transition-transform duration-300 ${
                    yarnTanglePhase === 'batting' ? 'animate-wiggle scale-110' : 
                    yarnTanglePhase === 'tangled' ? 'scale-90' : ''
                  }`}>
                    <div className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">🧶</div>
                    {/* Yarn strands flying when batting */}
                    {yarnTanglePhase === 'batting' && (
                      <div className="absolute -top-1 -right-2 text-sm animate-bounce">🧵</div>
                    )}
                    {/* Yarn wrapped around when tangled */}
                    {yarnTanglePhase === 'tangled' && (
                      <>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs animate-pulse">〰️</div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs animate-pulse" style={{ animationDelay: '0.2s' }}>〰️</div>
                      </>
                    )}
                    {/* Yarn bouncing away when free */}
                    {yarnTanglePhase === 'free' && (
                      <div className="animate-bounce">
                        <div className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">🧶</div>
                      </div>
                    )}
                  </div>
                ) : selectedToy.id === 'cardboard' ? (
                  // Cardboard box with peek-a-boo state
                  <div className="relative">
                    <div className={`text-2xl sm:text-3xl md:text-4xl drop-shadow-lg ${isInBox ? 'animate-wiggle' : ''}`}>📦</div>
                    {/* Bunny ears peeking out when in box */}
                    {isInBox && bunnyState.action === 'playing' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce-slow">
                        <span className="text-lg">🐰</span>
                      </div>
                    )}
                  </div>
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
            
            {/* Poops - only visible on grass in park, Y computed dynamically from current zone */}
            {showToys && poops.map((poop) => {
              // Compute Y dynamically so it updates when roomBedY sliders change
              const poopZoneData = currentScene === 'park' 
                ? parkZones[currentParkZone] 
                : getActiveZones()[poop.zone] || getActiveZones()[currentCouchZone];
              const poopY = poopZoneData.y + 6;
              
              return (
                <div
                  key={poop.id}
                  className="absolute transition-all duration-300 animate-fade-in"
                  style={{ 
                    left: `${poop.x}%`, 
                    top: `${poopY}%`, 
                    transform: 'translate(-50%, -100%)' 
                  }}
                >
                  <div className="text-base sm:text-lg md:text-xl drop-shadow-md">💩</div>
                </div>
              );
            })}
          </div>
        )}
        {/* Trampoline displayed under bunny when bouncing */}
        {isTrampolineBouncing && currentPet === 'bunny' && (
          <div 
            className="absolute z-[11]"
            style={{ 
              left: `${clampZoneX(
                currentScene === 'park' ? parkZones[currentParkZone] : getActiveZones()[currentCouchZone],
                bunnyState.position.x
              )}%`, 
              top: `${currentScene === 'room' ? getActiveZones()[currentCouchZone].y : bunnyState.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <TrampolineSVG large />
          </div>
        )}
        
        {/* Pet - anchor at feet (bottom-center) for bunny, center for fish */}
        {/* When playing with balloon, balloon floats above bunny but bunny stays grounded */}
        <div 
          className={`absolute transition-all ease-out ${
            currentPet === 'bunny' && bunnyState.isHopping ? 'duration-600' : 'duration-700'
          } ${
            isTrampolineBouncing ? 'animate-trampoline-bounce' : ''
          } ${yarnTanglePhase === 'tangled' ? 'animate-wiggle' : ''} ${
            isHoppingThroughTunnel && Math.abs(bunnyState.position.x - envObjects['toy-area'].x) < 6 ? 'opacity-0' : ''
          } ${isInBox ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
              left: `${currentPet === 'bunny' ? clampZoneXWithHalfWidth(
                currentScene === 'park' ? parkZones[currentParkZone] : getActiveZones()[currentCouchZone],
                bunnyState.position.x,
                currentScene === 'room' ? Math.max(edgeClamp.bunnyHalfPct, 5) : edgeClamp.bunnyHalfPct
              ) : fishState.position.x}%`,
            top: `${currentPet === 'bunny' ? (
              isTrampolineBouncing ? ((currentScene === 'room' ? getActiveZones()[currentCouchZone].y : bunnyState.position.y) - 2) :
              // Park video has extra "air" at the bottom; nudge Lola down so her feet touch the ground.
              currentScene === 'park' ? bunnyState.position.y + 4 :
              (currentScene === 'room' ? getActiveZones()[currentCouchZone].y : bunnyState.position.y)
            ) : fishState.position.y}%`,
            transform: currentPet === 'bunny'
              ? (currentScene === 'park'
                  ? `scale(${getParkDepthScale()}) translate(-50%, -100%)`
                  : 'translate(-50%, -100%)')
              : 'translate(-50%, -50%)',
            transition: isHoppingThroughTunnel ? 'left 0.6s ease-out, top 0.6s ease-out, opacity 0.2s ease-out, transform 0.8s ease-out' : 'transform 0.8s ease-out',
            // Depth-based z-index: foreground = 10, mid = 8, background = 5
            zIndex: currentScene === 'park' ? (currentParkZone === 'grass' ? 10 : 9) : 10
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
          
          <div 
            className={`relative ${
              currentPet === 'fish' 
                ? fishState.action === 'eating'
                  ? 'animate-fish-nibble'
                  : fishState.mood === 'happy' 
                    ? 'animate-fish-wiggle-fast' 
                    : fishState.mood === 'calm' 
                      ? 'animate-fish-wiggle-normal' 
                      : 'animate-fish-wiggle-slow'
                : ''
            } ${
              currentPet === 'bunny' && bunnyState.isHopping && currentScene !== 'park' && !isTrampolineBouncing ? 'animate-hop' : ''
            } ${
              currentPet === 'bunny' && bunnyState.idleBehavior === 'sniffing' ? 'animate-sniff' : ''
            } ${
              currentPet === 'bunny' && bunnyState.idleBehavior === 'ear-scratch' ? 'animate-ear-scratch' : ''
            } ${
              currentPet === 'bunny' && bunnyState.idleBehavior === 'nibbling' ? 'animate-nibble' : ''
            } ${
              currentPet === 'bunny' && bunnyState.idleBehavior === 'looking' ? 'animate-look-around' : ''
            } ${
              (currentPet === 'bunny' && bunnyState.action === 'playing' && !isTrampolineBouncing && selectedToy.id !== 'balloon')
                ? 'animate-wiggle' : ''
            }`}
            style={currentPet === 'fish' ? {
              // Warm ambient glow to match lofi background tones
              filter: 'drop-shadow(0 0 15px rgba(160, 120, 80, 0.2))',
            } : undefined}
          >
            {/* Fish transforms (flip + depth scale) must apply to sparkles too, so we wrap image + effects */}
            <div
              className="relative"
              style={
                currentPet === 'fish'
                  ? {
                      transform: `${fishState.facingRight ? 'scaleX(1)' : 'scaleX(-1)'} scale(${0.85 + (fishState.position.y / 100) * 0.3})`,
                    }
                  : undefined
              }
            >
              {/* Pet Image - scaled to fit room */}
              <img
                ref={bunnyImgRef}
                src={currentPet === 'bunny' ? getBunnyImage() : getFishImage()}
                alt={currentPet === 'bunny' ? 'Lola the bunny' : 'Tula the tiger fish'}
                className={`object-contain transition-all duration-700 ease-out ${
                  currentPet === 'fish'
                    ? 'w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 animate-fish-shimmer'
                    : currentScene === 'room'
                      ? 'w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32'
                      : currentScene === 'habitat'
                        ? 'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36'
                        : 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20'
                } ${
                  bunnyState.isNapping
                    ? 'scale-75'
                    : bunnyState.action === 'eating' || bunnyState.action === 'drinking'
                      ? 'scale-110'
                      : ''
                } ${currentPet === 'bunny' ? 'saturate-[0.95] contrast-[1.05]' : ''} ${
                  fishState.isResting ? 'opacity-80' : ''
                }`}
                style={{
                  // Bunny gets simple drop shadow, fish gets warm underwater tones
                  filter:
                    currentPet === 'fish'
                      ? `drop-shadow(0 0 6px rgba(140, 100, 70, 0.3)) drop-shadow(0 3px 6px rgba(60, 40, 30, 0.35)) brightness(0.92) saturate(0.8) sepia(0.2) contrast(1.08)`
                      : 'drop-shadow(0 4px 8px hsl(var(--foreground) / 0.25))',
                  transform: `${
                    currentPet === 'bunny' && !bunnyState.facingRight ? 'scaleX(-1)' : 'scaleX(1)'
                  } ${
                    bunnyState.isNapping
                      ? ''
                      : bunnyState.action === 'playing' && selectedToy.id === 'balloon'
                        ? 'rotate(-5deg) translateY(-5%)'
                        : ''
                  }`,
                }}
              />

              {/* Cute eating face + fish flakes near Tula's mouth (no "throw up" look) */}
              {currentPet === 'fish' && fishState.action === 'eating' && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Face overlay (smile + happy eyes) */}
                  <div
                    className="absolute fish-eating-face"
                    style={{
                      top: '36%',
                      left: '26%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <svg width="42" height="28" viewBox="0 0 100 60" aria-hidden="true">
                      {/* happy eyes */}
                      <path d="M22 26 Q32 18 42 26" fill="none" strokeWidth="6" strokeLinecap="round" />
                      <path d="M58 26 Q68 18 78 26" fill="none" strokeWidth="6" strokeLinecap="round" />
                      {/* smile */}
                      <path d="M34 42 Q50 54 66 42" fill="none" strokeWidth="6" strokeLinecap="round" />
                      {/* tiny cheek blush */}
                      <circle cx="18" cy="40" r="6" />
                      <circle cx="82" cy="40" r="6" />
                    </svg>
                  </div>

                  {/* Fish flake food particles + tiny bubbles near mouth */}
                  <div
                    className="absolute"
                    style={{
                      top: '42%',
                      // This sits in local (flipped) space, so it stays at the mouth when she turns.
                      left: '18%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Flakes drift toward her mouth and fade (reads as nibbling, not puke) */}
                    {[
                      { w: 6, h: 3, x: -18, y: -8, delay: 0.0, dur: 1.25, rot: 15 },
                      { w: 5, h: 3, x: -14, y: 2, delay: 0.25, dur: 1.35, rot: -10 },
                      { w: 4, h: 2, x: -22, y: 6, delay: 0.5, dur: 1.15, rot: 25 },
                      { w: 5, h: 3, x: -16, y: -2, delay: 0.75, dur: 1.4, rot: -20 },
                    ].map((flake, i) => (
                      <div
                        key={`flake-${i}`}
                        className="absolute rounded-sm fish-food-flake"
                        style={{
                          width: flake.w,
                          height: flake.h,
                          left: `${flake.x}px`,
                          top: `${flake.y}px`,
                          animation: `fish-flake-nibble-in ${flake.dur}s ease-in-out infinite`,
                          animationDelay: `${flake.delay}s`,
                          transform: `rotate(${flake.rot}deg)`,
                        }}
                      />
                    ))}

                    {/* Tiny bubbles */}
                    {[0, 1].map((i) => (
                      <div
                        key={`eat-bubble-${i}`}
                        className="absolute rounded-full bg-foreground/15"
                        style={{
                          width: 2 + i,
                          height: 2 + i,
                          left: `${i * 6 - 6}px`,
                          top: `${i * 2 - 10}px`,
                          animation: `bubble-rise ${3.0 + i * 0.4}s ease-in-out infinite`,
                          animationDelay: `${i * 0.35}s`,
                          filter: 'blur(0.25px)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sparkle + bubble effects anchored to Tula's body (they flip + scale with her) */}
              {currentPet === 'fish' && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    // Keep sparkles off Tula's face - mask hides left 50% where face is
                    WebkitMaskImage:
                      'linear-gradient(90deg, transparent 0%, transparent 50%, black 65%, black 100%)',
                    maskImage:
                      'linear-gradient(90deg, transparent 0%, transparent 50%, black 65%, black 100%)',
                  }}
                >
                  {/* Sparkle dots along body/tail area only */}
                  {[
                    { x: '66%', y: '35%', size: 4, delay: 0, duration: 2.5 },
                    { x: '74%', y: '42%', size: 3, delay: 0.8, duration: 2.2 },
                    { x: '82%', y: '38%', size: 5, delay: 1.5, duration: 2.8 },
                    { x: '70%', y: '55%', size: 3, delay: 2.1, duration: 2.4 },
                    { x: '78%', y: '58%', size: 4, delay: 0.4, duration: 2.6 },
                    { x: '88%', y: '48%', size: 3, delay: 1.8, duration: 2.3 },
                    { x: '72%', y: '48%', size: 2, delay: 1.2, duration: 2.0 },
                    { x: '84%', y: '52%', size: 3, delay: 2.5, duration: 2.7 },
                  ].map((sparkle, i) => (
                    <div
                      key={`sparkle-${i}`}
                      className="fish-sparkle"
                      style={{
                        left: sparkle.x,
                        top: sparkle.y,
                        width: sparkle.size,
                        height: sparkle.size,
                        animation: `scale-sparkle-1 ${sparkle.duration}s ease-in-out infinite`,
                        animationDelay: `${sparkle.delay}s`,
                      }}
                    />
                  ))}

                  {/* Star sparkles for extra shimmer - body area only */}
                  {[
                    { x: '72%', y: '40%', size: 8, delay: 0.3, duration: 3 },
                    { x: '78%', y: '54%', size: 6, delay: 1.6, duration: 2.8 },
                    { x: '86%', y: '45%', size: 7, delay: 2.2, duration: 3.2 },
                  ].map((star, i) => (
                    <div
                      key={`star-${i}`}
                      className="fish-sparkle-star"
                      style={{
                        left: star.x,
                        top: star.y,
                        width: star.size,
                        height: star.size,
                        animation: `scale-sparkle-2 ${star.duration}s ease-in-out infinite`,
                        animationDelay: `${star.delay}s`,
                      }}
                    />
                  ))}

                  {/* Tiny bubbles trailing from Tula's tail as she swims */}
                  {[
                    { x: '92%', y: '42%', size: 3, delay: 0, duration: 2.0 },
                    { x: '96%', y: '48%', size: 4, delay: 0.4, duration: 2.3 },
                    { x: '94%', y: '55%', size: 2, delay: 0.8, duration: 1.8 },
                    { x: '100%', y: '45%', size: 3, delay: 1.2, duration: 2.1 },
                    { x: '98%', y: '52%', size: 2, delay: 1.6, duration: 1.9 },
                    { x: '104%', y: '48%', size: 3, delay: 2.0, duration: 2.2 },
                    { x: '102%', y: '40%', size: 2, delay: 2.4, duration: 1.7 },
                    { x: '106%', y: '54%', size: 2, delay: 2.8, duration: 2.0 },
                  ].map((bubble, i) => (
                    <div
                      key={`tail-bubble-${i}`}
                      className="absolute rounded-full"
                      style={{
                        left: bubble.x,
                        top: bubble.y,
                        width: bubble.size,
                        height: bubble.size,
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7), rgba(180, 220, 255, 0.3))',
                        boxShadow: '0 0 2px rgba(255, 255, 255, 0.5), inset 0 0 1px rgba(255, 255, 255, 0.8)',
                        animation: `tail-bubble-float ${bubble.duration}s ease-out infinite`,
                        animationDelay: `${bubble.delay}s`,
                        opacity: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            
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

        {/* Fish Toy Selection Menu - Right Side */}
        {currentPet === 'fish' && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex flex-col bg-card/90 backdrop-blur-sm rounded-xl p-2 shadow-strong border-2 border-secondary/30 max-h-[60vh]">
            <div className="text-xs font-bold text-center text-muted-foreground uppercase mb-1">Toys</div>
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-secondary/50 scrollbar-track-transparent flex flex-col gap-2 pr-1" style={{ maxHeight: 'calc(60vh - 40px)' }}>
              {fishToys.map((toy) => (
                <button
                  key={toy.id}
                  onClick={() => setSelectedFishToy(toy)}
                  disabled={gameState.locked || fishState.action !== 'idle'}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 min-w-[50px] ${
                    selectedFishToy.id === toy.id 
                      ? 'bg-secondary text-secondary-foreground scale-110 shadow-md' 
                      : 'bg-muted/50 hover:bg-muted text-foreground hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-xl">{toy.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight">{toy.name}</span>
                  <span className="text-[9px] text-muted-foreground">⚡{toy.energyCost}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                <span className="text-sm leading-none">⚡</span>
                <div className="status-bar w-full h-2 mt-1">
                  <div className={`status-bar-fill ${getStatusColor(fishState.energy)}`} style={{ width: `${fishState.energy}%` }} />
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
          {currentPet === 'bunny' ? (
            <button
              onClick={() => playWithToy(selectedToy)}
              disabled={gameState.locked || bunnyState.action !== 'idle'}
              className="pet-button-play w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl"
            >
              <span className="leading-none">{selectedToy.emoji || '🎪'}</span>
              <span className="text-[9px] font-medium leading-none">Play</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (gameState.locked || fishState.action !== 'idle') return;
                const toy = selectedFishToy;
                setFishState(prev => ({ ...prev, action: 'playing' }));
                
                // Show fish friend if playing with snail or crab
                if (toy.id === 'snail' || toy.id === 'crab') {
                  setActiveFishFriend({
                    id: toy.id,
                    x: fishState.position.x + (Math.random() > 0.5 ? 15 : -15),
                    y: fishState.position.y + 5,
                  });
                  setTimeout(() => setActiveFishFriend(null), 4000);
                }
                
                setTimeout(() => {
                  setFishState(prev => ({ 
                    ...prev, 
                    action: 'idle',
                    happiness: Math.min(100, prev.happiness + toy.happinessBoost),
                    energy: Math.max(0, prev.energy - toy.energyCost)
                  }));
                }, 4000);
              }}
              disabled={gameState.locked || fishState.action !== 'idle'}
              className="pet-button-play w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl"
            >
              <span className="leading-none">🎾</span>
              <span className="text-[9px] font-medium leading-none">Play</span>
            </button>
          )}
          {currentPet === 'fish' && (
            <button
              onClick={runWaterFilter}
              disabled={gameState.locked || fishState.tankCleanliness >= 95}
              className={`pet-button-water w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl ${fishState.tankCleanliness >= 95 ? 'opacity-50' : ''}`}
              title="Filter cleans algae buildup"
            >
              <span className="leading-none">💨</span>
              <span className="text-[9px] font-medium leading-none">Filter</span>
            </button>
          )}
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
          {currentPet === 'fish' && (
            <button
              onClick={takeFishRest}
              disabled={gameState.locked || fishState.action !== 'idle' || currentScene !== 'shell' || fishState.isResting}
              className={`pet-button-play w-16 h-16 p-0 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl text-xl ${currentScene !== 'shell' ? 'opacity-50' : ''}`}
              title={currentScene !== 'shell' ? 'Rest only in Shell Cave' : 'Rest in shell'}
            >
              <span className="leading-none">💤</span>
              <span className="text-[9px] font-medium leading-none">Rest</span>
            </button>
          )}
          {currentPet === 'bunny' && (
            <button
              onClick={cleanHabitat}
              disabled={gameState.locked || (poops.length === 0 && bunnyState.cleanliness >= 40)}
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
