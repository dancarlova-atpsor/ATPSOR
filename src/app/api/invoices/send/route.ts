import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInvoiceEmail } from "@/lib/smartbill";

// POST /api/invoices/send — send invoice by email via SmartBill
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, email } = await request.json();

    if (!invoiceId || !email) {
      return NextResponse.json({ error: "Missing invoiceId or email" }, { status: 400 });
    }

    // Fetch invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, booking:bookings(company_id, client_id)")
      .eq("id", invoiceId)
      .single();

    if (!invoice || !invoice.smartbill_number || !invoice.smartbill_series) {
      return NextResponse.json({ error: "Factura nu are numar SmartBill" }, { status: 404 });
    }

    // Authorization: only transporter (company owner) or admin can send
    const booking = invoice.booking as { company_id?: string; client_id?: string } | null;
    let authorized = false;

    if (booking?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("id", booking.company_id)
        .eq("owner_id", user.id)
        .single();
      if (company) authorized = true;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "admin") authorized = true;

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine SmartBill credentials
    let authHeader: string | undefined;
    if (invoice.invoice_type === "transport" && booking?.company_id) {
      const { data: comp } = await supabase
        .from("companies")
        .select("smartbill_username, smartbill_token")
        .eq("id", booking.company_id)
        .single();
      if (comp?.smartbill_username && comp?.smartbill_token) {
        authHeader = "Basic " + Buffer.from(`${comp.smartbill_username}:${comp.smartbill_token}`).toString("base64");
      }
    } else if (invoice.invoice_type === "luxuria_commission") {
      const u = process.env.LUXURIA_SMARTBILL_USERNAME || "";
      const t = process.env.LUXURIA_SMARTBILL_TOKEN || "";
      if (u && t) authHeader = "Basic " + Buffer.from(`${u}:${t}`).toString("base64");
    }

    const result = await sendInvoiceEmail({
      cif: invoice.issuer_cui,
      seriesName: invoice.smartbill_series,
      number: invoice.smartbill_number,
      to: email,
      authHeader,
    });

    if (result?.errorText) {
      return NextResponse.json({ error: result.errorText }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Factura trimisă la ${email}` });
  } catch (error) {
    console.error("Invoice send error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
