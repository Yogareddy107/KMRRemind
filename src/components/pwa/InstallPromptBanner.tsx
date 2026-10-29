import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../common/Button';

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed previously
      if (sessionStorage.getItem('kmr_pwa_dismissed') !== 'true') {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('kmr_pwa_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-4 flex items-center justify-between gap-4 rounded-xl border border-matte-border bg-matte-surface p-3.5 shadow-matte">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-matte-accent text-white shadow-matte-sm border border-indigo-400/20">
          <Download className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-100">
            Install KMR Remind App
          </h4>
          <p className="text-[11px] text-slate-400">
            Install on your desktop or mobile home screen for reliable background alerts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleInstallClick}>
          Install App
        </Button>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-slate-400 hover:text-slate-200"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
