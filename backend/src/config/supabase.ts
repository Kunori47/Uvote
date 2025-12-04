import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found. Some features may not work.');
}

// Nombre del bucket de Storage para imágenes
// Debes crearlo en Supabase → Storage → Create bucket (ej: "uvote-media")
const supabaseStorageBucket =
  process.env.SUPABASE_STORAGE_BUCKET || 'uvote-media';

// Cliente de Supabase para operaciones adicionales
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export { supabaseUrl, supabaseAnonKey, supabaseStorageBucket };

