// SmartBill API Integration
// Documentation: https://api.smartbill.ro

const SMARTBILL_API_URL = "https://ws.smartbill.ro/SBORO/api";

interface SmartBillConfig {
  username: string; // SmartBill email
  token: string; // SmartBill API token
  companyVatCode: string; // ATPSOR CUI (for commission invoices)
}

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
  seriesName: string; // Invoice series (e.g., "ATPSOR" or transporter's series)
  issuerCui: string; // CUI of the issuer (transporter or ATPSOR)
  client: InvoiceClient;
  products: InvoiceProduct[];
  currency: string;
  isDraft?: boolean;
}

// Create invoice via SmartBill API
export async function createInvoice(params: CreateInvoiceParams) {
  const config = getConfig();
  if (!config.username || !config.token) {
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
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data;
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
}) {
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

// Generate commission invoice (ATPSOR → Transporter)
export async function generateCommissionInvoice(params: {
  transporterName: string;
  transporterCui: string;
  transporterEmail: string;
  commissionAmount: number;
  route: string;
  date: string;
  vatRate: number;
}) {
  const config = getConfig();

  return createInvoice({
    seriesName: "ATPSOR",
    issuerCui: config.companyVatCode, // ATPSOR CUI
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
