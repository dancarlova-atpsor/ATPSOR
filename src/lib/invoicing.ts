// Serviciu orchestrare facturi SmartBill
// Genereaza facturi (plata card) sau proforme (transfer bancar)

import {
  generateTransportInvoice,
  generateCommissionInvoice,
  generateLuxuriaCommissionInvoice,
  registerPayment,
  createProforma,
  type SmartBillResponse,
} from "./smartbill";
import { TVA_RATE, PLATFORM_FEE_RATE } from "./distances";
import { createServerClient } from "@supabase/ssr";
import type { InvoiceType } from "@/types/database";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const LUXURIA_COMMISSION_RATE = 0.50; // 50% din comisionul platformei

interface GenerateAllInvoicesParams {
  bookingId: string;
  subtotalWithVat: number;    // suma platita de client FARA platform fee
  platformFee: number;        // comisionul platformei (5% din subtotalWithVat)
  route: string;
  date: string;
  totalKm: number;
  pricePerKm: number;
  // Transportator
  transporterName: string;
  transporterCui: string;
  transporterEmail: string;
  transporterSeries: string;
  transporterSmartBillUsername?: string;
  transporterSmartBillToken?: string;
  // Client
  clientName: string;
  clientEmail: string;
  clientVatCode?: string;
  clientAddress?: string;
  clientCity?: string;
  clientCounty?: string;
  // Payment type
  paymentMethod?: "card" | "bank_transfer";
}

async function saveInvoice(
  bookingId: string,
  invoiceType: InvoiceType,
  issuerName: string,
  issuerCui: string,
  clientName: string,
  amount: number,
  result: SmartBillResponse | null,
) {
  try {
    const supabase = createServiceClient();
    await supabase.from("invoices").upsert(
      {
        booking_id: bookingId,
        invoice_type: invoiceType,
        smartbill_number: result?.number || null,
        smartbill_series: result?.series || null,
        issuer_name: issuerName,
        issuer_cui: issuerCui,
        client_name: clientName,
        amount,
        vat_amount: amount * TVA_RATE,
        currency: "RON",
        status: result?.number ? "issued" : (result?.errorText ? "failed" : "pending"),
        error_message: result?.errorText || null,
      },
      { onConflict: "booking_id,invoice_type" }
    );
  } catch (err) {
    console.error(`Failed to save invoice record (${invoiceType}):`, err);
  }
}

