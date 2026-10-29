import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { POPULAR_TIMEZONES } from '../lib/recurrence';
import { pushManager } from '../lib/pushManager';
import { audioManager } from '../lib/audio';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import {
  User,
  Bell,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Check,
  AlertCircle,
  Smartphone,
  LogOut,
  Palette
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { reminders, occurrences } = useReminders();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [timezone, setTimezone] = useState(profile?.preferred_timezone || 'UTC');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(audioManager.isSoundEnabled());
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState(false);

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await updateProfile({
        display_name: displayName.trim(),
        preferred_timezone: timezone,
      });
      if (res.error) {
        setProfileMessage(`Error: ${res.error}`);
      } else {
        setProfileMessage('Profile settings updated successfully!');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // Toggle sound chime
  const handleToggleSound = () => {
    const next = !soundEnabled;
    audioManager.setSoundEnabled(next);
    setSoundEnabled(next);
    if (next) audioManager.playChime();
  };

  // Test sound
  const handleTestSound = () => {
    audioManager.playChime();
  };

  // Send Test Push
  const handleSendTestPush = async () => {
    setPushLoading(true);
    setPushStatusMessage(null);
    try {
      const success = await pushManager.showLocalTestNotification();
      if (success) {
        setPushStatusMessage('Test notification sent to this device!');
      } else {
        setPushStatusMessage('Could not show system notification. Please ensure browser permissions are granted.');
      }
    } finally {
      setPushLoading(false);
    }
  };

  // Unsubscribe device
  const handleUnsubscribe = async () => {
    if (!window.confirm('Do you want to disable push notifications on this device?')) return;
    setPushLoading(true);
    try {
      await pushManager.unsubscribeUser(user?.id);
      setPushStatusMessage('Device unsubscribed from push notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const exportData = {
      user_id: user?.id,
      export_date: new Date().toISOString(),
      reminders,
      occurrences,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kmr-remind-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Application Settings</h2>
        <p className="text-xs text-slate-400">
          Manage your personal profile, default timezone, audio alerts, and push notification devices.
        </p>
      </div>

      {/* 1. Theme Specification Banner */}
      <div className="rounded-2xl border border-matte-border bg-matte-surface p-5 shadow-matte space-y-2">
        <div className="flex items-center gap-2 text-indigo-400">
          <Palette className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Appearance: Matte Obsidian Pro
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The app is configured in a single, high-contrast professional matte dark theme designed for minimal eye strain and focused productivity across desktop and mobile.
        </p>
      </div>

      {/* 2. Profile & Timezone Settings */}
      <div className="rounded-2xl border border-matte-border bg-matte-surface p-5 shadow-matte space-y-4">
        <div className="flex items-center gap-2 border-b border-matte-border pb-3">
          <User className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Profile &amp; Timezone Preferences
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          {profileMessage && (
            <div className="p-3 text-xs bg-matte-accent-subtle text-indigo-300 rounded-lg flex items-center gap-2 border border-indigo-500/20">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{profileMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
            />

            <Select
              label="Default IANA Timezone"
              value={timezone}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimezone(e.target.value)}
            >
              {POPULAR_TIMEZONES.map((tz: string) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" loading={profileSaving}>
              Save Profile Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Push Notification & Devices */}
      <div className="rounded-2xl border border-matte-border bg-matte-surface p-5 shadow-matte space-y-4">
        <div className="flex items-center gap-2 border-b border-matte-border pb-3">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Web Push Notifications &amp; Devices
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          KMR Remind uses the W3C Web Push standard and Service Workers to deliver timely alerts across all your devices without requiring native app store installs.
        </p>

        {pushStatusMessage && (
          <div className="p-3 text-xs bg-matte-accent-subtle text-indigo-300 rounded-lg flex items-center gap-2 border border-indigo-500/20">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            <span>{pushStatusMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendTestPush}
            loading={pushLoading}
            icon={<Bell className="w-3.5 h-3.5 mr-1 text-indigo-400" />}
          >
            Send Test Push to This Device
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleUnsubscribe}
            loading={pushLoading}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          >
            Unsubscribe This Device
          </Button>
        </div>
      </div>

      {/* 4. Audio Chime Alerts */}
      <div className="rounded-2xl border border-matte-border bg-matte-surface p-5 shadow-matte space-y-4">
        <div className="flex items-center justify-between border-b border-matte-border pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Notification Chimes &amp; Sounds
            </h3>
          </div>
          <button
            onClick={handleToggleSound}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Synthesized audio tones sound when scheduled reminders trigger or when completing tasks.
          </p>
          <Button size="sm" variant="outline" onClick={handleTestSound}>
            Preview Chime
          </Button>
        </div>
      </div>

      {/* 5. Data Management & Backup */}
      <div className="rounded-2xl border border-matte-border bg-matte-surface p-5 shadow-matte space-y-4">
        <div className="flex items-center gap-2 border-b border-matte-border pb-3">
          <Download className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Data Export &amp; Backup
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              Export Reminders as JSON
            </h4>
            <p className="text-xs text-slate-400">
              Download a complete offline copy of all your tasks, notes, recurrence rules, and completion history.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleExportData}>
            Export Data
          </Button>
        </div>
      </div>

      {/* 6. Account & Session */}
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-5 shadow-matte space-y-4">
        <div className="flex items-center gap-2 border-b border-rose-900/40 pb-3">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Session &amp; Security
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-300">
              Signed in as <strong className="font-semibold">{user?.email || 'Demo Explorer'}</strong>
            </p>
            <p className="text-[11px] text-rose-400/80">
              All data is guarded by PostgreSQL Row Level Security (RLS).
            </p>
          </div>
          <Button size="sm" variant="danger" onClick={() => signOut()}>
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
