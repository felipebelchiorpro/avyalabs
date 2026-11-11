export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { listarMedicosD1, salvarMedicosD1 } from "@/lib/d1Service";

export async function GET() {
  try {
    const dados = await listarMedicosD1();
    return NextResponse.json({ ok: true, ...dados });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const acao = body.acao || "salvar_todos";

    if (acao === "adicionar") {
      const nome = (body.nome || "").trim();
      if (!nome) {
        return NextResponse.json({ ok: false, error: "Nome obrigatório" }, { status: 400 });
      }
      const { medicos, padrao } = await listarMedicosD1();
      if (!medicos.includes(nome)) {
        medicos.push(nome);
      }
      const res = await salvarMedicosD1(medicos, padrao);
      return NextResponse.json(res);
    }

    if (acao === "remover") {
      const nome = (body.nome || "").trim();
      const { medicos, padrao } = await listarMedicosD1();
      const filtrados = medicos.filter((m) => m !== nome);
      const novoPadrao = padrao === nome ? "" : padrao;
      const res = await salvarMedicosD1(filtrados, novoPadrao);
      return NextResponse.json(res);
    }

    if (acao === "definir_padrao") {
      const padrao = (body.padrao || "").trim();
      const { medicos } = await listarMedicosD1();
      const res = await salvarMedicosD1(medicos, padrao);
      return NextResponse.json(res);
    }

    // Salvar lista completa
    const lista = Array.isArray(body.lista) ? body.lista : [];
    const padrao = body.padrao !== undefined ? body.padrao : undefined;
    const res = await salvarMedicosD1(lista, padrao);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
