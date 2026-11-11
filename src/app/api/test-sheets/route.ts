import { NextResponse } from "next/server";
import { getD1Database, isD1Configured } from "@/lib/d1Service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const isConfigured = isD1Configured();
  const db = getD1Database();

  try {
    // Testa consulta no Cloudflare D1
    const res = await db.prepare("SELECT count(*) as total FROM rotina_dia").first<{ total: number }>();

    return NextResponse.json({
      ok: true,
      isConfigured: true,
      engine: "Cloudflare D1 (SQLite Edge)",
      message: "Conexão com Cloudflare D1 ativa e operacional!",
      diagnostico: {
        banco: "Cloudflare D1",
        totalPacientesRotina: res?.total ?? 0,
        status: "Online",
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      isConfigured,
      engine: "Cloudflare D1 (SQLite Edge)",
      message: "Erro ao consultar Cloudflare D1: " + (err.message || String(err)),
      diagnostico: {
        status: "Erro",
        erro: err.message || String(err),
      },
    }, { status: 500 });
  }
}
