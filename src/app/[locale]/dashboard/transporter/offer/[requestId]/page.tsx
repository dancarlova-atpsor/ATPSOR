"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Camera,
  Image,
  Loader2,
} from "lucide-react";
import { VEHICLE_CATEGORIES } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";

export default function SendOfferPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [vehicleId, setVehicleId] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [includesDriver, setIncludesDriver] = useState(true);
  const [includesFuel, setIncludesFuel] = useState(true);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Real data from DB
  const [req, setReq] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
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

      // Fetch the transport request
      const { data: request } = await supabase
        .from("transport_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (request) setReq(request);

      // Fetch transporter's company
      const { data: comp } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (comp) {
        setCompany(comp);

        // Fetch company's vehicles
        const { data: vehs } = await supabase
          .from("vehicles")
          .select("*")
          .eq("company_id", comp.id)
          .eq("is_active", true)
          .order("name");

        if (vehs) setVehicles(vehs);
      }

      setLoading(false);
    }

    loadData();
  }, [requestId, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setContractFile(file);
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setFilePreview(url);
      } else {
        setFilePreview(null);
      }
    }
  }

  function clearFile() {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setContractFile(null);
    setFilePreview(null);
  }

  const isImage = contractFile?.type.startsWith("image/");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contractFile || !company) return;
    setSubmitting(true);
    setError("");

    const supabase = createClient();

    // Upload contract file
    let contractUrl = null;
    let contractName = null;
    if (contractFile) {
      const result = await uploadFile(
        contractFile,
        `contracts/${company.id}`
      );
      if (result) {
        contractUrl = result.url;
        contractName = contractFile.name;
      }
    }

    // Insert offer
    const { error: offerError } = await supabase.from("offers").insert({
      request_id: requestId,
      company_id: company.id,
      vehicle_id: vehicleId,
      price: parseFloat(price),
      includes_driver: includesDriver,
      includes_fuel: includesFuel,
      message: message || null,
      valid_until: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      contract_url: contractUrl,
      contract_name: contractName,
    });

    if (offerError) {
      setError(
        offerError.message.includes("unique")
          ? "Ai trimis deja o ofertă pentru această cerere"
          : offerError.message
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Cererea nu a fost găsită
        </h2>
        <Link
          href="/dashboard/transporter"
          className="mt-4 inline-block text-primary-500 hover:text-primary-600"
        >
          Înapoi la Panou
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Ofertă trimisă!</h2>
        <p className="mt-3 text-gray-600">
          Oferta ta a fost trimisă clientului. Contractul de transport a fost
          atașat. Vei fi notificat când clientul acceptă oferta.
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
              {VEHICLE_CATEGORIES[
                req.vehicle_category as keyof typeof VEHICLE_CATEGORIES
              ]?.label || req.vehicle_category || "Orice"}
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
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

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
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.seats} locuri -{" "}
                  {
                    VEHICLE_CATEGORIES[
                      v.category as keyof typeof VEHICLE_CATEGORIES
                    ]?.label
                  }
                  )
                </option>
              ))}
            </select>
          </div>
          {vehicles.length === 0 && !loading && (
            <p className="mt-2 text-sm text-amber-600">
              Nu ai vehicule adăugate.{" "}
              <Link
                href="/dashboard/transporter/add-vehicle"
                className="underline"
              >
                Adaugă un vehicul
              </Link>{" "}
              mai întâi.
            </p>
          )}
        </div>

        {/* Price per km */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Preț per km (RON)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="ex: 3.5"
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
            Contract de Transport *
          </label>
          <div
            className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              contractFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-primary-400"
            }`}
          >
            {contractFile ? (
              <div className="flex flex-col items-center gap-3">
                {isImage && filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview contract"
                    className="max-h-48 rounded-lg border border-gray-200 object-contain"
                  />
                ) : (
                  <FileText className="h-8 w-8 text-green-500" />
                )}
                <div className="flex items-center gap-3">
                  {isImage ? (
                    <Image className="h-5 w-5 text-green-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-green-500" />
                  )}
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
                    onClick={clearFile}
                    className="ml-4 text-sm text-red-500 hover:text-red-700"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="mx-auto flex items-center justify-center gap-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">
                  Încarcă contractul — PDF sau fotografie
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, JPG, PNG — max 10MB. Poți face o poză direct cu
                  telefonul.
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Contractul va fi vizibil clientului înainte de plată. Clientul
            trebuie să accepte contractul pentru a putea plăti.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || !contractFile || !vehicleId}
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
