"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Inapoi la pagina principala
      </Link>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
        <div className="flex items-center gap-3">
          <Lock className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Politica de Confidentialitate</h1>
        </div>
        <p className="mt-3 text-indigo-200">Ultima actualizare: 13 aprilie 2026</p>
      </div>

      <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900">

        <section className="mb-8">
          <h2 className="text-xl font-bold">1. Operator de date</h2>
          <p>
            Operatorul de date cu caracter personal este <strong>Luxuria Trans &amp; Travel SRL</strong>,
            CUI RO31261740, cu sediul in Str. Epocii, nr. 3B, parter, Bragadiru, Jud. Ilfov, Romania,
            care opereaza platforma ATPSOR (atpsor.ro) in beneficiul <strong>Asociatiei ATPSOR</strong> (CIF 52819099).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">2. Date colectate</h2>
          <p>Colectam urmatoarele categorii de date personale:</p>
          <ul>
            <li><strong>Date de identificare:</strong> nume, prenume, email, telefon</li>
            <li><strong>Date de facturare:</strong> adresa, oras, judet, CUI (pentru persoane juridice)</li>
            <li><strong>Date firma transportator:</strong> denumire, CUI, licenta, adresa sediu</li>
            <li><strong>Date tehnice:</strong> adresa IP, tip browser, cookie-uri</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">3. Scopul prelucrarii</h2>
          <ul>
            <li>Intermedierea serviciilor de transport ocazional de persoane</li>
            <li>Procesarea platilor si emiterea facturilor</li>
            <li>Comunicari privind rezervarile si statusul transportului</li>
            <li>Verificarea transportatorilor (documente, licente)</li>
            <li>Conformarea cu obligatiile fiscale si legale</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">4. Temeiul legal</h2>
          <ul>
            <li><strong>Executarea contractului</strong> — prelucrarea este necesara pentru prestarea serviciului de intermediere</li>
            <li><strong>Obligatia legala</strong> — emiterea facturilor, raportari fiscale</li>
            <li><strong>Interesul legitim</strong> — securitatea platformei, prevenirea fraudei</li>
            <li><strong>Consimtamantul</strong> — comunicari de marketing (daca se aplica)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">5. Destinatari ai datelor</h2>
          <p>Datele personale pot fi transmise catre:</p>
          <ul>
            <li><strong>Transportatorul ales</strong> — pentru prestarea serviciului de transport</li>
            <li><strong>Stripe</strong> — procesator de plati (SUA, certificat Privacy Shield)</li>
            <li><strong>SmartBill</strong> — emitere facturi electronice</li>
            <li><strong>Resend</strong> — trimitere emailuri de notificare</li>
            <li><strong>Supabase</strong> — stocare date (servere UE)</li>
            <li><strong>Autoritati publice</strong> — cand este obligatoriu prin lege</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">6. Durata stocarii</h2>
          <ul>
            <li><strong>Date cont utilizator:</strong> pe durata existentei contului + 30 zile dupa stergere</li>
            <li><strong>Date facturare:</strong> 10 ani (obligatie fiscala)</li>
            <li><strong>Date tehnice (logs):</strong> 90 zile</li>
            <li><strong>Contracte de transport:</strong> 5 ani</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">7. Drepturile dumneavoastra</h2>
          <p>Conform GDPR, aveti urmatoarele drepturi:</p>
          <ul>
            <li><strong>Dreptul de acces</strong> — puteti solicita o copie a datelor personale</li>
            <li><strong>Dreptul la rectificare</strong> — puteti corecta datele incorecte</li>
            <li><strong>Dreptul la stergere</strong> — puteti solicita stergerea datelor (cu exceptia obligatiilor legale)</li>
            <li><strong>Dreptul la restrictionare</strong> — puteti limita prelucrarea datelor</li>
            <li><strong>Dreptul la portabilitate</strong> — puteti primi datele in format structurat</li>
            <li><strong>Dreptul de opozitie</strong> — puteti contesta prelucrarea bazata pe interes legitim</li>
          </ul>
          <p>
            Pentru exercitarea drepturilor, contactati-ne la <strong>contact@atpsor.ro</strong>.
            Aveti dreptul de a depune plangere la <strong>ANSPDCP</strong> (Autoritatea Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">8. Contact DPO</h2>
          <div className="rounded-lg bg-gray-50 p-4">
            <p><strong>Email:</strong> contact@atpsor.ro</p>
            <p><strong>Telefon:</strong> +40 745 635 657</p>
            <p><strong>Adresa:</strong> Com. Clinceni, Str. Sabarului 120, Jud. Ilfov</p>
          </div>
        </section>

      </div>
    </div>
  );
}
