import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      offerId, amount, currency = "ron", description,
      billingData, vehicleId, companyId, requestId,
      departureDate, returnDate,
    } = await request.json();

    const metadata: Record<string, string> = {
      offerId: offerId || "",
      userId: user?.id || "",
    };

    if (vehicleId) metadata.vehicleId = String(vehicleId);
    if (companyId) metadata.companyId = String(companyId);
    if (requestId) metadata.requestId = String(requestId);
    if (departureDate) metadata.departureDate = String(departureDate);
    if (returnDate) metadata.returnDate = String(returnDate);

    if (billingData) {
      if (billingData.name) metadata.billing_name = String(billingData.name).slice(0, 500);
      if (billingData.address) metadata.billing_address = String(billingData.address).slice(0, 500);
      if (billingData.city) metadata.billing_city = String(billingData.city).slice(0, 500);
      if (billingData.county) metadata.billing_county = String(billingData.county).slice(0, 500);
      if (billingData.email) metadata.billing_email = String(billingData.email).slice(0, 500);
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Transport Ocazional ATPSOR",
              description,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ro/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ro/booking/cancel`,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
