"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  FileText,
  MessageSquare,
  CreditCard,
  Shield,
  Bus,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  BarChart3,
  Eye,
  UserCheck,
  BadgeCheck,
  Trash2,
  CalendarCheck,
  DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VEHICLE_CATEGORIES } from "@/types/database";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "companies" | "requests" | "offers" | "documents"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string>("");

  // Data
  const [profiles, setProfiles] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [router]);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/dashboard/client");
      return;
    }

    setAdminId(user.id);

    const [
      profilesRes,
      companiesRes,
      vehiclesRes,
      requestsRes,
      offersRes,
      bookingsRes,
      paymentsRes,
      companyDocsRes,
      vehicleDocsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("*, owner:profiles(email, full_name)")
        .order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*, company:companies(name)"),
      supabase
        .from("transport_requests")
        .select("*, client:profiles(email, full_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("offers")
        .select(
          "*, company:companies(name), request:transport_requests(pickup_city, dropoff_city), vehicle:vehicles(name)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select(
          "*, company:companies(name), client:profiles(email, full_name)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("company_documents")
        .select("*, company:companies(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_documents")
        .select("*, vehicle:vehicles(name), company:companies(name)")
        .order("created_at", { ascending: false }),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (companiesRes.data) setCompanies(companiesRes.data);
    if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    if (requestsRes.data) setRequests(requestsRes.data);
    if (offersRes.data) setOffers(offersRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
    if (companyDocsRes.data) setCompanyDocs(companyDocsRes.data);
    if (vehicleDocsRes.data) setVehicleDocs(vehicleDocsRes.data);

    setLoading(false);
  }

  async function updateProfileRole(
    userId: string,
    newRole: string
  ) {
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    loadData();
  }

  async function toggleCompanyVerification(
    companyId: string,
    currentStatus: boolean
  ) {
    const supabase = createClient();
    await supabase
      .from("companies")
      .update({ is_verified: !currentStatus })
      .eq("id", companyId);
    loadData();
  }

  async function approveCompany(companyId: string) {
    const supabase = createClient();
    await supabase
      .from("companies")
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", companyId);
    loadData();
  }

  async function rejectCompany(companyId: string, reason: string) {
    const supabase = createClient();
    await supabase
      .from("companies")
      .update({
        is_approved: false,
        rejection_reason: reason,
      })
      .eq("id", companyId);
    loadData();
  }

  async function updateRequestStatus(
    requestId: string,
    newStatus: string
  ) {
    const supabase = createClient();
    await supabase
      .from("transport_requests")
      .update({ status: newStatus })
      .eq("id", requestId);
    loadData();
  }

  async function verifyDocument(
    table: "company_documents" | "vehicle_documents",
    docId: string
  ) {
    const supabase = createClient();
    await supabase
      .from(table)
      .update({
        is_verified: true,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", docId);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: BarChart3 },
    { key: "users" as const, label: "Utilizatori", icon: Users },
    { key: "companies" as const, label: "Companii", icon: Building2 },
    { key: "requests" as const, label: "Cereri", icon: FileText },
    { key: "offers" as const, label: "Oferte & Rezervări", icon: MessageSquare },
    { key: "documents" as const, label: "Documente", icon: Shield },
  ];

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (parseFloat(b.total_price) || 0),
    0
  );
  const unverifiedDocs =
    companyDocs.filter((d) => !d.is_verified).length +
    vehicleDocs.filter((d) => !d.is_verified).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Panou Administrare
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestionează platforma ATPSOR
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{profiles.length}</div>
              <div className="text-xs text-gray-500">Utilizatori</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{companies.length}</div>
              <div className="text-xs text-gray-500">Companii</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <FileText className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{requests.length}</div>
              <div className="text-xs text-gray-500">Cereri</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
              <MessageSquare className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{offers.length}</div>
              <div className="text-xs text-gray-500">Oferte</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <div className="text-xl font-bold">
                {totalRevenue.toLocaleString("ro-RO")}
              </div>
              <div className="text-xs text-gray-500">RON venituri</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{unverifiedDocs}</div>
              <div className="text-xs text-gray-500">De verificat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Conturi în așteptare */}
          {companies.filter((c: any) => !c.is_approved).length > 0 && (
            <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Conturi în așteptare ({companies.filter((c: any) => !c.is_approved).length})
              </h3>
              <div className="space-y-3">
                {companies.filter((c: any) => !c.is_approved).map((company: any) => (
                  <div key={company.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                    <div>
                      <div className="font-semibold text-gray-900">{company.name}</div>
                      <div className="mt-1 text-sm text-gray-500">
                        CUI: {company.cui} | {company.city}, {company.county} | {company.owner?.email}
                      </div>
                      {company.phone && <div className="text-sm text-gray-400">Tel: {company.phone}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveCompany(company.id)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Aprobă
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Motivul respingerii:");
                          if (reason) rejectCompany(company.id, reason);
                        }}
                        className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-200"
                      >
                        Respinge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent requests */}
            <div className="rounded-xl bg-white p-5 shadow-md">
              <h3 className="mb-4 font-semibold text-gray-900">
                Cereri recente
              </h3>
              {requests.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {r.pickup_city} → {r.dropoff_city}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.client?.full_name} &middot; {r.departure_date}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "active"
                        ? "bg-blue-50 text-blue-600"
                        : r.status === "fulfilled"
                          ? "bg-green-50 text-green-600"
                          : r.status === "pending"
                            ? "bg-yellow-50 text-yellow-600"
                            : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
              {requests.length === 0 && (
                <p className="text-sm text-gray-400">Nicio cerere încă.</p>
              )}
            </div>

            {/* Breakdown */}
            <div className="rounded-xl bg-white p-5 shadow-md">
              <h3 className="mb-4 font-semibold text-gray-900">Statistici</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Clienți</span>
                  <span className="font-medium">
                    {profiles.filter((p) => p.role === "client").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transportatori</span>
                  <span className="font-medium">
                    {profiles.filter((p) => p.role === "transporter").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Admini</span>
                  <span className="font-medium">
                    {profiles.filter((p) => p.role === "admin").length}
                  </span>
                </div>
                <div className="my-2 border-t" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Companii verificate</span>
                  <span className="font-medium text-green-600">
                    {companies.filter((c) => c.is_verified).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Companii neverificate</span>
                  <span className="font-medium text-yellow-600">
                    {companies.filter((c) => !c.is_verified).length}
                  </span>
                </div>
                <div className="my-2 border-t" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vehicule active</span>
                  <span className="font-medium">
                    {vehicles.filter((v) => v.is_active).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total bookings</span>
                  <span className="font-medium">{bookings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total plăți</span>
                  <span className="font-medium">{payments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== USERS ===== */}
      {activeTab === "users" && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-md">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nume</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Înregistrat</th>
                <th className="px-4 py-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.phone || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.role === "admin"
                          ? "bg-purple-50 text-purple-600"
                          : p.role === "transporter"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.created_at).toLocaleDateString("ro-RO")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.role}
                      onChange={(e) =>
                        updateProfileRole(p.id, e.target.value)
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="client">Client</option>
                      <option value="transporter">Transportator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {profiles.length === 0 && (
            <p className="p-8 text-center text-gray-400">
              Niciun utilizator.
            </p>
          )}
        </div>
      )}

      {/* ===== COMPANIES ===== */}
      {activeTab === "companies" && (
        <div className="space-y-4">
          {companies.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-md">
              <Building2 className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-gray-500">Nicio companie înregistrată.</p>
            </div>
          ) : (
            companies.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-white p-5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                      <Building2 className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {c.name}
                        </span>
                        {c.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span>CUI: {c.cui}</span>
                        <span>
                          {c.city}, {c.county}
                        </span>
                        <span>{c.phone}</span>
                        <span>{c.email}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Owner: {c.owner?.full_name} ({c.owner?.email})
                      </div>
                      {c.pickup_cities?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.pickup_cities.map((city: string) => (
                            <span key={city} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                              {city}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <div>
                        Rating:{" "}
                        <span className="font-medium">
                          {c.rating || 0}
                        </span>
                        /5
                      </div>
                      <div className="text-xs text-gray-400">
                        {c.total_reviews} review-uri
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        toggleCompanyVerification(c.id, c.is_verified)
                      }
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        c.is_verified
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {c.is_verified ? "Anulează verificare" : "Verifică"}
                    </button>
                  </div>
                </div>
                {/* Company vehicles */}
                {vehicles.filter((v) => v.company_id === c.id).length >
                  0 && (
                  <div className="mt-4 border-t pt-3">
                    <div className="text-xs font-medium text-gray-500">
                      Vehicule (
                      {
                        vehicles.filter((v) => v.company_id === c.id)
                          .length
                      }
                      ):
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {vehicles
                        .filter((v) => v.company_id === c.id)
                        .map((v) => (
                          <span
                            key={v.id}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                          >
                            {v.name} ({v.seats} loc.)
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== REQUESTS ===== */}
      {activeTab === "requests" && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-md">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Traseu</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Pasageri</th>
                <th className="px-4 py-3">Oferte</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {r.pickup_city} → {r.dropoff_city}
                    {r.intermediate_cities && (
                      <div className="text-xs text-gray-400">via {r.intermediate_cities}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.client?.full_name || r.client?.email}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.departure_date}
                    {r.return_date && ` → ${r.return_date}`}
                  </td>
                  <td className="px-4 py-3">{r.passengers}</td>
                  <td className="px-4 py-3">{r.offers_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "active"
                          ? "bg-blue-50 text-blue-600"
                          : r.status === "fulfilled"
                            ? "bg-green-50 text-green-600"
                            : r.status === "pending"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateRequestStatus(r.id, e.target.value)
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <p className="p-8 text-center text-gray-400">Nicio cerere.</p>
          )}
        </div>
      )}

      {/* ===== OFFERS & BOOKINGS ===== */}
      {activeTab === "offers" && (
        <div className="space-y-6">
          {/* Offers */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Oferte ({offers.length})
            </h3>
            <div className="overflow-x-auto rounded-xl bg-white shadow-md">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Companie</th>
                    <th className="px-4 py-3">Cerere</th>
                    <th className="px-4 py-3">Vehicul</th>
                    <th className="px-4 py-3">Preț/km</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => (
                    <tr key={o.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {o.company?.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {o.request?.pickup_city} →{" "}
                        {o.request?.dropoff_city}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {o.vehicle?.name}
                      </td>
                      <td className="px-4 py-3">{o.price} RON</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            o.status === "accepted"
                              ? "bg-green-50 text-green-600"
                              : o.status === "rejected"
                                ? "bg-red-50 text-red-600"
                                : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(o.created_at).toLocaleDateString(
                          "ro-RO"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {offers.length === 0 && (
                <p className="p-8 text-center text-gray-400">
                  Nicio ofertă.
                </p>
              )}
            </div>
          </div>

          {/* Bookings */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Rezervări ({bookings.length})
            </h3>
            <div className="overflow-x-auto rounded-xl bg-white shadow-md">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Companie</th>
                    <th className="px-4 py-3">Preț total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {b.client?.full_name || b.client?.email}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {b.company?.name}
                      </td>
                      <td className="px-4 py-3">
                        {b.total_price} {b.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(b.created_at).toLocaleDateString(
                          "ro-RO"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <p className="p-8 text-center text-gray-400">
                  Nicio rezervare.
                </p>
              )}
            </div>
          </div>

          {/* Payments */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Plăți ({payments.length})
            </h3>
            <div className="overflow-x-auto rounded-xl bg-white shadow-md">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Stripe ID</th>
                    <th className="px-4 py-3">Sumă</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.stripe_payment_id}
                      </td>
                      <td className="px-4 py-3">
                        {p.amount} {p.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "paid"
                              ? "bg-green-50 text-green-600"
                              : p.status === "failed"
                                ? "bg-red-50 text-red-600"
                                : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.created_at).toLocaleDateString(
                          "ro-RO"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <p className="p-8 text-center text-gray-400">
                  Nicio plată.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== DOCUMENTS ===== */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* Unverified first */}
          {unverifiedDocs > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                {unverifiedDocs} documente așteaptă verificare
              </div>
            </div>
          )}

          {/* Company Documents */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Documente Companie ({companyDocs.length})
            </h3>
            <div className="space-y-3">
              {companyDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between rounded-xl bg-white p-4 shadow-md ${
                    !doc.is_verified ? "border-l-4 border-amber-400" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        doc.is_verified ? "bg-green-100" : "bg-amber-100"
                      }`}
                    >
                      {doc.is_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Licență Transport - {doc.company?.name}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>Expiră: {doc.expiry_date}</span>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                        >
                          <Eye className="h-3 w-3" />
                          Vizualizează
                        </a>
                      </div>
                    </div>
                  </div>
                  {!doc.is_verified ? (
                    <button
                      onClick={() =>
                        verifyDocument("company_documents", doc.id)
                      }
                      className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100"
                    >
                      <CheckCircle className="mr-1 inline h-4 w-4" />
                      Verifică
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Verificat
                    </span>
                  )}
                </div>
              ))}
              {companyDocs.length === 0 && (
                <p className="rounded-xl bg-white p-5 text-center text-sm text-gray-400 shadow-md">
                  Niciun document de companie.
                </p>
              )}
            </div>
          </div>

          {/* Vehicle Documents */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Documente Vehicule ({vehicleDocs.length})
            </h3>
            <div className="space-y-3">
              {vehicleDocs.map((doc) => {
                const docLabels: Record<string, string> = {
                  vehicle_registration_itp: "Talon ITP",
                  certified_copy: "Copie Conformă",
                  passenger_luggage_insurance: "Asig. Bagaje/Călători",
                  rca_insurance: "Asigurare RCA",
                };
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between rounded-xl bg-white p-4 shadow-md ${
                      !doc.is_verified
                        ? "border-l-4 border-amber-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          doc.is_verified
                            ? "bg-green-100"
                            : "bg-amber-100"
                        }`}
                      >
                        {doc.is_verified ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {docLabels[doc.document_type] ||
                            doc.document_type}{" "}
                          - {doc.vehicle?.name}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                          <span>{doc.company?.name}</span>
                          <span>Expiră: {doc.expiry_date}</span>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                          >
                            <Eye className="h-3 w-3" />
                            Vizualizează
                          </a>
                        </div>
                      </div>
                    </div>
                    {!doc.is_verified ? (
                      <button
                        onClick={() =>
                          verifyDocument("vehicle_documents", doc.id)
                        }
                        className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100"
                      >
                        <CheckCircle className="mr-1 inline h-4 w-4" />
                        Verifică
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Verificat
                      </span>
                    )}
                  </div>
                );
              })}
              {vehicleDocs.length === 0 && (
                <p className="rounded-xl bg-white p-5 text-center text-sm text-gray-400 shadow-md">
                  Niciun document de vehicul.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
