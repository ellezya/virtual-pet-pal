import React, { useState, useEffect } from 'react';
import { RotateCcw, Lock, Unlock, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

const ClassroomPets = () => {
  const { signOut, user } = useAuth();
  const [currentPet, setCurrentPet] = useState('bunny');
  const [currentScene, setCurrentScene] = useState('habitat');
  
  const [bunnyState, setBunnyState] = useState({
    hunger: 80,
    happiness: 85,
    hydration: 75,
    energy: 70,
    mood: 'happy' as 'happy' | 'sad' | 'neutral',
    action: 'idle' as 'idle' | 'eating' | 'drinking' | 'playing',
    position: { x: 50, y: 50 },
    isHopping: false,
    facingRight: true
  });

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

  const [bgImgFailed, setBgImgFailed] = useState(false);
  const [bgImgStatus, setBgImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [bgImgMeta, setBgImgMeta] = useState<{ w: number; h: number } | null>(null);

  // Bunny decay
  useEffect(() => {
    if (currentPet !== 'bunny') return;
    const interval = setInterval(() => {
      setBunnyState(prev => {
        const newState = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.5),
          hydration: Math.max(0, prev.hydration - 0.4),
          energy: Math.min(100, prev.energy - 0.2),
          happiness: Math.max(0, prev.happiness - 0.3)
        };
        if (newState.hunger < 30 || newState.hydration < 30) newState.mood = 'sad';
        else if (newState.happiness > 70) newState.mood = 'happy';
        else newState.mood = 'neutral';
        return newState;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [currentPet]);

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

  // Auto-move bunny with hopping animation
  useEffect(() => {
    if (currentPet !== 'bunny' || bunnyState.action !== 'idle') return;
    const moveInterval = setInterval(() => {
      const deltaX = (Math.random() - 0.5) * 20;
      const newX = Math.max(20, Math.min(80, bunnyState.position.x + deltaX));
      const newY = Math.max(42, Math.min(72, bunnyState.position.y + (Math.random() - 0.5) * 8));
      const movingRight = deltaX > 0;
      
      // Start hop animation
      setBunnyState(prev => ({ ...prev, isHopping: true, facingRight: movingRight }));
      
      // After hop animation (600ms), update position and end hop
      setTimeout(() => {
        setBunnyState(prev => ({
          ...prev,
          isHopping: false,
          position: { x: newX, y: newY }
        }));
      }, 600);
    }, 2500);
    return () => clearInterval(moveInterval);
  }, [currentPet, bunnyState.action, bunnyState.position.x, bunnyState.position.y]);

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
        if (bunnyState.happiness < 30) notifications.push('😢 Bunny is sad!');
      } else if (currentPet === 'fish') {
        if (fishState.hunger < 30) notifications.push('🐠 Fish hungry!');
        if (fishState.tankCleanliness < 40) notifications.push('🧽 Tank dirty!');
      }
      setGameState(prev => ({ ...prev, notifications }));
    }, 3000);
    return () => clearInterval(checkNeeds);
  }, [currentPet, bunnyState, fishState]);

  const doAction = (actionType: 'eating' | 'drinking' | 'playing', duration = 3000) => {
    if (gameState.locked) return;
    if (currentPet === 'bunny') {
      setBunnyState(prev => ({ ...prev, action: actionType }));
      setTimeout(() => {
        setBunnyState(prev => ({ ...prev, action: 'idle' }));
      }, duration);
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
      doAction('eating', 4000);
      setBunnyState(prev => ({ 
        ...prev, 
        hunger: Math.min(100, prev.hunger + 40), 
        happiness: Math.min(100, prev.happiness + 10) 
      }));
    } else {
      doAction('eating', 3000);
      setFishState(prev => ({ 
        ...prev, 
        hunger: Math.min(100, prev.hunger + 50), 
        happiness: Math.min(100, prev.happiness + 10) 
      }));
    }
  };

  const waterBunny = () => {
    if (gameState.locked || currentPet !== 'bunny') return;
    doAction('drinking', 3000);
    setBunnyState(prev => ({ 
      ...prev, 
      hydration: Math.min(100, prev.hydration + 50), 
      happiness: Math.min(100, prev.happiness + 5) 
    }));
  };

  const playWithPet = () => {
    if (gameState.locked) return;
    if (currentPet === 'bunny') {
      doAction('playing', 5000);
      setBunnyState(prev => ({ 
        ...prev, 
        happiness: Math.min(100, prev.happiness + 25), 
        energy: Math.max(0, prev.energy - 15) 
      }));
    } else {
      doAction('playing', 3000);
      setFishState(prev => ({ 
        ...prev, 
        happiness: Math.min(100, prev.happiness + 20) 
      }));
    }
  };

  const cleanHabitat = () => {
    if (gameState.locked || currentPet !== 'fish') return;
    setFishState(prev => ({ 
      ...prev, 
      tankCleanliness: 100, 
      happiness: Math.min(100, prev.happiness + 15) 
    }));
  };

  const resetPet = () => {
    if (currentPet === 'bunny') {
      setBunnyState({
        hunger: 80,
        happiness: 85,
        hydration: 75,
        energy: 70,
        mood: 'happy',
        action: 'idle',
        position: { x: 50, y: 50 },
        isHopping: false,
        facingRight: true
      });
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
    if (bunnyState.action === 'eating') return bunnyEating;
    if (bunnyState.action === 'drinking') return bunnyDrinking;
    if (bunnyState.action === 'playing') return bunnyPlaying;
    if (bunnyState.mood === 'sad') return bunnySad;
    return bunnyHappy;
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

  useEffect(() => {
    setBgImgFailed(false);
    setBgImgStatus('loading');
    setBgImgMeta(null);
    // Debug: helps confirm which asset URL Vite is using
    console.log('[habitat] src', habitatSrc);
  }, [habitatSrc]);

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
        {/* Background Habitat with Fallback */}
        <div className={`absolute inset-0 z-0 ${
          currentPet === 'fish' 
            ? 'bg-gradient-to-b from-tank-water via-tank-water to-tank-deep' 
            : currentScene === 'park'
            ? 'bg-gradient-to-b from-habitat-sky to-habitat-grass'
            : currentScene === 'room'
            ? 'bg-gradient-to-b from-room-wall to-room-floor'
            : 'bg-gradient-to-b from-primary/20 to-primary/40'
        }`}>
          <img 
            key={habitatSrc}
            src={habitatSrc} 
            alt="Pet habitat" 
            className={`w-full h-full object-cover transition-opacity duration-500 ${bgImgFailed ? 'opacity-0' : 'opacity-100'}`}
            loading="eager"
            onLoad={(e) => {
              const img = e.currentTarget;
              setBgImgStatus('loaded');
              setBgImgMeta({ w: img.naturalWidth, h: img.naturalHeight });
              console.log('[habitat] loaded', habitatSrc, img.naturalWidth, img.naturalHeight);
            }}
            onError={() => {
              setBgImgFailed(true);
              setBgImgStatus('error');
              console.log('[habitat] failed to load', habitatSrc);
            }}
          />

          {/* On-screen debug so we don't rely on DevTools */}
          <div className="absolute left-3 top-3 z-20 max-w-[85%] rounded-md border border-border bg-card/80 px-3 py-2 text-xs text-foreground backdrop-blur">
            <div className="font-semibold">Background: {bgImgStatus}{bgImgMeta ? ` • ${bgImgMeta.w}×${bgImgMeta.h}` : ''}</div>
            <div className="truncate text-muted-foreground">{habitatSrc}</div>
          </div>

          {/* Overlay for better pet visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Animated Bubbles for Fish Tank */}
        {currentPet === 'fish' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white/30 rounded-full animate-bounce"
                style={{
                  width: `${8 + Math.random() * 12}px`,
                  height: `${8 + Math.random() * 12}px`,
                  left: `${10 + Math.random() * 80}%`,
                  bottom: `${Math.random() * 30}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Pet */}
        <div 
          className={`absolute z-10 transition-all ease-out ${
            currentPet === 'bunny' && bunnyState.isHopping ? 'duration-600' : 'duration-700'
          }`}
          style={{ 
            left: `${currentPet === 'bunny' ? bunnyState.position.x : fishState.position.x}%`, 
            top: `${currentPet === 'bunny' ? bunnyState.position.y : fishState.position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`relative ${
            currentPet === 'fish' ? 'animate-swim' : ''
          } ${
            currentPet === 'bunny' && bunnyState.isHopping ? 'animate-hop' : ''
          } ${
            (currentPet === 'bunny' && bunnyState.action === 'playing') ||
            (currentPet === 'fish' && fishState.action === 'playing')
              ? 'animate-wiggle' : ''
          }`}>
            {/* Pet Image */}
            <img 
              src={currentPet === 'bunny' ? getBunnyImage() : getFishImage()}
              alt={currentPet === 'bunny' ? 'Lola the bunny' : 'Goldie the fish'}
              className={`w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl transition-all duration-300 ${
                bunnyState.action === 'eating' || fishState.action === 'eating' ? 'scale-110' : ''
              } ${currentPet === 'bunny' ? 'saturate-[0.95] contrast-[1.05]' : ''}`}
              style={{
                filter: 'drop-shadow(0 10px 18px hsl(var(--foreground) / 0.25))',
                transform: currentPet === 'bunny' && !bunnyState.facingRight ? 'scaleX(-1)' : 'scaleX(1)'
              }}
            />
            
            {/* Ground shadow that grows/shrinks with hop */}
            {currentPet === 'bunny' && (
              <div 
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground/15 blur-sm transition-all duration-300 ${
                  bunnyState.isHopping ? 'w-12 h-2 opacity-30' : 'w-16 h-3 opacity-50'
                }`}
              />
            )}
            
            {/* Speech Bubbles */}
            {(bunnyState.action !== 'idle' || fishState.action !== 'idle') && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card px-4 py-2 rounded-2xl shadow-strong border-4 border-primary animate-bounce-slow whitespace-nowrap">
                <span className="text-lg font-bold">
                  {currentPet === 'bunny' && bunnyState.action === 'eating' && '🥕 Nom nom!'}
                  {currentPet === 'bunny' && bunnyState.action === 'drinking' && '💧 Gulp gulp!'}
                  {currentPet === 'bunny' && bunnyState.action === 'playing' && '🎾 Wheee!'}
                  {currentPet === 'fish' && fishState.action === 'eating' && '😋 Yummy!'}
                  {currentPet === 'fish' && fishState.action === 'playing' && '💫 Splash!'}
                </span>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-b-4 border-r-4 border-primary rotate-45" />
              </div>
            )}

            {/* Mood Indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            onClick={playWithPet} 
            disabled={gameState.locked || (currentPet === 'bunny' ? bunnyState.action !== 'idle' : fishState.action !== 'idle')} 
            className="pet-button-play"
          >
            🎾 Play
          </button>
          <div className="flex items-center justify-center text-3xl font-bold">
            {currentPet === 'bunny' 
              ? (bunnyState.mood === 'happy' ? '🐰💕' : bunnyState.mood === 'sad' ? '🐰😢' : '🐰')
              : (fishState.mood === 'happy' ? '🐠💕' : fishState.mood === 'sad' ? '🐠😢' : '🐠')
            }
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClassroomPets;
