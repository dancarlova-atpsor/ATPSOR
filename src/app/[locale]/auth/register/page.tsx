"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { Bus, Mail, Lock, User, Phone, Chrome, Facebook } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "transporter">("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc");
      return;
    }

    setLoading(true);

    // Demo mode - simulate registration
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 800);
  }

  function handleOAuthLogin(provider: "google" | "facebook") {
    // Demo mode
    router.push(
      role === "transporter" ? "/dashboard/transporter" : "/dashboard/client"
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Cont creat cu succes!
          </h2>
          <p className="mt-3 text-gray-600">
            {role === "transporter" ? (
              <>
                Contul t&#259;u de transportator a fost creat. &#206;n versiunea final&#259;,
                vei primi un email de confirmare la <strong>{email}</strong>.
              </>
            ) : (
              <>
                Contul t&#259;u de client a fost creat. &#206;n versiunea final&#259;, vei
                primi un email de confirmare la <strong>{email}</strong>.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={
                role === "transporter"
                  ? "/dashboard/transporter"
                  : "/dashboard/client"
              }
              className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
            >
              Mergi la Panou
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              &#206;napoi la Autentificare
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Demo banner */}
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center text-sm text-amber-700">
          Versiune demonstrativ&#259; &mdash; &#238;nregistrarea va fi activat&#259; dup&#259;
          configurarea Supabase
        </div>

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-white">
            <Bus className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("registerTitle")}
          </h1>
          <p className="mt-2 text-gray-600">{t("registerSubtitle")}</p>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin("google")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Chrome className="h-5 w-5" />
            {t("loginWithGoogle")}
          </button>
          <button
            onClick={() => handleOAuthLogin("facebook")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Facebook className="h-5 w-5 text-blue-600" />
            {t("loginWithFacebook")}
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-500">{t("orContinueWith")}</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                role === "client"
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {t("roleClient")}
            </button>
            <button
              type="button"
              onClick={() => setRole("transporter")}
              className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                role === "transporter"
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {t("roleTransporter")}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("fullName")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="email@exemplu.ro"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("phone")}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="+40 7XX XXX XXX"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-500 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? "Se creeaz&#259; contul..." : t("registerTitle")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("hasAccount")}{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary-500 hover:text-primary-600"
          >
            {t("loginTitle")}
          </Link>
        </p>
      </div>
    </div>
  );
}
