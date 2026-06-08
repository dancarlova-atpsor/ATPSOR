"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle, XCircle, Clock, Loader2, Mail, Phone, Building, User,
  Calendar, AlertCircle, Filter, ExternalLink,
} from "lucide-react";

interface MembershipRequest {
  id: string;
  company_name: string;
  cui: string;
  company_city: string;
  company_county: string;
  company_phone: string | null;
  company_email: string;
  admin_name: string;
  admin_phone: string | null;
  admin_email: string;
  amount: number;
  currency: string;
  payment_reference: string;
  status: "pending_payment" | "paid" | "rejected" | "expired" | "cancelled";
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  activated_user_id: string | null;
  activated_company_id: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "În așteptare plată", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  paid: { label: "✓ Plătită — Activat", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "✗ Respinsă", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  expired: { label: "Expirată", color: "bg-gray-100 text-gray-600 border-gray-300", icon: AlertCircle },
  cancelled: { label: "Anulată", color: "bg-gray-100 text-gray-600 border-gray-300", icon: XCircle },
};

export default function MembershipManager() {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("membership_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else if (data) {
      setRequests(data as MembershipRequest[]);
    }
    setLoading(false);
  }

  async function confirmPayment(id: string) {
    if (!confirm("Confirmi că plata a fost primită în cont? Asta va crea automat contul transportatorului și-i va trimite email cu credențiale.")) return;
    setProcessing(id);
    setMessage(null);
    try {
      const res = await fetch("/api/membership/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Eroare la confirmare" });
      } else {
        setMessage({
          type: "success",
          text: data.new_user
            ? "✓ Plată confirmată. Cont transportator creat și email cu credențiale trimis."
            : "✓ Plată confirmată. User existent reactivat.",
        });
        loadRequests();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Eroare de conexiune" });
    }
    setProcessing(null);
  }

  async function rejectRequest(id: string) {
    const reason = prompt("Motivul respingerii (va fi trimis prin email):");
    if (!reason) return;
    setProcessing(id);
    setMessage(null);
    try {
      const res = await fetch("/api/membership/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Eroare la respingere" });
      } else {
        setMessage({ type: "success", text: "✓ Cerere respinsă. Email trimis." });
        loadRequests();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Eroare de conexiune" });
    }
    setProcessing(null);
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending_payment: requests.filter((r) => r.status === "pending_payment").length,
    paid: requests.filter((r) => r.status === "paid").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-semibold">📋 Cereri de adeziune ATPSOR</p>
        <p className="mt-1 text-blue-700">
          Transportatorii completează form-ul pe <strong>atpsor.ro/membership</strong>.
          Aici aprobi sau respingi cererile.
          Pe <strong>"Confirmă plata"</strong>, se creează automat contul + email cu credențiale.
        </p>
        <div className="mt-2 rounded bg-white p-2 font-mono text-xs">
          <strong>Cont ATPSOR:</strong> IBAN RO58 CECE B000 30RO N397 9534 | CEC Bank | CIF 52819099 | 500 RON/an
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg border-2 p-3 text-sm font-semibold ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-700 border-red-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        {[
          { key: "all", label: `Toate (${counts.all})` },
          { key: "pending_payment", label: `În așteptare (${counts.pending_payment})` },
          { key: "paid", label: `Activate (${counts.paid})` },
          { key: "rejected", label: `Respinse (${counts.rejected})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === f.key ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-md">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">
            {filter === "all" ? "Nicio cerere de adeziune încă." : "Nicio cerere în această categorie."}
          </p>
        </div>
      ) : (
        filtered.map((r) => {
          const cfg = statusConfig[r.status] || statusConfig.pending_payment;
          const StatusIcon = cfg.icon;
          const isCompany = r.cui !== "PF";
          return (
            <div key={r.id} className="rounded-xl bg-white p-5 shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {isCompany ? <Building className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-purple-600" />}
                    <span className="font-semibold text-gray-900">{r.company_name}</span>
                    <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-gray-600 sm:grid-cols-2">
                    {isCompany && <div><strong>CUI:</strong> {r.cui}</div>}
                    <div><strong>Contact:</strong> {r.admin_name}</div>
                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {r.admin_email}</div>
                    <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {r.admin_phone || "—"}</div>
                    <div><strong>Locație:</strong> {r.company_city}, {r.company_county}</div>
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                      Trimisă: {new Date(r.created_at).toLocaleDateString("ro-RO")}
                    </div>
                  </div>

                  {r.admin_notes && (
                    <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600 whitespace-pre-line">
                      {r.admin_notes}
                    </div>
                  )}

                  <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs">
                    <strong className="text-amber-700">Referință plată:</strong>
                    <span className="font-mono ml-1 font-bold text-amber-900">{r.payment_reference}</span>
                  </div>

                  {r.status === "paid" && r.paid_at && (
                    <div className="mt-2 text-xs text-green-700">
                      ✓ Plată confirmată: {new Date(r.paid_at).toLocaleString("ro-RO")}
                      {r.expires_at && <> · Expiră: {new Date(r.expires_at).toLocaleDateString("ro-RO")}</>}
                    </div>
                  )}

                  {r.status === "rejected" && r.rejection_reason && (
                    <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                      <strong>Motiv respingere:</strong> {r.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{Number(r.amount).toFixed(0)} {r.currency}</div>
                </div>
              </div>

              {/* Acțiuni */}
              {r.status === "pending_payment" && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => confirmPayment(r.id)}
                    disabled={processing === r.id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "✓ Confirmă plata (activează cont)"}
                  </button>
                  <button
                    onClick={() => rejectRequest(r.id)}
                    disabled={processing === r.id}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    ✗ Respinge
                  </button>
                </div>
              )}

              {r.status === "paid" && r.activated_company_id && (
                <div className="mt-3 flex border-t border-gray-100 pt-3">
                  <a
                    href={`/ro/dashboard/admin/company/${r.activated_company_id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Deschide compania activată <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
