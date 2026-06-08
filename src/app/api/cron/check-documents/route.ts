// CRON ZILNIC 8 AM: Verifică expirarea documentelor + acțiuni automate
//
// Logica:
// 1. Folosește service role (bypass RLS — necesar pentru cron fără sesiune user)
// 2. Verifică TOATE documentele companii + vehicule:
//    - EXPIRATE (deja trecute) → email URGENT transportator + dezactivare cont public + email admin
//    - 1 zi rămasă → email URGENT
//    - 7 zile → email warning
//    - 15 zile → email reminder
//    - 30 zile → email heads-up
// 3. Reactivare automată: companie cu acte EXPIRATE-fixate → poate fi re-verificată
//
// Pentru fiecare companie: o singură emisie / categorie / zi (deduplicăm pe în-progress)

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.NOTIFY_EMAIL || "dan@luxuriatrans.ro";

const DOCUMENT_LABELS: Record<string, string> = {
  company_license: "Licență transport ARR",
  certificat_constatator: "Certificat constatator ONRC",
  atestat_administrator: "Atestat administrator",
  vehicle_registration_itp: "Talon cu ITP",
  certified_copy: "Copie conformă",
  passenger_luggage_insurance: "Asigurare bagaje și călători",
  rca_insurance: "Asigurare RCA",
};

// Documente CRITICE — dacă unul e expirat, compania nu mai apare public
const CRITICAL_DOC_TYPES = new Set([
  "vehicle_registration_itp",
  "rca_insurance",
  "company_license",
]);

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type Severity = "expired" | "urgent_1d" | "warning_7d" | "reminder_15d" | "headsup_30d";

interface DocAlert {
  label: string;
  expiryDate: string;
  daysLeft: number;
  severity: Severity;
  vehicleName?: string;
  isCritical: boolean;
}

interface CompanyAlert {
  companyId: string;
  companyName: string;
  companyEmail: string;
  isVerified: boolean;
  docs: DocAlert[];
  hasExpired: boolean;
  hasCriticalExpired: boolean;
  highestSeverity: Severity;
}

function severityRank(s: Severity): number {
  return { expired: 5, urgent_1d: 4, warning_7d: 3, reminder_15d: 2, headsup_30d: 1 }[s];
}

function buildAlert(daysLeft: number): Severity | null {
  if (daysLeft < 0) return "expired";
  if (daysLeft === 0 || daysLeft === 1) return "urgent_1d";
  if (daysLeft <= 7) return "warning_7d";
  if (daysLeft <= 15) return "reminder_15d";
  if (daysLeft <= 30) return "headsup_30d";
  return null;
}

const SEVERITY_LABELS: Record<Severity, { title: string; color: string; bgColor: string; subject: string }> = {
  expired: {
    title: "❌ DOCUMENTE EXPIRATE — Cont suspendat temporar",
    color: "#dc2626",
    bgColor: "#fee2e2",
    subject: "URGENT: Documente expirate — cont ATPSOR suspendat",
  },
  urgent_1d: {
    title: "⚠️ DOCUMENT EXPIRĂ AZI sau MÂINE",
    color: "#ea580c",
    bgColor: "#fed7aa",
    subject: "URGENT: Document expiră în 1 zi",
  },
  warning_7d: {
    title: "⏰ Documente expiră în 7 zile",
    color: "#d97706",
    bgColor: "#fef3c7",
    subject: "ATPSOR: Document expiră în maxim 7 zile",
  },
  reminder_15d: {
    title: "🔔 Reminder: documente expiră în curând",
    color: "#0891b2",
    bgColor: "#cffafe",
    subject: "ATPSOR: Reamintire — documente expiră în maxim 15 zile",
  },
  headsup_30d: {
    title: "📅 Documente expiră luna viitoare",
    color: "#475569",
    bgColor: "#e2e8f0",
    subject: "ATPSOR: Documente expiră în maxim 30 zile",
  },
};

