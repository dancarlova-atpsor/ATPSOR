import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { sendBookingConfirmationToClient, sendBookingNotificationToTransporter, sendBookingNotificationToAdmin } from "@/lib/emails";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// POST /api/booking/bank-transfer — create booking with bank transfer payment
export async function POST(request: Request) {
  try {
    const {
      vehicleId, companyId, offerId, requestId,
      departureDate, returnDate,
      totalPrice, currency = "ron",
      billingData, route,
      transporterName, transporterEmail,
    } = await request.json();

    if (!totalPrice || !billingData?.email) {
      return NextResponse.json({ error: "Date incomplete" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = createServiceClient();

    // Create booking with status pending_payment
    const { data: booking, error: bookingError } = await serviceClient
      .from("bookings")
      .insert({
        offer_id: offerId || null,
        client_id: user?.id || null,
        company_id: companyId || null,
        total_price: totalPrice,
        currency,
        status: "pending_payment",
        notes: `Transfer bancar | ${billingData.name} | ${billingData.email}`,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      return NextResponse.json({ error: "Eroare la crearea rezervării" }, { status: 500 });
    }

    // Block vehicle dates
    if (vehicleId && departureDate) {
      await serviceClient.from("vehicle_blocks").insert({
        vehicle_id: vehicleId,
        start_date: departureDate,
        end_date: returnDate || departureDate,
        reason: "booking",
        booking_reference: `bank-${booking.id}`,
      });
    }

    // If offer-based, update offer status
    if (offerId) {
      await serviceClient.from("offers").update({ status: "accepted" }).eq("id", offerId);
    }
    if (requestId) {
      await serviceClient.from("transport_requests").update({ status: "fulfilled" }).eq("id", requestId);
    }

    // Create payment record with status pending
    await serviceClient.from("payments").insert({
      booking_id: booking.id,
      stripe_payment_id: `bank-transfer-${booking.id}`,
      amount: totalPrice,
      currency,
      status: "pending",
    });

    // Send email with bank transfer details
    if (resend && billingData.email) {
      const bankDetailsHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">ATPSOR - Rezervare Confirmata (Transfer Bancar)</h1>
          </div>
          <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;">
            <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin-bottom:16px;">
              <p style="margin:0;font-size:16px;font-weight:bold;color:#1e40af;">Rezervarea ta este in asteptare!</p>
              <p style="margin:4px 0 0;color:#2563eb;font-size:14px;">Efectueaza transferul bancar pentru confirmarea finala.</p>
            </div>

            <h2 style="color:#1e40af;font-size:16px;">Detalii Transport</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Traseu:</td><td style="padding:6px 0;font-weight:bold;">${route || "N/A"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Data:</td><td style="padding:6px 0;font-weight:bold;">${departureDate}${returnDate ? ` → ${returnDate}` : ""}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Transportator:</td><td style="padding:6px 0;font-weight:bold;">${transporterName || "N/A"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Total de plata:</td><td style="padding:6px 0;font-weight:bold;color:#dc2626;font-size:18px;">${totalPrice.toFixed(2)} RON</td></tr>
            </table>

            <h2 style="color:#1e40af;font-size:16px;">Date Transfer Bancar</h2>
            <div style="background:white;border:2px solid #1e40af;border-radius:8px;padding:16px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Beneficiar:</td><td style="padding:6px 0;font-weight:bold;">ATPSOR</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280;">IBAN:</td><td style="padding:6px 0;font-weight:bold;font-family:monospace;letter-spacing:1px;">RO49 AAAA 1B31 0075 9384 0000</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280;">Banca:</td><td style="padding:6px 0;font-weight:bold;">Banca Transilvania</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280;">Suma:</td><td style="padding:6px 0;font-weight:bold;color:#dc2626;">${totalPrice.toFixed(2)} RON</td></tr>
                <tr><td style="padding:6px 0;color:#6b7280;">Referinta:</td><td style="padding:6px 0;font-weight:bold;font-family:monospace;">ATPSOR-${booking.id.substring(0, 8).toUpperCase()}</td></tr>
              </table>
            </div>

            <div style="margin-top:16px;padding:12px;background:#fef3c7;border-radius:6px;border:1px solid #fcd34d;">
              <p style="margin:0;font-size:13px;color:#92400e;">
                <strong>Important:</strong> Mentioneaza referinta <strong>ATPSOR-${booking.id.substring(0, 8).toUpperCase()}</strong> in descrierea platii.
                Rezervarea va fi confirmata dupa primirea platii (1-2 zile lucratoare).
              </p>
            </div>
          </div>
          <div style="background:#1e40af;padding:12px;border-radius:0 0 8px 8px;text-align:center;">
            <p style="color:white;margin:0;font-size:12px;">ATPSOR - Platforma de Transport Ocazional</p>
          </div>
        </div>`;

      await resend.emails.send({
        from: "ATPSOR <onboarding@resend.dev>",
        to: [billingData.email],
        subject: `Rezervare ATPSOR - Detalii Transfer Bancar | ${route || "Transport"}`,
        html: bankDetailsHtml,
      }).catch((err) => console.error("Bank transfer email error:", err));
    }

    // Notify transporter + admin
    const vehicleName = vehicleId
      ? (await serviceClient.from("vehicles").select("name").eq("id", vehicleId).single()).data?.name
      : undefined;

    Promise.allSettled([
      sendBookingNotificationToTransporter({
        route: route || "N/A",
        departureDate: departureDate || "",
        returnDate,
        transporterEmail: transporterEmail || "",
        transporterName: transporterName || "",
        clientName: billingData.name || "",
        clientEmail: billingData.email || "",
        vehicleName,
        totalPrice,
        currency,
      }),
      sendBookingNotificationToAdmin({
        route: route || "N/A",
        departureDate: departureDate || "",
        returnDate,
        clientName: billingData.name || "",
        clientEmail: billingData.email || "",
        transporterName: transporterName || "",
        vehicleName,
        totalPrice,
        currency,
      }),
    ]).catch(() => {});

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      reference: `ATPSOR-${booking.id.substring(0, 8).toUpperCase()}`,
    });
  } catch (error) {
    console.error("Bank transfer booking error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
