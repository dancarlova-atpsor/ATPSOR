"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Shield,
  Users,
  Bus,
  Award,
  Target,
  Heart,
  ArrowRight,
} from "lucide-react";

export default function AboutPage() {
  const t = useTranslations();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">{t("nav.about")}</h1>
            <p className="mt-6 text-lg text-primary-200">
              {t("common.appFullName")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600">
                <Target className="h-4 w-4" />
                Misiunea Noastră
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Conectăm România prin transport de calitate
              </h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                ATPSOR este asociația care reunește transportatorii de persoane
                prin serviciul ocazional din România. Misiunea noastră este să
                digitalizăm și să profesionalizăm industria transportului
                ocazional de persoane.
              </p>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                Prin această platformă, oferim un mediu sigur și transparent
                unde clienții pot găsi rapid transportatori verificați, iar
                transportatorii pot accesa cereri de transport din toată țara.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  icon: Shield,
                  label: "Transportatori Verificați",
                  value: "500+",
                },
                { icon: Bus, label: "Vehicule în Flotă", value: "2000+" },
                { icon: Users, label: "Călători Transportați", value: "50k+" },
                { icon: Award, label: "Ani de Experiență", value: "15+" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white p-6 shadow-md text-center"
                >
                  <stat.icon className="mx-auto h-8 w-8 text-primary-500" />
                  <div className="mt-3 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Valorile Noastre
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Siguranță",
                description:
                  "Verificăm toți transportatorii și documentele vehiculelor. Licențe, asigurări și ITP-uri valabile sunt obligatorii.",
              },
              {
                icon: Heart,
                title: "Transparență",
                description:
                  "Prețuri clare, recenzii reale și comunicare directă între client și transportator.",
              },
              {
                icon: Award,
                title: "Calitate",
                description:
                  "Promovăm standarde înalte în industrie. Vehicule moderne, confortabile și întreținute.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="rounded-xl bg-white p-8 shadow-md text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                  <value.icon className="h-7 w-7 text-primary-600" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  {value.title}
                </h3>
                <p className="mt-3 text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Alătură-te platformei ATPSOR
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Fie că ești client sau transportator, platforma noastră te ajută să
            găsești soluția perfectă.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/request"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-8 py-3 font-semibold text-white hover:bg-accent-600"
            >
              Solicită Transport
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary-500 px-8 py-3 font-semibold text-primary-600 hover:bg-primary-50"
            >
              Înregistrare Transportator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
