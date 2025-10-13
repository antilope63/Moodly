import { createClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // This will make it easier to spot missing env at runtime in dev
  // without crashing the entire app at import time in production.
  console.warn('Supabase: variables manquantes. Configurez SUPABASE_URL et SUPABASE_ANON_KEY.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


