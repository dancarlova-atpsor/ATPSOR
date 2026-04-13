"use client";

import { Link } from "@/i18n/routing";
import { FileSignature, ExternalLink, Shield } from "lucide-react";

interface ContractPreviewProps {
  transporterName: string;
  transporterCui?: string;
  clientName: string;
  route: string;
  departureDate: string;
  returnDate?: string | null;
  vehicleName?: string;
  vehicleSeats?: number;
  totalPrice: number;
  contractUrl?: string | null;
  contractName?: string | null;
  accepted: boolean;
  onToggle: () => void;
}

export default function ContractPreview({
  transporterName,
  transporterCui,
  clientName,
  route,
  departureDate,
  returnDate,
  vehicleName,
  vehicleSeats,
  totalPrice,
  contractUrl,
  contractName,
  accepted,
  onToggle,
}: ContractPreviewProps) {
  const now = new Date();
  const acceptDate = now.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const acceptTime = now.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Contract header */}
      <div className="bg-gray-800 px-6 py-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <FileSignature className="h-5 w-5" />
          Contract de Transport Ocazional
        </h3>
      </div>

      {/* Contract body - auto-completed */}
      <div className="px-6 py-5 text-sm text-gray-700 space-y-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
          <p className="font-semibold text-blue-900">CONTRACT DE TRANSPORT OCAZIONAL DE PERSOANE</p>
          <div className="space-y-1">
            <p><strong>Prestator:</strong> {transporterName}{transporterCui ? ` (CUI: ${transporterCui})` : ""}</p>
            <p><strong>Beneficiar:</strong> {clientName || "—"}</p>
            <p><strong>Traseu:</strong> {route}</p>
            <p><strong>Data transport:</strong> {departureDate}{returnDate ? ` → ${returnDate}` : ""}</p>
            {vehicleName && <p><strong>Vehicul:</strong> {vehicleName}{vehicleSeats ? `, ${vehicleSeats} locuri` : ""}</p>}
            <p><strong>Valoare totala:</strong> {totalPrice.toLocaleString("ro-RO")} RON (TVA inclus)</p>
          </div>
        </div>

        {/* Link to transporter's contract template */}
        {contractUrl && (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">{contractName || "Contract transportator (PDF)"}</span>
            </div>
            <a
              href={contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Vizualizeaza
            </a>
          </div>
        )}

        {/* Electronic signature */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 italic">
          <p className="font-medium text-gray-700 not-italic">Semnatura electronica</p>
          <p className="mt-1">
            Semnat electronic prin citire si acceptare pe platforma ATPSOR.
            {accepted && ` Data acceptarii: ${acceptDate}, ${acceptTime}.`}
          </p>
        </div>
      </div>

      {/* Acceptance checkbox */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={onToggle}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
          />
          <span className="text-sm text-gray-700">
            Am citit si accept <strong>contractul de transport</strong> al {transporterName} si{" "}
            <Link href="/terms" target="_blank" className="text-primary-500 underline hover:text-primary-600">
              Termenii si Conditiile ATPSOR
            </Link>
          </span>
        </label>
      </div>
    </div>
  );
}
