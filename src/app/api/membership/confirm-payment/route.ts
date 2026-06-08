// POST /api/membership/confirm-payment { requestId }
// Doar admin/inspector
// 1. Marchează cererea ca "paid" + setează paid_at + expires_at (1 an)
// 2. Creează cont Supabase auth.users cu parolă random
// 3. Creează row în profiles cu rol "transporter"
// 4. Creează row în companies (dacă e tip "company") cu owner_id = nou user.id
// 5. Trimite email cu credențiale (email + parolă temporară + link reset)
// 6. Asociază user_id + company_id cu cererea

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function createUserClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

// Generează parolă aleatoare 12 caractere (litere + cifre)
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: "requestId lipsește" }, { status: 400 });
    }

    // Verific autentificare admin/inspector
    const userClient = await createUserClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "inspector")) {
      return NextResponse.json({ error: "Doar admin/inspector poate confirma" }, { status: 403 });
    }

    // Citesc cererea
    const { data: req, error: reqErr } = await serviceClient
      .from("membership_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (reqErr || !req) {
      return NextResponse.json({ error: "Cerere negăsită" }, { status: 404 });
    }
    if (req.status === "paid") {
      return NextResponse.json({ error: "Cererea e deja confirmată" }, { status: 400 });
    }

    // Verific dacă există deja user cu acest email (poate avea deja cont)
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id, email, role")
      .eq("email", req.admin_email)
      .maybeSingle();

    let userId: string;
    let tempPassword: string | null = null;

    if (existingProfile) {
      // User existent — doar îl asociem cu cererea
      userId = existingProfile.id;
      // Dacă nu e deja transporter sau admin, promovăm la transporter
      if (existingProfile.role === "client") {
        await serviceClient.from("profiles").update({ role: "transporter" }).eq("id", userId);
      }
    } else {
      // Creez user nou cu parolă random
      tempPassword = generatePassword();
      const { data: newUser, error: createErr } = await serviceClient.auth.admin.createUser({
        email: req.admin_email,
        password: tempPassword,
        email_confirm: true, // marchez emailul ca verificat (a confirmat oferind contul bancar)
        user_metadata: {
          full_name: req.admin_name,
          phone: req.admin_phone,
        },
      });
      if (createErr || !newUser?.user) {
        console.error("Create user error:", createErr);
        return NextResponse.json({ error: `Eroare la crearea contului: ${createErr?.message}` }, { status: 500 });
      }
      userId = newUser.user.id;

      // Creez profile manual (nu există trigger automat)
      await serviceClient.from("profiles").insert({
        id: userId,
        email: req.admin_email,
        full_name: req.admin_name,
        phone: req.admin_phone,
        role: "transporter",
      });
    }

    // Creez/asociez companie dacă e tip "company"
    let companyId: string | null = null;
    if (req.cui && req.cui !== "PF") {
      // Verific dacă există deja companie cu acest CUI
      const { data: existingCompany } = await serviceClient
        .from("companies")
        .select("id")
        .eq("cui", req.cui)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
        // Asociez owner_id dacă nu e setat
        await serviceClient.from("companies").update({ owner_id: userId }).eq("id", companyId).is("owner_id", null);
      } else {
        // Creez companie nouă
        const { data: newCompany, error: companyErr } = await serviceClient
          .from("companies")
          .insert({
            owner_id: userId,
            name: req.company_name,
            cui: req.cui,
            city: req.company_city,
            county: req.company_county,
            phone: req.company_phone,
            email: req.company_email,
            address: req.company_address || `${req.company_city}, ${req.company_county}`,
            is_approved: true,
            is_verified: false, // admin va verifica când documentele sunt încărcate
          })
          .select("id")
          .single();
        if (companyErr) {
          console.error("Create company error:", companyErr);
        } else if (newCompany) {
          companyId = newCompany.id;
        }
      }
    }

    // Marchez cererea ca plătită + generez numărul oficial al adeverinței
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Generez certificate_number via funcția SQL
    const { data: certNumberRes } = await serviceClient.rpc("generate_certificate_number");
    const certificateNumber = (certNumberRes as string) || `ATPSOR-${now.getFullYear()}-001`;

    // Generez verification_code (12 chars hex random)
    const verificationCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    await serviceClient
      .from("membership_requests")
      .update({
        status: "paid",
        paid_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        activated_user_id: userId,
        activated_company_id: companyId,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
      })
      .eq("id", requestId);

    // Email cu credențiale (dacă user nou)
    if (resend && tempPassword) {
      const loginUrl = "https://atpsor.ro/ro/auth/login";
      const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;">
  <div style="background:#16a34a;padding:24px;border-radius:8px 8px 0 0;color:white;">
    <h1 style="margin:0;font-size:22px;">🎉 Bun venit în ATPSOR!</h1>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;">
    <p style="font-size:15px;color:#111;margin-top:0;">Bună ziua, <strong>${req.admin_name}</strong>,</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;">
      Plata taxei de adeziune (500 RON, referință <strong>${req.payment_reference}</strong>) a fost confirmată.
      Contul tău de transportator pe atpsor.ro este acum activ.
    </p>

    <div style="background:#dbeafe;border-left:4px solid #1e40af;padding:14px;margin:18px 0;border-radius:6px;">
      <div style="font-size:13px;font-weight:bold;color:#1e3a8a;">🔑 Credențiale acces (schimbă parola la prima logare):</div>
      <table style="width:100%;margin-top:10px;font-size:14px;">
        <tr><td style="padding:4px 0;color:#6b7280;width:30%;">Email:</td><td style="padding:4px 0;font-family:monospace;font-weight:bold;">${req.admin_email}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Parolă temporară:</td><td style="padding:4px 0;font-family:monospace;font-weight:bold;color:#dc2626;">${tempPassword}</td></tr>
      </table>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${loginUrl}" style="background:#1e40af;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
        Loghează-te pe atpsor.ro →
      </a>
    </div>

    <div style="background:#fef3c7;border:2px solid #fcd34d;padding:16px;border-radius:6px;margin:18px 0;text-align:center;">
      <div style="font-size:14px;font-weight:bold;color:#78350f;">🏆 Adeverința ta de membru ATPSOR</div>
      <div style="font-family:monospace;font-size:16px;font-weight:bold;color:#92400e;margin:6px 0;">${certificateNumber}</div>
      <div style="font-size:12px;color:#78350f;margin-bottom:10px;">Valabilă: ${now.toLocaleDateString("ro-RO")} → ${expiresAt.toLocaleDateString("ro-RO")}</div>
      <a href="https://atpsor.ro/ro/adeverinta/${requestId}" style="background:#d97706;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;font-size:13px;">
        📜 Descarcă Adeverința PDF →
      </a>
    </div>

    <h3 style="font-size:15px;color:#111;">Următorii pași:</h3>
    <ol style="font-size:14px;color:#374151;line-height:1.8;">
      <li><strong>Loghează-te</strong> cu credențialele de mai sus și schimbă parola.</li>
      <li><strong>Adaugă vehiculele</strong> în Dashboard → Vehiculele Mele (cu poze pentru fiecare).</li>
      <li><strong>Setează tarifele</strong> pe Dashboard → Tarife (RON/km intern, opțional EUR/km extern).</li>
      <li><strong>Încarcă documentele</strong> (licență ARR, ITP, RCA, etc.) în Dashboard → Documente.</li>
      <li><strong>Admin verifică</strong> profilul tău și activează vizibilitatea publică pe atpsor.ro.</li>
    </ol>

    <p style="font-size:13px;color:#6b7280;margin-top:20px;">
      Pentru orice întrebare: <a href="mailto:contact@atpsor.ro" style="color:#1e40af;">contact@atpsor.ro</a> | +40 745 635 657
    </p>
  </div>
  <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;">
    Asociația ATPSOR — CIF 52819099 | <a href="https://atpsor.ro" style="color:#1e40af;text-decoration:none;">atpsor.ro</a>
  </div>
</div>`;

      try {
        await resend.emails.send({
          from: "ATPSOR <noreply@atpsor.ro>",
          to: req.admin_email,
          subject: "🎉 Cont activat pe ATPSOR — credențiale acces",
          html,
        });
      } catch (err) {
        console.error("Activation email error:", err);
      }
    } else if (resend && !tempPassword) {
      // User existent — doar notificare că s-a confirmat plata
      try {
        await resend.emails.send({
          from: "ATPSOR <noreply@atpsor.ro>",
          to: req.admin_email,
          subject: "✓ Plata confirmată — membru ATPSOR activat",
          html: `<p>Bună ziua,</p><p>Plata taxei de adeziune (500 RON, ref. <strong>${req.payment_reference}</strong>) a fost confirmată. Statutul tău de membru ATPSOR este acum activ până la <strong>${expiresAt.toLocaleDateString("ro-RO")}</strong>.</p><p>Loghează-te pe <a href="https://atpsor.ro/ro/auth/login">atpsor.ro</a> cu credențialele tale existente.</p>`,
        });
      } catch (err) {
        console.error("Renewal email error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      company_id: companyId,
      new_user: !!tempPassword,
    });
  } catch (err: any) {
    console.error("Confirm payment error:", err);
    return NextResponse.json({ error: err?.message || "Eroare server" }, { status: 500 });
  }
}
