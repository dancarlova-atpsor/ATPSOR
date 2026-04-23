// GET /api/public/transporters
// Endpoint public (nu necesita login) care intoarce lista de transportatori eligibili:
//   - Au cel putin un document de companie incarcat (company_documents)
//   - Au cel putin un vehicul cu fotografii (vehicles.photos[] non-empty)
// Foloseste service role pentru a citi company_documents (RLS blocheaza userii anonimi).

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const [companiesRes, pricingRes, vehiclesRes, companyDocsRes] = await Promise.all([
      supabase
        .from("companies")
        .select(
          "id, name, city, county, rating, total_reviews, is_verified, description, phone, email, logo_url, pickup_cities, created_at"
        )
        .order("created_at", { ascending: true }),
      supabase
        .from("company_pricing")
        .select("company_id, vehicle_category, price_per_km"),
      supabase
        .from("vehicles")
        .select("company_id, photos")
        .eq("is_active", true),
      supabase.from("company_documents").select("company_id"),
    ]);

    const companies = companiesRes.data ?? [];
    const pricing = pricingRes.data ?? [];
    const vehicles = vehiclesRes.data ?? [];
    const companyDocs = companyDocsRes.data ?? [];

    const companiesWithDocs = new Set(
      (companyDocs as { company_id: string }[]).map((d) => d.company_id)
    );

    const companiesWithPhotos = new Set<string>();
    const vehicleCounts: Record<string, number> = {};
    for (const v of vehicles as { company_id: string; photos: string[] | null }[]) {
      vehicleCounts[v.company_id] = (vehicleCounts[v.company_id] || 0) + 1;
      if (v.photos && Array.isArray(v.photos) && v.photos.length > 0) {
        companiesWithPhotos.add(v.company_id);
      }
    }

    const pricingByCompany: Record<string, { categories: string[]; priceMap: Record<string, number> }> = {};
    for (const p of pricing as { company_id: string; vehicle_category: string; price_per_km: number }[]) {
      if (!pricingByCompany[p.company_id]) {
        pricingByCompany[p.company_id] = { categories: [], priceMap: {} };
      }
      const entry = pricingByCompany[p.company_id];
      if (!entry.categories.includes(p.vehicle_category)) {
        entry.categories.push(p.vehicle_category);
      }
      entry.priceMap[p.vehicle_category] = p.price_per_km;
    }

    // Criteriu: documente incarcate + vehicul cu fotografii + aprobat de admin (is_verified)
    const eligible = (companies as any[]).filter(
      (c) =>
        companiesWithDocs.has(c.id) &&
        companiesWithPhotos.has(c.id) &&
        c.is_verified === true
    );

    const mapped = eligible.map((c) => ({
      id: c.id,
      name: c.name ?? "",
      city: c.city ?? "",
      county: c.county ?? "",
      rating: c.rating ?? 0,
      total_reviews: c.total_reviews ?? 0,
      is_verified: c.is_verified ?? false,
      description: c.description ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      logo_url: c.logo_url ?? null,
      vehicles_count: vehicleCounts[c.id] ?? 0,
      categories: pricingByCompany[c.id]?.categories ?? [],
      price_per_km: pricingByCompany[c.id]?.priceMap ?? {},
      pickup_cities: c.pickup_cities ?? [],
      created_at: c.created_at ?? "",
    }));

    // Luxuria mereu prima, restul dupa data inscrierii (cei mai vechi primii)
    mapped.sort((a, b) => {
      const aIsLuxuria = a.name.toLowerCase().includes("luxuria") ? 1 : 0;
      const bIsLuxuria = b.name.toLowerCase().includes("luxuria") ? 1 : 0;
      if (aIsLuxuria !== bIsLuxuria) return bIsLuxuria - aIsLuxuria;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return NextResponse.json({ transporters: mapped });
  } catch (err: any) {
    console.error("Public transporters API error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
