export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { listarLaudos, isGoogleSheetsConfigured } from "@/lib/googleSheets";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data = searchParams.get("data") || undefined;
    const de = searchParams.get("de") || searchParams.get("dataInicio") || undefined;
    const ate = searchParams.get("ate") || searchParams.get("dataFim") || undefined;

    const laudos = await listarLaudos({ data, de, ate });
    const sheetsAtivo = isGoogleSheetsConfigured();

    return NextResponse.json({
      ok: true,
      dataFiltro: data || (de && ate ? `${de} até ${ate}` : "todas"),
      total: laudos.length,
      isGoogleSheets: sheetsAtivo,
      laudos,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Erro ao consultar laudos do dia" },
      { status: 500 }
    );
  }
}
