"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2, FileSignature } from "lucide-react";

interface BookingData {
  id: string;
  total_price: number;
  currency: string;
  created_at: string;
  notes: string | null;
  // Date contract direct pe booking
  pickup_city: string | null;
  dropoff_city: string | null;
  departure_date: string | null;
  return_date: string | null;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  company: { name: string; cui: string; address: string; city: string; county: string } | null;
  vehicle: { name: string; seats: number } | null;
  offer: {
    request: { pickup_city: string; dropoff_city: string; departure_date: string; return_date: string | null } | null;
    vehicle: { name: string; seats: number } | null;
  } | null;
}

export default function ContractPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/booking/contract?id=${bookingId}`);
        if (!res.ok) { setLoading(false); return; }
        const { booking: data } = await res.json();
        setBooking(data as BookingData | null);
      } catch {
        setBooking(null);
      }
      setLoading(false);
    }
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Contract negasit</h1>
      </div>
    );
  }

  // Parse client info - prioritate coloane direct pe booking, fallback notes
  const notesParts = (booking.notes || "").split(" | ");
  const clientName = booking.client_name || notesParts[1] || "Client";
  const clientEmail = booking.client_email || notesParts[2] || "";
  const clientAddress = booking.client_address || "";

  // Date ruta - prioritate coloane direct pe booking, fallback la offer.request
  const pickupCity = booking.pickup_city || booking.offer?.request?.pickup_city || "";
  const dropoffCity = booking.dropoff_city || booking.offer?.request?.dropoff_city || "";
  const route = pickupCity && dropoffCity ? `${pickupCity} → ${dropoffCity}` : "Transport";
  const departureDate = booking.departure_date || booking.offer?.request?.departure_date || "";
  const returnDate = booking.return_date || booking.offer?.request?.return_date;

  // Vehicul - prioritate direct pe booking, fallback la offer.vehicle
  const vehicleName = booking.vehicle?.name || booking.offer?.vehicle?.name;
  const vehicleSeats = booking.vehicle?.seats || booking.offer?.vehicle?.seats;
  const created = new Date(booking.created_at);
  const acceptDate = created.toLocaleDateString("ro-RO");
  const acceptTime = created.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white">
      {/* Print button - hidden when printing */}
      <div className="bg-gray-50 border-b border-gray-200 py-3 px-4 print:hidden">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <span className="text-sm text-gray-500">Contract de transport — pagina imprimabila</span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Printer className="h-4 w-4" />
            Tipareste / Salveaza PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 print:py-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <FileSignature className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">CONTRACT DE TRANSPORT OCAZIONAL DE PERSOANE</h1>
          </div>
          <p className="text-sm text-gray-500">Nr. {booking.id.substring(0, 8).toUpperCase()} / {acceptDate}</p>
        </div>

        {/* I. Partile */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">I. PARTILE CONTRACTANTE</h2>
          <p className="text-sm text-gray-700 mb-3">
            <strong>1.1. Prestator:</strong> <strong>{booking.company?.name}</strong>,
            cu sediul in {booking.company?.address || "—"}, {booking.company?.city || ""}, {booking.company?.county || ""},
            CUI {booking.company?.cui || "—"}, denumit in continuare "Transportatorul".
          </p>
          <p className="text-sm text-gray-700">
            <strong>1.2. Beneficiar:</strong> <strong>{clientName}</strong>,
            denumit in continuare "Clientul".
          </p>
        </section>

        {/* II. Obiectul */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">II. OBIECTUL CONTRACTULUI</h2>
          <p className="text-sm text-gray-700">
            Transportatorul se obliga sa presteze servicii de transport ocazional de persoane pentru Client,
            conform datelor specificate mai jos:
          </p>
          <table className="w-full mt-3 text-sm border border-gray-200">
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2 bg-gray-50 font-medium w-1/3">Traseu:</td>
                <td className="px-3 py-2 font-bold">{route}</td>
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 bg-gray-50 font-medium">Data plecarii:</td>
                <td className="px-3 py-2 font-bold">{departureDate}</td>
              </tr>
              {returnDate && (
                <tr className="border-b">
                  <td className="px-3 py-2 bg-gray-50 font-medium">Data intoarcerii:</td>
                  <td className="px-3 py-2 font-bold">{returnDate}</td>
                </tr>
              )}
              {vehicleName && (
                <tr className="border-b">
                  <td className="px-3 py-2 bg-gray-50 font-medium">Vehicul:</td>
                  <td className="px-3 py-2 font-bold">{vehicleName}{vehicleSeats ? `, ${vehicleSeats} locuri` : ""}</td>
                </tr>
              )}
              <tr>
                <td className="px-3 py-2 bg-gray-50 font-medium">Valoare totala:</td>
                <td className="px-3 py-2 font-bold text-primary-600">
                  {Number(booking.total_price).toFixed(2)} {(booking.currency || "RON").toUpperCase()} (TVA inclus)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* III. Obligatiile transportatorului */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">III. OBLIGATIILE TRANSPORTATORULUI</h2>
          <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
            <li>Sa presteze serviciul de transport in conditiile agreate (data, traseu, vehicul)</li>
            <li>Sa detina toate licentele si documentele necesare in vigoare</li>
            <li>Sa asigure starea tehnica corespunzatoare a vehiculului</li>
            <li>Sa respecte timpii de odihna ai conducatorului auto conform legislatiei</li>
            <li>Sa asigure pasagerii si bagajele conform contractului de asigurare RCA si CASCO</li>
          </ul>
        </section>

        {/* IV. Obligatiile clientului */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">IV. OBLIGATIILE CLIENTULUI</h2>
          <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
            <li>Sa achite integral valoarea contractului prin platforma ATPSOR</li>
            <li>Sa respecte programul stabilit de transport</li>
            <li>Sa nu transporte bagaje sau substante interzise prin lege</li>
            <li>Sa respecte regulile de comportament in vehicul</li>
          </ul>
        </section>

        {/* V. Plata */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">V. PLATA SI FACTURARE</h2>
          <p className="text-sm text-gray-700">
            Plata se efectueaza prin platforma ATPSOR (atpsor.ro), prin card bancar (procesat securizat de Stripe)
            sau prin transfer bancar in contul ATPSOR (RO58 CECE B000 30RO N397 9534, CEC Bank).
            Factura fiscala se emite automat de Transportator prin SmartBill si se transmite Clientului pe email.
          </p>
        </section>

        {/* VI. Anulare */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">VI. ANULARE SI MODIFICARE</h2>
          <p className="text-sm text-gray-700">
            In caz de anulare a transportului din partea Clientului, se vor aplica conditiile stabilite de Transportator.
            Modificarile contractului se fac prin acord intre parti, prin email sau platforma ATPSOR.
          </p>
        </section>

        {/* VII. Dispozitii finale */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">VII. DISPOZITII FINALE</h2>
          <p className="text-sm text-gray-700">
            Prezentul contract este reglementat de legislatia romana. Litigiile se solutioneaza pe cale amiabila,
            iar in caz de neintelegere, de instantele judecatoresti competente.
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Acceptarea contractului prin platforma ATPSOR are aceeasi valoare juridica ca semnatura olografa,
            conform Legii nr. 455/2001 privind semnatura electronica.
          </p>
        </section>

        {/* Semnatura electronica */}
        <div className="mt-10 border-t-2 border-primary-500 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-bold text-blue-900 mb-1">Semnatura electronica</p>
            <p className="text-sm text-blue-800 italic">
              Semnat electronic prin citire si acceptare pe platforma ATPSOR.
            </p>
            <p className="text-sm text-blue-800 mt-1">
              Data acceptarii: <strong>{acceptDate}, {acceptTime}</strong>
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Referinta: ATPSOR-{booking.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          Document generat automat de platforma ATPSOR — atpsor.ro
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
