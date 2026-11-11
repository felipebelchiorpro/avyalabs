export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getD1Database, listarOperadoresD1, salvarOperadoresD1 } from "@/lib/d1Service";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID || "fbfd9da8-1429-452b-9d35-41393fa63094";
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const D1_API_URL = ACCOUNT_ID && DATABASE_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`
  : null;

// LISTAR OPERADORES (GET)
export async function GET(request: NextRequest) {
  try {
    // Se as credenciais diretas HTTP estiverem configuradas, consulta via REST API
    if (D1_API_URL && API_TOKEN) {
      const response = await fetch(D1_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "SELECT * FROM operadores_caconde ORDER BY ativo DESC, nome_operador ASC",
        }),
      });

      const data = await response.json();

      if (data.success && data.result?.[0]?.results) {
        const results = data.result[0].results;
        const operadores = results.map((r: any) => r.nome_operador);
        const ativo = results.find((r: any) => r.ativo === 1)?.nome_operador || operadores[0] || "Farmacêutico(a) Bioquímico(a)";
        return NextResponse.json({ ok: true, operadores, ativo, results });
      }
    }

    // Fallback nativo / D1 Service
    const dados = await listarOperadoresD1();
    return NextResponse.json({ ok: true, ...dados });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Erro ao consultar operadores no D1: " + error.message }, { status: 500 });
  }
}

// CADASTRAR OU ATUALIZAR OPERADOR (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Suporte direto ao payload { nome_operador, ativo }
    if (body.nome_operador) {
      const { nome_operador, ativo } = body;

      if (D1_API_URL && API_TOKEN) {
        const response = await fetch(D1_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sql: "INSERT INTO operadores_caconde (nome_operador, ativo) VALUES (?, ?) ON CONFLICT(nome_operador) DO UPDATE SET ativo = excluded.ativo",
            params: [nome_operador, ativo ?? 1],
          }),
        });

        const data = await response.json();
        if (!data.success) {
          return NextResponse.json({ ok: false, error: "Erro ao salvar no banco D1" }, { status: 500 });
        }
        return NextResponse.json({ ok: true, success: true, message: "Operador salvo na nuvem com sucesso!" });
      }

      const db = getD1Database();
      await db.prepare(
        "INSERT INTO operadores_caconde (nome_operador, ativo) VALUES (?, ?) ON CONFLICT(nome_operador) DO UPDATE SET ativo = excluded.ativo"
      ).bind(nome_operador, ativo ?? 1).run();

      return NextResponse.json({ ok: true, success: true, message: "Operador salvo na nuvem com sucesso!" });
    }

    // Suporte a ações do painel de configurações (adicionar, remover, definir_ativo, salvar_todos)
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
