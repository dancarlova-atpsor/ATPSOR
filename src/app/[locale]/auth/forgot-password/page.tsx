"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Mail, ArrowLeft, CheckCircle, Bus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/ro/auth/reset-password`,
    });

    if (err) {
      setError(err.message || "Eroare la trimiterea email-ului");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500">
            <Bus className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Resetare parolă</h1>
          <p className="mt-1 text-sm text-gray-500 text-center">
            Introdu adresa de email și îți trimitem un link de resetare
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold">Email trimis cu succes!</p>
                  <p className="mt-1 text-green-700">
                    Am trimis un link de resetare pe <strong>{email}</strong>.
                    Verifică inbox-ul (și folder-ul Spam) și apasă pe link pentru a seta o parolă nouă.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-500 py-3 text-base font-semibold text-white hover:bg-primary-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Adresă de email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@exemplu.ro"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-500 py-3 text-base font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? "Se trimite..." : "Trimite link resetare"}
            </button>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la autentificare
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