async function sendTransporterEmail(alert: CompanyAlert) {
  if (!resend) {
    console.log(`[CRON] Would send to ${alert.companyEmail} | ${alert.highestSeverity} | ${alert.docs.length} docs`);
    return { sent: false, mocked: true };
  }

  const cfg = SEVERITY_LABELS[alert.highestSeverity];
  const docsRows = alert.docs
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .map((d) => {
      const dCfg = SEVERITY_LABELS[d.severity];
      const status = d.daysLeft < 0
        ? `EXPIRAT acum ${Math.abs(d.daysLeft)} zile`
        : d.daysLeft === 0
          ? "EXPIRĂ AZI"
          : d.daysLeft === 1
            ? "expiră MÂINE"
            : `${d.daysLeft} zile rămase`;
      return `<tr>
        <td style="padding:10px;border:1px solid #e5e7eb;">
          ${d.isCritical ? "<strong>🚨 " : ""}${d.label}${d.isCritical ? "</strong>" : ""}
          ${d.vehicleName ? `<br/><span style="font-size:12px;color:#6b7280;">Vehicul: ${d.vehicleName}</span>` : ""}
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;font-family:monospace;font-weight:bold;color:${dCfg.color};">
          ${d.expiryDate}<br/><span style="font-size:11px;">${status}</span>
        </td>
      </tr>`;
    }).join("");

  const isSuspended = alert.hasCriticalExpired;
  const banner = isSuspended
    ? `<div style="background:#fee2e2;border-left:4px solid #dc2626;padding:14px;margin:14px 0;border-radius:4px;">
        <p style="margin:0;font-weight:bold;color:#7f1d1d;">⚠️ Contul tău public a fost SUSPENDAT automat pe atpsor.ro</p>
        <p style="margin:6px 0 0 0;font-size:13px;color:#7f1d1d;">
          Compania <strong>${alert.companyName}</strong> nu mai apare în lista publică până când încarci documentele actualizate.
          După upload, admin-ul verifică și reactivează contul.
        </p>
      </div>` : "";

  const emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;">
  <div style="background:${cfg.color};padding:20px;border-radius:8px 8px 0 0;">
    <h1 style="color:white;margin:0;font-size:20px;">${cfg.title}</h1>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;">
    <p style="margin-top:0;">Bună ziua, <strong>${alert.companyName}</strong>,</p>
    ${banner}
    <p style="font-size:14px;color:#374151;line-height:1.6;">
      ${alert.hasExpired
        ? "Următoarele documente sunt expirate sau urmează să expire. Reînnoiește-le cât mai curând:"
        : "Următoarele documente urmează să expire. Reînnoiește-le ca să eviți întreruperea activității:"}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:10px;border:1px solid #d1d5db;text-align:left;">Document</th>
          <th style="padding:10px;border:1px solid #d1d5db;text-align:left;width:40%;">Expiră</th>
        </tr>
      </thead>
      <tbody>${docsRows}</tbody>
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://atpsor.ro/ro/dashboard/transporter#documents"
         style="background:${cfg.color};color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
        Încarcă documentele acum →
      </a>
    </div>
    <p style="font-size:13px;color:#6b7280;margin-top:20px;">
      După ce încarci documentele actualizate, admin-ul ATPSOR le va verifica și reactiva contul public (dacă e cazul).
    </p>
    <p style="font-size:13px;color:#6b7280;">
      Întrebări? Scrie la <a href="mailto:contact@atpsor.ro" style="color:#1e40af;">contact@atpsor.ro</a>
    </p>
  </div>
  <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;">
    ATPSOR — Asociația Transportatorilor de Persoane prin Serviciul Ocazional din România<br/>
    <a href="https://atpsor.ro" style="color:#1e40af;text-decoration:none;">atpsor.ro</a>
  </div>
</div>`;

  const { error } = await resend.emails.send({
    from: "ATPSOR <noreply@atpsor.ro>",
    to: alert.companyEmail,
    subject: `${cfg.subject} — ${alert.companyName}`,
    html: emailHtml,
  });

  return { sent: !error, error: error?.message };
}

async function sendAdminEmail(alerts: CompanyAlert[]) {
  if (!resend || alerts.length === 0) return;
  const critical = alerts.filter((a) => a.hasCriticalExpired);
  if (critical.length === 0 && alerts.filter((a) => a.hasExpired).length === 0) return;

  const summary = alerts.map((a) => {
    const expiredCnt = a.docs.filter((d) => d.daysLeft < 0).length;
    const upcomingCnt = a.docs.filter((d) => d.daysLeft >= 0).length;
    return `<tr>
      <td style="padding:8px;border:1px solid #e5e7eb;">
        <strong>${a.companyName}</strong><br/>
        <span style="font-size:11px;color:#6b7280;">${a.companyEmail}</span>
      </td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:${expiredCnt > 0 ? "#dc2626" : "#6b7280"};font-weight:bold;">${expiredCnt}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:#d97706;font-weight:bold;">${upcomingCnt}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${a.hasCriticalExpired ? "🚫 Suspendat" : a.isVerified ? "✓ Public" : "○ Nu apare"}</td>
    </tr>`;
  }).join("");

  await resend.emails.send({
    from: "ATPSOR <noreply@atpsor.ro>",
    to: ADMIN_EMAIL,
    subject: `[Cron] ${critical.length} companii suspendate + ${alerts.length} alertate`,
    html: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
      <div style="background:#1e40af;color:white;padding:16px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">📊 Raport documente expirate — ${new Date().toLocaleDateString("ro-RO")}</h2>
      </div>
      <div style="background:white;padding:20px;border:1px solid #e5e7eb;">
        ${critical.length > 0 ? `<div style="background:#fee2e2;padding:12px;border-radius:6px;margin-bottom:14px;">
          <strong>🚫 ${critical.length} companii SUSPENDATE</strong> (acte critice expirate — RCA, ITP, sau licență):
          <ul style="margin:6px 0 0 20px;font-size:13px;">${critical.map((c) => `<li>${c.companyName}</li>`).join("")}</ul>
        </div>` : ""}
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Companie</th>
              <th style="padding:8px;border:1px solid #d1d5db;">Expirate</th>
              <th style="padding:8px;border:1px solid #d1d5db;">Apropiate</th>
              <th style="padding:8px;border:1px solid #d1d5db;">Status</th>
            </tr>
          </thead>
          <tbody>${summary}</tbody>
        </table>
        <p style="margin-top:14px;font-size:13px;color:#6b7280;">
          <a href="https://atpsor.ro/ro/dashboard/admin#companies" style="color:#1e40af;">Deschide Panou Admin →</a>
        </p>
      </div>
    </div>`,
  });
}

