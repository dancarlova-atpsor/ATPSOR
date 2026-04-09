"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Download, Shield, Building2, Users, FileText,
  MessageSquare, CalendarCheck, Receipt, Newspaper, CheckCircle,
  Trash2, Settings, Loader2,
} from "lucide-react";

const sections = [
  { id: "companii", title: "1. Gestionare Companii", icon: Building2 },
  { id: "conturi", title: "2. Gestionare Conturi Utilizatori", icon: Users },
  { id: "cereri", title: "3. Gestionare Cereri de Transport", icon: FileText },
  { id: "oferte", title: "4. Oferte si Rezervari", icon: CalendarCheck },
  { id: "facturi", title: "5. Gestionare Facturi", icon: Receipt },
  { id: "activitati", title: "6. Publicare Activitati", icon: Newspaper },
  { id: "documente", title: "7. Verificare Documente", icon: CheckCircle },
];

export default function ManualAdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin") {
        setAuthorized(true);
      } else {
        router.push("/manual");
      }
      setLoading(false);
    }
    checkAccess();
  }, [router]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  if (!authorized) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/manual" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Inapoi la Manuale
      </Link>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-8 text-white">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Manual Admin</h1>
        </div>
        <p className="mt-3 text-purple-200">Ghid complet pentru administrarea platformei ATPSOR</p>
        <a href="/documents/manual-admin.pdf" download className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30">
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
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600">
                <Icon className="h-4 w-4 text-gray-400" /> {s.title}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="space-y-10">
        <section id="companii">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Building2 className="h-6 w-6 text-purple-500" /> 1. Gestionare Companii</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>Panou Admin → tab Companii</strong>:</p>
            <p><strong>Aprobare:</strong> Companiile noi apar cu status "Neaprobat". Verifica documentele, apoi apasa <strong>Aproba</strong>.</p>
            <p><strong>Suspendare:</strong> Selecteaza "Suspended" din dropdown pentru a suspenda temporar o companie.</p>
            <p><strong>Stergere:</strong> Apasa butonul de stergere (cos de gunoi) — vehiculele si ofertele asociate se dezactiveaza automat.</p>
            <p><strong>Acces panou transportator:</strong> Apasa "Vezi panoul" pentru a accesa dashboard-ul transportatorului si a vedea ce vede el.</p>
          </div>
        </section>

        <section id="conturi">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Users className="h-6 w-6 text-purple-500" /> 2. Gestionare Conturi</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>tab Utilizatori</strong> vezi toti utilizatorii inregistrati.</p>
            <p>Fiecare utilizator are un <strong>rol</strong>: client, transporter, admin.</p>
            <p>Poti schimba rolul unui utilizator din dropdown-ul de actiuni.</p>
          </div>
        </section>

        <section id="cereri">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><FileText className="h-6 w-6 text-purple-500" /> 3. Gestionare Cereri</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>tab Cereri</strong> vezi toate cererile de transport cu traseu, data, pasageri, status.</p>
            <p><strong>Schimbare status:</strong> Pending → Active → Fulfilled → Cancelled/Expired</p>
            <p><strong>Stergere:</strong> Apasa butonul de stergere — vehiculele se deblocheaza automat.</p>
            <p><strong>Anulare:</strong> La schimbarea in "Cancelled", vehiculul se deblocheaza si booking-urile se anuleaza.</p>
          </div>
        </section>

        <section id="oferte">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><CalendarCheck className="h-6 w-6 text-purple-500" /> 4. Oferte si Rezervari</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>tab Oferte & Rezervari</strong> vezi toate ofertele trimise si booking-urile confirmate.</p>
            <p>Fiecare booking arata: traseu, client, transportator, suma, status plata.</p>
            <p>Booking-urile din transfer bancar apar cu status <strong>pending_payment</strong> pana la confirmarea platii.</p>
          </div>
        </section>

        <section id="facturi">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Receipt className="h-6 w-6 text-purple-500" /> 5. Gestionare Facturi</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>tab Facturi</strong> vezi toate facturile generate SmartBill.</p>
            <p><strong>3 facturi per booking:</strong> Transport (transportator → client), Comision ATPSOR, Comision Luxuria</p>
            <p><strong>Actiuni disponibile:</strong></p>
            <ul className="ml-6 list-disc space-y-1">
              <li><strong>Download PDF</strong> — descarca factura din SmartBill</li>
              <li><strong>Trimite email</strong> — trimite factura pe email clientului</li>
              <li><strong>Anuleaza</strong> — anuleaza factura in SmartBill</li>
              <li><strong>Storneaza</strong> — creaza storno in SmartBill</li>
            </ul>
          </div>
        </section>

        <section id="activitati">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Newspaper className="h-6 w-6 text-purple-500" /> 6. Publicare Activitati</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>tab Activitati</strong> publici stirile si activitatile asociatiei:</p>
            <p>1. Apasa <strong>Adauga Articol</strong></p>
            <p>2. Completeaza: titlu, categorie (intalniri / evenimente / comunicate / alte), continut, rezumat</p>
            <p>3. Incarca <strong>poza de coperta</strong> si <strong>galerie de imagini</strong> (de la intalniri, evenimente)</p>
            <p>4. Salveaza ca <strong>ciorna</strong> sau publica direct</p>
            <p>5. Articolele publicate apar pe pagina <strong>atpsor.ro/activitati</strong>, vizibila de toti vizitatorii</p>
            <p>6. Poti edita sau sterge articolele oricand</p>
          </div>
        </section>

        <section id="documente">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><CheckCircle className="h-6 w-6 text-purple-500" /> 7. Verificare Documente</h2>
          <div className="space-y-3 text-gray-700">
            <p>Din <strong>tab Documente</strong> vezi documentele incarcate de transportatori.</p>
            <p>Documentele neverificate apar primele, cu badge "Neverificat".</p>
            <p>Apasa <strong>Verifica</strong> dupa ce confirmi ca documentul e valid si in termen.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
