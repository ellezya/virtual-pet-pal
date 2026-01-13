import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Hide "reconnected" message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div 
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg animate-in slide-in-from-top-2 duration-300 ${
        isOnline 
          ? 'bg-success/90 text-success-foreground' 
          : 'bg-destructive/90 text-destructive-foreground'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={12} />
          <span>Back online!</span>
        </>
      ) : (
        <>
          <WifiOff size={12} />
          <span>Offline - changes saved locally</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
