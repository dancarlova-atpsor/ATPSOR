import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const ADMIN_EMAIL = "contact@atpsor.ro";

export async function POST(request: Request) {
  try {
    const { companyName, cui, city, county, phone, email } = await request.json();

    if (!resend) {
      console.log("Resend not configured, skipping admin notification");
      return NextResponse.json({ ok: true });
    }

    await resend.emails.send({
      from: "ATPSOR <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `Transportator nou înregistrat: ${companyName}`,
      html: `
        <h2>Transportator nou înregistrat pe ATPSOR</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Firmă</td><td style="padding: 8px; border: 1px solid #ddd;">${companyName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">CUI</td><td style="padding: 8px; border: 1px solid #ddd;">${cui}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Oraș</td><td style="padding: 8px; border: 1px solid #ddd;">${city}, ${county}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Telefon</td><td style="padding: 8px; border: 1px solid #ddd;">${phone || "-"}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
        </table>
        <br/>
        <a href="https://atpsor.ro/ro/dashboard/admin" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
          Mergi la Admin Panel
        </a>
        <br/><br/>
        <p style="color: #666; font-size: 14px;">Verifică datele și aprobă sau respinge contul din panoul de administrare.</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin notification error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
