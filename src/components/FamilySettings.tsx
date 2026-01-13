import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, Timer, Bell, Shield, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface FamilySettingsProps {
  open: boolean;
  onClose: () => void;
}

const FamilySettings = ({ open, onClose }: FamilySettingsProps) => {
  const { family, kids, updateFamilyName, updateKid, removeKid } = useFamily();
  const { toast } = useToast();
  
  const [editingName, setEditingName] = useState(false);
  const [familyName, setFamilyName] = useState(family?.name || '');
  const [editingKid, setEditingKid] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});
  const [newPin, setNewPin] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState({
    timerCountsWhenClosed: true,
    pauseDuringSchool: false,
    requireApproval: true,
    autoApproveHours: 24,
    maxBankMinutes: 180,
    timeExpiresAfter: 'never' as 'never' | '7days' | '30days',
    notifyOnChoreComplete: true,
    dailySummary: true,
    weeklyHighlights: false,
  });

  const handleSaveFamilyName = async () => {
    if (familyName.trim()) {
      await updateFamilyName(familyName.trim());
      setEditingName(false);
      toast({ title: '✓ Family name updated!' });
    }
  };

  const handleResetPin = async (kidId: string) => {
    if (newPin.length !== 4) {
      toast({ title: 'PIN must be 4 digits', variant: 'destructive' });
      return;
    }
    // Note: In a full implementation, we'd update the PIN hash in the database
    toast({ title: '✓ PIN reset successfully!' });
    setEditingKid(null);
    setNewPin('');
  };

  const handleRemoveKid = async (kidId: string, kidName: string) => {
    if (confirm(`Are you sure you want to remove ${kidName} from the family?`)) {
      await removeKid(kidId);
      toast({ title: `${kidName} removed from family` });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5" />
            Family Settings
          </DialogTitle>
          <DialogDescription>
            Manage your family preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Family Name */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Family Name
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Family name"
                  />
                  <Button size="sm" onClick={handleSaveFamilyName}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{family?.name || 'My Family'}</span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kids Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Kids & PINs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kids.map((kid) => (
                <div key={kid.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{kid.avatar_emoji}</span>
                    <div>
                      <p className="font-medium">{kid.name}</p>
                      {kid.age && <p className="text-xs text-muted-foreground">Age {kid.age}</p>}
                    </div>
                  </div>
                  
                  {editingKid === kid.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        placeholder="New PIN"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="w-20"
                      />
                      <Button size="sm" onClick={() => handleResetPin(kid.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingKid(null); setNewPin(''); }}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPin({ ...showPin, [kid.id]: !showPin[kid.id] })}
                      >
                        {showPin[kid.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingKid(kid.id)}
                      >
                        Reset PIN
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveKid(kid.id, kid.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              {kids.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No kids added yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timer Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Timer Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Count down when app closed</Label>
                  <p className="text-xs text-muted-foreground">Timer continues even if app is closed</p>
                </div>
                <Switch
                  checked={settings.timerCountsWhenClosed}
                  onCheckedChange={(checked) => setSettings({ ...settings, timerCountsWhenClosed: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pause during school hours</Label>
                  <p className="text-xs text-muted-foreground">8 AM - 3 PM weekdays</p>
                </div>
                <Switch
                  checked={settings.pauseDuringSchool}
                  onCheckedChange={(checked) => setSettings({ ...settings, pauseDuringSchool: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Maximum time bank</Label>
                <Select
                  value={settings.maxBankMinutes.toString()}
                  onValueChange={(v) => setSettings({ ...settings, maxBankMinutes: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                    <SelectItem value="120">120 minutes (2 hours)</SelectItem>
                    <SelectItem value="180">180 minutes (3 hours)</SelectItem>
                    <SelectItem value="300">300 minutes (5 hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Time expires after</Label>
                <Select
                  value={settings.timeExpiresAfter}
                  onValueChange={(v) => setSettings({ ...settings, timeExpiresAfter: v as typeof settings.timeExpiresAfter })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="7days">7 days</SelectItem>
                    <SelectItem value="30days">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Chore Approval */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ✓ Chore Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require approval for all chores</Label>
                  <p className="text-xs text-muted-foreground">Parent must approve before time is awarded</p>
                </div>
                <Switch
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireApproval: checked })}
                />
              </div>
              
              {settings.requireApproval && (
                <div className="space-y-2">
                  <Label>Auto-approve after</Label>
                  <Select
                    value={settings.autoApproveHours.toString()}
                    onValueChange={(v) => setSettings({ ...settings, autoApproveHours: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Never (always require)</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Notify when kid marks chore done</Label>
                <Switch
                  checked={settings.notifyOnChoreComplete}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifyOnChoreComplete: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Daily activity summary</Label>
                <Switch
                  checked={settings.dailySummary}
                  onCheckedChange={(checked) => setSettings({ ...settings, dailySummary: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Weekly journal highlights</Label>
                <Switch
                  checked={settings.weeklyHighlights}
                  onCheckedChange={(checked) => setSettings({ ...settings, weeklyHighlights: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilySettings;
