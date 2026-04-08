import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat" },
        { status: 401 }
      );
    }

    const {
      vehicleId,
      companyId,
      pickupCity,
      dropoffCity,
      departureDate,
      returnDate,
      totalPrice,
      description,
      passengers,
    } = await request.json();

    // Validate required fields
    if (!vehicleId || !companyId || !pickupCity || !dropoffCity || !departureDate || !totalPrice) {
      return NextResponse.json(
        { error: "Toate câmpurile obligatorii trebuie completate" },
        { status: 400 }
      );
    }

    if (totalPrice <= 0) {
      return NextResponse.json(
        { error: "Prețul trebuie să fie mai mare decât 0" },
        { status: 400 }
      );
    }

    // Verify the user owns this company
    const { data: company, error: companyError } = await supabase
      .from("companii")
      .select("id, owner_id")
      .eq("id", companyId)
      .single();

    if (companyError || !company || company.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Nu ai permisiunea să creezi linkuri pentru această companie" },
        { status: 403 }
      );
    }

    // Create the booking link
    const { data: bookingLink, error: insertError } = await supabase
      .from("linkuri_de_rezervare")
      .insert({
        company_id: companyId,
        vehicle_id: vehicleId,
        pickup_city: pickupCity,
        dropoff_city: dropoffCity,
        departure_date: departureDate,
        return_date: returnDate || null,
        passengers: parseInt(passengers) || 1,
        total_price: parseFloat(totalPrice),
        description: description || null,
      })
      .select("token")
      .single();

    if (insertError) {
      console.error("Booking link insert error:", insertError);
      return NextResponse.json(
        { error: "Eroare la crearea linkului" },
        { status: 500 }
      );
    }

    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ro/book/${bookingLink.token}`;

    return NextResponse.json({
      success: true,
      token: bookingLink.token,
      url: bookingUrl,
    });
  } catch (error) {
    console.error("Booking link API error:", error);
    return NextResponse.json(
      { error: "Eroare server" },
      { status: 500 }
    );
  }
}
