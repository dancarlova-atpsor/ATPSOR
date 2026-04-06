import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Update Supabase session
  try {
    await updateSession(request);
  } catch {
    // Skip if error
  }

  return response;
}

export const config = {
  matcher: ["/", "/(ro|en)/:path*"],
};
