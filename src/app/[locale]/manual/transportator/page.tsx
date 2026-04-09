"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Download, Bus, FileText, Camera, DollarSign,
  Link2, CalendarCheck, Receipt, Settings, UserPlus, Upload,
  Shield, CheckCircle, Loader2,
} from "lucide-react";

const sections = [
  { id: "inregistrare", title: "1. Inregistrare Cont si Companie", icon: UserPlus },
  { id: "vehicule", title: "2. Adaugare Vehicule", icon: Bus },
  { id: "documente", title: "3. Incarcare Documente", icon: FileText },
  { id: "poze", title: "4. Poze Vehicule", icon: Camera },
  { id: "tarife", title: "5. Setare Tarife", icon: DollarSign },
  { id: "booking-links", title: "6. Creare Link-uri de Rezervare", icon: Link2 },
  { id: "cereri-oferte", title: "7. Cereri si Oferte", icon: CalendarCheck },
  { id: "smartbill", title: "8. Configurare SmartBill", icon: Receipt },
  { id: "contract", title: "9. Contract Template", icon: Shield },
];

export default function ManualTransportatorPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin" || profile?.role === "transporter") {
        setAuthorized(true);
      } else {
        router.push("/manual");
      }
      setLoading(false);
    }
    checkAccess();
  }, [router]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  if (!authorized) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/manual" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Inapoi la Manuale
      </Link>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white">
        <div className="flex items-center gap-3">
          <Bus className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Manual Transportator</h1>
        </div>
        <p className="mt-3 text-primary-200">Ghid complet pentru utilizarea platformei ATPSOR ca transportator</p>
        <a href="/documents/manual-transportator.pdf" download className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
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
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                <Icon className="h-4 w-4 text-gray-400" /> {s.title}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        <section id="inregistrare">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><UserPlus className="h-6 w-6 text-primary-500" /> 1. Inregistrare Cont si Companie</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Acceseaza <strong>atpsor.ro</strong> si apasa <strong>Inregistrare</strong></p>
            <p>2. Completeaza emailul si parola, apoi confirma emailul primit</p>
            <p>3. La prima autentificare, vei fi directionat catre <strong>Panoul Transportator</strong></p>
            <p>4. Completeaza datele companiei: <strong>Nume firma, CUI, Numar licenta, Adresa, Telefon, Email</strong></p>
            <p>5. CUI-ul se verifica automat prin <strong>ANAF</strong> — numele firmei se completeaza automat</p>
            <p>6. Dupa trimitere, contul intra in verificare. Adminul ATPSOR aproba contul dupa verificarea documentelor</p>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <strong>Nota:</strong> Pana la aprobare, vei vedea pagina "Cont in verificare". Dupa aprobare, ai acces complet la platforma.
            </div>
          </div>
        </section>

        <section id="vehicule">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Bus className="h-6 w-6 text-primary-500" /> 2. Adaugare Vehicule</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Din <strong>Panoul Transportator</strong>, apasa <strong>+ Adauga Vehicul</strong></p>
            <p>2. Completeaza: <strong>Nume vehicul, Marca, Model, An fabricatie, Numar locuri</strong></p>
            <p>3. Selecteaza <strong>Categoria</strong>: Ride Sharing, Microbuz, Midiautocar, Autocar, Autocar Maxi, Grand Turismo</p>
            <p>4. Bifeaza <strong>dotarile</strong>: AC, TV, Frigider, Toaleta, WiFi, USB, etc.</p>
            <p>5. Apasa <strong>Salveaza</strong> — vehiculul apare in tab-ul <strong>Vehiculele Mele</strong></p>
          </div>
        </section>

        <section id="documente">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><FileText className="h-6 w-6 text-primary-500" /> 3. Incarcare Documente</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din tab-ul <strong>Documente</strong>, incarca documentele obligatorii:</p>
            <p><strong>Documente companie:</strong> Licenta de Transport, CUI/CIF</p>
            <p><strong>Documente per vehicul:</strong></p>
            <ul className="ml-6 list-disc space-y-1">
              <li>Talon cu ITP valabil</li>
              <li>Copie Conforma (pentru vehicule {">"}9 locuri)</li>
              <li>Asigurare Bagaje si Calatori</li>
              <li>Asigurare RCA</li>
            </ul>
            <p>Fiecare document are <strong>data expirarii</strong> — platforma te notifica cand expira.</p>
          </div>
        </section>

        <section id="poze">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Camera className="h-6 w-6 text-primary-500" /> 4. Poze Vehicule</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Din tab-ul <strong>Vehiculele Mele</strong>, apasa <strong>Editeaza</strong> pe vehicul</p>
            <p>2. Incarca pana la <strong>5 poze</strong> (JPG, PNG) ale vehiculului</p>
            <p>3. Pozele apar in galeria de pe pagina de flota si in lista de transportatori</p>
          </div>
        </section>

        <section id="tarife">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><DollarSign className="h-6 w-6 text-primary-500" /> 5. Setare Tarife</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Din tab-ul <strong>Tarife</strong>, setezi pretul per km (fara TVA) pentru fiecare categorie de vehicul</p>
            <p>2. Tarifele standard ATPSOR sunt precompletate, dar le poti personaliza</p>
            <p>3. Pretul final afisat clientului include: <strong>tarif x km + TVA 21% + comision platforma 5%</strong></p>
            <p>4. Minim <strong>200 km/zi</strong> facturabili se aplica automat</p>
          </div>
        </section>

        <section id="booking-links">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Link2 className="h-6 w-6 text-primary-500" /> 6. Creare Link-uri de Rezervare</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Din tab-ul <strong>Vehiculele Mele</strong>, pe fiecare vehicul ai sectiunea <strong>Link Rezervare</strong></p>
            <p>2. Completeaza: oras plecare, oras sosire, data, pasageri, pret total</p>
            <p>3. Se genereaza un <strong>link unic</strong> pe care il trimiti clientului</p>
            <p>4. Clientul deschide link-ul, completeaza datele de facturare si plateste direct</p>
            <p>5. Plata poate fi cu <strong>card bancar</strong> sau <strong>transfer bancar</strong></p>
          </div>
        </section>

        <section id="cereri-oferte">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><CalendarCheck className="h-6 w-6 text-primary-500" /> 7. Cereri si Oferte</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. In tab-ul <strong>Cereri Disponibile</strong> vezi toate cererile de transport active</p>
            <p>2. Apasa <strong>Trimite Oferta</strong> pe cererea dorita</p>
            <p>3. Selecteaza vehiculul, seteaza pretul per km, ataseaza contractul, adauga mesaj</p>
            <p>4. Clientul primeste oferta si poate accepta + plati</p>
            <p>5. Dupa plata, rezervarea apare confirmata si vehiculul se blocheaza automat</p>
          </div>
        </section>

        <section id="smartbill">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Receipt className="h-6 w-6 text-primary-500" /> 8. Configurare SmartBill</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Din tab-ul <strong>Profil Companie</strong>, sectiunea <strong>SmartBill - Facturare Automata</strong></p>
            <p>2. Completeaza: <strong>SmartBill Email</strong> (username-ul din SmartBill)</p>
            <p>3. <strong>SmartBill Token</strong>: Mergi in SmartBill → Contul Meu → Integrari → API → copiaza Token</p>
            <p>4. <strong>Serie factura</strong>: Mergi in SmartBill → Configurare → Serii → alege seria de Factura (ex: TRANS LEI)</p>
            <p>5. Apasa <strong>Salveaza SmartBill</strong></p>
            <p>6. La fiecare plata confirmata, factura se emite <strong>automat</strong> pe firma ta in SmartBill</p>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <strong>Atentie:</strong> Seria trebuie sa fie de tip <strong>Factura</strong>, nu Proforma. Verifica in SmartBill → Configurare → Serii.
            </div>
          </div>
        </section>

        <section id="contract">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Shield className="h-6 w-6 text-primary-500" /> 9. Contract Template</h2>
          <div className="space-y-3 text-gray-700">
            <p>1. Din <strong>Profil Companie</strong>, sectiunea <strong>Contract Template</strong></p>
            <p>2. Incarca modelul tau de contract de transport (PDF)</p>
            <p>3. Contractul se ataseaza automat la fiecare oferta trimisa</p>
            <p>4. Clientul trebuie sa accepte contractul inainte de plata</p>
          </div>
        </section>
      </div>
    </div>
  );
}
