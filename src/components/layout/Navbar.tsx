import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { NavView } from '../../types';
import { Bell, Plus, LogOut, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  onOpenCreateModal,
}) => {
  const { user, profile, signOut, isOfflineDemo } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-matte-border bg-matte-surface/90 px-4 backdrop-blur-md sm:px-6">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 focus:outline-none focus:ring-1 focus:ring-matte-accent rounded-lg p-1 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-matte-accent text-white shadow-matte-sm border border-indigo-400/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              KMR Remind
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-matte-accent-subtle text-indigo-300 rounded border border-indigo-500/20">
                PRO
              </span>
            </span>
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {isOfflineDemo && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded-md border border-amber-800/50">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            Demo Mode
          </span>
        )}

        {/* Quick Add Button */}
        <Button size="sm" onClick={onOpenCreateModal}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span className="hidden sm:inline">New Reminder</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* User profile / Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-matte-border">
            <button
              onClick={() => onNavigate('settings')}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-matte-elevated text-xs font-semibold text-slate-300 border border-matte-border hover:border-matte-border-focus transition-all"
              title={profile?.display_name || user.email || 'Account Settings'}
            >
              {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
            </button>

            <button
              onClick={() => signOut()}
              className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
