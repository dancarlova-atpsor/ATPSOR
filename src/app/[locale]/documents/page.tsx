"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, FileText, Download, Shield, Scale } from "lucide-react";

const STATUTE_FILES = [
  { name: "Certificat Înregistrare Fiscală (CIF)", file: "CamScanner 11.03.2026 22.33.pdf" },
  { name: "Statut - Pagina 1 (Scopul și Obiectivele)", file: "CamScanner 11.03.2026 22.35 (1).pdf" },
  { name: "Statut - Pagina 2 (Obiective continuare)", file: "CamScanner 11.03.2026 22.35 (2).pdf" },
  { name: "Statut - Pagina 3 (Membri Fondatori)", file: "CamScanner 11.03.2026 22.35.pdf" },
  { name: "Statut - Pagina 4 (Denumire, Sediu, Durată)", file: "CamScanner 11.03.2026 22.36 (2).pdf" },
  { name: "Statut - Pagina 5 (Patrimoniu, Adunare Generală)", file: "CamScanner 11.03.2026 22.36.pdf" },
  { name: "Statut - Pagina 6 (Consiliul Director)", file: "CamScanner 11.03.2026 22.36 (1).pdf" },
  { name: "Statut - Pagina 7 (Membrii Consiliului Director)", file: "CamScanner 11.03.2026 22.37 (2).pdf" },
  { name: "Statut - Pagina 8 (Vicepreședinți, Secretar General)", file: "CamScanner 11.03.2026 22.37.pdf" },
  { name: "Statut - Pagina 9 (Control Gestiune, Calitate Membru)", file: "CamScanner 11.03.2026 22.37 (1).pdf" },
  { name: "Statut - Pagina 10 (Drepturi, Obligații, Resurse)", file: "CamScanner 11.03.2026 22.38.pdf" },
  { name: "Statut - Pagina 11 (Dizolvare, Dispoziții Finale)", file: "CamScanner 11.03.2026 22.38 (1).pdf" },
  { name: "Statut - Pagina 12 (Semnături Membri Fondatori)", file: "CamScanner 11.03.2026 22.39.pdf" },
];

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Înapoi
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">Documente ATPSOR</h1>
      <p className="mb-8 text-gray-600">
        Statutul asociației, contracte și documente oficiale
      </p>

      {/* Association Info */}
      <div className="mb-8 rounded-xl bg-primary-50 p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary-700">
          <Shield className="h-5 w-5" />
          Date Asociație
        </h2>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div><span className="text-gray-500">Denumire:</span> <strong>Asociația Transportatorilor de Persoane prin Serviciu Ocazional</strong></div>
          <div><span className="text-gray-500">CIF:</span> <strong>52819099</strong></div>
          <div><span className="text-gray-500">Sediu:</span> Com. Clinceni, Str. Săbarului, Nr. 120, Jud. Ilfov</div>
          <div><span className="text-gray-500">Președinte:</span> <strong>Laudat Daniel</strong></div>
          <div><span className="text-gray-500">Bancă:</span> CEC Bank SA, Suc. Drumul Taberei</div>
          <div><span className="text-gray-500">IBAN:</span> <strong>RO58CECEB00030RON3979534</strong></div>
        </div>
      </div>

      {/* Contract Comision */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
          <Scale className="h-5 w-5 text-primary-500" />
          Contract de Intermediere
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Contract de Intermediere Transport</h3>
              <p className="mt-1 text-sm text-gray-500">
                Contract între ATPSOR și transportator - comision 5%, facturare automată, Stripe Connect
              </p>
            </div>
            <Link href="/contract-comision"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600">
              <FileText className="h-4 w-4" />
              Vizualizează
            </Link>
          </div>
        </div>
      </div>

      {/* Statut */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
          <FileText className="h-5 w-5 text-primary-500" />
          Statutul Asociației
        </h2>
        <div className="space-y-3">
          {STATUTE_FILES.map((doc, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-500">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-gray-700">{doc.name}</span>
              </div>
              <a href={`/documents/${encodeURIComponent(doc.file)}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                <Download className="h-3.5 w-3.5" />
                Descarcă
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
