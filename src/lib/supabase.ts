import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Validación de variables de entorno para evitar errores silenciosos en producción
// Changed from import.meta.env to process.env to match App.tsx and fix TS error
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('FATAL: Missing Supabase environment variables (REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY)');
}

// Exportamos una única instancia del cliente para toda la aplicación
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);