"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2 } from "lucide-react";

interface BookingData {
  id: string;
  total_price: number;
  currency: string;
  created_at: string;
  notes: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  departure_date: string | null;
  return_date: string | null;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  company: { name: string; cui: string; address: string; city: string; county: string } | null;
  vehicle: { name: string; seats: number; category?: string } | null;
  offer: {
    request: { pickup_city: string; dropoff_city: string; departure_date: string; return_date: string | null } | null;
    vehicle: { name: string; seats: number; category?: string } | null;
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
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  if (!booking) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Contract negasit</h1></div>;
  }

  const notesParts = (booking.notes || "").split(" | ");
  const clientName = booking.client_name || notesParts[1] || "_______________________";
  const clientEmail = booking.client_email || notesParts[2] || "";
  const clientAddress = booking.client_address || "";

  const pickupCity = booking.pickup_city || booking.offer?.request?.pickup_city || "";
  const dropoffCity = booking.dropoff_city || booking.offer?.request?.dropoff_city || "";
  const route = pickupCity && dropoffCity ? `${pickupCity} → ${dropoffCity}` : "_______________";
  const departureDate = booking.departure_date || booking.offer?.request?.departure_date || "__________";
  const returnDate = booking.return_date || booking.offer?.request?.return_date;

  const vehicleName = booking.vehicle?.name || booking.offer?.vehicle?.name || "";
  const vehicleSeats = booking.vehicle?.seats || booking.offer?.vehicle?.seats || 0;
  const vehicleCategory = booking.vehicle?.category || booking.offer?.vehicle?.category || "";

  const isAutocar = vehicleCategory.includes("autocar");
  const isMicrobuz = vehicleCategory.includes("microbuz");
  const isMinibus = vehicleCategory.includes("midi");

  const created = new Date(booking.created_at);
  const contractNr = booking.id.substring(0, 8).toUpperCase();
  const contractDate = created.toLocaleDateString("ro-RO");
  const acceptTime = created.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const totalFormatted = Number(booking.total_price).toFixed(2);

