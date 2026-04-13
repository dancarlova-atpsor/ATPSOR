// SmartBill API Integration
// Documentation: https://api.smartbill.ro

const SMARTBILL_API_URL = "https://ws.smartbill.ro/SBORO/api";

interface SmartBillConfig {
  username: string;
  token: string;
  companyVatCode: string;
}

export interface SmartBillResponse {
  number?: string;
  series?: string;
  errorText?: string;
}

// ATPSOR config
function getConfig(): SmartBillConfig {
  return {
    username: process.env.SMARTBILL_USERNAME || "",
    token: process.env.SMARTBILL_TOKEN || "",
    companyVatCode: process.env.SMARTBILL_COMPANY_VAT || "",
  };
}

function getAuthHeader(): string {
  const { username, token } = getConfig();
  return "Basic " + Buffer.from(`${username}:${token}`).toString("base64");
}

// Luxuria Trans Travel config (cont SmartBill separat)
function getLuxuriaConfig() {
  return {
    username: process.env.LUXURIA_SMARTBILL_USERNAME || "",
    token: process.env.LUXURIA_SMARTBILL_TOKEN || "",
    companyVatCode: process.env.LUXURIA_SMARTBILL_VAT || "",
    series: process.env.LUXURIA_SMARTBILL_SERIES || "LTT",
    name: process.env.LUXURIA_NAME || "Luxuria Trans Travel SRL",
  };
}

function getLuxuriaAuthHeader(): string {
  const { username, token } = getLuxuriaConfig();
  return "Basic " + Buffer.from(`${username}:${token}`).toString("base64");
}

interface InvoiceClient {
  name: string;
  vatCode?: string;
  address?: string;
  city?: string;
  county?: string;
  email?: string;
  phone?: string;
}

interface InvoiceProduct {
  name: string;
  code?: string;
  measuringUnitName: string;
  quantity: number;
  price: number;
  isTaxIncluded: boolean;
  taxPercentage: number;
}

interface CreateInvoiceParams {
  seriesName: string;
  issuerCui: string;
  client: InvoiceClient;
  products: InvoiceProduct[];
  currency: string;
  isDraft?: boolean;
  authHeader?: string; // override for Luxuria's separate SmartBill account
}

// Create invoice via SmartBill API
export async function createInvoice(params: CreateInvoiceParams): Promise<SmartBillResponse | null> {
  const auth = params.authHeader || getAuthHeader();
  const config = getConfig();

  if (!auth || auth === "Basic Og==") {
    console.log("SmartBill not configured, skipping invoice");
    return null;
  }

  const body = {
    companyVatCode: params.issuerCui,
    client: {
      name: params.client.name,
      vatCode: params.client.vatCode || "",
      address: params.client.address || "",
      city: params.client.city || "",
      county: params.client.county || "",
      country: "Romania",
      email: params.client.email || "",
      phone: params.client.phone || "",
    },
    seriesName: params.seriesName,
    currency: params.currency || "RON",
    isDraft: params.isDraft ?? false,
    products: params.products.map((p) => ({
      name: p.name,
      code: p.code || "",
      measuringUnitName: p.measuringUnitName,
      quantity: p.quantity,
      price: p.price,
      isTaxIncluded: p.isTaxIncluded,
      taxPercentage: p.taxPercentage,
    })),
  };

  try {
    const res = await fetch(`${SMARTBILL_API_URL}/invoice`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data as SmartBillResponse;
  } catch (error) {
    console.error("SmartBill invoice error:", error);
    return null;
  }
}

// Register payment on invoice (mark as collected/incasata)
export async function registerPayment(params: {
  cif: string;
  seriesName: string;
  number: string;
  paymentType?: string; // "Card", "Ordin plata", etc.
  value?: number;
  authHeader?: string;
}): Promise<SmartBillResponse | null> {
  const auth = params.authHeader || getAuthHeader();
  if (!auth || auth === "Basic Og==") return null;

  try {
    const res = await fetch(`${SMARTBILL_API_URL}/payment`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        companyVatCode: params.cif,
        issueDate: new Date().toISOString().split("T")[0],
        type: params.paymentType || "Card",
        isCash: false,
        value: params.value || 0,
        useInvoiceDetails: true,
        invoicesList: [{
          seriesName: params.seriesName,
          number: params.number,
        }],
      }),
    });

    const data = await res.json();
    return data as SmartBillResponse;
  } catch (error) {
    console.error("SmartBill register payment error:", error);
    return null;
  }
}

