import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Local storage keys
const STORAGE_KEYS = {
  PROGRESS: 'lola_progress',
  PROMPT_DISMISSED: 'lola_prompt_dismissed_at',
  FIRST_PLAY: 'lola_first_play_at',
  SESSION_START: 'lola_session_start',
  CELEBRATED_MILESTONES: 'lola_celebrated_milestones',
} as const;

interface Progress {
  lastFed: string | null;
  lastWatered: string | null;
  lastPlayed: string | null;
  lastSlept: string | null;
  totalSessions: number;
  totalMinutes: number;
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  lolaTimeRemaining: number;
  petState: Record<string, any> | null;
  // Unlockable toys
  unlockedToys: string[];
  playSessions: number;
  choresCompleted: number;
  schoolPoints: number;
  // First toy selection tracking
  hasSelectedFirstToy: boolean;
  // Total care actions (feed/water/play/nap/clean)
  totalCareActions: number;
}

interface Milestone {
  id: string;
  type: 'streak' | 'chores' | 'sessions' | 'school';
  value: number;
  title: string;
  emoji: string;
  message: string;
  bonusMinutes: number;
}

interface ProgressContextType {
  progress: Progress;
  isGuest: boolean;
  isSyncing: boolean;
  showAccountPrompt: boolean;
  dismissAccountPrompt: () => void;
  updateProgress: (updates: Partial<Progress>) => void;
  recordCareAction: (action: 'fed' | 'watered' | 'played' | 'slept') => void;
  savePetState: (state: Record<string, any>) => void;
  migrateToAccount: () => Promise<void>;
  // Toys
  unlockedToys: string[];
  unlockToy: (toyId: string) => void;
  checkToyUnlock: () => string | null; // Returns newly unlocked toy ID if any
  recordPlaySession: () => void;
  pendingUnlock: string | null;
  clearPendingUnlock: () => void;
  // Milestones
  pendingMilestone: Milestone | null;
  clearPendingMilestone: () => void;
  addBonusTime: (minutes: number) => void;
  celebratedMilestones: string[];
  triggerAccountPrompt: () => void;
}

const defaultProgress: Progress = {
  lastFed: null,
  lastWatered: null,
  lastPlayed: null,
  lastSlept: null,
  totalSessions: 0,
  totalMinutes: 0,
  daysActive: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  lolaTimeRemaining: 30,
  petState: null,
  unlockedToys: ['hayPile'],
  playSessions: 0,
  choresCompleted: 0,
  schoolPoints: 0,
  hasSelectedFirstToy: false,
  totalCareActions: 0,
};

// Toy unlock requirements - based on care actions (feed/water/play/nap/clean)
const TOY_REQUIREMENTS: Record<string, { type: 'careActions'; value: number }> = {
  hayPile: { type: 'careActions', value: 0 }, // starter toy
  balloon: { type: 'careActions', value: 10 },
  cardboard: { type: 'careActions', value: 25 },
  yarn: { type: 'careActions', value: 50 },
  trampoline: { type: 'careActions', value: 100 },
  tunnel: { type: 'careActions', value: 200 },
};

