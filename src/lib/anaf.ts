export interface AnafResult {
  valid: boolean;
  denumire: string;
  adresa: string;
  platitorTVA: boolean;
  statusInactiv: boolean;
  nrRegCom?: string;
  error?: string;
}

// ANAF has deprecated the synchronous /PlatitorTvaRest/api/v8/ws/tva endpoint.
// Current endpoint is AsynchWebService: POST returns a correlationId,
// then GET ?id=correlationId returns the actual data (usually ready immediately).
const ANAF_ASYNC_URL = "https://webservicesp.anaf.ro/AsynchWebService/api/v8/ws/tva";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyCUI(cui: string): Promise<AnafResult> {
  // Clean CUI - remove RO prefix, spaces, dashes
  const cleanCui = cui.replace(/^RO/i, "").replace(/[\s-]/g, "").trim();

  if (!/^\d{2,10}$/.test(cleanCui)) {
    return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "CUI invalid" };
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // Step 1: submit query → get correlationId
    const postResp = await fetch(ANAF_ASYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ cui: parseInt(cleanCui), data: today }]),
    });

    if (!postResp.ok) {
      return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: `Eroare ANAF (POST ${postResp.status})` };
    }

    const postData = await postResp.json();
    const correlationId = postData?.correlationId;

    if (!correlationId) {
      return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "ANAF: lipseste correlationId" };
    }

    // Step 2: poll for result (usually ready immediately, sometimes needs up to 2-3 attempts)
    let found: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) await sleep(500);

      const getResp = await fetch(`${ANAF_ASYNC_URL}?id=${correlationId}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!getResp.ok) continue;

      const text = await getResp.text();
      if (!text) continue;

      let getData: any;
      try {
        getData = JSON.parse(text);
      } catch {
        continue;
      }

      // Still processing
      if (getData?.message === "IN_CURS_DE_PROCESARE" || getData?.message === "Successful") continue;

      if (getData?.found && getData.found.length > 0) {
        found = getData.found[0];
        break;
      }

      // Completed but not found
      if (getData?.notfound || getData?.notFound) {
        return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "CUI negasit la ANAF" };
      }
    }

    if (!found) {
      return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "ANAF: timp expirat, incearca din nou" };
    }

    const general = found.date_generale || {};
    const tva = found.inregistrare_scop_Tva || {};
    const inactiv = found.stare_inactiv || {};
    const sediu = found.adresa_sediu_social || {};

    // Build address from detailed fields, fallback to general.adresa
    const adresaDetaliata = sediu.sdenumire_Strada
      ? [
          `${sediu.sdenumire_Strada} ${sediu.snumar_Strada || ""}`.trim(),
          sediu.sdenumire_Localitate,
          sediu.sdenumire_Judet,
        ].filter(Boolean).join(", ")
      : (general.adresa || "");

    return {
      valid: true,
      denumire: general.denumire || "",
      adresa: adresaDetaliata,
      platitorTVA: tva.scpTVA || false,
      statusInactiv: inactiv.statusInactivi || false,
      nrRegCom: general.nrRegCom || "",
    };
  } catch (err: any) {
    return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: `Eroare ANAF: ${err?.message || "conexiune"}` };
  }
}
