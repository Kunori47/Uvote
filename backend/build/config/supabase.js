"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseStorageBucket = exports.supabaseAnonKey = exports.supabaseUrl = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
exports.supabaseUrl = supabaseUrl;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
exports.supabaseAnonKey = supabaseAnonKey;
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase credentials not found. Some features may not work.');
}
// Nombre del bucket de Storage para imágenes
// Debes crearlo en Supabase → Storage → Create bucket (ej: "uvote-media")
const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'uvote-media';
exports.supabaseStorageBucket = supabaseStorageBucket;
// Cliente de Supabase para operaciones adicionales
exports.supabase = supabaseUrl && supabaseAnonKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey)
    : null;
//# sourceMappingURL=supabase.js.map