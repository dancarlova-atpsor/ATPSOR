// Helper centralizat pentru destinația emailurilor de notificare
// Returnează lista de inspectori + fallback la NOTIFY_EMAIL dacă nu există niciunul
//
// Folosit în:
// - /api/cron/check-documents (raport documente expirate)
// - /api/membership/request (cerere nouă adeziune)
// - /api/companies/notify-reverify (reactivare companie după upload acte)
//
// CONFIG: inspectorii sunt useri cu role='inspector' în tabela profiles.
// Dacă vrei să adaugi/scoți pe cineva: schimbă rolul în admin → Utilizatori.

import { createServerClient } from "@supabase/ssr";

const FALLBACK_EMAIL = process.env.NOTIFY_EMAIL || "dan@luxuriatrans.ro";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/**
 * Returnează lista de emailuri către care se trimit notificările administrative.
 * Primii: TOȚI utilizatorii cu role='inspector'.
 * Dacă nu există niciun inspector → fallback la NOTIFY_EMAIL (Dan, admin).
 */
export async function getNotifyEmails(): Promise<string[]> {
  try {
    const supabase = createServiceClient();
    const { data: inspectors } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "inspector");

    const emails = (inspectors || [])
      .map((p: any) => p.email)
      .filter((e: any): e is string => typeof e === "string" && e.includes("@"));

    if (emails.length > 0) return emails;
    return [FALLBACK_EMAIL];
  } catch (err) {
    console.error("getNotifyEmails error:", err);
    return [FALLBACK_EMAIL];
  }
}

/**
 * Date contact secretar ATPSOR (afișate pe website, în emailuri către utilizatori).
 * Inspector principal: George Ciutacu, SMOTOCEL SRL.
 */
export const SECRETARY_CONTACT = {
  name: "George Ciutacu",
  role: "Secretar ATPSOR",
  email: "smotoceltrans@yahoo.com",
  phone: "+40 721 157 675",
};
