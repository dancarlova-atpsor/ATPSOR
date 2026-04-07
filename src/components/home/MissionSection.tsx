"use client";

import { Scale, Megaphone, HandshakeIcon, BookOpen } from "lucide-react";

export function MissionSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Misiunea Noastră
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            Rolul asociației este de a aduce în atenția autorităților problemele cu care
            ne confruntăm în această activitate, de a sprijini membrii cu informații utile
            și de a facilita accesul la servicii de specialitate.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Megaphone,
              title: "Reprezentare",
              description:
                "Reprezentăm transportatorii în fața autorităților locale și centrale pentru rezolvarea problemelor din domeniu.",
              color: "bg-blue-100 text-blue-600",
            },
            {
              icon: Scale,
              title: "Legislație",
              description:
                "Susținem modificarea și îmbunătățirea cadrului legislativ în favoarea transportatorilor ocazionali.",
              color: "bg-red-100 text-red-600",
            },
            {
              icon: BookOpen,
              title: "Informare",
              description:
                "Oferim membrilor informații utile despre reglementări, schimbări legislative și oportunități din domeniu.",
              color: "bg-green-100 text-green-600",
            },
            {
              icon: HandshakeIcon,
              title: "Consultanță",
              description:
                "Facilităm accesul la servicii de specialitate: consultanță juridică, fiscală și de afaceri.",
              color: "bg-purple-100 text-purple-600",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
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
