import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persistir sessão no localStorage
    autoRefreshToken: true, // Renovar token automaticamente
    detectSessionInUrl: true, // Detectar sessão na URL (para magic links)
    storageKey: 'comprai-auth-token', // Chave personalizada no localStorage
  }
});
