"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Search,
  MapPin,
  Star,
  Bus,
  Shield,
  ChevronDown,
  Phone,
  Mail,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { ROMANIAN_COUNTIES, type VehicleCategory } from "@/types/database";

import { VEHICLE_CATEGORIES } from "@/types/database";

// Demo data - will be replaced with Supabase queries
const DEMO_TRANSPORTERS = [
  {
    id: "1",
    name: "TransExpress SRL",
    city: "București",
    county: "București",
    rating: 4.8,
    total_reviews: 124,
    is_verified: true,
    description:
      "Transport de persoane de peste 15 ani. Flotă modernă, șoferi profesioniști.",
    phone: "+40 721 123 456",
    email: "contact@transexpress.ro",
    vehicles_count: 12,
    categories: ["ridesharing", "microbuz", "autocar"] as VehicleCategory[],
    price_per_km: { ridesharing: 2.50, microbuz: 4.50, autocar: 7.50 } as Record<string, number>,
    logo_url: null,
  },
  {
    id: "2",
    name: "RoTravel Transport",
    city: "Cluj-Napoca",
    county: "Cluj",
    rating: 4.6,
    total_reviews: 87,
    is_verified: true,
    description:
      "Servicii de transport ocazional în zona Transilvania. Microbuze și autocare.",
    phone: "+40 745 234 567",
    email: "info@rotravel.ro",
    vehicles_count: 8,
    categories: ["microbuz", "midiautocar", "autocar"] as VehicleCategory[],
    price_per_km: { microbuz: 4.50, midiautocar: 6.50, autocar: 7.50 } as Record<string, number>,
    logo_url: null,
  },
  {
    id: "3",
    name: "EuroTrans Group",
    city: "Timișoara",
    county: "Timiș",
    rating: 4.9,
    total_reviews: 203,
    is_verified: true,
    description:
      "Lider în transportul de persoane în vestul României. Autocare premium.",
    phone: "+40 756 345 678",
    email: "office@eurotrans.ro",
    vehicles_count: 20,
    categories: ["autocar", "autocar_maxi", "autocar_grand_turismo"] as VehicleCategory[],
    price_per_km: { autocar: 7.50, autocar_maxi: 8.50, autocar_grand_turismo: 9.50 } as Record<string, number>,
    logo_url: null,
  },
  {
    id: "4",
    name: "MoldoTur SRL",
    city: "Iași",
    county: "Iași",
    rating: 4.5,
    total_reviews: 56,
    is_verified: true,
    description:
      "Transport ocazional pentru excursii, tabere și evenimente în Moldova.",
    phone: "+40 732 456 789",
    email: "contact@moldotur.ro",
    vehicles_count: 6,
    categories: ["microbuz", "midiautocar"] as VehicleCategory[],
    price_per_km: { microbuz: 4.50, midiautocar: 6.50 } as Record<string, number>,
    logo_url: null,
  },
  {
    id: "5",
    name: "Black Sea Transport",
    city: "Constanța",
    county: "Constanța",
    rating: 4.7,
    total_reviews: 142,
    is_verified: true,
    description:
      "Specializați în transport turistic la Marea Neagră. Transfer aeroport și excursii.",
    phone: "+40 723 567 890",
    email: "rezervari@bstransport.ro",
    vehicles_count: 15,
    categories: ["ridesharing", "microbuz", "midiautocar", "autocar"] as VehicleCategory[],
    price_per_km: { ridesharing: 2.50, microbuz: 4.50, midiautocar: 6.50, autocar: 7.50 } as Record<string, number>,
    logo_url: null,
  },
  {
    id: "6",
    name: "Carpați Bus",
    city: "Brașov",
    county: "Brașov",
    rating: 4.4,
    total_reviews: 38,
    is_verified: false,
    description: "Transport de persoane în zona Brașov-Sibiu. Microbuze 9-23 locuri.",
    phone: "+40 744 678 901",
    email: "info@carpati-bus.ro",
    vehicles_count: 4,
    categories: ["ridesharing", "microbuz"] as VehicleCategory[],
    price_per_km: { ridesharing: 2.50, microbuz: 4.50 } as Record<string, number>,
    logo_url: null,
  },
];

const categoryLabels: Record<VehicleCategory, string> = Object.fromEntries(
  Object.entries(VEHICLE_CATEGORIES).map(([key, val]) => [
    key,
    `${val.label} (${val.minSeats}-${val.maxSeats})`,
  ])
) as Record<VehicleCategory, string>;

export function TransportersList() {
  const t = useTranslations("transporters");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const filtered = DEMO_TRANSPORTERS.filter((company) => {
    if (
      searchQuery &&
      !company.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !company.city.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedCounty && company.county !== selectedCounty) {
      return false;
    }
    if (
      selectedCategory &&
      !company.categories.includes(selectedCategory as VehicleCategory)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 rounded-xl bg-white p-4 shadow-md sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("title")}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          {/* County filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-8 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">{t("filters.allCounties")}</option>
              {ROMANIAN_COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Vehicle type filter */}
          <div className="relative">
            <Bus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-8 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">{t("filters.allTypes")}</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((company) => (
          <div
            key={company.id}
            className="group overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {company.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-primary-100">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.city}, {company.county}
                  </div>
                </div>
                {company.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-xs font-medium text-white">
                    <Shield className="h-3 w-3" />
                    {t("verified")}
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 line-clamp-2">
                {company.description}
              </p>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {company.rating}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({company.total_reviews})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Bus className="h-4 w-4" />
                  {company.vehicles_count} {t("vehicles")}
                </div>
              </div>

              {/* Tarife per categorie - vizibile doar clientilor */}
              <div className="mt-3 space-y-1.5">
                {company.categories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5"
                  >
                    <span className="text-xs text-gray-600">
                      {VEHICLE_CATEGORIES[cat]?.label}
                    </span>
                    <span className="text-xs font-bold text-primary-600">
                      {company.price_per_km[cat]?.toFixed(2)} RON/km + TVA
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-2">
                <Link
                  href={`/transporters/${company.id}`}
                  className="flex-1 rounded-lg bg-primary-500 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-600"
                >
                  {t("viewFleet")}
                </Link>
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2.5 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2.5 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Bus className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg text-gray-500">{t("subtitle")}</p>
        </div>
      )}
    </div>
  );
}
