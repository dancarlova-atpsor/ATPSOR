"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bus, Mail, Lock, User, Phone, Chrome, Facebook, CheckCircle } from "lucide-react";

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc");
      return;
    }
    if (password.length < 6) {
      setError("Parola trebuie s\u0103 aib\u0103 cel pu\u021bin 6 caractere");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      if (error) {
        setError(error.message === "User already registered"
          ? "Acest email este deja \u00eenregistrat"
          : error.message);
        setLoading(false);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Eroare la \u00eenregistrare. Verifică conexiunea.");
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: "google" | "facebook") {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
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
            Verific\u0103 inbox-ul (\u0219i folderul Spam) \u0219i click\u0103 pe link pentru a-\u021bi activa contul.
          </p>
          <Link href="/auth/login"
            className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-2.5 font-medium text-white hover:bg-primary-600">
            Mergi la Autentificare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary-500 py-3 text-base font-semibold text-white hover:bg-primary-600 disabled:opacity-50">
            {loading ? "Se creeaz\u0103 contul..." : "Creeaz\u0103 Cont"}
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
