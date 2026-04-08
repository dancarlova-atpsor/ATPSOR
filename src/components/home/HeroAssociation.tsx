"use client";

import { Link } from "@/i18n/routing";
import { Users, Shield, Scale, ArrowRight } from "lucide-react";

export function HeroAssociation() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-primary-100">
              <Shield className="h-4 w-4" />
              Asociație profesională
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Asociația Transportatorilor de Persoane prin Serviciul Ocazional din România
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-white font-medium italic">
              &ldquo;Singuri suntem o voce. Împreună suntem o forță.&rdquo;
            </p>
            <p className="mt-4 text-lg leading-relaxed text-primary-100">
              De fiecare dată când un transportator e nedreptățit, când legislația ne ignoră,
              când parcările ne sunt interzise - ATPSOR este acolo.
              Nu luptăm pentru interese personale, ci pentru <strong className="text-white">drepturile
              fiecărui transportator din România</strong>. Alătură-te celor care au curajul
              să schimbe lucrurile. Împreună, autoritățile ne aud.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/request"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-accent-600"
              >
                Caut Transport
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/membership"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Devino Membru
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:justify-center">
            <img
              src="/atpsor-logo.png"
              alt="ATPSOR Logo"
              className="h-72 w-auto drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { value: "500+", label: "Membri transportatori" },
            { value: "2000+", label: "Vehicule în rețea" },
            { value: "42", label: "Județe acoperite" },
            { value: "2024", label: "Anul înființării" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm text-primary-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
