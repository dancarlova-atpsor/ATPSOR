# CLAUDE.md — Context proiect ATPSOR

> **Citește ÎNTREG fișierul înainte să faci modificări.** Conține contextul de business, structura tehnică, deciziile arhitecturale, lecțiile învățate (ce NU a mers) și strategia de decizie pentru situații ambigue. Fără acest context, modificările pot fi greșite sau pot repeta greșelile anterioare.

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
- **NU e încă implementată în cod** (TODO)

### Exemplu pe 1.000 RON rezervare cu cardul

```
Client plătește: 1.000 RON
Client primește factură: 1.000 RON de la TRANSPORTATOR (direct, complet, NIMIC despre comision)

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

**FOARTE IMPORTANT:** Clientul primește factură pentru SUMA TOTALĂ (1.000 RON). Nu vede comisionul. Asta înseamnă în cod: `totalPrice = subtotalWithVat` (NU + 5% peste).

### Reguli din contract (în Luxuria template + cod)

- **Min 200 km/zi billing** (regula minimă: chiar dacă rulezi mai puțin, plătești 200 km × nr zile)
- **Penalitate 1%/zi** din valoarea facturii pentru plată întârziată
- **Penalitate 50%** din valoarea totală dacă decomandare < 15 zile înainte de plecare
- **Km suplimentari peste contract:** 10 lei/km + TVA
- **Lista turiștilor:** max 2 zile înainte de plecare (obligație beneficiar)
- **Programul rute omologate:** max 5 zile înainte (obligație beneficiar)
- **Diurne șoferi + vize:** suportate de TRANSPORTATOR
- **Taxe drum + vignete:** suportate de TRANSPORTATOR
- **Cazare șoferi (camere similare turiștilor) + 3 mese/zi:** suportate de BENEFICIAR

### Tarife default per categorie vehicul (RON/km fără TVA, fallback dacă transportatorul n-a setat)

```ts
ridesharing: 2.50
microbuz: 4.50
midiautocar: 6.50
autocar: 7.50
autocar_maxi: 8.50
autocar_grand_turismo: 9.50
```
În `src/lib/distances.ts` ca `TARIFFS`.

---

## 3. STACK TEHNIC

- **Framework:** Next.js 14 App Router + TypeScript
- **DB:** Supabase (PostgreSQL + RLS + Storage + Auth)
- **Plăți:** Stripe Connect **Destination Charges** (TEST mode) — _DECIZIE PENDINGĂ pentru live: Stripe sau Netopia_
- **Facturi:** SmartBill API (Luxuria + ATPSOR au conturi separate)
- **Email:** Resend pe domeniu verificat `noreply@atpsor.ro` (configurat și pe Supabase SMTP custom)
- **Hărți:** Google Maps Directions API
- **Curs valutar:** BNR XML (`https://www.bnr.ro/nbrfxrates.xml`) + 2% marjă, cache zilnic în tabela `bnr_exchange_rates`
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

### Stripe Connect — detalii tehnice

- **Mode folosit:** Destination Charges (NU Direct Charges, NU Separate Transfers)
- Folosim `transfer_data.destination = transporterStripeAccountId` + `application_fee_amount`
- **Webhook URL pentru live:** `https://atpsor.ro/api/stripe/webhook` (de configurat în Stripe Dashboard)
- **Checkout currency** este dinamic (`ron` sau `eur`) bazat pe `trip.is_international`
- **Stripe deduce taxa de procesare** din contul platformei (Luxuria în setup-ul actual)
- Pentru live, transportatorii trebuie să-și creeze cont Stripe Connect Express prin onboarding (NU implementat încă, e TODO)

### SmartBill — detalii tehnice

- **Auth:** Basic header `Basic <base64(username:token)>`
- **Endpoint:** `https://ws.smartbill.ro/SBORO/api`
- **Operații:** `/invoice`, `/payment`, `/estimate` (proforma), `/invoice/pdf`, `/estimate/pdf`
- Codul în `src/lib/smartbill.ts`
- Orchestrare 3 facturi în `src/lib/invoicing.ts` → `generateAllInvoices()`

### BNR XML

- Endpoint: `https://www.bnr.ro/nbrfxrates.xml`
- Parser regex: `<Rate currency="EUR">4.9765</Rate>`
- Cache în tabela `bnr_exchange_rates` (date PRIMARY KEY)
- Marjă: +2% peste cursul oficial (`BNR_MARGIN = 0.02` în `src/lib/bnr.ts`)

### Storage Supabase

- **Bucket folosit:** `uploads` (public read, auth users can write)
- **Folder convention:**
  - `articles/covers/` — coperti articole
  - `articles/gallery/` — galerie articole
  - `vehicule/{vehicleId}/` — poze vehicule (NUME LEGACY: în prefix `vehicles/{vehicleId}/` la data 8 aprilie)
  - `documente/` — documente companii
  - `logos/{companyId}/` — logo-uri companii

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
- `photos[]` (coloana NOUĂ canonică) + `images[]` (coloana VECHE — moștenire)
- **CRITIC:** Codul verifică AMBELE coloane când caută poze (`hasPhotos = photos[].length>0 || images[].length>0`)
- Migrația 020 a sincronizat images→photos pentru vehiculele vechi
- **NU șterge coloana `images`** — încă folosită ca fallback

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

## 7. ANAF API — IMPORTANT (LECȚIE ÎNVĂȚATĂ)

**❌ Endpoint vechi DEZACTIVAT:** `https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva` (404 pentru ORICE CUI, plătitor TVA sau nu).

