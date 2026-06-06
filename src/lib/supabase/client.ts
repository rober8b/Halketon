import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// La evaluación se hace lazy para no romper en build/dev cuando faltan env vars.
let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

function buildPublic(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase no configurado: faltan NEXT_PUBLIC_SUPABASE_URL/ANON_KEY');
  }
  return createClient(url, key);
}

function buildAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase no configurado: faltan NEXT_PUBLIC_SUPABASE_URL/SERVICE_ROLE_KEY');
  }
  return createClient(url, key);
}

function lazyClient(getter: () => SupabaseClient): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      const client = getter();
      const value = client[prop as keyof SupabaseClient];
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
    },
  });
}

export const supabase: SupabaseClient = lazyClient(() => {
  if (!_public) _public = buildPublic();
  return _public;
});

export const supabaseAdmin: SupabaseClient = lazyClient(() => {
  if (!_admin) _admin = buildAdmin();
  return _admin;
});

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
