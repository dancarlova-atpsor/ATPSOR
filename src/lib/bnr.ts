// BNR exchange rate helper — preia cursul zilnic EUR/RON de la BNR
// https://www.bnr.ro/nbrfxrates.xml (gratuit, fără autentificare)
// Cache în Supabase (bnr_exchange_rates) pentru a nu bate BNR-ul la fiecare request

import { createClient } from "@supabase/supabase-js";

// Marja aplicată peste cursul BNR (2% — safety buffer + cost conversie)
export const BNR_MARGIN = 0.02;

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface BnrRate {
  date: string; // YYYY-MM-DD
  eur_ron: number;
  source: "bnr" | "cache" | "fallback";
}

// Fallback curs dacă BNR e down (~5 RON/EUR, se actualizează rapid oricum)
const FALLBACK_EUR_RON = 5.0;

/**
 * Parse XML simplu (fără lib) — caută <Rate currency="EUR">4.9765</Rate>
 */
function parseBnrXml(xml: string): number | null {
  const match = xml.match(/<Rate\s+currency="EUR"[^>]*>([\d.]+)<\/Rate>/i);
  if (!match) return null;
  const rate = parseFloat(match[1]);
  return isFinite(rate) && rate > 0 ? rate : null;
}

/**
 * Returnează cursul BNR pentru EUR/RON pentru ziua de azi (sau cea mai recentă zi lucrătoare).
 * Cache în DB pentru a evita apeluri repetate la BNR.
 */
export async function getBnrEurRonRate(): Promise<BnrRate> {
  const today = new Date().toISOString().split("T")[0];

  const supabase = createServiceClient();

  // 1) Verifică cache
  const { data: cached } = await supabase
    .from("bnr_exchange_rates")
    .select("date, eur_ron")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached && cached.date === today) {
    return { date: cached.date, eur_ron: Number(cached.eur_ron), source: "cache" };
  }

  // 2) Fetch de la BNR
  try {
    const resp = await fetch("https://www.bnr.ro/nbrfxrates.xml", {
      method: "GET",
      headers: { Accept: "application/xml" },
      // @ts-ignore — Next.js revalidate
      next: { revalidate: 3600 },
    });

    if (!resp.ok) throw new Error(`BNR HTTP ${resp.status}`);
    const xml = await resp.text();
    const rate = parseBnrXml(xml);

    if (!rate) throw new Error("Nu s-a putut parsa cursul EUR din XML BNR");

    // Extract data from XML (PublishingDate)
    const dateMatch = xml.match(/<PublishingDate>([^<]+)<\/PublishingDate>/i);
    const publishingDate = dateMatch ? dateMatch[1] : today;

    // Salvează în cache
    await supabase
      .from("bnr_exchange_rates")
      .upsert({ date: publishingDate, eur_ron: rate }, { onConflict: "date" });

    return { date: publishingDate, eur_ron: rate, source: "bnr" };
  } catch (err) {
    console.error("BNR fetch error:", err);

    // Fallback: folosește cel mai recent din cache, sau FALLBACK
    if (cached) {
      return { date: cached.date, eur_ron: Number(cached.eur_ron), source: "cache" };
    }
    return { date: today, eur_ron: FALLBACK_EUR_RON, source: "fallback" };
  }
}

/**
 * Convertește EUR în RON cu cursul BNR + marjă 2%.
 * Folosită pentru calculul comisionului ATPSOR (care e întotdeauna în RON).
 */
export async function convertEurToRonWithMargin(eurAmount: number): Promise<{ ron: number; rate: number; rateWithMargin: number }> {
  const { eur_ron } = await getBnrEurRonRate();
  const rateWithMargin = eur_ron * (1 + BNR_MARGIN);
  return {
    ron: eurAmount * rateWithMargin,
    rate: eur_ron,
    rateWithMargin,
  };
}

/**
 * Convertește RON în EUR cu cursul BNR + marjă 2%.
 */
export async function convertRonToEurWithMargin(ronAmount: number): Promise<{ eur: number; rate: number; rateWithMargin: number }> {
  const { eur_ron } = await getBnrEurRonRate();
  const rateWithMargin = eur_ron * (1 + BNR_MARGIN);
  return {
    eur: ronAmount / rateWithMargin,
    rate: eur_ron,
    rateWithMargin,
  };
}
