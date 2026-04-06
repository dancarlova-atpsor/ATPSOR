"use client";

import { ParkingCircle, FileWarning, Ban, AlertTriangle, Landmark, ShieldAlert } from "lucide-react";

export function ProblemsSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Problemele din Domeniu
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Acestea sunt problemele reale cu care se confruntă transportatorii
            ocazionali din România și pentru care luptăm
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ParkingCircle,
              title: "Lipsa parcărilor",
              description:
                "Autocarele și microbuzele nu au locuri de parcare dedicate în marile orașe, mai ales în zonele turistice.",
            },
            {
              icon: FileWarning,
              title: "Legislație neclară",
              description:
                "Cadrul legislativ pentru transportul ocazional este ambiguu și nu reflectă realitățile din teren.",
            },
            {
              icon: Ban,
              title: "Concurență neloială",
              description:
                "Transportatori nelegali care operează fără licență, asigurări sau documente valabile.",
            },
            {
              icon: AlertTriangle,
              title: "Birocrație excesivă",
              description:
                "Proceduri complicate și costisitoare pentru obținerea și reînnoirea licențelor de transport.",
            },
            {
              icon: Landmark,
              title: "Dialog cu autoritățile",
              description:
                "Lipsa unui canal de comunicare eficient între transportatori și autoritățile de reglementare.",
            },
            {
              icon: ShieldAlert,
              title: "Siguranța pasagerilor",
              description:
                "Necesitatea standardelor mai stricte pentru siguranța pasagerilor și calitatea serviciilor.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <item.icon className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
