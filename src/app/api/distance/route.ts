import { NextResponse } from "next/server";

// Google Maps Directions API - calculeaza distanta reala ca un singur traseu cu waypoints
// Returneaza km totali exacti, identic cu Google Maps

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

    const origin = encodeURIComponent(waypoints[0] + ", Romania");
    const destination = encodeURIComponent(waypoints[waypoints.length - 1] + ", Romania");

    // Intermediate waypoints (everything between first and last)
    const intermediates = waypoints.slice(1, -1);
    const waypointsParam = intermediates.length > 0
      ? `&waypoints=${intermediates.map((w: string) => encodeURIComponent(w + ", Romania")).join("|")}`
      : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsParam}&mode=driving&language=ro&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.routes?.[0]?.legs) {
      const legs = data.routes[0].legs;
      let totalKm = 0;
      const segments: { from: string; to: string; km: number }[] = [];

      for (const leg of legs) {
        const km = Math.round(leg.distance.value / 1000);
        totalKm += km;
        segments.push({
          from: leg.start_address,
          to: leg.end_address,
          km,
        });
      }

      return NextResponse.json({ totalKm, segments });
    }

    return NextResponse.json(
      { error: "Route not found", fallback: true },
      { status: 404 }
    );
  } catch (error) {
    console.error("Distance API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate distance", fallback: true },
      { status: 500 }
    );
  }
}
