export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { listarLaudos, isD1Configured } from "@/lib/d1Service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data = searchParams.get("data") || undefined;
    const de = searchParams.get("de") || searchParams.get("dataInicio") || undefined;
    const ate = searchParams.get("ate") || searchParams.get("dataFim") || undefined;

    const laudos = await listarLaudos({ data, de, ate });
    const d1Ativo = isD1Configured();

    return NextResponse.json({
      ok: true,
      dataFiltro: data || (de && ate ? `${de} até ${ate}` : "todas"),
      total: laudos.length,
      isD1: d1Ativo,
      laudos,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Erro ao consultar laudos do dia no D1" },
      { status: 500 }
    );
  }
}
