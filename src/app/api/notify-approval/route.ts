import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const { email, companyName } = await request.json();

    if (!resend || !email) {
      return NextResponse.json({ success: false });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">ATPSOR - Cont Aprobat!</h1>
        </div>
        <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;">
          <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0;font-size:16px;font-weight:bold;color:#166534;">Felicitari! Contul ${companyName} a fost aprobat.</p>
            <p style="margin:4px 0 0;color:#15803d;font-size:14px;">Acum poti accesa toate functionalitatile platformei ATPSOR.</p>
          </div>

          <h2 style="color:#1e40af;font-size:16px;">Ce poti face acum:</h2>
          <ul style="color:#374151;line-height:1.8;">
            <li>Adauga vehicule si incarca documente</li>
            <li>Seteaza tarifele per km</li>
            <li>Raspunde la cereri de transport si trimite oferte</li>
            <li>Genereaza link-uri de rezervare directe</li>
            <li>Configureaza SmartBill pentru facturare automata</li>
          </ul>

          <h2 style="color:#1e40af;font-size:16px;">Manual de Utilizare</h2>
          <p style="color:#374151;">Am pregatit un ghid complet care te ajuta sa folosesti platforma:</p>

          <div style="text-align:center;margin:20px 0;">
            <a href="https://atpsor.ro/ro/manual/transportator"
               style="display:inline-block;background:#1e40af;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              Deschide Manualul Transportatorului
            </a>
          </div>

          <p style="color:#6b7280;font-size:13px;">
            In manual gasesti pas cu pas cum sa: adaugi vehicule, incarci documente, setezi tarife,
            creezi link-uri de rezervare, configurezi SmartBill si multe altele.
          </p>

          <div style="margin-top:20px;padding:12px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;">
            <p style="margin:0;font-size:13px;color:#1d4ed8;">
              <strong>Acceseaza panoul tau:</strong>
              <a href="https://atpsor.ro/ro/dashboard/transporter" style="color:#1d4ed8;">atpsor.ro/dashboard/transporter</a>
            </p>
          </div>
        </div>
        <div style="background:#1e40af;padding:12px;border-radius:0 0 8px 8px;text-align:center;">
          <p style="color:white;margin:0;font-size:12px;">ATPSOR - Platforma de Transport Ocazional</p>
        </div>
      </div>`;

    await resend.emails.send({
      from: "ATPSOR <onboarding@resend.dev>",
      to: [email],
      subject: `Contul ${companyName} a fost aprobat pe ATPSOR!`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approval notification error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
