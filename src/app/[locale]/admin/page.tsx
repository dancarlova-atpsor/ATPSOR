"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  Shield,
  Users,
  Bus,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Ban,
  Search,
  BarChart3,
  Settings,
  BookOpen,
} from "lucide-react";

// Demo data
const DEMO_USERS = [
  { id: "1", name: "Ion Popescu", email: "ion@gmail.com", role: "transporter", created: "2026-04-03", status: "activ" },
  { id: "2", name: "Maria Ionescu", email: "maria@yahoo.com", role: "client", created: "2026-04-04", status: "activ" },
  { id: "3", name: "SC TransEuropa SRL", email: "office@transeuropa.ro", role: "transporter", created: "2026-04-05", status: "activ" },
  { id: "4", name: "Andrei Vasile", email: "andrei@gmail.com", role: "client", created: "2026-04-05", status: "activ" },
  { id: "5", name: "SC Royal Class SRL", email: "contact@royalclass.ro", role: "transporter", created: "2026-04-06", status: "pending" },
];

const DEMO_REQUESTS = [
  { id: "r1", client: "Maria Ionescu", route: "București → Brașov", date: "2026-04-15", passengers: 40, status: "active", price: 3052 },
  { id: "r2", client: "Andrei Vasile", route: "Cluj → Sibiu", date: "2026-04-20", passengers: 15, status: "pending", price: null },
  { id: "r3", client: "Elena Dumitrescu", route: "Timișoara → Arad", date: "2026-04-25", passengers: 25, status: "fulfilled", price: 1850 },
];

