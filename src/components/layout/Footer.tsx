import React, { useState } from 'react';
import { AdminPinModal } from '../admin/AdminPinModal';
import { NavView } from '../../types';
import { ShieldCheck, Wifi, WifiOff } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: NavView) => void;
  onAdminUnlocked: () => void;
  isAdminUnlocked?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onAdminUnlocked,
  isAdminUnlocked,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAdminSuccess = () => {
    onAdminUnlocked();
    onNavigate('admin');
  };

  return (
    <>
      <footer className="mt-auto border-t border-matte-border bg-matte-bg/80 py-3.5 px-4 text-xs text-slate-500 backdrop-blur-sm sm:px-6 mb-14 md:mb-0">
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl">
          {/* Copyright & Info */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">
              KMR Remind
            </span>
            <span className="text-slate-500">· Matte Obsidian Pro · v1.0.0</span>
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-matte-surface border border-matte-border">
              {isOnline ? (
                <>
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-amber-400 font-medium">Offline Shell</span>
                </>
              )}
            </span>
          </div>

          {/* Links & Secret Admin Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('settings')}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Settings
            </button>

            {isAdminUnlocked ? (
              <button
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>
            ) : (
              /* User requested: footer admin dashbaord btton like alaram emoji */
              <button
                onClick={() => setShowPinModal(true)}
                className="group relative flex h-6 w-6 items-center justify-center rounded-md hover:bg-matte-elevated border border-transparent hover:border-matte-border transition-all text-xs active:scale-95"
                title="System Administration (Enter PIN)"
                aria-label="Admin Dashboard"
              >
                <span className="transform transition-transform group-hover:scale-110">
                  ⏰
                </span>
                <span className="sr-only">Admin Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {showPinModal && (
        <AdminPinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handleAdminSuccess}
        />
      )}
    </>
  );
};
