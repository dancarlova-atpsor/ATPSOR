import { NextResponse } from "next/server";

// Google Maps Distance Matrix API - calculeaza distanta reala intre orase
// Waypoints: lista de orase in ordine (ex: ["București", "Brașov", "Sibiu"])
// Calculeaza segment cu segment: A→B + B→C + ...

export async function POST(request: Request) {
  try {
    const { waypoints } = await request.json();

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json(
        { error: "Minim 2 waypoints necesare" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured", fallback: true },
        { status: 503 }
      );
    }

    // Calculeaza distanta pentru fiecare segment
    const segments: { from: string; to: string; km: number }[] = [];
    let totalKm = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const origin = encodeURIComponent(waypoints[i] + ", Romania");
      const destination = encodeURIComponent(waypoints[i + 1] + ", Romania");

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&language=ro&key=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();

      if (
        data.status === "OK" &&
        data.rows?.[0]?.elements?.[0]?.status === "OK"
      ) {
        const distanceMeters = data.rows[0].elements[0].distance.value;
        const km = Math.round(distanceMeters / 1000);
        segments.push({
          from: waypoints[i],
          to: waypoints[i + 1],
          km,
        });
        totalKm += km;
      } else {
        // Segment not found
        segments.push({
          from: waypoints[i],
          to: waypoints[i + 1],
          km: 0,
        });
      }
    }

    return NextResponse.json({ totalKm, segments });
  } catch (error) {
    console.error("Distance API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate distance", fallback: true },
      { status: 500 }
    );
  }
}
