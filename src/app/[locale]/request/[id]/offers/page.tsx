"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
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
} from "lucide-react";
import { VEHICLE_CATEGORIES } from "@/types/database";

const PLATFORM_FEE_PERCENT = 3; // 3% comision ATPSOR inclus in pret
const TVA_PERCENT = 21; // TVA Romania

// Demo request - matches what the client posted
const DEMO_REQUEST = {
  id: "r1",
  pickup_city: "București",
  dropoff_city: "Brașov",
  departure_date: "2026-04-15",
  return_date: "2026-04-17",
  passengers: 40,
  vehicle_category: "autocar",
  description: "Excursie 3 zile, Brașov - Sibiu - București",
  day_programs: [
    { day: 1, date: "2026-04-15", description: "București → Brașov (vizită cetate)", estimatedKm: 180 },
    { day: 2, date: "2026-04-16", description: "Brașov → Sibiu (centru vechi, ASTRA)", estimatedKm: 150 },
    { day: 3, date: "2026-04-17", description: "Sibiu → București", estimatedKm: 300 },
  ],
};

// Calculate billable km per day (min 200)
function getBillableKm(km: number) {
  return Math.max(km, 200);
}

const totalEstimatedKm = DEMO_REQUEST.day_programs.reduce((s, d) => s + d.estimatedKm, 0);
const totalBillableKm = DEMO_REQUEST.day_programs.reduce((s, d) => s + getBillableKm(d.estimatedKm), 0);

// Demo offers - realistic Romanian transport companies with real km rates
const DEMO_OFFERS = [
  {
    id: "o1",
    company: {
      name: "Trans Europa Express SRL",
      cui: "RO18234567",
      rating: 4.8,
      total_reviews: 124,
      is_verified: true,
      city: "București",
      county: "București",
    },
    vehicle: {
      name: "MAN Lion's Coach 2022",
      category: "autocar",
      seats: 49,
      brand: "MAN",
      year: 2022,
      features: ["AC", "WiFi", "TV", "Toaletă", "Priză USB"],
    },
    price_per_km: 7.50, // autocar tarif fara TVA
    includes_driver: true,
    includes_fuel: true,
    message:
      "Autocar MAN complet echipat. Prețul include șofer cu experiență (15+ ani), motorină, parcări, taxe de drum. Asigurare călători și bagaje inclusă.",
    contract_name: "Contract_TransEuropa_Excursie_BV.pdf",
    valid_until: "2026-04-10",
  },
  {
    id: "o2",
    company: {
      name: "Royal Class Transport SRL",
      cui: "RO29345678",
      rating: 4.9,
      total_reviews: 203,
      is_verified: true,
      city: "Pitești",
      county: "Argeș",
    },
    vehicle: {
      name: "Setra S 516 HD ComfortClass",
      category: "autocar_maxi",
      seats: 55,
      brand: "Setra",
      year: 2023,
      features: ["AC", "WiFi 5G", "TV", "Toaletă", "Minibar", "Priză USB", "Scaune piele"],
    },
    price_per_km: 8.50, // autocar maxi tarif fara TVA
    includes_driver: true,
    includes_fuel: true,
    message:
      "Autocar premium Setra cu dotări de lux: scaune din piele reclinabile, WiFi 5G, minibar, 2 TV-uri 42\". Include șofer, combustibil, asigurări complete. Cel mai confortabil autocar din flotă.",
    contract_name: "Contract_RoyalClass_BucBrasov.pdf",
    valid_until: "2026-04-12",
  },
  {
    id: "o3",
    company: {
      name: "DaciaTransport SRL",
      cui: "RO15456789",
      rating: 4.5,
      total_reviews: 67,
      is_verified: true,
      city: "Ploiești",
      county: "Prahova",
    },
    vehicle: {
      name: "Mercedes-Benz Tourismo 2021",
      category: "autocar",
      seats: 50,
      brand: "Mercedes-Benz",
      year: 2021,
      features: ["AC", "WiFi", "TV", "Priză USB"],
    },
    price_per_km: 7.50, // autocar tarif fara TVA
    includes_driver: true,
    includes_fuel: false,
    message:
      "Cel mai bun raport calitate-preț. Mercedes Tourismo în stare excelentă. Prețul include șofer. Combustibilul NU este inclus (estimare ~350 RON motorină pentru acest traseu).",
    contract_name: "Contract_DaciaTransport.pdf",
    valid_until: "2026-04-08",
  },
];

// Calculate total price for each offer
function calculateOfferPrice(pricePerKmNoVat: number, billableKm: number) {
  const basePriceNoVat = pricePerKmNoVat * billableKm;
  const tva = basePriceNoVat * (TVA_PERCENT / 100);
  const basePriceWithVat = basePriceNoVat + tva;
  const platformFee = basePriceWithVat * (PLATFORM_FEE_PERCENT / 100);
  const totalPrice = basePriceWithVat + platformFee;
  return { basePriceNoVat, tva, basePriceWithVat, platformFee, totalPrice, pricePerKmWithVat: pricePerKmNoVat * (1 + TVA_PERCENT / 100) };
}

