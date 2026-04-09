import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelInvoice, reverseInvoice } from "@/lib/smartbill";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// POST /api/invoices/cancel — cancel or reverse (storno) an invoice
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, action = "cancel" } = await request.json();
    // action: "cancel" (anulare) or "reverse" (storno)

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    // Only admin can cancel/reverse invoices
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Doar administratorul poate anula facturi" }, { status: 403 });
    }

    // Fetch invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, booking:bookings(company_id)")
      .eq("id", invoiceId)
      .single();

    if (!invoice || !invoice.smartbill_number || !invoice.smartbill_series) {
      return NextResponse.json({ error: "Factura nu are numar SmartBill" }, { status: 404 });
    }

    if (invoice.status !== "issued") {
      return NextResponse.json({ error: "Doar facturile emise pot fi anulate" }, { status: 400 });
    }

    // Determine SmartBill credentials
    const booking = invoice.booking as { company_id?: string } | null;
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

    let result;
    if (action === "reverse") {
      result = await reverseInvoice({
        cif: invoice.issuer_cui,
        seriesName: invoice.smartbill_series,
        number: invoice.smartbill_number,
        authHeader,
      });
    } else {
      result = await cancelInvoice({
        cif: invoice.issuer_cui,
        seriesName: invoice.smartbill_series,
        number: invoice.smartbill_number,
        authHeader,
      });
    }

    if (result?.errorText) {
      return NextResponse.json({ error: result.errorText }, { status: 400 });
    }

    // Update invoice status in DB
    const serviceClient = createServiceClient();
    const newStatus = action === "reverse" ? "reversed" : "cancelled";
    await serviceClient
      .from("invoices")
      .update({ status: newStatus, error_message: null })
      .eq("id", invoiceId);

    return NextResponse.json({
      success: true,
      message: action === "reverse"
        ? `Factura ${invoice.smartbill_series} ${invoice.smartbill_number} a fost stornată`
        : `Factura ${invoice.smartbill_series} ${invoice.smartbill_number} a fost anulată`,
    });
  } catch (error) {
    console.error("Invoice cancel error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
