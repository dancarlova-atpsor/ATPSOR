"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VEHICLE_CATEGORIES, type VehicleCategory } from "@/types/database";

const featureIcons: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  AC: Snowflake,
  TV: Tv,
  Frigider: Coffee,
};

export function TransporterProfile() {
  const t = useTranslations();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [companyRes, vehiclesRes] = await Promise.all([
        supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single(),
        supabase
          .from("vehicles")
          .select("*")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (companyRes.data) setCompany(companyRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      setLoading(false);
    }

    if (companyId) loadData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">Transportatorul nu a fost găsit</h2>
        <Link
          href="/transporters"
          className="mt-4 inline-block text-primary-500 hover:text-primary-600"
        >
          ← Înapoi la lista de transportatori
        </Link>
      </div>
    );
  }

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
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-20 w-20 rounded-xl object-cover border-2 border-white/30"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/20 text-white">
                <Bus className="h-10 w-10" />
              </div>
            )}
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
                  {company.city}, {company.county}
                </span>
                {company.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {company.rating} ({company.total_reviews} recenzii)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Info */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {company.phone && (
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
            )}
            {company.email && (
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
            )}
            {company.website && (
              <a
                href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <Globe className="h-5 w-5 text-primary-500" />
                <div>
                  <div className="text-xs text-gray-500">Website</div>
                  <div className="text-sm font-medium">{company.website}</div>
                </div>
              </a>
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
        {company.description && (
          <div className="px-8 py-6">
            <p className="text-gray-600 leading-relaxed">{company.description}</p>
          </div>
        )}
      </div>

      {/* Fleet */}
      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          {t("transporters.viewFleet")} ({vehicles.length}{" "}
          {t("transporters.vehicles")})
        </h2>

        {vehicles.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <Bus className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">Acest transportator nu are vehicule adăugate încă.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="overflow-hidden rounded-xl bg-white shadow-md"
              >
                {/* Vehicle image */}
                {vehicle.images && vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0]}
                    alt={vehicle.name}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Bus className="h-16 w-16 text-gray-300" />
                  </div>
                )}

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
                      {VEHICLE_CATEGORIES[vehicle.category as VehicleCategory]?.label || vehicle.category}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{vehicle.seats}</span>{" "}
                    {t("common.seats")}
                  </div>

                  {/* Features */}
                  {vehicle.features && vehicle.features.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vehicle.features.map((feature: string) => {
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
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
