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
}

// Email 1: Confirmare booking catre client
export async function sendBookingConfirmationToClient(data: BookingEmailData) {
  if (!resend || !data.clientEmail) return;

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

    <div style="margin-top:20px;padding:12px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;">
      <p style="margin:0;font-size:13px;color:#1d4ed8;">
        <strong>Ce urmeaza?</strong><br>
        Transportatorul va fi notificat si te va contacta pentru detaliile transportului.
        Pastreaza acest email ca dovada a rezervarii.
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
