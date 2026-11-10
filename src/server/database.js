import "server-only";
import { createClient } from "@supabase/supabase-js";

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export function databaseReady() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.AUTH_SECRET);
}

export function database() {
  if (!databaseReady()) throw new Error("ACCOUNT_SERVICE_UNAVAILABLE");
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
}

export function passwordAuth() {
  if (!databaseReady()) throw new Error("ACCOUNT_SERVICE_UNAVAILABLE");
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, options);
}
