# CLAUDE.md — Context proiect ATPSOR

> **Citește ÎNTREG fișierul înainte să faci modificări.** Conține contextul de business, structura tehnică, regulile fiscale și deciziile arhitecturale luate până acum. Fără acest context, modificările pot fi greșite.

**Ultimă actualizare:** 30 aprilie 2026
**Owner:** Dan Cîrlova (`dan@luxuriatrans.ro`)
**Repo:** https://github.com/dancarlova-atpsor/ATPSOR
**Live:** https://atpsor.ro
**Database:** Supabase project `kfafifosxsrahuktwvuj` (West EU Paris)
**Hosting:** Vercel (auto-deploy on push to main)

---

## 1. CE ESTE PLATFORMA

**ATPSOR** = Asociația Transportatorilor de Persoane prin Serviciul Ocazional din România. Platformă web (atpsor.ro) pentru rezervări transport ocazional cu autocarul (cu cardul/transfer bancar).

**Cele 2 entități legale implicate:**

| Entitate | Tip | CIF | Rol |
|---|---|---|---|
| **Luxuria Trans & Travel SRL** | SRL plătitor TVA | RO31261740 | Furnizor tehnologic (deține platforma ca infrastructură) |
| **ATPSOR (Asociația)** | Asociație non-profit | 52819099 | Operator comercial (administrează platforma, primește comisioanele și taxele membri) |

**ATPSOR este OPERATORUL platformei**, **Luxuria furnizează infrastructura tehnologică**. Platforma e proprietatea Luxuria, dar ATPSOR o folosește comercial.

---

## 2. MODELUL DE BUSINESS — REGULA SACRĂ

### Comisioane

- **5% comision platformă** la fiecare rezervare → primit de **ATPSOR**
- **50% din acest comision** → plătit de ATPSOR către **Luxuria** (drept folosință platformă tehnologică)
- ATPSOR păstrează **50% net** (din care plătește costul Stripe/Netopia)

### Taxa membru

- **500 RON/an** de la fiecare transportator membru
- **Factura emisă DIRECT de ATPSOR** către transportator
- Cotizație asociație, separată de comisionul tranzacțional

### Exemplu pe 1.000 RON rezervare cu cardul

```
Client plătește: 1.000 RON
Client primește factură: 1.000 RON de la TRANSPORTATOR (direct, complet)

Transportator încasează: 950 RON cash
Transportator primește factură comision: 50 RON de la ATPSOR
Transportator profit brut: 950 RON

ATPSOR primește: 50 RON comision (5%)
ATPSOR plătește Stripe: ~17 RON (~1.7%)
ATPSOR plătește Luxuria: 25 RON (50% din comision, drept folosință platformă)
ATPSOR profit net: 8 RON

Luxuria primește: 25 RON
Luxuria profit net: 25 RON (după TVA)
```

### Facturile emise (în ordine, per rezervare)

| # | Cine emite | Cui | Sumă | Pentru |
|---|---|---|---|---|
| 1 | TRANSPORTATOR | Client | 1.000 RON | Transport ocazional persoane (TVA 21%) |
| 2 | ATPSOR | Transportator | 50 RON | Comision intermediere platformă (TVA 21%) |
| 3 | LUXURIA | ATPSOR | 25 RON | Servicii platformă tehnologică (TVA 21%) |

**FOARTE IMPORTANT:** Clientul primește factură pentru SUMA TOTALĂ (1.000 RON). Nu vede comisionul. Asta înseamnă în cod: `subtotalWithVat = totalPrice` (NU + 5% peste).

---

## 3. STACK TEHNIC

- **Framework:** Next.js 14 App Router + TypeScript
- **DB:** Supabase (PostgreSQL + RLS + Storage + Auth)
- **Plăți:** Stripe Connect (TEST mode) — _DECIZIE PENDINGĂ pentru live: Stripe sau Netopia_
- **Facturi:** SmartBill API (Luxuria + ATPSOR au conturi separate)
- **Email:** Resend pe domeniu verificat `noreply@atpsor.ro` (configurat și pe Supabase SMTP custom)
- **Hărți:** Google Maps Directions API
- **Curs valutar:** BNR XML (`https://www.bnr.ro/nbrfxrates.xml`) + 2% marjă, cache zilnic
- **i18n:** next-intl (RO/EN, default RO)

