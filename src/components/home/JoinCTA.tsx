"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Bus, Users } from "lucide-react";

export function JoinCTA() {
  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Alătură-te ATPSOR
            </h2>
            <p className="mt-4 text-lg text-primary-200">
              Fie că ești transportator și vrei să faci parte din asociație, fie
              că ai nevoie de transport pentru grupul tău - platforma noastră te
              ajută.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-start md:justify-start">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-accent-600"
              >
                <Users className="h-5 w-5" />
                Devino Membru
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/request"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                <Bus className="h-5 w-5" />
                Caut Transport
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white">Contact</h3>
            <div className="mt-4 space-y-3 text-primary-100">
              <p>Telefon: +40 745 635 657</p>
              <p>Email: contact@atpsor.ro</p>
              <p>Sediu: Com. Clinceni, Str. Săbarului 120, Ilfov</p>
            </div>
            <hr className="my-4 border-white/20" />
            <p className="text-sm text-primary-200">
              ATPSOR - Asociația Transportatorilor de Persoane prin Serviciul
              Ocazional din România. Împreună pentru un transport mai bun.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
