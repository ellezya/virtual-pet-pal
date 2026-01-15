import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Kid {
  id: string;
  name: string;
  age?: number;
  avatar_emoji: string;
  lola_time_from_chores: number;
  lola_time_from_school: number;
  current_streak: number;
  total_sessions: number;
  chores_completed: number;
  unlocked_toys: string[];
}

interface Chore {
  id: string;
  description: string;
  minutes_earned: number;
  frequency: string;
  kid_id?: string | null;
  is_active: boolean;
}

interface ChoreCompletion {
  id: string;
  chore_id: string;
  kid_id: string;
  completed_at: string;
  minutes_earned: number;
  approved_by?: string;
  approved_at?: string;
}

interface Family {
  id: string;
  name: string;
  family_code: string;
}

interface FamilyContextType {
  family: Family | null;
  kids: Kid[];
  chores: Chore[];
  pendingCompletions: ChoreCompletion[];
  loading: boolean;
  isParent: boolean;
  activeKid: Kid | null;
  
  // Time tracking
  timeRemaining: number; // seconds remaining for active kid
  isTimeUp: boolean;
  isTimePaused: boolean;
  pauseTime: () => void;
  resumeTime: () => void;
  
  // Family management
  createFamily: (name?: string) => Promise<string | null>;
  updateFamilyName: (name: string) => Promise<void>;
  
  // Kid management
  addKid: (name: string, pin: string, age?: number, avatarEmoji?: string) => Promise<string | null>;
  updateKid: (kidId: string, updates: Partial<Kid>) => Promise<void>;
  removeKid: (kidId: string) => Promise<void>;
  loginKid: (kidId: string, pin: string) => Promise<boolean>;
  logoutKid: () => void;
  
  // Chore management
  addChore: (description: string, minutesEarned: number, frequency: 'daily' | 'weekly' | 'once', kidId?: string) => Promise<void>;
  updateChore: (choreId: string, updates: Partial<Chore>) => Promise<void>;
  removeChore: (choreId: string) => Promise<void>;
  
  // Chore completion
  completeChore: (choreId: string, kidId: string) => Promise<void>;
  approveCompletion: (completionId: string) => Promise<void>;
  rejectCompletion: (completionId: string) => Promise<void>;
  
