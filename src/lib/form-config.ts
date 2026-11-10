type FormEnvironment = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export function formStorageConfig(env: FormEnvironment, bundled: FormEnvironment) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || bundled.VITE_SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY
    || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
    || bundled.VITE_SUPABASE_PUBLISHABLE_KEY || bundled.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Submission storage is not configured");
  return { url, key };
}