"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, Globe, User, LogOut, LayoutDashboard } from "lucide-react";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          email: u.email || "",
          role: u.user_metadata?.role || "client",
        });
      }
    });
  }, []);

  const navigation = [
    { name: t("nav.home"), href: "/" as const },
    { name: "Caut Transport", href: "/transport" as const },
    { name: t("nav.transporters"), href: "/transporters" as const },
    { name: t("nav.request"), href: "/request" as const },
    { name: t("nav.about"), href: "/about" as const },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/ro";
  }

  function switchLocale(locale: "ro" | "en") {
    router.replace(pathname, { locale });
  }

  const dashboardHref = user?.role === "transporter"
    ? "/dashboard/transporter" as const
    : "/dashboard/client" as const;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <img src="/atpsor-logo.png" alt="ATPSOR" className="h-12 w-auto" />
          <span className="hidden text-xs text-gray-500 sm:block">Transport Ocazional</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                pathname === item.href ? "text-primary-500" : "text-gray-600"
              }`}>
              {item.name}
            </Link>
          ))}
          {user && (
            <Link href={dashboardHref}
              className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                pathname.includes("dashboard") ? "text-primary-500" : "text-gray-600"
              }`}>
              {t("nav.dashboard")}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => switchLocale(pathname.startsWith("/en") ? "ro" : "en")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">RO / EN</span>
          </button>

          {user ? (
            <>
              <Link href={dashboardHref}
                className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:flex">
                <LayoutDashboard className="h-4 w-4" />
                {t("nav.dashboard")}
              </Link>
              <button onClick={handleLogout}
                className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 sm:flex">
                <LogOut className="h-4 w-4" />
                {t("common.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login"
                className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:flex">
                <User className="h-4 w-4" />
                {t("common.login")}
              </Link>
              <Link href="/auth/register"
                className="hidden rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 sm:block">
                {t("common.register")}
              </Link>
            </>
          )}

          <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  pathname === item.href ? "bg-primary-50 text-primary-500" : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setMobileMenuOpen(false)}>
                {item.name}
              </Link>
            ))}
            <hr className="my-2" />
            {user ? (
              <>
                <Link href={dashboardHref}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}>
                  {t("nav.dashboard")}
                </Link>
                <button onClick={handleLogout}
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-red-500 hover:bg-red-50">
                  {t("common.logout")}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}>
                  {t("common.login")}
                </Link>
                <Link href="/auth/register"
                  className="block rounded-md bg-primary-500 px-3 py-2 text-center text-base font-medium text-white"
                  onClick={() => setMobileMenuOpen(false)}>
                  {t("common.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
