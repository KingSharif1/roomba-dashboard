import { decideAccess, type AccessDecision } from "./access";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

export type ServerAccess = AccessDecision & { supabaseConfigured: boolean };

/** Validates the Supabase session on the server. Visitors never receive the robot URL. */
export async function readServerAccess(): Promise<ServerAccess> {
  const supabaseConfigured = isSupabaseConfigured();
  let userEmail: string | null = null;
  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userEmail = data.user?.email ?? null;
    } catch {
      userEmail = null;
    }
  }
  return {
    ...decideAccess({
      userEmail,
      ownerEmail: process.env.OWNER_EMAIL,
      robotUrl: process.env.ROBOT_URL,
    }),
    supabaseConfigured,
  };
}
