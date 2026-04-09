"use client";

import { Link } from "@/i18n/routing";
import { BookOpen, Shield, Bus, Users, ArrowRight } from "lucide-react";

const manuals = [
  {
    title: "Manual Transportator",
    description: "Ghid complet pentru transportatori: inregistrare, vehicule, documente, preturi, rezervari, SmartBill.",
    href: "/manual/transportator" as const,
    icon: Bus,
    color: "bg-primary-100 text-primary-600",
    role: "Transportatori",
  },
  {
    title: "Manual Client",
    description: "Cum cauti transport, compari oferte, platesti cu cardul sau transfer bancar, vizualizezi facturi.",
    href: "/manual/client" as const,
    icon: Users,
    color: "bg-green-100 text-green-600",
    role: "Clienti",
  },
  {
    title: "Manual Administrare",
    description: "Gestionare companii, conturi, cereri, oferte, rezervari, facturi si publicare activitati.",
    href: "/manual/admin" as const,
    icon: Shield,
    color: "bg-purple-100 text-purple-600",
    role: "Admin",
  },
];

export default function ManualIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <BookOpen className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Manuale de Utilizare</h1>
        <p className="mt-3 text-lg text-gray-600">
          Alege manualul potrivit pentru rolul tau pe platforma ATPSOR
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {manuals.map((manual) => {
          const Icon = manual.icon;
          return (
            <Link
              key={manual.href}
              href={manual.href}
              className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl hover:ring-2 hover:ring-primary-200"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${manual.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="mb-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {manual.role}
              </span>
              <h2 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-primary-600">
                {manual.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{manual.description}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-500 group-hover:text-primary-600">
                Deschide manualul
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
