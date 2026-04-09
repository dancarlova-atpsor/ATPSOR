# Trecere Stripe de la Sandbox (Test) la Live

## Pasi de urmat

### 1. Activare cont Live in Stripe Dashboard
- Mergi la https://dashboard.stripe.com/account
- Completeaza toate detaliile business (KYC): nume firma, CUI, adresa, cont bancar
- Stripe va verifica contul in 1-3 zile lucratoare
- Asigura-te ca butonul "Test mode" e OFF

### 2. Obtine chei Live
In Stripe Dashboard > Developers > API Keys (cu Test mode OFF):
- **Secret key**: `sk_live_...` (inlocuieste `sk_test_...`)
- **Publishable key**: `pk_live_...` (inlocuieste `pk_test_...`)

### 3. Creeaza Webhook Live
- Stripe Dashboard > Developers > Webhooks > Add endpoint
- URL: `https://atpsor.ro/api/stripe/webhook`
- Event: `checkout.session.completed`
- Copiaza **Signing secret**: `whsec_...`

### 4. Actualizeaza env vars in Vercel
In Vercel Dashboard > Settings > Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_51TJwqf...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51TJwqf...
STRIPE_WEBHOOK_SECRET=whsec_... (cel NOU de la webhook-ul live)
```

### 5. Stripe Connect - Transportatori
- Fiecare transportator trebuie sa re-faca onboarding-ul pe Live
- Conturile Express din Sandbox NU se transfera in Live
- La prima conectare, transportatorul va fi redirectionat la Stripe KYC

### 6. Testeaza cu un card REAL
- Fa o rezervare mica de test (cel mai mic pret posibil)
- Verifica ca plata apare in Stripe Dashboard (Live)
- Verifica ca webhook-ul a functionat (booking creat in Supabase)
- Verifica ca emailurile s-au trimis
- Refund-uieste plata din Stripe Dashboard

### 7. Emailuri Resend - Domeniu propriu
Pentru emailuri din productie, configureaza domeniu:
- Mergi la https://resend.com/domains
- Adauga `atpsor.ro`
- Configureaza DNS records (SPF, DKIM, DMARC)
- Schimba `from` in `/src/lib/emails.ts` din `onboarding@resend.dev` in `noreply@atpsor.ro`

## Checklist final
- [ ] Cont Stripe activat si verificat (KYC complet)
- [ ] Chei Live setate in Vercel
- [ ] Webhook Live creat si functional
- [ ] Test cu card real reusit
- [ ] Domeniu Resend configurat (optional dar recomandat)
- [ ] Transportatorii informati ca trebuie re-onboarding
