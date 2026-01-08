import React from 'react';

interface BowlStationProps {
  petName: string;
  foodLevel: number;
  waterLevel: number;
  scene: 'habitat' | 'room' | 'park';
  targetObject: 'food-bowl' | 'water-bowl' | 'toy-area' | null;
}

const BowlStation: React.FC<BowlStationProps> = ({ 
  petName, 
  foodLevel, 
  waterLevel, 
  scene,
  targetObject 
}) => {
  // Scene-specific styling
  const getMatStyle = () => {
    switch (scene) {
      case 'park':
        return 'bg-gradient-to-b from-amber-700/90 to-amber-900/90 border-amber-950';
      case 'room':
        return 'bg-gradient-to-b from-rose-800/90 to-rose-950/90 border-rose-950';
      default: // habitat
        return 'bg-gradient-to-b from-amber-600/90 to-amber-800/90 border-amber-900';
    }
  };

  const getMatPattern = () => {
    switch (scene) {
      case 'park':
        return 'before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] before:bg-[size:8px_8px]';
      case 'room':
        return 'before:bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%)] before:bg-[size:6px_6px]';
      default:
        return 'before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08)_1px,transparent_1px)] before:bg-[size:6px_6px]';
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Pet Name Plate */}
      <div className={`
        px-3 py-0.5 rounded-t-md text-[10px] sm:text-xs font-bold tracking-wide
        ${scene === 'park' 
          ? 'bg-amber-800 text-amber-100 border border-b-0 border-amber-950' 
          : scene === 'room'
          ? 'bg-rose-900 text-rose-100 border border-b-0 border-rose-950'
          : 'bg-amber-700 text-amber-100 border border-b-0 border-amber-900'}
      `}>
        {petName}
      </div>
      
      {/* Mat */}
      <div className={`
        relative px-4 py-2 sm:px-6 sm:py-3 rounded-lg border-2 shadow-lg
        ${getMatStyle()}
        before:absolute before:inset-0 before:rounded-lg before:opacity-30
        ${getMatPattern()}
      `}>
        {/* Decorative stitching around mat edge */}
        <div className="absolute inset-1 rounded-md border border-dashed border-white/20 pointer-events-none" />
        
        {/* Bowls Container */}
        <div className="flex gap-3 sm:gap-5 items-end relative z-10">
          {/* Food Bowl */}
          <div 
            className={`flex flex-col items-center transition-transform duration-200 ${
              targetObject === 'food-bowl' ? 'scale-110' : ''
            }`}
          >
            <div className="relative">
              {/* Bowl outer rim */}
              <div className="w-10 h-7 sm:w-14 sm:h-9 relative">
                {/* Bowl body - ceramic style */}
                <div className={`
                  absolute inset-0 rounded-b-[100%] rounded-t-xl
                  ${scene === 'park' 
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-2 border-emerald-700' 
                    : scene === 'room'
                    ? 'bg-gradient-to-b from-pink-300 to-pink-500 border-2 border-pink-600'
                    : 'bg-gradient-to-b from-orange-400 to-orange-600 border-2 border-orange-700'}
                  shadow-inner overflow-hidden
                `}>
                  {/* Inner bowl shadow */}
                  <div className="absolute inset-x-1 top-1 h-2 bg-black/10 rounded-full blur-sm" />
                  
                  {/* Food fill with pellets/veggies */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 transition-all duration-500 overflow-hidden"
                    style={{ height: `${Math.max(0, foodLevel * 0.7)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-600 to-amber-500" />
                    {/* Pellet texture */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(139,69,19,0.4)_30%,transparent_31%)] bg-[size:4px_3px]" />
                  </div>
                  
                  {/* Carrot decoration when filled */}
                  {foodLevel > 60 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs drop-shadow">🥕</div>
                  )}
                </div>
                
                {/* Rim highlight */}
                <div className="absolute top-0 inset-x-1 h-1 bg-white/30 rounded-full blur-[1px]" />
              </div>
            </div>
            <span className={`
              text-[8px] sm:text-[10px] font-bold mt-1 uppercase tracking-wider
              ${scene === 'park' ? 'text-amber-200/80' : scene === 'room' ? 'text-rose-200/80' : 'text-amber-200/80'}
            `}>
              Food
            </span>
          </div>
          
          {/* Water Bowl */}
          <div 
            className={`flex flex-col items-center transition-transform duration-200 ${
              targetObject === 'water-bowl' ? 'scale-110' : ''
            }`}
          >
            <div className="relative">
              {/* Bowl outer rim */}
              <div className="w-10 h-7 sm:w-14 sm:h-9 relative">
                {/* Bowl body - ceramic style */}
                <div className={`
                  absolute inset-0 rounded-b-[100%] rounded-t-xl
                  ${scene === 'park' 
                    ? 'bg-gradient-to-b from-sky-400 to-sky-600 border-2 border-sky-700' 
                    : scene === 'room'
                    ? 'bg-gradient-to-b from-violet-300 to-violet-500 border-2 border-violet-600'
                    : 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-2 border-cyan-700'}
                  shadow-inner overflow-hidden
                `}>
                  {/* Inner bowl shadow */}
                  <div className="absolute inset-x-1 top-1 h-2 bg-black/10 rounded-full blur-sm" />
                  
                  {/* Water fill */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                    style={{ height: `${Math.max(0, waterLevel * 0.7)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-400/80 to-cyan-300/60" />
                    {/* Water shine */}
                    <div className="absolute top-0 inset-x-1 h-1 bg-white/40 rounded-full animate-pulse" />
                  </div>
                  
                  {/* Droplet when filled */}
                  {waterLevel > 60 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs drop-shadow">💧</div>
                  )}
                </div>
                
                {/* Rim highlight */}
                <div className="absolute top-0 inset-x-1 h-1 bg-white/30 rounded-full blur-[1px]" />
              </div>
            </div>
            <span className={`
              text-[8px] sm:text-[10px] font-bold mt-1 uppercase tracking-wider
              ${scene === 'park' ? 'text-amber-200/80' : scene === 'room' ? 'text-rose-200/80' : 'text-amber-200/80'}
            `}>
              Water
            </span>
          </div>
        </div>
        
        {/* Mat shadow underneath */}
        <div className="absolute -bottom-1 inset-x-2 h-2 bg-black/20 rounded-full blur-sm" />
      </div>
    </div>
  );
};

export default BowlStation;
