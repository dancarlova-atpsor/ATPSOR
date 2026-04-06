"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Bus, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <img src="/atpsor-logo.png" alt="ATPSOR" className="h-16 w-auto" />
            </div>
            <p className="text-sm leading-relaxed">{t("footer.aboutText")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/transporters"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.transporters")}
                </Link>
              </li>
              <li>
                <Link
                  href="/request"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.request")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  {t("footer.cookies")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("common.contact")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-400" />
                <span>+40 745 635 657</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-400" />
                <span>contact@atpsor.ro</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary-400" />
                <span>Com. Clinceni, Str. Săbarului 120, Ilfov</span>
              </li>
              <li className="text-xs text-gray-500 mt-2">
                CIF: 52819099
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} ATPSOR. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
