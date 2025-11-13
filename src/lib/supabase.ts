import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined. Please check your environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persistir sessão no localStorage
    autoRefreshToken: true, // Renovar token automaticamente
    detectSessionInUrl: true, // Detectar sessão na URL (para magic links)
    storageKey: 'comprai-auth-token', // Chave personalizada no localStorage
  }
});
