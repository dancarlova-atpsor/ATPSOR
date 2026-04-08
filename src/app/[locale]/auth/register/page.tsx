"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import {
  Bus,
  Mail,
  Lock,
  User,
  Phone,
  Chrome,
  Facebook,
  Building2,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROMANIAN_COUNTIES } from "@/types/database";
import { CityTagsInput } from "@/components/ui/CityTagsInput";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "transporter">("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Company fields (transporter only)
  const [companyName, setCompanyName] = useState("");
  const [companyCui, setCompanyCui] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyCounty, setCompanyCounty] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [pickupCities, setPickupCities] = useState<string[]>([]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc");
      return;
    }
    if (password.length < 6) {
      setError("Parola trebuie să aibă cel puțin 6 caractere");
      return;
    }

    if (role === "transporter" && (!companyName || !companyCui || !companyCity || !companyCounty)) {
      setError("Completează toate câmpurile obligatorii ale companiei");
      return;
    }

    if (role === "transporter" && pickupCities.length === 0) {
      setError("Adaugă cel puțin un oraș de îmbarcare");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(
          authError.message === "User already registered"
            ? "Acest email este deja înregistrat"
            : authError.message
        );
        setLoading(false);
        return;
      }

      // If transporter, create company
      if (role === "transporter" && signUpData.user) {
        const { error: companyError } = await supabase.from("companii").insert({
          owner_id: signUpData.user.id,
          name: companyName,
          cui: companyCui,
          license_number: "-",
          address: companyAddress || companyCity,
          city: companyCity,
          county: companyCounty,
          phone: companyPhone || phone,
          email: email,
          pickup_cities: pickupCities,
        });

        if (companyError) {
          console.error("Company creation error:", companyError);
          // Don't fail registration, company can be created later
        }
      }

      setLoading(false);
      setSuccess(true);
    } catch {
      setError("Eroare la înregistrare. Verifică conexiunea.");
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: "google" | "facebook") {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      setError("Eroare la autentificare.");
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Cont creat cu succes!</h2>
          <p className="mt-3 text-gray-600">
            Am trimis un email de confirmare la <strong>{email}</strong>.
            Verifică inbox-ul (și folderul Spam) și clickă pe link pentru a-ți activa contul.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
            >
              Mergi la Autentificare
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-white">
            <Bus className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("registerTitle")}</h1>
          <p className="mt-2 text-gray-600">{t("registerSubtitle")}</p>
        </div>

        <div className="space-y-3">
          <button onClick={() => handleOAuthLogin("google")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Chrome className="h-5 w-5" />
            {t("loginWithGoogle")}
          </button>
          <button onClick={() => handleOAuthLogin("facebook")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Facebook className="h-5 w-5 text-blue-600" />
            {t("loginWithFacebook")}
          </button>
        </div>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-500">{t("orContinueWith")}</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole("client")}
              className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                role === "client" ? "border-primary-500 bg-primary-50 text-primary-600" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              {t("roleClient")}
            </button>
            <button type="button" onClick={() => setRole("transporter")}
              className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                role === "transporter" ? "border-primary-500 bg-primary-50 text-primary-600" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              {t("roleTransporter")}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("fullName")}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="email@exemplu.ro" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("phone")}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="+40 7XX XXX XXX" />
            </div>
          </div>

          {/* Company fields - shown only for transporters */}
          {role === "transporter" && (
            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Building2 className="h-4 w-4" />
                Date companie transport
              </h3>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nume companie *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={role === "transporter"}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="SC Transport SRL"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  CUI *
                </label>
                <input
                  type="text"
                  value={companyCui}
                  onChange={(e) => setCompanyCui(e.target.value)}
                  required={role === "transporter"}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="RO12345678"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Oraș *
                  </label>
                  <input
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    required={role === "transporter"}
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Județ *
                  </label>
                  <select
                    value={companyCounty}
                    onChange={(e) => setCompanyCounty(e.target.value)}
                    required={role === "transporter"}
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Selectează</option>
                    {ROMANIAN_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Adresă sediu
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Str. Exemplu nr. 1"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telefon companie
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="+40 XXX XXX XXX"
                  />
                </div>
              </div>

              <CityTagsInput
                value={pickupCities}
                onChange={setPickupCities}
                label="Orașe de îmbarcare"
                placeholder="Ex: București, Ploiești, Pitești..."
                required
              />
              <p className="text-xs text-gray-500">
                Adaugă orașele din care poți prelua clienți. Vei apărea în căutări din aceste orașe.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("confirmPassword")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-500 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? "Se creează contul..." : t("registerTitle")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("hasAccount")}{" "}
          <Link href="/auth/login" className="font-medium text-primary-500 hover:text-primary-600">
            {t("loginTitle")}
          </Link>
        </p>
      </div>
    </div>
  );
}
