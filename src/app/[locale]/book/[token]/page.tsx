"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ContractPreview from "@/components/contract/ContractPreview";
import {
  MapPin,
  Calendar,
  Users,
  Bus,
  CreditCard,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useParams } from "next/navigation";

interface BookingLinkData {
  id: string;
  token: string;
  pickup_city: string;
  dropoff_city: string;
  departure_date: string;
  return_date: string | null;
  passengers: number;
  total_price: number;
  description: string | null;
  status: string;
  expires_at: string;
  company_id: string;
  vehicle_id: string;
  vehicles: {
    name: string;
    brand: string;
    model: string;
    seats: number;
    category: string;
  };
  companies: {
    name: string;
    phone: string;
    email: string;
    stripe_account_id: string | null;
    smartbill_series: string | null;
    cui: string;
  };
}

export default function BookPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [bookingLink, setBookingLink] = useState<BookingLinkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [bankTransferDone, setBankTransferDone] = useState(false);
  const [bankReference, setBankReference] = useState("");
  const [contractAccepted, setContractAccepted] = useState(false);

  // Billing form
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCounty, setBillingCounty] = useState("");

  useEffect(() => {
    loadBookingLink();
  }, [token]);

  async function loadBookingLink() {
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("booking_links")
        .select(
          `
          *,
          vehicles (name, brand, model, seats, category),
          companies (name, phone, email, stripe_account_id, smartbill_series, cui)
        `
        )
        .eq("token", token)
        .eq("status", "active")
        .single();

      if (dbError || !data) {
        setError("Link invalid sau expirat");
        return;
      }

      // Check expiration
      if (new Date(data.expires_at) < new Date()) {
        setError("Acest link de rezervare a expirat");
        return;
      }

      setBookingLink(data as BookingLinkData);
    } catch {
      setError("Eroare la încărcarea detaliilor");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingLink) return;

    setPaying(true);
    const route = `${bookingLink.pickup_city} → ${bookingLink.dropoff_city}`;
    const billingData = {
      name: billingName,
      email: billingEmail,
      address: billingAddress,
      city: billingCity,
      county: billingCounty,
    };

    // Transfer bancar
    if (paymentMethod === "bank") {
      try {
        const res = await fetch("/api/booking/bank-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: bookingLink.vehicle_id,
            companyId: bookingLink.company_id,
            departureDate: bookingLink.departure_date,
            returnDate: bookingLink.return_date,
            totalPrice: bookingLink.total_price,
            currency: "ron",
            billingData,
            route,
            transporterName: bookingLink.companies?.name || "",
            transporterEmail: bookingLink.companies?.email || "",
          }),
        });
        const data = await res.json();
        if (data.success) {
          setBankReference(data.reference);
          setBankTransferDone(true);
        } else {
          setError(data.error || "Eroare la crearea rezervării");
        }
      } catch {
        setError("Eroare de conexiune");
      }
      setPaying(false);
      return;
    }

    // Plata cu cardul (Stripe)
    try {
      const platformFee = Math.round(bookingLink.total_price * 0.05 * 100) / 100;
      const subtotalWithVat = bookingLink.total_price - platformFee;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotalWithVat,
          platformFee,
          currency: "ron",
          description: `Transport: ${route} | ${bookingLink.departure_date}`,
          billingData,
          vehicleId: bookingLink.vehicle_id,
          companyId: bookingLink.company_id,
          departureDate: bookingLink.departure_date,
          returnDate: bookingLink.return_date,
          transporterStripeAccountId: bookingLink.companies?.stripe_account_id || null,
          transporterName: bookingLink.companies?.name || "",
          transporterCui: bookingLink.companies?.cui || "",
          transporterEmail: bookingLink.companies?.email || "",
          transporterSeries: bookingLink.companies?.smartbill_series || "",
          route,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Eroare la inițializarea plății");
        setPaying(false);
      }
    } catch {
      setError("Eroare de conexiune");
      setPaying(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !bookingLink) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {error || "Link invalid"}
          </h1>
          <p className="mt-3 text-gray-600">
            Acest link de rezervare nu este valid sau a expirat.
            Contactează transportatorul pentru un link nou.
          </p>
        </div>
      </div>
    );
  }

  // Bank transfer success page
  if (bankTransferDone) {
    return (
      <div className="min-h-[70vh] bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rezervare Înregistrată!</h1>
          <p className="mt-3 text-gray-600">
            Am trimis detaliile pentru transfer bancar pe emailul tău.
          </p>

          <div className="mt-6 rounded-xl bg-white p-6 shadow-md text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalii Transfer Bancar</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Beneficiar:</span>
                <span className="font-medium">ATPSOR</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">IBAN:</span>
                <span className="font-mono font-medium">RO58 CECE B000 30RO N397 9534</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Banca:</span>
                <span className="font-medium">CEC Bank</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Suma:</span>
                <span className="font-bold text-red-600">{bookingLink.total_price.toLocaleString("ro-RO")} RON</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Referință plată:</span>
                <span className="font-mono font-bold text-primary-600">{bankReference}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-left">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Menționează referința <strong>{bankReference}</strong> în
              descrierea plății. Confirmarea o primiți în cel mai scurt timp, după procesarea plății dumneavoastră.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Rezervare Transport
          </h1>
          <p className="mt-1 text-gray-600">
            Completează datele și plătește online
          </p>
        </div>

        {/* Transport Details Card */}
        <div className="mb-6 rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-primary-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bus className="w-5 h-5" />
              Detalii Transport
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Route */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Traseu</p>
                <p className="font-semibold text-gray-900">
                  {bookingLink.pickup_city} → {bookingLink.dropoff_city}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(bookingLink.departure_date)}
                </p>
                {bookingLink.return_date && (
                  <p className="text-sm text-gray-600">
                    Întoarcere: {formatDate(bookingLink.return_date)}
                  </p>
                )}
              </div>
            </div>

            {/* Passengers */}
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Pasageri</p>
                <p className="font-semibold text-gray-900">
                  {bookingLink.passengers}{" "}
                  {bookingLink.passengers === 1 ? "persoană" : "persoane"}
                </p>
              </div>
            </div>

            {/* Vehicle */}
            <div className="flex items-start gap-3">
              <Bus className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Vehicul</p>
                <p className="font-semibold text-gray-900">
                  {bookingLink.vehicles?.name} — {bookingLink.vehicles?.brand}{" "}
                  {bookingLink.vehicles?.model}
                </p>
                <p className="text-sm text-gray-500">
                  {bookingLink.vehicles?.seats} locuri
                </p>
              </div>
            </div>

            {/* Company */}
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Transportator</p>
                <p className="font-semibold text-gray-900">
                  {bookingLink.companies?.name}
                </p>
              </div>
            </div>

            {/* Description */}
            {bookingLink.description && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{bookingLink.description}</p>
              </div>
            )}

            {/* Price */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-700">
                  Total de plată
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  {bookingLink.total_price.toLocaleString("ro-RO")} RON
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Form */}
        <form onSubmit={handlePay}>
          <div className="mb-6 rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gray-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Date Facturare
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume complet *
                </label>
                <input
                  type="text"
                  required
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="Ion Popescu"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="email@exemplu.ro"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    placeholder="07xx xxx xxx"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresă *
                </label>
                <input
                  type="text"
                  required
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Str. Exemplu nr. 10"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oraș *
                  </label>
                  <input
                    type="text"
                    required
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    placeholder="București"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Județ
                  </label>
                  <input
                    type="text"
                    value={billingCounty}
                    onChange={(e) => setBillingCounty(e.target.value)}
                    placeholder="București"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contract Preview + Acceptance */}
          <div className="mb-6">
            <ContractPreview
              transporterName={bookingLink.companies?.name || ""}
              transporterCui={bookingLink.companies?.cui}
              clientName={billingName}
              clientEmail={billingEmail}
              clientAddress={billingAddress}
              route={`${bookingLink.pickup_city} → ${bookingLink.dropoff_city}`}
              pickupCity={bookingLink.pickup_city}
              dropoffCity={bookingLink.dropoff_city}
              departureDate={bookingLink.departure_date}
              returnDate={bookingLink.return_date}
              vehicleName={bookingLink.vehicles?.name}
              vehicleSeats={bookingLink.vehicles?.seats}
              vehicleCategory={(bookingLink.vehicles as any)?.category}
              totalPrice={bookingLink.total_price}
              currency={((bookingLink as any).currency || "RON").toUpperCase() === "EUR" ? "EUR" : "RON"}
              isInternational={(bookingLink as any).is_international === true}
              isVatPayer={(bookingLink.companies as any)?.is_vat_payer !== false}
              accepted={contractAccepted}
              onToggle={() => setContractAccepted((v) => !v)}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6 rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gray-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Metodă de Plată</h2>
            </div>
            <div className="p-6 space-y-3">
              <label className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${paymentMethod === "card" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="h-4 w-4 text-green-600"
                />
                <CreditCard className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Card bancar (Visa, Mastercard)</p>
                  <p className="text-xs text-gray-500">Plată instantă, procesată securizat prin Stripe</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${paymentMethod === "bank" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                  className="h-4 w-4 text-blue-600"
                />
                <Building2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Transfer bancar</p>
                  <p className="text-xs text-gray-500">Plată prin OP/transfer, confirmare în 1-2 zile lucrătoare</p>
                </div>
              </label>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="submit"
            disabled={paying || !contractAccepted}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold text-white shadow-md disabled:opacity-50 transition-colors ${
              paymentMethod === "card"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {paying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Se procesează...
              </>
            ) : paymentMethod === "card" ? (
              <>
                <CreditCard className="w-5 h-5" />
                Plătește cu cardul {bookingLink.total_price.toLocaleString("ro-RO")} RON
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5" />
                Rezervă cu transfer bancar
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            {paymentMethod === "card"
              ? "Plata se procesează securizat prin Stripe. Nu stocăm datele cardului."
              : "Vei primi detaliile contului bancar pe email. Rezervarea se confirmă la primirea plății."}
          </p>
        </form>
      </div>
    </div>
  );
}
