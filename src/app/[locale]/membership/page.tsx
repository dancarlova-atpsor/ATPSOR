"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  Shield,
  Users,
  CheckCircle,
  FileText,
  Download,
  CreditCard,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowLeft,
  Gavel,
  BookOpen,
  Headphones,
  TrendingUp,
} from "lucide-react";

export default function MembershipPage() {
  const [formType, setFormType] = useState<"company" | "individual">("company");
  const [companyName, setCompanyName] = useState("");
  const [cui, setCui] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [vehicleCount, setVehicleCount] = useState("");
  const [motivation, setMotivation] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCity: "CERERE ADEZIUNE ATPSOR",
          pickupLocation: formType === "company" ? `Firmă: ${companyName} (CUI: ${cui})` : `Persoană fizică: ${fullName}`,
          dropoffCity: `${city}, ${county}`,
          dropoffLocation: `${email} | ${phone}`,
          departureDate: new Date().toISOString().split("T")[0],
          passengers: vehicleCount || "0",
          vehicleCategory: formType,
          description: `Tip: ${formType === "company" ? "Reprezentant firmă transport" : "Persoană din domeniu"}\nNume: ${fullName}\nFuncție: ${position}\nMotivație: ${motivation}`,
          isRoundTrip: false,
          dayPrograms: [],
          totalEstimatedKm: 0,
          totalBillableKm: 0,
        }),
      });
    } catch {
      // Continue
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Cerere de adeziune trimisă!</h2>
        <p className="mt-4 text-gray-600">
          Cererea ta a fost trimisă cu succes. Echipa ATPSOR o va analiza și te va contacta
          în cel mai scurt timp la adresa <strong>{email}</strong> sau la numărul <strong>{phone}</strong>.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Taxa anuală de membru este de <strong>500 RON</strong>. Detaliile de plată vor fi trimise
          după aprobarea cererii.
        </p>
        <Link href="/"
          className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-2.5 font-medium text-white hover:bg-primary-600">
          Înapoi la Acasă
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Înapoi
      </Link>

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <Users className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Devino Membru ATPSOR</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Alătură-te Asociației Transportatorilor de Persoane prin Serviciul Ocazional din România.
          Pot deveni membri reprezentanții firmelor de transport și orice persoană din domeniul
          transportului de persoane.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Benefits sidebar */}
        <div className="lg:col-span-1">
          {/* Pricing card */}
          <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white shadow-lg">
            <div className="text-sm text-primary-200">Taxa anuală de membru</div>
            <div className="mt-1 text-4xl font-bold">500 RON</div>
            <div className="text-sm text-primary-200">/ an</div>
            <hr className="my-4 border-white/20" />
            <ul className="space-y-2 text-sm">
              {[
                "Reprezentare în fața autorităților",
                "Consultanță juridică",
                "Acces platformă transport",
                "Asistență documente",
                "Comunitate profesională",
                "Suport dedicat",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Download adhesion form */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <FileText className="h-5 w-5 text-primary-500" />
              Cerere de Adeziune (PDF)
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Descarcă cererea de adeziune, completeaz-o și trimite-o semnată la adresa asociației sau încarcă-o online.
            </p>
            <a href="/cerere-adeziune-atpsor.pdf" download
              className="flex items-center justify-center gap-2 rounded-lg border border-primary-500 px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50">
              <Download className="h-4 w-4" />
              Descarcă Cerere PDF
            </a>
          </div>
        </div>

        {/* Application form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Formular de Adeziune Online</h2>

            {/* Member type */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">Tip membru</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormType("company")}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    formType === "company" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <Building className={`h-6 w-6 ${formType === "company" ? "text-primary-500" : "text-gray-400"}`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Firmă de Transport</div>
                    <div className="text-xs text-gray-500">Reprezentant legal al firmei</div>
                  </div>
                </button>
                <button type="button" onClick={() => setFormType("individual")}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    formType === "individual" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <User className={`h-6 w-6 ${formType === "individual" ? "text-primary-500" : "text-gray-400"}`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Persoană din Domeniu</div>
                    <div className="text-xs text-gray-500">Șofer, dispecer, consultant, etc.</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Company fields */}
              {formType === "company" && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Denumire firmă *</label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        placeholder="SC Transport SRL" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">CUI *</label>
                      <input type="text" value={cui} onChange={(e) => setCui(e.target.value)} required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                        placeholder="RO12345678" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Număr vehicule în flotă</label>
                    <input type="number" value={vehicleCount} onChange={(e) => setVehicleCount(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      placeholder="ex: 5" />
                  </div>
                </>
              )}

              {/* Common fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nume complet *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Funcție / Rol</label>
                  <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder={formType === "company" ? "ex: Administrator, Director" : "ex: Șofer profesionist"} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      placeholder="email@exemplu.ro" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefon *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      placeholder="+40 7XX XXX XXX" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Oraș *</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Județ *</label>
                  <input type="text" value={county} onChange={(e) => setCounty(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">De ce dorești să te alături ATPSOR?</label>
                <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Spune-ne motivele pentru care dorești să devii membru..." />
              </div>

              {/* Terms */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} required
                    className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-200" />
                  <span className="text-sm text-gray-700">
                    Declar că datele completate sunt reale și accept <strong>Statutul ATPSOR</strong> și
                    <strong> Regulamentul de Organizare</strong>. Înțeleg că taxa anuală de membru este de
                    <strong> 500 RON</strong> și se achită după aprobarea cererii de adeziune.
                  </span>
                </label>
              </div>

              <button type="submit" disabled={submitting || !acceptTerms}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-primary-600 disabled:opacity-50">
                <Send className="h-5 w-5" />
                {submitting ? "Se trimite..." : "Trimite Cererea de Adeziune"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
