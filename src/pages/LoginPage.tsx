import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Bell, Lock, Mail, User, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onForgotPasswordClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onForgotPasswordClick }) => {
  const { signIn, signUp, enableOfflineDemoUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const res = await signUp(email, password, displayName || undefined);
        if (res.error) {
          setError(res.error);
        } else if (res.message) {
          setSuccessMessage(res.message);
        }
      } else {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-matte-bg selection:bg-matte-accent selection:text-white">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-matte-accent text-white shadow-matte-sm border border-indigo-400/20">
            <Bell className="w-6 h-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-100">
            KMR Remind
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Matte Pro Installable Reminder &amp; To-Do PWA
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-matte-border bg-matte-surface p-6 shadow-matte-lg">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-matte-elevated p-1 text-xs font-semibold border border-matte-border mb-5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`rounded-lg py-1.5 transition-all ${
                !isSignUp
                  ? 'bg-matte-subtle text-slate-100 shadow-matte-sm border border-matte-border'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`rounded-lg py-1.5 transition-all ${
                isSignUp
                  ? 'bg-matte-subtle text-slate-100 shadow-matte-sm border border-matte-border'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-950/40 p-3 text-xs text-rose-300 border border-rose-800/60 shadow-matte-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-xl bg-emerald-950/40 p-3 text-xs text-emerald-300 border border-emerald-800/50 flex items-center gap-2 shadow-matte-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <Input
                label="Full Name / Display Name"
                icon={<User className="w-3.5 h-3.5" />}
                placeholder="Jane Doe"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              />
            )}

            <Input
              type="email"
              label="Email Address"
              icon={<Mail className="w-3.5 h-3.5" />}
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Password"
              icon={<Lock className="w-3.5 h-3.5" />}
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />

            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onForgotPasswordClick}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {isSignUp ? 'Create My Account' : 'Sign In to RemindMe'}
            </Button>
          </form>

          {/* Offline / Demo option */}
          <div className="mt-5 pt-4 border-t border-matte-border text-center">
            <button
              type="button"
              onClick={enableOfflineDemoUser}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Explore app in Instant Demo Mode
            </button>
          </div>
        </div>

        {/* Security footnote */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>PostgreSQL Row-Level Security · End-to-End VAPID Push</span>
        </div>
      </div>
    </div>
  );
};
