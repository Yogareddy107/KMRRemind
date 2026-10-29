import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpnyljzdaonygldqhlvs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnlsanpkYW9ueWdsZHFobHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMzMyNzQsImV4cCI6MjEwODgwOTI3NH0.XICNbwVK4Xs6nWl4L11FhQMDjfvpkssFB8XtIj-XoYY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

