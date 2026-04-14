"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar, FileText, DollarSign, TrendingUp, Download,
  Loader2, Receipt, Bus,
} from "lucide-react";

const PRESETS = [
  { key: "today", label: "Azi", days: 1 },
  { key: "week", label: "7 zile", days: 7 },
  { key: "month", label: "30 zile", days: 30 },
  { key: "quarter", label: "3 luni", days: 90 },
  { key: "half", label: "6 luni", days: 180 },
  { key: "year", label: "12 luni", days: 365 },
  { key: "custom", label: "Personalizat", days: 0 },
];

interface Booking {
  id: string;
  total_price: number;
  currency: string;
  status: string;
  created_at: string;
  offer?: { request?: { pickup_city?: string; dropoff_city?: string; departure_date?: string } };
}

interface Invoice {
  id: string;
  invoice_type: string;
  smartbill_number: string | null;
  smartbill_series: string | null;
  amount: number;
  vat_amount: number | null;
  currency: string;
  status: string;
  client_name: string;
  created_at: string;
}

export default function ReportsPanel({ companyId }: { companyId: string }) {
  const [preset, setPreset] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Calculate date range
  function getDateRange() {
    const now = new Date();
    const to = now.toISOString().split("T")[0];

    if (preset === "custom") {
      return { from: dateFrom, to: dateTo };
    }

    const presetObj = PRESETS.find((p) => p.key === preset);
    if (!presetObj) return { from: to, to };

    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - presetObj.days);
    return { from: fromDate.toISOString().split("T")[0], to };
  }

  useEffect(() => {
    if (preset !== "custom") fetchReport();
  }, [preset, companyId]);

  async function fetchReport() {
    if (!companyId) return;
    setLoading(true);

    const { from, to } = getDateRange();
    if (!from || !to) { setLoading(false); return; }

    const supabase = createClient();

    const [bookingsRes, invoicesRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, offer:offers(*, request:transport_requests(*))")
        .eq("company_id", companyId)
        .gte("created_at", from)
        .lte("created_at", to + "T23:59:59")
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("*, booking:bookings!inner(company_id)")
        .eq("booking.company_id", companyId)
        .gte("created_at", from)
        .lte("created_at", to + "T23:59:59")
        .order("created_at", { ascending: false }),
    ]);

    setBookings((bookingsRes.data as Booking[]) || []);
    setInvoices((invoicesRes.data as Invoice[]) || []);
    setLoading(false);
  }

  // Calculate totals
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending_payment").length;
  const issuedInvoices = invoices.filter((i) => i.status === "issued").length;
  const totalInvoiced = invoices
    .filter((i) => i.invoice_type === "transport" && i.status === "issued")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalVat = invoices
    .filter((i) => i.invoice_type === "transport" && i.status === "issued")
    .reduce((sum, i) => sum + Number(i.vat_amount || 0), 0);
  const totalCommission = invoices
    .filter((i) => i.invoice_type === "commission")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  function exportCSV() {
    const rows = [
      ["Data", "Factura", "Client", "Suma (fara TVA)", "TVA", "Total", "Status"],
      ...invoices
        .filter((i) => i.invoice_type === "transport")
        .map((i) => [
          new Date(i.created_at).toLocaleDateString("ro-RO"),
          `${i.smartbill_series || ""} ${i.smartbill_number || ""}`,
          i.client_name,
          Number(i.amount).toFixed(2),
          Number(i.vat_amount || 0).toFixed(2),
          (Number(i.amount) + Number(i.vat_amount || 0)).toFixed(2),
          i.status,
        ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const { from, to } = getDateRange();
    a.download = `raport_atpsor_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="rounded-xl bg-white p-5 shadow-md">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Calendar className="h-4 w-4 text-primary-500" />
          Perioada raport
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                preset === p.key
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">De la</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Până la</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={fetchReport}
              disabled={!dateFrom || !dateTo}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              Generează raport
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalRevenue.toLocaleString("ro-RO", { maximumFractionDigits: 0 })}</div>
                  <div className="text-xs text-gray-500">RON venituri totale</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Bus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{confirmedBookings}</div>
                  <div className="text-xs text-gray-500">Rezervari confirmate</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingBookings}</div>
                  <div className="text-xs text-gray-500">In astepare plata</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{issuedInvoices}</div>
                  <div className="text-xs text-gray-500">Facturi emise</div>
                </div>
              </div>
            </div>
          </div>

          {/* Raport contabil */}
          <div className="rounded-xl bg-white p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-primary-500" />
                Raport Contabilitate
              </h3>
              <button
                onClick={exportCSV}
                disabled={invoices.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Venituri facturate (fara TVA):</span>
                <span className="font-semibold">{totalInvoiced.toLocaleString("ro-RO", { maximumFractionDigits: 2 })} RON</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA colectat (21%):</span>
                <span className="font-semibold">{totalVat.toLocaleString("ro-RO", { maximumFractionDigits: 2 })} RON</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total facturat (cu TVA):</span>
                <span className="font-semibold">{(totalInvoiced + totalVat).toLocaleString("ro-RO", { maximumFractionDigits: 2 })} RON</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Comision ATPSOR platit (5%):</span>
                <span className="font-semibold text-red-600">-{totalCommission.toLocaleString("ro-RO", { maximumFractionDigits: 2 })} RON</span>
              </div>
              <div className="flex justify-between text-base border-t pt-2">
                <span className="font-bold text-gray-900">Venit net transportator:</span>
                <span className="font-bold text-green-600">
                  {(totalInvoiced + totalVat - totalCommission).toLocaleString("ro-RO", { maximumFractionDigits: 2 })} RON
                </span>
              </div>
            </div>
          </div>

          {/* Lista facturi */}
          <div className="rounded-xl bg-white p-5 shadow-md">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <Receipt className="h-5 w-5 text-primary-500" />
              Facturi emise ({invoices.filter((i) => i.invoice_type === "transport").length})
            </h3>
            {invoices.filter((i) => i.invoice_type === "transport").length === 0 ? (
              <p className="text-center text-gray-400 py-6">Nicio factura in perioada selectata.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Factura</th>
                      <th className="px-3 py-2">Client</th>
                      <th className="px-3 py-2 text-right">Valoare</th>
                      <th className="px-3 py-2 text-right">TVA</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.filter((i) => i.invoice_type === "transport").map((i) => (
                      <tr key={i.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{new Date(i.created_at).toLocaleDateString("ro-RO")}</td>
                        <td className="px-3 py-2 font-mono font-medium">{i.smartbill_series} {i.smartbill_number}</td>
                        <td className="px-3 py-2">{i.client_name}</td>
                        <td className="px-3 py-2 text-right">{Number(i.amount).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{Number(i.vat_amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{(Number(i.amount) + Number(i.vat_amount || 0)).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            i.status === "issued" ? "bg-green-50 text-green-600" :
                            i.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                            "bg-red-50 text-red-600"
                          }`}>
                            {i.status === "issued" ? "Emisa" : i.status === "pending" ? "In asteptare" : "Eroare"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
