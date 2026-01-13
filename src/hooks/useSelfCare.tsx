import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { toast } from 'sonner';

export interface CareItem {
  id: string;
  item_text: string;
  difficulty_text: string | null;
  item_order: number;
  completed: boolean;
  completed_at: string | null;
  journal_entry: string | null;
  remind_later_count: number;
  peptalk_count: number;
  last_reminded_at: string | null;
}

export interface CareSettings {
  care_items_enabled: boolean;
  reminder_frequency: '1hour' | '3hours' | 'off';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  encouragement_flag_dismissed: boolean;
  first_name: string | null;
  last_name: string | null;
  user_type: 'individual' | 'parent' | 'teacher' | 'kid' | null;
  also_teacher: boolean;
  also_parent: boolean;
  last_end_of_day_shown: string | null;
}

interface SelfCareContextType {
  careItems: CareItem[];
  careSettings: CareSettings | null;
  loading: boolean;
  isReminderActive: boolean;
  currentReminderItem: CareItem | null;
  todayStats: {
    completed: number;
    total: number;
  };
  
  // Actions
  saveCareItems: (items: { text: string; difficulty: string }[]) => Promise<boolean>;
  markItemComplete: (itemId: string, journalEntry?: string) => Promise<boolean>;
  remindMeLater: (itemId: string) => Promise<void>;
  requestPeptalk: (itemId: string) => Promise<void>;
  updateCareItem: (itemId: string, text: string, difficulty?: string) => Promise<boolean>;
  deleteCareItem: (itemId: string) => Promise<boolean>;
  saveReminderSettings: (frequency: '1hour' | '3hours' | 'off', quietHours?: { enabled: boolean; start: string; end: string }) => Promise<boolean>;
  dismissEncouragementFlag: () => Promise<void>;
  dismissReminder: () => void;
  triggerReminder: () => void;
  refreshCareItems: () => Promise<void>;
  keepItemsForTomorrow: (keep: boolean) => Promise<void>;
  dismissEndOfDay: () => Promise<void>;
  shouldShowEndOfDay: () => boolean;
}

const defaultSettings: CareSettings = {
  care_items_enabled: false,
  reminder_frequency: '3hours',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  encouragement_flag_dismissed: false,
  first_name: null,
  last_name: null,
  user_type: null,
  also_teacher: false,
  also_parent: false,
  last_end_of_day_shown: null,
};

const SelfCareContext = createContext<SelfCareContextType | undefined>(undefined);

