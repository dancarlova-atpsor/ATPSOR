"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, Shield, FileText, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Inapoi la pagina principala
      </Link>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 text-white">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Termeni si Conditii</h1>
        </div>
        <p className="mt-3 text-gray-300">Ultima actualizare: 13 aprilie 2026</p>
      </div>

      <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900">

        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Shield className="h-5 w-5 text-primary-500" /> 1. Informatii Generale</h2>
          <p>
            Platforma ATPSOR (<strong>atpsor.ro</strong>) este operata de <strong>Luxuria Trans &amp; Travel SRL</strong>,
            cu sediul in Str. Epocii, nr. 3B, parter, Bragadiru, Jud. Ilfov, Romania, CUI RO31261740, J23/3456/2013,
            care a acordat drept de folosinta <strong>Asociatiei Transportatorilor de Persoane prin Serviciul Ocazional din Romania (ATPSOR)</strong>,
            cu sediul in Com. Clinceni, Str. Sabarului 120, Jud. Ilfov, CIF 52819099.
          </p>
          <p>
            Prin accesarea si utilizarea platformei ATPSOR, acceptati in totalitate prezentii Termeni si Conditii.
            Daca nu sunteti de acord cu acesti termeni, va rugam sa nu utilizati platforma.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-bold"><FileText className="h-5 w-5 text-primary-500" /> 2. Definitii</h2>
          <ul>
            <li><strong>Platforma</strong> — site-ul web atpsor.ro si toate serviciile asociate</li>
            <li><strong>Operator</strong> — Luxuria Trans &amp; Travel SRL, proprietarul si operatorul tehnic al platformei</li>
            <li><strong>ATPSOR</strong> — Asociatia Transportatorilor de Persoane prin Serviciul Ocazional din Romania, beneficiarul dreptului de folosinta</li>
            <li><strong>Transportator</strong> — companie de transport inregistrata si aprobata pe platforma</li>
            <li><strong>Client</strong> — persoana fizica sau juridica care solicita servicii de transport prin platforma</li>
            <li><strong>Serviciu de transport</strong> — transportul ocazional de persoane efectuat de un transportator catre un client</li>
            <li><strong>Rezervare</strong> — contractul de transport incheiat intre client si transportator prin intermediul platformei</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">3. Obiectul Platformei</h2>
          <p>
            ATPSOR este o platforma de intermediere care pune in legatura clientii care au nevoie de transport ocazional
            de persoane cu transportatorii verificati si autorizati. Platforma faciliteaza:
          </p>
          <ul>
            <li>Cautarea si compararea transportatorilor disponibili</li>
            <li>Solicitarea si primirea de oferte de transport</li>
            <li>Rezervarea si plata serviciilor de transport (card bancar sau transfer bancar)</li>
            <li>Emiterea automata a facturilor prin SmartBill</li>
            <li>Gestionarea contractelor de transport</li>
          </ul>
          <p>
            <strong>ATPSOR nu este transportator.</strong> Platforma intermediaza relatia intre client si transportator.
            Serviciul de transport este prestat exclusiv de transportatorul ales de client.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">4. Inregistrare si Conturi</h2>
          <p>
            Transportatorii trebuie sa se inregistreze si sa fie aprobati de administratorii ATPSOR inainte de a putea
            oferi servicii pe platforma. Aprobarea presupune verificarea:
          </p>
          <ul>
            <li>Datelor firmei (CUI verificat prin ANAF)</li>
            <li>Licentei de transport</li>
            <li>Documentelor vehiculelor (ITP, copie conforma, asigurari)</li>
          </ul>
          <p>
            Clientii pot utiliza platforma cu sau fara cont. Pentru urmarirea rezervarilor si facturilor,
            se recomanda crearea unui cont.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">5. Preturi si Plati</h2>
          <p>Preturile afisate pe platforma includ:</p>
          <ul>
            <li>Tariful de transport (stabilit de transportator, per km)</li>
            <li>TVA 21%</li>
            <li>Comisionul platformei de 5% din subtotalul cu TVA</li>
          </ul>
          <p>
            Se aplica un minim de <strong>200 km facturabili per zi</strong> de transport.
          </p>
          <p>Platile se pot efectua prin:</p>
          <ul>
            <li><strong>Card bancar</strong> — procesat securizat prin Stripe. ATPSOR nu stocheaza datele cardului.</li>
            <li><strong>Transfer bancar</strong> — detaliile contului se transmit pe email. Rezervarea se confirma la primirea platii.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">6. Contractul de Transport</h2>
          <p>
            Inainte de efectuarea platii, clientul are obligatia de a citi si accepta contractul de transport
            al transportatorului ales. Acceptarea se face electronic prin bifarea optiunii de acceptare pe platforma.
          </p>
          <p>
            Contractul de transport se completeaza automat cu datele clientului, traseul, data, vehiculul si valoarea.
            Acceptarea contractului pe platforma echivaleaza cu semnatura electronica, conform Regulamentului (UE) nr. 910/2014 (eIDAS).
          </p>
          <p>
            Textul semnaturi electronice: <em>"Semnat electronic prin citire si acceptare pe platforma ATPSOR"</em>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">7. Facturare</h2>
          <p>
            Facturile se emit automat prin SmartBill la confirmarea platii:
          </p>
          <ul>
            <li><strong>Factura de transport</strong> — emisa de transportator catre client</li>
            <li><strong>Factura de comision</strong> — emisa de ATPSOR catre transportator (5%)</li>
          </ul>
          <p>
            La plata cu cardul, factura se marcheaza automat ca incasata.
            La transfer bancar, se emite proforma; factura se emite la confirmarea platii.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">8. Responsabilitati</h2>
          <h3 className="text-lg font-semibold mt-4">Transportatorul raspunde pentru:</h3>
          <ul>
            <li>Prestarea serviciului de transport in conditii de siguranta</li>
            <li>Respectarea traseului, datei si conditiilor agreate</li>
            <li>Detinerea tuturor licentelor si autorizatiilor necesare</li>
            <li>Starea tehnica corespunzatoare a vehiculelor</li>
            <li>Asigurarea pasagerilor si bagajelor</li>
          </ul>
          <h3 className="text-lg font-semibold mt-4">Platforma (ATPSOR) nu raspunde pentru:</h3>
          <ul>
            <li>Calitatea serviciului de transport prestat de transportator</li>
            <li>Intarzieri, anulari sau modificari ale transportului</li>
            <li>Prejudicii cauzate de transportator in timpul deplasarii</li>
            <li>Pierderea sau deteriorarea bagajelor</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">9. Anulari si Rambursari</h2>
          <p>
            Politica de anulare este stabilita de fiecare transportator in parte prin contractul de transport.
            In caz de anulare, clientul trebuie sa contacteze transportatorul direct.
          </p>
          <p>
            Rambursarile pentru platile cu cardul se proceseaza prin Stripe in termen de 5-10 zile lucratoare.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">10. Protectia Datelor (GDPR)</h2>
          <p>
            ATPSOR prelucreaza datele personale in conformitate cu Regulamentul General privind Protectia Datelor (GDPR).
            Datele colectate includ: nume, email, telefon, adresa de facturare, date firma (CUI).
          </p>
          <p>
            Datele sunt utilizate exclusiv pentru:
          </p>
          <ul>
            <li>Prestarea serviciului de intermediere transport</li>
            <li>Emiterea facturilor</li>
            <li>Comunicari legate de rezervari</li>
            <li>Conformarea cu obligatiile legale</li>
          </ul>
          <p>
            Nu vindem si nu transmitem datele personale catre terti, cu exceptia
            transportatorului ales (pentru prestarea serviciului) si procesatorului de plati (Stripe).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">11. Proprietate Intelectuala</h2>
          <p>
            Platforma ATPSOR, inclusiv designul, codul sursa, logo-ul si continutul, este proprietatea
            <strong> Luxuria Trans &amp; Travel SRL</strong>. Dreptul de folosinta a fost acordat
            <strong> Asociatiei ATPSOR</strong> prin contract de comodat.
          </p>
          <p>
            Reproducerea, copierea sau redistribuirea continutului platformei fara acordul scris
            al proprietarului este interzisa.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">12. Litigii</h2>
          <p>
            Orice litigiu legat de utilizarea platformei se va solutiona pe cale amiabila.
            In cazul in care nu se ajunge la o intelegere, litigiul va fi deferit instantelor
            competente din Bucuresti, Romania.
          </p>
          <p>
            Legislatia aplicabila este legislatia romana.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">13. Contact</h2>
          <div className="rounded-lg bg-gray-50 p-4">
            <p><strong>Operator platforma:</strong> Luxuria Trans &amp; Travel SRL</p>
            <p><strong>Beneficiar:</strong> ATPSOR — Asociatia Transportatorilor de Persoane prin Serviciul Ocazional din Romania</p>
            <p><strong>Sediu:</strong> Com. Clinceni, Str. Sabarului 120, Jud. Ilfov</p>
            <p><strong>Email:</strong> contact@atpsor.ro</p>
            <p><strong>Telefon:</strong> +40 745 635 657</p>
            <p><strong>CIF ATPSOR:</strong> 52819099</p>
            <p><strong>CUI Luxuria Trans &amp; Travel SRL:</strong> RO31261740</p>
          </div>
        </section>

      </div>
    </div>
  );
}
