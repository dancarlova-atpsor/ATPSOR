"use client";

import { Gavel, FileCheck, Users, TrendingUp, Shield, Headphones } from "lucide-react";

export function ServicesSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ce Oferim Membrilor
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Beneficiile concrete ale calității de membru ATPSOR
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Gavel,
              title: "Consultanță Juridică",
              description:
                "Acces la avocați specializați în dreptul transporturilor pentru orice problemă legală.",
              color: "from-blue-500 to-blue-600",
            },
            {
              icon: FileCheck,
              title: "Asistență Documente",
              description:
                "Ajutor cu dosarele de licență, copii conforme, asigurări și alte documente necesare.",
              color: "from-green-500 to-green-600",
            },
            {
              icon: Users,
              title: "Comunitate",
              description:
                "Faci parte dintr-o comunitate de transportatori care se sprijină reciproc.",
              color: "from-purple-500 to-purple-600",
            },
            {
              icon: TrendingUp,
              title: "Platformă de Transport",
              description:
                "Acces la platforma noastră digitală unde primești cereri de transport direct de la clienți.",
              color: "from-orange-500 to-orange-600",
            },
            {
              icon: Shield,
              title: "Verificare și Credibilitate",
              description:
                "Insigna 'Verificat ATPSOR' oferă clienților încredere în serviciile tale.",
              color: "from-red-500 to-red-600",
            },
            {
              icon: Headphones,
              title: "Suport Dedicat",
              description:
                "Linie telefonică și email dedicat pentru membrii asociației.",
              color: "from-teal-500 to-teal-600",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${item.color} text-white shadow-lg`}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
