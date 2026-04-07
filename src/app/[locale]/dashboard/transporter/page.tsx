"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
import {
  Bus,
  FileText,
  MessageSquare,
  CalendarCheck,
  DollarSign,
  Plus,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Upload,
  AlertTriangle,
  CheckCircle,
  Shield,
  FileCheck,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VEHICLE_CATEGORIES } from "@/types/database";

const VEHICLE_DOC_TYPES = [
  { type: "vehicle_registration_itp", label: "Talon cu ITP valabil" },
  { type: "certified_copy", label: "Copie Conformă" },
  {
    type: "passenger_luggage_insurance",
    label: "Asigurare Bagaje și Călători",
  },
  { type: "rca_insurance", label: "Asigurare RCA" },
];

export default function TransporterDashboard() {
  const t = useTranslations();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "requests" | "offers" | "vehicles" | "documents"
  >("requests");

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Get company
      const { data: comp } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!comp) {
        setLoading(false);
        return;
      }

      setCompany(comp);

      // Fetch all data in parallel
      const [
        vehiclesRes,
        requestsRes,
        companyDocsRes,
        vehicleDocsRes,
        offersRes,
        bookingsRes,
      ] = await Promise.all([
        supabase
          .from("vehicles")
          .select("*")
          .eq("company_id", comp.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("transport_requests")
          .select("*")
          .in("status", ["pending", "active"])
          .gte(
            "departure_date",
            new Date().toISOString().split("T")[0]
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("company_documents")
          .select("*")
          .eq("company_id", comp.id),
        supabase
          .from("vehicle_documents")
          .select("*")
          .eq("company_id", comp.id),
        supabase
          .from("offers")
          .select(
            "*, request:transport_requests(*), vehicle:vehicles(*)"
          )
          .eq("company_id", comp.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("total_price")
          .eq("company_id", comp.id),
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (requestsRes.data) setAvailableRequests(requestsRes.data);
      if (companyDocsRes.data) setCompanyDocs(companyDocsRes.data);
      if (vehicleDocsRes.data) setVehicleDocs(vehicleDocsRes.data);
      if (offersRes.data) setMyOffers(offersRes.data);
      if (bookingsRes.data) {
        setBookingsCount(bookingsRes.data.length);
        setRevenue(
          bookingsRes.data.reduce(
            (sum, b) => sum + (parseFloat(b.total_price) || 0),
            0
          )
        );
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  function getVehicleDocs(vehicleId: string) {
    return vehicleDocs.filter((d) => d.vehicle_id === vehicleId);
  }

  function isVehicleDocsValid(vehicleId: string, seats: number) {
    const docs = getVehicleDocs(vehicleId);
    const today = new Date().toISOString().split("T")[0];
    const hasItp = docs.some(
      (d) =>
        d.document_type === "vehicle_registration_itp" &&
        d.expiry_date >= today
    );
    const hasRca = docs.some(
      (d) => d.document_type === "rca_insurance" && d.expiry_date >= today
    );
    if (seats <= 9) return hasItp && hasRca;
    const hasCopy = docs.some(
      (d) => d.document_type === "certified_copy" && d.expiry_date >= today
    );
    const hasInsurance = docs.some(
      (d) =>
        d.document_type === "passenger_luggage_insurance" &&
        d.expiry_date >= today
    );
    return hasItp && hasRca && hasCopy && hasInsurance;
  }

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
        <Bus className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Nu ai o companie de transport
        </h2>
        <p className="mt-2 text-gray-500">
          Creează-ți compania pentru a putea adăuga vehicule și trimite oferte.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Completează datele firmei la înregistrare sau contactează suportul.
        </p>
      </div>
    );
  }

  const tabs = [
    {
      key: "requests" as const,
      label: t("dashboard.transporter.availableRequests"),
      icon: FileText,
    },
    {
      key: "vehicles" as const,
      label: t("dashboard.transporter.myVehicles"),
      icon: Bus,
    },
    {
      key: "documents" as const,
      label: "Documente",
      icon: FileCheck,
    },
    {
      key: "offers" as const,
      label: t("dashboard.transporter.myOffers"),
      icon: MessageSquare,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard.transporter.title")}
        </h1>
        <Link
          href="/dashboard/transporter/add-vehicle"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          {t("dashboard.transporter.addVehicle")}
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Bus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{vehicles.length}</div>
              <div className="text-xs text-gray-500">Vehicule</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {availableRequests.length}
              </div>
              <div className="text-xs text-gray-500">Cereri disponibile</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <CalendarCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{bookingsCount}</div>
              <div className="text-xs text-gray-500">Rezervări</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {revenue.toLocaleString("ro-RO")}
              </div>
              <div className="text-xs text-gray-500">RON total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary-500 text-primary-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {availableRequests.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                Nu sunt cereri de transport disponibile momentan.
              </p>
            </div>
          ) : (
            availableRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {request.pickup_city} → {request.dropoff_city}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {request.departure_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {request.passengers} pers.
                      </span>
                      {request.vehicle_category && (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                          {VEHICLE_CATEGORIES[
                            request.vehicle_category as keyof typeof VEHICLE_CATEGORIES
                          ]?.label || request.vehicle_category}
                        </span>
                      )}
                    </div>
                    {request.description && (
                      <p className="mt-1 text-sm text-gray-400">
                        {request.description}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={
                    `/dashboard/transporter/offer/${request.id}` as any
                  }
                  className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
                >
                  Trimite Ofertă
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "vehicles" && (
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="py-12 text-center">
              <Bus className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nu ai vehicule adăugate.</p>
              <Link
                href="/dashboard/transporter/add-vehicle"
                className="mt-2 inline-block text-sm font-medium text-primary-500 hover:text-primary-600"
              >
                Adaugă primul vehicul →
              </Link>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const docsValid = isVehicleDocsValid(
                vehicle.id,
                vehicle.seats
              );
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                      <Bus className="h-6 w-6 text-primary-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {vehicle.name}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        <span>{vehicle.seats} locuri</span>
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                          {VEHICLE_CATEGORIES[
                            vehicle.category as keyof typeof VEHICLE_CATEGORIES
                          ]?.label || vehicle.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {docsValid ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Documente valabile
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        Documente lipsă
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* Company Documents */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Shield className="h-5 w-5 text-primary-500" />
              Documente Firmă
            </h3>
            <div className="space-y-3">
              {companyDocs.length === 0 ? (
                <div className="rounded-xl bg-white p-5 text-center shadow-md">
                  <p className="text-sm text-gray-500">
                    Nu ai încărcat licența de transport.
                  </p>
                </div>
              ) : (
                companyDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <FileCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Licență Transport
                        </div>
                        <div className="text-sm text-gray-500">
                          Expiră: {doc.expiry_date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.is_verified && (
                        <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Verificat
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vehicle Documents */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Bus className="h-5 w-5 text-primary-500" />
              Documente Vehicule
            </h3>
            {vehicles.map((vehicle) => {
              const vDocs = getVehicleDocs(vehicle.id);
              return (
                <div key={vehicle.id} className="mb-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    {vehicle.name}
                    <span className="text-xs font-normal text-gray-400">
                      ({vehicle.seats} locuri)
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {VEHICLE_DOC_TYPES.filter(
                      (docType) =>
                        !(
                          docType.type === "certified_copy" &&
                          vehicle.seats <= 9
                        ) &&
                        !(
                          docType.type ===
                            "passenger_luggage_insurance" &&
                          vehicle.seats <= 9
                        )
                    ).map((docType) => {
                      const existingDoc = vDocs.find(
                        (d) => d.document_type === docType.type
                      );
                      const today =
                        new Date().toISOString().split("T")[0];
                      const isValid =
                        existingDoc &&
                        existingDoc.expiry_date >= today;
                      return (
                        <div
                          key={docType.type}
                          className={`rounded-lg border-2 p-4 ${
                            isValid
                              ? "border-green-200 bg-green-50"
                              : "border-dashed border-gray-300 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isValid ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {docType.label}
                              </span>
                            </div>
                            <button className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50">
                              <Upload className="h-3 w-3" />
                              {isValid ? "Actualizează" : "Încarcă"}
                            </button>
                          </div>
                          {isValid && (
                            <div className="mt-2 text-xs text-green-600">
                              Valabil până la:{" "}
                              {existingDoc.expiry_date}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Documente obligatorii:</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>
                    <strong>Licență transport</strong> - la nivel de firmă
                  </li>
                  <li>
                    <strong>Talon cu ITP valabil</strong> - pentru fiecare
                    vehicul
                  </li>
                  <li>
                    <strong>Copie conformă</strong> - pentru vehicule cu mai
                    mult de 9 locuri
                  </li>
                  <li>
                    <strong>Asigurare bagaje și călători</strong> - pentru
                    vehicule cu mai mult de 9 locuri
                  </li>
                  <li>
                    <strong>Asigurare RCA</strong> - pentru fiecare vehicul
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="space-y-4">
          {myOffers.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                Nu ai trimis încă nicio ofertă. Verifică cererile
                disponibile!
              </p>
            </div>
          ) : (
            myOffers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50">
                    <MessageSquare className="h-6 w-6 text-accent-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {offer.request?.pickup_city} →{" "}
                      {offer.request?.dropoff_city}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>{offer.price} RON/km</span>
                      <span>{offer.vehicle?.name}</span>
                      <span>{offer.request?.departure_date}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    offer.status === "accepted"
                      ? "bg-green-50 text-green-600"
                      : offer.status === "rejected"
                        ? "bg-red-50 text-red-600"
                        : "bg-yellow-50 text-yellow-600"
                  }`}
                >
                  {offer.status === "accepted"
                    ? "Acceptată"
                    : offer.status === "rejected"
                      ? "Respinsă"
                      : "În așteptare"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
