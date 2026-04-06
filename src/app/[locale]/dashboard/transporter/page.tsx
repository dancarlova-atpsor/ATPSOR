"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState } from "react";
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
} from "lucide-react";

// Demo data
const DEMO_VEHICLES = [
  {
    id: "v1",
    name: "Mercedes Sprinter 2023",
    category: "microbuz",
    seats: 19,
    is_active: true,
    docs_valid: true,
  },
  {
    id: "v2",
    name: "MAN Lion's Coach 2022",
    category: "autocar",
    seats: 48,
    is_active: true,
    docs_valid: false,
  },
  {
    id: "v3",
    name: "Iveco Daily 2024",
    category: "microbuz",
    seats: 16,
    is_active: true,
    docs_valid: true,
  },
  {
    id: "v4",
    name: "VW Transporter T6.1",
    category: "ridesharing",
    seats: 8,
    is_active: true,
    docs_valid: true,
  },
];

const AVAILABLE_REQUESTS = [
  {
    id: "r1",
    pickup_city: "București",
    dropoff_city: "Brașov",
    departure_date: "2026-04-15",
    passengers: 40,
    vehicle_category: "autocar",
    description: "Excursie 3 zile, Brașov - Sibiu - București",
  },
  {
    id: "r2",
    pickup_city: "Cluj-Napoca",
    dropoff_city: "Oradea",
    departure_date: "2026-04-20",
    passengers: 12,
    vehicle_category: "microbuz",
    description: "Transfer echipă corporate, dus-întors",
  },
  {
    id: "r3",
    pickup_city: "Timișoara",
    dropoff_city: "Arad",
    departure_date: "2026-04-25",
    passengers: 25,
    vehicle_category: "midiautocar",
    description: "Excursie de o zi",
  },
];

const COMPANY_DOCS = [
  {
    type: "company_license",
    label: "Licență Transport",
    expiry: "2027-01-15",
    is_valid: true,
    is_verified: true,
  },
];

const VEHICLE_DOC_TYPES = [
  { type: "vehicle_registration_itp", label: "Talon cu ITP valabil" },
  { type: "certified_copy", label: "Copie Conformă" },
  { type: "passenger_luggage_insurance", label: "Asigurare Bagaje și Călători" },
  { type: "rca_insurance", label: "Asigurare RCA" },
];

export default function TransporterDashboard() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<
    "requests" | "offers" | "vehicles" | "documents"
  >("requests");

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
              <div className="text-2xl font-bold">{DEMO_VEHICLES.length}</div>
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
                {AVAILABLE_REQUESTS.length}
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
              <div className="text-2xl font-bold">8</div>
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
              <div className="text-2xl font-bold">12,450</div>
              <div className="text-xs text-gray-500">RON luna asta</div>
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
          {AVAILABLE_REQUESTS.map((request) => (
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
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                      {request.vehicle_category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    {request.description}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/transporter/offer/${request.id}` as any}
                className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
              >
                Trimite Ofertă
              </Link>
            </div>
          ))}
        </div>
      )}

      {activeTab === "vehicles" && (
        <div className="space-y-4">
          {DEMO_VEHICLES.map((vehicle) => (
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
                      {vehicle.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {vehicle.docs_valid ? (
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
          ))}
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
              {COMPANY_DOCS.map((doc) => (
                <div
                  key={doc.type}
                  className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <FileCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {doc.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        Expiră: {doc.expiry}
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
                    <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      Reîncarcă
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Documents */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Bus className="h-5 w-5 text-primary-500" />
              Documente Vehicule
            </h3>
            {DEMO_VEHICLES.map((vehicle) => (
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
                      // Skip certified copy and passenger insurance for vehicles with 9 or fewer seats (8+1)
                      !(docType.type === "certified_copy" && vehicle.seats <= 9) &&
                      !(docType.type === "passenger_luggage_insurance" && vehicle.seats <= 9)
                  ).map((docType) => {
                    const isUploaded =
                      vehicle.docs_valid ||
                      docType.type === "vehicle_registration_itp";
                    return (
                      <div
                        key={docType.type}
                        className={`rounded-lg border-2 p-4 ${
                          isUploaded
                            ? "border-green-200 bg-green-50"
                            : "border-dashed border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isUploaded ? (
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
                            {isUploaded ? "Actualizează" : "Încarcă"}
                          </button>
                        </div>
                        {isUploaded && (
                          <div className="mt-2 text-xs text-green-600">
                            Valabil până la: 2027-03-15
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
                    <strong>Talon cu ITP valabil</strong> - pentru fiecare vehicul
                  </li>
                  <li>
                    <strong>Copie conformă</strong> - pentru vehicule cu mai mult
                    de 9 locuri (nu se aplică pentru 8+1)
                  </li>
                  <li>
                    <strong>Asigurare bagaje și călători</strong> - pentru vehicule
                    cu mai mult de 9 locuri (nu se aplică pentru 8+1)
                  </li>
                  <li>
                    <strong>Asigurare RCA</strong> - pentru fiecare vehicul
                  </li>
                </ul>
                <p className="mt-2">
                  Toate documentele trebuie să fie valabile (neexpirate).
                  Vehiculele cu documente expirate nu vor fi disponibile pentru
                  oferte.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            Nu ai trimis încă nicio ofertă. Verifică cererile disponibile!
          </p>
        </div>
      )}
    </div>
  );
}
