import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useSelfCare } from '@/hooks/useSelfCare';
import { CareItemsForm } from './CareItemsForm';
import { AccountCreationForm } from './AccountCreationForm';
import { ReminderSettingsForm } from './ReminderSettingsForm';
import { SuccessScreen } from './SuccessScreen';
import { CareStatsView, EditCareItems } from './CareStatsView';
import { CheckInModal } from './CheckInModal';
import { CompletionModal } from './CompletionModal';
import { EndOfDayRecap } from './EndOfDayRecap';

type FlowStep = 
  | 'button' 
  | 'form' 
  | 'account' 
  | 'reminder-settings' 
  | 'success' 
  | 'stats'
  | 'edit-items'
  | 'check-in'
  | 'completion'
  | 'end-of-day';

export const SelfCareButton = () => {
  const { user } = useAuth();
  const { 
    careItems, 
    careSettings, 
    saveCareItems, 
    saveReminderSettings,
    currentReminderItem,
    isReminderActive,
    dismissReminder,
    shouldShowEndOfDay,
  } = useSelfCare();
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<FlowStep>('button');
  const [pendingItems, setPendingItems] = useState<{ text: string; difficulty: string }[]>([]);
  const [completingItem, setCompletingItem] = useState<typeof currentReminderItem>(null);

  const hasCareItems = careItems.length > 0;

  const handleButtonClick = () => {
    // Check for end of day first
    if (shouldShowEndOfDay()) {
      setStep('end-of-day');
      setOpen(true);
      return;
    }
    
    // Check for active reminder
    if (isReminderActive && currentReminderItem) {
      setCompletingItem(currentReminderItem);
      setStep('check-in');
      setOpen(true);
      return;
    }
    
    // User has items - show stats
    if (hasCareItems) {
      setStep('stats');
      setOpen(true);
      return;
    }
    
    // No items - start form flow
    setStep('form');
    setOpen(true);
  };

  const handleFormSubmit = async (items: { text: string; difficulty: string }[]) => {
    if (!user) {
      // Guest - save pending items and go to account creation
      setPendingItems(items);
      setStep('account');
      return;
    }

    // Logged in - save items directly
    const success = await saveCareItems(items);
    if (success) {
      setStep('reminder-settings');
    }
  };

  const handleAccountCreated = async () => {
    // After account creation, save the pending items
    if (pendingItems.length > 0) {
      const success = await saveCareItems(pendingItems);
      if (success) {
        setStep('reminder-settings');
      }
    } else {
      setStep('reminder-settings');
    }
  };

  const handleReminderSettingsSaved = async (settings: {
    frequency: '1hour' | '3hours' | 'off';
    quietHours: { enabled: boolean; start: string; end: string };
  }) => {
    await saveReminderSettings(settings.frequency, settings.quietHours);
    setStep('success');
  };

  const handleClose = () => {
    setOpen(false);
    setStep('button');
    setPendingItems([]);
    setCompletingItem(null);
    dismissReminder();
  };

  const handleCheckInDone = () => {
    setStep('completion');
  };

  const handleCompletionDone = () => {
    handleClose();
  };

  return (
    <>
      {/* Main CTA Button */}
      <Card 
        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] border-2 border-pink-300/30 bg-gradient-to-br from-pink-950/10 to-pink-900/5"
        onClick={handleButtonClick}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">❤️</div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg">
                CARE FOR YOURSELF TOO?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You're taking great care of me! Want me to help you care for yourself today?
              </p>
              <p className="text-xs text-pink-400 mt-2">
                Tap to add up to 3 care items for yourself
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">Self Care</DialogTitle>
          
          {step === 'form' && (
            <CareItemsForm 
              onSubmit={handleFormSubmit}
              onCancel={handleClose}
            />
          )}
          
          {step === 'account' && (
            <AccountCreationForm 
              onSuccess={handleAccountCreated}
              onCancel={handleClose}
            />
          )}
          
          {step === 'reminder-settings' && (
            <ReminderSettingsForm 
              onSubmit={handleReminderSettingsSaved}
              initialSettings={careSettings ? {
                frequency: careSettings.reminder_frequency,
                quietHoursEnabled: careSettings.quiet_hours_enabled,
                quietHoursStart: careSettings.quiet_hours_start,
                quietHoursEnd: careSettings.quiet_hours_end,
              } : undefined}
            />
          )}
          
          {step === 'success' && (
            <SuccessScreen 
              items={careItems.map(item => item.item_text)}
              onClose={handleClose}
            />
          )}
          
          {step === 'stats' && (
            <CareStatsView 
              onClose={handleClose}
              onEditItems={() => setStep('edit-items')}
              onReminderSettings={() => setStep('reminder-settings')}
            />
          )}
          
          {step === 'edit-items' && (
            <EditCareItems 
              onDone={() => setStep('stats')}
            />
          )}
          
          {step === 'check-in' && completingItem && (
            <CheckInModal 
              item={completingItem}
              onDone={handleCheckInDone}
              onRemindLater={handleClose}
              onClose={handleClose}
            />
          )}
          
          {step === 'completion' && completingItem && (
            <CompletionModal 
              item={completingItem}
              onComplete={handleCompletionDone}
              onClose={handleClose}
            />
          )}
          
          {step === 'end-of-day' && (
            <EndOfDayRecap 
              onKeep={handleClose}
              onStartFresh={handleClose}
              onClose={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
