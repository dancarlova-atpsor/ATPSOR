import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";
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
    const { offerId, userId } = session.metadata!;

    const supabase = await createClient();

    // Get offer details
    const { data: offer } = await supabase
      .from("offers")
      .select("*, request:transport_requests(*)")
      .eq("id", offerId)
      .single();

    if (offer) {
      // Create booking
      const { data: booking } = await supabase
        .from("bookings")
        .insert({
          offer_id: offerId,
          client_id: userId,
          company_id: offer.company_id,
          total_price: offer.price,
          currency: offer.currency,
          status: "confirmed",
        })
        .select()
        .single();

      if (booking) {
        // Record payment
        await supabase.from("payments").insert({
          booking_id: booking.id,
          stripe_payment_id: session.payment_intent as string,
          amount: offer.price,
          currency: offer.currency,
          status: "paid",
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
