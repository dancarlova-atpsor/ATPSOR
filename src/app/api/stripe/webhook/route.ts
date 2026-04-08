import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";
import { generateAllInvoices } from "@/lib/invoicing";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const {
      offerId, userId, vehicleId, companyId, requestId,
      departureDate, returnDate,
    } = meta;

    const supabase = await createClient();

    // Direct booking flow (no offer in DB)
    if (vehicleId && departureDate) {
      const endDate = returnDate || departureDate;

      // Block vehicle for the booked dates
      await supabase.from("vehicle_blocks").insert({
        vehicle_id: vehicleId,
        start_date: departureDate,
        end_date: endDate,
        reason: "booking",
        booking_reference: session.id,
      });

      // Create booking record
      const { data: booking } = await supabase
        .from("bookings")
        .insert({
          offer_id: null,
          client_id: userId || null,
          company_id: companyId || null,
          total_price: (session.amount_total || 0) / 100,
          currency: session.currency || "ron",
          status: "confirmed",
          notes: requestId ? `request:${requestId}` : null,
        })
        .select()
        .single();

      if (booking) {
        await supabase.from("payments").insert({
          booking_id: booking.id,
          stripe_payment_id: session.payment_intent as string,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || "ron",
          status: "paid",
        });

        // Generate SmartBill invoices (fire-and-forget)
        if (meta.transporterCui && meta.route) {
          // Fetch transporter SmartBill credentials
          let sbUsername = "";
          let sbToken = "";
          if (companyId) {
            const { data: comp } = await supabase.from("companies").select("smartbill_username, smartbill_token").eq("id", companyId).single();
            if (comp) { sbUsername = comp.smartbill_username || ""; sbToken = comp.smartbill_token || ""; }
          }
          generateAllInvoices({
            bookingId: booking.id,
            subtotalWithVat: parseFloat(meta.subtotalWithVat || "0"),
            platformFee: parseFloat(meta.platformFee || "0"),
            route: meta.route || "",
            date: departureDate,
            totalKm: parseFloat(meta.totalKm || "0"),
            pricePerKm: parseFloat(meta.pricePerKm || "0"),
            transporterName: meta.transporterName || "",
            transporterCui: meta.transporterCui || "",
            transporterEmail: meta.transporterEmail || "",
            transporterSeries: meta.transporterSeries || "",
            transporterSmartBillUsername: sbUsername,
            transporterSmartBillToken: sbToken,
            clientName: meta.billing_name || "",
            clientEmail: meta.billing_email || "",
            clientAddress: meta.billing_address || "",
            clientCity: meta.billing_city || "",
            clientCounty: meta.billing_county || "",
          }).catch((err) => console.error("Invoice generation error:", err));
        }
      }
      return NextResponse.json({ received: true });
    }

    // Classic offer-based flow
    if (offerId && !offerId.startsWith("direct-")) {
      const { data: offer } = await supabase
        .from("offers")
        .select("*, request:transport_requests(*)")
        .eq("id", offerId)
        .single();

      if (offer) {
        const req = offer.request as { departure_date?: string; return_date?: string } | null;

        const { data: booking } = await supabase
          .from("bookings")
          .insert({
            offer_id: offerId,
            client_id: userId || null,
            company_id: offer.company_id,
            total_price: offer.price,
            currency: offer.currency,
            status: "confirmed",
          })
          .select()
          .single();

        if (booking) {
          await supabase.from("payments").insert({
            booking_id: booking.id,
            stripe_payment_id: session.payment_intent as string,
            amount: offer.price,
            currency: offer.currency,
            status: "paid",
          });

          // Block vehicle if we have vehicle_id and dates
          if (offer.vehicle_id && req?.departure_date) {
            await supabase.from("vehicle_blocks").insert({
              vehicle_id: offer.vehicle_id,
              start_date: req.departure_date,
              end_date: req.return_date || req.departure_date,
              reason: "booking",
              booking_reference: session.id,
            });
          }

          // Generate SmartBill invoices (fire-and-forget)
          if (meta.transporterCui && meta.route) {
            // Fetch transporter SmartBill credentials
            let sbUser = "";
            let sbTok = "";
            if (offer.company_id) {
              const { data: comp2 } = await supabase.from("companies").select("smartbill_username, smartbill_token").eq("id", offer.company_id).single();
              if (comp2) { sbUser = comp2.smartbill_username || ""; sbTok = comp2.smartbill_token || ""; }
            }
            generateAllInvoices({
              bookingId: booking.id,
              subtotalWithVat: parseFloat(meta.subtotalWithVat || "0"),
              platformFee: parseFloat(meta.platformFee || "0"),
              route: meta.route || "",
              date: req?.departure_date || "",
              totalKm: parseFloat(meta.totalKm || "0"),
              pricePerKm: parseFloat(meta.pricePerKm || "0"),
              transporterName: meta.transporterName || "",
              transporterCui: meta.transporterCui || "",
              transporterEmail: meta.transporterEmail || "",
              transporterSeries: meta.transporterSeries || "",
              transporterSmartBillUsername: sbUser,
              transporterSmartBillToken: sbTok,
              clientName: meta.billing_name || "",
              clientEmail: meta.billing_email || "",
              clientAddress: meta.billing_address || "",
              clientCity: meta.billing_city || "",
              clientCounty: meta.billing_county || "",
            }).catch((err) => console.error("Invoice generation error:", err));
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
