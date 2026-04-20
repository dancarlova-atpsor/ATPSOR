// POST /api/companies/refresh-anaf { companyId } — reverifică CUI la ANAF
// și actualizează is_vat_payer + vat_payer_checked_at.
// Folosit de admin (din pagina de verificare companie) și automat la onboarding.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { verifyCUI } from "@/lib/anaf";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function createUserClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const { companyId } = await request.json();
    if (!companyId) return NextResponse.json({ error: "companyId lipsa" }, { status: 400 });

    const userClient = await createUserClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

    const serviceClient = createServiceClient();

    // Verifică dacă user e owner sau admin
    const { data: company } = await serviceClient
      .from("companies")
      .select("id, cui, owner_id")
      .eq("id", companyId)
      .single();

    if (!company) return NextResponse.json({ error: "Companie negasita" }, { status: 404 });

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = company.owner_id === user.id;
    const isAdmin = profile?.role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

    // Apel ANAF
    const result = await verifyCUI(company.cui);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || "Eroare ANAF" }, { status: 400 });
    }

    // Update companie
    const { error: updateErr } = await serviceClient
      .from("companies")
      .update({
        is_vat_payer: result.platitorTVA,
        vat_payer_checked_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      is_vat_payer: result.platitorTVA,
      denumire: result.denumire,
      adresa: result.adresa,
      statusInactiv: result.statusInactiv,
    });
  } catch (err: any) {
    console.error("refresh-anaf error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