// Create proforma (estimate) via SmartBill API
export async function createProforma(params: CreateInvoiceParams): Promise<SmartBillResponse | null> {
  const auth = params.authHeader || getAuthHeader();

  if (!auth || auth === "Basic Og==") {
    console.log("SmartBill not configured, skipping proforma");
    return null;
  }

  const body = {
    companyVatCode: params.issuerCui,
    client: {
      name: params.client.name,
      vatCode: params.client.vatCode || "",
      address: params.client.address || "",
      city: params.client.city || "",
      county: params.client.county || "",
      country: "Romania",
      email: params.client.email || "",
      phone: params.client.phone || "",
    },
    seriesName: params.seriesName,
    currency: params.currency || "RON",
    isDraft: params.isDraft ?? false,
    products: params.products.map((p) => ({
      name: p.name,
      code: p.code || "",
      measuringUnitName: p.measuringUnitName,
      quantity: p.quantity,
      price: p.price,
      isTaxIncluded: p.isTaxIncluded,
      taxPercentage: p.taxPercentage,
    })),
  };

  try {
    const res = await fetch(`${SMARTBILL_API_URL}/estimate`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data as SmartBillResponse;
  } catch (error) {
    console.error("SmartBill proforma error:", error);
    return null;
  }
}

// Generate transport invoice (Transporter → Client)
// Uses transporter's own SmartBill credentials if available
export async function generateTransportInvoice(params: {
  transporterCui: string;
  transporterSeries: string;
  transporterSmartBillUsername?: string;
  transporterSmartBillToken?: string;
  clientName: string;
  clientEmail: string;
  clientVatCode?: string;
  clientAddress?: string;
  clientCity?: string;
  clientCounty?: string;
  route: string;
  date: string;
  totalKm: number;
  pricePerKm: number;
  totalWithoutVat: number;
  vatRate: number;
}): Promise<SmartBillResponse | null> {
  // Build auth header from transporter's credentials or fall back to ATPSOR
  let authHeader: string | undefined;
  if (params.transporterSmartBillUsername && params.transporterSmartBillToken) {
    authHeader = "Basic " + Buffer.from(`${params.transporterSmartBillUsername}:${params.transporterSmartBillToken}`).toString("base64");
  }

  return createInvoice({
    seriesName: params.transporterSeries,
    issuerCui: params.transporterCui,
    authHeader,
    client: {
      name: params.clientName,
      email: params.clientEmail,
      vatCode: params.clientVatCode,
      address: params.clientAddress,
      city: params.clientCity,
      county: params.clientCounty,
    },
    products: [
      {
        name: `Transport ocazional persoane: ${params.route} (${params.date})`,
        measuringUnitName: "km",
        quantity: params.totalKm,
        price: params.pricePerKm,
        isTaxIncluded: false,
        taxPercentage: params.vatRate,
      },
    ],
    currency: "RON",
  });
}

// Generate commission invoice (ATPSOR → Transporter) - 5% comision
export async function generateCommissionInvoice(params: {
  transporterName: string;
  transporterCui: string;
  transporterEmail: string;
  commissionAmount: number;
  route: string;
  date: string;
  vatRate: number;
}): Promise<SmartBillResponse | null> {
  const config = getConfig();

  return createInvoice({
    seriesName: "ATPSOR",
    issuerCui: config.companyVatCode,
    client: {
      name: params.transporterName,
      vatCode: params.transporterCui,
      email: params.transporterEmail,
    },
    products: [
      {
        name: `Comision intermediere transport: ${params.route} (${params.date})`,
        measuringUnitName: "buc",
        quantity: 1,
        price: params.commissionAmount,
        isTaxIncluded: false,
        taxPercentage: params.vatRate,
      },
    ],
    currency: "RON",
  });
}

// ==========================================
// PDF Download, Email, Cancel, Storno
// ==========================================

// Download invoice PDF
export async function getInvoicePdf(params: {
  cif: string;
  seriesName: string;
  number: string;
  authHeader?: string;
}): Promise<Buffer | null> {
  const auth = params.authHeader || getAuthHeader();
  if (!auth || auth === "Basic Og==") return null;

  try {
    const url = `${SMARTBILL_API_URL}/invoice/pdf?cif=${encodeURIComponent(params.cif)}&seriesname=${encodeURIComponent(params.seriesName)}&number=${encodeURIComponent(params.number)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: auth,
        Accept: "application/octet-stream",
      },
    });

    if (!res.ok) {
      console.error("SmartBill PDF download failed:", res.status, await res.text());
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("SmartBill PDF download error:", error);
    return null;
  }
}

// Send invoice by email via SmartBill
export async function sendInvoiceEmail(params: {
  cif: string;
  seriesName: string;
  number: string;
  to: string;
  subject?: string;
  bodyText?: string;
  authHeader?: string;
}): Promise<SmartBillResponse | null> {
  const auth = params.authHeader || getAuthHeader();
  if (!auth || auth === "Basic Og==") return null;

  const subject = params.subject || `Factura ${params.seriesName} ${params.number}`;
  const body = params.bodyText || `Bună ziua,\n\nVă transmitem atașat factura ${params.seriesName} ${params.number}.\n\nCu stimă,\nATPSOR`;

  try {
    const res = await fetch(`${SMARTBILL_API_URL}/document/send`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        companyVatCode: params.cif,
        seriesName: params.seriesName,
        number: params.number,
        type: "factura",
        to: params.to,
        subject: Buffer.from(subject).toString("base64"),
        bodyText: Buffer.from(body).toString("base64"),
      }),
    });

    const data = await res.json();
    return data as SmartBillResponse;
  } catch (error) {
    console.error("SmartBill send email error:", error);
    return null;
  }
}

// Cancel (anulare) invoice
export async function cancelInvoice(params: {
  cif: string;
  seriesName: string;
  number: string;
  authHeader?: string;
}): Promise<SmartBillResponse | null> {
  const auth = params.authHeader || getAuthHeader();
  if (!auth || auth === "Basic Og==") return null;

  try {
    const url = `${SMARTBILL_API_URL}/invoice/cancel?cif=${encodeURIComponent(params.cif)}&seriesname=${encodeURIComponent(params.seriesName)}&number=${encodeURIComponent(params.number)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });

    const data = await res.json();
    return data as SmartBillResponse;
  } catch (error) {
    console.error("SmartBill cancel invoice error:", error);
    return null;
  }
}