export const SelfCareProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { progress } = useProgress();
  const [careItems, setCareItems] = useState<CareItem[]>([]);
  const [careSettings, setCareSettings] = useState<CareSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReminderActive, setIsReminderActive] = useState(false);
  const [currentReminderItem, setCurrentReminderItem] = useState<CareItem | null>(null);
  const [lastReminderCheck, setLastReminderCheck] = useState<Date | null>(null);

  const todayStats = {
    completed: careItems.filter(item => item.completed).length,
    total: careItems.length,
  };

  // Fetch care items for today
  const refreshCareItems = useCallback(async () => {
    if (!user) {
      setCareItems([]);
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_care_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('item_order', { ascending: true });

      if (error) throw error;
      setCareItems(data || []);
    } catch (error) {
      console.error('Error fetching care items:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch care settings
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setCareSettings(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('care_items_enabled, reminder_frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, encouragement_flag_dismissed, first_name, last_name, user_type, also_teacher, also_parent, last_end_of_day_shown')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCareSettings({
          care_items_enabled: data.care_items_enabled ?? false,
          reminder_frequency: (data.reminder_frequency as '1hour' | '3hours' | 'off') ?? '3hours',
          quiet_hours_enabled: data.quiet_hours_enabled ?? false,
          quiet_hours_start: data.quiet_hours_start ?? '22:00',
          quiet_hours_end: data.quiet_hours_end ?? '07:00',
          encouragement_flag_dismissed: data.encouragement_flag_dismissed ?? false,
          first_name: data.first_name,
          last_name: data.last_name,
          user_type: data.user_type as CareSettings['user_type'],
          also_teacher: data.also_teacher ?? false,
          also_parent: data.also_parent ?? false,
          last_end_of_day_shown: data.last_end_of_day_shown,
        });
      }
    } catch (error) {
      console.error('Error fetching care settings:', error);
    }
  }, [user]);

  useEffect(() => {
    refreshCareItems();
    fetchSettings();
  }, [refreshCareItems, fetchSettings]);

  // Reminder logic
  useEffect(() => {
    if (!careSettings || careSettings.reminder_frequency === 'off' || careItems.length === 0) {
      return;
    }

    const checkReminder = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check quiet hours
      if (careSettings.quiet_hours_enabled) {
        const start = careSettings.quiet_hours_start;
        const end = careSettings.quiet_hours_end;
        
        // Handle overnight quiet hours (e.g., 22:00 to 07:00)
        if (start > end) {
          if (currentTime >= start || currentTime <= end) return;
        } else {
          if (currentTime >= start && currentTime <= end) return;
        }
      }

      // Don't remind after 8pm (20:00) unless in quiet hours already
      if (hours >= 20) return;

      // Find next incomplete item
      const incompleteItem = careItems.find(item => !item.completed);
      if (!incompleteItem) return;

      // Check last reminder time
      const intervalMs = careSettings.reminder_frequency === '1hour' ? 60 * 60 * 1000 : 3 * 60 * 60 * 1000;
      
      if (lastReminderCheck) {
        const elapsed = now.getTime() - lastReminderCheck.getTime();
        if (elapsed < intervalMs) return;
      }

      // Trigger reminder
      setCurrentReminderItem(incompleteItem);
      setIsReminderActive(true);
      setLastReminderCheck(now);
    };

    // Check every minute
    const interval = setInterval(checkReminder, 60000);
    // Initial check after 10 seconds
    const timeout = setTimeout(checkReminder, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [careSettings, careItems, lastReminderCheck]);

  const saveCareItems = async (items: { text: string; difficulty: string }[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Delete existing items for today first
      await supabase
        .from('daily_care_items')
        .delete()
        .eq('user_id', user.id)
        .eq('date', today);

      // Insert new items
      const newItems = items.map((item, index) => ({
        user_id: user.id,
        date: today,
        item_text: item.text.trim(),
        difficulty_text: item.difficulty.trim() || null,
        item_order: index + 1,
      }));

      const { error } = await supabase
        .from('daily_care_items')
        .insert(newItems);

      if (error) throw error;

      // Enable care items in profile
      await supabase
        .from('profiles')
        .update({ care_items_enabled: true })
        .eq('id', user.id);

      await refreshCareItems();
      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error saving care items:', error);
      toast.error('Failed to save care items');
      return false;
    }
  };

  const markItemComplete = async (itemId: string, journalEntry?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const now = new Date().toISOString();
      const item = careItems.find(i => i.id === itemId);
      
      const { error } = await supabase
        .from('daily_care_items')
        .update({
          completed: true,
          completed_at: now,
          journal_entry: journalEntry || null,
        })
        .eq('id', itemId);

      if (error) throw error;

      // Also save to care journal for historical tracking
      if (item) {
        await supabase.from('care_journal').insert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          care_item: item.item_text,
          difficulty_text: item.difficulty_text,
          completed_at: now,
          journal_entry: journalEntry || null,
          lola_feed_count: 0, // TODO: Get from progress
          lola_water_count: 0,
          lola_play_count: progress.playSessions || 0,
        });
      }

      setIsReminderActive(false);
      setCurrentReminderItem(null);
      await refreshCareItems();
      return true;
    } catch (error) {
      console.error('Error completing care item:', error);
      toast.error('Failed to mark as complete');
      return false;
    }
  };

  const remindMeLater = async (itemId: string): Promise<void> => {
    if (!user) return;

    try {
      const item = careItems.find(i => i.id === itemId);
      if (!item) return;

      await supabase
        .from('daily_care_items')
        .update({
          remind_later_count: item.remind_later_count + 1,
          last_reminded_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      setIsReminderActive(false);
      setCurrentReminderItem(null);
      await refreshCareItems();
    } catch (error) {
      console.error('Error updating remind later:', error);
    }
  };

  const requestPeptalk = async (itemId: string): Promise<void> => {
    if (!user) return;

    try {
      const item = careItems.find(i => i.id === itemId);
      if (!item) return;

      await supabase
        .from('daily_care_items')
        .update({
          peptalk_count: item.peptalk_count + 1,
        })
        .eq('id', itemId);

      await refreshCareItems();
    } catch (error) {
      console.error('Error updating peptalk count:', error);
    }
  };

  const updateCareItem = async (itemId: string, text: string, difficulty?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('daily_care_items')
        .update({
          item_text: text.trim(),
          difficulty_text: difficulty?.trim() || null,
        })
        .eq('id', itemId);

      if (error) throw error;
      await refreshCareItems();
      return true;
    } catch (error) {
      console.error('Error updating care item:', error);
      return false;
    }
  };

  const deleteCareItem = async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('daily_care_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await refreshCareItems();
      return true;
    } catch (error) {
      console.error('Error deleting care item:', error);
      return false;
    }
  };

  const saveReminderSettings = async (
    frequency: '1hour' | '3hours' | 'off',
    quietHours?: { enabled: boolean; start: string; end: string }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const update: Record<string, unknown> = { reminder_frequency: frequency };
      
      if (quietHours) {
        update.quiet_hours_enabled = quietHours.enabled;
        update.quiet_hours_start = quietHours.start;
        update.quiet_hours_end = quietHours.end;
      }

      const { error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', user.id);

      if (error) throw error;
      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      return false;
    }
  };

  const dismissEncouragementFlag = async (): Promise<void> => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ encouragement_flag_dismissed: true })
        .eq('id', user.id);

      await fetchSettings();
    } catch (error) {
      console.error('Error dismissing flag:', error);
    }
  };

  const dismissReminder = () => {
    setIsReminderActive(false);
    setCurrentReminderItem(null);
  };

  const triggerReminder = () => {
    const incompleteItem = careItems.find(item => !item.completed);
    if (incompleteItem) {
      setCurrentReminderItem(incompleteItem);
      setIsReminderActive(true);
    }
  };

  const keepItemsForTomorrow = async (keep: boolean): Promise<void> => {
    if (!user || !keep) return;

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const incompleteItems = careItems.filter(item => !item.completed);
      
      if (incompleteItems.length > 0) {
        const newItems = incompleteItems.map((item, index) => ({
          user_id: user.id,
          date: tomorrowStr,
          item_text: item.item_text,
          difficulty_text: item.difficulty_text,
          item_order: index + 1,
        }));

        await supabase
          .from('daily_care_items')
          .insert(newItems);
      }
    } catch (error) {
      console.error('Error keeping items for tomorrow:', error);
    }
  };

  const dismissEndOfDay = async (): Promise<void> => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('profiles')
        .update({ last_end_of_day_shown: today })
        .eq('id', user.id);

      await fetchSettings();
    } catch (error) {
      console.error('Error dismissing end of day:', error);
    }
  };

  const shouldShowEndOfDay = (): boolean => {
    if (!careSettings || careItems.length === 0) return false;
    
    const now = new Date();
    const hours = now.getHours();
    
    // Show at 8pm or later
    if (hours < 20) return false;
    
    const today = now.toISOString().split('T')[0];
    return careSettings.last_end_of_day_shown !== today;
  };

  return (
    <SelfCareContext.Provider
      value={{
        careItems,
        careSettings,
        loading,
        isReminderActive,
        currentReminderItem,
        todayStats,
        saveCareItems,
        markItemComplete,
        remindMeLater,
        requestPeptalk,
        updateCareItem,
        deleteCareItem,
        saveReminderSettings,
        dismissEncouragementFlag,
        dismissReminder,
        triggerReminder,
        refreshCareItems,
        keepItemsForTomorrow,
        dismissEndOfDay,
        shouldShowEndOfDay,
      }}
    >
      {children}
    </SelfCareContext.Provider>
  );
};

export const useSelfCare = () => {
  const context = useContext(SelfCareContext);
  if (context === undefined) {
    throw new Error('useSelfCare must be used within a SelfCareProvider');
  }
  return context;
};
