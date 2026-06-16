import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication
const PROTECTED_PATTERNS = [/^\/(ro|en)\/dashboard/];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  // MAINTENANCE MODE: dacă MAINTENANCE_MODE=true în Vercel env, redirect tot la /maintenance
  // Excepție: /maintenance însuși și asset-urile statice (_next, favicon, etc.)
  if (
    process.env.MAINTENANCE_MODE === "true" &&
    !pathname.startsWith("/maintenance") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api/_health") &&
    !pathname.includes(".")
  ) {
    return NextResponse.rewrite(new URL("/maintenance", request.url));
  }

  // If Supabase not configured, just run i18n middleware
  if (!url || url.includes("placeholder") || !anonKey) {
    return intlMiddleware(request);
  }

  // Create Supabase client for session refresh
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as any)
        );
      },
    },
  });

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if this is a protected route
  const isProtected = PROTECTED_PATTERNS.some((pattern) =>
    pattern.test(pathname)
  );

  if (isProtected && !user) {
    // Redirect to login
    const locale = pathname.startsWith("/en") ? "en" : "ro";
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    // Copy session cookies to redirect response
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Role-based dashboard access
  if (user && /^\/(ro|en)\/dashboard/.test(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const locale = pathname.startsWith("/en") ? "en" : "ro";
    const isAdminRoute = /\/dashboard\/admin/.test(pathname);
    const isTransporterRoute = /\/dashboard\/transporter/.test(pathname);
    const isClientRoute = /\/dashboard\/client/.test(pathname);

    // Admin can access all dashboards (admin, transporter, client)

    // Non-admins (except inspector) can't access admin dashboard
    if (isAdminRoute && profile?.role !== "admin" && profile?.role !== "inspector") {
      const dashboard = profile?.role === "transporter" ? "transporter" : "client";
      const redirectResponse = NextResponse.redirect(
        new URL(`/${locale}/dashboard/${dashboard}`, request.url)
      );
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    if (isTransporterRoute && profile?.role === "client") {
      const redirectResponse = NextResponse.redirect(
        new URL(`/${locale}/dashboard/client`, request.url)
      );
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    if (isClientRoute && profile?.role === "transporter") {
      const redirectResponse = NextResponse.redirect(
        new URL(`/${locale}/dashboard/transporter`, request.url)
      );
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  }

  // Run intl middleware and merge Supabase session cookies
  const intlResponse = intlMiddleware(request);

  // Copy Supabase cookies onto the intl response
  response.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  // Includem TOATE path-urile (nu doar i18n) ca să prindem și /maintenance + alte path-uri
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|atpsor-logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|map|woff|woff2|ttf|otf)$).*)",
  ],
};