export async function generateAllInvoices(params: GenerateAllInvoicesParams) {
  const vatRate = TVA_RATE * 100; // SmartBill asteapta procentul (ex: 21)
  const subtotalNoVat = params.subtotalWithVat / (1 + TVA_RATE);
  const luxuriaCommission = params.platformFee * LUXURIA_COMMISSION_RATE;
  const isCard = params.paymentMethod !== "bank_transfer";

  // Check idempotency - nu generam duplicate
  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("invoices")
      .select("invoice_type, status")
      .eq("booking_id", params.bookingId)
      .eq("status", "issued");

    const issuedTypes = new Set((existing || []).map((i: { invoice_type: string }) => i.invoice_type));
    if (issuedTypes.size === 3) {
      console.log(`All invoices already issued for booking ${params.bookingId}`);
      return;
    }
  } catch {
    // Continue even if check fails
  }

  // Build auth header for transporter
  let transporterAuth: string | undefined;
  if (params.transporterSmartBillUsername && params.transporterSmartBillToken) {
    transporterAuth = "Basic " + Buffer.from(`${params.transporterSmartBillUsername}:${params.transporterSmartBillToken}`).toString("base64");
  }

  // 1. Factura/Proforma transport: Transportator → Client
  try {
    let result: SmartBillResponse | null;

    if (isCard) {
      // Plata card → Factura + marcare incasata
      result = await generateTransportInvoice({
        transporterCui: params.transporterCui,
        transporterSeries: params.transporterSeries,
        transporterSmartBillUsername: params.transporterSmartBillUsername,
        transporterSmartBillToken: params.transporterSmartBillToken,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        clientVatCode: params.clientVatCode,
        clientAddress: params.clientAddress,
        clientCity: params.clientCity,
        clientCounty: params.clientCounty,
        route: params.route,
        date: params.date,
        totalKm: params.totalKm,
        pricePerKm: params.pricePerKm,
        totalWithoutVat: subtotalNoVat,
        vatRate,
      });

      // Marcare incasata daca factura s-a emis
      if (result?.number && result?.series) {
        const payResult = await registerPayment({
          cif: params.transporterCui,
          seriesName: result.series,
          number: result.number,
          paymentType: "Card",
          value: params.subtotalWithVat,
          authHeader: transporterAuth,
        });
        console.log(`Payment registered: ${payResult?.number || "pending"}`);
      }
    } else {
      // Transfer bancar → Proforma
      result = await createProforma({
        seriesName: params.transporterSeries,
        issuerCui: params.transporterCui,
        authHeader: transporterAuth,
        client: {
          name: params.clientName,
          email: params.clientEmail,
          vatCode: params.clientVatCode,
          address: params.clientAddress,
          city: params.clientCity,
          county: params.clientCounty,
        },
        products: [{
          name: `Transport ocazional persoane: ${params.route} (${params.date})`,
          measuringUnitName: "km",
          quantity: params.totalKm,
          price: params.pricePerKm,
          isTaxIncluded: false,
          taxPercentage: vatRate,
        }],
        currency: "RON",
      });
    }

    await saveInvoice(
      params.bookingId, "transport",
      params.transporterName, params.transporterCui,
      params.clientName, subtotalNoVat, result
    );
    console.log(`Transport ${isCard ? "invoice" : "proforma"}: ${result?.number || "pending"}`);
  } catch (err) {
    console.error("Transport invoice/proforma error:", err);
    await saveInvoice(
      params.bookingId, "transport",
      params.transporterName, params.transporterCui,
      params.clientName, subtotalNoVat, { errorText: String(err) }
    );
  }

  // 2. Factura comision: ATPSOR → Transportator (5%) — doar la plata card
  if (isCard) {
    try {
      const result = await generateCommissionInvoice({
        transporterName: params.transporterName,
        transporterCui: params.transporterCui,
        transporterEmail: params.transporterEmail,
        commissionAmount: params.platformFee / (1 + TVA_RATE), // fara TVA
        route: params.route,
        date: params.date,
        vatRate,
      });
      await saveInvoice(
        params.bookingId, "commission",
        "ATPSOR", process.env.SMARTBILL_COMPANY_VAT || "",
        params.transporterName, params.platformFee / (1 + TVA_RATE), result
      );
      console.log(`Commission invoice: ${result?.number || "pending"}`);
    } catch (err) {
      console.error("Commission invoice error:", err);
      await saveInvoice(
        params.bookingId, "commission",
        "ATPSOR", process.env.SMARTBILL_COMPANY_VAT || "",
        params.transporterName, params.platformFee / (1 + TVA_RATE),
        { errorText: String(err) }
      );
    }
  }

  // 3. Factura Luxuria: Luxuria Trans Travel → ATPSOR (50% din comision) — doar la plata card
  if (isCard) {
    try {
      const luxuriaName = process.env.LUXURIA_NAME || "Luxuria Trans Travel SRL";
      const luxuriaCui = process.env.LUXURIA_SMARTBILL_VAT || "";
      const result = await generateLuxuriaCommissionInvoice({
        commissionAmount: luxuriaCommission / (1 + TVA_RATE), // fara TVA
        route: params.route,
        date: params.date,
        vatRate,
      });
      await saveInvoice(
        params.bookingId, "luxuria_commission",
        luxuriaName, luxuriaCui,
        "ATPSOR", luxuriaCommission / (1 + TVA_RATE), result
      );
      console.log(`Luxuria commission invoice: ${result?.number || "pending"}`);
    } catch (err) {
      console.error("Luxuria commission invoice error:", err);
      await saveInvoice(
        params.bookingId, "luxuria_commission",
        process.env.LUXURIA_NAME || "Luxuria Trans Travel SRL",
        process.env.LUXURIA_SMARTBILL_VAT || "",
        "ATPSOR", luxuriaCommission / (1 + TVA_RATE),
        { errorText: String(err) }
      );
    }
  }
}
