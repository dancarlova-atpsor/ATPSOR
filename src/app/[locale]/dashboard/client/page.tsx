"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
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
  Loader2,
  FileSignature,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import InvoiceList from "@/components/invoices/InvoiceList";

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
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [requestsRes, bookingsRes] = await Promise.all([
        supabase
          .from("transport_requests")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select(
            "*, offer:offers(*, request:transport_requests(*)), company:companies(name)"
          )
          .eq("client_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (requestsRes.data) setRequests(requestsRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      setLoading(false);
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const totalOffers = requests.reduce(
    (sum, r) => sum + (r.offers_count || 0),
    0
  );

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
              <div className="text-2xl font-bold">{requests.length}</div>
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
              <div className="text-2xl font-bold">{totalOffers}</div>
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
              <div className="text-2xl font-bold">{bookings.length}</div>
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
        {requests.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">
              Nu ai cereri de transport încă.
            </p>
            <Link
              href="/request"
              className="mt-3 inline-block text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              Creează prima cerere →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const statusInfo =
                statusConfig[request.status as keyof typeof statusConfig] ||
                statusConfig.pending;
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
                      {request.intermediate_cities && (
                        <span className="text-xs text-gray-400">
                          via {request.intermediate_cities}
                        </span>
                      )}
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
        )}
      </div>

      {/* My Bookings */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t("dashboard.client.myBookings")}
        </h2>
        {bookings.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <CalendarCheck className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">Nu ai rezervări încă.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl bg-white p-5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {booking.offer?.request?.pickup_city} →{" "}
                      {booking.offer?.request?.dropoff_city}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {booking.company?.name} &middot;{" "}
                      {booking.offer?.request?.departure_date}
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

                {/* Contract section */}
                {booking.offer?.contract_url && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {booking.offer?.contract_name || "Contract"}
                      </span>
                      {booking.contract_accepted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Acceptat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          <Clock className="h-3 w-3" />
                          În așteptare
                        </span>
                      )}
                    </div>
                    <a
                      href={booking.offer.contract_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Vezi contractul
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Invoices */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Facturile Mele
        </h2>
        <InvoiceList role="client" />
      </div>
    </div>
  );
}