**❌ Endpoint v9 inexistent:** `PlatitorTvaRest/api/v9/ws/tva` → 404.

**✅ Endpoint NOU folosit:** `https://webservicesp.anaf.ro/AsynchWebService/api/v8/ws/tva`
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

**⚠️ TODO CRITIC:** Codul actual din `src/lib/invoicing.ts` are ÎNCĂ direcție veche (Luxuria → Transportator pentru comision și Luxuria → ATPSOR). După clarificarea Dan din 30 aprilie, **trebuie inversat:**
- ATPSOR → Transportator: 50 RON comision (NU Luxuria → Transportator)
- Luxuria → ATPSOR: 25 RON servicii platformă (DIRECȚIE OK, dar text trebuie schimbat din "royalty marcă" în "servicii platformă tehnologică")

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

**Pentru migrații noi:** următorul număr e `024`. NU modifica migrațiile existente — creează una nouă.

---

## 16. ⚠️ LECȚII ÎNVĂȚATE — CE NU A MERS (NU REPETA)

### 16.1. ANAF API
- **Greșit:** `PlatitorTvaRest/api/v8/ws/tva` și `v9/ws/tva` → 404 pentru orice CUI
- **Greșit:** Adăugarea hardcoded `, Romania` la fiecare oraș în Google Maps → ruta nu se găsea pentru orașe străine (Istanbul, Veliko Tarnovo)
- **Corect:** AsynchWebService cu correlationId pattern (POST + GET polling)
- **Corect:** Mapare ISO țară (RO→Romania, TR→Turkey) trimisă explicit în `/api/distance`

### 16.2. Pagina publică transportatori
- **Greșit:** Filtrarea pe client-side cu `supabase.from("company_documents").select()` → returna [] gol din cauza RLS pe userii anonimi
- **Greșit:** Cache Vercel pe `/api/public/transporters` returna lista veche
- **Corect:** API server-side cu service role + `export const dynamic = "force-dynamic"` + `revalidate = 0`

### 16.3. SMOTOCEL nu se putea loga
- **Cauza:** Folosea email greșit (`g.ciutacu13@yahoo.com` în loc de `smotoceltrans@yahoo.com`)
- **NU era bug** la auth platform — era utilizator confuz
- **Lecție:** când un user spune că nu se loghează, întâi verifică în DB ce email are, apoi verifică flow-ul auth

### 16.4. Forgot password
- **Greșit:** Linkul "Am uitat parola" pointa la `/auth/login` (aceeași pagină, pagina forgot-password nu exista)
- **Corect:** Pagini noi `/auth/forgot-password` + `/auth/reset-password` + Supabase SMTP custom Resend

### 16.5. Articole CMS — categorie nouă
- **Greșit:** Adăugat categoria `intalniri-autoritati` în UI dar **uitat** să updatez CHECK constraint în DB
- **Eroare:** `new row for relation "articles" violates check constraint "articles_category_check"`
- **Corect:** Migrația 023 cu noul ARRAY ce include categoria nouă

### 16.6. Inspector RLS
- **Greșit:** Adăugat policy `Inspectors can view all profiles` cu EXISTS pe `profiles` → recursie / interferență cu fetch-ul role-ului
- **Corect:** DROP policy. Folosim "Profiles viewable by everyone" (qual=true) care există deja și acoperă cazul

### 16.7. Header rol inspector
- **Greșit:** `if (userRole === "admin") return "/dashboard/admin"; else return "/dashboard/client"` → inspectorul mergea pe `/dashboard/client`
- **Corect:** `if (userRole === "admin" || userRole === "inspector") return "/dashboard/admin"`

### 16.8. Pozele Luxuria invizibile
- **Cauza:** Pozele erau în coloana `vehicles.images` (legacy) dar codul nou căuta în `vehicles.photos`
- **Corect:** Migrația 020 sincronizează images→photos pentru vehiculele vechi + cod fallback (`photos[].length>0 || images[].length>0`)

### 16.9. Cookie cache Chrome
- **Simptom:** Dan a fost redirectat la `/dashboard/client` deși era admin → meniul afișa "Dashboard" în loc de "Admin"
- **Cauza:** Cookie-uri Supabase corupte în Chrome normal (după migrațiile RLS rapide)
- **Workaround:** Incognito (Ctrl+Shift+N) pentru a confirma că codul merge OK
- **Fix permanent:** `Ctrl+Shift+Delete` → șterge cookies și cache → re-login

### 16.10. Stripe Connect mode
- **Considerat:** Direct Charges (transportatorul e MoR) — REFUZAT, complica facturarea
- **Considerat:** Separate Charges and Transfers — REFUZAT, prea manual
- **Corect:** Destination Charges cu `transfer_data.destination` + `application_fee_amount`

---

## 17. DECIZII ABANDONATE / SCHIMBATE PE PARCURS

### 17.1. Calcul preț client
- **Vechi (REFUZAT):** `totalPrice = subtotalWithVat + platformFee` (5% peste prețul transportului)
  - Clientul ar plăti 1.000, dar factură doar 952,38 (transport) + comision separat 47,62
- **Nou (CORECT):** `totalPrice = subtotalWithVat` (clientul plătește direct totalul, comisionul e intern între ATPSOR și transportator)
  - Clientul plătește 1.000, primește factură 1.000

### 17.2. Direcția facturii de comision
- **Vechi (REFUZAT):** Luxuria → Transportator pentru comision (Luxuria platform)
- **Nou (CORECT):** ATPSOR → Transportator (ATPSOR e operator, încasează comision)
- **TODO:** inversare în `src/lib/invoicing.ts` (constanta `LUXURIA_COMMISSION_RATE` rămâne, dar logica trebuie schimbată)

