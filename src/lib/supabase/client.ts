import { createClient } from '@supabase/supabase-js';

// Limpia BOM (U+FEFF) y espacios. Algunas env vars cargadas vía CLI en Windows
// quedan con un BOM al inicio que rompe la conversión a header HTTP (ByteString).
function cleanEnv(value: string | undefined): string {
  return (value ?? '').replace(/^﻿/, '').trim();
}

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const supabaseServiceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Solo usar en API routes — nunca en componentes de React
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
