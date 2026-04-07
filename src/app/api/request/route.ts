import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "dancarlova@gmail.com";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      pickupCity,
      pickupLocation,
      dropoffCity,
      dropoffLocation,
      intermediateCities,
      departureDate,
      returnDate,
      isRoundTrip,
      passengers,
      vehicleCategory,
      description,
      dayPrograms,
      totalEstimatedKm,
      totalBillableKm,
      includedKm,
      pricePerKm,
      overageRate,
    } = data;

    // Build day program HTML
    const dayProgramsHtml = dayPrograms
      ?.map(
        (day: { day: number; date: string; description: string; estimatedKm: number }) =>
          `<tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Ziua ${day.day}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${day.date || "-"}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${day.description || "-"}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${day.estimatedKm} km</td>
          </tr>`
      )
      .join("") || "";

    const categoryLabels: Record<string, string> = {
      ridesharing: "Ride Sharing (3+1 - 8+1)",
      microbuz: "Microbuz (9 - 23)",
      midiautocar: "Midiautocar (24 - 35)",
      autocar: "Autocar (36 - 52)",
      autocar_maxi: "Autocar Maxi (53 - 60)",
      autocar_grand_turismo: "Autocar Grand Turismo (61 - 80)",
    };

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">ATPSOR - Cerere Nou&#259; de Transport</h1>
        </div>

        <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;">
          <h2 style="color:#1e40af;font-size:16px;margin-top:0;">Traseu</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;width:140px;">Plecare:</td>
              <td style="padding:6px 0;font-weight:bold;">${pickupCity} - ${pickupLocation}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Destina&#539;ie:</td>
              <td style="padding:6px 0;font-weight:bold;">${dropoffCity} - ${dropoffLocation}</td>
            </tr>
            ${intermediateCities ? `
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Traseu detaliat:</td>
              <td style="padding:6px 0;font-weight:bold;">${pickupCity} → ${intermediateCities} → ${dropoffCity}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Data plec&#259;rii:</td>
              <td style="padding:6px 0;">${departureDate}</td>
            </tr>
            ${returnDate ? `<tr><td style="padding:6px 0;color:#6b7280;">Data &#238;ntoarcerii:</td><td style="padding:6px 0;">${returnDate}</td></tr>` : ""}
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Dus-&#238;ntors:</td>
              <td style="padding:6px 0;">${isRoundTrip ? "Da" : "Nu"}</td>
            </tr>
          </table>

          <h2 style="color:#1e40af;font-size:16px;">Pasageri &amp; Vehicul</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;width:140px;">Pasageri:</td>
              <td style="padding:6px 0;font-weight:bold;">${passengers}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Tip vehicul:</td>
              <td style="padding:6px 0;">${vehicleCategory ? categoryLabels[vehicleCategory] || vehicleCategory : "Orice tip"}</td>
            </tr>
          </table>

          ${dayPrograms?.length > 0 ? `
          <h2 style="color:#1e40af;font-size:16px;">Program pe Zile</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#e5e7eb;">
                <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Zi</th>
                <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Data</th>
                <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Program</th>
                <th style="padding:8px;border:1px solid #d1d5db;text-align:right;">Km</th>
              </tr>
            </thead>
            <tbody>
              ${dayProgramsHtml}
            </tbody>
          </table>
          ` : ""}

          <h2 style="color:#1e40af;font-size:16px;">Calcul Kilometri</h2>
          <div style="background:white;padding:12px;border-radius:6px;border:1px solid #e5e7eb;">
            <p style="margin:4px 0;"><strong>Total km estima&#539;i:</strong> ${totalEstimatedKm} km</p>
            <p style="margin:4px 0;"><strong>Total km facturabili:</strong> ${totalBillableKm} km <span style="color:#6b7280;">(min. 200 km/zi)</span></p>
            ${includedKm ? `<p style="margin:4px 0;">Km inclu&#537;i: ${includedKm} km</p>` : ""}
            ${pricePerKm ? `<p style="margin:4px 0;">Pre&#539; pe km: ${pricePerKm} RON</p>` : ""}
            ${overageRate ? `<p style="margin:4px 0;">Tarif dep&#259;&#537;ire: ${overageRate} RON/km</p>` : ""}
          </div>

          ${description ? `
          <h2 style="color:#1e40af;font-size:16px;">Detalii Suplimentare</h2>
          <p style="background:white;padding:12px;border-radius:6px;border:1px solid #e5e7eb;">${description}</p>
          ` : ""}
        </div>

        <div style="background:#1e40af;padding:12px;border-radius:0 0 8px 8px;text-align:center;">
          <p style="color:white;margin:0;font-size:12px;">ATPSOR - Platforma de Transport Ocazional</p>
        </div>
      </div>
    `;

    if (resend) {
      const { error } = await resend.emails.send({
        from: "ATPSOR <onboarding@resend.dev>",
        to: [NOTIFY_EMAIL],
        subject: `Cerere Transport: ${pickupCity} → ${dropoffCity} | ${passengers} pers. | ${departureDate}`,
        html: emailHtml,
      });

      if (error) {
        console.error("Email send error:", error);
      }
    }

    // Save to database if user is authenticated
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: newRequest, error: dbError } = await supabase
          .from("transport_requests")
          .insert({
            client_id: user.id,
            pickup_location: pickupLocation || pickupCity,
            pickup_city: pickupCity,
            dropoff_location: dropoffLocation || dropoffCity,
            dropoff_city: dropoffCity,
            departure_date: departureDate,
            return_date: returnDate || null,
            is_round_trip: isRoundTrip || false,
            passengers: parseInt(passengers) || 1,
            vehicle_category: vehicleCategory || null,
            description: description || null,
            intermediate_cities: intermediateCities || null,
          })
          .select("id")
          .single();

        if (dbError) {
          console.error("DB save error:", dbError);
        }

        return NextResponse.json({
          success: true,
          requestId: newRequest?.id,
        });
      }
    } catch (dbErr) {
      console.error("DB save error:", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Request API error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