### 17.3. Direcția facturii Luxuria-ATPSOR
- **Vechi (REFUZAT):** Luxuria primea totul, dădea ATPSOR 50% ca "royalty marcă"
- **Nou (CORECT):** ATPSOR primește totul, dă Luxuria 50% ca "servicii platformă tehnologică"

### 17.4. Numărul de facturi între ATPSOR-Luxuria
- **Considerat:** 4 facturi separate (royalty 25 + Stripe pass-through 17)
- **Considerat:** 1 factură combinată (8 RON net)
- **PENDINGĂ decizie:** așteaptă Dan să confirme

### 17.5. Procesator plăți live
- **Pendingă:** Stripe vs Netopia (Dan vorbește cu Netopia)
- **Stripe avantaje:** API mai bun, multi-currency nativ, Connect Express digital
- **Netopia avantaje:** mai ieftin, suport română, mai prietenos pentru asociații românești

---

## 18. TEST DATA & CREDENTIALS UTILE

### Stripe TEST mode (momentan)
- Card test: `4242 4242 4242 4242` — CVC orice 3 cifre, dată viitoare orice
- Card cu authentication required: `4000 0025 0000 3155`
- Card refuzat: `4000 0000 0000 0002`

### CUI-uri reale pentru testare
- `47298966` — QUICK RIDE BUS S.R.L. (plătitor TVA, București)
- `RO31261740` — Luxuria Trans & Travel SRL (Bragadiru, Ilfov)
- `RO35050877` — SMOTOCEL SRL (București)

### Date din DB la 30 aprilie 2026
- **Booking exemplu (existent, pending_payment):** `80d71d99-7d0e-4644-9fa0-ec317ac65030`
  - SMOTOCEL → Müller Reisen Partener Auto S.R.L
  - București → Brașov, 24.04.2026
  - 2.851 RON (transfer bancar)
- **Articol exemplu publicat:** slug `atpsor-intalnire-de-lucru-cu-domnul-marian-bargau-...`
  - Categoria: `intalniri-autoritati`
- **2 companii publice:** Luxuria + SMOTOCEL

### Email
- **Domeniu Resend verificat:** `atpsor.ro`
- **From:** `noreply@atpsor.ro`
- **API key în Vercel:** `RESEND_API_KEY` (Need to Rotate — fost expus)

---

## 19. UTILIZATORI ÎN SISTEM (la 30 aprilie 2026)

| Email | Nume | Rol | Companie |
|---|---|---|---|
| dan@luxuriatrans.ro | Dan Cîrlova | admin | Luxuria Trans & Travel SRL |
| smotoceltrans@yahoo.com | Ciutacu George | inspector (secretar asociație) | SMOTOCEL SRL |
| dancarlova@gmail.com | Dan Cîrlova (test) | transporter | — |
| stancugabriel2481@gmail.com | Stancu Marian Gabriel | transporter | SC Ianis Trans Express SRL |
| cristi_felecanu@yahoo.com | Cristian Felecanu | transporter | — |
| bogdanfloarea77@gmail.com | Floarea Alexandru Bogdan | transporter | SC FLOAREA TRAVEL LOGISTICS.SRL |
| quickridebus@gmail.com | Ionut Gagiu | transporter | — |

---

## 20. WORKFLOW DEZVOLTARE

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
- Sau via MCP `mcp__supabase__execute_sql` (dacă e disponibil în sesiunea Claude)

### Migrații:
- Toate în `supabase/migrations/` — naming convention: `XXX_description.sql`
- **IMPORTANT:** rulează direct în Supabase SQL Editor, NU se aplică automat la push

### Test cu curl că merge API-ul după deploy:
```bash
curl -s "https://atpsor.ro/api/public/transporters?t=$(date +%s)" -H "Cache-Control: no-cache"
```
(`?t=...` = cache buster + `Cache-Control: no-cache` forțează request fresh)

---

## 21. QUIRK-URI OPERAȚIONALE (specific mediu Windows + worktree)

- **Shell cwd reset:** Pe Windows, după fiecare comandă Bash, working directory se resetează la worktree (`.claude/worktrees/serene-haibt`). Folosește `cd /c/Users/danci/ATPSOR && comanda` în fiecare comandă, NU presupune că rămâi în main repo.
- **Git lock file:** Apare random `.git/index.lock` care blochează commit-urile. Fix: `rm -f .git/index.lock`
- **Vercel cache pentru force-dynamic:** Ocazional cache-ul Edge nu se invalidează. Workaround: `?t=$(date +%s)` query param ca cache buster.
- **Linter modifică fișierele:** Uneori Linter-ul face modificări mici după salvare. NU le suprascrie — sunt OK și intenționate.
- **Supabase SMTP rate limit:** Built-in SMTP Supabase = ~3-4 email/oră. SMTP custom Resend = nelimitat practic.
- **Worktrees în `.claude/worktrees/`:** Sesiuni vechi de Claude Code. NU le șterge — pot fi în uz.

---

## 22. STIL DE COMUNICARE CU DAN

- **Răspunde scurt și direct** — Dan e foarte ocupat, nu agreează răspunsuri lungi
- **Acțiuni concrete** > explicații teoretice
- **Confirmă cu numere și exemple** — Dan vrea claritate
- **Nu propune ajutor cu X dacă X funcționează deja** — întreabă întâi
- **Folosește română** (rar engleză pentru termeni tehnici)
- **Comentariile în cod în română** sau engleză — păstrează stilul existent
- **Commit messages în română** (păstrează stilul: descriere problemă + fix)
- **Cere confirmarea înainte de modificări mari** — platforma e LIVE
- **Folosește emoji moderat** — Dan apreciază claritatea ✓ ✗ 🎯 ⚠️
- **Tabele > paragrafe lungi** când compari opțiuni

