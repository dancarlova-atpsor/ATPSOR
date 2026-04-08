import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DOCUMENT_LABELS: Record<string, string> = {
  company_license: "Licență transport",
  vehicle_registration_itp: "Talon cu ITP valabil",
  certified_copy: "Copie conformă",
  passenger_luggage_insurance: "Asigurare bagaje și călători",
  rca_insurance: "Asigurare RCA",
};

export async function GET(request: Request) {
  // Protect with CRON_SECRET header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = await createClient();

    const today = new Date();
    const in15Days = new Date();
    in15Days.setDate(today.getDate() + 15);

    const todayStr = today.toISOString().split("T")[0];
    const in15DaysStr = in15Days.toISOString().split("T")[0];

    // Fetch expiring company documents
    const { data: companyDocs, error: companyDocsError } = await supabase
      .from("company_documents")
      .select("*, company:companies(id, name, email)")
      .gte("expiry_date", todayStr)
      .lte("expiry_date", in15DaysStr);

    if (companyDocsError) {
      console.error("Error fetching company docs:", companyDocsError);
    }

    // Fetch expiring vehicle documents
    const { data: vehicleDocs, error: vehicleDocsError } = await supabase
      .from("vehicle_documents")
      .select("*, company:companies(id, name, email), vehicle:vehicles(name)")
      .gte("expiry_date", todayStr)
      .lte("expiry_date", in15DaysStr);

    if (vehicleDocsError) {
      console.error("Error fetching vehicle docs:", vehicleDocsError);
    }

    // Group by company_id
    const byCompany: Record<
      string,
      {
        companyId: string;
        companyName: string;
        companyEmail: string;
        docs: { label: string; expiryDate: string; vehicleName?: string }[];
      }
    > = {};

    for (const doc of companyDocs || []) {
      const company = doc.company as { id: string; name: string; email: string } | null;
      if (!company) continue;
      if (!byCompany[company.id]) {
        byCompany[company.id] = {
          companyId: company.id,
          companyName: company.name,
          companyEmail: company.email,
          docs: [],
        };
      }
      byCompany[company.id].docs.push({
        label: DOCUMENT_LABELS[doc.document_type] || doc.document_type,
        expiryDate: doc.expiry_date,
      });
    }

    for (const doc of vehicleDocs || []) {
      const company = doc.company as { id: string; name: string; email: string } | null;
      const vehicle = doc.vehicle as { name: string } | null;
      if (!company) continue;
      if (!byCompany[company.id]) {
        byCompany[company.id] = {
          companyId: company.id,
          companyName: company.name,
          companyEmail: company.email,
          docs: [],
        };
      }
      byCompany[company.id].docs.push({
        label: DOCUMENT_LABELS[doc.document_type] || doc.document_type,
        expiryDate: doc.expiry_date,
        vehicleName: vehicle?.name,
      });
    }

    const companiesWithExpiringDocs = Object.values(byCompany);
    let emailsSent = 0;
    const errors: string[] = [];

    for (const entry of companiesWithExpiringDocs) {
      if (!resend) {
        console.log(
          `[CRON] Would send email to ${entry.companyEmail} for ${entry.docs.length} expiring docs`
        );
        continue;
      }

      const docsRows = entry.docs
        .map(
          (d) =>
            `<tr>
              <td style="padding:8px;border:1px solid #e5e7eb;">${d.label}${d.vehicleName ? ` (${d.vehicleName})` : ""}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">${d.expiryDate}</td>
            </tr>`
        )
        .join("");

      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">ATPSOR - Documente care expiră în curând</h1>
          </div>
          <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;">
            <p style="margin-top:0;">Bună ziua, <strong>${entry.companyName}</strong>,</p>
            <p>Următoarele documente expiră în maxim <strong>15 zile</strong>. Vă rugăm să le reînnoiți pentru a evita suspendarea activității pe platformă.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#e5e7eb;">
                  <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Document</th>
                  <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Data expirării</th>
                </tr>
              </thead>
              <tbody>
                ${docsRows}
              </tbody>
            </table>
            <p style="margin-bottom:0;color:#6b7280;font-size:13px;">
              Accesați panoul de control pentru a încărca documentele actualizate.
            </p>
          </div>
          <div style="background:#1e40af;padding:12px;border-radius:0 0 8px 8px;text-align:center;">
            <p style="color:white;margin:0;font-size:12px;">ATPSOR - Platforma de Transport Ocazional</p>
          </div>
        </div>
      `;

      const { error } = await resend.emails.send({
        from: "ATPSOR <onboarding@resend.dev>",
        to: [entry.companyEmail],
        subject: `ATPSOR: ${entry.docs.length} document(e) expiră în curând - ${entry.companyName}`,
        html: emailHtml,
      });

      if (error) {
        console.error(`Email error for ${entry.companyEmail}:`, error);
        errors.push(entry.companyEmail);
      } else {
        emailsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      companiesChecked: companiesWithExpiringDocs.length,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron check-documents error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
