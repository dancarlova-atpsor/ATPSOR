"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import {
  MapPin,
  Calendar,
  Users,
  Bus,
  FileText,
  Send,
  Plus,
  Trash2,
  Route,
  Clock,
  Calculator,
  CreditCard,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { VehicleCategory } from "@/types/database";
import { VEHICLE_CATEGORIES } from "@/types/database";
import { calculatePrice, type PriceCalculation } from "@/lib/distances";

interface DayProgram {
  day: number;
  date: string;
  description: string;
  estimatedKm: number;
}

export function RequestTransportForm() {
  const t = useTranslations();
  const router = useRouter();

  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [intermediateCities, setIntermediateCities] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [passengers, setPassengers] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory | "">("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [acceptContract, setAcceptContract] = useState(false);

  // Day-by-day program
  const [dayPrograms, setDayPrograms] = useState<DayProgram[]>([
    { day: 1, date: "", description: "", estimatedKm: 0 },
  ]);

  function addDay() {
    setDayPrograms((prev) => [
      ...prev,
      { day: prev.length + 1, date: "", description: "", estimatedKm: 0 },
    ]);
  }

  function removeDay(index: number) {
    setDayPrograms((prev) =>
      prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }))
    );
  }

  function updateDay(index: number, field: keyof DayProgram, value: string | number) {
    setDayPrograms((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  // Auto-calculate price based on cities + category
  const priceCalc: PriceCalculation | null = useMemo(() => {
    if (!pickupCity || !dropoffCity || !vehicleCategory) return null;
    const days = dayPrograms.length;
    return calculatePrice(pickupCity, dropoffCity, isRoundTrip, days, vehicleCategory);
  }, [pickupCity, dropoffCity, isRoundTrip, dayPrograms.length, vehicleCategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Send email notification
    try {
      await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCity,
          pickupLocation,
          dropoffCity,
          dropoffLocation,
          intermediateCities,
          departureDate,
          returnDate,
          isRoundTrip,
          passengers,
          vehicleCategory,
          description,
          dayPrograms,
          totalEstimatedKm: priceCalc?.totalKmReal || 0,
          totalBillableKm: priceCalc?.totalKmBillable || 0,
          priceCalculation: priceCalc,
        }),
      });
    } catch {
      // Continue anyway
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  async function handlePayment() {
    setPaying(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: "direct-" + Date.now(),
          amount: priceCalc?.totalPrice || 0,
          currency: "ron",
          description: `Transport ${pickupCity} → ${dropoffCity}, ${departureDate}, ${passengers} pers.`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // Stripe not configured - demo fallback
    }
    // Demo fallback
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/booking/success");
  }

  if (submitted && priceCalc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          {/* Success header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cerere calculată!</h2>
              <p className="text-sm text-gray-500">Verifică detaliile și plătește pentru confirmare.</p>
            </div>
          </div>

          {/* Route summary */}
          <div className="mb-6 rounded-lg bg-primary-50 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Traseu:</span> <strong>{pickupCity} → {dropoffCity}</strong></div>
              <div><span className="text-gray-500">Data:</span> <strong>{departureDate}{returnDate && ` → ${returnDate}`}</strong></div>
              <div><span className="text-gray-500">Pasageri:</span> <strong>{passengers}</strong></div>
              <div><span className="text-gray-500">Vehicul:</span> <strong>{VEHICLE_CATEGORIES[vehicleCategory as VehicleCategory]?.label}</strong></div>
              <div><span className="text-gray-500">Dus-întors:</span> <strong>{isRoundTrip ? "Da" : "Nu"}</strong></div>
              <div><span className="text-gray-500">Zile:</span> <strong>{dayPrograms.length}</strong></div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-green-800">
              <Calculator className="h-5 w-5" />
              Calcul Preț
            </h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-green-200">
                  <td className="py-2 text-gray-600">Distanță {isRoundTrip ? "(dus-întors)" : "(sens unic)"}:</td>
                  <td className="py-2 text-right font-medium">{priceCalc.distanceOneWay} km{isRoundTrip && ` × 2 = ${priceCalc.totalKmReal} km`}</td>
                </tr>
                <tr className="border-b border-green-200">
                  <td className="py-2 text-gray-600">Km facturabili (min 200/zi × {priceCalc.days} zile):</td>
                  <td className="py-2 text-right font-bold">{priceCalc.totalKmBillable} km</td>
                </tr>
                <tr className="border-b border-green-200">
                  <td className="py-2 text-gray-600">Subtotal (fără TVA):</td>
                  <td className="py-2 text-right font-medium">{priceCalc.subtotalNoVat.toFixed(0)} RON</td>
                </tr>
                <tr className="border-b border-green-200">
                  <td className="py-2 text-gray-600">TVA (21%):</td>
                  <td className="py-2 text-right font-medium">{priceCalc.tva.toFixed(0)} RON</td>
                </tr>
                <tr>
                  <td className="pt-3 text-lg font-bold text-gray-900">TOTAL DE PLATĂ:</td>
                  <td className="pt-3 text-right text-2xl font-bold text-green-700">
                    {Math.round(priceCalc.totalPrice).toLocaleString()} RON
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Contract acceptance */}
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptContract}
                onChange={(e) => setAcceptContract(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
              />
              <span className="text-sm text-gray-700">
                Am citit și accept <strong>condițiile de transport</strong>. Înțeleg că prețul include TVA și comisionul platformei.
                Minim 200 km/zi facturabili. Km suplimentari se calculează la final la același tarif.
              </span>
            </label>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={!acceptContract || paying}
            className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 text-lg font-bold shadow-lg transition-all ${
              acceptContract
                ? "bg-green-600 text-white hover:bg-green-700"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            <CreditCard className="h-6 w-6" />
            {paying
              ? "Se procesează plata..."
              : `Plătește ${Math.round(priceCalc.totalPrice).toLocaleString()} RON`}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Plata securizată prin Stripe. Datele cardului nu sunt stocate de ATPSOR.
          </p>
        </div>
      </div>
    );
  }

  // Success without price calc (city not found)
  if (submitted && !priceCalc) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Send className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("request.success")}</h2>
        <p className="mt-3 text-gray-600">
          Cererea a fost trimisă! Vei primi oferte cu preț de la transportatori pe email.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t("request.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{t("request.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        {/* Route */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Route className="h-5 w-5 text-primary-500" />
            Traseu
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.pickupCity")}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input type="text" value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ex: București" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.pickupLocation")}</label>
              <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 px-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="ex: Universitate" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.dropoffCity")}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-accent-500" />
                <input type="text" value={dropoffCity} onChange={(e) => setDropoffCity(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ex: Brașov" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.dropoffLocation")}</label>
              <input type="text" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 px-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="ex: Piața Sfatului" />
            </div>
          </div>

          {/* Intermediate cities */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Orașe intermediare (traseu detaliat) *
            </label>
            <textarea
              value={intermediateCities}
              onChange={(e) => setIntermediateCities(e.target.value)}
              required
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Ex: Pitești, Rm. Vâlcea, Deva (orașele prin care treceți)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Specifică toate orașele prin care treceți pentru calculul corect al kilometrilor.
              Transportatorul va emite contractul pe baza acestui traseu.
            </p>
          </div>

          {/* Live distance indicator */}
          {pickupCity && dropoffCity && (
            <div className="mt-3">
              {priceCalc ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Distanță calculată: <strong>{priceCalc.distanceOneWay} km</strong>
                  {isRoundTrip && <span>(dus-întors: {priceCalc.totalKmReal} km)</span>}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Distanța nu a putut fi calculată automat. Completează programul pe zile cu km estimați.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Calendar className="h-5 w-5 text-primary-500" />
            Perioadă
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.departureDate")}</label>
              <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 px-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.returnDate")}</label>
              <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 px-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
                <input type="checkbox" checked={isRoundTrip} onChange={(e) => setIsRoundTrip(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200" />
                <span className="text-sm font-medium text-gray-700">{t("request.isRoundTrip")}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Passengers & Vehicle */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-primary-500" />
            Pasageri & Vehicul
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.passengers")}</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input type="number" min="1" max="80" value={passengers} onChange={(e) => setPassengers(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ex: 45" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("request.vehicleCategory")} *</label>
              <div className="relative">
                <Bus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <select value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory | "")} required
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200">
                  <option value="">Selectează tipul *</option>
                  {Object.entries(VEHICLE_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label} ({cat.minSeats}-{cat.maxSeats} locuri)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Day Program */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Clock className="h-5 w-5 text-primary-500" />
            Program pe Zile
          </h3>
          <div className="space-y-4">
            {dayPrograms.map((day, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary-600">Ziua {day.day}</span>
                  {dayPrograms.length > 1 && (
                    <button type="button" onClick={() => removeDay(index)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Data</label>
                    <input type="date" value={day.date} onChange={(e) => updateDay(index, "date", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Km estimați (opțional)</label>
                    <input type="number" min="0" value={day.estimatedKm || ""} onChange={(e) => updateDay(index, "estimatedKm", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="auto" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Program / Traseu</label>
                    <input type="text" value={day.description} onChange={(e) => updateDay(index, "description", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      placeholder="ex: București → Brașov" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addDay}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-primary-400 hover:text-primary-500">
              <Plus className="h-4 w-4" />
              Adaugă Ziua {dayPrograms.length + 1}
            </button>
          </div>
        </div>

        {/* Live Price Preview */}
        {priceCalc && vehicleCategory && (
          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-800">
              <Calculator className="h-5 w-5" />
              Preț Estimat
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3 text-center">
                <div className="text-xs text-gray-500">Distanță</div>
                <div className="text-lg font-bold">{priceCalc.totalKmReal} km</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center">
                <div className="text-xs text-gray-500">Km facturabili</div>
                <div className="text-lg font-bold">{priceCalc.totalKmBillable} km</div>
              </div>
              <div className="rounded-lg bg-green-600 p-3 text-center text-white">
                <div className="text-xs text-green-200">TOTAL (cu TVA)</div>
                <div className="text-xl font-bold">{Math.round(priceCalc.totalPrice).toLocaleString()} RON</div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="h-5 w-5 text-primary-500" />
            Detalii Suplimentare
          </h3>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder={t("request.descriptionPlaceholder")} />
        </div>

        {/* Submit */}
        <div className="flex justify-center pt-4">
          <button type="submit" disabled={submitting || !vehicleCategory}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-10 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-accent-600 disabled:opacity-50">
            <Send className="h-5 w-5" />
            {submitting ? "Se trimite..." : priceCalc ? `Continuă spre plată (${Math.round(priceCalc.totalPrice).toLocaleString()} RON)` : t("request.submitRequest")}
          </button>
        </div>
      </form>
    </div>
  );
}
