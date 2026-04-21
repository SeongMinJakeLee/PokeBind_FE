import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase 환경변수 누락: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Safe wrapper for supabase.auth.getSession to reduce navigator.lock race conditions
export async function safeGetSession(attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await supabase.auth.getSession();
    } catch (e) {
      // If final attempt, rethrow
      if (i === attempts - 1) throw e;
      // small backoff
      await new Promise(r => setTimeout(r, 150 * (i + 1)));
    }
  }
}