  // Estimated KM (200 km/zi minimum * nr zile)
  const nrZile = returnDate ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000*60*60*24)) + 1) : 1;
  const kmEstimati = nrZile * 200;

  return (
    <div className="bg-white">
      {/* Print button - hidden when printing */}
      <div className="bg-gray-50 border-b border-gray-200 py-3 px-4 print:hidden">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
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

      <div className="mx-auto max-w-4xl px-8 py-10 print:py-4 text-[11pt] text-gray-900 font-serif">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-2 mb-4 text-xs">
          <strong>LUXURIA TRANS &amp; TRAVEL S.R.L.</strong> | Contract de Punere la Dispoziție a Serviciilor de Transport
        </div>

        <h1 className="text-xl font-bold text-center mb-1">CONTRACT DE PUNERE LA DISPOZIȚIE A SERVICIILOR DE TRANSPORT</h1>
        <p className="text-center text-sm mb-6">Nr. <strong>{contractNr}</strong> din <strong>{contractDate}</strong></p>

        {/* I. Partile */}
        <h2 className="text-base font-bold mb-2">I. PĂRȚILE CONTRACTANTE</h2>
        <p className="text-sm mb-4 text-justify">
          <strong>LUXURIA TRANS &amp; TRAVEL S.R.L.</strong>, societate cu răspundere limitată, de naționalitate română,
          cu sediul social în Oraș Bragadiru, Strada Epocii, nr. 3B, Lot 3, Parter, Camera 3, Județ Ilfov,
          înregistrată la Registrul Comerțului sub nr. J23/595/2013, C.U.I. RO31261740, tel: 031-419-00-21,
          urgențe: 0734 489 107, e-mail: rezervari@luxuriatravel.ro,
          cont RO43BTRLRONCRT0209789901 deschis la Banca Transilvania — Ag. Rahova,
          reprezentată legal prin Administrator Cîrlova-Țone Cristina-Mădălina, denumită în continuare <strong>TRANSPORTATOR</strong>, și:
        </p>

        <table className="w-full border border-gray-400 mb-4 text-sm">
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold w-40">Denumire / Nume</td>
              <td className="p-2 font-bold">{clientName}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold">Sediu / Domiciliu</td>
              <td className="p-2">{clientAddress || "_____________________________________"}</td>
            </tr>
            <tr>
              <td className="p-2 bg-gray-100 font-semibold">Email / Contact</td>
              <td className="p-2">Email: {clientEmail || "_____________"}</td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm mb-4">denumit/ă în continuare <strong>BENEFICIAR</strong>.</p>

        {/* II. Obiectul */}
        <h2 className="text-base font-bold mb-2">II. OBIECTUL CONTRACTULUI</h2>
        <p className="text-sm mb-3 text-justify">
          Punerea la dispoziție de către TRANSPORTATOR a serviciilor de transport efectuate cu echipaj,
          și utilizarea de către BENEFICIAR a mijlocului de transport închiriat.
        </p>

        <table className="w-full border border-gray-400 mb-4 text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th colSpan={2} className="p-2 text-left">CARACTERISTICILE VOIAJULUI</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold w-44">Plecare din / ora</td>
              <td className="p-2"><strong>{pickupCity || "_____________"}</strong>, ora: __________</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold">Destinație / Retur</td>
              <td className="p-2">Destinație: <strong>{dropoffCity || "_____________"}</strong> | Retur la ora: __________ de la: {dropoffCity}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold">Data / Zilele</td>
              <td className="p-2">
                <strong>{departureDate}</strong>{returnDate ? <> → <strong>{returnDate}</strong></> : ""} | Ruta: <strong>{route}</strong>
              </td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold">Km maximi contractați</td>
              <td className="p-2">Max. <strong>{kmEstimati}</strong> km (km suplimentari: 10 lei/km + TVA)</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold">Tip cursă</td>
              <td className="p-2">☒ Intern &nbsp; ☐ Extern &nbsp; ☐ La dispoziție</td>
            </tr>
            <tr className="bg-gray-800 text-white">
              <th colSpan={2} className="p-2 text-left">VEHICUL</th>
            </tr>
            <tr>
              <td className="p-2 bg-gray-100 font-semibold">Tipul vehiculului</td>
              <td className="p-2">
                {isAutocar ? "☒" : "☐"} Autocar &nbsp;
                {isMicrobuz ? "☒" : "☐"} Microbuz &nbsp;
                {isMinibus ? "☒" : "☐"} Minibus —
                Nr. locuri: <strong>{vehicleSeats || "___"}</strong>
                {vehicleName && <> | <strong>{vehicleName}</strong></>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* III. Obligatiile */}
        <h2 className="text-base font-bold mb-2">III. OBLIGAȚIILE PĂRȚILOR CONTRACTANTE</h2>

        <p className="text-sm font-semibold mb-1">A. TRANSPORTATORUL se obligă:</p>
        <ol className="text-sm list-decimal pl-5 mb-3 space-y-1">
          <li>Să pună la dispoziție mijlocul de transport corespunzător tehnic, la datele și orele stabilite. În caz de imposibilitate, asigură autocar similar sau superior.</li>
          <li>Să asigure personal profesionist cu toate atestatele legale, conform OG 27/2011 și Regulamentului (CE) nr. 1071/2009.</li>
          <li>Să pună la dispoziția conducătorilor auto toate documentele de transport necesare conform normelor legale în vigoare.</li>
          <li>Să asigure mijlocul de transport și pasagerii pe toată durata deplasării.</li>
          <li>Să suporte costurile de combustibil, diurnele și vizele conducătorilor auto. Taxele de drum și vignetele sunt suportate de: TRANSPORTATOR.</li>
          <li>Să remedieze defecțiunile apărute pe parcurs, inclusiv prin înlocuirea autocarului cu un vehicul de aceeași categorie sau superioară, fără costuri suplimentare.</li>
          <li>Să obțină și să achite licențele de execuție ARR pentru autocarul contractat pe toată durata contractului.</li>
          <li>Să asigure siguranța și integritatea bagajelor încredințate pe întreaga durată a transportului.</li>
          <li>Să utilizeze numărul de șoferi necesar respectării prevederilor legale privind timpii de conducere și odihnă.</li>
        </ol>

        <p className="text-sm font-semibold mb-1">B. BENEFICIARUL se obligă:</p>
        <ol className="text-sm list-decimal pl-5 mb-4 space-y-1">
          <li>Să păstreze în bună regulă mijlocul de transport. Daunele produse autocarului se suportă conform notei constatatoare.</li>
          <li>Să furnizeze programul pe rute omologate (max. 5 zile înainte) și lista turiștilor (max. 2 zile înainte de plecare).</li>
          <li>Să asigure personal însoțitor calificat ca intermediar între turiști și conducătorii auto, pentru a evita distragerea atenției acestora.</li>
          <li>Să organizeze programul astfel încât să respecte timpii de repaus ai conducătorilor auto conform legislației în vigoare.</li>
          <li>Să informeze turiștii că în mijloacele de transport nu se fumează, nu se mănâncă și nu se consumă băuturi alcoolice (conform Anexei 1).</li>
          <li>Să asigure cazarea șoferilor în camere similare cu ale turiștilor și masa acestora (3 mese/zi) pe durata cursei.</li>
          <li>Să plătească contravaloarea serviciilor pe baza documentelor semnate de conducătorul grupului și conducătorul auto.</li>
          <li>Să plătească diferența de km la tariful de 10 lei/km + TVA, la sfârșitul cursei. Să suporte parcările, podurile, taxele vamale și intrările în orașe.</li>
        </ol>

        {/* IV. Valoare */}
        <h2 className="text-base font-bold mb-2">IV. VALOARE, CONDIȚII ȘI MODALITĂȚI DE PLATĂ</h2>
        <table className="w-full border border-gray-400 mb-4 text-sm">
          <tbody>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold w-44">Valoarea serviciilor</td>
              <td className="p-2"><strong>{totalFormatted}</strong> lei — TVA inclus</td>
            </tr>
            <tr className="border-b border-gray-400">
              <td className="p-2 bg-gray-100 font-semibold">Avans</td>
              <td className="p-2">Achitat integral la semnarea contractului (prin platforma ATPSOR)</td>
            </tr>
            <tr>
              <td className="p-2 bg-gray-100 font-semibold">Modalitate plată</td>
              <td className="p-2">☒ Card bancar (Stripe) / Virament IBAN RO58 CECE B000 30RO N397 9534 (CEC Bank — ATPSOR)</td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm mb-4 text-justify italic">
          Dacă din motive independente de transportator programul turistic nu poate fi dus la bun sfârșit, banii nu vor fi restituiți BENEFICIARULUI.
        </p>

        {/* V. Sanctiuni */}
        <h2 className="text-base font-bold mb-2">V. SANCȚIUNI</h2>
        <ol className="text-sm list-decimal pl-5 mb-4 space-y-1">
          <li>Pentru nerespectarea termenelor de plată, BENEFICIARUL va plăti penalități de 1%/zi din valoarea facturii, începând cu data scadenței.</li>
          <li>Decomandarea cu mai puțin de 15 zile atrage penalizări de 50% din valoarea totală a transportului.</li>
        </ol>

        {/* VI-X Short */}
        <h2 className="text-base font-bold mb-2">VI. CLAUZE DE VALIDITATE</h2>
        <p className="text-sm mb-3 text-justify">Rezilierea totală sau parțială a clauzelor contractului nu are niciun efect asupra obligațiilor deja scadente. Răspunderea părții vinovate de încetarea contractului nu este înlăturată.</p>

        <h2 className="text-base font-bold mb-2">VII. FORȚA MAJORĂ</h2>
        <p className="text-sm mb-3 text-justify">Forța majoră constatată potrivit legii apără de răspundere partea care o invocă, cu obligația notificării în 48 de ore și limitării consecințelor. Dacă evenimentul nu încetează în 30 de zile, oricare parte poate notifica încetarea contractului fără daune-interese.</p>

        <h2 className="text-base font-bold mb-2">VIII. LITIGII</h2>
        <p className="text-sm mb-3 text-justify">Litigiile se rezolvă pe cale amiabilă. În caz de persistență, competența revine instanței judecătorești în circumscripția căreia își are sediul Transportatorul.</p>

        <h2 className="text-base font-bold mb-2">IX. ÎNCETAREA CONTRACTULUI</h2>
        <p className="text-sm mb-3 text-justify">Contractul încetează prin: acordul părților; expirarea duratei; reziliere unilaterală (cu daune-interese pentru partea vătămată); fraudă dovedită; lichidarea uneia dintre părți (notificată în scris în 5 zile); nerespectarea clauzelor contractuale.</p>

        <h2 className="text-base font-bold mb-2">X. CONFIDENȚIALITATE</h2>
        <p className="text-sm mb-3 text-justify">Părțile se angajează să nu divulge terților nicio informație referitoare la prezentul contract, contractele subsecvente, actele adiționale sau orice alte date aferente relației contractuale.</p>

        <h2 className="text-base font-bold mb-2">XI. DISPOZIȚII FINALE</h2>
        <p className="text-sm mb-4 text-justify">Modificările sunt valabile doar prin act adițional semnat și ștampilat de ambele părți. Prezentul contract înlătură orice înțelegere verbală anterioară. Km suplimentari față de cei contractați: 10 lei/km + TVA. Regulamentul de Conduită (Anexa 1) face parte integrantă din contract. Respectă prevederile OG nr. 27/2011 și normativelor ARR.</p>

        <p className="text-sm mb-6 font-semibold">Prezentul contract a fost semnat azi <strong>{contractDate}</strong>, în două exemplare originale, câte unul pentru fiecare parte.</p>

        {/* Semnaturi */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-300 rounded p-3">
            <p className="text-sm font-bold">TRANSPORTATOR</p>
            <p className="text-sm font-semibold">S.C. LUXURIA TRANS &amp; TRAVEL S.R.L.</p>
            <p className="text-sm">Cîrlova-Țone Cristina-Mădălina — Administrator</p>
            <div className="mt-4 pt-3 border-t border-dashed border-gray-400 text-xs italic text-gray-600">
              Semnatura digitala Luxuria Trans &amp; Travel (atasata la template)
            </div>
            <p className="text-sm mt-2">Data: <strong>{contractDate}</strong></p>
          </div>

          <div className="border border-gray-300 rounded p-3 bg-blue-50">
            <p className="text-sm font-bold">BENEFICIAR</p>
            <p className="text-sm">Denumire: <strong>{clientName}</strong></p>
            <div className="mt-4 pt-3 border-t border-dashed border-blue-400 text-xs italic text-blue-800">
              <strong>Semnat electronic</strong> prin citire si acceptare pe platforma ATPSOR.
            </div>
            <p className="text-sm mt-2">Data acceptarii: <strong>{contractDate}, {acceptTime}</strong></p>
            <p className="text-xs text-blue-700 mt-1">Referinta: ATPSOR-{contractNr}</p>
          </div>
        </div>

        {/* Anexa 1 - Regulament */}
        <div className="border-t-2 border-gray-800 pt-6 mt-8">
          <h2 className="text-center text-base font-bold">ANEXA 1 LA CONTRACTUL DE PUNERE LA DISPOZIȚIE A SERVICIILOR DE TRANSPORT</h2>
          <h3 className="text-center text-lg font-bold mb-1">REGULAMENT DE CONDUITĂ A PASAGERILOR</h3>
          <p className="text-center text-sm mb-4 italic">Transport cu autocarul — Curse ocazionale</p>
          <p className="text-center text-sm mb-4">
            Contract nr.: <strong>{contractNr}</strong> din: <strong>{contractDate}</strong> | Ruta: <strong>{route}</strong>
          </p>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm mb-4">
            <strong>ℹ De ce este necesar acest regulament?</strong><br/>
            Prezentul regulament asigură siguranța, confortul și protecția tuturor pasagerilor pe durata transportului, precum și integritatea vehiculului.
            Prin semnarea contractului de transport, fiecare pasager confirmă că a luat cunoștință de aceste reguli și se angajează să le respecte.
          </div>

          <h3 className="text-base font-bold mb-2">1. INTERDICȚII ABSOLUTE ÎN AUTOCAR</h3>
          <table className="w-full border border-gray-400 text-sm mb-4">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-1 w-12">Nr.</th>
                <th className="p-1 text-left">Interdicție</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Fumatul (țigări, trabucuri, pipă, produse din tutun)", "Inclusiv la geam deschis sau în ușa autocarului cu motorul pornit."],
                ["Fumatul țigărilor electronice, vape, IQOS, glo etc.", "Generează vapori și miros, pot activa sistemele de detecție a fumului."],
                ["Consumul de băuturi alcoolice", "Pasagerilor în stare vădită de ebrietate li se poate refuza accesul."],
                ["Consumul de alimente în autocar", "Sunt permise doar băuturile nealcoolice în recipiente cu capac."],
                ["Vandalism și deteriorarea bunurilor din autocar", "Scaune, tapițerie, geamuri, sistem audio/video, climatizare, toaletă."],
                ["Aruncarea deșeurilor în autocar", "Deșeurile se depun în pungile/coșurile puse la dispoziție."],
                ["Comportament agresiv față de pasageri, ghid sau șofer", "Limbaj obscen, injurii, hărțuire, amenințări sau violență fizică."],
                ["Distragerea atenției șoferului în timpul mersului", "Cu excepția urgențelor, orice solicitare se adresează ghidului."],
                ["Transportul de substanțe periculoase sau ilegale", "Substanțe inflamabile, explozive, toxice, droguri, obiecte ilegale."],
                ["Utilizarea sistemului audio la volum deranjant", "Muzica personală — exclusiv cu căști. Setările audio/climatizare — exclusiv de șofer."],
              ].map(([title, desc], i) => (
                <tr key={i} className="border-t border-gray-400">
                  <td className="p-1 text-center font-bold">{i + 1}</td>
                  <td className="p-1"><strong>{title}</strong><br/><span className="text-xs text-gray-600">{desc}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-base font-bold mb-2">2. REGULI GENERALE DE CONDUITĂ</h3>
          <ul className="text-sm list-disc pl-5 mb-4 space-y-1">
            <li>Centura de siguranță se poartă obligatoriu pe toată durata deplasării (OUG nr. 195/2002).</li>
            <li>Pasagerii nu se ridică din scaune și nu circulă prin autocar în timpul mersului, cu excepția deplasării la toaletă.</li>
            <li>Bagajele de mână — la raft sau sub scaun; bagajele voluminoase — exclusiv în compartimentul de bagaje (cala).</li>
            <li>Animalele de companie — admise numai cu acordul prealabil scris al Agenției (cușcă, lesă, botniță, acte sanitare).</li>
            <li>Opririle tehnice se efectuează la locurile stabilite de șofer. Copiii minori sunt în responsabilitatea exclusivă a părinților.</li>
            <li>Se interzice acționarea ușilor sau a ieșirilor de urgență, cu excepția situațiilor de urgență reală.</li>
          </ul>

          <h3 className="text-base font-bold mb-2">3. CONSECINȚELE NERESPECTĂRII REGULAMENTULUI</h3>
          <p className="text-sm mb-2 text-justify"><strong>3.1.</strong> Nerespectarea regulilor dă dreptul Agenției și șoferului să: avertizeze verbal pasagerul; oprească autocarul la primul loc sigur; refuze continuarea transportului (fără rambursare) dacă comportamentul periclitează siguranța; sesizeze autoritățile competente (Poliție, Jandarmerie).</p>
          <p className="text-sm mb-2 text-justify"><strong>3.2.</strong> Daunele materiale produse autocarului se suportă integral de pasagerul vinovat, evaluat de un service autorizat, independent de sancțiunile contravenționale sau penale.</p>
          <p className="text-sm mb-4 text-justify"><strong>3.3.</strong> Îmbarcarea poate fi refuzată pasagerilor în stare de ebrietate sau sub influența substanțelor interzise, fără drept la rambursare. Răspunderea Agenției pentru daune cauzate prin nerespectarea Regulamentului de către pasageri este exclusă.</p>

          <h3 className="text-base font-bold mb-2">4. PROCEDURA ÎN CAZ DE URGENȚĂ</h3>
          <ul className="text-sm list-disc pl-5 mb-4 space-y-1">
            <li>Urgență medicală — anunțați imediat șoferul.</li>
            <li>Ieșirile de urgență sunt marcate — se folosesc EXCLUSIV în situații de urgență reală (accident, incendiu).</li>
            <li>Număr de urgență Agenție (24/7): <strong>0734 489 107</strong> | Urgențe România/UE: <strong>112</strong></li>
          </ul>

          <div className="border-2 border-red-300 bg-red-50 p-3 rounded text-sm mb-4">
            <strong>⚠ ATENȚIE</strong> — Siguranța tuturor pasagerilor depinde de respectarea acestor reguli.
            Șoferul are dreptul și obligația legală să refuze sau să întrerupă transportul oricărui pasager al cărui
            comportament pune în pericol siguranța celorlalți, conform OUG nr. 195/2002 și Legii nr. 92/2007.
          </div>

          <p className="text-sm italic mb-4">Prezenta Anexă a fost citită, înțeleasă și acceptată de ambele părți la data semnării contractului de transport.</p>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-sm font-bold">TRANSPORTATOR — Luxuria Trans &amp; Travel S.R.L.</p>
              <p className="text-sm mt-2">Data: <strong>{contractDate}</strong></p>
            </div>
            <div>
              <p className="text-sm font-bold">BENEFICIAR: <strong>{clientName}</strong></p>
              <p className="text-sm mt-2">Data: <strong>{contractDate}</strong> (acceptat electronic)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-3 border-t border-gray-400 text-center text-xs text-gray-600">
          Luxuria Trans &amp; Travel S.R.L. | CUI RO31261740 | 031-419-00-21 | rezervari@luxuriatravel.ro<br/>
          Document generat prin platforma ATPSOR — atpsor.ro
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
