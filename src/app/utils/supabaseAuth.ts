import {
  createClient,
  type AuthChangeEvent,
  type Session,
} from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const runtimeEnv = typeof process !== "undefined" ? process.env : undefined;

const supabaseUrl =
  runtimeEnv?.NEXT_PUBLIC_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const supabaseAnonKey = runtimeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function getSupabaseSession(): Promise<{
  session: Session | null;
  error?: string;
}> {
  const { data, error } = await supabase.auth.getSession();
  return {
    session: data.session,
    ...(error ? { error: error.message } : {}),
  };
}

export function subscribeToSupabaseAuth(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => subscription.unsubscribe();
}

export async function signInWithEmailPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOutSupabase() {
  return supabase.auth.signOut();
}
