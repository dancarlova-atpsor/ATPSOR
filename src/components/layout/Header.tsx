"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { Menu, X, Bus, Globe, User, LogOut, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || null);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole(null);
    setUserEmail(null);
    router.push("/");
  }

  function getDashboardHref() {
    if (userRole === "admin") return "/dashboard/admin" as const;
    if (userRole === "transporter") return "/dashboard/transporter" as const;
    return "/dashboard/client" as const;
  }

  const navigation = [
    { name: t("nav.home"), href: "/" as const },
    { name: t("nav.transporters"), href: "/transporters" as const },
    { name: t("nav.request"), href: "/request" as const },
    { name: t("nav.about"), href: "/about" as const },
  ];

  function switchLocale(locale: "ro" | "en") {
    router.replace(pathname, { locale });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 text-white">
            <Bus className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-primary-600">ATPSOR</span>
            <span className="hidden text-xs text-gray-500 sm:block">
              Transport Ocazional
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                pathname === item.href
                  ? "text-primary-500"
                  : "text-gray-600"
              }`}
            >
              {item.name}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              href={getDashboardHref()}
              className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary-500 ${
                pathname.includes("/dashboard")
                  ? "text-primary-500"
                  : "text-gray-600"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              {userRole === "admin"
                ? "Admin"
                : userRole === "transporter"
                  ? "Panou"
                  : "Dashboard"}
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={() =>
              switchLocale(pathname.startsWith("/en") ? "ro" : "en")
            }
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">RO / EN</span>
          </button>

          {isLoggedIn ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-gray-500">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Ieșire
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:flex"
              >
                <User className="h-4 w-4" />
                {t("common.login")}
              </Link>
              <Link
                href="/auth/register"
                className="hidden rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 sm:block"
              >
                {t("common.register")}
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  pathname === item.href
                    ? "bg-primary-50 text-primary-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                href={getDashboardHref()}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="mr-2 inline h-4 w-4" />
                {userRole === "admin" ? "Admin Panel" : "Dashboard"}
              </Link>
            )}
            <hr className="my-2" />
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="mr-2 inline h-4 w-4" />
                Ieșire ({userEmail})
              </button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("common.login")}
                </Link>
                <Link
                  href="/auth/register"
                  className="block rounded-md bg-primary-500 px-3 py-2 text-center text-base font-medium text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
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