**ENV variabile critice (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY              (TEST momentan - sk_test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (TEST momentan - pk_test_)
STRIPE_WEBHOOK_SECRET
GOOGLE_MAPS_API_KEY
RESEND_API_KEY                 (Need to Rotate — exposat anterior)
NOTIFY_EMAIL
LUXURIA_NAME
LUXURIA_SMARTBILL_VAT
SMARTBILL_COMPANY_VAT          (ATPSOR CIF)
NEXT_PUBLIC_APP_URL = https://atpsor.ro
```

---

## 4. ROLURI UTILIZATORI

```sql
profiles.role IN ('client', 'transporter', 'admin', 'inspector')
```

| Rol | Permisiuni |
|---|---|
| **client** | Caută transport, face rezervări |
| **transporter** | Își gestionează vehicule, oferte, rezervări, facturi |
| **admin** | Acces complet (Dan are rolul ăsta) |
| **inspector** | Verificator/secretar — vede totul, verifică docs, postează articole, NU șterge nimic, NU schimbă roluri |

**Header.tsx logic:** admin sau inspector → `/dashboard/admin`. Transporter → `/dashboard/transporter`. Restul → `/dashboard/client`.

---

## 5. STRUCTURA DB — TABELE PRINCIPALE

### `companies` (transportatori)
Câmpuri importante:
- `id, owner_id, name, cui, address, city, county, phone, email, logo_url`
- `is_approved` (admin a aprobat contul) vs `is_verified` (apare public pe `/transporters`)
- `rating, total_reviews, pickup_cities[]`
- `stripe_account_id` (pentru Stripe Connect — momentan gol pentru toți)
- `smartbill_username, smartbill_token, smartbill_series` (intern RON, ex: `TRANS LEI`)
- `smartbill_proforma_series` (ex: `TRANSLEI`)
- `smartbill_series_external` (extern EUR, ex: `TRANS EURO`)
- `is_vat_payer` (auto-detectat din ANAF) + `vat_payer_checked_at`
- `price_per_km_external_eur` (tarif extern EUR/km, fără TVA)
- `contract_template_url, contract_template_name` (PDF contract specific transportator)

### `vehicles`
- `photos[]` (coloana NOUĂ) + `images[]` (coloana VECHE — moștenire)
- **CRITIC:** Codul verifică AMBELE coloane când caută poze (`hasPhotos = photos[].length>0 || images[].length>0`)
- Migrația 020 a sincronizat images→photos pentru vehiculele vechi

### `bookings` (rezervări)
- `is_international, currency_used, exchange_rate_used`
- `pickup_country, dropoff_country` (cod ISO: RO, BG, AT, ...)
- `client_name, client_email, client_address` (pentru contract auto-completat)
- Status: `pending_payment, confirmed, in_progress, completed, cancelled`

### `transport_requests`
- Cereri create de clienți, primesc oferte de la transportatori
- `is_international, currency, pickup_country, dropoff_country`

### `offers`
- Oferte de la transportatori la cererile clienților
- `is_international, currency`

### `articles` (CMS Activitati)
- `category` constraint: `intalniri | intalniri-autoritati | evenimente | comunicate | alte`
- `images[]` pentru galerie + `cover_image` pentru copertă
- RLS: admin/inspector pot CREATE/UPDATE/SELECT all; public vede doar `is_published=true`

### `bnr_exchange_rates`
- Cache zilnic curs EUR/RON din BNR XML
- Folosit pentru conversie automatică pe facturile de comision (RON) când cursa e în EUR

---

## 6. CURSE EXTERNE (EUR + TVA 0% SDD)

Detectare automată: dacă `pickup_country !== "RO" || dropoff_country !== "RO"` → cursă internațională.

**Pentru externe:**
- Currency: **EUR** în loc de RON
- Tarif: `companies.price_per_km_external_eur` (transportatorul setează din tab Tarife)
- TVA: **0% SDD** ("Scutit cu Drept de Deducere, art. 294 alin. (1) lit. c) Cod Fiscal")
- Serie SmartBill: `smartbill_series_external` (ex: `TRANS EURO` pentru Luxuria)
- Comision platformă convertit în RON cu cursul BNR + 2% pentru factura ATPSOR (care e mereu în RON)
- Pe pagina de căutare apare badge galben "✈️ Cursă internațională detectată"

**Pentru transportatori NEplătitori TVA:**
- TVA: **0%** cu mențiune "Neplătitor TVA conform art. 310 Cod Fiscal"
- Detectare automată din ANAF (auto-populat la onboarding și buton "Reverifică ANAF")

---

## 7. ANAF API — IMPORTANT

**Endpoint vechi DEZACTIVAT:** `https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva` (404 pentru orice CUI).

**Endpoint NOU folosit:** `https://webservicesp.anaf.ro/AsynchWebService/api/v8/ws/tva`
- POST cu `[{cui, data}]` → returnează `correlationId`
- GET cu `?id=correlationId` → returnează datele complete (`date_generale`, `inregistrare_scop_Tva`, `adresa_sediu_social`)
- Implementare: `src/lib/anaf.ts` cu polling 5 încercări, 500ms între ele

**Mapping țări** pentru Google Maps Distance API: 20+ țări mapate ISO→nume (RO→Romania, TR→Turkey, BG→Bulgaria, AT→Austria, etc). În `src/app/api/distance/route.ts`.

---

## 8. CONTRACT AUTO-GENERAT

`src/app/[locale]/contract/[bookingId]/page.tsx` — pagina publică (UUID = secret) care afișează contractul complet Luxuria (4 pagini, 11 secțiuni + Anexa 1 Regulament Conduită) cu toate datele auto-completate din booking.

**ContractPreview.tsx** — component reutilizabil arată contractul complet (expandabil, 11 secțiuni) ÎNAINTE de plată pe toate fluxurile (RequestTransportForm, book/[token], offers). Client trebuie să bifeze checkbox "Am citit și accept" + Termenii & Condițiile (`/terms`) ca să poată plăti.

---

## 9. FLUXURI DE PLATĂ ACTIVE

### A) Căutare rapidă (RequestTransportForm)
1. User selectează țări + orașe + date
2. Auto-detect tur-retur dacă există returnDate
3. Un singur apel Google Maps cu tot circuitul (`[BUC, Veliko, IST, Veliko, BUC]`) → kmTotal corect
4. Listă transportatori filtrată (extern: doar cei cu tarif EUR setat)
5. Step 3: contract preview + checkbox + plată cu cardul / transfer bancar

### B) Booking link (`/book/[token]`)
- Transportatorul creează un link special pentru un client (deja agreat în privat)
- Clientul deschide linkul, vede contractul, plătește

### C) Oferte (`/request/[id]/offers`)
- Clientul a postat o cerere → mai mulți transportatori dau oferte
- Clientul alege oferta, plătește

**Toate 3 fluxurile** trec prin:
- Stripe Connect cu `transfer_data.destination` + `application_fee_amount` (dacă transportator are stripe_account_id)
- SAU transfer bancar (proformă SmartBill emisă) — fallback dacă nu e Stripe configurat

---

## 10. INTEGRARE SMARTBILL — STARE ACTUALĂ

### Configurări per companie (în profilul transportator):
- Username + Token API SmartBill
- 3 serii: factură intern (`smartbill_series` ex: `TRANS LEI`), proformă (`smartbill_proforma_series`), factură extern (`smartbill_series_external` ex: `TRANS EURO`)

### Facturile emise automat (logica în `src/lib/invoicing.ts`):
1. **Transport:** Transportator → Client (RON sau EUR)
2. **Comision:** ATPSOR → Transportator (RON, TVA 21%, convertit din EUR cu BNR+2% dacă cursa e externă)
3. **Royalty:** Luxuria → ATPSOR (50% din comision, RON, TVA 21%)

**ATENȚIE:** Modelul actual din cod folosește numele "Luxuria → ATPSOR" pentru factura 3 dar în realitate (după clarificarea Dan din 30 aprilie) trebuie INVERS: ATPSOR e care încasează comisionul, Luxuria primește 50% pentru serviciul tehnologic. **TODO: corectează direcția în `src/lib/invoicing.ts`**.

### Fluxul facturii la plata cu cardul:
1. Webhook Stripe primește `checkout.session.completed`
2. `generateAllInvoices()` apelează SmartBill pentru cele 3 facturi
3. Factura transport e marcată "încasată" automat (`registerPayment` cu type "Card")
4. PDF factură atașat în email Resend către client

### Fluxul la transfer bancar:
1. `generateAllInvoices` cu `paymentMethod: "bank_transfer"` → emite PROFORMĂ în loc de factură
2. La confirmarea plății bancare (admin/transporter), `/api/booking/confirm-payment` șterge proforma DB și emite factură fiscală reală

---

## 11. AUTH & EMAIL

**Resetare parolă** (rezolvată recent — SMOTOCEL nu putea, link-ul ducea la login):
- `/auth/forgot-password` — user introduce email, primește link
- `/auth/reset-password` — pagina de reset (din email link)
- Supabase SMTP CUSTOM configurat cu Resend (`noreply@atpsor.ro`)
- Site URL Supabase: `https://atpsor.ro`
- Redirect URLs: `https://atpsor.ro/**` (wildcard)
- Template email "Reset Password" personalizat în română cu brand ATPSOR

---

## 12. PAGINĂ PUBLICĂ TRANSPORTATORI (`/transporters`)

**Filtru pentru pagina publică:**
1. Companie are cel puțin 1 document încărcat (`company_documents`)
2. Companie are cel puțin 1 vehicul cu poze (`photos[]` SAU `images[]` non-empty)
3. Companie e marcată `is_verified = true` (admin a apăsat "Aprobă & Publică")

**API:** `/api/public/transporters` (server-side, service role pentru bypass RLS pe `company_documents`).
**Cache:** `force-dynamic` + `revalidate=0` ca să fie mereu fresh.
**Sortare:** Luxuria mereu prima, restul după `created_at ASC` (data înscrierii).

---

## 13. ADMIN PANEL & VERIFICARE

- Admin & Inspector au acces la `/dashboard/admin`
- Pe lista companii: status compact "PUBLICĂ" (verde) sau "Nu apare public" (cu motive concrete)
- Buton singur "Deschide companie →" (nu mai sunt 5 butoane)
- Pe pagina detaliu companie: banner mare cu **un singur buton "Aprobă & Publică"** care setează `is_approved=true` AND `is_verified=true` simultan
- Documente companii + vehicule: viewer inline (modal cu iframe pentru PDF, img pentru imagini)
- **Inspector:** dropdown rol e read-only, nu poate șterge utilizatori/companii

---

## 14. ARTICLES CMS (`/activitati`)

- 5 categorii: `intalniri`, `intalniri-autoritati`, `evenimente`, `comunicate`, `alte`
- CHECK constraint în DB include toate 5 (migrația 023)
- Cover image cropat aspect-[4/3] (nu aspect-video) ca să nu taie capetele oamenilor
- Galerie foto separată (până la 10 poze)
- ArticlesManager cu logging `[ArticlesManager]` în Console + alert visible pentru erori
- RLS: admin/inspector pot CRUD; public vede doar `is_published=true`

---

## 15. MIGRAȚII DB (CRONOLOGIE)

```
017 — booking_contract_data        Coloane pentru contract auto-completat
018 — document_delete_policies     Owner + admin pot șterge docs
019 — external_trips_vat            Curse externe + plătitor TVA + curs BNR
020 — sync_vehicle_images_to_photos Migrare images→photos legacy
021 — bookings_update_policy        Transportatori pot UPDATE status booking
022 — inspector_role                Rol nou + RLS policies
023 — articles_intalniri_autoritati_category Add categorie nouă în CHECK constraint
```

**TOATE rulate deja în production**.

---

## 16. PROBLEME CUNOSCUTE / TO-DO

### TO-DO urgent:
1. **Decide între Stripe și Netopia** pentru live (Dan vorbește cu Netopia — așteptăm răspuns)
2. **Inversează logica facturilor** din `src/lib/invoicing.ts`:
   - ATPSOR → Transportator: 50 RON comision (NU Luxuria → Transportator)
   - Luxuria → ATPSOR: 25 RON servicii platformă (NU Luxuria → ATPSOR royalty marcă)
3. **Implementează butonul "Conectează Stripe Connect"** în Dashboard Transportator (~30 min)
4. **Taxa anuală membri ATPSOR (500 RON/an)** — nu e implementată încă, trebuie:
   - Tab nou în admin pentru gestionare membri
   - Factură ATPSOR → transportator la înscriere/anual
   - Tracking expirare cotizație

### TO-DO mediu:
5. **Rotire RESEND_API_KEY** (badge "Need To Rotate" în Vercel — fost expus public)
6. **Stripe → Live keys** când totul e gata + transportatorii își conectează contul
7. **Pagina /terms** există dar conținutul poate fi îmbunătățit

### Restricții importante:
- **NU TREBUIE schimbat** prețul afișat clientului (e suma totală 1000, nu 950 + 50)
- **NU TREBUIE șters** coloana `vehicles.images` (legacy, încă folosită ca fallback)
- **NU TREBUIE modificate** seriile SmartBill ale Luxuriei (LTT, LTTCURS, LTT EURO, FPROF) — sunt pentru ALTE servicii Luxuria, nu pentru ATPSOR

---

## 17. DECIZII LUATE PÂNĂ ACUM (NU LE SCHIMBA FĂRĂ DAN)

1. **Comision platformă: 5%** (configurabil în `src/lib/distances.ts` — `PLATFORM_FEE_RATE`)
2. **Split comision: 50% Luxuria / 50% ATPSOR** (`LUXURIA_COMMISSION_RATE` în `src/lib/invoicing.ts`)
3. **Stripe fee suportat de ATPSOR** (logic, nu mecanic — Luxuria îl deduce din transferul către ATPSOR)
4. **Curs valutar EUR/RON: BNR + 2%** marjă
5. **TVA România: 21%**
6. **Min KM pe zi: 200**
7. **Tarife default per categorie vehicul:** ridesharing 2.5, microbuz 4.5, midiautocar 6.5, autocar 7.5, autocar_maxi 8.5, autocar_grand_turismo 9.5
8. **Coloana de poze CANONICĂ:** `photos[]` (codul are fallback la `images[]` pentru legacy)
9. **Limba default:** Romana (RO)
10. **Domeniu email:** noreply@atpsor.ro

---

## 18. UTILIZATORI ÎN SISTEM (la 30 aprilie 2026)

| Email | Nume | Rol |
|---|---|---|
| dan@luxuriatrans.ro | Dan Cîrlova | admin |
| smotoceltrans@yahoo.com | Ciutacu George (SMOTOCEL) | inspector (secretar) |
| dancarlova@gmail.com | Dan Cîrlova (test) | transporter |
| stancugabriel2481@gmail.com | Stancu Marian Gabriel | transporter |
| cristi_felecanu@yahoo.com | Cristian Felecanu | transporter |
| bogdanfloarea77@gmail.com | Floarea Alexandru Bogdan | transporter |
| quickridebus@gmail.com | Ionut Gagiu | transporter |

**Companii public-vizibile (după aprobare):**
- Luxuria Trans & Travel SRL (RO31261740) — Bragadiru, Ilfov
- SMOTOCEL SRL (RO35050877) — București
- (alte 3 sunt înregistrate dar nu au docs/poze complete)

---

## 19. WORKFLOW DEZVOLTARE

### Local dev:
```bash
cd C:\Users\danci\ATPSOR
npm install
npm run dev    # rulează pe localhost:3000
```

### Verifică TS:
```bash
npx tsc --noEmit
```

### Commit + deploy:
```bash
git add <files>
git commit -m "..."
git push origin main
# Vercel auto-deploys ~1-2 min
```

### DB direct (pentru migrații sau debug):
- Supabase SQL Editor: https://supabase.com/dashboard/project/kfafifosxsrahuktwvuj/sql
- Sau via MCP `mcp__supabase__execute_sql`

### Migrații:
- Toate în `supabase/migrations/` — naming convention: `XXX_description.sql`
- **IMPORTANT:** rulează direct în Supabase SQL Editor, NU se aplică automat la push

---

## 20. STIL DE COMUNICARE CU DAN

- **Răspunde scurt și direct** — Dan e foarte ocupat, nu agreează răspunsuri lungi
- **Acțiuni concrete** > explicații teoretice
- **Confirmă cu numere și exemple** — Dan vrea claritate
- **Nu propune ajutor cu X dacă X funcționează deja** — întreabă întâi
- **Folosește română** (rar engleză pentru termeni tehnici)
- **Comentariile în cod în română** sau engleză — păstrează stilul existent
- **Commit messages în română** (păstrează stilul: descriere problemă + fix)

---

## 21. REPERE ARHITECTURALE

```
src/
├── app/
│   ├── [locale]/           # Pagini publice și private (RO/EN)
│   │   ├── activitati/     # CMS articole
│   │   ├── auth/           # Login/register/forgot-password/reset-password
│   │   ├── book/[token]/   # Booking link unic transportator
│   │   ├── contract/[bookingId]/  # Contract auto-completat (UUID secret)
│   │   ├── dashboard/
│   │   │   ├── admin/      # Panou admin/inspector
│   │   │   ├── client/     # Panou client
│   │   │   └── transporter/ # Panou transportator
│   │   ├── request/        # Căutare rapidă transport
│   │   ├── transporters/   # Listă publică transportatori
│   │   ├── activitati/     # Pagină publică articole
│   │   └── terms/          # Termeni și condiții
│   └── api/
│       ├── stripe/         # Checkout + webhook
│       ├── booking/        # Bank transfer + confirm-payment + contract
│       ├── public/transporters/  # API public listă transportatori
│       ├── distance/       # Google Maps Directions
│       ├── anaf/           # Verificare CUI
│       └── companies/refresh-anaf/  # Reverificare ANAF auto
├── components/
│   ├── admin/ArticlesManager.tsx
│   ├── contract/ContractPreview.tsx  # Component reutilizabil contract
│   ├── layout/Header.tsx
│   ├── request/RequestTransportForm.tsx  # Componenta principală căutare
│   └── transporters/TransportersList.tsx  # Listă publică
├── lib/
│   ├── anaf.ts            # ANAF async API + verifyCUI
│   ├── bnr.ts             # Curs BNR + cache
│   ├── distances.ts       # Pricing logic + opts pt extern/non-VAT
│   ├── invoicing.ts       # Orchestrare facturi SmartBill (3 facturi)
│   ├── smartbill.ts       # SmartBill API client
│   └── emails.ts          # Resend templates
└── types/database.ts      # Tipuri TypeScript pentru tabele Supabase
```

---

## 22. CONTACT & DOCUMENTAȚIE EXTERNĂ

- **Stripe Dashboard:** https://dashboard.stripe.com (cont Luxuria)
- **SmartBill:** https://www.smartbill.ro (Luxuria + posibil ATPSOR separat)
- **Vercel:** https://vercel.com/dancarlova-4583s-projects/atpsor
- **Supabase:** https://supabase.com/dashboard/project/kfafifosxsrahuktwvuj
- **Resend:** https://resend.com (domeniu verificat atpsor.ro)

---

**Pentru orice modificare semnificativă, consulță Dan înainte. Platforma e LIVE și are utilizatori reali (transportatori).**
