"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, Shield } from "lucide-react";

export function CTASection() {
  const t = useTranslations();

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          {/* For Clients */}
          <div className="text-center md:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-primary-100">
              <Shield className="h-4 w-4" />
              Transportatori verificați ATPSOR
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ai nevoie de transport pentru grupul tău?
            </h2>
            <p className="mt-4 text-lg text-primary-200">
              Postează o cerere gratuită și primește oferte competitive de la
              transportatori verificați din toată România.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-start md:justify-start">
              <Link
                href="/request"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-accent-600"
              >
                {t("nav.request")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/transporters"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t("nav.transporters")}
              </Link>
            </div>
          </div>

          {/* For Transporters */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white">
              Ești transportator?
            </h3>
            <p className="mt-3 text-primary-200">
              Alătură-te platformei ATPSOR și primește cereri de transport direct
              de la clienți verificați.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Acces la cereri de transport din toată țara",
                "Profil de companie cu flota ta completă",
                "Sistem de rezervări și plăți online",
                "Recenzii și rating de la clienți",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-primary-100">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs text-white">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-600 shadow transition-colors hover:bg-gray-100"
            >
              {t("common.register")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
