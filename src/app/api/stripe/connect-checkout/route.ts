import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";

// Create a checkout session with Connect (split payment)
export async function POST(request: Request) {
  try {
    const {
      transporterStripeAccountId,
      amount, // total amount in RON
      currency = "ron",
      description,
      offerId,
    } = await request.json();

    const stripe = getStripe();

    const PLATFORM_FEE_PERCENT = 5;
    const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100); // in bani (cents)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Transport Ocazional ATPSOR",
              description,
            },
            unit_amount: Math.round(amount * 100), // convert to bani
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee, // 5% stays with ATPSOR
        transfer_data: {
          destination: transporterStripeAccountId, // 95% goes to transporter
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ro/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ro/booking/cancel`,
      metadata: {
        offerId,
        transporterAccountId: transporterStripeAccountId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Connect checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout" },
      { status: 500 }
    );
  }
}
