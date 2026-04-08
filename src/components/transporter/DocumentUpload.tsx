"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/client";

interface DocumentUploadProps {
  // For company docs
  companyId: string;
  // For vehicle docs
  vehicleId?: string;
  documentType: string;
  label: string;
  existingDoc?: {
    id: string;
    file_url: string;
    expiry_date: string;
    is_verified: boolean;
  } | null;
  onUploaded?: () => void;
}

export function DocumentUpload({
  companyId,
  vehicleId,
  documentType,
  label,
  existingDoc,
  onUploaded,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [expiryDate, setExpiryDate] = useState(existingDoc?.expiry_date || "");
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const isValid = existingDoc && existingDoc.expiry_date >= today;

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !expiryDate) return;

    setUploading(true);
    try {
      const folder = vehicleId ? `vehicles/${vehicleId}` : `companies/${companyId}`;
      const result = await uploadFile(file, folder);
      if (!result) {
        alert("Eroare la încărcare. Încearcă din nou.");
        setUploading(false);
        return;
      }

      const supabase = createClient();

      if (vehicleId) {
        // Vehicle document
        if (existingDoc) {
          await supabase
            .from("vehicle_documents")
            .update({
              file_url: result.url,
              expiry_date: expiryDate,
              is_verified: false,
            })
            .eq("id", existingDoc.id);
        } else {
          await supabase.from("vehicle_documents").insert({
            vehicle_id: vehicleId,
            company_id: companyId,
            document_type: documentType,
            file_url: result.url,
            expiry_date: expiryDate,
          });
        }
      } else {
        // Company document
        if (existingDoc) {
          await supabase
            .from("company_documents")
            .update({
              file_url: result.url,
              expiry_date: expiryDate,
              is_verified: false,
            })
            .eq("id", existingDoc.id);
        } else {
          await supabase.from("company_documents").insert({
            company_id: companyId,
            document_type: documentType,
            file_url: result.url,
            expiry_date: expiryDate,
          });
        }
      }

      setShowForm(false);
      onUploaded?.();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Eroare la salvare document.");
    }
    setUploading(false);
  }

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        isValid
          ? "border-green-200 bg-green-50"
          : "border-dashed border-gray-300 bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <Upload className="h-3 w-3" />
          {isValid ? "Actualizează" : "Încarcă"}
        </button>
      </div>

      {isValid && !showForm && (
        <div className="mt-2 text-xs text-green-600">
          Valabil până la: {existingDoc!.expiry_date}
          {existingDoc!.is_verified && (
            <span className="ml-2 font-medium">✓ Verificat</span>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-3 space-y-3 rounded-lg bg-white p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Fișier (PDF, JPG, PNG) *
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-600 hover:file:bg-primary-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Data expirării *
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={today}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? "Se încarcă..." : "Salvează"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Anulează
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
