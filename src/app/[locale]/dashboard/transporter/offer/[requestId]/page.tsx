"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import {
  ArrowLeft,
  Send,
  Bus,
  DollarSign,
  FileText,
  Upload,
  CheckCircle,
  MapPin,
  Users,
  Calendar,
} from "lucide-react";
import { VEHICLE_CATEGORIES } from "@/types/database";

// Demo: cererea pentru care se trimite oferta
const DEMO_REQUEST = {
  id: "r1",
  pickup_city: "București",
  pickup_location: "Aeroport Henri Coandă",
  dropoff_city: "Brașov",
  dropoff_location: "Hotel Kronwell",
  departure_date: "2026-04-15",
  return_date: "2026-04-17",
  passengers: 40,
  vehicle_category: "autocar",
  description: "Excursie 3 zile, Brașov - Sibiu - București",
};

const DEMO_VEHICLES = [
  { id: "v1", name: "Mercedes Sprinter 2023", category: "microbuz", seats: 19 },
  { id: "v2", name: "MAN Lion's Coach 2022", category: "autocar", seats: 48 },
  { id: "v4", name: "Setra ComfortClass 2021", category: "autocar_maxi", seats: 55 },
];

export default function SendOfferPage() {
  const t = useTranslations();
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [includesDriver, setIncludesDriver] = useState(true);
  const [includesFuel, setIncludesFuel] = useState(true);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const req = DEMO_REQUEST;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setContractFile(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contractFile) return;
    setSubmitting(true);

    // Demo: simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Ofertă trimisă!</h2>
        <p className="mt-3 text-gray-600">
          Oferta ta a fost trimisă clientului. Contractul de transport a fost atașat.
          Vei fi notificat când clientul acceptă oferta.
        </p>
        <Link
          href="/dashboard/transporter"
          className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-2.5 font-medium text-white hover:bg-primary-600"
        >
          Înapoi la Panou
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/transporter"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la Panou
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">Trimite Ofertă</h1>
      <p className="mb-8 text-gray-600">
        Completează oferta și încarcă contractul de transport
      </p>

      {/* Request Summary */}
      <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Cerere de Transport
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Traseu:</span>
            <span className="font-medium">
              {req.pickup_city} → {req.dropoff_city}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Data:</span>
            <span className="font-medium">
              {req.departure_date}
              {req.return_date && ` → ${req.return_date}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Pasageri:</span>
            <span className="font-medium">{req.passengers}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bus className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Tip:</span>
            <span className="font-medium">
              {VEHICLE_CATEGORIES[req.vehicle_category as keyof typeof VEHICLE_CATEGORIES]?.label || req.vehicle_category}
            </span>
          </div>
        </div>
        {req.description && (
          <p className="mt-3 text-sm text-gray-600">{req.description}</p>
        )}
      </div>

      {/* Offer Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white p-6 shadow-lg sm:p-8"
      >
        {/* Vehicle Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Vehicul oferit
          </label>
          <div className="relative">
            <Bus className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Selectează vehiculul</option>
              {DEMO_VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.seats} locuri -{" "}
                  {VEHICLE_CATEGORIES[v.category as keyof typeof VEHICLE_CATEGORIES]?.label})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Preț total (RON)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="ex: 2500"
            />
          </div>
        </div>

        {/* Includes */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includesDriver}
              onChange={(e) => setIncludesDriver(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-500"
            />
            <span className="text-sm text-gray-700">Include șofer</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includesFuel}
              onChange={(e) => setIncludesFuel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-500"
            />
            <span className="text-sm text-gray-700">Include combustibil</span>
          </label>
        </div>

        {/* Message */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mesaj pentru client
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="Condiții speciale, detalii suplimentare..."
          />
        </div>

        {/* Contract Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Contract de Transport (PDF) *
          </label>
          <div
            className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              contractFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-primary-400"
            }`}
          >
            {contractFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {contractFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(contractFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContractFile(null)}
                  className="ml-4 text-sm text-red-500 hover:text-red-700"
                >
                  Șterge
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700">
                  Click pentru a încărca contractul
                </p>
                <p className="mt-1 text-xs text-gray-500">PDF, max 10MB</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Contractul va fi vizibil clientului înainte de plată. Clientul trebuie
            să accepte contractul pentru a putea plăti.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || !contractFile}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-accent-600 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {submitting ? "Se trimite..." : "Trimite Oferta"}
          </button>
        </div>
      </form>
    </div>
  );
}
