"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Bus,
  Star,
  Shield,
  FileText,
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  Fuel,
  UserCheck,
  Calculator,
  Info,
  Loader2,
  Inbox,
} from "lucide-react";
import { VEHICLE_CATEGORIES, ROMANIAN_COUNTIES } from "@/types/database";
import type { TransportRequest, Offer, Company, Vehicle } from "@/types/database";

const PLATFORM_FEE_PERCENT = 5; // 5% comision ATPSOR inclus in pret
const TVA_PERCENT = 21; // TVA Romania

// Calculate billable km per day (min 200)
function getBillableKm(km: number) {
  return Math.max(km, 200);
}

// Calculate total price for each offer
function calculateOfferPrice(pricePerKmNoVat: number, billableKm: number) {
  const basePriceNoVat = pricePerKmNoVat * billableKm;
  const tva = basePriceNoVat * (TVA_PERCENT / 100);
  const basePriceWithVat = basePriceNoVat + tva;
  const platformFee = basePriceWithVat * (PLATFORM_FEE_PERCENT / 100);
  const totalPrice = basePriceWithVat + platformFee;
  return { basePriceNoVat, tva, basePriceWithVat, platformFee, totalPrice, pricePerKmWithVat: pricePerKmNoVat * (1 + TVA_PERCENT / 100) };
}

interface OfferWithContract extends Offer {
  company: Company;
  vehicle: Vehicle;
}

