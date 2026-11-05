export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import {
  listarTriagemEdta,
  salvarTriagemEdta,
  atualizarStatusItemEdta,
  excluirItemEdta,
  emitirSinalImpressaoEdta,
  obterSinalImpressaoEdta,
  consumirSinalImpressaoEdta,
} from "@/lib/googleSheets";
import { formatarProntuario, normalizarProntuario } from "@/lib/extratorBancada";
import { ItemTriagemEdta } from "@/types/urinalise";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const checkPrint = searchParams.get("check_print") === "true";
    const resetPrint = searchParams.get("reset_print") === "true";
    const prontuario = searchParams.get("prontuario");
    const data = searchParams.get("data") || undefined;

    if (resetPrint) {
      consumirSinalImpressaoEdta();
      return NextResponse.json({ ok: true, message: "Sinal de impressão redefinido." });
    }

    if (checkPrint) {
      const sinal = obterSinalImpressaoEdta();
      return NextResponse.json({
        ok: true,
        sinalImpressao: sinal,
      });
    }

    const itens = await listarTriagemEdta(data);
    const todosItens = await listarTriagemEdta("todas");
    const datasDisponiveis = Array.from(new Set(todosItens.map((i) => i.data).filter(Boolean))).sort().reverse();

    if (prontuario) {
      const pBusca = formatarProntuario(prontuario).toLowerCase();
      const pNorm = normalizarProntuario(prontuario).toLowerCase();
      const item = itens.find(
        (i) =>
          formatarProntuario(i.prontuario).toLowerCase() === pBusca ||
          i.prontuario.toLowerCase() === pBusca ||
          (i.prontuario_normalizado && i.prontuario_normalizado.toLowerCase() === pNorm) ||
          normalizarProntuario(i.prontuario).toLowerCase() === pNorm
      );
      return NextResponse.json({ ok: true, item: item || null });
    }

    const totalTubos = itens.length;
    const fracionarGlicada = itens.filter((i) => i.tipo_destino === "hemograma_glicada").length;
    const apenasHemograma = itens.filter((i) => i.tipo_destino === "apenas_hemograma").length;
    const apenasGlicada = itens.filter((i) => i.tipo_destino === "apenas_glicada").length;
    const prontosGrade = itens.filter((i) => i.status === "pronto_grade" || i.colocado_grade).length;
    const retidosBancada = itens.filter((i) => i.status === "retido_bancada" || i.status === "retido_envio_posterior").length;
    const pendentes = itens.filter((i) => i.status === "pendente").length;

    return NextResponse.json({
      ok: true,
      itens,
      datasDisponiveis,
      stats: {
        totalTubos,
        fracionarGlicada,
        apenasHemograma,
        apenasGlicada,
        prontosGrade,
        retidosBancada,
        pendentes,
      },
      sinalImpressao: obterSinalImpressaoEdta(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Erro ao consultar Triagem EDTA" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const acao = body.acao || "salvar_lista";

    if (acao === "solicitar_impressao") {
      const horaEncerramento = body.horaEncerramento;
      const tipoGuia = body.tipoGuia || "ambas";
      const sinal = emitirSinalImpressaoEdta(horaEncerramento, tipoGuia);
      return NextResponse.json({
        ok: true,
        message: "Sinal de impressão enviado para a tela do PC!",
        sinal,
      });
    }

    if (acao === "confirmar_impressao") {
      consumirSinalImpressaoEdta();
      return NextResponse.json({
        ok: true,
        message: "Sinal de impressão confirmado.",
      });
    }

    if (acao === "atualizar_item") {
      const prontuario = body.prontuario;
      const updates = body.updates || {};
      if (!prontuario) {
        return NextResponse.json(
          { ok: false, error: "Prontuário obrigatório para atualizar item." },
          { status: 400 }
        );
      }
      const itemAtualizado = await atualizarStatusItemEdta(prontuario, updates);
      if (!itemAtualizado) {
        return NextResponse.json(
          { ok: false, error: "Paciente/tubo EDTA não encontrado." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        ok: true,
        message: "Status do tubo EDTA atualizado com sucesso!",
        item: itemAtualizado,
      });
    }

    if (acao === "excluir_item") {
      const prontuario = body.prontuario;
      const data = body.data;
      if (!prontuario) {
        return NextResponse.json(
          { ok: false, error: "Prontuário obrigatório para exclusão pontual." },
          { status: 400 }
        );
      }
      const resultado = await excluirItemEdta(prontuario, data);
      return NextResponse.json(resultado);
    }

    // Default: Salvar lista com lógica de Merge / Upsert incremental
    const itens: ItemTriagemEdta[] = body.itens || [];
    const substituir = body.substituir === true;

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nenhum tubo EDTA fornecido na lista." },
        { status: 400 }
      );
    }

    const resultado = await salvarTriagemEdta(itens, substituir);
    return NextResponse.json({ ...resultado, ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Erro ao atualizar Triagem EDTA" },
      { status: 500 }
    );
  }
}

