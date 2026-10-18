import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

// Schema is fixed to `organizer` for the whole app (see SCHEMA.sql).
// Typed with a hand-written Database type for now; replaced by
// `supabase gen types` output in a later phase.
export const supabase = createClient(url, anonKey, {
  db: { schema: 'organizer' },
});