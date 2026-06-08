"use client";

import { useState } from "react";
import { Bell, Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface CronResult {
  success: boolean;
  total_alerts?: number;
  emails_sent?: number;
  companies_deactivated?: number;
  details?: Array<{
    company: string;
    email: string;
    severity: string;
    expired: number;
    upcoming: number;
    suspended: boolean;
  }>;
  error?: string;
}

const severityLabel: Record<string, { text: string; color: string }> = {
  expired: { text: "EXPIRATE", color: "bg-red-100 text-red-700 border-red-300" },
  urgent_1d: { text: "Urgent (1 zi)", color: "bg-orange-100 text-orange-700 border-orange-300" },
  warning_7d: { text: "În 7 zile", color: "bg-amber-100 text-amber-700 border-amber-300" },
  reminder_15d: { text: "În 15 zile", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  headsup_30d: { text: "În 30 zile", color: "bg-slate-100 text-slate-700 border-slate-300" },
};

export default function DocumentExpiryPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CronResult | null>(null);

  async function runCron() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/check-documents", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, error: err?.message || "Eroare de conexiune" });
    }
    setRunning(false);
  }

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-900">
            <Bell className="h-5 w-5" />
            Verificare manuală documente expirate
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            Rulează cronul ACUM pentru a trimite email-uri către transportatorii cu documente expirate / care urmează să expire.
            Cronul rulează automat zilnic la 08:00 (Vercel Cron).
          </p>
        </div>
        <button
          onClick={runCron}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {running ? "Rulează..." : "Rulează cron acum"}
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
          {result.success ? (
            <>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckCircle className="h-5 w-5" />
                Cron executat cu succes
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded bg-blue-50 p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{result.total_alerts || 0}</div>
                  <div className="text-xs text-blue-600">Companii alertate</div>
                </div>
                <div className="rounded bg-green-50 p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{result.emails_sent || 0}</div>
                  <div className="text-xs text-green-600">Emailuri trimise</div>
                </div>
                <div className="rounded bg-red-50 p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">{result.companies_deactivated || 0}</div>
                  <div className="text-xs text-red-600">Companii suspendate</div>
                </div>
              </div>

              {result.details && result.details.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Detalii per companie:</div>
                  <div className="space-y-2">
                    {result.details.map((d, idx) => {
                      const sev = severityLabel[d.severity] || { text: d.severity, color: "bg-gray-100 text-gray-700" };
                      return (
                        <div key={idx} className="flex flex-wrap items-center gap-2 rounded border border-gray-200 bg-gray-50 p-2 text-sm">
                          <span className="font-medium text-gray-900">{d.company}</span>
                          <span className="text-xs text-gray-500">({d.email})</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sev.color}`}>{sev.text}</span>
                          {d.expired > 0 && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              {d.expired} expirate
                            </span>
                          )}
                          {d.upcoming > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              {d.upcoming} apropiate
                            </span>
                          )}
                          {d.suspended && (
                            <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                              🚫 SUSPENDAT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!result.details || result.details.length === 0) && (
                <div className="mt-3 text-center text-sm text-gray-500">
                  ✓ Niciun document expirat sau aproape de expirare. Toate companiile sunt în regulă.
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <XCircle className="h-5 w-5" />
              Eroare: {result.error || "Necunoscută"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
