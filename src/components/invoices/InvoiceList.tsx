"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Send,
  XCircle,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Mail,
  X,
} from "lucide-react";

interface Invoice {
  id: string;
  booking_id: string;
  invoice_type: string;
  smartbill_number: string | null;
  smartbill_series: string | null;
  issuer_name: string;
  issuer_cui: string;
  client_name: string;
  amount: number;
  vat_amount: number | null;
  currency: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  transport: "Transport",
  commission: "Comision ATPSOR",
  luxuria_commission: "Comision Luxuria",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  issued: { icon: CheckCircle, label: "Emisă", color: "text-green-600 bg-green-50" },
  pending: { icon: Clock, label: "În așteptare", color: "text-yellow-600 bg-yellow-50" },
  failed: { icon: AlertTriangle, label: "Eroare", color: "text-red-600 bg-red-50" },
  cancelled: { icon: XCircle, label: "Anulată", color: "text-gray-600 bg-gray-100" },
  reversed: { icon: RotateCcw, label: "Stornată", color: "text-purple-600 bg-purple-50" },
};

interface InvoiceListProps {
  role: "transporter" | "client" | "admin";
}

export default function InvoiceList({ role }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailModal, setEmailModal] = useState<{ invoiceId: string; clientName: string } | null>(null);
  const [emailTo, setEmailTo] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [role]);

  async function fetchInvoices() {
    try {
      const res = await fetch(`/api/invoices?role=${role}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {
      console.error("Failed to fetch invoices");
    }
    setLoading(false);
  }

  async function handleDownloadPdf(invoice: Invoice) {
    if (!invoice.smartbill_number) return;
    setActionLoading(`pdf-${invoice.id}`);
    try {
      const res = await fetch(`/api/invoices/pdf?invoiceId=${invoice.id}`);
      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Eroare descărcare PDF" });
        setActionLoading(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura_${invoice.smartbill_series}_${invoice.smartbill_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", text: "Eroare la descărcarea PDF-ului" });
    }
    setActionLoading(null);
  }

  async function handleSendEmail() {
    if (!emailModal || !emailTo) return;
    setActionLoading(`send-${emailModal.invoiceId}`);
    try {
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: emailModal.invoiceId, email: emailTo }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error || "Eroare trimitere email" });
      }
    } catch {
      setMessage({ type: "error", text: "Eroare la trimiterea emailului" });
    }
    setActionLoading(null);
    setEmailModal(null);
    setEmailTo("");
  }

  async function handleCancel(invoiceId: string, action: "cancel" | "reverse") {
    const label = action === "reverse" ? "storna" : "anula";
    if (!confirm(`Sigur vrei să ${label}zi această factură?`)) return;
    setActionLoading(`cancel-${invoiceId}`);
    try {
      const res = await fetch("/api/invoices/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        fetchInvoices(); // Refresh list
      } else {
        setMessage({ type: "error", text: data.error || "Eroare anulare" });
      }
    } catch {
      setMessage({ type: "error", text: "Eroare la anularea facturii" });
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-md">
        <FileText className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">Nu ai facturi încă</h3>
        <p className="mt-2 text-sm text-gray-500">
          Facturile se generează automat după fiecare plată confirmată.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Message */}
      {message && (
        <div className={`flex items-center justify-between rounded-lg p-3 text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Email modal */}
      {emailModal && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-blue-800">
            Trimite factura pe email — {emailModal.clientName}
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="email@exemplu.ro"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <button
              onClick={handleSendEmail}
              disabled={!emailTo || !!actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading?.startsWith("send-") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Trimite
            </button>
            <button
              onClick={() => { setEmailModal(null); setEmailTo(""); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* Invoice cards */}
      {invoices.map((invoice) => {
        const status = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
        const StatusIcon = status.icon;
        const isIssued = invoice.status === "issued";
        const hasSmartBill = !!invoice.smartbill_number;

        return (
          <div key={invoice.id} className="rounded-xl bg-white p-5 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <FileText className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {TYPE_LABELS[invoice.invoice_type] || invoice.invoice_type}
                    </h4>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {hasSmartBill && (
                      <span className="mr-3 font-medium text-gray-700">
                        {invoice.smartbill_series} {invoice.smartbill_number}
                      </span>
                    )}
                    <span>{invoice.issuer_name} → {invoice.client_name}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(invoice.created_at).toLocaleDateString("ro-RO")}
                    {invoice.error_message && (
                      <span className="ml-2 text-red-500">{invoice.error_message}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {invoice.amount.toFixed(2)} {invoice.currency}
                  </div>
                  {invoice.vat_amount && (
                    <div className="text-xs text-gray-400">
                      + {invoice.vat_amount.toFixed(2)} TVA
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isIssued && hasSmartBill && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownloadPdf(invoice)}
                      disabled={!!actionLoading}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                      title="Descarcă PDF"
                    >
                      {actionLoading === `pdf-${invoice.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                    {(role === "transporter" || role === "admin") && (
                      <button
                        onClick={() => setEmailModal({ invoiceId: invoice.id, clientName: invoice.client_name })}
                        disabled={!!actionLoading}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                        title="Trimite pe email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    )}
                    {role === "admin" && (
                      <>
                        <button
                          onClick={() => handleCancel(invoice.id, "cancel")}
                          disabled={!!actionLoading}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                          title="Anulează factura"
                        >
                          {actionLoading === `cancel-${invoice.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCancel(invoice.id, "reverse")}
                          disabled={!!actionLoading}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-purple-600"
                          title="Stornează factura"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
