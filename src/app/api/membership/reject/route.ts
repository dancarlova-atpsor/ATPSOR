// POST /api/membership/reject { requestId, reason }
// Admin/inspector respinge cererea + trimite email cu motivare

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

export async function POST(request: Request) {
  try {
    const { requestId, reason } = await request.json();
    if (!requestId) return NextResponse.json({ error: "requestId lipsește" }, { status: 400 });
    if (!reason) return NextResponse.json({ error: "Motivul respingerii e obligatoriu" }, { status: 400 });

    const userClient = await createUserClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "admin" && profile.role !== "inspector")) {
      return NextResponse.json({ error: "Doar admin/inspector poate respinge" }, { status: 403 });
    }

    const { data: req } = await serviceClient
      .from("membership_requests").select("*").eq("id", requestId).single();
    if (!req) return NextResponse.json({ error: "Cerere negăsită" }, { status: 404 });

    await serviceClient
      .from("membership_requests")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", requestId);

    if (resend) {
      try {
        await resend.emails.send({
          from: "ATPSOR <noreply@atpsor.ro>",
          to: req.admin_email,
          subject: "Cerere adeziune ATPSOR — răspuns",
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#dc2626;color:white;padding:16px;border-radius:6px 6px 0 0;">
              <h2 style="margin:0;font-size:18px;">Cerere adeziune respinsă</h2>
            </div>
            <div style="background:white;padding:20px;border:1px solid #e5e7eb;">
              <p>Bună ziua, <strong>${req.admin_name}</strong>,</p>
              <p>Cu părere de rău, cererea ta de adeziune ATPSOR a fost respinsă din motivul:</p>
              <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:12px;margin:14px 0;border-radius:4px;">
                <strong>${reason}</strong>
              </div>
              <p>Dacă crezi că e o greșeală sau vrei să clarifici, scrie-ne la <a href="mailto:contact@atpsor.ro">contact@atpsor.ro</a>.</p>
            </div>
          </div>`,
        });
      } catch (err) {
        console.error("Rejection email error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reject error:", err);
    return NextResponse.json({ error: err?.message || "Eroare server" }, { status: 500 });
  }
}
