import React, { useEffect, useState } from 'react';
import { pushManager, PushStatus } from '../../lib/pushManager';
import { audioManager } from '../../lib/audio';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Bell, BellOff, Volume2, VolumeX, CheckCircle, AlertTriangle, Send } from 'lucide-react';

export const NotificationStatusWidget: React.FC = () => {
  const { user } = useAuth();
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(audioManager.isSoundEnabled());

  const checkStatus = async () => {
    const status = await pushManager.getStatus();
    setPushStatus(status);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleEnablePush = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await pushManager.subscribeUser(user.id);
      if (res.success) {
        setMessage('Web Push notifications enabled successfully!');
        audioManager.playSuccess();
      } else {
        setMessage(res.error || 'Permission not granted.');
      }
      await checkStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    audioManager.playChime();
    const sent = await pushManager.showLocalTestNotification();
    if (sent) {
      setMessage('Test alert delivered to your system!');
    } else {
      setMessage('Notification chime sounded. Enable push notifications for system banners.');
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    audioManager.setSoundEnabled(next);
    setSoundEnabled(next);
    if (next) audioManager.playChime();
  };

  if (!pushStatus) return null;

  return (
    <div className="rounded-xl border border-matte-border bg-matte-surface p-5 shadow-matte-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <Bell className="w-3.5 h-3.5 text-indigo-400" />
          Notification & Sound Status
        </div>

        {/* Audio Chime Toggle */}
        <button
          onClick={toggleSound}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
          title={soundEnabled ? 'Mute alert sounds' : 'Unmute alert sounds'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Sound On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Muted</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-3.5 space-y-3">
        {pushStatus.permission === 'granted' ? (
          <div className="flex items-center gap-2.5 text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Web Push is active on this device. You will receive repeat alerts even with the app minimized.
            </span>
          </div>
        ) : pushStatus.permission === 'denied' ? (
          <div className="flex items-center gap-2.5 text-xs text-rose-300 bg-rose-950/30 p-2.5 rounded-lg border border-rose-800/40">
            <BellOff className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              Notifications blocked in browser settings. Click the site settings icon in the URL bar to allow.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-amber-300 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Push alerts inactive. Enable to receive scheduled background reminders.
            </span>
          </div>
        )}

        {message && (
          <p className="text-xs text-indigo-400 font-medium">
            {message}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {pushStatus.permission !== 'granted' && (
            <Button size="sm" onClick={handleEnablePush} loading={loading}>
              <Bell className="w-3.5 h-3.5 mr-1" />
              Enable Push Notifications
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={handleTestNotification}>
            <Send className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Send Test Alert
          </Button>
        </div>
      </div>
    </div>
  );
};
