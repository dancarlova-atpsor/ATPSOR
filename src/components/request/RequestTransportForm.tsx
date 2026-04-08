"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import {
  MapPin,
  Calendar,
  Users,
  Bus,
  Star,
  Shield,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Calculator,
  Loader2,
  Phone,
  Mail,
  User,
  Search,
} from "lucide-react";
import { VEHICLE_CATEGORIES, ROMANIAN_COUNTIES } from "@/types/database";
import type { VehicleCategory } from "@/types/database";
import { calculatePrice, calculatePriceCustom, calculatePriceFromKm, TARIFFS, PLATFORM_FEE_RATE, TVA_RATE } from "@/lib/distances";
import { createClient } from "@/lib/supabase/client";

interface TransporterOption {
  vehicleId: string;
  vehicleName: string;
  vehicleCategory: VehicleCategory;
  vehicleSeats: number;
  vehicleYear: number;
  vehicleFeatures: string[];
  companyId: string;
  companyName: string;
  companyCity: string;
  companyRating: number;
  companyReviews: number;
  companyVerified: boolean;
  companyCui: string;
  companyEmail: string;
  companyStripeAccountId: string | null;
  companySmartbillSeries: string | null;
  estimatedPrice: number;
  subtotalWithVat: number;
  platformFee: number;
  pricePerKm: number;
  totalKmBillable: number;
}

