import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { generateAllInvoices } from "@/lib/invoicing";
import { sendBookingConfirmationToClient, sendBookingNotificationToTransporter, sendBookingNotificationToAdmin } from "@/lib/emails";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// POST /api/booking/confirm-payment — admin confirma manual plata transfer bancar
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Doar admin poate confirma plati manual
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Doar administratorul poate confirma plati" }, { status: 403 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Fetch booking cu detalii
    const { data: booking, error: bookingError } = await serviceClient
      .from("bookings")
      .select("*, company:companies(name, email, cui, smartbill_username, smartbill_token, smartbill_series, smartbill_proforma_series)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking negasit" }, { status: 404 });
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json({ error: "Booking-ul nu este in asteptare pentru plata" }, { status: 400 });
    }

    // Update booking to confirmed
    await serviceClient
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    // Update payment to paid
    await serviceClient
      .from("payments")
      .update({ status: "paid" })
      .eq("booking_id", bookingId);

    const comp = booking.company as any;
    const totalPrice = Number(booking.total_price);

    // Parse notes to get billing info (stored as: "Transfer bancar | name | email")
    const notesParts = (booking.notes || "").split(" | ");
    const clientName = notesParts[1] || "";
    const clientEmail = notesParts[2] || "";

    // Sterge proforma existenta din DB ca sa se poata emite factura noua
    await serviceClient.from("invoices").delete().eq("booking_id", booking.id);

    // Emite factura fiscala (din proforma) + marcheaza incasata + factura comision
    if (comp?.smartbill_username && comp?.smartbill_token) {
      const subtotalWithVat = totalPrice * 0.95;
      const subtotalNoVat = subtotalWithVat / 1.21;
      generateAllInvoices({
        bookingId: booking.id,
        subtotalWithVat,
        platformFee: totalPrice * 0.05,
        route: "Transport",
        date: new Date().toISOString().split("T")[0],
        totalKm: 1,
        pricePerKm: subtotalNoVat,
        transporterName: comp.name || "",
        transporterCui: comp.cui || "",
        transporterEmail: comp.email || "",
        transporterSeries: comp.smartbill_series || "",
        transporterProformaSeries: comp.smartbill_proforma_series || "",
        transporterSmartBillUsername: comp.smartbill_username,
        transporterSmartBillToken: comp.smartbill_token,
        clientName,
        clientEmail,
        paymentMethod: "card", // emite factura incasata + comision
      }).catch((err) => console.error("Invoice generation error:", err));
    }

    // Send confirmation emails to all parties
    const emailData = {
      route: "Transport confirmat",
      departureDate: "",
      transporterName: comp?.name || "",
      totalPrice,
      currency: booking.currency || "ron",
      clientName,
      clientEmail,
      bookingId: booking.id,
    };

    Promise.allSettled([
      clientEmail ? sendBookingConfirmationToClient(emailData) : null,
      comp?.email ? sendBookingNotificationToTransporter({ ...emailData, transporterEmail: comp.email }) : null,
      sendBookingNotificationToAdmin(emailData),
    ].filter(Boolean)).catch((err) => console.error("Email error:", err));

    return NextResponse.json({
      success: true,
      message: `Plata confirmata pentru booking-ul ${bookingId.substring(0, 8).toUpperCase()}. Factura se emite automat.`,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
