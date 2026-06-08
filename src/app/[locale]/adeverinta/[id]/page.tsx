"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2, ShieldCheck, Calendar, Building, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MembershipRecord {
  id: string;
  company_name: string;
  cui: string;
  company_address: string | null;
  company_city: string | null;
  company_county: string | null;
  admin_name: string;
  amount: number;
  currency: string;
  payment_reference: string;
  paid_at: string;
  expires_at: string;
  certificate_number: string;
  verification_code: string;
  status: string;
}

export default function AdeverintaPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<MembershipRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      const supabase = createClient();
      const { data } = await supabase
        .from("membership_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (data && data.status === "paid" && data.certificate_number) {
        setRecord(data as MembershipRecord);
      }
      setLoading(false);
    }
    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Adeverință negăsită</h1>
        <p className="mt-3 text-gray-500">Această adeverință nu există sau cotizația nu a fost încă confirmată.</p>
      </div>
    );
  }

  const issuedDate = new Date(record.paid_at);
  const expiresDate = new Date(record.expires_at);
  const isExpired = expiresDate < new Date();

  return (
    <div className="bg-white">
      {/* Print button — hidden in print */}
      <div className="bg-gray-50 border-b border-gray-200 py-3 px-4 print:hidden">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span className="text-sm text-gray-500">Adeverință de membru ATPSOR</span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Printer className="h-4 w-4" />
            Tipărește / Salvează PDF
          </button>
        </div>
      </div>

      {/* Adeverință */}
      <div className="mx-auto max-w-3xl px-8 py-12 print:py-6 font-serif text-gray-900">
        {/* Header cu logo + denumire */}
        <div className="border-b-4 border-double border-gray-800 pb-4 text-center">
          <div className="text-xs uppercase tracking-widest text-gray-500">Asociație înregistrată</div>
          <h1 className="mt-2 text-2xl font-bold tracking-wide">ASOCIAȚIA ATPSOR</h1>
          <div className="text-sm font-medium text-gray-700">
            Asociația Transportatorilor de Persoane prin Serviciul Ocazional din România
          </div>
          <div className="mt-2 text-xs text-gray-600">
            CIF 52819099 · Comuna Clinceni, Str. Sabarului 120, Județ Ilfov
          </div>
        </div>

        {/* Status expirat */}
        {isExpired && (
          <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-3 text-center text-sm font-semibold text-red-700 print:hidden">
            ⚠ Această adeverință a EXPIRAT la {expiresDate.toLocaleDateString("ro-RO")}
          </div>
        )}

        {/* Title */}
        <div className="mt-10 text-center">
          <h2 className="text-3xl font-bold uppercase tracking-wide">Adeverință de Membru</h2>
          <div className="mt-3 inline-block rounded-full bg-amber-100 border-2 border-amber-300 px-6 py-1.5 font-mono text-lg font-bold text-amber-900">
            Nr. {record.certificate_number}
          </div>
        </div>

        {/* Body */}
        <div className="mt-12 space-y-6 text-base leading-relaxed">
          <p className="text-justify">
            Prin prezenta se atestă că <strong className="uppercase text-lg">{record.company_name}</strong>
            {record.cui !== "PF" ? <>, având CUI <strong>{record.cui}</strong></> : <> (persoană fizică)</>},
            {record.company_address && <> cu sediul în <strong>{record.company_address}</strong>,</>}
            {record.company_city && record.company_county && (
              <> situată în <strong>{record.company_city}, județul {record.company_county}</strong>,</>
            )}
            {" "}reprezentată prin <strong>{record.admin_name}</strong>,
            este <strong>MEMBRU ACTIV</strong> al Asociației Transportatorilor de Persoane prin
            Serviciul Ocazional din România (ATPSOR).
          </p>

          {/* Detalii */}
          <table className="w-full border-2 border-gray-300 text-sm">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 p-3 font-semibold text-gray-700 w-1/2">Perioada de valabilitate</td>
                <td className="p-3"><strong>{issuedDate.toLocaleDateString("ro-RO")} – {expiresDate.toLocaleDateString("ro-RO")}</strong></td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 p-3 font-semibold text-gray-700">Cotizația anuală achitată</td>
                <td className="p-3">{Number(record.amount).toFixed(0)} {record.currency}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 p-3 font-semibold text-gray-700">Referința de plată</td>
                <td className="p-3 font-mono text-xs">{record.payment_reference}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 p-3 font-semibold text-gray-700">Status</td>
                <td className="p-3">
                  {isExpired ? (
                    <span className="font-bold text-red-600">EXPIRATĂ</span>
                  ) : (
                    <span className="font-bold text-green-700">ACTIVĂ</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-justify text-sm text-gray-700">
            Calitatea de membru conferă drepturile și obligațiile prevăzute în Statutul Asociației
            ATPSOR, inclusiv reprezentarea în fața autorităților, accesul la platforma online de
            transport ocazional, consultanță juridică și participarea la activitățile asociației.
          </p>

          <p className="text-justify text-sm text-gray-600 italic">
            Prezenta adeverință se eliberează la cererea persoanei interesate, pentru a-i servi acolo
            unde va avea nevoie.
          </p>
        </div>

        {/* Semnături */}
        <div className="mt-16 grid grid-cols-2 gap-12">
          <div className="text-center">
            <div className="font-semibold">Președinte ATPSOR</div>
            <div className="mt-12 border-t-2 border-gray-400 pt-1 text-sm">
              Dan Cîrlova
            </div>
            <div className="text-xs text-gray-500">Semnătură și ștampilă</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Secretar ATPSOR</div>
            <div className="mt-12 border-t-2 border-gray-400 pt-1 text-sm">
              George Ciutacu
            </div>
            <div className="text-xs text-gray-500">Semnătură</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-400 pt-4 text-center">
          <div className="text-xs text-gray-500">
            Adeverință eliberată la data de <strong>{issuedDate.toLocaleDateString("ro-RO")}</strong>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Verificare autenticitate:{" "}
            <strong className="font-mono">atpsor.ro/verifica/{record.verification_code}</strong>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Document generat electronic prin platforma atpsor.ro · Valabil fără ștampilă fizică
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
