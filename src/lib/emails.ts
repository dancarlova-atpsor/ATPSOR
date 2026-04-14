// Serviciu email cu Resend — confirmare booking + notificari transportator
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = "ATPSOR <noreply@atpsor.ro>";

function header(title: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">${title}</h1>
      </div>
      <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;">`;
}

function footer() {
  return `
      </div>
      <div style="background:#1e40af;padding:12px;border-radius:0 0 8px 8px;text-align:center;">
        <p style="color:white;margin:0;font-size:12px;">ATPSOR - Platforma de Transport Ocazional</p>
        <p style="color:#93c5fd;margin:4px 0 0;font-size:11px;">https://atpsor.ro</p>
      </div>
    </div>`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:#6b7280;width:140px;">${label}</td><td style="padding:6px 0;font-weight:bold;">${value}</td></tr>`;
}

interface BookingEmailData {
  route: string;
  departureDate: string;
  returnDate?: string;
  transporterName: string;
  vehicleName?: string;
  totalPrice: number;
  currency: string;
  clientName: string;
  clientEmail: string;
  stripeSessionId?: string;
  bookingId?: string;
}

// Email 1: Confirmare booking catre client
export async function sendBookingConfirmationToClient(data: BookingEmailData) {
  if (!resend || !data.clientEmail) return;

  const acceptDate = new Date().toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const acceptTime = new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  const html = `${header("ATPSOR - Confirmare Rezervare")}
    <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;font-size:16px;font-weight:bold;color:#166534;">Rezervarea ta a fost confirmata!</p>
      <p style="margin:4px 0 0;color:#15803d;font-size:14px;">Plata a fost procesata cu succes.</p>
    </div>

    <h2 style="color:#1e40af;font-size:16px;margin-top:0;">Detalii Rezervare</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${row("Traseu:", data.route)}
      ${row("Data:", data.departureDate + (data.returnDate ? ` → ${data.returnDate}` : ""))}
      ${row("Transportator:", data.transporterName)}
      ${data.vehicleName ? row("Vehicul:", data.vehicleName) : ""}
      ${row("Total platit:", `${data.totalPrice.toFixed(2)} ${data.currency.toUpperCase()}`)}
    </table>

    <h2 style="color:#1e40af;font-size:16px;">Contract de Transport</h2>
    <div style="background:white;border:2px solid #1e40af;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-weight:bold;color:#1e40af;font-size:14px;">CONTRACT DE TRANSPORT OCAZIONAL DE PERSOANE</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:4px 0;color:#6b7280;width:130px;">Prestator:</td><td style="padding:4px 0;font-weight:bold;">${data.transporterName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Beneficiar:</td><td style="padding:4px 0;font-weight:bold;">${data.clientName || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Traseu:</td><td style="padding:4px 0;font-weight:bold;">${data.route}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Data transport:</td><td style="padding:4px 0;font-weight:bold;">${data.departureDate}${data.returnDate ? ` → ${data.returnDate}` : ""}</td></tr>
        ${data.vehicleName ? `<tr><td style="padding:4px 0;color:#6b7280;">Vehicul:</td><td style="padding:4px 0;font-weight:bold;">${data.vehicleName}</td></tr>` : ""}
        <tr><td style="padding:4px 0;color:#6b7280;">Valoare:</td><td style="padding:4px 0;font-weight:bold;">${data.totalPrice.toFixed(2)} RON (TVA inclus)</td></tr>
      </table>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;font-style:italic;">
        Semnat electronic prin citire si acceptare pe platforma ATPSOR. Data acceptarii: ${acceptDate}, ${acceptTime}.
      </div>
    </div>

    ${data.bookingId ? `
    <div style="margin-top:16px;text-align:center;">
      <a href="https://atpsor.ro/ro/contract/${data.bookingId}"
         style="display:inline-block;background:#1e40af;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
        Vezi/Descarca Contractul (PDF)
      </a>
      <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">
        Apasa pe link, apoi pe butonul "Tipareste / Salveaza PDF" din pagina deschisa
      </p>
    </div>
    ` : ""}

    <div style="margin-top:20px;padding:12px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;">
      <p style="margin:0;font-size:13px;color:#1d4ed8;">
        <strong>Ce urmeaza?</strong><br>
        Transportatorul va fi notificat si te va contacta pentru detaliile transportului.
        Vei primi separat factura fiscala emisa prin SmartBill.
      </p>
    </div>
  ${footer()}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: `Confirmare Rezervare: ${data.route} | ${data.departureDate}`,
      html,
    });
    console.log(`Booking confirmation email sent to ${data.clientEmail}`);
  } catch (err) {
    console.error("Failed to send booking confirmation email:", err);
  }
}

interface TransporterNotificationData {
  route: string;
  departureDate: string;
  returnDate?: string;
  transporterEmail: string;
  transporterName: string;
  clientName: string;
  clientEmail: string;
  vehicleName?: string;
  totalPrice: number;
  currency: string;
}

// Email 2: Notificare transportator la booking nou
export async function sendBookingNotificationToTransporter(data: TransporterNotificationData) {
  if (!resend || !data.transporterEmail) return;

  const html = `${header("ATPSOR - Rezervare Noua Confirmata")}
    <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;font-size:16px;font-weight:bold;color:#1e40af;">Ai o rezervare noua!</p>
      <p style="margin:4px 0 0;color:#2563eb;font-size:14px;">Un client a platit si rezervarea este confirmata.</p>
    </div>

    <h2 style="color:#1e40af;font-size:16px;margin-top:0;">Detalii Transport</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${row("Traseu:", data.route)}
      ${row("Data:", data.departureDate + (data.returnDate ? ` → ${data.returnDate}` : ""))}
      ${data.vehicleName ? row("Vehicul:", data.vehicleName) : ""}
      ${row("Suma totala:", `${data.totalPrice.toFixed(2)} ${data.currency.toUpperCase()}`)}
    </table>

    <h2 style="color:#1e40af;font-size:16px;">Date Contact Client</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${row("Nume:", data.clientName)}
      ${row("Email:", data.clientEmail)}
    </table>

    <div style="margin-top:20px;padding:12px;background:#fef3c7;border-radius:6px;border:1px solid #fcd34d;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>Actiune necesara:</strong><br>
        Contacteaza clientul cat mai curand pentru a confirma detaliile transportului.
        Vehiculul a fost blocat automat pentru datele rezervate.
      </p>
    </div>

    <div style="text-align:center;margin-top:20px;">
      <a href="https://atpsor.ro/ro/dashboard/transporter" style="display:inline-block;background:#1e40af;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Vezi Panoul Transportator
      </a>
    </div>
  ${footer()}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.transporterEmail],
      subject: `Rezervare Noua: ${data.route} | ${data.departureDate} | Client: ${data.clientName}`,
      html,
    });
    console.log(`Transporter notification email sent to ${data.transporterEmail}`);
  } catch (err) {
    console.error("Failed to send transporter notification email:", err);
  }
}

