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
      offerId, subtotalWithVat, platformFee, currency = "ron", description,
      billingData, vehicleId, companyId, requestId,
      departureDate, returnDate,
      // Connect fields
      transporterStripeAccountId,
      // Invoice fields
      transporterName, transporterCui, transporterEmail, transporterSeries,
      route, totalKm, pricePerKm,
    } = await request.json();

    // Total = subtotalWithVat + platformFee
    const totalAmount = (subtotalWithVat || 0) + (platformFee || 0);

    const metadata: Record<string, string> = {
      offerId: offerId || "",
      userId: user?.id || "",
    };

    if (vehicleId) metadata.vehicleId = String(vehicleId);
    if (companyId) metadata.companyId = String(companyId);
    if (requestId) metadata.requestId = String(requestId);
    if (departureDate) metadata.departureDate = String(departureDate);
    if (returnDate) metadata.returnDate = String(returnDate);

    // Billing data
    if (billingData) {
      if (billingData.name) metadata.billing_name = String(billingData.name).slice(0, 500);
      if (billingData.address) metadata.billing_address = String(billingData.address).slice(0, 500);
      if (billingData.city) metadata.billing_city = String(billingData.city).slice(0, 500);
      if (billingData.county) metadata.billing_county = String(billingData.county).slice(0, 500);
      if (billingData.email) metadata.billing_email = String(billingData.email).slice(0, 500);
    }

    // Invoice data for webhook
    if (route) metadata.route = String(route).slice(0, 500);
    if (totalKm) metadata.totalKm = String(totalKm);
    if (pricePerKm) metadata.pricePerKm = String(pricePerKm);
    if (subtotalWithVat) metadata.subtotalWithVat = String(subtotalWithVat);
    if (platformFee) metadata.platformFee = String(platformFee);
    if (transporterName) metadata.transporterName = String(transporterName).slice(0, 500);
    if (transporterCui) metadata.transporterCui = String(transporterCui);
    if (transporterEmail) metadata.transporterEmail = String(transporterEmail).slice(0, 500);
    if (transporterSeries) metadata.transporterSeries = String(transporterSeries);

    const stripe = getStripe();

    // Stripe Connect: split payment daca transportatorul are cont Stripe
    const useConnect = !!transporterStripeAccountId;
    const platformFeeBani = Math.round((platformFee || 0) * 100); // RON → bani

    const sessionConfig: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Transport Ocazional ATPSOR",
              description,
            },
            unit_amount: Math.round(totalAmount * 100), // RON → bani
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ro/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ro/booking/cancel`,
      metadata,
    };

    // Adauga Connect split daca avem Stripe account
    if (useConnect) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFeeBani, // 5% ramane la ATPSOR
        transfer_data: {
          destination: transporterStripeAccountId, // 95% merge la transportator
        },
      };
      metadata.transporterAccountId = transporterStripeAccountId;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