// Milestone definitions for celebrations
const MILESTONES: Milestone[] = [
  // Streak milestones
  { id: 'streak-3', type: 'streak', value: 3, title: '3-Day Streak!', emoji: '🔥', message: 'Great start! Keep it up!', bonusMinutes: 5 },
  { id: 'streak-7', type: 'streak', value: 7, title: '7-Day Streak!', emoji: '🎉', message: "A whole week! You're amazing!", bonusMinutes: 10 },
  { id: 'streak-14', type: 'streak', value: 14, title: '2-Week Streak!', emoji: '🌟', message: "Two weeks strong! You're a superstar!", bonusMinutes: 15 },
  { id: 'streak-30', type: 'streak', value: 30, title: '30-Day Streak!', emoji: '🏆', message: 'A whole month! Incredible!', bonusMinutes: 30 },
  { id: 'streak-100', type: 'streak', value: 100, title: '100-Day Streak!', emoji: '👑', message: 'LEGENDARY! 100 days!', bonusMinutes: 60 },
  // Chore milestones
  { id: 'chores-5', type: 'chores', value: 5, title: '5 Chores Done!', emoji: '✨', message: 'Great helper!', bonusMinutes: 3 },
  { id: 'chores-10', type: 'chores', value: 10, title: '10 Chores Done!', emoji: '🌈', message: 'Super helpful!', bonusMinutes: 5 },
  { id: 'chores-25', type: 'chores', value: 25, title: '25 Chores Done!', emoji: '⭐', message: 'Chore champion!', bonusMinutes: 10 },
  { id: 'chores-50', type: 'chores', value: 50, title: '50 Chores Done!', emoji: '🎖️', message: 'Master helper!', bonusMinutes: 15 },
  { id: 'chores-100', type: 'chores', value: 100, title: '100 Chores Done!', emoji: '🏅', message: 'Chore legend!', bonusMinutes: 30 },
  // Session milestones
  { id: 'sessions-10', type: 'sessions', value: 10, title: '10 Play Sessions!', emoji: '🎮', message: 'Lola loves seeing you!', bonusMinutes: 5 },
  { id: 'sessions-50', type: 'sessions', value: 50, title: '50 Play Sessions!', emoji: '🎈', message: 'Best friends forever!', bonusMinutes: 10 },
  { id: 'sessions-100', type: 'sessions', value: 100, title: '100 Play Sessions!', emoji: '💫', message: 'Super duper best friends!', bonusMinutes: 15 },
];

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState<string | null>(null);
  const [pendingMilestone, setPendingMilestone] = useState<Milestone | null>(null);
  const [celebratedMilestones, setCelebratedMilestones] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CELEBRATED_MILESTONES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const prevProgressRef = useRef<Progress | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const minuteTrackerRef = useRef<NodeJS.Timeout | null>(null);

  const isGuest = !user;

  // Load progress from localStorage or Supabase
  useEffect(() => {
    const loadProgress = async () => {
      if (user) {
        // Load from Supabase for authenticated users
        setIsSyncing(true);
        try {
          const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            setProgress({
              lastFed: data.last_fed,
              lastWatered: data.last_watered,
              lastPlayed: data.last_played,
              lastSlept: data.last_slept,
              totalSessions: data.total_sessions,
              totalMinutes: data.total_minutes,
              daysActive: data.days_active,
              currentStreak: data.current_streak,
              longestStreak: data.longest_streak,
              lastActiveDate: data.last_active_date,
              lolaTimeRemaining: data.lola_time_remaining,
              petState: data.pet_state as Record<string, any> | null,
              unlockedToys: data.unlocked_toys || ['hayPile'],
              playSessions: data.play_sessions || 0,
              choresCompleted: data.chores_completed || 0,
              schoolPoints: data.school_points || 0,
              // If they've ever played, they've selected a toy
              hasSelectedFirstToy: (data.play_sessions || 0) > 0,
              // Calculate total care actions from play sessions (approximation for existing users)
              totalCareActions: (data.play_sessions || 0) + (data.total_sessions || 0),
            });
          } else {
            // Create new progress record for this user
            await supabase.from('user_progress').insert({
              user_id: user.id,
              total_sessions: 1,
            });
            setProgress({ ...defaultProgress, totalSessions: 1 });
          }
        } catch (err) {
          console.error('Failed to load progress:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Load from localStorage for guests
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
          if (stored) {
            setProgress(JSON.parse(stored));
          }
        } catch {
          // ignore
        }
      }
    };

    loadProgress();
  }, [user]);

  // Save progress to localStorage for guests, or Supabase for authenticated users
  const saveProgress = useCallback(async (newProgress: Progress) => {
    if (user) {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('user_progress')
          .update({
            last_fed: newProgress.lastFed,
            last_watered: newProgress.lastWatered,
            last_played: newProgress.lastPlayed,
            last_slept: newProgress.lastSlept,
            total_sessions: newProgress.totalSessions,
            total_minutes: newProgress.totalMinutes,
            days_active: newProgress.daysActive,
            current_streak: newProgress.currentStreak,
            longest_streak: newProgress.longestStreak,
            last_active_date: newProgress.lastActiveDate,
            lola_time_remaining: newProgress.lolaTimeRemaining,
            pet_state: newProgress.petState,
            unlocked_toys: newProgress.unlockedToys,
            play_sessions: newProgress.playSessions,
            chores_completed: newProgress.choresCompleted,
            school_points: newProgress.schoolPoints,
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error('Failed to save progress:', err);
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Save to localStorage for guests
      try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(newProgress));
      } catch {
        // ignore
      }
    }
  }, [user]);

  // Update progress
  const updateProgress = useCallback((updates: Partial<Progress>) => {
    setProgress(prev => {
      const newProgress = { ...prev, ...updates };
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  // Record care action (feed/water/play/nap/clean)
  const recordCareAction = useCallback((action: 'fed' | 'watered' | 'played' | 'slept') => {
    const now = new Date().toISOString();
    const actionKey = `last${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof Progress;
    
    // Increment total care actions for toy unlocks
    setProgress(prev => {
      const newProgress = {
        ...prev,
        [actionKey]: now,
        totalCareActions: (prev.totalCareActions || 0) + 1,
      };
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  // Save pet state
  const savePetState = useCallback((state: Record<string, any>) => {
    updateProgress({ petState: state });
  }, [updateProgress]);

  // Track session time
  useEffect(() => {
    // Record session start
    const now = Date.now();
    sessionStartRef.current = now;
    
    // Record first play time for guests
    if (!user) {
      const firstPlay = localStorage.getItem(STORAGE_KEYS.FIRST_PLAY);
      if (!firstPlay) {
        localStorage.setItem(STORAGE_KEYS.FIRST_PLAY, now.toString());
      }
    }

    // Increment session count on mount
    setProgress(prev => {
      const newProgress = { ...prev, totalSessions: prev.totalSessions + 1 };
      saveProgress(newProgress);
      return newProgress;
    });

    // Track minutes played
    minuteTrackerRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = { ...prev, totalMinutes: prev.totalMinutes + 1 };
        saveProgress(newProgress);
        return newProgress;
      });
    }, 60000); // Every minute

    return () => {
      if (minuteTrackerRef.current) {
        clearInterval(minuteTrackerRef.current);
      }
    };
  }, [user, saveProgress]);

  // Check if we should show account prompt (5 minutes of play for guests)
  useEffect(() => {
    if (user) {
      setShowAccountPrompt(false);
      return;
    }

    const checkPrompt = () => {
      const dismissed = localStorage.getItem(STORAGE_KEYS.PROMPT_DISMISSED);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        
        // Don't show again within 7 days, unless 14 days for gentle reminder
        if (dismissedAt > sevenDaysAgo) {
          setShowAccountPrompt(false);
          return;
        }
        
        // Gentle reminder after 14 days
        if (dismissedAt > fourteenDaysAgo) {
          // Only show if we haven't shown again since then
          const firstPlay = localStorage.getItem(STORAGE_KEYS.FIRST_PLAY);
          if (firstPlay && Date.now() - parseInt(firstPlay, 10) > 14 * 24 * 60 * 60 * 1000) {
            setShowAccountPrompt(true);
          }
          return;
        }
      }

      // Check if 5 minutes have passed since first play
      const firstPlay = localStorage.getItem(STORAGE_KEYS.FIRST_PLAY);
      if (firstPlay) {
        const elapsed = Date.now() - parseInt(firstPlay, 10);
        if (elapsed >= 5 * 60 * 1000) { // 5 minutes
          setShowAccountPrompt(true);
        }
      }
    };

    // Check immediately and every minute
    checkPrompt();
    const interval = setInterval(checkPrompt, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Dismiss account prompt
  const dismissAccountPrompt = useCallback(() => {
    setShowAccountPrompt(false);
    localStorage.setItem(STORAGE_KEYS.PROMPT_DISMISSED, Date.now().toString());
  }, []);

  // Migrate localStorage progress to Supabase when user creates account
  const migrateToAccount = useCallback(async () => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (stored) {
        const localProgress = JSON.parse(stored) as Progress;
        
        // Merge with any existing cloud progress
        const { data: existing } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const mergedProgress = {
          last_fed: localProgress.lastFed || existing?.last_fed,
          last_watered: localProgress.lastWatered || existing?.last_watered,
          last_played: localProgress.lastPlayed || existing?.last_played,
          last_slept: localProgress.lastSlept || existing?.last_slept,
          total_sessions: Math.max(localProgress.totalSessions, existing?.total_sessions || 0),
          total_minutes: Math.max(localProgress.totalMinutes, existing?.total_minutes || 0),
          days_active: Math.max(localProgress.daysActive, existing?.days_active || 0),
          current_streak: Math.max(localProgress.currentStreak, existing?.current_streak || 0),
          longest_streak: Math.max(localProgress.longestStreak, existing?.longest_streak || 0),
          last_active_date: localProgress.lastActiveDate || existing?.last_active_date,
          lola_time_remaining: localProgress.lolaTimeRemaining,
          pet_state: localProgress.petState || existing?.pet_state,
        };

        if (existing) {
          await supabase
            .from('user_progress')
            .update(mergedProgress)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_progress')
            .insert({ user_id: user.id, ...mergedProgress });
        }
      }
    } catch (err) {
      console.error('Failed to migrate progress:', err);
    }
  }, [user, toast]);

  // Auto-migrate when user signs in
  useEffect(() => {
    if (user) {
      migrateToAccount();
    }
  }, [user, migrateToAccount]);

  // Update streak logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (progress.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      let newDaysActive = progress.daysActive + 1;
      
      if (progress.lastActiveDate === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak = progress.currentStreak + 1;
      }
      
      const newLongest = Math.max(newStreak, progress.longestStreak);
      
      updateProgress({
        lastActiveDate: today,
        currentStreak: newStreak,
        longestStreak: newLongest,
        daysActive: newDaysActive,
      });
    }
  }, [progress.lastActiveDate, progress.currentStreak, progress.longestStreak, progress.daysActive, updateProgress]);

  // Unlock a specific toy
  const unlockToy = useCallback((toyId: string) => {
    if (progress.unlockedToys.includes(toyId)) return;
    
    const newUnlocked = [...progress.unlockedToys, toyId];
    updateProgress({ unlockedToys: newUnlocked });
    setPendingUnlock(toyId);
  }, [progress.unlockedToys, updateProgress]);

  // Check if any toy should be unlocked based on current progress
  const checkToyUnlock = useCallback((): string | null => {
    for (const [toyId, req] of Object.entries(TOY_REQUIREMENTS)) {
      if (progress.unlockedToys.includes(toyId)) continue;
      
      // All toys now unlock based on care actions
      const current = progress.totalCareActions;
      
      if (current >= req.value) {
        unlockToy(toyId);
        return toyId;
      }
    }
    return null;
    return null;
  }, [progress, unlockToy]);

  // Record a play session
  const recordPlaySession = useCallback(() => {
    updateProgress({ playSessions: progress.playSessions + 1 });
  }, [progress.playSessions, updateProgress]);

  // Clear pending unlock after celebration shown
  const clearPendingUnlock = useCallback(() => {
    setPendingUnlock(null);
  }, []);

  // Clear pending milestone after celebration shown
  const clearPendingMilestone = useCallback(() => {
    setPendingMilestone(null);
  }, []);

  // Add bonus time to lola time remaining
  const addBonusTime = useCallback((minutes: number) => {
    updateProgress({ lolaTimeRemaining: progress.lolaTimeRemaining + minutes });
    toast({
      title: `+${minutes} bonus minutes! ⏰`,
      description: "Added to your Lola time!",
    });
  }, [progress.lolaTimeRemaining, updateProgress, toast]);

  // Trigger account prompt manually (for testing)
  const triggerAccountPrompt = useCallback(() => {
    setShowAccountPrompt(true);
  }, []);

  // Check for milestone achievements when progress changes
  useEffect(() => {
    if (!prevProgressRef.current) {
      prevProgressRef.current = progress;
      return;
    }
    
    const prev = prevProgressRef.current;
    
    // Check for newly achieved milestones
    for (const milestone of MILESTONES) {
      if (celebratedMilestones.includes(milestone.id)) continue;
      
      let prevValue = 0;
      let currentValue = 0;
      
      switch (milestone.type) {
        case 'streak':
          prevValue = prev.currentStreak;
          currentValue = progress.currentStreak;
          break;
        case 'chores':
          prevValue = prev.choresCompleted;
          currentValue = progress.choresCompleted;
          break;
        case 'sessions':
          prevValue = prev.playSessions;
          currentValue = progress.playSessions;
          break;
        case 'school':
          prevValue = prev.schoolPoints;
          currentValue = progress.schoolPoints;
          break;
      }
      
      // Check if we just crossed this milestone threshold
      if (currentValue >= milestone.value && prevValue < milestone.value) {
        setPendingMilestone(milestone);
        // Mark as celebrated
        const newCelebrated = [...celebratedMilestones, milestone.id];
        setCelebratedMilestones(newCelebrated);
        try {
          localStorage.setItem(STORAGE_KEYS.CELEBRATED_MILESTONES, JSON.stringify(newCelebrated));
        } catch {
          // ignore
        }
        break; // Only show one milestone at a time
      }
    }
    
    prevProgressRef.current = progress;
  }, [progress, celebratedMilestones]);

  return (
    <ProgressContext.Provider value={{
      progress,
      isGuest,
      isSyncing,
      showAccountPrompt,
      dismissAccountPrompt,
      updateProgress,
      recordCareAction,
      savePetState,
      migrateToAccount,
      unlockedToys: progress.unlockedToys,
      unlockToy,
      checkToyUnlock,
      recordPlaySession,
      pendingUnlock,
      clearPendingUnlock,
      pendingMilestone,
      clearPendingMilestone,
      addBonusTime,
      celebratedMilestones,
      triggerAccountPrompt,
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
