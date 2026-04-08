export interface AnafResult {
  valid: boolean;
  denumire: string;
  adresa: string;
  platitorTVA: boolean;
  statusInactiv: boolean;
  error?: string;
}

export async function verifyCUI(cui: string): Promise<AnafResult> {
  // Clean CUI - remove RO prefix, spaces
  const cleanCui = cui.replace(/^RO/i, "").replace(/\s/g, "").trim();

  if (!/^\d{2,10}$/.test(cleanCui)) {
    return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "CUI invalid" };
  }

  const today = new Date().toISOString().split("T")[0];

  const response = await fetch("https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ cui: parseInt(cleanCui), data: today }]),
  });

  if (!response.ok) {
    return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "Eroare ANAF API" };
  }

  const data = await response.json();
  const found = data?.found?.[0];

  if (!found) {
    return { valid: false, denumire: "", adresa: "", platitorTVA: false, statusInactiv: true, error: "CUI negăsit la ANAF" };
  }

  return {
    valid: true,
    denumire: found.denumire || "",
    adresa: found.adresa || "",
    platitorTVA: found.scpTVA || false,
    statusInactiv: found.statusInactivi || false,
  };
}
