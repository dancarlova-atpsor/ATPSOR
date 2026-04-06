"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Star,
  Bus,
  Shield,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  ArrowLeft,
  Wifi,
  Snowflake,
  Tv,
  Coffee,
} from "lucide-react";

// Demo data
import { VEHICLE_CATEGORIES, type VehicleCategory } from "@/types/database";

const DEMO_COMPANY = {
  id: "1",
  name: "TransExpress SRL",
  cui: "RO12345678",
  license_number: "LIC-2024-1234",
  city: "București",
  county: "București",
  address: "Str. Transportului nr. 42, Sector 1",
  rating: 4.8,
  total_reviews: 124,
  is_verified: true,
  description:
    "Cu o experiență de peste 15 ani în transportul de persoane, TransExpress SRL oferă servicii de înaltă calitate pentru excursii, evenimente corporate, tabere școlare și transferuri aeroportuare. Flota noastră modernă și echipa de șoferi profesioniști asigură călătorii sigure și confortabile în toată România și Europa.",
  phone: "+40 721 123 456",
  email: "contact@transexpress.ro",
  website: "www.transexpress.ro",
  vehicles: [
    {
      id: "v1",
      name: "Mercedes Sprinter 2023",
      category: "microbuz" as VehicleCategory,
      seats: 19,
      brand: "Mercedes-Benz",
      model: "Sprinter 516",
      year: 2023,
      features: ["AC", "WiFi", "TV", "Priză USB"],
      is_active: true,
    },
    {
      id: "v2",
      name: "MAN Lion's Coach 2022",
      category: "autocar" as VehicleCategory,
      seats: 48,
      brand: "MAN",
      model: "Lion's Coach R08",
      year: 2022,
      features: ["AC", "WiFi", "TV", "Toaletă", "Frigider", "Priză USB"],
      is_active: true,
    },
    {
      id: "v3",
      name: "Iveco Daily 2024",
      category: "microbuz" as VehicleCategory,
      seats: 16,
      brand: "Iveco",
      model: "Daily Hi-Matic",
      year: 2024,
      features: ["AC", "WiFi", "Priză USB"],
      is_active: true,
    },
    {
      id: "v4",
      name: "Setra ComfortClass 2021",
      category: "autocar_maxi" as VehicleCategory,
      seats: 55,
      brand: "Setra",
      model: "S 516 HD",
      year: 2021,
      features: ["AC", "WiFi", "TV", "Toaletă", "Frigider", "Priză USB", "Scaune reclinabile"],
      is_active: true,
    },
  ],
};

const featureIcons: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  AC: Snowflake,
  TV: Tv,
  Frigider: Coffee,
};

export function TransporterProfile() {
  const t = useTranslations();
  const company = DEMO_COMPANY;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/transporters"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      {/* Company Header */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Logo placeholder */}
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/20 text-white">
              <Bus className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {company.name}
                </h1>
                {company.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
                    <Shield className="h-3.5 w-3.5" />
                    {t("transporters.verified")}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-primary-100">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {company.address}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {company.rating} ({company.total_reviews} recenzii)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Info */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={`tel:${company.phone}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <Phone className="h-5 w-5 text-primary-500" />
              <div>
                <div className="text-xs text-gray-500">{t("common.phone")}</div>
                <div className="text-sm font-medium">{company.phone}</div>
              </div>
            </a>
            <a
              href={`mailto:${company.email}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <Mail className="h-5 w-5 text-primary-500" />
              <div>
                <div className="text-xs text-gray-500">{t("common.email")}</div>
                <div className="text-sm font-medium">{company.email}</div>
              </div>
            </a>
            {company.website && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                <Globe className="h-5 w-5 text-primary-500" />
                <div>
                  <div className="text-xs text-gray-500">Website</div>
                  <div className="text-sm font-medium">{company.website}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
              <Shield className="h-5 w-5 text-primary-500" />
              <div>
                <div className="text-xs text-gray-500">CUI</div>
                <div className="text-sm font-medium">{company.cui}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-8 py-6">
          <p className="text-gray-600 leading-relaxed">{company.description}</p>
        </div>
      </div>

      {/* Fleet */}
      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          {t("transporters.viewFleet")} ({company.vehicles.length}{" "}
          {t("transporters.vehicles")})
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {company.vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="overflow-hidden rounded-xl bg-white shadow-md"
            >
              {/* Vehicle image placeholder */}
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Bus className="h-16 w-16 text-gray-300" />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {vehicle.brand} {vehicle.model} &middot; {vehicle.year}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                    {VEHICLE_CATEGORIES[vehicle.category]?.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{vehicle.seats}</span>{" "}
                  {t("common.seats")}
                </div>

                {/* Features */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {vehicle.features.map((feature) => {
                    const Icon = featureIcons[feature];
                    return (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        {feature}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 rounded-xl bg-primary-50 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900">
          Ai nevoie de transport de la {company.name}?
        </h3>
        <p className="mt-2 text-gray-600">
          Trimite o cerere de transport și primește o ofertă personalizată.
        </p>
        <Link
          href="/request"
          className="mt-4 inline-block rounded-lg bg-primary-500 px-8 py-3 font-semibold text-white hover:bg-primary-600"
        >
          {t("nav.request")}
        </Link>
      </div>
    </div>
  );
}
