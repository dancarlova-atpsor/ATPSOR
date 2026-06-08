// POST /api/membership/notify-legacy { emails: string[] }
// Doar admin/inspector — trimite email "contact George Ciutacu" la lista de emailuri
// din cererile vechi de adeziune făcute prin formularul de transport (înainte de implementarea adeziunilor)

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { SECRETARY_CONTACT } from "@/lib/notifications";

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

export async function POST(request: Request) {
  try {
    const { emails } = await request.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Lista de email-uri lipsește" }, { status: 400 });
    }

    // Verific autentificare admin/inspector
    const userClient = await createUserClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "admin" && profile.role !== "inspector")) {
      return NextResponse.json({ error: "Doar admin/inspector poate trimite" }, { status: 403 });
    }

    if (!resend) {
      return NextResponse.json({ error: "Resend API key lipsă" }, { status: 500 });
    }

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;">
      <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">🤝 Adeziune ATPSOR — proces actualizat</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;">
        <p style="margin-top:0;">Bună ziua,</p>
        <p style="font-size:14px;color:#374151;line-height:1.6;">
          Ați solicitat în trecut adeziunea la Asociația ATPSOR. Procesul a fost actualizat și
          puteți completa acum cererea direct pe website-ul nostru.
        </p>

        <div style="text-align:center;margin:24px 0;">
          <a href="https://atpsor.ro/ro/membership"
             style="background:#1e40af;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;font-size:15px;">
            Completează cererea de adeziune →
          </a>
        </div>

        <p style="font-size:14px;color:#374151;line-height:1.6;">
          După completarea formularului, veți primi automat <strong>datele de plată</strong> (cont ATPSOR + referință de plată unică).
          Taxa anuală de membru este de <strong>500 RON</strong>.
        </p>

        <div style="background:#e0f2fe;padding:16px;border-radius:6px;margin-top:20px;">
          <p style="font-size:14px;color:#0c4a6e;margin:0 0 8px 0;font-weight:bold;">📞 Pentru orice întrebare contactați-l pe:</p>
          <p style="font-size:14px;color:#0c4a6e;margin:0;line-height:1.7;">
            <strong>${SECRETARY_CONTACT.name}</strong><br/>
            ${SECRETARY_CONTACT.role}<br/>
            Email: <a href="mailto:${SECRETARY_CONTACT.email}" style="color:#1e40af;">${SECRETARY_CONTACT.email}</a><br/>
            Telefon: <strong>${SECRETARY_CONTACT.phone}</strong>
          </p>
        </div>

        <p style="font-size:13px;color:#6b7280;margin-top:20px;">
          Vă mulțumim pentru interesul de a deveni membru ATPSOR. Aștept să vă primim în asociație!
        </p>
      </div>
      <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;">
        Asociația ATPSOR — CIF 52819099<br/>
        <a href="https://atpsor.ro" style="color:#1e40af;text-decoration:none;">atpsor.ro</a>
      </div>
    </div>`;

    const cleanEmails = (emails as string[])
      .map((e) => String(e).trim())
      .filter((e) => e.includes("@"));

    const results = await Promise.allSettled(
      cleanEmails.map((email) =>
        resend.emails.send({
          from: "ATPSOR <noreply@atpsor.ro>",
          to: email,
          subject: `Adeziune ATPSOR — completați cererea online | Contact: ${SECRETARY_CONTACT.name}`,
          html,
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: cleanEmails.length,
    });
  } catch (err: any) {
    console.error("notify-legacy error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
