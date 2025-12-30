import { createBrowserClient as createClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants';
import type { Database } from '@/types/database.types';

export function createBrowserClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
