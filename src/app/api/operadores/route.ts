export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { listarOperadoresD1, salvarOperadoresD1 } from "@/lib/d1Service";

export async function GET() {
  try {
    const dados = await listarOperadoresD1();
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
      const { operadores, ativo } = await listarOperadoresD1();
      if (!operadores.includes(nome)) {
        operadores.push(nome);
      }
      const ativoAtualizado = ativo || nome;
      const res = await salvarOperadoresD1(operadores, ativoAtualizado);
      return NextResponse.json(res);
    }

    if (acao === "remover") {
      const nome = (body.nome || "").trim();
      const { operadores, ativo } = await listarOperadoresD1();
      const filtrados = operadores.filter((o) => o !== nome);
      const novoAtivo = ativo === nome ? (filtrados[0] || "") : ativo;
      const res = await salvarOperadoresD1(filtrados, novoAtivo);
      return NextResponse.json(res);
    }

    if (acao === "definir_ativo") {
      const ativo = (body.ativo || "").trim();
      const { operadores } = await listarOperadoresD1();
      const res = await salvarOperadoresD1(operadores, ativo);
      return NextResponse.json(res);
    }

    // Salvar lista completa
    const lista = Array.isArray(body.lista) ? body.lista : [];
    const ativo = body.ativo !== undefined ? body.ativo : undefined;
    const res = await salvarOperadoresD1(lista, ativo);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
