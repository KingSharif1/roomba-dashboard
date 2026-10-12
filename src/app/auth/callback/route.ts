import { decideAccess } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      const decision = decideAccess({
        userEmail: data.user?.email,
        ownerEmail: process.env.OWNER_EMAIL,
        robotUrl: process.env.ROBOT_URL,
      });
      if (decision.role !== "owner") {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not-owner`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