// Reverse (storno) invoice
export async function reverseInvoice(params: {
  cif: string;
  seriesName: string;
  number: string;
  issueDate?: string; // YYYY-MM-DD, defaults to today
  authHeader?: string;
}): Promise<SmartBillResponse | null> {
  const auth = params.authHeader || getAuthHeader();
  if (!auth || auth === "Basic Og==") return null;

  const issueDate = params.issueDate || new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(`${SMARTBILL_API_URL}/invoice/reverse`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        companyVatCode: params.cif,
        seriesName: params.seriesName,
        number: params.number,
        issueDate,
      }),
    });

    const data = await res.json();
    return data as SmartBillResponse;
  } catch (error) {
    console.error("SmartBill reverse invoice error:", error);
    return null;
  }
}

// Get invoice payment status
export async function getInvoicePaymentStatus(params: {
  cif: string;
  seriesName: string;
  number: string;
  authHeader?: string;
}): Promise<{ total?: number; paid?: number; remaining?: number } | null> {
  const auth = params.authHeader || getAuthHeader();
  if (!auth || auth === "Basic Og==") return null;

  try {
    const url = `${SMARTBILL_API_URL}/invoice/paymentstatus?cif=${encodeURIComponent(params.cif)}&seriesname=${encodeURIComponent(params.seriesName)}&number=${encodeURIComponent(params.number)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("SmartBill payment status error:", error);
    return null;
  }
}

// Delete invoice (only last in series)
export async function deleteInvoice(params: {
  cif: string;
  seriesName: string;
  number: string;
  authHeader?: string;
}): Promise<SmartBillResponse | null> {
  const auth = params.authHeader || getAuthHeader();
  if (!auth || auth === "Basic Og==") return null;

  try {
    const url = `${SMARTBILL_API_URL}/invoice?cif=${encodeURIComponent(params.cif)}&seriesname=${encodeURIComponent(params.seriesName)}&number=${encodeURIComponent(params.number)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });

    const data = await res.json();
    return data as SmartBillResponse;
  } catch (error) {
    console.error("SmartBill delete invoice error:", error);
    return null;
  }
}

// Generate Luxuria commission invoice (Luxuria Trans Travel → ATPSOR) - 50% din comision
export async function generateLuxuriaCommissionInvoice(params: {
  commissionAmount: number; // 50% din comisionul ATPSOR (= 2.5% din total)
  route: string;
  date: string;
  vatRate: number;
}): Promise<SmartBillResponse | null> {
  const luxuria = getLuxuriaConfig();
  const atpsor = getConfig();

  if (!luxuria.username || !luxuria.token) {
    console.log("Luxuria SmartBill not configured, skipping invoice");
    return null;
  }

  return createInvoice({
    seriesName: luxuria.series,
    issuerCui: luxuria.companyVatCode,
    authHeader: getLuxuriaAuthHeader(),
    client: {
      name: "ATPSOR - Asociatia Transportatorilor de Persoane prin Serviciu Ocazional din Romania",
      vatCode: atpsor.companyVatCode,
    },
    products: [
      {
        name: `Comision intermediere transport: ${params.route} (${params.date})`,
        measuringUnitName: "buc",
        quantity: 1,
        price: params.commissionAmount,
        isTaxIncluded: false,
        taxPercentage: params.vatRate,
      },
    ],
    currency: "RON",
  });
}
