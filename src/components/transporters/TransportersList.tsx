"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Star,
  Bus,
  Shield,
  ChevronDown,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { ROMANIAN_COUNTIES, type VehicleCategory } from "@/types/database";
import { VEHICLE_CATEGORIES } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface TransporterData {
  id: string;
  name: string;
  city: string;
  county: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  description: string;
  phone: string;
  email: string;
  logo_url: string | null;
  vehicles_count: number;
  categories: VehicleCategory[];
  price_per_km: Record<string, number>;
  pickup_cities: string[];
}

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
  const [pickupCityFilter, setPickupCityFilter] = useState("");
  const [transporters, setTransporters] = useState<TransporterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransporters() {
      const supabase = createClient();

      // Fetch companies, pricing, and vehicle counts in parallel
      const [companiesRes, pricingRes, vehiclesRes] = await Promise.all([
        supabase
          .from("companies")
          .select(
            "id, name, city, county, rating, total_reviews, is_verified, description, phone, email, logo_url, pickup_cities"
          ),
        supabase
          .from("company_pricing")
          .select("company_id, vehicle_category, price_per_km"),
        supabase
          .from("vehicles")
          .select("company_id")
          .eq("is_active", true),
      ]);

      const companies = companiesRes.data ?? [];
      const pricing = pricingRes.data ?? [];
      const vehicles = vehiclesRes.data ?? [];

      // Build vehicle counts per company
      const vehicleCounts: Record<string, number> = {};
      for (const v of vehicles) {
        vehicleCounts[v.company_id] = (vehicleCounts[v.company_id] || 0) + 1;
      }

      // Build pricing maps per company
      const pricingByCompany: Record<
        string,
        { categories: VehicleCategory[]; priceMap: Record<string, number> }
      > = {};
      for (const p of pricing) {
        if (!pricingByCompany[p.company_id]) {
          pricingByCompany[p.company_id] = { categories: [], priceMap: {} };
        }
        const entry = pricingByCompany[p.company_id];
        if (!entry.categories.includes(p.vehicle_category as VehicleCategory)) {
          entry.categories.push(p.vehicle_category as VehicleCategory);
        }
        entry.priceMap[p.vehicle_category] = p.price_per_km;
      }

      // Map to the shape the UI expects
      const mapped: TransporterData[] = companies.map((c) => ({
        id: c.id,
        name: c.name ?? "",
        city: c.city ?? "",
        county: c.county ?? "",
        rating: c.rating ?? 0,
        total_reviews: c.total_reviews ?? 0,
        is_verified: c.is_verified ?? false,
        description: c.description ?? "",
        phone: c.phone ?? "",
        email: c.email ?? "",
        logo_url: c.logo_url ?? null,
        vehicles_count: vehicleCounts[c.id] ?? 0,
        categories: pricingByCompany[c.id]?.categories ?? [],
        price_per_km: pricingByCompany[c.id]?.priceMap ?? {},
        pickup_cities: c.pickup_cities ?? [],
      }));

      setTransporters(mapped);
      setLoading(false);
    }

    fetchTransporters();
  }, []);

  const filtered = transporters.filter((company) => {
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
    if (
      pickupCityFilter &&
      !company.pickup_cities.some((city) =>
        city.toLowerCase().includes(pickupCityFilter.toLowerCase())
      )
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

          {/* Pickup city filter */}
          <div className="relative sm:col-span-3">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={pickupCityFilter}
              onChange={(e) => setPickupCityFilter(e.target.value)}
              placeholder="Disponibil din orașul:"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Results */}
      {!loading && (
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

                {/* Pickup cities */}
                {company.pickup_cities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {company.pickup_cities.map((city) => (
                      <span
                        key={city}
                        className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                )}

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
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <Bus className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg text-gray-500">{t("subtitle")}</p>
        </div>
      )}
    </div>
  );
}
