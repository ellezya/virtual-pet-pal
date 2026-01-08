import React, { useState, useEffect } from 'react';
import { RotateCcw, Lock, Unlock, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ClassroomPets = () => {
  const { signOut, user } = useAuth();
  const [currentPet, setCurrentPet] = useState('bunny');
  const [currentScene, setCurrentScene] = useState('habitat');
  
  const [bunnyState, setBunnyState] = useState({
    hunger: 80,
    happiness: 85,
    hydration: 75,
    energy: 70,
    mood: 'happy',
    action: 'idle',
    position: { x: 50, y: 60 }
  });

  const [fishState, setFishState] = useState({
    hunger: 70,
    happiness: 80,
    tankCleanliness: 95,
    mood: 'calm',
    position: { x: 50, y: 50 }
  });

  const [gameState, setGameState] = useState({
    locked: false,
    notifications: [] as string[]
  });

  const [animation, setAnimation] = useState('idle');

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
        if (newState.hunger < 30) newState.mood = 'sad';
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
        if (newState.hunger < 30) newState.mood = 'hungry';
        else if (newState.happiness > 70) newState.mood = 'happy';
        else newState.mood = 'calm';
        return newState;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [currentPet]);

  // Auto-move bunny
  useEffect(() => {
    if (currentPet !== 'bunny' || bunnyState.action !== 'idle') return;
    const moveInterval = setInterval(() => {
      setBunnyState(prev => ({
        ...prev,
        position: {
          x: Math.max(20, Math.min(80, prev.position.x + (Math.random() - 0.5) * 20)),
          y: Math.max(40, Math.min(70, prev.position.y + (Math.random() - 0.5) * 15))
        }
      }));
    }, 2000);
    return () => clearInterval(moveInterval);
  }, [currentPet, bunnyState.action]);

  // Auto-move fish
  useEffect(() => {
    if (currentPet !== 'fish') return;
    const swimInterval = setInterval(() => {
      setFishState(prev => ({
        ...prev,
        position: {
          x: Math.max(10, Math.min(90, prev.position.x + (Math.random() - 0.5) * 25)),
          y: Math.max(20, Math.min(80, prev.position.y + (Math.random() - 0.5) * 20))
        }
      }));
    }, 1500);
    return () => clearInterval(swimInterval);
  }, [currentPet]);

  // Notifications
  useEffect(() => {
    const checkNeeds = setInterval(() => {
      const notifications: string[] = [];
      if (currentPet === 'bunny') {
        if (bunnyState.hunger < 30) notifications.push('🥕 Lola is hungry!');
        if (bunnyState.hydration < 30) notifications.push('💧 Water low!');
      } else if (currentPet === 'fish') {
        if (fishState.hunger < 30) notifications.push('🐠 Fish hungry!');
        if (fishState.tankCleanliness < 40) notifications.push('🧽 Tank dirty!');
      }
      setGameState(prev => ({ ...prev, notifications }));
    }, 5000);
    return () => clearInterval(checkNeeds);
  }, [currentPet, bunnyState, fishState]);

  const doAction = (actionType: string, duration = 3000) => {
    if (gameState.locked) return;
    setAnimation(actionType);
    if (currentPet === 'bunny') {
      setBunnyState(prev => ({ ...prev, action: actionType }));
    }
    setTimeout(() => {
      setAnimation('idle');
      if (currentPet === 'bunny') {
        setBunnyState(prev => ({ ...prev, action: 'idle' }));
      }
    }, duration);
  };

  const feedPet = () => {
    if (gameState.locked) return;
    if (currentPet === 'bunny') {
      doAction('eating', 4000);
      setBunnyState(prev => ({ ...prev, hunger: Math.min(100, prev.hunger + 40), happiness: Math.min(100, prev.happiness + 10) }));
    } else {
      setAnimation('eating');
      setTimeout(() => setAnimation('idle'), 2000);
      setFishState(prev => ({ ...prev, hunger: Math.min(100, prev.hunger + 50), happiness: Math.min(100, prev.happiness + 10) }));
    }
  };

  const waterBunny = () => {
    if (gameState.locked || currentPet !== 'bunny') return;
    doAction('drinking', 3000);
    setBunnyState(prev => ({ ...prev, hydration: Math.min(100, prev.hydration + 50), happiness: Math.min(100, prev.happiness + 5) }));
  };

  const playWithPet = () => {
    if (gameState.locked) return;
    if (currentPet === 'bunny') {
      doAction('playing', 6000);
      setBunnyState(prev => ({ ...prev, happiness: Math.min(100, prev.happiness + 25), energy: Math.max(0, prev.energy - 15) }));
    } else {
      setAnimation('playing');
      setTimeout(() => setAnimation('idle'), 3000);
      setFishState(prev => ({ ...prev, happiness: Math.min(100, prev.happiness + 20) }));
    }
  };

  const cleanHabitat = () => {
    if (gameState.locked) return;
    if (currentPet === 'fish') {
      setAnimation('cleaning');
      setTimeout(() => setAnimation('idle'), 4000);
      setFishState(prev => ({ ...prev, tankCleanliness: 100, happiness: Math.min(100, prev.happiness + 15) }));
    }
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
        position: { x: 50, y: 60 }
      });
    } else {
      setFishState({
        hunger: 70,
        happiness: 80,
        tankCleanliness: 95,
        mood: 'calm',
        position: { x: 50, y: 50 }
      });
    }
  };

  const getStatusColor = (value: number) => {
    if (value > 70) return 'bg-status-good';
    if (value > 40) return 'bg-status-medium';
    return 'bg-status-low';
  };

  return (
    <div className="w-full h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card shadow-medium p-4 flex justify-between items-center z-10">
        <div className="flex gap-3 items-center">
          <h1 className="text-2xl font-extrabold text-foreground">🐰 Lola's Classroom</h1>
          <button 
            onClick={() => setGameState(prev => ({ ...prev, locked: !prev.locked }))} 
            className={`control-button ${gameState.locked ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}
          >
            {gameState.locked ? <Lock size={20} /> : <Unlock size={20} />}
          </button>
          <button 
            onClick={resetPet} 
            className="control-button bg-secondary/20 text-secondary"
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
              className={currentScene === 'habitat' ? 'scene-button-active bg-habitat-grass text-primary-foreground' : 'scene-button-inactive'}
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
              className={currentScene === 'park' ? 'scene-button-active bg-park-grass text-primary-foreground' : 'scene-button-inactive'}
            >
              🌳 Park
            </button>
          </>
        )}
      </nav>

      {/* Main Scene */}
      <main className="flex-1 relative overflow-hidden">
        {/* Fish Tank Scene */}
        {currentPet === 'fish' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-tank-water via-tank-water to-tank-deep" />
            <div className="absolute bottom-0 h-[20%] w-full bg-gradient-to-t from-tank-sand to-tank-sand/80" />
            {/* Coral */}
            <div className="absolute bottom-[15%] left-[10%] w-[15%] h-[25%] bg-gradient-to-b from-bunny-pink to-destructive rounded-t-full opacity-90" />
            {/* Seaweed */}
            <div className="absolute top-[30%] left-[15%] w-[20%] h-[25%] bg-habitat-grass rounded-full opacity-70 animate-pulse-soft" />
            <div className="absolute top-[40%] right-[20%] w-[15%] h-[30%] bg-habitat-grass rounded-full opacity-60 animate-pulse-soft" />
            {/* Bubbles */}
            <div className="absolute top-[20%] left-[30%] w-3 h-3 bg-card/40 rounded-full animate-bounce" />
            <div className="absolute top-[35%] left-[60%] w-2 h-2 bg-card/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
        )}
        
        {/* Bunny Habitat Scene */}
        {currentPet === 'bunny' && currentScene === 'habitat' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-habitat-sky to-habitat-sky/60" />
            <div className="absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-habitat-ground to-habitat-ground/80" />
            {/* Wooden platform */}
            <div className="absolute bottom-[40%] left-[10%] w-[30%] h-[8%] bg-room-floor rounded-lg shadow-strong" />
            {/* House */}
            <div className="absolute bottom-[25%] left-[15%] w-[20%] h-[20%]">
              <div className="absolute bottom-0 w-full h-[70%] bg-destructive/80 rounded-t-lg shadow-medium" />
              <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[35%] h-[50%] bg-room-floor rounded-lg" />
            </div>
            {/* Water bottle */}
            <div className="absolute top-[30%] left-[20%] w-[5%] h-[20%] bg-secondary/60 rounded-full border-2 border-secondary shadow-soft" />
            {/* Food bowl */}
            <div className="absolute bottom-[28%] right-[30%] w-[12%] h-[8%] bg-bunny-pink rounded-full border-4 border-bunny-pink/80 shadow-medium" />
          </div>
        )}

        {/* Room Scene */}
        {currentPet === 'bunny' && currentScene === 'room' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-room-wall via-room-wall/90 to-secondary/30" />
            <div className="absolute bottom-0 h-[40%] w-full bg-gradient-to-t from-room-floor to-room-floor/90" />
            {/* Rug */}
            <div className="absolute bottom-[5%] left-[20%] w-[60%] h-[30%] bg-gradient-to-br from-destructive/70 to-accent/70 rounded-3xl shadow-strong border-8 border-warning/60" />
            {/* Couch */}
            <div className="absolute bottom-[15%] right-[10%] w-[25%] h-[20%] bg-gradient-to-b from-secondary to-secondary/80 rounded-t-3xl shadow-medium" />
            {/* Window */}
            <div className="absolute top-[10%] right-[20%] w-[25%] h-[35%] bg-gradient-to-b from-habitat-sky to-secondary/40 rounded-lg border-8 border-card shadow-strong" />
          </div>
        )}

        {/* Park Scene */}
        {currentPet === 'bunny' && currentScene === 'park' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-park-sky via-park-sky/80 to-habitat-grass/40">
              {/* Cloud */}
              <div className="absolute top-[10%] left-[20%] w-24 h-12 bg-card rounded-full opacity-90 shadow-soft" />
              <div className="absolute top-[8%] left-[25%] w-16 h-10 bg-card rounded-full opacity-90" />
              {/* Sun */}
              <div className="absolute top-[5%] right-[10%] w-20 h-20 bg-warning rounded-full shadow-strong animate-pulse-soft" />
            </div>
            <div className="absolute bottom-0 h-[45%] w-full bg-gradient-to-t from-park-grass to-habitat-grass" />
            {/* Path */}
            <div className="absolute bottom-0 left-[20%] right-[20%] h-[25%] bg-gradient-to-t from-park-path to-park-path/80 rounded-t-full" />
            {/* Tree */}
            <div className="absolute bottom-[30%] left-[10%] w-[12%] h-[35%]">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[25%] h-[40%] bg-room-floor" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[70%] bg-park-grass rounded-full shadow-medium" />
            </div>
          </div>
        )}

        {/* Bunny Pet */}
        {currentPet === 'bunny' && (
          <div 
            className="absolute transition-all duration-700 ease-in-out z-10" 
            style={{ 
              left: `${bunnyState.position.x}%`, 
              bottom: `${bunnyState.position.y}%`, 
              transform: 'translate(-50%, 50%)' 
            }}
          >
            <div className={`relative ${animation === 'playing' ? 'animate-wiggle' : ''}`}>
              {/* Ears */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2">
                <div 
                  className={`w-5 h-20 rounded-full shadow-medium border-2 border-card ${bunnyState.mood === 'sad' ? 'bg-bunny-sad' : bunnyState.mood === 'happy' ? 'bg-bunny-happy' : 'bg-bunny-neutral'}`}
                  style={{ transform: 'rotate(-20deg)' }}
                >
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-12 bg-bunny-pink/60 rounded-full" />
                </div>
                <div 
                  className={`w-5 h-20 rounded-full shadow-medium border-2 border-card ${bunnyState.mood === 'sad' ? 'bg-bunny-sad' : bunnyState.mood === 'happy' ? 'bg-bunny-happy' : 'bg-bunny-neutral'}`}
                  style={{ transform: 'rotate(20deg)' }}
                >
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-12 bg-bunny-pink/60 rounded-full" />
                </div>
              </div>
              
              {/* Head */}
              <div className={`w-20 h-20 rounded-full relative shadow-strong border-4 border-card ${bunnyState.mood === 'sad' ? 'bg-bunny-sad' : bunnyState.mood === 'happy' ? 'bg-bunny-happy' : 'bg-bunny-neutral'}`}>
                {/* Whiskers */}
                <div className="absolute left-0 top-1/2 w-8 h-0.5 bg-foreground/40 -translate-x-full" />
                <div className="absolute left-0 top-[45%] w-7 h-0.5 bg-foreground/40 -translate-x-full rotate-12" />
                <div className="absolute right-0 top-1/2 w-8 h-0.5 bg-foreground/40 translate-x-full" />
                <div className="absolute right-0 top-[45%] w-7 h-0.5 bg-foreground/40 translate-x-full -rotate-12" />
                
                {/* Eyes */}
                <div className="absolute top-6 left-4 w-4 h-4 bg-foreground rounded-full">
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-card rounded-full" />
                </div>
                <div className="absolute top-6 right-4 w-4 h-4 bg-foreground rounded-full">
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-card rounded-full" />
                </div>
                
                {/* Nose */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-bunny-pink rounded-full animate-pulse-soft" />
                
                {/* Mouth */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-lg font-bold text-foreground">
                  {bunnyState.mood === 'happy' ? '⌣' : bunnyState.mood === 'sad' ? '⌢' : '–'}
                </div>
              </div>
              
              {/* Body */}
              <div className={`w-24 h-20 rounded-full mt-2 shadow-strong border-4 border-card ${bunnyState.mood === 'sad' ? 'bg-bunny-sad' : bunnyState.mood === 'happy' ? 'bg-bunny-happy' : 'bg-bunny-neutral'}`} />
              
              {/* Feet */}
              <div className={`absolute -bottom-2 left-4 w-4 h-6 rounded-full shadow-medium border-2 border-card ${bunnyState.mood === 'sad' ? 'bg-bunny-sad' : bunnyState.mood === 'happy' ? 'bg-bunny-happy' : 'bg-bunny-neutral'}`} />
              <div className={`absolute -bottom-2 right-4 w-4 h-6 rounded-full shadow-medium border-2 border-card ${bunnyState.mood === 'sad' ? 'bg-bunny-sad' : bunnyState.mood === 'happy' ? 'bg-bunny-happy' : 'bg-bunny-neutral'}`} />
              
              {/* Tail */}
              <div className={`absolute -bottom-2 -right-6 w-8 h-8 rounded-full shadow-medium border-2 border-card ${bunnyState.mood === 'sad' ? 'bg-bunny-sad' : bunnyState.mood === 'happy' ? 'bg-bunny-happy' : 'bg-bunny-neutral'}`} />
              
              {/* Speech bubbles */}
              {animation === 'eating' && <div className="speech-bubble">🥕 Nom nom!</div>}
              {animation === 'playing' && <div className="speech-bubble">🎾 Wheee!</div>}
              {animation === 'drinking' && <div className="speech-bubble">💧 Gulp!</div>}
            </div>
          </div>
        )}

        {/* Fish Pet */}
        {currentPet === 'fish' && (
          <div 
            className="absolute transition-all duration-1000 ease-in-out z-10 animate-swim" 
            style={{ 
              left: `${fishState.position.x}%`, 
              top: `${fishState.position.y}%`, 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <div className="relative">
              {/* Body */}
              <div className="w-16 h-10 bg-gradient-to-r from-fish-orange via-fish-yellow to-fish-orange rounded-full shadow-medium border-2 border-fish-orange relative">
                {/* Eye */}
                <div className="absolute top-2 left-3 w-3 h-3 bg-foreground rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-card rounded-full" />
                </div>
                {/* Fin */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-6 bg-fish-tail/80 rounded-full" />
              </div>
              {/* Tail */}
              <div 
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-r from-fish-orange to-fish-tail opacity-90" 
                style={{ clipPath: 'polygon(0 0, 100% 30%, 100% 70%, 0 100%)' }} 
              />
              
              {/* Speech bubbles */}
              {animation === 'eating' && <div className="speech-bubble">🐟 Yummy!</div>}
              {animation === 'playing' && <div className="speech-bubble">💫 Splash!</div>}
            </div>
          </div>
        )}
      </main>

      {/* Controls Panel */}
      <footer className="bg-card border-t-4 border-primary p-4 shadow-strong">
        {/* Status Bars */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {currentPet === 'bunny' ? (
            <>
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1">🥕 HUNGER</div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.hunger)}`} 
                    style={{ width: `${bunnyState.hunger}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1">💧 HYDRATION</div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.hydration)}`} 
                    style={{ width: `${bunnyState.hydration}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1">😊 HAPPINESS</div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(bunnyState.happiness)}`} 
                    style={{ width: `${bunnyState.happiness}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1">⚡ ENERGY</div>
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
                <div className="text-xs font-bold text-muted-foreground mb-1">🍽️ HUNGER</div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(fishState.hunger)}`} 
                    style={{ width: `${fishState.hunger}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1">😊 HAPPINESS</div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(fishState.happiness)}`} 
                    style={{ width: `${fishState.happiness}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-1">🧽 TANK CLEAN</div>
                <div className="status-bar">
                  <div 
                    className={`status-bar-fill ${getStatusColor(fishState.tankCleanliness)}`} 
                    style={{ width: `${fishState.tankCleanliness}%` }} 
                  />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-3xl">
                  {fishState.mood === 'happy' ? '😊' : fishState.mood === 'hungry' ? '😟' : '😌'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={feedPet} disabled={gameState.locked} className="pet-button-feed">
            🥕 Feed
          </button>
          {currentPet === 'bunny' ? (
            <button onClick={waterBunny} disabled={gameState.locked} className="pet-button-water">
              💧 Water
            </button>
          ) : (
            <button onClick={cleanHabitat} disabled={gameState.locked} className="pet-button-clean">
              🧽 Clean Tank
            </button>
          )}
          <button onClick={playWithPet} disabled={gameState.locked} className="pet-button-play">
            🎾 Play
          </button>
          <div className="flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {currentPet === 'bunny' 
              ? (bunnyState.mood === 'happy' ? '🐰💕' : bunnyState.mood === 'sad' ? '🐰😢' : '🐰')
              : '🐠'
            }
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClassroomPets;
