"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { FileSignature, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface ContractPreviewProps {
  transporterName: string;
  transporterCui?: string;
  clientName: string;
  clientAddress?: string;
  clientEmail?: string;
  route: string;
  pickupCity?: string;
  dropoffCity?: string;
  departureDate: string;
  returnDate?: string | null;
  vehicleName?: string;
  vehicleSeats?: number;
  vehicleCategory?: string;
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
  clientAddress,
  clientEmail,
  route,
  pickupCity,
  dropoffCity,
  departureDate,
  returnDate,
  vehicleName,
  vehicleSeats,
  vehicleCategory,
  totalPrice,
  contractUrl,
  contractName,
  accepted,
  onToggle,
}: ContractPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const now = new Date();
  const acceptDate = now.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const acceptTime = now.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  const totalFormatted = Number(totalPrice).toFixed(2);

  // Estimated KM (200 km/day minimum * nr days)
  const nrZile = returnDate
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;
  const kmEstimati = nrZile * 200;

  const cat = (vehicleCategory || "").toLowerCase();
  const isAutocar = cat.includes("autocar");
  const isMicrobuz = cat.includes("microbuz");
  const isMinibus = cat.includes("midi") || cat.includes("minibus");

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Contract header */}
      <div className="bg-gray-800 px-6 py-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <FileSignature className="h-5 w-5" />
          Contract de Transport Ocazional — de citit si acceptat
        </h3>
      </div>

      {/* Sumar rapid (always visible) */}
      <div className="px-6 py-5 text-sm text-gray-700 space-y-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
          <p className="font-semibold text-blue-900">CONTRACT DE TRANSPORT OCAZIONAL DE PERSOANE</p>
          <div className="space-y-1">
            <p><strong>Prestator:</strong> {transporterName}{transporterCui ? ` (CUI: ${transporterCui})` : ""}</p>
            <p><strong>Beneficiar:</strong> {clientName || "—"}</p>
            <p><strong>Traseu:</strong> {route}</p>
            <p><strong>Data transport:</strong> {departureDate}{returnDate ? ` → ${returnDate}` : ""}</p>
            {vehicleName && <p><strong>Vehicul:</strong> {vehicleName}{vehicleSeats ? `, ${vehicleSeats} locuri` : ""}</p>}
            <p><strong>Valoare totala:</strong> {totalFormatted} RON (TVA inclus)</p>
          </div>
        </div>

        {/* Toggle full contract */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? "Ascunde contractul complet" : "Citeste contractul complet (obligatoriu)"}
        </button>

        {/* Contract complet - scrollabil */}
        {expanded && (
          <div className="max-h-[500px] overflow-y-auto rounded-lg border border-gray-300 bg-white p-5 text-[11pt] text-gray-900 font-serif">
            <div className="border-b-2 border-gray-800 pb-2 mb-4 text-xs">
              <strong>{transporterName}</strong> | Contract de Punere la Dispoziție a Serviciilor de Transport
            </div>

            <h1 className="text-lg font-bold text-center mb-1">CONTRACT DE PUNERE LA DISPOZIȚIE A SERVICIILOR DE TRANSPORT</h1>
            <p className="text-center text-sm mb-4">Se va semna electronic la data plății: <strong>{acceptDate}, {acceptTime}</strong></p>

            {/* I. Partile */}
            <h2 className="text-sm font-bold mb-2">I. PĂRȚILE CONTRACTANTE</h2>
            <p className="text-xs mb-3 text-justify">
              <strong>{transporterName}</strong>{transporterCui ? `, C.U.I. ${transporterCui}` : ""},
              denumită în continuare <strong>TRANSPORTATOR</strong>, și:
            </p>

            <table className="w-full border border-gray-400 mb-3 text-xs">
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="p-2 bg-gray-100 font-semibold w-40">Denumire / Nume</td>
                  <td className="p-2 font-bold">{clientName || "_______________________"}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="p-2 bg-gray-100 font-semibold">Sediu / Domiciliu</td>
                  <td className="p-2">{clientAddress || "_____________________________________"}</td>
                </tr>
                <tr>
                  <td className="p-2 bg-gray-100 font-semibold">Email / Contact</td>
                  <td className="p-2">{clientEmail || "_____________"}</td>
                </tr>
              </tbody>
            </table>

            <p className="text-xs mb-3">denumit/ă în continuare <strong>BENEFICIAR</strong>.</p>

            {/* II. Obiectul */}
            <h2 className="text-sm font-bold mb-2">II. OBIECTUL CONTRACTULUI</h2>
            <p className="text-xs mb-2 text-justify">
              Punerea la dispoziție de către TRANSPORTATOR a serviciilor de transport efectuate cu echipaj,
              și utilizarea de către BENEFICIAR a mijlocului de transport închiriat.
            </p>

            <table className="w-full border border-gray-400 mb-3 text-xs">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th colSpan={2} className="p-1 text-left">CARACTERISTICILE VOIAJULUI</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="p-1 bg-gray-100 font-semibold w-40">Plecare</td>
                  <td className="p-1"><strong>{pickupCity || "_____________"}</strong></td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="p-1 bg-gray-100 font-semibold">Destinație</td>
                  <td className="p-1"><strong>{dropoffCity || "_____________"}</strong></td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="p-1 bg-gray-100 font-semibold">Data</td>
                  <td className="p-1">
                    <strong>{departureDate}</strong>{returnDate ? <> → <strong>{returnDate}</strong></> : ""}
                  </td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="p-1 bg-gray-100 font-semibold">Km maximi contractați</td>
                  <td className="p-1">Max. <strong>{kmEstimati}</strong> km (km suplimentari: 10 lei/km + TVA)</td>
                </tr>
                <tr className="bg-gray-800 text-white">
                  <th colSpan={2} className="p-1 text-left">VEHICUL</th>
                </tr>
                <tr>
                  <td className="p-1 bg-gray-100 font-semibold">Tipul</td>
                  <td className="p-1">
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
            <h2 className="text-sm font-bold mb-2">III. OBLIGAȚIILE PĂRȚILOR CONTRACTANTE</h2>
            <p className="text-xs font-semibold mb-1">A. TRANSPORTATORUL se obligă:</p>
            <ol className="text-xs list-decimal pl-5 mb-3 space-y-0.5">
              <li>Să pună la dispoziție mijlocul de transport corespunzător tehnic, la datele și orele stabilite. În caz de imposibilitate, asigură autocar similar sau superior.</li>
              <li>Să asigure personal profesionist cu toate atestatele legale, conform OG 27/2011 și Regulamentului (CE) nr. 1071/2009.</li>
              <li>Să pună la dispoziția conducătorilor auto toate documentele de transport necesare conform normelor legale în vigoare.</li>
              <li>Să asigure mijlocul de transport și pasagerii pe toată durata deplasării.</li>
              <li>Să suporte costurile de combustibil, diurnele și vizele conducătorilor auto. Taxele de drum și vignetele sunt suportate de TRANSPORTATOR.</li>
              <li>Să remedieze defecțiunile apărute pe parcurs, inclusiv prin înlocuirea autocarului cu un vehicul de aceeași categorie sau superioară, fără costuri suplimentare.</li>
              <li>Să obțină și să achite licențele de execuție ARR pentru autocarul contractat pe toată durata contractului.</li>
              <li>Să asigure siguranța și integritatea bagajelor încredințate pe întreaga durată a transportului.</li>
              <li>Să utilizeze numărul de șoferi necesar respectării prevederilor legale privind timpii de conducere și odihnă.</li>
            </ol>

            <p className="text-xs font-semibold mb-1">B. BENEFICIARUL se obligă:</p>
            <ol className="text-xs list-decimal pl-5 mb-3 space-y-0.5">
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
            <h2 className="text-sm font-bold mb-2">IV. VALOARE, CONDIȚII ȘI MODALITĂȚI DE PLATĂ</h2>
            <table className="w-full border border-gray-400 mb-3 text-xs">
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="p-1 bg-gray-100 font-semibold w-40">Valoarea serviciilor</td>
                  <td className="p-1"><strong>{totalFormatted}</strong> lei — TVA inclus</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="p-1 bg-gray-100 font-semibold">Avans</td>
                  <td className="p-1">Achitat integral la semnarea contractului (prin platforma ATPSOR)</td>
                </tr>
                <tr>
                  <td className="p-1 bg-gray-100 font-semibold">Modalitate plată</td>
                  <td className="p-1">Card bancar (Stripe) sau Virament IBAN</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs mb-3 italic text-justify">
              Dacă din motive independente de transportator programul turistic nu poate fi dus la bun sfârșit, banii nu vor fi restituiți BENEFICIARULUI.
            </p>

            {/* V. Sanctiuni */}
            <h2 className="text-sm font-bold mb-2">V. SANCȚIUNI</h2>
            <ol className="text-xs list-decimal pl-5 mb-3 space-y-0.5">
              <li>Pentru nerespectarea termenelor de plată, BENEFICIARUL va plăti penalități de 1%/zi din valoarea facturii, începând cu data scadenței.</li>
              <li>Decomandarea cu mai puțin de 15 zile atrage penalizări de 50% din valoarea totală a transportului.</li>
            </ol>

            {/* VI-XI Short */}
            <h2 className="text-sm font-bold mb-2">VI. CLAUZE DE VALIDITATE</h2>
            <p className="text-xs mb-2 text-justify">Rezilierea totală sau parțială a clauzelor contractului nu are niciun efect asupra obligațiilor deja scadente. Răspunderea părții vinovate de încetarea contractului nu este înlăturată.</p>

            <h2 className="text-sm font-bold mb-2">VII. FORȚA MAJORĂ</h2>
            <p className="text-xs mb-2 text-justify">Forța majoră constatată potrivit legii apără de răspundere partea care o invocă, cu obligația notificării în 48 de ore și limitării consecințelor. Dacă evenimentul nu încetează în 30 de zile, oricare parte poate notifica încetarea contractului fără daune-interese.</p>

            <h2 className="text-sm font-bold mb-2">VIII. LITIGII</h2>
            <p className="text-xs mb-2 text-justify">Litigiile se rezolvă pe cale amiabilă. În caz de persistență, competența revine instanței judecătorești în circumscripția căreia își are sediul Transportatorul.</p>

            <h2 className="text-sm font-bold mb-2">IX. ÎNCETAREA CONTRACTULUI</h2>
            <p className="text-xs mb-2 text-justify">Contractul încetează prin: acordul părților; expirarea duratei; reziliere unilaterală (cu daune-interese pentru partea vătămată); fraudă dovedită; lichidarea uneia dintre părți (notificată în scris în 5 zile); nerespectarea clauzelor contractuale.</p>

            <h2 className="text-sm font-bold mb-2">X. CONFIDENȚIALITATE</h2>
            <p className="text-xs mb-2 text-justify">Părțile se angajează să nu divulge terților nicio informație referitoare la prezentul contract, contractele subsecvente, actele adiționale sau orice alte date aferente relației contractuale.</p>

            <h2 className="text-sm font-bold mb-2">XI. DISPOZIȚII FINALE</h2>
            <p className="text-xs mb-3 text-justify">Modificările sunt valabile doar prin act adițional semnat și ștampilat de ambele părți. Prezentul contract înlătură orice înțelegere verbală anterioară. Km suplimentari față de cei contractați: 10 lei/km + TVA. Regulamentul de Conduită (Anexa 1) face parte integrantă din contract. Respectă prevederile OG nr. 27/2011 și normativelor ARR.</p>

            {/* Anexa 1 - Regulament */}
            <div className="border-t-2 border-gray-800 pt-3 mt-4">
              <h2 className="text-center text-sm font-bold">ANEXA 1 — REGULAMENT DE CONDUITĂ A PASAGERILOR</h2>

              <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs my-2">
                <strong>ℹ</strong> Prin acceptarea contractului, fiecare pasager confirmă că a luat cunoștință de aceste reguli și se angajează să le respecte.
              </div>

              <h3 className="text-sm font-bold mb-1">1. INTERDICȚII ABSOLUTE ÎN AUTOCAR</h3>
              <ol className="text-xs list-decimal pl-5 mb-2 space-y-0.5">
                <li><strong>Fumatul</strong> (inclusiv țigări electronice, vape, IQOS, glo) — inclusiv la geam deschis.</li>
                <li><strong>Consumul de băuturi alcoolice</strong> — accesul poate fi refuzat persoanelor în stare de ebrietate.</li>
                <li><strong>Consumul de alimente</strong> — permise doar băuturi nealcoolice în recipiente cu capac.</li>
                <li><strong>Vandalism și deteriorarea bunurilor</strong> — scaune, tapițerie, geamuri, sistem audio/video, climatizare, toaletă.</li>
                <li><strong>Aruncarea deșeurilor</strong> în autocar — se depun în pungile/coșurile puse la dispoziție.</li>
                <li><strong>Comportament agresiv</strong> față de pasageri, ghid sau șofer — limbaj obscen, injurii, hărțuire, amenințări.</li>
                <li><strong>Distragerea atenției șoferului</strong> în timpul mersului — cu excepția urgențelor, se adresează ghidului.</li>
                <li><strong>Transport de substanțe periculoase</strong> sau ilegale (inflamabile, explozive, toxice, droguri).</li>
                <li><strong>Sistem audio la volum deranjant</strong> — muzica personală exclusiv cu căști.</li>
                <li><strong>Centura de siguranță</strong> se poartă obligatoriu pe toată durata deplasării (OUG nr. 195/2002).</li>
              </ol>

              <h3 className="text-sm font-bold mb-1">2. CONSECINȚE</h3>
              <p className="text-xs mb-2 text-justify">Nerespectarea dă dreptul Agenției să refuze continuarea transportului fără rambursare. Daunele materiale se suportă integral de pasagerul vinovat. Îmbarcarea poate fi refuzată pasagerilor în stare de ebrietate.</p>

              <h3 className="text-sm font-bold mb-1">3. URGENȚE</h3>
              <p className="text-xs mb-2"><strong>Nr. urgență (24/7):</strong> 0734 489 107 | <strong>112</strong> (România/UE)</p>

              <div className="border-2 border-red-300 bg-red-50 p-2 rounded text-xs">
                <strong>⚠ ATENȚIE</strong> — Șoferul are dreptul legal să refuze sau să întrerupă transportul oricărui pasager al cărui comportament pune în pericol siguranța celorlalți, conform OUG nr. 195/2002 și Legii nr. 92/2007.
              </div>
            </div>

            <p className="text-xs italic text-center mt-4 text-gray-600">
              — Sfarsitul contractului. Dupa plata, contractul complet va fi disponibil in sectiunea &quot;Vezi contractul&quot; din email. —
            </p>
          </div>
        )}

        {/* Link to transporter's contract template (daca exista separat) */}
        {contractUrl && (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">{contractName || "Contract aditional transportator (PDF)"}</span>
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
            Am citit si accept <strong>contractul de transport</strong> al {transporterName}, <strong>Anexa 1 — Regulamentul de Conduita</strong> si{" "}
            <Link href="/terms" target="_blank" className="text-primary-500 underline hover:text-primary-600">
              Termenii si Conditiile ATPSOR
            </Link>
          </span>
        </label>
      </div>
    </div>
  );
}
