import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { getUserSystemTimezone } from '../lib/recurrence';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  isOfflineDemo: boolean;
  enableOfflineDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineDemo, setIsOfflineDemo] = useState(false);

  useEffect(() => {
    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // Check if demo user is active in localStorage
        const demoUser = localStorage.getItem('kmr_demo_user');
        if (demoUser) {
          try {
            const parsed = JSON.parse(demoUser);
            setUser(parsed);
            setIsOfflineDemo(true);
            setProfile({
              id: parsed.id,
              display_name: 'Demo Explorer',
              preferred_timezone: getUserSystemTimezone(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } catch {
            localStorage.removeItem('kmr_demo_user');
          }
        }
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsOfflineDemo(false);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // Default fallback profile
        setProfile({
          id: userId,
          display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          preferred_timezone: getUserSystemTimezone(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Profile fetch note:', e);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        setIsOfflineDemo(false);
        localStorage.removeItem('kmr_demo_user');
      }
      return {};
    } catch (e: any) {
      return { error: e.message || 'Login failed' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error?: string; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            display_name: displayName,
            preferred_timezone: getUserSystemTimezone(),
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user && !data.session) {
        return { message: 'Confirmation link sent! Please check your email to verify your account.' };
      }

      return {};
    } catch (e: any) {
      return { error: e.message || 'Sign up failed' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      localStorage.removeItem('kmr_demo_user');
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsOfflineDemo(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { message: 'Password reset link sent to your email.' };
    } catch (e: any) {
      return { error: e.message || 'Failed to send reset link' };
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });

      if (error) return { error: error.message };

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return {};
    } catch (e: any) {
      return { error: e.message || 'Update failed' };
    }
  };

  const enableOfflineDemoUser = () => {
    const demo = {
      id: 'demo-user-kmr-0001',
      email: 'demo@kmr-remind.local',
      user_metadata: { full_name: 'Demo Explorer' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    localStorage.setItem('kmr_demo_user', JSON.stringify(demo));
    setUser(demo);
    setIsOfflineDemo(true);
    setProfile({
      id: demo.id,
      display_name: 'Demo Explorer',
      preferred_timezone: getUserSystemTimezone(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        isOfflineDemo,
        enableOfflineDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

