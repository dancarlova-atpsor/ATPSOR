"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, Download, FileText } from "lucide-react";

export default function ContractComisionPage() {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Înapoi
        </Link>
        <button onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          <Download className="h-4 w-4" />
          Descarcă / Printează
        </button>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-lg sm:p-12 print:shadow-none print:p-0">
        <div className="text-center">
          <img src="/atpsor-logo.png" alt="ATPSOR" className="mx-auto h-20 w-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900 uppercase">
            Contract de Intermediere Transport
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Nr. _______ / Data: _____________
          </p>
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900">I. PĂRȚILE CONTRACTANTE</h2>
            <p className="mt-2">
              <strong>1.1. ASOCIAȚIA TRANSPORTATORILOR DE PERSOANE PRIN SERVICIU OCAZIONAL (A.T.P.S.O.R.)</strong>,
              cu sediul în Com. Clinceni, Sat Clinceni, Str. Sabarului, Nr. 120, Jud. Ilfov,
              CIF 52819099, cont IBAN RO58CECEB00030RON3979534, deschis la CEC Bank SA,
              reprezentată legal prin <strong>Laudat Daniel</strong>, în calitate de Președinte,
              denumită în continuare <strong>&ldquo;Platforma&rdquo;</strong> sau <strong>&ldquo;ATPSOR&rdquo;</strong>,
            </p>
            <p className="mt-3">și</p>
            <p className="mt-3">
              <strong>1.2.</strong> _____________________________________ (denumirea firmei),
              cu sediul în ___________________________________,
              CUI _________________, cont IBAN ____________________________,
              deschis la ____________________,
              reprezentată legal prin _____________________________,
              în calitate de _______________,
              denumită în continuare <strong>&ldquo;Transportatorul&rdquo;</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">II. OBIECTUL CONTRACTULUI</h2>
            <p className="mt-2">
              <strong>2.1.</strong> Prezentul contract reglementează relația de intermediere
              dintre ATPSOR și Transportator prin platforma digitală <strong>atpsor.ro</strong>,
              prin care ATPSOR facilitează conectarea Transportatorului cu clienți care
              necesită servicii de transport ocazional de persoane.
            </p>
            <p className="mt-2">
              <strong>2.2.</strong> ATPSOR pune la dispoziția Transportatorului platforma online,
              sistemul de plăți electronice, sistemul de facturare automată și promovarea
              serviciilor de transport.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">III. COMISIONUL</h2>
            <p className="mt-2">
              <strong>3.1.</strong> Pentru serviciile de intermediere, ATPSOR reține un comision de
              <strong> 5% (cinci la sută)</strong> din valoarea totală a fiecărei curse contractate
              prin platformă (inclusiv TVA).
            </p>
            <p className="mt-2">
              <strong>3.2.</strong> Comisionul se reține automat prin sistemul de plăți Stripe Connect
              la momentul procesării plății de la client. Transportatorul primește în contul bancar
              conectat diferența de <strong>95%</strong> din valoarea cursei.
            </p>
            <p className="mt-2">
              <strong>3.3.</strong> ATPSOR va emite lunar o factură fiscală pentru comisioanele reținute,
              transmisă electronic pe adresa de email a Transportatorului.
            </p>
            <p className="mt-2">
              <strong>3.4.</strong> Comisionul include: utilizarea platformei, procesarea plăților,
              sistemul de facturare automată, promovarea online și suportul tehnic.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">IV. FACTURAREA</h2>
            <p className="mt-2">
              <strong>4.1.</strong> La fiecare cursă contractată prin platformă, sistemul generează
              automat factura de transport în numele Transportatorului către client, pe baza
              datelor fiscale furnizate de Transportator la înregistrare.
            </p>
            <p className="mt-2">
              <strong>4.2.</strong> Transportatorul este responsabil pentru corectitudinea datelor
              fiscale introduse în platformă (CUI, denumire, adresă sediu, cont bancar).
            </p>
            <p className="mt-2">
              <strong>4.3.</strong> Facturile se emit în conformitate cu legislația fiscală românească
              în vigoare și sunt raportate automat prin sistemul eFactura către ANAF.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">V. OBLIGAȚIILE ATPSOR</h2>
            <p className="mt-2">
              <strong>5.1.</strong> Să asigure funcționarea platformei digitale atpsor.ro în condiții optime.
            </p>
            <p className="mt-2">
              <strong>5.2.</strong> Să proceseze plățile în mod securizat prin Stripe și să vireze
              automat sumele cuvenite Transportatorului.
            </p>
            <p className="mt-2">
              <strong>5.3.</strong> Să emită facturile de comision și să le transmită Transportatorului.
            </p>
            <p className="mt-2">
              <strong>5.4.</strong> Să genereze automat factura de transport în numele Transportatorului
              către client, pe baza datelor furnizate.
            </p>
            <p className="mt-2">
              <strong>5.5.</strong> Să ofere suport tehnic pentru utilizarea platformei.
            </p>
            <p className="mt-2">
              <strong>5.6.</strong> Să protejeze datele personale ale Transportatorului conform GDPR.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">VI. OBLIGAȚIILE TRANSPORTATORULUI</h2>
            <p className="mt-2">
              <strong>6.1.</strong> Să dețină toate documentele legale valabile pentru desfășurarea
              activității de transport ocazional de persoane (licență, copie conformă, ITP,
              RCA, asigurare călători și bagaje).
            </p>
            <p className="mt-2">
              <strong>6.2.</strong> Să încarce în platformă documentele vehiculelor și să le mențină
              actualizate (documente valabile, neexpirate).
            </p>
            <p className="mt-2">
              <strong>6.3.</strong> Să furnizeze date fiscale corecte și complete pentru emiterea facturilor.
            </p>
            <p className="mt-2">
              <strong>6.4.</strong> Să conecteze un cont bancar valid prin Stripe Connect pentru
              primirea plăților.
            </p>
            <p className="mt-2">
              <strong>6.5.</strong> Să presteze serviciul de transport contractat în condițiile
              stabilite cu clientul prin platformă.
            </p>
            <p className="mt-2">
              <strong>6.6.</strong> Să încarce contractul de transport pentru fiecare cursă oferită
              prin platformă, contract ce va fi acceptat de client înainte de plată.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">VII. PLĂȚILE</h2>
            <p className="mt-2">
              <strong>7.1.</strong> Plățile de la clienți se procesează exclusiv prin platforma
              Stripe, în mod securizat (Visa, Mastercard).
            </p>
            <p className="mt-2">
              <strong>7.2.</strong> Transferul sumelor către Transportator se face automat
              prin Stripe Connect, în termen de 2-7 zile lucrătoare de la data plății.
            </p>
            <p className="mt-2">
              <strong>7.3.</strong> Tarifele per km sunt stabilite de fiecare Transportator
              în parte, pentru fiecare categorie de vehicul.
            </p>
            <p className="mt-2">
              <strong>7.4.</strong> Prețul final include: tariful transportatorului + TVA 21% +
              comision platformă 5%. Fiecare transportator stabilește propriul minim facturabil de km/zi din profilul său.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">VIII. DURATA ȘI REZILIEREA</h2>
            <p className="mt-2">
              <strong>8.1.</strong> Prezentul contract intră în vigoare la data semnării/acceptării
              online și este valabil pe toată durata calității de membru ATPSOR.
            </p>
            <p className="mt-2">
              <strong>8.2.</strong> Oricare dintre părți poate rezilia contractul cu un preaviz
              de <strong>30 de zile calendaristice</strong>, comunicat în scris sau prin platformă.
            </p>
            <p className="mt-2">
              <strong>8.3.</strong> Cursele contractate înainte de data rezilierii vor fi onorate
              în condițiile stabilite inițial.
            </p>
            <p className="mt-2">
              <strong>8.4.</strong> ATPSOR poate suspenda accesul Transportatorului la platformă
              în cazul documentelor expirate sau al încălcării repetate a obligațiilor contractuale.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">IX. CONFIDENȚIALITATE ȘI GDPR</h2>
            <p className="mt-2">
              <strong>9.1.</strong> Părțile se obligă să păstreze confidențialitatea informațiilor
              comerciale și financiare obținute în cadrul acestui contract.
            </p>
            <p className="mt-2">
              <strong>9.2.</strong> Tarifele Transportatorului sunt vizibile doar clienților,
              nu și celorlalți transportatori de pe platformă.
            </p>
            <p className="mt-2">
              <strong>9.3.</strong> Prelucrarea datelor cu caracter personal se face în conformitate
              cu Regulamentul (UE) 2016/679 (GDPR).
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">X. DISPOZIȚII FINALE</h2>
            <p className="mt-2">
              <strong>10.1.</strong> Prezentul contract este guvernat de legislația română.
            </p>
            <p className="mt-2">
              <strong>10.2.</strong> Orice litigiu se va soluționa pe cale amiabilă, iar în caz
              de imposibilitate, de instanțele judecătorești competente din România.
            </p>
            <p className="mt-2">
              <strong>10.3.</strong> Acceptarea online a prezentului contract (bifarea checkbox-ului
              de pe platformă) are aceeași valoare juridică ca semnătura olografă, conform
              Legii nr. 455/2001 privind semnătura electronică.
            </p>
            <p className="mt-2">
              <strong>10.4.</strong> Modificările aduse prezentului contract vor fi comunicate
              Transportatorului cu cel puțin 15 zile înainte de intrarea în vigoare.
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-gray-200 pt-8">
            <div>
              <p className="font-bold text-gray-900">ATPSOR</p>
              <p className="mt-2 text-gray-600">Președinte: Laudat Daniel</p>
              <p className="mt-1 text-gray-600">CIF: 52819099</p>
              <div className="mt-6 border-b border-gray-300 pb-1">
                <p className="text-xs text-gray-400">Semnătura și ștampila</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900">TRANSPORTATORUL</p>
              <p className="mt-2 text-gray-600">Reprezentant: _________________</p>
              <p className="mt-1 text-gray-600">CUI: _________________</p>
              <div className="mt-6 border-b border-gray-300 pb-1">
                <p className="text-xs text-gray-400">Semnătura și ștampila</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
