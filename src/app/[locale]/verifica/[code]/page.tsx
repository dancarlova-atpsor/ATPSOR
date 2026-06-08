"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ShieldCheck, ShieldAlert, Loader2, ExternalLink, Building } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface VerifyResult {
  company_name: string;
  cui: string;
  certificate_number: string;
  paid_at: string;
  expires_at: string;
  status: string;
}

export default function VerificaPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const [record, setRecord] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data } = await supabase
        .from("membership_requests")
        .select("company_name, cui, certificate_number, paid_at, expires_at, status")
        .eq("verification_code", code)
        .eq("status", "paid")
        .maybeSingle();
      if (data) setRecord(data as VerifyResult);
      setLoading(false);
    }
    check();
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-red-900">Adeverință NEVALIDĂ</h1>
          <p className="mt-3 text-red-700">
            Codul <strong className="font-mono">{code}</strong> nu corespunde unei adeverințe valide emise de ATPSOR.
          </p>
          <p className="mt-2 text-sm text-red-600">
            Verifică să fi tastat corect codul. Pentru întrebări, contactați secretariatul ATPSOR.
          </p>
        </div>
      </div>
    );
  }

  const expiresDate = new Date(record.expires_at);
  const issuedDate = new Date(record.paid_at);
  const isExpired = expiresDate < new Date();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Status hero */}
      <div className={`rounded-2xl border-2 p-8 text-center ${
        isExpired
          ? "border-orange-300 bg-orange-50"
          : "border-green-300 bg-green-50"
      }`}>
        {isExpired ? (
          <>
            <ShieldAlert className="mx-auto h-16 w-16 text-orange-500" />
            <h1 className="mt-4 text-2xl font-bold text-orange-900">Adeverință EXPIRATĂ</h1>
            <p className="mt-2 text-orange-700">A expirat la {expiresDate.toLocaleDateString("ro-RO")}</p>
          </>
        ) : (
          <>
            <ShieldCheck className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-4 text-2xl font-bold text-green-900">✓ Adeverință VALIDĂ</h1>
            <p className="mt-2 text-green-700">Confirmată autentică prin sistemul ATPSOR</p>
          </>
        )}
      </div>

      {/* Detalii */}
      <div className="mt-6 rounded-xl bg-white shadow-md">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Building className="h-5 w-5 text-primary-500" />
            Detalii adeverință
          </h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500">Membru</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">{record.company_name}</div>
            {record.cui !== "PF" && (
              <div className="text-sm text-gray-500">CUI: {record.cui}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
            <div>
              <div className="text-xs uppercase text-gray-500">Nr. adeverință</div>
              <div className="mt-1 font-mono font-bold">{record.certificate_number}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Cod verificare</div>
              <div className="mt-1 font-mono font-bold">{code}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Data emiterii</div>
              <div className="mt-1 font-semibold">{issuedDate.toLocaleDateString("ro-RO")}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Valabilă până la</div>
              <div className={`mt-1 font-semibold ${isExpired ? "text-red-600" : "text-green-700"}`}>
                {expiresDate.toLocaleDateString("ro-RO")}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs uppercase text-gray-500">Emitent</div>
            <div className="mt-1 text-sm text-gray-700">
              Asociația ATPSOR — CIF 52819099<br/>
              Clinceni, Str. Sabarului 120, Jud. Ilfov
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <Link href="/" className="inline-flex items-center gap-1 text-primary-600 hover:underline">
          atpsor.ro <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
