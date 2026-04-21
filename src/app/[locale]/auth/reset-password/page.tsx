"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Lock, Eye, EyeOff, CheckCircle, Bus, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  // La intrarea pe pagina (din email), Supabase auto-stabilește sesiunea temporară
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionOk(!!data.session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parolele nu coincid");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message || "Eroare la actualizare parolă");
    } else {
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    }
    setLoading(false);
  }

  if (sessionOk === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="h-6 w-6 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Link invalid sau expirat</p>
              <p className="mt-1 text-amber-700">
                Link-ul de resetare a expirat sau a fost deja folosit. Cere un nou link de resetare.
              </p>
            </div>
          </div>
          <Link
            href="/auth/forgot-password"
            className="block w-full rounded-lg bg-primary-500 py-3 text-center text-base font-semibold text-white hover:bg-primary-600"
          >
            Cere link nou de resetare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500">
            <Bus className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Parolă nouă</h1>
          <p className="mt-1 text-sm text-gray-500 text-center">
            Setează parola nouă pentru contul tău ATPSOR
          </p>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold">Parolă actualizată!</p>
                  <p className="mt-1 text-green-700">
                    Te redirectăm către pagina de autentificare...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Parolă nouă</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minim 6 caractere"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirmă parola</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repetă parola"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || sessionOk === null}
              className="w-full rounded-lg bg-primary-500 py-3 text-base font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? "Se actualizează..." : "Salvează parola nouă"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