---

## 23. STRATEGIE DE DECIZIE PENTRU SITUAȚII AMBIGUE

### Când să întrebi Dan ÎNAINTE de a face

1. **Modificare logica plăților** (preț, comision, split) → CERE Dan
2. **Modificări DB schema** (tabele/coloane noi) → migrație nouă, dar întreabă pentru lucruri delicate (RLS pe profiles, modificare constraints)
3. **Schimbare flow utilizator** (login, redirecționări) → CERE Dan, e platformă LIVE
4. **Decizii arhitecturale mari** (Stripe vs Netopia, Luxuria vs ATPSOR ca platform) → CERE Dan
5. **Ștergere date** (DELETE pe production) → CERE Dan, confirmă de 2 ori

### Când poți face fără să întrebi

1. **Bug fix evident** (typo, regex, edge case) → fix direct
2. **Feature deja TODO listed** (dacă e în lista de mai jos) → pornește
3. **Refactor cosmetic** (rename variabilă, extract function) → OK
4. **Documentație/comments** → mereu OK
5. **TS check failures** → rezolvă mereu

### Cum să prezinți decizii lui Dan

- Folosește format `Opțiunea A / B / C` cu argumente pro-contra
- Termină cu **recomandare proprie** (nu lăsa decizia goală)
- Cere răspuns scurt: `A` / `B` / `C cu detalii`

### Niciodată

- Nu folosi `git --no-verify` sau `--no-gpg-sign`
- Nu șterge `.claude/worktrees/`
- Nu modifica seriile SmartBill ale Luxuriei (LTT/LTTCURS/LTT EURO/FPROF) — sunt pentru ALTE servicii Luxuria, nu pentru ATPSOR
- Nu expune ENV-uri sensibile în logs/commits (RESEND_API_KEY, STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY)
- Nu face `git push --force` pe main
- Nu modifica calculul `totalPrice` ca să includă comisionul (regula sacră: clientul plătește totalul, comisionul e intern)

---

## 24. TO-DO PRIORITIZAT (la 30 aprilie 2026)

### 🔴 URGENT — necesar pentru live cu plăți cu cardul

1. **Decide între Stripe și Netopia** — Dan vorbește cu Netopia, așteptăm răspuns
2. **Inversează direcția facturilor** în `src/lib/invoicing.ts`:
   - ATPSOR → Transportator: 50 RON comision (nu Luxuria → Transportator)
   - Luxuria → ATPSOR: 25 RON servicii platformă (nu Luxuria → ATPSOR royalty)
3. **Stripe Connect onboarding** pentru transportatori (~30 min cod):
   - Buton "Conectează Stripe" în Dashboard Transportator
   - API endpoint pentru a crea Express account + a obține onboarding URL
   - Webhook pentru a salva `stripe_account_id` la complete

### 🟡 MEDIU — îmbunătățiri funcționale

4. **Taxa anuală membri ATPSOR (500 RON/an)** — neimplementată:
   - Tab nou în admin pentru gestionare membri
   - Factură ATPSOR → transportator la înscriere/anual
   - Tracking expirare cotizație + email reminders
5. **Rotire RESEND_API_KEY** (Vercel arată "Need to Rotate")
6. **Pagina /terms** există dar conținutul poate fi îmbunătățit cu termeni concreți
7. **Stripe → LIVE keys** când totul de mai sus e gata

### 🟢 NICE-TO-HAVE

8. **Mobile responsive review** — anumite pagini (admin, contract preview) pot fi optimizate
9. **Email templates HTML pe Supabase** — în prezent default, putem îmbunătăți
10. **SEO optimizations** — meta tags, sitemap.xml dynamic
11. **Manual transportator** (`/manual/transportator`) — există dar poate fi expandat
12. **Reports panel** — există template, poate fi îmbogățit cu grafice

### 🔵 BACKLOG (pe termen lung)

- Plăți recurente (abonamente)
- App mobile native
- Integrare alte procesatoare (PayU, ePayment)
- Multi-tenant (alte asociații folosesc platforma)

---

## 25. REPERE ARHITECTURALE

