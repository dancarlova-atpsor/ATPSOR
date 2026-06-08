// POST /api/membership/request — primește cerere de adeziune ATPSOR
// 1. Validează datele
// 2. Generează payment_reference unic (ex: ADEZIUNE-CUI-TIMESTAMP)
// 3. Salvează în tabela membership_requests cu status pending_payment
// 4. Trimite email automat la solicitant cu datele bancare ATPSOR
// 5. Trimite email notificare către admin ATPSOR
// 6. Returnează payment_reference ca să fie afișată pe pagina de confirmare

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.NOTIFY_EMAIL || "dan@luxuriatrans.ro";

// IBAN + cont ATPSOR (pentru emailul către solicitant)
const ATPSOR_BANK = {
  beneficiary: "Asociația Transportatorilor de Persoane prin Serviciul Ocazional din România",
  cif: "52819099",
  iban: "RO58 CECE B000 30RO N397 9534",
  bank: "CEC Bank SA",
  amount: 500,
  currency: "RON",
};

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function cleanCui(cui: string): string {
  return cui.replace(/^RO/i, "").replace(/[\s-]/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      formType, // "company" | "individual"
      companyName,
      cui,
      fullName,
      position,
      email,
      phone,
      city,
      county,
      vehicleCount,
      motivation,
    } = body;

    // Validări minime
    if (!fullName || !email || !phone || !city || !county) {
      return NextResponse.json({ error: "Câmpurile obligatorii lipsesc" }, { status: 400 });
    }
    if (formType === "company" && (!companyName || !cui)) {
      return NextResponse.json({ error: "Pentru firmă, denumirea și CUI sunt obligatorii" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Generez payment reference unic
    const cleanCuiVal = formType === "company" ? cleanCui(cui) : "PF";
    const timestamp = Date.now().toString(36).toUpperCase();
    const paymentRef = `ADEZIUNE-${cleanCuiVal}-${timestamp}`;

    // Insert în membership_requests
    const { data: created, error } = await supabase
      .from("membership_requests")
      .insert({
        company_name: formType === "company" ? companyName : `Persoană fizică: ${fullName}`,
        cui: formType === "company" ? cleanCuiVal : "PF",
        company_address: null,
        company_city: city,
        company_county: county,
        company_phone: phone,
        company_email: email,
        admin_name: fullName,
        admin_phone: phone,
        admin_email: email,
        amount: ATPSOR_BANK.amount,
        currency: ATPSOR_BANK.currency,
        payment_reference: paymentRef,
        status: "pending_payment",
        admin_notes: [
          `Tip: ${formType === "company" ? "Firmă transport" : "Persoană din domeniu"}`,
          position ? `Funcție: ${position}` : null,
          vehicleCount ? `Vehicule în flotă: ${vehicleCount}` : null,
          motivation ? `Motivație: ${motivation}` : null,
        ].filter(Boolean).join("\n"),
      })
      .select("id, payment_reference")
      .single();

    if (error) {
      console.error("Membership request insert error:", error);
      return NextResponse.json({ error: "Eroare la salvarea cererii. Te rugăm reîncearcă." }, { status: 500 });
    }

    // Trimite email confirmare cu datele bancare la SOLICITANT
    if (resend) {
      const emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;">
  <div style="background:#1e40af;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:white;margin:0;font-size:22px;">🤝 Cerere Adeziune ATPSOR — Detalii Plată</h1>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;">
    <p style="font-size:15px;color:#111;margin-top:0;">Bună ziua, <strong>${fullName}</strong>,</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;">
      Am primit cererea ta de adeziune la Asociația ATPSOR. Pentru activarea calității de membru,
      te rugăm să achiți taxa anuală de <strong>500 RON</strong> în contul de mai jos.
    </p>

    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px;margin:18px 0;border-radius:6px;">
      <div style="font-size:13px;font-weight:bold;color:#92400e;">⚠️ IMPORTANT - referință obligatorie la plată:</div>
      <div style="font-family:monospace;font-size:18px;font-weight:bold;color:#78350f;margin-top:6px;">${paymentRef}</div>
      <div style="font-size:12px;color:#78350f;margin-top:6px;">Treci această referință în descrierea ordinului de plată ca să identificăm cererea ta rapid.</div>
    </div>

    <h3 style="font-size:16px;color:#111;margin-top:20px;">Date pentru plată:</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#6b7280;width:40%;">Beneficiar:</td><td style="padding:8px 0;font-weight:bold;">Asociația ATPSOR</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">CIF:</td><td style="padding:8px 0;font-family:monospace;">${ATPSOR_BANK.cif}</td></tr>
      <tr style="border-top:1px solid #e5e7eb;"><td style="padding:8px 0;color:#6b7280;">IBAN:</td><td style="padding:8px 0;font-family:monospace;font-weight:bold;color:#1e40af;">${ATPSOR_BANK.iban}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Banca:</td><td style="padding:8px 0;font-weight:bold;">${ATPSOR_BANK.bank}</td></tr>
      <tr style="border-top:1px solid #e5e7eb;"><td style="padding:8px 0;color:#6b7280;">Sumă:</td><td style="padding:8px 0;font-weight:bold;font-size:18px;color:#dc2626;">500,00 RON</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Referință:</td><td style="padding:8px 0;font-family:monospace;font-weight:bold;color:#92400e;">${paymentRef}</td></tr>
    </table>

    <h3 style="font-size:16px;color:#111;margin-top:24px;">Pașii următori:</h3>
    <ol style="font-size:14px;color:#374151;line-height:1.8;">
      <li>Efectuează plata de 500 RON în contul de mai sus (recomandăm în termen de 7 zile).</li>
      <li>După confirmarea plății, te contactăm pe această adresă (<strong>${email}</strong>).</li>
      <li>Îți activăm contul de transportator pe atpsor.ro și-ți trimitem credențiale de acces.</li>
      <li>Te loghezi, completezi datele vehiculelor + documentele → admin verifică → apari public.</li>
    </ol>

    <p style="font-size:13px;color:#6b7280;margin-top:24px;">
      Dacă ai întrebări, scrie-ne la <a href="mailto:contact@atpsor.ro" style="color:#1e40af;">contact@atpsor.ro</a>
      sau sună la <strong>+40 745 635 657</strong>.
    </p>
  </div>
  <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;">
    Asociația ATPSOR — CIF 52819099<br/>
    Com. Clinceni, Str. Sabarului 120, Jud. Ilfov<br/>
    <a href="https://atpsor.ro" style="color:#1e40af;text-decoration:none;">atpsor.ro</a>
  </div>
</div>`;

      try {
        await resend.emails.send({
          from: "ATPSOR <noreply@atpsor.ro>",
          to: email,
          subject: `Cerere Adeziune ATPSOR — Detalii plată ${paymentRef}`,
          html: emailHtml,
        });
      } catch (err) {
        console.error("Email adeziune solicitant error:", err);
      }

      // Email notificare către admin
      try {
        const adminEmailHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1e40af;padding:16px;color:white;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:18px;">📋 Cerere nouă de adeziune ATPSOR</h2>
  </div>
  <div style="background:white;padding:20px;border:1px solid #e5e7eb;">
    <table style="width:100%;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;width:35%;">Referință:</td><td style="padding:6px 0;font-family:monospace;font-weight:bold;">${paymentRef}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Tip:</td><td style="padding:6px 0;">${formType === "company" ? "Firmă transport" : "Persoană din domeniu"}</td></tr>
      ${formType === "company" ? `
      <tr><td style="padding:6px 0;color:#6b7280;">Firmă:</td><td style="padding:6px 0;font-weight:bold;">${companyName}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">CUI:</td><td style="padding:6px 0;font-family:monospace;">${cui}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Vehicule:</td><td style="padding:6px 0;">${vehicleCount || "—"}</td></tr>
      ` : ""}
      <tr><td style="padding:6px 0;color:#6b7280;">Nume contact:</td><td style="padding:6px 0;font-weight:bold;">${fullName}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Funcție:</td><td style="padding:6px 0;">${position || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email:</td><td style="padding:6px 0;">${email}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Telefon:</td><td style="padding:6px 0;">${phone}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Locație:</td><td style="padding:6px 0;">${city}, ${county}</td></tr>
      ${motivation ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Motivație:</td><td style="padding:6px 0;font-style:italic;">${motivation}</td></tr>` : ""}
    </table>
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin-top:16px;border-radius:4px;">
      <strong>Acțiune necesară:</strong> Așteaptă plata 500 RON cu referința <strong>${paymentRef}</strong>.
      După confirmare, deschide <a href="https://atpsor.ro/ro/dashboard/admin#membership" style="color:#1e40af;">Panou Admin → Adeziuni</a> și marchează ca "Plătit" pentru a activa contul automat.
    </div>
  </div>
</div>`;

        await resend.emails.send({
          from: "ATPSOR <noreply@atpsor.ro>",
          to: ADMIN_EMAIL,
          subject: `Adeziune nouă: ${formType === "company" ? companyName : fullName} (${paymentRef})`,
          html: adminEmailHtml,
        });
      } catch (err) {
        console.error("Email adeziune admin error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      payment_reference: paymentRef,
      id: created.id,
    });
  } catch (err: any) {
    console.error("Membership request error:", err);
    return NextResponse.json({ error: err?.message || "Eroare server" }, { status: 500 });
  }
}
