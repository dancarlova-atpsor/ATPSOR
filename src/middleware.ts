import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Update Supabase session (skip if not configured with real credentials)
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url && !url.includes("placeholder")) {
      await updateSession(request);
    }
  } catch {
    // Supabase not configured, skip session update
  }

  return response;
}

export const config = {
  matcher: ["/", "/(ro|en)/:path*"],
};
