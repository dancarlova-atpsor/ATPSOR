import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { generateAllInvoices } from "@/lib/invoicing";
import {
  sendBookingConfirmationToClient,
  sendBookingNotificationToTransporter,
  sendBookingNotificationToAdmin,
} from "@/lib/emails";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// Helper: fetch vehicle name for emails
async function getVehicleName(supabase: ReturnType<typeof createServiceClient>, vehicleId: string | undefined) {
  if (!vehicleId) return undefined;
  const { data } = await supabase.from("vehicles").select("name").eq("id", vehicleId).single();
  return data?.name || undefined;
}

// Helper: fetch transporter email from company
async function getTransporterEmail(supabase: ReturnType<typeof createServiceClient>, companyId: string | undefined) {
  if (!companyId) return { email: "", name: "" };
  const { data } = await supabase.from("companies").select("email, name, owner_id").eq("id", companyId).single();
  if (data?.email) return { email: data.email, name: data.name || "" };
  // Fallback: get email from owner profile
  if (data?.owner_id) {
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", data.owner_id).single();
    return { email: profile?.email || "", name: data.name || "" };
  }
  return { email: "", name: data?.name || "" };
}

// Helper: send all notification emails (fire-and-forget)
async function sendBookingEmails(params: {
  route: string;
  departureDate: string;
  returnDate?: string;
  clientName: string;
  clientEmail: string;
  transporterName: string;
  transporterEmail: string;
  vehicleName?: string;
  totalPrice: number;
  currency: string;
  bookingId?: string;
}) {
  const promises: Promise<void>[] = [];

  // Email to client
  if (params.clientEmail) {
    promises.push(sendBookingConfirmationToClient(params));
  }

  // Email to transporter
  if (params.transporterEmail) {
    promises.push(sendBookingNotificationToTransporter(params));
  }

  // Email to admin
  promises.push(sendBookingNotificationToAdmin(params));

  await Promise.allSettled(promises);
}

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

    const supabase = createServiceClient();
    const totalPrice = (session.amount_total || 0) / 100;
    const currency = session.currency || "ron";

    console.log("Webhook metadata:", JSON.stringify(meta));

    // Direct booking flow (no offer in DB)
    if (vehicleId && departureDate) {
      console.log("Entering direct booking flow");
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
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          offer_id: null,
          client_id: userId || null,
          company_id: companyId || null,
          total_price: totalPrice,
          currency,
          status: "confirmed",
          notes: requestId ? `request:${requestId}` : null,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("BOOKING INSERT ERROR:", bookingError.message, bookingError);
      }
      console.log("Booking created:", booking?.id || "FAILED");

      if (booking) {
        await supabase.from("payments").insert({
          booking_id: booking.id,
          stripe_payment_id: session.payment_intent as string,
          amount: totalPrice,
          currency,
          status: "paid",
        });

        // Send notification emails (fire-and-forget)
        const vehicleName = await getVehicleName(supabase, vehicleId);
        const transporter = await getTransporterEmail(supabase, companyId);
        sendBookingEmails({
          route: meta.route || "N/A",
          departureDate,
          returnDate,
          clientName: meta.billing_name || "",
          clientEmail: meta.billing_email || "",
          transporterName: meta.transporterName || transporter.name,
          transporterEmail: meta.transporterEmail || transporter.email,
          vehicleName,
          totalPrice,
          currency,
          bookingId: booking.id,
        }).catch((err) => console.error("Email notification error:", err));

        // Generate SmartBill invoices (fire-and-forget)
        if (meta.transporterCui && meta.route) {
          let sbUsername = "";
          let sbToken = "";
          let sbProforma = "";
          if (companyId) {
            const { data: comp } = await supabase.from("companies").select("smartbill_username, smartbill_token, smartbill_proforma_series").eq("id", companyId).single();
            if (comp) { sbUsername = comp.smartbill_username || ""; sbToken = comp.smartbill_token || ""; sbProforma = (comp as any).smartbill_proforma_series || ""; }
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
            transporterProformaSeries: sbProforma,
            transporterSmartBillUsername: sbUsername,
            transporterSmartBillToken: sbToken,
            clientName: meta.billing_name || "",
            clientEmail: meta.billing_email || "",
            clientAddress: meta.billing_address || "",
            clientCity: meta.billing_city || "",
            clientCounty: meta.billing_county || "",
            paymentMethod: "card",
          }).catch((err) => console.error("Invoice generation error:", err));
        }
      }
      return NextResponse.json({ received: true });
    }

    // Classic offer-based flow
    if (offerId && !offerId.startsWith("direct-")) {
      const { data: offer } = await supabase
        .from("offers")
        .select("*, request:transport_requests(*), company:companies(name, email, owner_id)")
        .eq("id", offerId)
        .single();

      if (offer) {
        const req = offer.request as { departure_date?: string; return_date?: string; pickup_city?: string; dropoff_city?: string } | null;
        const comp = offer.company as { name?: string; email?: string; owner_id?: string } | null;

        // Update offer status to accepted
        await supabase.from("offers").update({ status: "accepted" }).eq("id", offerId);

        // Update request status to fulfilled
        if (requestId) {
          await supabase.from("transport_requests").update({ status: "fulfilled" }).eq("id", requestId);
        }

        const { data: booking } = await supabase
          .from("bookings")
          .insert({
            offer_id: offerId,
            client_id: userId || null,
            company_id: offer.company_id,
            total_price: totalPrice,
            currency,
            status: "confirmed",
          })
          .select()
          .single();

        if (booking) {
          await supabase.from("payments").insert({
            booking_id: booking.id,
            stripe_payment_id: session.payment_intent as string,
            amount: totalPrice,
            currency,
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

          // Send notification emails (fire-and-forget)
          const vehicleName = await getVehicleName(supabase, offer.vehicle_id);
          const route = meta.route || (req?.pickup_city && req?.dropoff_city ? `${req.pickup_city} → ${req.dropoff_city}` : "N/A");
          const transporter = await getTransporterEmail(supabase, offer.company_id);
          sendBookingEmails({
            route,
            departureDate: req?.departure_date || departureDate || "",
            returnDate: req?.return_date || returnDate,
            clientName: meta.billing_name || "",
            clientEmail: meta.billing_email || "",
            transporterName: meta.transporterName || transporter.name,
            transporterEmail: meta.transporterEmail || transporter.email,
            vehicleName,
            totalPrice,
            currency,
            bookingId: booking.id,
          }).catch((err) => console.error("Email notification error:", err));

          // Generate SmartBill invoices (fire-and-forget)
          if (meta.transporterCui && meta.route) {
            let sbUser = "";
            let sbTok = "";
            let sbProf = "";
            if (offer.company_id) {
              const { data: comp2 } = await supabase.from("companies").select("smartbill_username, smartbill_token, smartbill_proforma_series").eq("id", offer.company_id).single();
              if (comp2) { sbUser = comp2.smartbill_username || ""; sbTok = comp2.smartbill_token || ""; sbProf = (comp2 as any).smartbill_proforma_series || ""; }
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
              transporterProformaSeries: sbProf,
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
