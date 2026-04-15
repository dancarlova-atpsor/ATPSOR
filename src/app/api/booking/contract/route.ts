import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// GET /api/booking/contract?id=xxx - returneaza datele contract pentru pagina publica
// UUID-ul e secret, oricine cu el poate vedea contractul (similar cu link-urile de plata)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data: booking, error } = await serviceClient
      .from("bookings")
      .select(`
        id, total_price, currency, created_at, notes,
        pickup_city, dropoff_city, departure_date, return_date,
        client_name, client_email, client_address,
        company:companies(name, cui, address, city, county),
        vehicle:vehicles(name, seats),
        offer:offers(
          request:transport_requests(pickup_city, dropoff_city, departure_date, return_date),
          vehicle:vehicles(name, seats)
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Contract negasit" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Contract API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
