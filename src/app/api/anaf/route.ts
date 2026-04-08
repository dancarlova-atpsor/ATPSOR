import { NextResponse } from "next/server";
import { verifyCUI } from "@/lib/anaf";

export async function POST(request: Request) {
  try {
    const { cui } = await request.json();

    if (!cui) {
      return NextResponse.json({ error: "CUI lipsă" }, { status: 400 });
    }

    const result = await verifyCUI(cui);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, error: "Eroare la verificare CUI" },
      { status: 500 }
    );
  }
}