function getDayCount(dep: string, ret: string | null): number {
  if (!ret) return 1;
  const d1 = new Date(dep);
  const d2 = new Date(ret);
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

export function RequestTransportForm() {
  const t = useTranslations();
  const router = useRouter();

  // Step 1 - search
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [passengers, setPassengers] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [intermediariesDus, setIntermediariesDus] = useState("");
  const [intermediariesIntors, setIntermediariesIntors] = useState("");

  // Step 2 - transporters
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [transporters, setTransporters] = useState<TransporterOption[]>([]);
  const [loadingTransporters, setLoadingTransporters] = useState(false);
  const [selected, setSelected] = useState<TransporterOption | null>(null);

  // Step 3 - billing + contact
  const [billingType, setBillingType] = useState<"pf" | "pj">("pf");
  const [billingCompanyName, setBillingCompanyName] = useState("");
  const [billingCui, setBillingCui] = useState("");
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingNumber, setBillingNumber] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCounty, setBillingCounty] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paying, setPaying] = useState(false);

  // Auto-fill contact from profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("full_name, phone, email")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setClientName(data.full_name || "");
              setClientEmail(data.email || user.email || "");
              setClientPhone(data.phone || "");
              const parts = (data.full_name || "").split(" ");
              setBillingLastName(parts[0] || "");
              setBillingFirstName(parts.slice(1).join(" ") || "");
            }
          });
      }
    });
  }, []);

  const dayCount = useMemo(
    () => getDayCount(departureDate, isRoundTrip ? returnDate : null),
    [departureDate, returnDate, isRoundTrip]
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoadingTransporters(true);
    setStep(2);

    try {
      const supabase = createClient();
      const minSeats = parseInt(passengers) || 1;
      const endDate = isRoundTrip && returnDate ? returnDate : departureDate;

      // Get blocked vehicle IDs for the selected date range (overlap check)
      const { data: blocks } = await supabase
        .from("vehicle_blocks")
        .select("vehicle_id")
        .lte("start_date", endDate)
        .gte("end_date", departureDate);

      const blockedIds = new Set((blocks || []).map((b: { vehicle_id: string }) => b.vehicle_id));

      // Build waypoints for Google Maps API
      const waypointsDus: string[] = [pickupCity];
      if (intermediariesDus) {
        waypointsDus.push(...intermediariesDus.split(",").map((c: string) => c.trim()).filter(Boolean));
      }
      waypointsDus.push(dropoffCity);

      let waypointsIntors: string[] = [];
      if (isRoundTrip) {
        waypointsIntors = [dropoffCity];
        if (intermediariesIntors) {
          waypointsIntors.push(...intermediariesIntors.split(",").map((c: string) => c.trim()).filter(Boolean));
        }
        waypointsIntors.push(pickupCity);
      }

      // Fetch distance from Google Maps API, vehicles, and pricing in parallel
      const [distanceDusRes, distanceIntorsRes, vehiclesRes, pricingRes] = await Promise.all([
        fetch("/api/distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waypoints: waypointsDus }),
        }).then((r) => r.json()).catch(() => ({ fallback: true })),
        isRoundTrip
          ? fetch("/api/distance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ waypoints: waypointsIntors }),
            }).then((r) => r.json()).catch(() => ({ fallback: true }))
          : Promise.resolve(null),
        supabase
          .from("vehicles")
          .select("*, company:companies(*)")
          .eq("is_active", true)
          .gte("seats", minSeats)
          .order("seats", { ascending: true }),
        supabase
          .from("company_pricing")
          .select("*"),
      ]);

      // Total km from Google Maps (or fallback)
      const useGoogleMaps = !distanceDusRes.fallback && distanceDusRes.totalKm > 0;
      const kmDus = useGoogleMaps ? distanceDusRes.totalKm : 0;
      const kmIntors = isRoundTrip && distanceIntorsRes && !distanceIntorsRes.fallback
        ? distanceIntorsRes.totalKm : 0;
      const googleTotalKm = kmDus + kmIntors;

      const vehicles = vehiclesRes.data || [];
      const allPricing = pricingRes.data || [];

      // Build lookup: company_id + category → pricing
      const pricingMap = new Map<string, { price_per_km: number; min_km_per_day: number }>();
      for (const p of allPricing) {
        pricingMap.set(`${p.company_id}_${p.vehicle_category}`, p);
      }

      const options: TransporterOption[] = [];

      for (const v of vehicles.filter((v: { id: string }) => !blockedIds.has(v.id))) {
        const company = v.company as {
          id: string; name: string; city: string;
          rating: number; total_reviews: number; is_verified: boolean;
          cui: string; email: string; stripe_account_id: string | null;
          smartbill_series: string | null;
        } | null;
        if (!company) continue;

        const customPricing = pricingMap.get(`${company.id}_${v.category}`);
        const tariff = customPricing?.price_per_km || TARIFFS[v.category] || 7.50;
        const minKm = customPricing?.min_km_per_day || 200;

        // Use Google Maps km if available, otherwise fallback to hardcoded
        let priceCalc;
        if (useGoogleMaps) {
          // Google Maps returns total km for the full route (with intermediaries)
          // For round trip, kmDus + kmIntors already calculated above
          priceCalc = calculatePriceFromKm(googleTotalKm, false, dayCount, tariff, minKm);
        } else {
          priceCalc = customPricing
            ? calculatePriceCustom(pickupCity, dropoffCity, isRoundTrip, dayCount, tariff, minKm)
            : calculatePrice(pickupCity, dropoffCity, isRoundTrip, dayCount, v.category);
        }
        if (!priceCalc) continue;

        options.push({
          vehicleId: v.id,
          vehicleName: v.name,
          vehicleCategory: v.category,
          vehicleSeats: v.seats,
          vehicleYear: v.year,
          vehicleFeatures: v.features || [],
          companyId: company.id,
          companyName: company.name,
          companyCity: company.city,
          companyRating: company.rating,
          companyReviews: company.total_reviews,
          companyVerified: company.is_verified,
          companyCui: company.cui || "",
          companyEmail: company.email || "",
          companyStripeAccountId: company.stripe_account_id || null,
          companySmartbillSeries: company.smartbill_series || null,
          estimatedPrice: priceCalc.totalPrice,
          subtotalWithVat: priceCalc.subtotalWithVat,
          platformFee: priceCalc.platformFee,
          pricePerKm: priceCalc.tariffPerKm,
          totalKmBillable: priceCalc.totalKmBillable,
        });
      }

      // Sort by price
      options.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
      setTransporters(options);
    } catch (err) {
      console.error("Error loading transporters:", err);
    }

    setLoadingTransporters(false);
  }

  function selectTransporter(t: TransporterOption) {
    setSelected(t);
    setStep(3);
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setPaying(true);

    // Save request to DB first
    let requestId: string | null = null;
    try {
      await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCity,
          pickupLocation: pickupCity,
          dropoffCity,
          dropoffLocation: dropoffCity,
          intermediateCities: intermediariesDus || null,
          intermediariesReturn: isRoundTrip ? intermediariesIntors : null,
          departureDate,
          returnDate: isRoundTrip ? returnDate : null,
          isRoundTrip,
          passengers,
          vehicleCategory: selected.vehicleCategory,
          description: null,
          dayPrograms: [],
          totalEstimatedKm: selected.totalKmBillable,
          totalBillableKm: selected.totalKmBillable,
          clientName,
          clientEmail,
          clientPhone,
          selectedVehicleId: selected.vehicleId,
          selectedCompanyId: selected.companyId,
        }),
      }).then(async (r) => {
        const d = await r.json();
        requestId = d.requestId || null;
      });
    } catch {
      // Continue to payment even if save fails
    }

    // Go to Stripe checkout
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: `direct-${selected.vehicleId}-${Date.now()}`,
          subtotalWithVat: selected.subtotalWithVat,
          platformFee: selected.platformFee,
          currency: "ron",
          description: `Transport ${pickupCity} → ${dropoffCity}, ${departureDate}, ${passengers} pers. | ${selected.companyName}`,
          vehicleId: selected.vehicleId,
          companyId: selected.companyId,
          requestId,
          departureDate,
          returnDate: isRoundTrip ? returnDate : null,
          // Stripe Connect
          transporterStripeAccountId: selected.companyStripeAccountId || null,
          // Invoice data
          transporterName: selected.companyName,
          transporterCui: selected.companyCui,
          transporterEmail: selected.companyEmail,
          transporterSeries: selected.companySmartbillSeries || "",
          route: `${pickupCity} → ${dropoffCity}`,
          totalKm: selected.totalKmBillable,
          pricePerKm: selected.pricePerKm,
          billingData: {
            type: billingType,
            name: billingType === "pj"
              ? billingCompanyName
              : `${billingLastName} ${billingFirstName}`.trim(),
            cui: billingType === "pj" ? billingCui : undefined,
            companyName: billingType === "pj" ? billingCompanyName : undefined,
            firstName: billingFirstName,
            lastName: billingLastName,
            street: billingStreet,
            number: billingNumber,
            city: billingCity,
            county: billingCounty,
            email: clientEmail,
            address: `${billingStreet} nr. ${billingNumber}, ${billingCity}, ${billingCounty}`,
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 1500));
    router.push("/booking/success");
  }

  // ─── STEP 1: Search form ────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t("request.title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">{t("request.subtitle")}</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-5 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          {/* Route */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Oraș plecare *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-500" />
                <input
                  type="text"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ex: București"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Oraș sosire *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-accent-500" />
                <input
                  type="text"
                  value={dropoffCity}
                  onChange={(e) => setDropoffCity(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ex: Brașov"
                />
              </div>
            </div>
          </div>

          {/* Passengers + dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Pasageri *</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ex: 45"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data plecării *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data întoarcerii</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => {
                    setReturnDate(e.target.value);
                    setIsRoundTrip(!!e.target.value);
                  }}
                  min={departureDate || new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
          </div>

          {/* Intermediate cities - outbound */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Orașe intermediare — dus
              <span className="ml-1 text-xs font-normal text-gray-400">(opțional)</span>
            </label>
            <input
              type="text"
              value={intermediariesDus}
              onChange={(e) => setIntermediariesDus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="ex: Pitești, Rm. Vâlcea, Sibiu"
            />
          </div>

          {/* Intermediate cities - return (only if round trip) */}
          {isRoundTrip && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Orașe intermediare — întors
                <span className="ml-1 text-xs font-normal text-gray-400">(opțional)</span>
              </label>
              <input
                type="text"
                value={intermediariesIntors}
                onChange={(e) => setIntermediariesIntors(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="ex: Sibiu, Rm. Vâlcea, Pitești"
              />
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-4 text-base font-bold text-white shadow-lg transition hover:bg-primary-700"
          >
            <Search className="h-5 w-5" />
            Caută transportatori
          </button>
        </form>
      </div>
    );
  }

  // ─── STEP 2: Transporters list ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          onClick={() => setStep(1)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Modifică căutarea
        </button>

        <div className="mb-6 rounded-xl bg-primary-50 px-5 py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-primary-800">
            <span className="flex items-center gap-1.5 font-semibold">
              <MapPin className="h-4 w-4" />
              {pickupCity} → {dropoffCity}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {departureDate}{isRoundTrip && returnDate ? ` → ${returnDate}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {passengers} pasageri · {dayCount} {dayCount === 1 ? "zi" : "zile"}
            </span>
          </div>
        </div>

        {loadingTransporters ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-sm text-gray-500">Se caută transportatori disponibili...</p>
          </div>
        ) : transporters.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-10 text-center">
            <Bus className="mx-auto mb-3 h-10 w-10 text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-800">Niciun transportator disponibil</h3>
            <p className="mt-2 text-sm text-gray-500">
              Nu există vehicule înregistrate cu suficiente locuri pentru {passengers} pasageri pe această rută.
              Încearcă o altă dată sau un număr mai mic de pasageri.
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la căutare
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {transporters.length} {transporters.length === 1 ? "opțiune disponibilă" : "opțiuni disponibile"} · sortate după preț
            </p>
            <div className="space-y-4">
              {transporters.map((opt) => {
                const catInfo = VEHICLE_CATEGORIES[opt.vehicleCategory];
                return (
                  <div key={opt.vehicleId} className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg">
                    <div className="flex items-start justify-between gap-4 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                          <Bus className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{opt.companyName}</span>
                            {opt.companyVerified && (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            {opt.companyRating} ({opt.companyReviews} recenzii) · {opt.companyCity}
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">{opt.vehicleName}</span>
                            <span className="ml-2 text-gray-400">
                              {catInfo?.label} · {opt.vehicleSeats} locuri · {opt.vehicleYear}
                            </span>
                          </div>
                          {opt.vehicleFeatures.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {opt.vehicleFeatures.map((f) => (
                                <span key={f} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-gray-400">{opt.totalKmBillable} km facturabili</div>
                        <div className="text-2xl font-bold text-primary-600">
                          {Math.round(opt.estimatedPrice).toLocaleString()} RON
                        </div>
                        <div className="text-xs text-gray-400">cu TVA și comision</div>
                        <button
                          onClick={() => selectTransporter(opt)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Alege
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── STEP 3: Billing + Payment ──────────────────────────────────────────────
  if (step === 3 && selected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <button
          onClick={() => setStep(2)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la transportatori
        </button>

        {/* Summary */}
        <div className="mb-6 rounded-xl bg-primary-50 p-5">
          <h2 className="mb-3 font-bold text-gray-900">Rezumat comandă</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Traseu:</span> <strong>{pickupCity} → {dropoffCity}</strong></div>
            <div><span className="text-gray-500">Data:</span> <strong>{departureDate}{isRoundTrip && returnDate ? ` → ${returnDate}` : ""}</strong></div>
            <div><span className="text-gray-500">Pasageri:</span> <strong>{passengers}</strong></div>
            <div><span className="text-gray-500">Zile:</span> <strong>{dayCount}</strong></div>
            <div className="col-span-2"><span className="text-gray-500">Transportator:</span> <strong>{selected.companyName}</strong> — {selected.vehicleName}</div>
          </div>
          <div className="mt-3 rounded-lg bg-green-100 px-4 py-2 text-center">
            <span className="text-sm text-gray-600">Total de plată: </span>
            <span className="text-xl font-bold text-green-700">{Math.round(selected.estimatedPrice).toLocaleString()} RON</span>
            <span className="ml-1 text-xs text-gray-400">(cu TVA și comision)</span>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-6 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          {/* Contact */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <User className="h-5 w-5 text-primary-500" />
              Date contact
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nume complet *</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Ion Popescu" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder="ion@exemplu.ro" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Telefon *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder="0721 234 567" />
                </div>
              </div>
            </div>
          </div>

          {/* Billing */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Calculator className="h-5 w-5 text-primary-500" />
              Date facturare
            </h3>

            {/* Toggle PF / PJ */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setBillingType("pf")}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                  billingType === "pf"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                Persoană fizică
              </button>
              <button
                type="button"
                onClick={() => setBillingType("pj")}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                  billingType === "pj"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                Persoană juridică
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {billingType === "pj" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nume firmă *</label>
                    <input type="text" value={billingCompanyName} onChange={(e) => setBillingCompanyName(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="SC Exemplu SRL" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">CUI *</label>
                    <input type="text" value={billingCui} onChange={(e) => setBillingCui(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="RO12345678" />
                  </div>
                </>
              )}
              {billingType === "pf" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nume *</label>
                    <input type="text" value={billingLastName} onChange={(e) => setBillingLastName(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="Popescu" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Prenume *</label>
                    <input type="text" value={billingFirstName} onChange={(e) => setBillingFirstName(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="Ion" />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Strada *</label>
                <input type="text" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Calea Victoriei" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Număr *</label>
                <input type="text" value={billingNumber} onChange={(e) => setBillingNumber(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="12A" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Localitate *</label>
                <input type="text" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="București" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Județ/Sector *</label>
                <select value={billingCounty} onChange={(e) => setBillingCounty(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none">
                  <option value="">Selectează...</option>
                  {ROMANIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="Sector 1">Sector 1</option>
                  <option value="Sector 2">Sector 2</option>
                  <option value="Sector 3">Sector 3</option>
                  <option value="Sector 4">Sector 4</option>
                  <option value="Sector 5">Sector 5</option>
                  <option value="Sector 6">Sector 6</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={paying}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-base font-bold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-60"
          >
            <CreditCard className="h-5 w-5" />
            {paying ? "Se procesează..." : `Plătește ${Math.round(selected.estimatedPrice).toLocaleString()} RON`}
          </button>
          <p className="text-center text-xs text-gray-400">
            Plată securizată prin Stripe. Datele cardului nu sunt stocate de ATPSOR.
          </p>
        </form>
      </div>
    );
  }

  return null;
}
