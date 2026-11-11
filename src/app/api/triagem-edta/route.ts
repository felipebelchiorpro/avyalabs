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
} from "@/lib/d1Service";
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

    // Blindagem de data no D1: filtra pelo dia solicitado (ou hoje por padrão)
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
      { ok: false, error: error.message || "Erro ao consultar Triagem EDTA no D1" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const acao = body.acao || "salvar_lista";

    // 1. Busca e Enriquecimento Rápido ou Cadastro por Prontuário + Agendamento (Conecta SUS / D1)
    if (body.prontuario && body.agendamento) {
      const pBusca = formatarProntuario(body.prontuario);
      const pNorm = normalizarProntuario(body.prontuario);
      const dataHoje = new Date().toISOString().split("T")[0];

      // Se o payload inclui nome ou salvar=true, salvamos/enriquecemos no D1
      if (body.nome || body.salvar === true) {
        const nomePaciente = (body.nome || `PACIENTE #${pBusca}`).trim().toUpperCase();
        const dataNasc = body.dataNascimento || "";
        const medico = body.medicoSolicitante || "Dr(a). Clínico(a) Geral / UBS";
        const examesRecebidos = Array.isArray(body.exames) ? body.exames : (body.exames ? [String(body.exames)] : ["HEMOGRAMA COMPLETO"]);

        const temGlicada = examesRecebidos.some((e: string) => /glicad|hba1c/i.test(e));
        const temHemograma = examesRecebidos.some((e: string) => /hemogr/i.test(e)) || (!temGlicada);
        const destino: "hemograma_glicada" | "apenas_glicada" | "apenas_hemograma" =
          temHemograma && temGlicada ? "hemograma_glicada" : (temGlicada ? "apenas_glicada" : "apenas_hemograma");

        const novoItem: ItemTriagemEdta = {
          data: dataHoje,
          prontuario: pBusca,
          prontuario_normalizado: pNorm,
          agendamento: String(body.agendamento),
          nome_paciente: nomePaciente,
          data_nascimento: dataNasc,
          solicitante: medico,
          tipo_destino: destino,
          tem_hemograma: temHemograma,
          tem_glicada: temGlicada,
          status: "pendente",
          colocado_grade: false,
          fracionado_glicada: false,
          exames_originais: examesRecebidos,
        };

        await salvarTriagemEdta([novoItem], false);

        return NextResponse.json({
          ok: true,
          success: true,
          paciente: {
            nome: nomePaciente,
            prontuario: pBusca,
            agendamento: body.agendamento,
            dataNascimento: dataNasc,
            medicoSolicitante: medico,
            exames: examesRecebidos,
            tipoDestino: destino,
            status: "pendente",
          },
          message: "Paciente salvo e registrado na Triagem EDTA do D1 com sucesso!",
        });
      }

      // Caso contrário, busca na base existente do D1 para enriquecer
      const itensExistentes = await listarTriagemEdta("todas");

      const itemAchado = itensExistentes.find(
        (i) =>
          formatarProntuario(i.prontuario) === pBusca ||
          (i.prontuario_normalizado && i.prontuario_normalizado === pNorm) ||
          normalizarProntuario(i.prontuario) === pNorm ||
          (i.agendamento && String(i.agendamento).trim() === String(body.agendamento).trim())
      );

      const examesLista = itemAchado?.exames_originais && itemAchado.exames_originais.length > 0
        ? itemAchado.exames_originais
        : (itemAchado?.tipo_destino === "hemograma_glicada"
            ? ["HEMOGRAMA COMPLETO", "HEMOGLOBINA GLICADA (HBA1C)"]
            : (itemAchado?.tipo_destino === "apenas_glicada"
                ? ["HEMOGLOBINA GLICADA (HBA1C)"]
                : ["HEMOGRAMA COMPLETO COM PLAQUETAS"]));

      const paciente = {
        nome: itemAchado?.nome_paciente || `PACIENTE PRONTUÁRIO #${pBusca}`,
        prontuario: pBusca,
        dataNascimento: itemAchado?.data_nascimento || "--/--/----",
        medicoSolicitante: itemAchado?.solicitante || "Dr(a). Clínico(a) Geral / UBS",
        agendamento: body.agendamento,
        exames: examesLista,
        status: itemAchado?.status || "pendente",
        tipoDestino: itemAchado?.tipo_destino || "apenas_hemograma",
      };

      return NextResponse.json({
        ok: true,
        success: true,
        paciente,
        message: itemAchado
          ? "Dados de atendimento localizados e enriquecidos com sucesso via D1!"
          : "Prontuário identificado. Pronto para confirmação e salvamento na bancada.",
      });
    }

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
        message: "Status do tubo EDTA atualizado com sucesso no D1!",
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
      return NextResponse.json({ ok: resultado, message: "Item excluído do D1 com sucesso." });
    }

    // Default: Salvar lista com lógica de Merge / Upsert atômico
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
      { ok: false, error: error.message || "Erro ao atualizar Triagem EDTA no D1" },
      { status: 500 }
    );
  }
}
