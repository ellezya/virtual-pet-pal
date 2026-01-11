import { Cloud, CloudOff } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

const SyncIndicator = () => {
  const { isSyncing, isGuest } = useProgress();

  if (isGuest) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
        <CloudOff className="w-3 h-3" />
        <span>Local</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-xs transition-opacity ${isSyncing ? 'opacity-100' : 'opacity-0'}`}>
      <Cloud className="w-3 h-3 text-primary animate-pulse" />
      <span className="text-muted-foreground">Syncing...</span>
    </div>
  );
};

export default SyncIndicator;
