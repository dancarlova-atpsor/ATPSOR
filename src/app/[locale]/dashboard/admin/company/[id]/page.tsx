"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Building2, Bus, FileCheck, CheckCircle, XCircle,
  AlertTriangle, Loader2, Star, Mail, Phone, MapPin,
  Calendar, DollarSign, Download, Eye, FileText,
} from "lucide-react";
import { VEHICLE_CATEGORIES } from "@/types/database";

const DOC_LABELS: Record<string, string> = {
  company_license: "Licență Transport",
  vehicle_registration_itp: "Talon cu ITP",
  certified_copy: "Copie Conformă",
  passenger_luggage_insurance: "Asigurare Bagaje și Călători",
  rca_insurance: "Asigurare RCA",
  other: "Alt document",
};

export default function AdminCompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") { router.push("/"); return; }

    const [companyRes, vehiclesRes, companyDocsRes, vehicleDocsRes, bookingsRes, pricingRes] = await Promise.all([
      supabase.from("companies").select("*, owner:profiles(*)").eq("id", id).single(),
      supabase.from("vehicles").select("*").eq("company_id", id),
      supabase.from("company_documents").select("*").eq("company_id", id),
      supabase.from("vehicle_documents").select("*").eq("company_id", id),
      supabase.from("bookings").select("*").eq("company_id", id).order("created_at", { ascending: false }),
      supabase.from("company_pricing").select("*").eq("company_id", id),
    ]);

    if (companyRes.data) setCompany(companyRes.data);
    if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    if (companyDocsRes.data) setCompanyDocs(companyDocsRes.data);
    if (vehicleDocsRes.data) setVehicleDocs(vehicleDocsRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (pricingRes.data) setPricing(pricingRes.data);
    setLoading(false);
  }

  async function verifyDocument(table: "company_documents" | "vehicle_documents", docId: string) {
    const supabase = createClient();
    await supabase.from(table).update({
      is_verified: true,
      verified_at: new Date().toISOString(),
    }).eq("id", docId);
    loadData();
  }

  async function unverifyDocument(table: "company_documents" | "vehicle_documents", docId: string) {
    const supabase = createClient();
    await supabase.from(table).update({ is_verified: false }).eq("id", docId);
    loadData();
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  }

  if (!company) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Companie negăsită</h1></div>;
  }

  const today = new Date().toISOString().split("T")[0];
  const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/dashboard/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Înapoi la Admin
      </Link>

      {/* Company header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-8 text-white">
        <div className="flex items-center gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-20 w-20 rounded-xl object-cover bg-white p-2" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/20">
              <Building2 className="h-10 w-10" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="mt-1 text-purple-200">CUI: {company.cui} &middot; {company.city}, {company.county}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${company.is_approved ? "bg-green-500" : "bg-yellow-500"}`}>
                {company.is_approved ? "Aprobat" : "Neaprobat"}
              </span>
              {company.is_verified && (
                <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium">✓ Verificat</span>
              )}
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                {company.rating || 0}/5 ({company.total_reviews} recenzii)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="flex items-center gap-2 text-purple-100">
            <Phone className="h-4 w-4" /> {company.phone || "—"}
          </div>
          <div className="flex items-center gap-2 text-purple-100">
            <Mail className="h-4 w-4" /> {company.email || "—"}
          </div>
          <div className="flex items-center gap-2 text-purple-100">
            <Building2 className="h-4 w-4" /> Licență: {company.license_number || "—"}
          </div>
          <div className="flex items-center gap-2 text-purple-100">
            <MapPin className="h-4 w-4" /> {company.address}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Bus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{vehicles.length}</div>
              <div className="text-xs text-gray-500">Vehicule</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <FileCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{companyDocs.length + vehicleDocs.length}</div>
              <div className="text-xs text-gray-500">Documente</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{bookings.length}</div>
              <div className="text-xs text-gray-500">Rezervări</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{totalRevenue.toLocaleString("ro-RO")}</div>
              <div className="text-xs text-gray-500">RON venituri</div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Documents */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FileCheck className="h-5 w-5 text-purple-500" />
          Documente Companie ({companyDocs.length})
        </h3>
        {companyDocs.length === 0 ? (
          <p className="text-sm text-gray-400">Niciun document încărcat.</p>
        ) : (
          <div className="space-y-2">
            {companyDocs.map((d) => {
              const expired = d.expiry_date && d.expiry_date < today;
              return (
                <div key={d.id} className={`flex items-center justify-between rounded-lg border p-3 ${expired ? "border-red-200 bg-red-50" : d.is_verified ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${expired ? "text-red-500" : d.is_verified ? "text-green-500" : "text-gray-400"}`} />
                    <div>
                      <div className="font-medium text-gray-900">{DOC_LABELS[d.document_type] || d.document_type}</div>
                      <div className="text-xs text-gray-500">
                        Expiră: {d.expiry_date || "—"} {expired && <span className="text-red-600 font-medium">(EXPIRAT)</span>}
                        {d.file_name && ` · ${d.file_name}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noreferrer" className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100" title="Vezi">
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    {d.file_url && (
                      <a href={d.file_url} download className="rounded-lg bg-gray-50 p-2 text-gray-600 hover:bg-gray-100" title="Descarcă">
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    {d.is_verified ? (
                      <button onClick={() => unverifyDocument("company_documents", d.id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                        ✓ Verificat
                      </button>
                    ) : (
                      <button onClick={() => verifyDocument("company_documents", d.id)} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                        Verifică
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vehicles + their docs */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Bus className="h-5 w-5 text-purple-500" />
          Vehicule ({vehicles.length})
        </h3>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-400">Niciun vehicul înregistrat.</p>
        ) : (
          <div className="space-y-4">
            {vehicles.map((v) => {
              const vDocs = vehicleDocs.filter((d) => d.vehicle_id === v.id);
              return (
                <div key={v.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{v.name}</div>
                      <div className="text-sm text-gray-500">
                        {VEHICLE_CATEGORIES[v.category as keyof typeof VEHICLE_CATEGORIES]?.label} · {v.seats} locuri · {v.year}
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${v.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {v.is_active ? "Activ" : "Repaus"}
                    </span>
                  </div>

                  {vDocs.length > 0 && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      <div className="text-xs font-medium text-gray-500">Documente vehicul ({vDocs.length}):</div>
                      {vDocs.map((d) => {
                        const expired = d.expiry_date && d.expiry_date < today;
                        return (
                          <div key={d.id} className={`flex items-center justify-between rounded border p-2 text-sm ${expired ? "border-red-200 bg-red-50" : d.is_verified ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
                            <div className="flex items-center gap-2">
                              <FileText className={`h-4 w-4 ${expired ? "text-red-500" : d.is_verified ? "text-green-500" : "text-gray-400"}`} />
                              <span className="font-medium">{DOC_LABELS[d.document_type] || d.document_type}</span>
                              <span className="text-xs text-gray-500">
                                exp: {d.expiry_date || "—"}
                                {expired && <span className="ml-1 text-red-600 font-bold">EXPIRAT</span>}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {d.file_url && (
                                <a href={d.file_url} target="_blank" rel="noreferrer" className="rounded bg-blue-50 p-1 text-blue-600 hover:bg-blue-100"><Eye className="h-3.5 w-3.5" /></a>
                              )}
                              {d.is_verified ? (
                                <button onClick={() => unverifyDocument("vehicle_documents", d.id)} className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">✓</button>
                              ) : (
                                <button onClick={() => verifyDocument("vehicle_documents", d.id)} className="rounded bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">Verifică</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pricing */}
      {pricing.length > 0 && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5 text-purple-500" />
            Tarife ({pricing.length})
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {pricing.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
                <span className="font-medium">{VEHICLE_CATEGORIES[p.vehicle_category as keyof typeof VEHICLE_CATEGORIES]?.label}</span>
                <span className="text-gray-600">{p.price_per_km} RON/km · min {p.min_km_per_day} km/zi</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5 text-purple-500" />
          Rezervări ({bookings.length})
        </h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400">Nicio rezervare.</p>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 10).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
                <div>
                  <div className="font-medium">{b.pickup_city} → {b.dropoff_city}</div>
                  <div className="text-xs text-gray-500">
                    {b.departure_date} · {b.client_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{Number(b.total_price).toFixed(2)} {b.currency}</div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${b.status === "confirmed" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-700"}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