export async function GET(request: Request) {
  // Protecție cu CRON_SECRET (sau permite Vercel cron care vine cu Authorization: Bearer <vercel cron secret>)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createServiceClient();

    // 1. Fetch TOATE documentele (companii + vehicule) cu expiry_date setat (în interval -90 / +60 zile)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const min = new Date(today); min.setDate(today.getDate() - 90); // expirate până la 90 zile în urmă
    const max = new Date(today); max.setDate(today.getDate() + 60); // expiră în 60 zile

    const [companyDocsRes, vehicleDocsRes, companiesRes] = await Promise.all([
      supabase.from("company_documents")
        .select("*, company:companies(id, name, email, is_verified)")
        .not("expiry_date", "is", null)
        .gte("expiry_date", min.toISOString().split("T")[0])
        .lte("expiry_date", max.toISOString().split("T")[0]),
      supabase.from("vehicle_documents")
        .select("*, company:companies(id, name, email, is_verified), vehicle:vehicles(name)")
        .not("expiry_date", "is", null)
        .gte("expiry_date", min.toISOString().split("T")[0])
        .lte("expiry_date", max.toISOString().split("T")[0]),
      supabase.from("companies").select("id, name, email, is_verified"),
    ]);

    const companyDocs = companyDocsRes.data ?? [];
    const vehicleDocs = vehicleDocsRes.data ?? [];

    // Build alerts per companie
    const byCompany: Record<string, CompanyAlert> = {};

    const addDoc = (doc: any, type: "company" | "vehicle") => {
      const company = doc.company;
      if (!company?.id) return;
      const daysLeft = daysUntil(doc.expiry_date);
      const severity = buildAlert(daysLeft);
      if (!severity) return;

      const isCritical = CRITICAL_DOC_TYPES.has(doc.document_type);
      const label = DOCUMENT_LABELS[doc.document_type] || doc.document_type;
      const vehicleName = type === "vehicle" ? (doc.vehicle?.name || "vehicul") : undefined;

      if (!byCompany[company.id]) {
        byCompany[company.id] = {
          companyId: company.id,
          companyName: company.name,
          companyEmail: company.email,
          isVerified: company.is_verified || false,
          docs: [],
          hasExpired: false,
          hasCriticalExpired: false,
          highestSeverity: severity,
        };
      }

      const alert = byCompany[company.id];
      alert.docs.push({ label, expiryDate: doc.expiry_date, daysLeft, severity, vehicleName, isCritical });
      if (daysLeft < 0) {
        alert.hasExpired = true;
        if (isCritical) alert.hasCriticalExpired = true;
      }
      if (severityRank(severity) > severityRank(alert.highestSeverity)) {
        alert.highestSeverity = severity;
      }
    };

    for (const doc of companyDocs) addDoc(doc, "company");
    for (const doc of vehicleDocs) addDoc(doc, "vehicle");

    const alerts = Object.values(byCompany);

    // 2. Dezactivare automată companii cu acte CRITICE expirate
    const deactivatedIds: string[] = [];
    for (const alert of alerts) {
      if (alert.hasCriticalExpired && alert.isVerified) {
        await supabase.from("companies").update({ is_verified: false }).eq("id", alert.companyId);
        deactivatedIds.push(alert.companyId);
      }
    }

    // 3. Reactivare automată: companii care nu au în alerts (toate docs OK) dar erau dezactivate de noi
    // Nu facem reactivare automată — admin trebuie să confirme manual

    // 4. Trimit email la fiecare companie
    let emailsSent = 0;
    const failures: string[] = [];
    for (const alert of alerts) {
      const result = await sendTransporterEmail(alert);
      if (result.sent) emailsSent++;
      else if (!result.mocked) failures.push(`${alert.companyEmail}: ${result.error}`);
    }

    // 5. Raport admin
    await sendAdminEmail(alerts);

    return NextResponse.json({
      success: true,
      total_alerts: alerts.length,
      emails_sent: emailsSent,
      companies_deactivated: deactivatedIds.length,
      deactivated_ids: deactivatedIds,
      failures: failures.length > 0 ? failures : undefined,
      details: alerts.map((a) => ({
        company: a.companyName,
        email: a.companyEmail,
        severity: a.highestSeverity,
        expired: a.docs.filter((d) => d.daysLeft < 0).length,
        upcoming: a.docs.filter((d) => d.daysLeft >= 0).length,
        suspended: a.hasCriticalExpired,
      })),
    });
  } catch (error: any) {
    console.error("Cron check-documents error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST = trigger manual din admin panel (același logic ca GET)
export async function POST(request: Request) {
  return GET(request);
}
