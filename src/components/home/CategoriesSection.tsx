"use client";

import { useTranslations } from "next-intl";
import { Car, Bus, Truck, TrainFront, Crown, Gem } from "lucide-react";

const categories = [
  {
    key: "ridesharing" as const,
    label: "Ride Sharing",
    seats: "3+1 - 8+1 locuri",
    description:
      "Perfect pentru transferuri private, cursuri business și grupuri mici.",
    icon: Car,
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    key: "microbuz" as const,
    label: "Microbuz",
    seats: "9 - 23 locuri",
    description:
      "Ideal pentru grupuri mici, transferuri aeroport și excursii scurte.",
    icon: Bus,
    gradient: "from-blue-500 to-blue-600",
  },
  {
    key: "midiautocar" as const,
    label: "Midiautocar",
    seats: "24 - 35 locuri",
    description:
      "Potrivit pentru excursii de grup, evenimente corporate și tabere.",
    icon: Truck,
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    key: "autocar" as const,
    label: "Autocar",
    seats: "36 - 52 locuri",
    description:
      "Pentru excursii mari, turnee și transport de echipe sportive.",
    icon: TrainFront,
    gradient: "from-purple-500 to-purple-600",
  },
  {
    key: "autocar_maxi" as const,
    label: "Autocar Maxi",
    seats: "53 - 60 locuri",
    description:
      "Capacitate mare pentru excursii extinse și transport organizat.",
    icon: Crown,
    gradient: "from-amber-500 to-amber-600",
  },
  {
    key: "autocar_grand_turismo" as const,
    label: "Autocar Grand Turismo",
    seats: "61 - 80 locuri",
    description:
      "Capacitate maximă pentru turnee, pelerinaje și evenimente de amploare.",
    icon: Gem,
    gradient: "from-rose-500 to-rose-600",
  },
];

export function CategoriesSection() {
  const t = useTranslations();

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {t("categories.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t("categories.subtitle")}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.key}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${category.gradient} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {category.label}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary-500">
                  {category.seats}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {category.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