export default function RequestOffersPage() {
  const t = useTranslations();
  const router = useRouter();
  const req = DEMO_REQUEST;

  const [acceptedContracts, setAcceptedContracts] = useState<Record<string, boolean>>({});
  const [viewingContract, setViewingContract] = useState<string | null>(null);
  const [viewingCalculation, setViewingCalculation] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  function toggleContract(offerId: string) {
    setAcceptedContracts((prev) => ({ ...prev, [offerId]: !prev[offerId] }));
  }

  async function handlePayment(offerId: string, totalPrice: number) {
    setProcessingPayment(offerId);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          amount: totalPrice,
          currency: "ron",
          description: `Transport ${req.pickup_city} → ${req.dropoff_city}, ${req.departure_date}`,
        }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Demo fallback - Stripe not configured
        await new Promise((r) => setTimeout(r, 1500));
        router.push("/booking/success");
      }
    } catch {
      // Demo fallback
      await new Promise((r) => setTimeout(r, 1500));
      router.push("/booking/success");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/client"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la Panou
      </Link>

      {/* Request Header */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
        <h1 className="text-2xl font-bold">Oferte pentru cererea ta</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-primary-100">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {req.pickup_city} → {req.dropoff_city}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {req.departure_date} → {req.return_date}
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
          Rezumat Kilometri ({req.day_programs.length} zile)
        </h3>
        <div className="space-y-1">
          {req.day_programs.map((day) => (
            <div key={day.day} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Ziua {day.day}: {day.description}
              </span>
              <span className="font-medium">
                {day.estimatedKm} km
                {day.estimatedKm < 200 && (
                  <span className="ml-1 text-xs text-amber-600">
                    → facturat 200 km
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-blue-200 pt-2">
          <span className="text-sm font-medium text-gray-700">
            Total km reali: {totalEstimatedKm} km
          </span>
          <span className="text-sm font-bold text-blue-700">
            Total km facturabili: {totalBillableKm} km
            {totalBillableKm > totalEstimatedKm && (
              <span className="ml-1 text-xs font-normal text-amber-600">
                (min. 200 km/zi aplicat)
              </span>
            )}
          </span>
        </div>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        {DEMO_OFFERS.length} oferte primite. Compară prețurile, citește contractul și alege.
      </p>

      {/* Offers */}
      <div className="space-y-6">
        {DEMO_OFFERS.map((offer) => {
          const isContractAccepted = acceptedContracts[offer.id] || false;
          const isProcessing = processingPayment === offer.id;
          const { basePriceNoVat, tva, basePriceWithVat, platformFee, totalPrice, pricePerKmWithVat } = calculateOfferPrice(
            offer.price_per_km,
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
                  <div className="text-sm text-gray-500">{offer.price_per_km} + TVA RON/km</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {Math.round(totalPrice).toLocaleString()} RON
                  </div>
                  <div className="text-xs text-gray-400">cu TVA și comision incluse</div>
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
                      {offer.vehicle.features.map((f) => (
                        <span key={f} className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs font-medium text-gray-500">Include</div>
                    <div className="mt-2 space-y-1">
                      <span className={`flex items-center gap-1.5 text-sm ${offer.includes_driver ? "text-green-600" : "text-red-400"}`}>
                        <UserCheck className="h-4 w-4" />
                        {offer.includes_driver ? "Șofer inclus" : "Fără șofer"}
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
                  {viewingCalculation === offer.id ? "Ascunde calculul" : "Vezi detalii calcul preț"}
                </button>
                {viewingCalculation === offer.id && (
                  <div className="mt-3 rounded-lg bg-white p-4 text-sm">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Tarif per km (fără TVA):</td>
                          <td className="py-2 text-right font-medium">{offer.price_per_km.toFixed(2)} RON/km</td>
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
                          <td className="py-2 text-gray-600">Subtotal transport (fără TVA):</td>
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
                              Comision platformă ({PLATFORM_FEE_PERCENT}%):
                              <Info className="h-3 w-3 text-gray-400" />
                            </span>
                          </td>
                          <td className="py-2 text-right font-medium">{platformFee.toFixed(0)} RON</td>
                        </tr>
                        <tr>
                          <td className="pt-2 text-base font-bold text-gray-900">TOTAL DE PLATĂ:</td>
                          <td className="pt-2 text-right text-base font-bold text-primary-600">
                            {Math.round(totalPrice).toLocaleString()} RON
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs text-gray-400">
                      Prețul include TVA {TVA_PERCENT}% și comisionul platformei de {PLATFORM_FEE_PERCENT}%.
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
                      <div className="text-xs text-gray-500">{offer.contract_name}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingContract(viewingContract === offer.id ? null : offer.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {viewingContract === offer.id ? "Ascunde" : "Vizualizează"}
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">
                      <Download className="h-3.5 w-3.5" />
                      Descarcă
                    </button>
                  </div>
                </div>
                {viewingContract === offer.id && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-white p-6">
                    <div className="space-y-3 text-sm text-gray-700">
                      <h4 className="text-center text-base font-bold uppercase">
                        Contract de Prestări Servicii Transport Ocazional de Persoane
                      </h4>
                      <p className="text-center text-xs text-gray-500">
                        Nr. {offer.id.toUpperCase()}-{new Date().getFullYear()}
                      </p>
                      <hr />
                      <p>
                        <strong>I. Părțile contractante</strong>
                      </p>
                      <p>
                        <strong>Prestator:</strong> {offer.company.name}, CUI {offer.company.cui},
                        cu sediul în {offer.company.city}, jud. {offer.company.county},
                        denumit în continuare <em>Transportator</em>.
                      </p>
                      <p>
                        <strong>Beneficiar:</strong> conform datelor din platforma ATPSOR,
                        denumit în continuare <em>Client</em>.
                      </p>
                      <p><strong>II. Obiectul contractului</strong></p>
                      <p>
                        Transportul ocazional de {req.passengers} persoane pe ruta{" "}
                        <strong>{req.pickup_city} → {req.dropoff_city}</strong>,
                        în perioada <strong>{req.departure_date} - {req.return_date}</strong>,
                        cu vehiculul <strong>{offer.vehicle.name}</strong> ({offer.vehicle.seats} locuri).
                      </p>
                      <p><strong>III. Prețul și modalitatea de plată</strong></p>
                      <p>
                        Tarif: <strong>{offer.price_per_km} RON/km + TVA</strong> ({pricePerKmWithVat.toFixed(2)} RON/km cu TVA) x{" "}
                        <strong>{totalBillableKm} km</strong> = <strong>{basePriceWithVat.toFixed(0)} RON</strong> (cu TVA).
                        {" "}Comision platformă ({PLATFORM_FEE_PERCENT}%): {platformFee.toFixed(0)} RON.
                        {" "}<strong>Total de plată: {Math.round(totalPrice).toLocaleString()} RON</strong>.
                        {" "}Plata se efectuează online prin platforma ATPSOR.
                      </p>
                      <p>Minim {200} km/zi facturabili. Kilometrii suplimentari peste cei incluși se vor calcula la final, la același tarif.</p>
                      <p><strong>IV. Obligațiile Transportatorului</strong></p>
                      <ul className="list-inside list-disc space-y-1 text-gray-600">
                        <li>Pune la dispoziție vehiculul în stare tehnică corespunzătoare</li>
                        <li>Deține toate documentele valabile: licență, ITP, RCA, asigurare călători</li>
                        {offer.includes_driver && <li>Asigură șofer profesionist cu atestat</li>}
                        {offer.includes_fuel && <li>Suportă costul combustibilului</li>}
                        <li>Respectă programul convenit cu clientul</li>
                      </ul>
                      <p><strong>V. Obligațiile Clientului</strong></p>
                      <ul className="list-inside list-disc space-y-1 text-gray-600">
                        <li>Achită integral prețul convenit înainte de prestarea serviciului</li>
                        <li>Respectă numărul maxim de pasageri declarat</li>
                        <li>Comunică în timp util orice modificare a programului</li>
                      </ul>
                      <p><strong>VI. Anulare</strong></p>
                      <p>Anularea cu mai mult de 48h înainte: rambursare 100%. Anularea cu 24-48h: rambursare 50%. Sub 24h: fără rambursare.</p>
                      <p className="mt-4 text-xs italic text-gray-400">
                        * Contract demonstrativ. În producție, transportatorul încarcă propriul contract PDF semnat.
                      </p>
                    </div>
                  </div>
                )}
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
                      Am citit și accept <strong>contractul de transport</strong> al {offer.company.name}
                    </span>
                  </label>
                  <button
                    onClick={() => handlePayment(offer.id, totalPrice)}
                    disabled={!isContractAccepted || isProcessing}
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition-all ${
                      isContractAccepted
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    {isProcessing
                      ? "Se procesează..."
                      : `Plătește ${Math.round(totalPrice).toLocaleString()} RON`}
                  </button>
                </div>
                {!isContractAccepted && (
                  <p className="mt-2 text-xs text-gray-400">
                    Trebuie să accepți contractul de transport pentru a putea plăti.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* How payment works */}
      <div className="mt-8 rounded-xl bg-gray-50 p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <CreditCard className="h-5 w-5 text-primary-500" />
          Cum funcționează plata cu cardul?
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. <strong>Alegi oferta</strong> și citești contractul de transport al transportatorului.</p>
          <p>2. <strong>Accepți contractul</strong> bifând checkbox-ul de acceptare.</p>
          <p>3. <strong>Click "Plătește"</strong> → ești redirecționat către pagina securizată Stripe.</p>
          <p>4. <strong>Introduci datele cardului</strong> (Visa, Mastercard, etc.) pe pagina Stripe.</p>
          <p>5. <strong>Plata se procesează</strong> → primești confirmare pe email → rezervarea este activă.</p>
          <p className="mt-3 text-xs text-gray-400">
            Plățile sunt procesate securizat prin Stripe. ATPSOR nu stochează datele cardului.
            Comisionul de {PLATFORM_FEE_PERCENT}% este inclus automat în prețul afișat.
            Transportatorul primește suma minus comisionul în contul său.
          </p>
        </div>
      </div>
    </div>
  );
}