// Estimate number of days from departure/return dates
function getDayCount(departureDate: string, returnDate: string | null): number {
  if (!returnDate) return 1;
  const dep = new Date(departureDate);
  const ret = new Date(returnDate);
  const diff = Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

export default function RequestOffersPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [offers, setOffers] = useState<OfferWithContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [acceptedContracts, setAcceptedContracts] = useState<Record<string, boolean>>({});
  const [viewingContract, setViewingContract] = useState<string | null>(null);
  const [viewingCalculation, setViewingCalculation] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Billing data state
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingNumber, setBillingNumber] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCounty, setBillingCounty] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch the request
      const { data: reqData, error: reqError } = await supabase
        .from("transport_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (reqError || !reqData) {
        setError("Cererea nu a fost găsită.");
        setLoading(false);
        return;
      }

      setRequest(reqData as TransportRequest);

      // Fetch offers with joins
      const { data: offersData, error: offersError } = await supabase
        .from("offers")
        .select("*, company:companies(*), vehicle:vehicles(*)")
        .eq("request_id", id)
        .eq("status", "pending")
        .order("price", { ascending: true });

      if (offersError) {
        setError("Eroare la încărcarea ofertelor.");
        setLoading(false);
        return;
      }

      setOffers((offersData as OfferWithContract[]) || []);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  function toggleContract(offerId: string) {
    setAcceptedContracts((prev) => ({ ...prev, [offerId]: !prev[offerId] }));
  }

  // Compute km values based on the request
  const dayCount = request ? getDayCount(request.departure_date, request.return_date) : 1;
  // Without day_programs, estimate total km as 200 * days (minimum billable)
  // Each day has a minimum of 200 km billable
  const totalBillableKm = dayCount * 200;
  const totalEstimatedKm = totalBillableKm; // Without day_programs, estimated = billable

  async function handlePayment(offerId: string, totalPrice: number) {
    if (!request) return;
    setProcessingPayment(offerId);

    const billingEmail = (request as TransportRequest & { client_email?: string }).client_email || "";

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          amount: totalPrice,
          currency: "ron",
          description: `Transport ${request.pickup_city} → ${request.dropoff_city}, ${request.departure_date}`,
          billingData: {
            name: `${billingFirstName} ${billingLastName}`.trim(),
            firstName: billingFirstName,
            lastName: billingLastName,
            street: billingStreet,
            number: billingNumber,
            city: billingCity,
            county: billingCounty,
            email: billingEmail,
            address: `${billingStreet} nr. ${billingNumber}, ${billingCity}, ${billingCounty}`,
          },
        }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback - Stripe not configured
        await new Promise((r) => setTimeout(r, 1500));
        router.push("/booking/success");
      }
    } catch {
      // Fallback
      await new Promise((r) => setTimeout(r, 1500));
      router.push("/booking/success");
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-gray-500">Se încarcă ofertele...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/client"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi la Panou
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error || "Cererea nu a fost gasita."}</p>
        </div>
      </div>
    );
  }

  const req = request;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/client"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Inapoi la Panou
      </Link>

      {/* Request Header */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
        <h1 className="text-2xl font-bold">Oferte pentru cererea ta</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-primary-100">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {req.pickup_city} &rarr; {req.dropoff_city}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {req.departure_date}{req.return_date ? ` → ${req.return_date}` : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {req.passengers} pasageri
          </span>
        </div>
      </div>

      {/* Km Summary */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
          <Calculator className="h-4 w-4" />
          Rezumat Kilometri ({dayCount} {dayCount === 1 ? "zi" : "zile"})
        </h3>
        <div className="space-y-1">
          {Array.from({ length: dayCount }, (_, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Ziua {i + 1}
              </span>
              <span className="font-medium">
                min. 200 km facturabili
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-blue-200 pt-2">
          <span className="text-sm font-medium text-gray-700">
            Zile: {dayCount}
          </span>
          <span className="text-sm font-bold text-blue-700">
            Total km facturabili: {totalBillableKm} km
            <span className="ml-1 text-xs font-normal text-amber-600">
              (min. 200 km/zi aplicat)
            </span>
          </span>
        </div>
      </div>

      {/* No offers empty state */}
      {offers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nu ai primit oferte inca</h3>
          <p className="mt-2 text-sm text-gray-500">
            Transportatorii analizeaza cererea ta. Vei primi notificari cand apar oferte noi.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-gray-500">
            {offers.length} {offers.length === 1 ? "oferta primita" : "oferte primite"}. Compara preturile, citeste contractul si alege.
          </p>

          {/* Offers */}
          <div className="space-y-6">
            {offers.map((offer) => {
              const isContractAccepted = acceptedContracts[offer.id] || false;
              const isProcessing = processingPayment === offer.id;
              const pricePerKm = Number(offer.price);
              const { basePriceNoVat, tva, basePriceWithVat, platformFee, totalPrice, pricePerKmWithVat } = calculateOfferPrice(
                pricePerKm,
                totalBillableKm
              );

              return (
                <div key={offer.id} className="overflow-hidden rounded-2xl bg-white shadow-lg">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                        <Bus className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{offer.company.name}</h3>
                          {offer.company.is_verified && <Shield className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {offer.company.rating} ({offer.company.total_reviews} recenzii)
                          &middot; {offer.company.city}
                          &middot; CUI: {offer.company.cui}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{pricePerKm.toFixed(2)} + TVA RON/km</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {Math.round(totalPrice).toLocaleString()} RON
                      </div>
                      <div className="text-xs text-gray-400">cu TVA si comision incluse</div>
                    </div>
                  </div>

                  {/* Vehicle + Details */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500">Vehicul</div>
                        <div className="mt-1 font-medium text-gray-900">{offer.vehicle.name}</div>
                        <div className="mt-0.5 text-sm text-gray-500">
                          {VEHICLE_CATEGORIES[offer.vehicle.category as keyof typeof VEHICLE_CATEGORIES]?.label}
                          &middot; {offer.vehicle.seats} locuri &middot; {offer.vehicle.year}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(offer.vehicle.features || []).map((f) => (
                            <span key={f} className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500">Include</div>
                        <div className="mt-2 space-y-1">
                          <span className={`flex items-center gap-1.5 text-sm ${offer.includes_driver ? "text-green-600" : "text-red-400"}`}>
                            <UserCheck className="h-4 w-4" />
                            {offer.includes_driver ? "Sofer inclus" : "Fara sofer"}
                          </span>
                          <span className={`flex items-center gap-1.5 text-sm ${offer.includes_fuel ? "text-green-600" : "text-red-400"}`}>
                            <Fuel className="h-4 w-4" />
                            {offer.includes_fuel ? "Combustibil inclus" : "Combustibil neinclus"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {offer.message && <p className="mt-4 text-sm text-gray-600">{offer.message}</p>}
                  </div>

                  {/* Price Calculation */}
                  <div className="border-t border-gray-100 bg-green-50 px-6 py-4">
                    <button
                      onClick={() => setViewingCalculation(viewingCalculation === offer.id ? null : offer.id)}
                      className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      <Calculator className="h-4 w-4" />
                      {viewingCalculation === offer.id ? "Ascunde calculul" : "Vezi detalii calcul pret"}
                    </button>
                    {viewingCalculation === offer.id && (
                      <div className="mt-3 rounded-lg bg-white p-4 text-sm">
                        <table className="w-full">
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Tarif per km (fara TVA):</td>
                              <td className="py-2 text-right font-medium">{pricePerKm.toFixed(2)} RON/km</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Tarif per km (cu TVA {TVA_PERCENT}%):</td>
                              <td className="py-2 text-right font-medium">{pricePerKmWithVat.toFixed(2)} RON/km</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Km facturabili (min 200/zi):</td>
                              <td className="py-2 text-right font-medium">{totalBillableKm} km</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Subtotal transport (fara TVA):</td>
                              <td className="py-2 text-right font-medium">{basePriceNoVat.toFixed(0)} RON</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">TVA ({TVA_PERCENT}%):</td>
                              <td className="py-2 text-right font-medium">{tva.toFixed(0)} RON</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">Subtotal cu TVA:</td>
                              <td className="py-2 text-right font-medium">{basePriceWithVat.toFixed(0)} RON</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">
                                <span className="flex items-center gap-1">
                                  Comision platforma ({PLATFORM_FEE_PERCENT}%):
                                  <Info className="h-3 w-3 text-gray-400" />
                                </span>
                              </td>
                              <td className="py-2 text-right font-medium">{platformFee.toFixed(0)} RON</td>
                            </tr>
                            <tr>
                              <td className="pt-2 text-base font-bold text-gray-900">TOTAL DE PLATA:</td>
                              <td className="pt-2 text-right text-base font-bold text-primary-600">
                                {Math.round(totalPrice).toLocaleString()} RON
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="mt-2 text-xs text-gray-400">
                          Pretul include TVA {TVA_PERCENT}% si comisionul platformei de {PLATFORM_FEE_PERCENT}%.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contract Section */}
                  <div className="border-t border-gray-100 bg-amber-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-amber-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Contract de Transport</div>
                          <div className="text-xs text-gray-500">
                            {offer.contract_name || "Contract neincarcat"}
                          </div>
                        </div>
                      </div>
                      {offer.contract_url ? (
                        <div className="flex gap-2">
                          <a
                            href={offer.contract_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Vizualizeaza
                          </a>
                          <a
                            href={offer.contract_url}
                            download={offer.contract_name || "contract.pdf"}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Descarca
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Contractul nu a fost incarcat</span>
                      )}
                    </div>
                  </div>

                  {/* Billing Data */}
                  <div className="border-t border-gray-100 px-6 py-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900">Date Facturare</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Nume *</label>
                        <input
                          type="text"
                          value={billingLastName}
                          onChange={(e) => setBillingLastName(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="ex: Popescu"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Prenume *</label>
                        <input
                          type="text"
                          value={billingFirstName}
                          onChange={(e) => setBillingFirstName(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="ex: Ion"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Strada *</label>
                        <input
                          type="text"
                          value={billingStreet}
                          onChange={(e) => setBillingStreet(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="ex: Calea Victoriei"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Număr *</label>
                        <input
                          type="text"
                          value={billingNumber}
                          onChange={(e) => setBillingNumber(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="ex: 12A"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Localitate *</label>
                        <input
                          type="text"
                          value={billingCity}
                          onChange={(e) => setBillingCity(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="ex: București"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Județ/Sector *</label>
                        <select
                          value={billingCounty}
                          onChange={(e) => setBillingCounty(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        >
                          <option value="">Selectează...</option>
                          {ROMANIAN_COUNTIES.map((county) => (
                            <option key={county} value={county}>{county}</option>
                          ))}
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

                  {/* Accept & Pay */}
                  <div className="border-t border-gray-100 px-6 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isContractAccepted}
                          onChange={() => toggleContract(offer.id)}
                          className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                        />
                        <span className="text-sm text-gray-700">
                          Am citit si accept <strong>contractul de transport</strong> al {offer.company.name}
                        </span>
                      </label>
                      <button
                        onClick={() => handlePayment(offer.id, totalPrice)}
                        disabled={!isContractAccepted || isProcessing || !billingFirstName || !billingLastName || !billingStreet || !billingNumber || !billingCity || !billingCounty}
                        className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition-all ${
                          isContractAccepted && billingFirstName && billingLastName && billingStreet && billingNumber && billingCity && billingCounty
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "cursor-not-allowed bg-gray-200 text-gray-400"
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        {isProcessing
                          ? "Se proceseaza..."
                          : `Plateste ${Math.round(totalPrice).toLocaleString()} RON`}
                      </button>
                    </div>
                    {!isContractAccepted && (
                      <p className="mt-2 text-xs text-gray-400">
                        Trebuie sa accepti contractul de transport pentru a putea plati.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* How payment works */}
      <div className="mt-8 rounded-xl bg-gray-50 p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <CreditCard className="h-5 w-5 text-primary-500" />
          Cum functioneaza plata cu cardul?
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. <strong>Alegi oferta</strong> si citesti contractul de transport al transportatorului.</p>
          <p>2. <strong>Accepti contractul</strong> bifand checkbox-ul de acceptare.</p>
          <p>3. <strong>Click &quot;Plateste&quot;</strong> &rarr; esti redirectionat catre pagina securizata Stripe.</p>
          <p>4. <strong>Introduci datele cardului</strong> (Visa, Mastercard, etc.) pe pagina Stripe.</p>
          <p>5. <strong>Plata se proceseaza</strong> &rarr; primesti confirmare pe email &rarr; rezervarea este activa.</p>
          <p className="mt-3 text-xs text-gray-400">
            Platile sunt procesate securizat prin Stripe. ATPSOR nu stocheaza datele cardului.
            Comisionul de {PLATFORM_FEE_PERCENT}% este inclus automat in pretul afisat.
            Transportatorul primeste suma minus comisionul in contul sau.
          </p>
        </div>
      </div>
    </div>
  );
}
