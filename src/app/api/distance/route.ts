import { NextResponse } from "next/server";

// Google Maps Directions API - calculeaza distanta reala ca un singur traseu cu waypoints
// Returneaza km totali exacti, identic cu Google Maps
//
// Accepta:
//   - waypoints: string[] (backward-compat, presupune Romania)
//   - waypoints: Array<{ city: string; country?: string }>
//   - pickupCountry / dropoffCountry / intermediateCountry ca override

// Mapare cod ISO -> nume tara pentru Google (ca sa gaseasca adresele corect)
const COUNTRY_NAMES: Record<string, string> = {
  RO: "Romania",
  BG: "Bulgaria",
  HU: "Hungary",
  AT: "Austria",
  DE: "Germany",
  IT: "Italy",
  FR: "France",
  ES: "Spain",
  GR: "Greece",
  PL: "Poland",
  CZ: "Czech Republic",
  SK: "Slovakia",
  NL: "Netherlands",
  BE: "Belgium",
  GB: "United Kingdom",
  TR: "Turkey",
  RS: "Serbia",
  UA: "Ukraine",
  MD: "Moldova",
  OTHER: "", // nu adaugam tara - Google decide singur din context
};

function formatWaypoint(wp: any, fallbackCountry?: string): string {
  if (typeof wp === "string") {
    const country = fallbackCountry ? COUNTRY_NAMES[fallbackCountry] || fallbackCountry : "Romania";
    return country ? `${wp}, ${country}` : wp;
  }
  if (wp && typeof wp === "object") {
    const country = wp.country ? COUNTRY_NAMES[wp.country] || wp.country : "";
    return country ? `${wp.city}, ${country}` : wp.city;
  }
  return String(wp);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { waypoints, pickupCountry, dropoffCountry, intermediateCountry } = body;

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

    // Formateaza waypoints cu tara corecta
    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];
    const intermediates = waypoints.slice(1, -1);

    const originStr = formatWaypoint(first, pickupCountry);
    const destStr = formatWaypoint(last, dropoffCountry);
    // Pentru intermediari, daca e rute internationale, folosim intermediateCountry sau
    // tara celui mai apropiat pol (plecare pentru dus, destinatie pentru intors)
    const intermediateCountries = Array.isArray(intermediateCountry) ? intermediateCountry : null;

    const origin = encodeURIComponent(originStr);
    const destination = encodeURIComponent(destStr);

    const waypointsParam = intermediates.length > 0
      ? `&waypoints=${intermediates.map((w: any, idx: number) => {
          const c = intermediateCountries?.[idx] || intermediateCountry || pickupCountry || dropoffCountry;
          return encodeURIComponent(formatWaypoint(w, c));
        }).join("|")}`
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

    // Log exact eroarea ca sa putem debugga
    console.error("Google Maps Directions API failed:", {
      status: data.status,
      error_message: data.error_message,
      origin: originStr,
      destination: destStr,
    });

    return NextResponse.json(
      { error: data.error_message || data.status || "Route not found", fallback: true, googleStatus: data.status },
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
