"use client";

import { Link } from "@/i18n/routing";
import {
  ArrowLeft, Download, Users, Search, MessageSquare, CreditCard,
  Building2, FileText, CalendarCheck, Receipt,
} from "lucide-react";

const sections = [
  { id: "cautare", title: "1. Cautare Transport", icon: Search },
  { id: "cerere", title: "2. Creare Cerere de Transport", icon: FileText },
  { id: "oferte", title: "3. Comparare Oferte", icon: MessageSquare },
  { id: "plata-card", title: "4. Plata cu Cardul", icon: CreditCard },
  { id: "plata-transfer", title: "5. Plata prin Transfer Bancar", icon: Building2 },
  { id: "rezervari", title: "6. Vizualizare Rezervari", icon: CalendarCheck },
  { id: "facturi", title: "7. Vizualizare Facturi", icon: Receipt },
];

export default function ManualClientPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/manual" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Inapoi la Manuale
      </Link>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-green-600 to-green-800 p-8 text-white">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Manual Client</h1>
        </div>
        <p className="mt-3 text-green-200">Ghid pentru cautarea si rezervarea transportului pe platforma ATPSOR</p>
        <a href="/documents/manual-client.pdf" download className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
          <Download className="h-4 w-4" /> Descarca PDF
        </a>
      </div>

      {/* Table of Contents */}
      <div className="mb-8 rounded-xl bg-gray-50 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Cuprins</h3>
        <nav className="space-y-1">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">
                <Icon className="h-4 w-4 text-gray-400" /> {s.title}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="space-y-10">
        <section id="cautare">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Search className="h-6 w-6 text-green-500" /> 1. Cautare Transport</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Acceseaza <strong>atpsor.ro</strong> si apasa <strong>Caut Transport</strong></p>
            <p>2. Completeaza: <strong>oras plecare, oras sosire, numar pasageri, data plecarii</strong></p>
            <p>3. Optional: adauga <strong>orase intermediare</strong> si <strong>data intoarcerii</strong></p>
            <p>4. Apasa <strong>Cauta transportatori</strong></p>
            <p>5. Vezi lista transportatorilor disponibili cu preturi, vehicule si dotari</p>
            <p>6. Apasa <strong>Alege</strong> pe transportatorul dorit</p>
          </div>
        </section>

        <section id="cerere">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><FileText className="h-6 w-6 text-green-500" /> 2. Creare Cerere de Transport</h2>
          <div className="space-y-3 text-gray-700">
            <p>Alternativ la cautarea directa, poti crea o <strong>cerere de transport</strong>:</p>
            <p>1. Completeaza formularul cu detaliile calatoriei</p>
            <p>2. Cererea ajunge la <strong>toti transportatorii</strong> din platforma</p>
            <p>3. Transportatorii iti trimit <strong>oferte personalizate</strong></p>
            <p>4. Compari ofertele si alegi cea mai buna</p>
          </div>
        </section>

        <section id="oferte">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><MessageSquare className="h-6 w-6 text-green-500" /> 3. Comparare Oferte</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Din <strong>Panoul Client</strong> → cererea ta → <strong>Vezi ofertele</strong></p>
            <p>2. Fiecare oferta arata: transportator, vehicul, pret/km, dotari, contract</p>
            <p>3. Vezi <strong>detalii calcul pret</strong>: km facturabili, TVA, comision platforma</p>
            <p>4. Vizualizeaza si descarca <strong>contractul de transport</strong> al fiecarui transportator</p>
            <p>5. <strong>Accepta contractul</strong> (bifeaza checkbox-ul) inainte de plata</p>
          </div>
        </section>

        <section id="plata-card">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><CreditCard className="h-6 w-6 text-green-500" /> 4. Plata cu Cardul</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Completeaza <strong>datele de facturare</strong> (nume, adresa, judet)</p>
            <p>2. Selecteaza <strong>Card bancar</strong> ca metoda de plata</p>
            <p>3. Apasa <strong>Plateste</strong> — esti redirectionat catre pagina securizata Stripe</p>
            <p>4. Introdu datele cardului (Visa, Mastercard) pe pagina Stripe</p>
            <p>5. Dupa plata, primesti <strong>confirmare pe email</strong> si rezervarea e activa</p>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <strong>Siguranta:</strong> Platile sunt procesate securizat prin Stripe. ATPSOR nu stocheaza datele cardului.
            </div>
          </div>
        </section>

        <section id="plata-transfer">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Building2 className="h-6 w-6 text-green-500" /> 5. Plata prin Transfer Bancar</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Selecteaza <strong>Transfer bancar</strong> ca metoda de plata</p>
            <p>2. Apasa <strong>Rezerva cu transfer bancar</strong></p>
            <p>3. Primesti pe email <strong>detaliile contului bancar</strong>: IBAN, banca, suma, referinta</p>
            <p>4. Efectueaza transferul bancar mentionand <strong>referinta</strong> in descriere</p>
            <p>5. Rezervarea se confirma automat dupa primirea platii (1-2 zile lucratoare)</p>
          </div>
        </section>

        <section id="rezervari">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><CalendarCheck className="h-6 w-6 text-green-500" /> 6. Vizualizare Rezervari</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>Panoul Client</strong> vezi toate rezervarile tale:</p>
            <p><strong>Confirmate</strong> — plata procesata, transport programat</p>
            <p><strong>In asteptare</strong> — transfer bancar in curs de procesare</p>
            <p>Fiecare rezervare arata: traseu, transportator, data, pret, contract</p>
          </div>
        </section>

        <section id="facturi">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Receipt className="h-6 w-6 text-green-500" /> 7. Vizualizare Facturi</h2>
          <div className="space-y-3 text-gray-700">
            <p>In <strong>Panoul Client</strong>, sectiunea <strong>Facturile Mele</strong> arata toate facturile emise.</p>
            <p>Poti <strong>descarca PDF-ul</strong> fiecarei facturi apasand iconita de download.</p>
            <p>Facturile se genereaza automat dupa confirmarea platii prin SmartBill.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