const DEMO_PAYMENTS = [
  { id: "p1", client: "Maria Ionescu", transporter: "TransEuropa SRL", amount: 3052, date: "2026-04-06", status: "paid", route: "București → Brașov" },
  { id: "p2", client: "Elena Dumitrescu", transporter: "Royal Class SRL", amount: 1850, date: "2026-04-05", status: "paid", route: "Timișoara → Arad" },
  { id: "p3", client: "Andrei Vasile", transporter: "DaciaTransport SRL", amount: 2400, date: "2026-04-04", status: "refunded", route: "Cluj → Oradea" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "requests" | "payments" | "manual">("overview");

  const tabs = [
    { key: "overview" as const, label: "Prezentare Generală", icon: BarChart3 },
    { key: "users" as const, label: "Utilizatori", icon: Users },
    { key: "requests" as const, label: "Cereri Transport", icon: FileText },
    { key: "payments" as const, label: "Plăți / Facturi", icon: CreditCard },
    { key: "manual" as const, label: "Manual Platformă", icon: BookOpen },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
          <Shield className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panou Administrator</h1>
          <p className="text-sm text-gray-500">Administrare platformă ATPSOR</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
                activeTab === tab.key ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Utilizatori", value: DEMO_USERS.length, icon: Users, color: "bg-blue-100 text-blue-600" },
              { label: "Transportatori", value: DEMO_USERS.filter(u => u.role === "transporter").length, icon: Bus, color: "bg-green-100 text-green-600" },
              { label: "Cereri Active", value: DEMO_REQUESTS.filter(r => r.status !== "fulfilled").length, icon: FileText, color: "bg-orange-100 text-orange-600" },
              { label: "Venituri Platformă", value: "274 RON", icon: CreditCard, color: "bg-purple-100 text-purple-600" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white p-5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-white p-6 shadow-md">
            <h3 className="mb-4 font-semibold text-gray-900">Activitate Recentă</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>SC Royal Class SRL s-a înregistrat ca transportator</span>
                <span className="ml-auto text-xs text-gray-400">acum 2h</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <span>Plată 3,052 RON procesată - București → Brașov</span>
                <span className="ml-auto text-xs text-gray-400">acum 5h</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <FileText className="h-4 w-4 text-orange-500" />
                <span>Cerere nouă: Cluj → Sibiu, 15 pasageri</span>
                <span className="ml-auto text-xs text-gray-400">ieri</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Document expirat: ITP - SC TransEuropa - vehicul MAN</span>
                <span className="ml-auto text-xs text-gray-400">ieri</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Caută utilizator..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl bg-white shadow-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Nume</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Înregistrat</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DEMO_USERS.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "transporter" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                      }`}>{user.role === "transporter" ? "Transportator" : "Client"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.created}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.status === "activ" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                      }`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-gray-400 hover:text-blue-500"><Eye className="h-4 w-4" /></button>
                        <button className="text-gray-400 hover:text-red-500"><Ban className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requests */}
      {activeTab === "requests" && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-md">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Traseu</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Pasageri</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Preț</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEMO_REQUESTS.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{req.client}</td>
                  <td className="px-4 py-3">{req.route}</td>
                  <td className="px-4 py-3 text-gray-500">{req.date}</td>
                  <td className="px-4 py-3">{req.passengers}</td>
                  <td className="px-4 py-3 font-medium">{req.price ? `${req.price} RON` : "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      req.status === "fulfilled" ? "bg-green-50 text-green-600" :
                      req.status === "active" ? "bg-blue-50 text-blue-600" : "bg-yellow-50 text-yellow-600"
                    }`}>{req.status === "fulfilled" ? "Finalizată" : req.status === "active" ? "Activă" : "În așteptare"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments */}
      {activeTab === "payments" && (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-green-50 p-4">
              <div className="text-sm text-green-600">Total Încasat</div>
              <div className="text-2xl font-bold text-green-700">4,902 RON</div>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="text-sm text-blue-600">Comision Platformă (5%)</div>
              <div className="text-2xl font-bold text-blue-700">147 RON</div>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <div className="text-sm text-red-600">Rambursări</div>
              <div className="text-2xl font-bold text-red-700">2,400 RON</div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl bg-white shadow-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Transportator</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Traseu</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Sumă</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DEMO_PAYMENTS.map((pay) => (
                  <tr key={pay.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{pay.client}</td>
                    <td className="px-4 py-3">{pay.transporter}</td>
                    <td className="px-4 py-3 text-gray-500">{pay.route}</td>
                    <td className="px-4 py-3 font-bold">{pay.amount.toLocaleString()} RON</td>
                    <td className="px-4 py-3 text-gray-500">{pay.date}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        pay.status === "paid" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      }`}>{pay.status === "paid" ? "Plătit" : "Rambursat"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Manual de Administrare ATPSOR</h2>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-bold">1</span>
                  Înregistrare Transportator
                </h3>
                <div className="ml-9 space-y-2 text-sm text-gray-600">
                  <p>Transportatorul intră pe <strong>atpsor.ro</strong> → click <strong>Înregistrare</strong> → selectează <strong>"Transportator"</strong>.</p>
                  <p>Completează: nume companie, email, telefon, parolă → primește email de confirmare.</p>
                  <p>După confirmare se loghează și ajunge în <strong>Dashboard Transportator</strong>.</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-bold">2</span>
                  Adăugare Vehicule și Documente
                </h3>
                <div className="ml-9 space-y-2 text-sm text-gray-600">
                  <p>Din Dashboard → <strong>Adaugă Vehicul</strong> → completează detalii (categorie, locuri, marcă, model, an).</p>
                  <p>Încarcă <strong>poze</strong> cu vehiculul (interior + exterior).</p>
                  <p>Încarcă <strong>documentele obligatorii</strong>:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Talon cu ITP valabil + data expirării</li>
                    <li>Asigurare RCA + data expirării</li>
                    <li>Copie conformă (doar vehicule peste 9 locuri)</li>
                    <li>Asigurare bagaje și călători (doar vehicule peste 9 locuri)</li>
                  </ul>
                  <p>La nivel de firmă: <strong>Licența de transport</strong> se încarcă în tab-ul Documente.</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-bold">3</span>
                  Cerere de Transport (Client)
                </h3>
                <div className="ml-9 space-y-2 text-sm text-gray-600">
                  <p>Clientul intră pe <strong>Caut Transport</strong> → completează: oraș plecare, destinație, dată, nr. pasageri, tip vehicul.</p>
                  <p>Platforma <strong>calculează automat</strong> distanța și prețul (tarif/km + TVA 21%).</p>
                  <p>Minim <strong>200 km/zi</strong> facturabili. Comisionul platformei (5%) este inclus automat.</p>
                  <p>Clientul poate plăti direct cu cardul (Stripe) sau poate aștepta oferte de la transportatori.</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-bold">4</span>
                  Ofertă cu Contract (Transportator)
                </h3>
                <div className="ml-9 space-y-2 text-sm text-gray-600">
                  <p>Transportatorul vede cererile în Dashboard → click <strong>Trimite Ofertă</strong>.</p>
                  <p>Selectează vehicul, pune preț, încarcă <strong>contractul de transport (PDF)</strong>.</p>
                  <p>Clientul primește oferta, <strong>citește contractul</strong>, bifează acceptare, apoi <strong>plătește</strong>.</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-bold">5</span>
                  Categorii Vehicule și Tarife
                </h3>
                <div className="ml-9">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left text-gray-500">Categorie</th>
                        <th className="py-2 text-left text-gray-500">Locuri</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      <tr className="border-b"><td className="py-2">Ride Sharing</td><td>3+1 - 8+1</td></tr>
                      <tr className="border-b"><td className="py-2">Microbuz</td><td>9 - 23</td></tr>
                      <tr className="border-b"><td className="py-2">Midiautocar</td><td>24 - 35</td></tr>
                      <tr className="border-b"><td className="py-2">Autocar</td><td>36 - 52</td></tr>
                      <tr className="border-b"><td className="py-2">Autocar Maxi</td><td>53 - 60</td></tr>
                      <tr><td className="py-2">Autocar Grand Turismo</td><td>61 - 80</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary-600">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-bold">6</span>
                  Plăți
                </h3>
                <div className="ml-9 space-y-2 text-sm text-gray-600">
                  <p>Plățile se procesează prin <strong>Stripe</strong> (Visa, Mastercard).</p>
                  <p>TVA: <strong>21%</strong>. Comision platformă: <strong>5%</strong> (inclus automat, invizibil clientului).</p>
                  <p>Transportatorul primește suma minus comisionul în contul Stripe.</p>
                  <p>Rambursări: peste 48h = 100%, 24-48h = 50%, sub 24h = 0%.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
