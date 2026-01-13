import { useState } from 'react';
import { Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReminderSettingsFormProps {
  onSubmit: (settings: {
    frequency: '1hour' | '3hours' | 'off';
    quietHours: { enabled: boolean; start: string; end: string };
  }) => void;
  initialSettings?: {
    frequency: '1hour' | '3hours' | 'off';
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
}

const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
];

const formatTime = (time: string) => {
  const [hours] = time.split(':');
  const hour = parseInt(hours);
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
};

export const ReminderSettingsForm = ({ onSubmit, initialSettings }: ReminderSettingsFormProps) => {
  const [frequency, setFrequency] = useState<'1hour' | '3hours' | 'off'>(
    initialSettings?.frequency || '3hours'
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    initialSettings?.quietHoursEnabled ?? false
  );
  const [quietHoursStart, setQuietHoursStart] = useState(
    initialSettings?.quietHoursStart || '22:00'
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    initialSettings?.quietHoursEnd || '07:00'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      frequency,
      quietHours: {
        enabled: quietHoursEnabled,
        start: quietHoursStart,
        end: quietHoursEnd,
      },
    });
  };

  return (
    <Card className="border-2 border-blue-300/30 bg-gradient-to-br from-background to-blue-950/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bell className="w-5 h-5 text-blue-400" />
          How often should I remind you?
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup
            value={frequency}
            onValueChange={(value) => setFrequency(value as typeof frequency)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1hour" id="1hour" />
              <Label htmlFor="1hour" className="font-normal cursor-pointer">
                Every hour
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3hours" id="3hours" />
              <Label htmlFor="3hours" className="font-normal cursor-pointer">
                Every 3 hours <span className="text-xs text-muted-foreground">(recommended)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="off" id="off" />
              <Label htmlFor="off" className="font-normal cursor-pointer">
                No reminders (I'll check myself)
              </Label>
            </div>
          </RadioGroup>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="quietHours"
                checked={quietHoursEnabled}
                onCheckedChange={(checked) => setQuietHoursEnabled(!!checked)}
              />
              <Label htmlFor="quietHours" className="font-normal cursor-pointer flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Quiet hours (don't remind me between)
              </Label>
            </div>
            
            {quietHoursEnabled && (
              <div className="flex items-center gap-3 pl-6">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Select value={quietHoursStart} onValueChange={setQuietHoursStart}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Until</Label>
                  <Select value={quietHoursEnd} onValueChange={setQuietHoursEnd}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500"
          >
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
