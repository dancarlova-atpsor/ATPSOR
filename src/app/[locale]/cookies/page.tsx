"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, Cookie } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Inapoi la pagina principala
      </Link>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-8 text-white">
        <div className="flex items-center gap-3">
          <Cookie className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Politica de Cookie-uri</h1>
        </div>
        <p className="mt-3 text-amber-200">Ultima actualizare: 13 aprilie 2026</p>
      </div>

      <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900">

        <section className="mb-8">
          <h2 className="text-xl font-bold">1. Ce sunt cookie-urile?</h2>
          <p>
            Cookie-urile sunt fisiere text de mici dimensiuni care sunt stocate pe dispozitivul
            dumneavoastra (computer, telefon, tableta) atunci cand vizitati un site web.
            Cookie-urile permit site-ului sa va recunoasca dispozitivul si sa memoreze
            anumite informatii despre vizita dumneavoastra.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">2. Ce cookie-uri folosim?</h2>

          <h3 className="text-lg font-semibold mt-4">Cookie-uri strict necesare</h3>
          <p>
            Aceste cookie-uri sunt esentiale pentru functionarea platformei si nu pot fi dezactivate.
            Includ cookie-uri pentru:
          </p>
          <ul>
            <li><strong>Autentificare</strong> — mentin sesiunea de login (Supabase Auth)</li>
            <li><strong>Securitate</strong> — protejarea impotriva atacurilor CSRF</li>
            <li><strong>Preferinte limba</strong> — memorarea limbii selectate (RO/EN)</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4">Cookie-uri functionale</h3>
          <p>
            Aceste cookie-uri imbunatatesc experienta pe platforma:
          </p>
          <ul>
            <li><strong>Preferinte utilizator</strong> — memorarea setarilor din dashboard</li>
            <li><strong>Formulare</strong> — salvarea temporara a datelor completate</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4">Cookie-uri de la terti</h3>
          <p>
            Platforma poate include cookie-uri de la servicii terte:
          </p>
          <ul>
            <li><strong>Stripe</strong> — procesator de plati, foloseste cookie-uri pentru securitatea tranzactiilor</li>
            <li><strong>Google Maps</strong> — calcul distante, poate seta cookie-uri Google</li>
            <li><strong>Supabase</strong> — baza de date si autentificare</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">3. Temeiul legal</h2>
          <p>
            Utilizarea cookie-urilor se face in conformitate cu:
          </p>
          <ul>
            <li>Regulamentul (UE) 2016/679 (GDPR)</li>
            <li>Directiva 2002/58/CE (Directiva ePrivacy)</li>
            <li>Legea nr. 506/2004 privind prelucrarea datelor cu caracter personal si protectia vietii private in sectorul comunicatiilor electronice</li>
          </ul>
          <p>
            Cookie-urile strict necesare sunt plasate in baza interesului legitim al operatorului.
            Cookie-urile functionale si de la terti necesita consimtamantul dumneavoastra.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">4. Cum puteti controla cookie-urile?</h2>
          <p>
            Puteti controla si/sau sterge cookie-urile dupa cum doriti. Puteti sterge toate
            cookie-urile care sunt deja pe dispozitivul dumneavoastra si puteti seta majoritatea
            browserelor sa impiedice plasarea lor. Setarile se gasesc de obicei in meniul
            "Optiuni" sau "Preferinte" al browserului.
          </p>
          <p>
            <strong>Atentie:</strong> Daca dezactivati cookie-urile strict necesare, este posibil
            ca anumite functionalitati ale platformei sa nu functioneze corect (ex: autentificarea,
            procesarea platilor).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">5. Durata de stocare</h2>
          <ul>
            <li><strong>Cookie-uri de sesiune</strong> — se sterg automat la inchiderea browserului</li>
            <li><strong>Cookie-uri persistente</strong> — raman pe dispozitiv pana la expirare (de obicei 30 de zile) sau pana cand le stergeti manual</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold">6. Contact</h2>
          <p>
            Pentru intrebari despre politica noastra de cookie-uri, ne puteti contacta:
          </p>
          <div className="rounded-lg bg-gray-50 p-4">
            <p><strong>Email:</strong> contact@atpsor.ro</p>
            <p><strong>Telefon:</strong> +40 745 635 657</p>
            <p><strong>Operator:</strong> Luxuria Trans &amp; Travel SRL, CUI RO31261740, Bragadiru, Ilfov</p>
          </div>
        </section>

      </div>
    </div>
  );
}
