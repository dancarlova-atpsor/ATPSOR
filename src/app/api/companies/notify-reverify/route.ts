// POST /api/companies/notify-reverify { companyId }
// Apelată DIN DocumentUpload după upload de document nou
// Dacă toate documentele companiei sunt valide (nu expirate), trimite email admin
// ca să poată reactiva manual contul (sau confirm că poate apărea iar public)

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";
import { getNotifyEmails } from "@/lib/notifications";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(request: Request) {
  try {
    const { companyId } = await request.json();
    if (!companyId) return NextResponse.json({ error: "companyId lipsește" }, { status: 400 });

    const supabase = createServiceClient();
    const today = new Date().toISOString().split("T")[0];

    // Citesc compania
    const { data: company } = await supabase
      .from("companies").select("id, name, email, is_verified, is_approved").eq("id", companyId).single();
    if (!company) return NextResponse.json({ error: "Companie negăsită" }, { status: 404 });

    // Caut TOATE documentele companiei (companie + vehicule)
    const [companyDocsRes, vehicleDocsRes, vehiclesRes] = await Promise.all([
      supabase.from("company_documents").select("document_type, expiry_date").eq("company_id", companyId),
      supabase.from("vehicle_documents").select("document_type, expiry_date").eq("company_id", companyId),
      supabase.from("vehicles").select("id").eq("company_id", companyId).eq("is_active", true),
    ]);

    const companyDocs = companyDocsRes.data || [];
    const vehicleDocs = vehicleDocsRes.data || [];
    const vehicleCount = (vehiclesRes.data || []).length;

    // Verific dacă mai există documente expirate
    const expired = [
      ...companyDocs.filter((d: any) => d.expiry_date && d.expiry_date < today),
      ...vehicleDocs.filter((d: any) => d.expiry_date && d.expiry_date < today),
    ];

    const allValid = expired.length === 0;

    // Dacă compania e suspendată și acum toate documentele sunt valide → email inspector/admin
    if (allValid && !company.is_verified && company.is_approved && resend) {
      const notifyTo = await getNotifyEmails();
      try {
        await resend.emails.send({
          from: "ATPSOR <noreply@atpsor.ro>",
          to: notifyTo,
          subject: `🔄 ${company.name} — toate documentele sunt valide, poate fi reactivată`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#16a34a;color:white;padding:16px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:18px;">✓ Companie gata de reactivare</h2>
            </div>
            <div style="background:white;padding:20px;border:1px solid #e5e7eb;">
              <p>Compania <strong>${company.name}</strong> a încărcat documente noi.
              Toate documentele sunt acum valide.</p>
              <p>Verifică profilul și apasă <strong>"Aprobă & Publică"</strong> pentru a o re-activa pe pagina publică.</p>
              <div style="text-align:center;margin:20px 0;">
                <a href="https://atpsor.ro/ro/dashboard/admin/company/${companyId}"
                   style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
                  Deschide compania →
                </a>
              </div>
              <p style="font-size:13px;color:#6b7280;">
                Sumarul documentelor:<br/>
                • Documente companie: ${companyDocs.length}<br/>
                • Vehicule active: ${vehicleCount}<br/>
                • Documente vehicule: ${vehicleDocs.length}<br/>
                • Documente expirate: 0 ✓
              </p>
            </div>
          </div>`,
        });
      } catch (err) {
        console.error("Notify reverify email error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      all_valid: allValid,
      expired_count: expired.length,
      can_reactivate: allValid && !company.is_verified,
    });
  } catch (err: any) {
    console.error("notify-reverify error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
