"use client";

import { useTranslations } from "next-intl";
import { FileText, MessageSquare, CheckCircle } from "lucide-react";

const steps = [
  { key: "step1" as const, icon: FileText, number: "1" },
  { key: "step2" as const, icon: MessageSquare, number: "2" },
  { key: "step3" as const, icon: CheckCircle, number: "3" },
];

export function HowItWorksSection() {
  const t = useTranslations();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {t("howItWorks.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="relative text-center">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-gradient-to-r from-primary-300 to-primary-100 md:block" />
                )}

                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary-100" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  {t(`howItWorks.${step.key}.title`)}
                </h3>
                <p className="mt-3 text-gray-600">
                  {t(`howItWorks.${step.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