  // Refresh data
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

// PIN hashing is now done server-side using bcrypt via pgcrypto
// The hash_kid_pin() database function handles secure hashing

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  const [family, setFamily] = useState<Family | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<ChoreCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParent, setIsParent] = useState(false);
  const [activeKid, setActiveKid] = useState<Kid | null>(null);
  const [guestFamilyId, setGuestFamilyId] = useState<string | null>(null);
  
  // Time tracking state
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [isTimePaused, setIsTimePaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  
  // Derived state
  const isTimeUp = activeKid !== null && timeRemaining <= 0;
  
  // Initialize time when kid logs in
  useEffect(() => {
    if (activeKid) {
      const totalMinutes = activeKid.lola_time_from_chores + activeKid.lola_time_from_school;
      setTimeRemaining(totalMinutes * 60); // Convert to seconds
      setIsTimePaused(false);
    } else {
      setTimeRemaining(0);
      setIsTimePaused(false);
    }
  }, [activeKid?.id]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!activeKid || isTimePaused || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        
        // Save to database every 30 seconds
        const now = Date.now();
        if (now - lastSaveRef.current >= 30000 && activeKid) {
          lastSaveRef.current = now;
          const minutesRemaining = Math.floor(newTime / 60);
          const originalTotal = activeKid.lola_time_from_chores + activeKid.lola_time_from_school;
          const minutesUsed = originalTotal - minutesRemaining;
          
          // Deduct from chores first, then school
          let choreTime = Math.max(0, activeKid.lola_time_from_chores - minutesUsed);
          let schoolTime = activeKid.lola_time_from_school;
          if (minutesUsed > activeKid.lola_time_from_chores) {
            schoolTime = Math.max(0, activeKid.lola_time_from_school - (minutesUsed - activeKid.lola_time_from_chores));
          }
          
          supabase
            .from('kids')
            .update({
              lola_time_from_chores: choreTime,
              lola_time_from_school: schoolTime
            })
            .eq('id', activeKid.id)
            .then(() => {
              // Update local activeKid state
              setActiveKid(prev => prev ? {
                ...prev,
                lola_time_from_chores: choreTime,
                lola_time_from_school: schoolTime
              } : null);
            });
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeKid?.id, isTimePaused, timeRemaining > 0]);
  
  // Save remaining time when kid logs out or component unmounts
  useEffect(() => {
    return () => {
      if (activeKid && timeRemaining > 0) {
        const minutesRemaining = Math.floor(timeRemaining / 60);
        const originalTotal = activeKid.lola_time_from_chores + activeKid.lola_time_from_school;
        const minutesUsed = originalTotal - minutesRemaining;
        
        let choreTime = Math.max(0, activeKid.lola_time_from_chores - minutesUsed);
        let schoolTime = activeKid.lola_time_from_school;
        if (minutesUsed > activeKid.lola_time_from_chores) {
          schoolTime = Math.max(0, activeKid.lola_time_from_school - (minutesUsed - activeKid.lola_time_from_chores));
        }
        
        supabase
          .from('kids')
          .update({
            lola_time_from_chores: choreTime,
            lola_time_from_school: schoolTime
          })
          .eq('id', activeKid.id);
      }
    };
  }, [activeKid?.id, timeRemaining]);
  
  const pauseTime = useCallback(() => {
    setIsTimePaused(true);
  }, []);
  
  const resumeTime = useCallback(() => {
    setIsTimePaused(false);
  }, []);

  const refreshFamily = useCallback(async () => {
    // Check for guest family ID from URL params (using location.search from react-router)
    const urlParams = new URLSearchParams(location.search);
    const familyParam = urlParams.get('family');
    
    if (!user) {
      // Guest mode - try to load family from URL param
      if (familyParam) {
        setGuestFamilyId(familyParam);
        try {
          // Load family data for guest (limited - just enough for kid login)
          const { data: familyData } = await supabase
            .from('families')
            .select('id, name, family_code')
            .eq('id', familyParam)
            .single();
          
          if (familyData) {
            setFamily(familyData);
            
            // Load kids (limited fields for guest view)
            const { data: kidsData } = await supabase
              .from('kids')
              .select('id, name, age, avatar_emoji, lola_time_from_chores, lola_time_from_school, current_streak, total_sessions, chores_completed, unlocked_toys')
              .eq('family_id', familyData.id);
            
            setKids(kidsData || []);
          }
        } catch (error) {
          console.error('Error loading guest family:', error);
        }
      } else {
        setFamily(null);
        setKids([]);
      }
      setChores([]);
      setPendingCompletions([]);
      setLoading(false);
      setIsParent(false);
      return;
    }

    try {
      // Check if user has parent role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const hasParentRole = roles?.some(r => r.role === 'parent') ?? false;
      setIsParent(hasParentRole);

      // Get user's profile to find family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (profile?.family_id) {
        // Load family
        const { data: familyData } = await supabase
          .from('families')
          .select('*')
          .eq('id', profile.family_id)
          .single();
        
        if (familyData) {
          setFamily(familyData);

          // Load kids
          const { data: kidsData } = await supabase
            .from('kids')
            .select('id, name, age, avatar_emoji, lola_time_from_chores, lola_time_from_school, current_streak, total_sessions, chores_completed, unlocked_toys')
            .eq('family_id', familyData.id);
          
          setKids(kidsData || []);

          // Load chores
          const { data: choresData, error: choresError } = await supabase
            .from('chores')
            .select('*')
            .eq('family_id', familyData.id);
          
          console.log('[Family] Loaded chores for family', familyData.id, ':', choresData, choresError);
          setChores(choresData || []);

          // Load pending completions (not yet approved)
          const { data: completionsData } = await supabase
            .from('chore_completions')
            .select('*')
            .is('approved_at', null);
          
          setPendingCompletions(completionsData || []);
        }
      } else {
        setFamily(null);
        setKids([]);
        setChores([]);
        setPendingCompletions([]);
      }
    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, location.search]);

  useEffect(() => {
    refreshFamily();
  }, [refreshFamily]);

  const createFamily = async (name = 'My Family'): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('create-family', {
        body: { name }
      });

      if (error) throw error;

      const familyId = (data as any)?.family_id as string | undefined;
      if (!familyId) {
        throw new Error('Failed to create family');
      }

      await refreshFamily();
      return familyId;
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({
        title: 'Error creating family',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateFamilyName = async (name: string) => {
    if (!family) return;

    try {
      await supabase
        .from('families')
        .update({ name })
        .eq('id', family.id);
      
      await refreshFamily();
    } catch (error: any) {
      toast({
        title: 'Error updating family',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const addKid = async (name: string, pin: string, age?: number, avatarEmoji = '👶'): Promise<string | null> => {
    if (!family) return null;

    try {
      // Hash PIN server-side using bcrypt via pgcrypto for secure storage
      const { data: pinHash, error: hashError } = await supabase
        .rpc('hash_kid_pin', { p_pin: pin });
      
      if (hashError) {
        console.error('Error hashing PIN:', hashError);
        throw new Error('Failed to secure PIN');
      }
      
      const { data, error } = await supabase
        .from('kids')
        .insert({
          family_id: family.id,
          name,
          pin_hash: pinHash,
          age,
          avatar_emoji: avatarEmoji
        })
        .select()
        .single();

      if (error) throw error;

      await refreshFamily();
      return data.id;
    } catch (error: any) {
      console.error('Error adding kid:', error);
      toast({
        title: 'Error adding child',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateKid = async (kidId: string, updates: Partial<Kid>) => {
    try {
      await supabase
        .from('kids')
        .update(updates)
        .eq('id', kidId);
      
      await refreshFamily();
    } catch (error: any) {
      toast({
        title: 'Error updating child',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const removeKid = async (kidId: string) => {
    try {
      await supabase
        .from('kids')
        .delete()
        .eq('id', kidId);
      
      await refreshFamily();
    } catch (error: any) {
      toast({
        title: 'Error removing child',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const loginKid = async (kidId: string, pin: string): Promise<boolean> => {
    try {
      // Use server-side PIN verification for better security
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_kid_pin', { p_kid_id: kidId, p_pin: pin });

      if (verifyError) {
        console.error('PIN verification error:', verifyError);
        return false;
      }

      if (isValid) {
        // PIN is valid, fetch kid data
        const { data } = await supabase
          .from('kids')
          .select('*')
          .eq('id', kidId)
          .single();

        if (data) {
          setActiveKid({
            id: data.id,
            name: data.name,
            age: data.age,
            avatar_emoji: data.avatar_emoji,
            lola_time_from_chores: data.lola_time_from_chores,
            lola_time_from_school: data.lola_time_from_school,
            current_streak: data.current_streak,
            total_sessions: data.total_sessions,
            chores_completed: data.chores_completed,
            unlocked_toys: data.unlocked_toys || ['hayPile']
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error logging in kid:', error);
      return false;
    }
  };

  const logoutKid = () => {
    setActiveKid(null);
  };

  const addChore = async (
    description: string, 
    minutesEarned: number, 
    frequency: 'daily' | 'weekly' | 'once',
    kidId?: string
  ) => {
    if (!family) return;

    try {
      await supabase
        .from('chores')
        .insert({
          family_id: family.id,
          description,
          minutes_earned: minutesEarned,
          frequency,
          kid_id: kidId
        });
      
      await refreshFamily();
    } catch (error: any) {
      toast({
        title: 'Error adding chore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateChore = async (choreId: string, updates: Partial<Chore>) => {
    try {
      await supabase
        .from('chores')
        .update(updates)
        .eq('id', choreId);
      
      await refreshFamily();
    } catch (error: any) {
      toast({
        title: 'Error updating chore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const removeChore = async (choreId: string) => {
    try {
      await supabase
        .from('chores')
        .delete()
        .eq('id', choreId);
      
      await refreshFamily();
    } catch (error: any) {
      toast({
        title: 'Error removing chore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const completeChore = async (choreId: string, kidId: string) => {
    try {
      const chore = chores.find(c => c.id === choreId);
      if (!chore) return;

      await supabase
        .from('chore_completions')
        .insert({
          chore_id: choreId,
          kid_id: kidId,
          minutes_earned: chore.minutes_earned
        });
      
      await refreshFamily();
      
      toast({
        title: '✓ Chore submitted!',
        description: 'Waiting for parent approval'
      });
    } catch (error: any) {
      toast({
        title: 'Error completing chore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const approveCompletion = async (completionId: string) => {
    if (!user) return;

    try {
      const completion = pendingCompletions.find(c => c.id === completionId);
      if (!completion) return;

      // Approve the completion
      await supabase
        .from('chore_completions')
        .update({
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', completionId);

      // Add time to kid's balance and increment chores_completed
      const kid = kids.find(k => k.id === completion.kid_id);
      if (kid) {
        await supabase
          .from('kids')
          .update({
            lola_time_from_chores: kid.lola_time_from_chores + completion.minutes_earned,
            chores_completed: kid.chores_completed + 1
          })
          .eq('id', kid.id);
      }
      
      await refreshFamily();
      
      toast({
        title: '✓ Chore approved!',
        description: `Added ${completion.minutes_earned} minutes of Lola time`
      });
    } catch (error: any) {
      toast({
        title: 'Error approving chore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const rejectCompletion = async (completionId: string) => {
    try {
      await supabase
        .from('chore_completions')
        .delete()
        .eq('id', completionId);
      
      await refreshFamily();
      
      toast({
        title: 'Chore rejected',
        description: 'The completion has been removed'
      });
    } catch (error: any) {
      toast({
        title: 'Error rejecting chore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <FamilyContext.Provider value={{
      family,
      kids,
      chores,
      pendingCompletions,
      loading,
      isParent,
      activeKid,
      timeRemaining,
      isTimeUp,
      isTimePaused,
      pauseTime,
      resumeTime,
      createFamily,
      updateFamilyName,
      addKid,
      updateKid,
      removeKid,
      loginKid,
      logoutKid,
      addChore,
      updateChore,
      removeChore,
      completeChore,
      approveCompletion,
      rejectCompletion,
      refreshFamily
    }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
