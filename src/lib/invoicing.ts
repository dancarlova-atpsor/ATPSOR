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
import { convertEurToRonWithMargin } from "./bnr";
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
  subtotalWithVat: number;    // suma platita de client FARA platform fee (in currency-ul cursei)
  platformFee: number;        // comisionul platformei (5% din subtotalWithVat, in currency-ul cursei)
  route: string;
  date: string;
  totalKm: number;
  pricePerKm: number;
  // Transportator
  transporterName: string;
  transporterCui: string;
  transporterEmail: string;
  transporterSeries: string;          // serie LEI (RON) pentru curse interne
  transporterSeriesExternal?: string; // serie EURO pentru curse externe
  transporterProformaSeries?: string;
  transporterSmartBillUsername?: string;
  transporterSmartBillToken?: string;
  transporterIsVatPayer?: boolean;    // default true
  // Client
  clientName: string;
  clientEmail: string;
  clientVatCode?: string;
  clientAddress?: string;
  clientCity?: string;
  clientCounty?: string;
  // Payment type + trip type
  paymentMethod?: "card" | "bank_transfer";
  isInternational?: boolean;
  currency?: "RON" | "EUR";           // default RON
}

async function saveInvoice(
  bookingId: string,
  invoiceType: InvoiceType,
  issuerName: string,
  issuerCui: string,
  clientName: string,
  amount: number,
  result: SmartBillResponse | null,
  currency: "RON" | "EUR" = "RON",
  effectiveVatRate: number = TVA_RATE,
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
        vat_amount: amount * effectiveVatRate,
        currency,
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
  const isInternational = params.isInternational === true;
  const isVatPayer = params.transporterIsVatPayer !== false; // default true
  const currency: "RON" | "EUR" = params.currency || "RON";
  const isCard = params.paymentMethod !== "bank_transfer";

  // Cota TVA efectiva pentru factura transport:
  // - Extern: 0 (SDD art. 294)
  // - Neplatitor TVA: 0 (art. 310)
  // - Altfel: 21
  const effectiveVatRate = (isInternational || !isVatPayer) ? 0 : TVA_RATE;
  const vatRatePct = effectiveVatRate * 100; // SmartBill asteapta procentul

  // subtotalWithVat aici = subtotalNoVat daca TVA e 0 (subtotalWithVat nu include TVA in cazul asta)
  const subtotalNoVat = params.subtotalWithVat / (1 + effectiveVatRate);
  const luxuriaCommission = params.platformFee * LUXURIA_COMMISSION_RATE;

  // Pentru curs BNR + 2% (comision ATPSOR → transportator si Luxuria → ATPSOR sunt IN RON)
  // daca cursa e in EUR, convertim
  const platformFeeInRon = currency === "EUR"
    ? (await convertEurToRonWithMargin(params.platformFee)).ron
    : params.platformFee;
  const luxuriaCommissionInRon = currency === "EUR"
    ? (await convertEurToRonWithMargin(luxuriaCommission)).ron
    : luxuriaCommission;

  // Selectare serie corectă (LEI pentru intern, EURO pentru extern)
  const transporterSeriesEffective = isInternational && params.transporterSeriesExternal
    ? params.transporterSeriesExternal
    : params.transporterSeries;

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
        transporterSeries: transporterSeriesEffective,
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
        vatRate: vatRatePct,
        currency,
        isInternational,
        isVatPayer,
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

        // Trimite factura PDF atasata clientului via Resend (mai sigur decat SmartBill email)
        if (params.clientEmail) {
          (async () => {
            try {
              const { getInvoicePdf } = await import("./smartbill");
              const { sendInvoicePdfToClient } = await import("./emails");
              const pdf = await getInvoicePdf({
                cif: params.transporterCui,
                seriesName: result!.series!,
                number: result!.number!,
                authHeader: transporterAuth,
              });
              if (pdf) {
                await sendInvoicePdfToClient({
                  clientEmail: params.clientEmail,
                  clientName: params.clientName,
                  invoiceNumber: result!.number!,
                  invoiceSeries: result!.series!,
                  pdfBuffer: pdf,
                  isProforma: false,
                  transporterName: params.transporterName,
                });
              }
            } catch (err) {
              console.error("Send invoice PDF error:", err);
            }
          })();
        }
      }
    } else {
      // Transfer bancar → Proforma (foloseste seria de proforma, nu de factura)
      let productName = `Transport ocazional persoane: ${params.route} (${params.date})`;
      if (isInternational) productName += " — Scutit cu drept de deducere, art. 294 alin. (1) lit. c) Cod Fiscal";
      else if (!isVatPayer) productName += " — Neplatitor TVA conform art. 310 Cod Fiscal";

      result = await createProforma({
        seriesName: params.transporterProformaSeries || transporterSeriesEffective,
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
          name: productName,
          measuringUnitName: "km",
          quantity: params.totalKm,
          price: params.pricePerKm,
          isTaxIncluded: false,
          taxPercentage: vatRatePct,
        }],
        currency,
      });

      // Trimite proforma email - cu PDF daca SmartBill returneaza, fara daca nu
      if (result?.number && result?.series && params.clientEmail) {
        (async () => {
          try {
            const { getInvoicePdf } = await import("./smartbill");
            const { sendInvoicePdfToClient, sendProformaInfoEmail } = await import("./emails");

            // Incearca download PDF
            let pdf: Buffer | null = null;
            try {
              pdf = await getInvoicePdf({
                cif: params.transporterCui,
                seriesName: result!.series!,
                number: result!.number!,
                authHeader: transporterAuth,
                isProforma: true,
              });
            } catch (e) {
              console.error("Proforma PDF download failed:", e);
            }

            if (pdf) {
              // Cu PDF atasat
              await sendInvoicePdfToClient({
                clientEmail: params.clientEmail,
                clientName: params.clientName,
                invoiceNumber: result!.number!,
                invoiceSeries: result!.series!,
                pdfBuffer: pdf,
                isProforma: true,
                transporterName: params.transporterName,
              });
            } else {
              // Fara PDF - trimite email cu detalii proforma
              await sendProformaInfoEmail({
                clientEmail: params.clientEmail,
                clientName: params.clientName,
                proformaNumber: result!.number!,
                proformaSeries: result!.series!,
                transporterName: params.transporterName,
                amount: params.subtotalWithVat,
              });
            }
          } catch (err) {
            console.error("Send proforma email error:", err);
          }
        })();
      }
    }

    await saveInvoice(
      params.bookingId, "transport",
      params.transporterName, params.transporterCui,
      params.clientName, subtotalNoVat, result,
      currency, effectiveVatRate
    );
    console.log(`Transport ${isCard ? "invoice" : "proforma"}: ${result?.number || "pending"}`);
  } catch (err) {
    console.error("Transport invoice/proforma error:", err);
    await saveInvoice(
      params.bookingId, "transport",
      params.transporterName, params.transporterCui,
      params.clientName, subtotalNoVat, { errorText: String(err) },
      currency, effectiveVatRate
    );
  }

  // 2. Factura comision: ATPSOR → Transportator (5%) — doar la plata card
  //    ATPSOR e platitor TVA si emite intotdeauna in RON, TVA 21%.
  //    Daca cursa e in EUR, convertim platformFee la RON cu cursul BNR + 2%.
  if (isCard) {
    const atpsorVatPct = TVA_RATE * 100; // ATPSOR e platitor TVA
    try {
      const result = await generateCommissionInvoice({
        transporterName: params.transporterName,
        transporterCui: params.transporterCui,
        transporterEmail: params.transporterEmail,
        commissionAmount: platformFeeInRon / (1 + TVA_RATE), // fara TVA
        route: params.route,
        date: params.date,
        vatRate: atpsorVatPct,
      });
      await saveInvoice(
        params.bookingId, "commission",
        "ATPSOR", process.env.SMARTBILL_COMPANY_VAT || "",
        params.transporterName, platformFeeInRon / (1 + TVA_RATE), result,
        "RON", TVA_RATE
      );
      console.log(`Commission invoice: ${result?.number || "pending"}`);
    } catch (err) {
      console.error("Commission invoice error:", err);
      await saveInvoice(
        params.bookingId, "commission",
        "ATPSOR", process.env.SMARTBILL_COMPANY_VAT || "",
        params.transporterName, platformFeeInRon / (1 + TVA_RATE),
        { errorText: String(err) }, "RON", TVA_RATE
      );
    }
  }

  // 3. Factura Luxuria: Luxuria Trans Travel → ATPSOR (50% din comision) — doar la plata card
  //    La fel, in RON cu TVA 21%, convertit din EUR daca e cazul.
  if (isCard) {
    const atpsorVatPct = TVA_RATE * 100;
    try {
      const luxuriaName = process.env.LUXURIA_NAME || "Luxuria Trans Travel SRL";
      const luxuriaCui = process.env.LUXURIA_SMARTBILL_VAT || "";
      const result = await generateLuxuriaCommissionInvoice({
        commissionAmount: luxuriaCommissionInRon / (1 + TVA_RATE), // fara TVA
        route: params.route,
        date: params.date,
        vatRate: atpsorVatPct,
      });
      await saveInvoice(
        params.bookingId, "luxuria_commission",
        luxuriaName, luxuriaCui,
        "ATPSOR", luxuriaCommissionInRon / (1 + TVA_RATE), result,
        "RON", TVA_RATE
      );
      console.log(`Luxuria commission invoice: ${result?.number || "pending"}`);
    } catch (err) {
      console.error("Luxuria commission invoice error:", err);
      await saveInvoice(
        params.bookingId, "luxuria_commission",
        process.env.LUXURIA_NAME || "Luxuria Trans Travel SRL",
        process.env.LUXURIA_SMARTBILL_VAT || "",
        "ATPSOR", luxuriaCommissionInRon / (1 + TVA_RATE),
        { errorText: String(err) }, "RON", TVA_RATE
      );
    }
  }
}
