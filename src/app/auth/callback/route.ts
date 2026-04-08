import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Fetch profile for role-based redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiluri")
          .select("role")
          .eq("id", user.id)
          .single();

        const dashboard =
          profile?.role === "transporter"
            ? "/ro/dashboard/transporter"
            : "/ro/dashboard/client";
        return NextResponse.redirect(`${origin}${dashboard}`);
      }

      return NextResponse.redirect(`${origin}/ro/dashboard/client`);
    }
  }

  return NextResponse.redirect(`${origin}/ro/auth/login?error=auth_failed`);
}
