"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bus, Mail, Lock, Chrome, Facebook } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message === "Invalid login credentials"
          ? "Email sau parolă incorectă"
          : error.message);
        setLoading(false);
      } else {
        // Get user role to redirect properly
        const { data: { user } } = await supabase.auth.getUser();
        const role = user?.user_metadata?.role || "client";
        window.location.href = role === "transporter"
          ? "/ro/dashboard/transporter"
          : "/ro/dashboard/client";
      }
    } catch {
      setError("Eroare la conectare. Verifică conexiunea.");
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

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-white">
            <Bus className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("loginTitle")}</h1>
          <p className="mt-2 text-gray-600">{t("loginSubtitle")}</p>
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

        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="email@exemplu.ro" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary-500 py-3 text-base font-semibold text-white hover:bg-primary-600 disabled:opacity-50">
            {loading ? "Se conecteaz\u0103..." : "Conecteaz\u0103-te"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("noAccount")}{" "}
          <Link href="/auth/register" className="font-medium text-primary-500 hover:text-primary-600">
            {t("registerTitle")}
          </Link>
        </p>
      </div>
    </div>
  );
}