// Email 4: Trimite factura PDF atasata la client (via Resend, nu SmartBill)
export async function sendInvoicePdfToClient(params: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  invoiceSeries: string;
  pdfBuffer: Buffer;
  isProforma?: boolean;
  transporterName: string;
}) {
  if (!resend || !params.clientEmail) return;

  const docType = params.isProforma ? "Proforma" : "Factura";
  const filename = `${docType.toLowerCase()}_${params.invoiceSeries}_${params.invoiceNumber}.pdf`;

  const html = `${header(`ATPSOR - ${docType} ${params.invoiceSeries} ${params.invoiceNumber}`)}
    <p>Buna ziua${params.clientName ? `, ${params.clientName}` : ""},</p>
    <p>Va transmitem atasat <strong>${docType.toLowerCase()}a ${params.invoiceSeries} ${params.invoiceNumber}</strong> emisa de <strong>${params.transporterName}</strong> prin platforma ATPSOR.</p>
    ${params.isProforma ? `
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin:12px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          <strong>Important:</strong> Aceasta este o proforma. Dupa primirea platii prin transfer bancar,
          se va emite factura fiscala in conformitate cu legea.
        </p>
      </div>
    ` : `
      <div style="background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:12px;margin:12px 0;">
        <p style="margin:0;font-size:13px;color:#166534;">
          <strong>Plata a fost incasata cu succes.</strong> Factura este marcata ca incasata in sistemul SmartBill.
        </p>
      </div>
    `}
    <p style="font-size:13px;color:#6b7280;">Pastrati acest document ca dovada a tranzactiei. Pentru intrebari, contactati-ne la <a href="mailto:contact@atpsor.ro">contact@atpsor.ro</a>.</p>
  ${footer()}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.clientEmail],
      subject: `${docType} ${params.invoiceSeries} ${params.invoiceNumber} - ATPSOR Transport`,
      html,
      attachments: [{
        filename,
        content: params.pdfBuffer.toString("base64"),
      }],
    });
    console.log(`${docType} PDF sent to ${params.clientEmail}`);
  } catch (err) {
    console.error(`Failed to send ${docType} PDF email:`, err);
  }
}

// Email proforma fara PDF (fallback cand SmartBill PDF nu merge)
export async function sendProformaInfoEmail(params: {
  clientEmail: string;
  clientName: string;
  proformaNumber: string;
  proformaSeries: string;
  transporterName: string;
  amount: number;
}) {
  if (!resend || !params.clientEmail) return;

  const html = `${header(`ATPSOR - Proforma ${params.proformaSeries} ${params.proformaNumber}`)}
    <p>Buna ziua${params.clientName ? `, ${params.clientName}` : ""},</p>
    <p>S-a emis <strong>proforma ${params.proformaSeries} ${params.proformaNumber}</strong>
    in valoare de <strong>${params.amount.toFixed(2)} RON</strong> de catre <strong>${params.transporterName}</strong>.</p>

    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin:12px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>Pasul urmator:</strong> Efectueaza transferul bancar conform detaliilor primite anterior pe email.
        Dupa primirea platii, vom emite factura fiscala in mod automat.
      </p>
    </div>

    <p style="font-size:13px;color:#6b7280;">Pentru intrebari, contactati-ne la <a href="mailto:contact@atpsor.ro">contact@atpsor.ro</a>.</p>
  ${footer()}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.clientEmail],
      subject: `Proforma ${params.proformaSeries} ${params.proformaNumber} - ATPSOR Transport`,
      html,
    });
    console.log(`Proforma info email sent to ${params.clientEmail}`);
  } catch (err) {
    console.error("Failed to send proforma info email:", err);
  }
}

// Email 3: Notificare admin la booking nou
export async function sendBookingNotificationToAdmin(data: BookingEmailData & { transporterEmail?: string }) {
  if (!resend) return;

  const adminEmail = process.env.NOTIFY_EMAIL || "dancarlova@gmail.com";

  const html = `${header("ATPSOR Admin - Booking Nou Confirmat")}
    <table style="width:100%;border-collapse:collapse;">
      ${row("Traseu:", data.route)}
      ${row("Data:", data.departureDate + (data.returnDate ? ` → ${data.returnDate}` : ""))}
      ${row("Client:", `${data.clientName} (${data.clientEmail})`)}
      ${row("Transportator:", data.transporterName)}
      ${row("Total:", `${data.totalPrice.toFixed(2)} ${data.currency.toUpperCase()}`)}
    </table>
  ${footer()}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmail],
      subject: `[ADMIN] Booking: ${data.route} | ${data.totalPrice.toFixed(0)} RON`,
      html,
    });
  } catch (err) {
    console.error("Failed to send admin notification:", err);
  }
}
