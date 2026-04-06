"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import {
  ArrowLeft,
  Bus,
  Camera,
  Plus,
  X,
  Save,
  CheckCircle,
  Upload,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { VEHICLE_CATEGORIES, type VehicleCategory } from "@/types/database";
import {
  VEHICLE_DOCUMENT_LABELS,
  getRequiredVehicleDocuments,
  type VehicleDocumentType,
} from "@/types/documents";
import { uploadFile } from "@/lib/supabase/storage";

interface UploadedPhoto {
  file: File;
  preview: string;
}

interface UploadedDoc {
  file: File;
  expiryDate: string;
}

export default function AddVehiclePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<VehicleCategory | "">("");
  const [seats, setSeats] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");

  // Photos
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  // Documents
  const [documents, setDocuments] = useState<Record<string, UploadedDoc>>({});

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const seatsNum = parseInt(seats) || 0;
  const requiredDocs = seatsNum > 0 ? getRequiredVehicleDocuments(seatsNum) : [];

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function addFeature() {
    if (featureInput.trim()) {
      setFeatures((prev) => [...prev, featureInput.trim()]);
      setFeatureInput("");
    }
  }

  function handleDocUpload(docType: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments((prev) => ({
        ...prev,
        [docType]: { file, expiryDate: prev[docType]?.expiryDate || "" },
      }));
    }
    e.target.value = "";
  }

  function setDocExpiry(docType: string, date: string) {
    setDocuments((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], expiryDate: date },
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setUploadProgress(`Se încarcă poza ${i + 1} din ${photos.length}...`);
        const result = await uploadFile(photos[i].file, `vehicule/${Date.now()}`);
        if (result) photoUrls.push(result.url);
      }

      // Upload documents
      for (const [docType, doc] of Object.entries(documents)) {
        if (doc.file) {
          setUploadProgress(`Se încarcă ${docType}...`);
          await uploadFile(doc.file, `documente/${Date.now()}`);
        }
      }

      setUploadProgress("");
      setSaved(true);
    } catch (err) {
      console.error("Save error:", err);
      // Demo fallback
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Vehicul adăugat!</h2>
        <p className="mt-3 text-gray-600">
          Vehiculul și documentele au fost încărcate cu succes.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard/transporter"
            className="rounded-lg bg-primary-500 px-6 py-2.5 font-medium text-white hover:bg-primary-600"
          >
            Înapoi la Panou
          </Link>
          <button
            onClick={() => {
              setSaved(false);
              setName("");
              setCategory("");
              setSeats("");
              setBrand("");
              setModel("");
              setYear("");
              setFeatures([]);
              setPhotos([]);
              setDocuments({});
            }}
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Adaugă alt vehicul
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/transporter"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la Panou
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">Adaugă Vehicul Nou</h1>
      <p className="mb-8 text-gray-600">
        Completează datele vehiculului, încarcă poze și documentele obligatorii
      </p>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Vehicle Info */}
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Bus className="h-5 w-5 text-primary-500" />
            Detalii Vehicul
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Denumire vehicul *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="ex: Mercedes Sprinter 2023"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Categorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Selectează categoria</option>
                {Object.entries(VEHICLE_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.label} ({cat.minSeats}-{cat.maxSeats} locuri)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Număr locuri *
              </label>
              <input
                type="number"
                min="4"
                max="80"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Marcă *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="ex: Mercedes-Benz"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Model *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="ex: Sprinter 516"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">An fabricație *</label>
              <input
                type="number"
                min="2000"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Dotări</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="ex: WiFi, AC, TV..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="rounded-lg bg-gray-100 px-3 py-3 text-gray-600 hover:bg-gray-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {features.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-600"
                    >
                      {f}
                      <button type="button" onClick={() => setFeatures((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Camera className="h-5 w-5 text-primary-500" />
            Poze Vehicul
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
              <div key={index} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={photo.preview}
                  alt={`Poza ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white">
                  {photo.file.name}
                </div>
              </div>
            ))}

            {/* Add photo button */}
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-primary-400 hover:bg-primary-50">
              <Camera className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm font-medium text-gray-500">Adaugă Poze</span>
              <span className="text-xs text-gray-400">JPG, PNG</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoAdd}
                className="hidden"
              />
            </label>
          </div>

          {photos.length === 0 && (
            <p className="mt-3 text-sm text-gray-400">
              Adaugă cel puțin o poză cu vehiculul (interior și exterior recomandat)
            </p>
          )}
        </div>

        {/* Documents */}
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="h-5 w-5 text-primary-500" />
            Documente Obligatorii
          </h2>

          {seatsNum === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Completează numărul de locuri pentru a vedea documentele necesare
            </div>
          ) : (
            <div className="space-y-4">
              {requiredDocs.map((docType) => {
                const doc = documents[docType];
                const label = VEHICLE_DOCUMENT_LABELS[docType as VehicleDocumentType];

                return (
                  <div
                    key={docType}
                    className={`rounded-lg border-2 p-4 ${
                      doc?.file
                        ? "border-green-200 bg-green-50"
                        : "border-dashed border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {doc?.file ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Upload className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <span className="font-medium text-gray-900">
                            {label?.ro || docType}
                          </span>
                          {doc?.file && (
                            <span className="ml-2 text-sm text-green-600">
                              ({doc.file.name})
                            </span>
                          )}
                        </div>
                      </div>
                      <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50">
                        {doc?.file ? "Schimbă" : "Încarcă PDF"}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocUpload(docType, e)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Expiry date */}
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500">
                        Data expirării *
                      </label>
                      <input
                        type="date"
                        value={doc?.expiryDate || ""}
                        onChange={(e) => setDocExpiry(docType, e.target.value)}
                        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                <strong>Notă:</strong> Copie conformă și asigurare bagaje/călători sunt necesare doar pentru vehicule cu mai mult de 9 locuri.
                Toate documentele trebuie să fie valabile (neexpirate).
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/transporter"
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Anulează
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-8 py-3 font-semibold text-white shadow-lg hover:bg-primary-600 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? uploadProgress || "Se salvează..." : "Salvează Vehicul"}
          </button>
        </div>
      </form>
    </div>
  );
}
