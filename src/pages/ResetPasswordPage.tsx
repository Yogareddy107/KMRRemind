import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ResetPasswordPageProps {
  onBackToLogin: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBackToLogin }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await resetPassword(email);
      if (res.error) {
        setError(res.error);
      } else {
        setMessage(res.message || 'Check your inbox for the password reset instructions.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-matte-bg selection:bg-matte-accent selection:text-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-2xl border border-matte-border bg-matte-surface p-6 shadow-matte-lg">
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </button>

          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Reset Password
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Enter your registered email address to receive secure reset instructions.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-950/40 p-3 text-xs text-rose-300 border border-rose-800/60 shadow-matte-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl bg-emerald-950/40 p-3 text-xs text-emerald-300 border border-emerald-800/50 flex items-center gap-2 shadow-matte-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              type="email"
              label="Email Address"
              icon={<Mail className="w-3.5 h-3.5" />}
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Button type="submit" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
