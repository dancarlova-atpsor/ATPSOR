"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  FileText,
  MessageSquare,
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react";

// Demo data
const DEMO_REQUESTS = [
  {
    id: "r1",
    pickup_city: "București",
    dropoff_city: "Brașov",
    departure_date: "2026-04-15",
    passengers: 40,
    status: "active",
    offers_count: 3,
    created_at: "2026-04-01",
  },
  {
    id: "r2",
    pickup_city: "Cluj-Napoca",
    dropoff_city: "Sibiu",
    departure_date: "2026-05-01",
    passengers: 15,
    status: "pending",
    offers_count: 0,
    created_at: "2026-04-02",
  },
  {
    id: "r3",
    pickup_city: "Timișoara",
    dropoff_city: "Arad",
    departure_date: "2026-03-20",
    passengers: 25,
    status: "fulfilled",
    offers_count: 5,
    created_at: "2026-03-15",
  },
];

const DEMO_BOOKINGS = [
  {
    id: "b1",
    company_name: "TransExpress SRL",
    route: "București → Brașov",
    date: "2026-04-15",
    total_price: 2500,
    status: "confirmed",
  },
];

const statusConfig = {
  pending: {
    icon: Clock,
    label: "În așteptare",
    color: "text-yellow-600 bg-yellow-50",
  },
  active: {
    icon: MessageSquare,
    label: "Oferte primite",
    color: "text-blue-600 bg-blue-50",
  },
  fulfilled: {
    icon: CheckCircle,
    label: "Finalizată",
    color: "text-green-600 bg-green-50",
  },
  cancelled: {
    icon: XCircle,
    label: "Anulată",
    color: "text-red-600 bg-red-50",
  },
  expired: {
    icon: XCircle,
    label: "Expirată",
    color: "text-gray-600 bg-gray-50",
  },
};

export default function ClientDashboard() {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard.client.title")}
        </h1>
        <Link
          href="/request"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          {t("dashboard.client.newRequest")}
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{DEMO_REQUESTS.length}</div>
              <div className="text-sm text-gray-500">
                {t("dashboard.client.myRequests")}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {DEMO_REQUESTS.reduce((sum, r) => sum + r.offers_count, 0)}
              </div>
              <div className="text-sm text-gray-500">Oferte primite</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <CalendarCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{DEMO_BOOKINGS.length}</div>
              <div className="text-sm text-gray-500">
                {t("dashboard.client.myBookings")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Requests */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t("dashboard.client.myRequests")}
        </h2>
        <div className="space-y-3">
          {DEMO_REQUESTS.map((request) => {
            const statusInfo =
              statusConfig[request.status as keyof typeof statusConfig];
            const StatusIcon = statusInfo.icon;

            return (
              <Link
                key={request.id}
                href={`/request/${request.id}/offers` as any}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                    <MapPin className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {request.pickup_city} → {request.dropoff_city}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>{request.departure_date}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {request.passengers} pers.
                      </span>
                      {request.offers_count > 0 && (
                        <span className="font-medium text-primary-500">
                          {request.offers_count} oferte
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusInfo.label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* My Bookings */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t("dashboard.client.myBookings")}
        </h2>
        <div className="space-y-3">
          {DEMO_BOOKINGS.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {booking.route}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {booking.company_name} &middot; {booking.date}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {booking.total_price} RON
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Confirmată
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