```
src/
├── app/
│   ├── [locale]/           # Pagini publice și private (RO/EN)
│   │   ├── activitati/     # CMS articole + pagină publică listare
│   │   │   └── [slug]/     # Detaliu articol
│   │   ├── auth/           # Login/register/forgot-password/reset-password
│   │   ├── book/[token]/   # Booking link unic transportator
│   │   ├── contract/[bookingId]/  # Contract auto-completat (UUID secret)
│   │   ├── dashboard/
│   │   │   ├── admin/      # Panou admin/inspector
│   │   │   │   └── company/[id]/  # Detaliu companie cu Aprobă & Publică
│   │   │   ├── client/     # Panou client
│   │   │   └── transporter/ # Panou transportator (cu tab Rezervări)
│   │   ├── request/        # Căutare rapidă transport (RequestTransportForm)
│   │   │   └── [id]/offers/ # Pagina cu oferte primite
│   │   ├── transporters/   # Listă publică transportatori
│   │   │   └── [id]/       # Profil transportator
│   │   ├── manual/         # Manuale client + transporter
│   │   └── terms/          # Termeni și condiții
│   └── api/
│       ├── stripe/         # Checkout + webhook
│       ├── booking/        # Bank transfer + confirm-payment + contract
│       ├── public/transporters/  # API public listă transportatori
│       ├── distance/       # Google Maps Directions cu mapping țări
│       ├── anaf/           # Verificare CUI (apelat din register)
│       ├── companies/refresh-anaf/  # Reverificare ANAF (admin/transporter)
│       ├── invoices/       # PDF download, send, cancel
│       └── notify-approval/ # Email manual transportator
├── components/
│   ├── admin/ArticlesManager.tsx   # CMS articole
│   ├── contract/ContractPreview.tsx  # Component reutilizabil contract
│   ├── invoices/InvoiceList.tsx
│   ├── layout/Header.tsx           # Navigation cu role-based dashboard link
│   ├── request/RequestTransportForm.tsx  # Componenta principală căutare
│   ├── transporter/
│   │   ├── BookingLinkForm.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── ReportsPanel.tsx
│   │   └── VehicleCalendar.tsx
│   └── transporters/TransportersList.tsx  # Listă publică (folosește /api/public/transporters)
├── lib/
│   ├── anaf.ts            # ANAF async API + verifyCUI
│   ├── bnr.ts             # Curs BNR + cache
│   ├── distances.ts       # Pricing logic + opts pt extern/non-VAT
│   ├── emails.ts          # Resend templates
│   ├── invoicing.ts       # Orchestrare facturi SmartBill (3 facturi)
│   ├── smartbill.ts       # SmartBill API client
│   ├── stripe/config.ts
│   └── supabase/{client,server,storage}.ts
├── i18n/                  # next-intl config
├── messages/              # ro.json, en.json
├── middleware.ts          # next-intl middleware
└── types/database.ts      # Tipuri TypeScript pentru tabele Supabase
```

---

## 26. CONTACT & DOCUMENTAȚIE EXTERNĂ

