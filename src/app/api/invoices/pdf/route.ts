import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvoicePdf } from "@/lib/smartbill";

// GET /api/invoices/pdf?invoiceId=xxx — download PDF for a specific invoice
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
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

    // Authorization: check user owns the booking (as transporter or client)
    const booking = invoice.booking as { company_id?: string; client_id?: string } | null;
    let authorized = false;

    if (booking?.client_id === user.id) {
      authorized = true;
    } else if (booking?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("id", booking.company_id)
        .eq("owner_id", user.id)
        .single();
      if (company) authorized = true;
    }

    // Admin bypass
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "admin") authorized = true;

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine which SmartBill credentials to use based on invoice type
    let authHeader: string | undefined;
    if (invoice.invoice_type === "transport" && booking?.company_id) {
      // Transport invoice: use transporter's SmartBill credentials
      const { data: comp } = await supabase
        .from("companies")
        .select("smartbill_username, smartbill_token")
        .eq("id", booking.company_id)
        .single();
      if (comp?.smartbill_username && comp?.smartbill_token) {
        authHeader = "Basic " + Buffer.from(`${comp.smartbill_username}:${comp.smartbill_token}`).toString("base64");
      }
    } else if (invoice.invoice_type === "luxuria_commission") {
      // Luxuria invoice: use Luxuria credentials
      const u = process.env.LUXURIA_SMARTBILL_USERNAME || "";
      const t = process.env.LUXURIA_SMARTBILL_TOKEN || "";
      if (u && t) {
        authHeader = "Basic " + Buffer.from(`${u}:${t}`).toString("base64");
      }
    }
    // commission type uses ATPSOR default credentials (no override needed)

    const pdf = await getInvoicePdf({
      cif: invoice.issuer_cui,
      seriesName: invoice.smartbill_series,
      number: invoice.smartbill_number,
      authHeader,
    });

    if (!pdf) {
      return NextResponse.json({ error: "Nu s-a putut descărca PDF-ul" }, { status: 500 });
    }

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factura_${invoice.smartbill_series}_${invoice.smartbill_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
