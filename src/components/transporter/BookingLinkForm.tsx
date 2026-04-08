"use client";

import { useState } from "react";
import { Link2, Copy, Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface BookingLinkFormProps {
  vehicleId: string;
  companyId: string;
  vehicleName: string;
}

export default function BookingLinkForm({
  vehicleId,
  companyId,
  vehicleName,
}: BookingLinkFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pickupCity, setPickupCity] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [totalPrice, setTotalPrice] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedLink(null);

    try {
      const res = await fetch("/api/booking-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          companyId,
          pickupCity,
          dropoffCity,
          departureDate,
          returnDate: returnDate || null,
          passengers: parseInt(passengers) || 1,
          totalPrice: parseFloat(totalPrice),
          description: description || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Eroare la generarea linkului");
        return;
      }

      setGeneratedLink(data.url);
    } catch {
      setError("Eroare de conexiune");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = generatedLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setPickupCity("");
    setDropoffCity("");
    setDepartureDate("");
    setReturnDate("");
    setPassengers("1");
    setTotalPrice("");
    setDescription("");
    setError(null);
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setGeneratedLink(null);
            setError(null);
          }
        }}
        className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        <Link2 className="w-4 h-4" />
        Generează Link Rezervare
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Link direct de plată — {vehicleName}
          </h4>

          {!generatedLink ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Oraș plecare *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    placeholder="Ex: București"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Oraș destinație *
                  </label>
                  <input
                    type="text"
                    required
                    value={dropoffCity}
                    onChange={(e) => setDropoffCity(e.target.value)}
                    placeholder="Ex: Cluj-Napoca"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Data plecare *
                  </label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Data întoarcere
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departureDate || new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Pasageri *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="80"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preț total (RON) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    placeholder="Ex: 2500"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Descriere traseu
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Transport grup 20 persoane, București - Cluj cu oprire la Sibiu"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Se generează...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Generează Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Link generat cu succes!
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 bg-white rounded-lg border border-green-300 px-3 py-2 text-sm text-gray-700 outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiat!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiază
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Trimite acest link clientului. Linkul expiră în 7 zile.
                </p>
              </div>

              <button
                onClick={resetForm}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Generează alt link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
