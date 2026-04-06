import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";

// Create a Stripe Connect account for a transporter
export async function POST(request: Request) {
  try {
    const { email, companyName, returnUrl } = await request.json();
    const stripe = getStripe();

    // Create connected account
    const account = await stripe.accounts.create({
      type: "express",
      country: "RO",
      email,
      business_type: "company",
      company: {
        name: companyName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true&account=${account.id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Connect account" },
      { status: 500 }
    );
  }
}
