"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { Search, MapPin, Users, Calendar } from "lucide-react";

export function HeroSection() {
  const t = useTranslations();
  const [pickup, setPickup] = useState("");
  const [passengers, setPassengers] = useState("");
  const [date, setDate] = useState("");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100 sm:text-xl">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              {/* Destination */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("hero.searchPlaceholder")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder={t("hero.searchPlaceholder")}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("hero.passengers")}
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    placeholder="20"
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("hero.departureDate")}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <Link
                href={`/request?pickup=${encodeURIComponent(pickup)}&passengers=${passengers}&date=${date}`}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-accent-600"
              >
                <Search className="h-5 w-5" />
                {t("hero.findTransport")}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold">500+</div>
            <div className="mt-1 text-sm text-primary-200">Transportatori</div>
          </div>
          <div>
            <div className="text-3xl font-bold">2000+</div>
            <div className="mt-1 text-sm text-primary-200">Vehicule</div>
          </div>
          <div>
            <div className="text-3xl font-bold">42</div>
            <div className="mt-1 text-sm text-primary-200">Județe</div>
          </div>
        </div>
      </div>
    </section>
  );
}
