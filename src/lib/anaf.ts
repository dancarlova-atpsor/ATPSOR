export interface AnafResult {
  valid: boolean;
  denumire: string;
  adresa: string;
  platitorTVA: boolean;
  statusInactiv: boolean;
  nrRegCom?: string;
  error?: string;
}

export async function verifyCUI(cui: string): Promise<AnafResult> {
  // Clean CUI - remove RO prefix, spaces, dashes
  const cleanCui = cui.replace(/^RO/i, "").replace(/[\s-]/g, "").trim();

  if (!/^\d{2,10}$/.test(cleanCui)) {
    return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "CUI invalid" };
  }

  const today = new Date().toISOString().split("T")[0];

  // v9 endpoint — returns data for ALL companies regardless of VAT status
  // (v8 returned "not found" for non-VAT payers, causing false errors)
  try {
    const response = await fetch("https://webservicesp.anaf.ro/PlatitorTvaRest/api/v9/ws/tva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ cui: parseInt(cleanCui), data: today }]),
    });

    if (!response.ok) {
      return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: `Eroare ANAF API (HTTP ${response.status})` };
    }

    const data = await response.json();

    // v9 response structure:
    // { cod, message, found: [{ date_generale, inregistrare_scop_Tva, stare_inactiv, adresa_sediu_social, ... }], notFound: [] }
    const found = data?.found?.[0];

    if (!found) {
      return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "CUI negasit la ANAF" };
    }

    const general = found.date_generale || {};
    const tva = found.inregistrare_scop_Tva || {};
    const inactiv = found.stare_inactiv || {};
    const sediu = found.adresa_sediu_social || {};

    const adresaSediu = sediu.sdenumire_Strada
      ? `${sediu.sdenumire_Strada || ""} ${sediu.snumar_Strada || ""}, ${sediu.sdenumire_Localitate || ""}, ${sediu.sdenumire_Judet || ""}`.trim()
      : (general.adresa || "");

    return {
      valid: true,
      denumire: general.denumire || "",
      adresa: adresaSediu,
      platitorTVA: tva.scpTVA || false,
      statusInactiv: inactiv.statusInactivi || false,
      nrRegCom: general.nrRegCom || "",
    };
  } catch (err: any) {
    return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: `Eroare ANAF: ${err?.message || "conexiune"}` };
  }
}
