import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/invoices — list invoices for current user (transporter or client)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get("role") || "transporter";

    if (role === "transporter") {
      // Transportator: vede facturile din bookings-urile companiei sale
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!company) {
        return NextResponse.json({ invoices: [] });
      }

      const { data: invoices } = await supabase
        .from("invoices")
        .select("*, booking:bookings(id, total_price, created_at, company_id)")
        .order("created_at", { ascending: false });

      // Filter: only invoices where the booking belongs to this company
      const filtered = (invoices || []).filter(
        (inv: any) => inv.booking?.company_id === company.id
      );

      return NextResponse.json({ invoices: filtered });
    }

    // Client: vede facturile din bookings-urile proprii
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("client_id", user.id);

    const bookingIds = (bookings || []).map((b: any) => b.id);

    if (bookingIds.length === 0) {
      return NextResponse.json({ invoices: [] });
    }

    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    return NextResponse.json({ invoices: invoices || [] });
  } catch (error) {
    console.error("Invoices API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