- **Stripe Dashboard:** https://dashboard.stripe.com (cont Luxuria)
- **SmartBill:** https://www.smartbill.ro (Luxuria + posibil ATPSOR separat)
- **Vercel:** https://vercel.com/dancarlova-4583s-projects/atpsor
- **Supabase:** https://supabase.com/dashboard/project/kfafifosxsrahuktwvuj
- **Resend:** https://resend.com (domeniu verificat atpsor.ro)
- **GitHub:** https://github.com/dancarlova-atpsor/ATPSOR
- **ANAF API docs:** căutați "ANAF webservicesp AsynchWebService" (oficial: https://www.anaf.ro/anaf/internet/ANAF/servicii_online/servicii_web)
- **BNR XML:** https://www.bnr.ro/nbrfxrates.xml

---

## 27. ONBOARDING TRANSPORTATOR — fluxul detaliat

### Pas 1: Înregistrare cont
- Pagina: `/auth/register`
- Câmpuri obligatorii:
  - Email + parolă
  - Nume complet (full_name)
  - Telefon
  - **Selectare rol:** "Transportator" (alternativ: "Client")
- Pentru rol transportator, se afișează câmpuri suplimentare:
  - **CUI companie** (cu verificare ANAF live, auto-completează nume + adresă)
  - Nume companie
  - Județ + oraș sediu
  - Adresă sediu
  - Telefon companie
  - Pickup cities (orașe de unde plecă curse — multi-select)
- La submit:
  1. `supabase.auth.signUp()` creează `auth.users` row
  2. **Manual** se creează row în `profiles` cu rol = "transporter"
  3. **Manual** se creează row în `companies` cu owner_id = user.id
- **TRIGGER LIPSĂ:** Nu există trigger automat la signup care să creeze profile. Trebuie făcut manual în pagina register. **Verifică în cod dacă creează corect ambele.**

### Pas 2: Login + completare profil
- După login, transportatorul ajunge pe `/dashboard/transporter`
- Tab "Profil Companie" — completează:
  - Logo companie (upload în Supabase Storage `logos/{companyId}/`)
  - Descriere
  - SmartBill credentials (username + token API + serii)
  - Contract template URL (PDF cu contract-ul SRL-ului transportatorului — opțional)

### Pas 3: Adăugare vehicule
- Tab "Vehiculele Mele" → "Adaugă vehicul"
- Câmpuri: nume, categorie (`autocar`, `microbuz`, etc.), seats, brand, model, year, features (tags)
- Upload poze (multi-file → `vehicles.photos[]`)
- Salvat → vehiculul devine activ

### Pas 4: Setare tarife
- Tab "Tarife" → completează preț/km RON pe fiecare categorie de vehicul deținută
- Plus tarif EUR/km pentru curse externe (opțional)
- Min km/zi (default 200)

### Pas 5: Upload documente
- Tab "Documente" → upload pe categorii:
  - **Companie:** Licență Transport ARR (obligatoriu), Certificat constatator ONRC, Atestat licență comunitară (extern)
  - **Vehicul (per vehicul):** Talon ITP valabil, Copie Conformă ARR, Asigurare Bagaje și Călători, Asigurare RCA
- Fiecare document are `document_type` + `expiry_date` + URL Storage
- Status: `is_verified` (admin/inspector verifică)

### Pas 6: Aprobare admin
- Admin/Inspector deschide companie → Vede status: docs ✓, poze ✓
- Apasă **"Aprobă & Publică"** → setează `is_approved=true` AND `is_verified=true`
- Companie apare pe `/transporters` (pagina publică)
- **Email automat** către transportator cu manualul (`/api/notify-approval`)

### Pas 7: Connect Stripe (TODO — neimplementat)
- Pe `/dashboard/transporter/profil` ar trebui buton "Conectează Stripe"
- Click → redirect Stripe Express Onboarding URL
- Transportator completează: date firmă, KYC administrator, IBAN
- Webhook salvează `stripe_account_id` în `companies`
- **De implementat** (vezi TODO 🔴 secțiunea 24)

---

## 28. VEHICLE BLOCKS — Calendar disponibilitate

### Tabela `vehicle_blocks`
```sql
id UUID
vehicle_id UUID FK
start_date DATE
end_date DATE
reason TEXT  -- "booking" | "maintenance" | "personal" | "other"
booking_reference TEXT  -- ex: "bank-{booking_id}" sau "card-{booking_id}"
created_at TIMESTAMPTZ
```

### Când se creează un block:

1. **Automat la rezervare** (în `/api/booking/bank-transfer` și webhook Stripe):
   ```ts
   await serviceClient.from("vehicle_blocks").insert({
     vehicle_id, start_date: departureDate, end_date: returnDate || departureDate,
     reason: "booking", booking_reference: `bank-${booking.id}`
   });
   ```

2. **Manual de transportator** (din Dashboard → Vehiculele Mele → calendar):
   - Click pe data în calendar → adaugă block manual
   - Useful pentru: revizii, curse private off-platform, vacanță proprietar

### Cum se folosește:

În `RequestTransportForm.tsx` la căutare, vehiculele sunt filtrate:
```ts
const { data: blocks } = await supabase.from("vehicle_blocks")
  .select("vehicle_id")
  .lte("start_date", endDate)
  .gte("end_date", departureDate);  // overlap check
const blockedIds = new Set(blocks.map(b => b.vehicle_id));
// Apoi: vehicles.filter(v => !blockedIds.has(v.id))
```

Vehiculele cu block în intervalul cerut **NU apar** în lista de oferte.

### Component vizualizare:
`src/components/transporter/VehicleCalendar.tsx` — calendar lunar pe fiecare vehicul, cu blocks colorate.

---

## 29. STRIPE METADATA — Convenția pentru webhook

### La crearea Checkout Session (`/api/stripe/checkout`)
Se trimit ~20 câmpuri în `session.metadata` (Stripe permite max 50 keys, fiecare max 500 chars):

```ts
const metadata = {
  // Identificare
  offerId: "direct-{vehicleId}-{timestamp}" | "{offerId}",
  userId: user.id,
  vehicleId, companyId, requestId,

  // Date cursă
  departureDate, returnDate,
  pickupCountry, dropoffCountry,
  isInternational: "true" | undefined,
  currency: "ron" | "eur",
  route: "BUC → Brașov" (max 500),
  totalKm: "1297",
  pricePerKm: "1.785",
  subtotalWithVat: "2313.36",
  platformFee: "115.67",

  // Billing client (pentru factură)
  billing_name, billing_email, billing_address, billing_city, billing_county,

  // Transportator (pentru facturare SmartBill)
  transporterName, transporterCui, transporterEmail,
  transporterSeries: "TRANS LEI" | "TRANS EURO",
  transporterIsVatPayer: "true" | "false",
  transporterAccountId: stripe_account_id (pentru Connect),
};
```

### În webhook (`/api/stripe/webhook`)

La eveniment `checkout.session.completed`:
1. Citește `session.metadata`
2. Verifică `companyId` → fetch credentialele SmartBill din DB (parolele NU sunt în metadata, sunt în DB)
3. Apelează `generateAllInvoices()` care emite cele 3 facturi
4. Salvează `bookings` row dacă e flow direct (offerId începe cu "direct-")
5. Sau actualizează booking existent dacă e flow ofertă

**Două flow-uri în webhook:**
- **Direct flow** (search rapidă): `offerId.startsWith("direct-")` → creează booking nou + factură
- **Offer flow** (din ofertă selectată): `offerId` e UUID real → actualizează booking + factură

### CRITIC pentru testing
Dacă lipsește un câmp din metadata → factura nu se emite corect. Verifică **TOATE** câmpurile când debugezi probleme cu webhook.

---

## 30. NOTIFICĂRI EMAIL — Când se trimit

| Eveniment | Cui | Trigger | Conținut |
|---|---|---|---|
| **Rezervare confirmată (card)** | Client | După Stripe webhook success | Detalii rezervare + factură PDF atașat |
| **Rezervare nouă** | Transportator | După Stripe webhook success / bank-transfer | Notificare cu detaliile clientului |
| **Rezervare nouă** | Admin | După orice booking | Pentru monitorizare |
| **Reset parolă** | User | Forgot password form | Link `/auth/reset-password?token=...` |
| **Manual transportator** | Transportator | După aprobare admin | PDF + link dashboard |
| **Proformă (transfer bancar)** | Client | Imediat după bank-transfer | PDF proforma SmartBill (sau email text-only fallback) |
| **Factură fiscală** | Client | După confirm-payment (transfer bancar) sau Stripe success | PDF factură SmartBill |

### Implementare
- Toate prin Resend (`src/lib/emails.ts`)
- From: `noreply@atpsor.ro`
- Domain verificat în Resend Dashboard
- Templates HTML inline în cod (nu pe Resend templates platform — stilizate cu inline CSS)

### CE LIPSEȘTE (TODO)
- Email când document urmează să expire (30/15/7 zile înainte) — necesită cron
- Email când taxa anuală 500 RON urmează să expire — necesită cron + tabela cotizații
- Email reminder pentru rezervările "in_progress" cu zile înainte de plecare
- Newsletter ATPSOR (lunar) către transportatori

---

## 31. DOCUMENT EXPIRY TRACKING

### Funcție DB existentă
```sql
CREATE OR REPLACE FUNCTION check_company_documents_valid(p_company_id UUID)
RETURNS BOOLEAN AS $$
  -- Verifică dacă toate documentele obligatorii sunt valide (nu expirate)
  -- Folosit pentru a marca companii cu acte expirate
$$ LANGUAGE plpgsql;
```

### Documente cu expirare (toate au `expiry_date`)
- **Companie:**
  - Licență Transport ARR (expiră anual sau cum e licența)
  - Atestat profesional administrator
  - Certificat constatator ONRC
- **Vehicul:**
  - ITP — anual sau 1-2 ani
  - Copie Conformă ARR
  - RCA — anual
  - Asigurare bagaje și călători

### În UI
- Pagina admin detaliu companie afișează cu badge ROȘU "EXPIRAT" documentele expirate
- Liniei document: `border-red-200 bg-red-50` dacă `expiry_date < today`
- Companie cu acte expirate apare cu warning, dar **NU e ascunsă automat din public**

### CE LIPSEȘTE (TODO important)
- **Cron** care rulează zilnic și:
  - Trimite email la transportator cu 30/15/7 zile înainte de expirare
  - Trimite email la admin cu acte expirate
  - Marchează automat companii cu acte expirate ca "needs_review"
- Modificare `is_verified=false` automat dacă acte critice expiră

---

## 32. TABELA `company_pricing` — Tarife custom

### Schema
```sql
company_pricing (
  id UUID,
  company_id UUID FK,
  vehicle_category TEXT (autocar | microbuz | midiautocar | ...),
  price_per_km NUMERIC,
  min_km_per_day INTEGER DEFAULT 200,
  UNIQUE(company_id, vehicle_category)
)
```

### Cum funcționează

1. Transportatorul setează în Dashboard → Tarife → un preț/km pentru fiecare categorie de vehicul deținută
2. Salvat în `company_pricing` (un row per categorie)
3. La căutare cursă, codul caută pricing custom:
   ```ts
   const customPricing = pricingMap.get(`${company.id}_${v.category}`);
   const tariff = customPricing?.price_per_km || TARIFFS[v.category] || 7.50;
   const minKm = customPricing?.min_km_per_day || 200;
   ```
4. **Fallback** la `TARIFFS` default (din `distances.ts`) dacă nu e setat

### Pentru curse externe (EUR)
- Tariful extern e pe `companies.price_per_km_external_eur` (single field, nu per categorie)
- Toate vehiculele aceluiași transportator folosesc același tarif EUR

---

## 33. BOOKING LINKS — Generare token

### Tabela `booking_links`
```sql
booking_links (
  id UUID,
  token UUID DEFAULT gen_random_uuid() UNIQUE,
  company_id UUID FK,
  vehicle_id UUID FK,
  pickup_city, dropoff_city, departure_date, return_date,
  total_price NUMERIC,
  currency TEXT,
  is_international BOOLEAN,
  status TEXT ("pending" | "completed" | "cancelled"),
  created_at, expires_at
)
```

### Generare
- Transportatorul creează un link de rezervare pentru un client cunoscut (negociat în privat)
- `token` = UUID v4 random (122 bits entropy → imposibil de ghicit)
- URL public: `https://atpsor.ro/ro/book/{token}`
- Form: `src/components/transporter/BookingLinkForm.tsx`

### Securitate
- Token e SECRET — oricine îl are accesează rezervarea
- **NU expune token-uri în log-uri sau URL-uri sensibile**
- Token poate fi folosit de mai multe ori (link redeschis), dar status="completed" la prima plată reușită

---

## 34. PROFILE vs auth.users

### Tabele Supabase Auth (gestionate de Supabase, NU le modifica)
- `auth.users` — id, email, encrypted_password, last_sign_in_at, etc.
- `auth.identities` — pentru OAuth (Google/Facebook dacă e activ)
- `auth.sessions` — sesiunile active

### Tabela noastră `profiles`
```sql
profiles (
  id UUID PRIMARY KEY (= auth.users.id),  -- 1:1 mapping
  email TEXT,                              -- duplicat din auth.users pentru ușurință query
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('client', 'transporter', 'admin', 'inspector')),
  created_at TIMESTAMPTZ
)
```

### Sync auth.users ↔ profiles
- **Fără trigger automat** (verificat: nu există trigger de tip `on_auth_user_created`)
- La signup, codul în `/auth/register/page.tsx` trebuie să facă **DOUĂ inserts:**
  1. `supabase.auth.signUp()` → creează auth.users row
  2. `supabase.from("profiles").insert(...)` → creează profiles row cu același id
- Dacă pasul 2 eșuează → user blocat (auth fără profile)

### CE LIPSEȘTE
- Trigger automat care creează profile la auth signup (DB-level, robust)
- ALTERNATIV: ar trebui Edge Function care ascultă webhook-ul Auth Supabase

---

## 35. STRIPE TEST MODE — Quirks

### Două chei TEST în uz
- **Stripe Dashboard test key:** Pentru integrare normală
- **Stripe CLI test key (`stripe listen`):** Pentru webhook local development

### Webhook signing secret
- LIVE: configurat în Stripe Dashboard → Webhooks → semnătură
- LOCAL DEV: din `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` (genera un secret diferit `whsec_*`)
- Vercel ENV: `STRIPE_WEBHOOK_SECRET` (LIVE secret)
- Pentru test local, schimbă temporar valoarea din ENV

### Diferențe TEST vs LIVE
- TEST: `sk_test_...`, `pk_test_...`, `whsec_test_...`
- LIVE: `sk_live_...`, `pk_live_...`, `whsec_...`
- Banii nu se transferă real în TEST (doar simulare)
- TEST necesită "test mode" în Stripe Dashboard pentru a vedea evenimentele

### Cards de test importante
```
4242 4242 4242 4242 — succes (cea mai frecventă)
4000 0025 0000 3155 — succes după 3D Secure (autenticare)
4000 0000 0000 9995 — declined: insufficient_funds
4000 0000 0000 0002 — declined: generic
```
Pentru toate: CVC orice 3 cifre, dată ZZ/AA viitoare orice.

---

## 36. POLITICA DE TESTARE

### Stare actuală: **NU există testare automată**

- Nu există Jest/Vitest pentru unit tests
- Nu există Playwright/Cypress pentru E2E
- Nu există integrare CI/CD cu testare

### Ce se face
- **Build check minim:** `npx tsc --noEmit` (verifică TypeScript)
- **Test manual de Dan** pe staging/live după fiecare commit important
- **Stripe test mode** pentru fluxul de plată
- **Card 4242** pentru a simula plăți reușite

### Recomandare (TODO viitor)
- Setup Playwright pentru E2E pe fluxurile critice:
  - Login + signup
  - Căutare + plată cu cardul
  - Forgot password
- Setup Vitest pentru lib/ functions (anaf, bnr, distances calculations)
- GitHub Actions: TS check + lint la fiecare PR

---

## 37. BACKUP & DISASTER RECOVERY

### Supabase Free tier (curent)
- **Backup automat:** 1 dată/zi, păstrat 7 zile
- Acces: Supabase Dashboard → Database → Backups → Restore
- Restore-ul aduce TOATĂ baza de date la momentul backup-ului (nu selectiv)

### CE LIPSEȘTE
- **Backup în afara Supabase:** dacă proiectul e șters (accidental sau de Supabase) → totul pierdut
- Recomandare: cron săptămânal care exportă întreg DB-ul la S3/Backblaze
- **Backup pentru Storage** (uploads): nu există — pozele/documentele sunt vulnerable

### Pentru cont Supabase Pro
- Backup zilnic 7 zile + Point-in-Time Recovery (PITR) 30 zile
- Backup-uri pot fi exportate

### În caz de disaster
1. Verifică Supabase Dashboard backup → restore la cel mai recent
2. Dacă proiectul e pierdut: trebuie creat nou + restore prin SQL dump
3. Stripe: păstrează istoricul (nu e local)
4. SmartBill: păstrează istoricul (nu e local)

---

## 38. CRON / SCHEDULED JOBS

### Stare actuală: **NU există cron-uri active**

### Vercel Cron (suportat dar neutilizat)
- Vercel suportă scheduled functions via `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/check-document-expiry", "schedule": "0 9 * * *" }
  ]
}
```
- Free tier: max 2 cron-uri, fiecare max 1 dată/zi

### TODO IMPORTANT — cron-uri de adăugat
1. **Document expiry alerts** (zilnic, 9 AM):
   - Verifică toate companiile → găsește acte care expiră în 30/15/7 zile
   - Trimite email la transportator + email la admin
2. **Cotizație anuală membri** (lunar):
   - Verifică transportatorii cu cotizație expirată
   - Trimite reminder + factură nouă
3. **Reminder rezervări apropiate** (zilnic):
   - Email cu 24h și 1h înainte de plecare către client + transportator
4. **Refresh BNR rate** (zilnic, ora 14:00):
   - Curs BNR se publică zilnic la 13:00. Cron-ul cache-ește pentru următoarea zi.

### Alternative la Vercel Cron
- **Supabase Edge Functions** + cron (cron via pg_cron extension)
- **External:** GitHub Actions schedule, EasyCron, etc.

---

## 39. CHANGELOG MAJOR (cronologic)

### 7-9 aprilie 2026 — Fundație
- Schema inițială (companies, vehicles, bookings, transport_requests, offers)
- Auth Supabase + roluri inițiale (client/transporter/admin)
- Pagina căutare transport + contract preview
- Stripe Connect Destination Charges setup

### 10-14 aprilie 2026 — SmartBill + Email
- Integrare SmartBill API + 3 facturi automate
- Resend email cu domeniu verificat
- Manual transportator + manual client

### 15-23 aprilie 2026 — Curse externe + admin
- Migrații 017-019: contract data + curse externe + plătitor TVA
- Selector țară + Google Maps multi-country
- Pagina detaliu companie admin + verificare documente

### 24-29 aprilie 2026 — Inspector role + Activitati
- Migrații 020-022: photos legacy, bookings update, inspector role
- Tab Rezervări în Dashboard Transportator
- CMS Activitati cu categorii (Întâlniri Asociație, Întâlniri Autorități, Evenimente, Comunicate)

### 30 aprilie 2026 — Clarificare business model + CLAUDE.md
- Clarificare structură fiscală: ATPSOR e operatorul, Luxuria e furnizor tehnologic
- Promovare Ciutacu George (SMOTOCEL) la rol inspector
- Articol publicat: "Întâlnire de lucru cu Marian Bârgău"
- Discuție Stripe vs Netopia (Dan urmează să sune Netopia)
- **Acest CLAUDE.md creat** — context complet pentru sesiuni viitoare

---

**Pentru orice modificare semnificativă, consultă Dan înainte. Platforma e LIVE și are utilizatori reali (transportatori).**

**Pentru sesiuni viitoare:** dacă găsești ceva ce nu se aliniază cu acest fișier (ex: schema DB diferită, decizii noi), **întreabă Dan și actualizează CLAUDE.md** la final. Acest fișier e sursa unică a adevărului pentru context.
