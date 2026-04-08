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

// Generate transport invoice (Transporter → Client)
export async function generateTransportInvoice(params: {
  transporterCui: string;
  transporterSeries: string;
  clientName: string;
  clientEmail: string;
  route: string;
  date: string;
  totalKm: number;
  pricePerKm: number;
  totalWithoutVat: number;
  vatRate: number;
}): Promise<SmartBillResponse | null> {
  return createInvoice({
    seriesName: params.transporterSeries,
    issuerCui: params.transporterCui,
    client: {
      name: params.clientName,
      email: params.clientEmail,
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
