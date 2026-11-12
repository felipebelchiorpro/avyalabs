"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ItemTriagemEdta } from "@/types/urinalise";
import {
  formatarProntuario,
  formatarDataNascimento,
  normalizarTexto,
  normalizarDataIso,
  obterHojeIsoLocal,
  obterOntemIsoLocal,
} from "@/lib/extratorBancada";
import {
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Inbox,
  AlertCircle,
  CheckSquare,
  Square,
  Send,
  Calendar,
  Layers,
  FlaskConical,
  Printer,
  ShieldCheck,
  AlertTriangle,
  X,
} from "lucide-react";

export default function RetidosGlicadaPage() {
  const [itens, setItens] = useState<ItemTriagemEdta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>("");
  const [dataFiltro, setDataFiltro] = useState<string>("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [mostrarRelatorioPrint, setMostrarRelatorioPrint] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);

  const hojeIso = useMemo(() => obterHojeIsoLocal(), []);
  const ontemIso = useMemo(() => obterOntemIsoLocal(), []);

  const formatarData = (dStr: string) => {
    if (!dStr) return "—";
    if (dStr.includes("-")) {
      const [ano, mes, dia] = dStr.split("-");
      return `${dia}/${mes}/${ano}`;
    }
    return dStr;
  };

  const mostrarNotificacao = (message: string, type: "success" | "warning" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/triagem-edta?data=todas");
      const data = await res.json();
      if (data.ok && Array.isArray(data.itens)) {
        setItens(data.itens);
      }
    } catch (err: any) {
      console.error("Erro ao carregar tubos retidos:", err);
      mostrarNotificacao("Erro ao conectar com a base de dados EDTA.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const getChaveItem = (i: ItemTriagemEdta) => i.id || `${normalizarDataIso(i.data)}-${formatarProntuario(i.prontuario)}`;

  // REGRA FIRME ANTI-ERRO: Apenas Hemograma + Glicada retidos na gradinha (nunca Apenas Glicada, nunca Apenas Hemograma, nunca já liberados)
  const verificarSeEhRetido = (i: ItemTriagemEdta) => {
    // 0. Bloqueio absoluto: Apenas Glicada ou tubos sem Hemograma NÃO vão para o Apoio e não entram em Retidos
    if (i.tipo_destino === "apenas_glicada" || !i.tem_hemograma) {
      return false;
    }

    // 1. Bloqueio absoluto: Tubo já liberado formalmente para o Apoio
    const jaFoiLiberadoAoApoio =
      Boolean(i.data_liberacao_apoio) ||
      (i.status === "pronto_grade" && i.colocado_grade === true && i.enviar_hemograma_hoje === true && !i.retidoParaFracionar);

    if (jaFoiLiberadoAoApoio) return false;

    // 2. Exige presença real de Hemograma + Glicada
    const temGlicadaReal =
      Boolean(i.tem_glicada) ||
      i.tipo_destino === "hemograma_glicada" ||
      (Array.isArray(i.exames_originais) &&
        i.exames_originais.some((e: string) => /glic|hba1c/i.test(e)));

    const temHemogramaReal =
      Boolean(i.tem_hemograma) ||
      i.tipo_destino === "hemograma_glicada" ||
      i.tipo_destino.includes("hemogr");

    if (!temGlicadaReal || !temHemogramaReal) {
      return false;
    }

    // 3. Deve estar retido na gradinha ou aguardando liberação posterior
    const retidoExpresso =
      i.status === "retido_envio_posterior" ||
      i.status === "retido_bancada" ||
      (i as any).status === "retido_local" ||
      Boolean((i as any).retidoParaFracionar) ||
      i.enviar_hemograma_hoje === false ||
      (Boolean(i.fracionado_glicada) && !i.colocado_grade);

    return retidoExpresso || i.status === "pendente";
  };

  // Auditoria de segurança: detecta se algum paciente "Apenas Glicada" ficou preso com status de retido no banco
  const inconsistentesApenasGlicada = useMemo(() => {
    return itens.filter(
      (i) =>
        (i.tipo_destino === "apenas_glicada" || !i.tem_hemograma) &&
        (i.status === "retido_envio_posterior" || i.status === "retido_bancada")
    );
  }, [itens]);

  const regularizarApenasGlicada = async () => {
    if (inconsistentesApenasGlicada.length === 0) return;
    setIsProcessing(true);
    let corrigidos = 0;
    try {
      for (const item of inconsistentesApenasGlicada) {
        const res = await fetch("/api/triagem-edta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "atualizar_item",
            id: item.id,
            prontuario: item.prontuario,
            data: item.data,
            updates: {
              id: item.id,
              data: item.data,
              status: "pronto_grade",
              colocado_grade: true,
              enviar_hemograma_hoje: false,
            },
          }),
        });
        if (res.ok) corrigidos++;
      }
      mostrarNotificacao(
        `${corrigidos} tubo(s) Apenas Glicada regularizados para Bancada Local (fora da fila do Apoio).`,
        "success"
      );
      await carregarDados();
    } catch (e: any) {
      mostrarNotificacao(`Erro ao regularizar: ${e.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtrar todas as amostras retidas na gradinha local (multi-dia)
  const listaRetidos = useMemo(() => {
    return itens.filter(verificarSeEhRetido);
  }, [itens]);

  const contagemHoje = useMemo(
    () => listaRetidos.filter((i) => normalizarDataIso(i.data) === hojeIso).length,
    [listaRetidos, hojeIso]
  );
  const contagemOntem = useMemo(
    () => listaRetidos.filter((i) => normalizarDataIso(i.data) === ontemIso).length,
    [listaRetidos, ontemIso]
  );

  // Outras datas históricas que possuem tubos retidos
  const outrasDatasComRetidos = useMemo(() => {
    const datas = Array.from(
      new Set(
        listaRetidos
          .map((i) => normalizarDataIso(i.data))
          .filter((d) => d && d !== hojeIso && d !== ontemIso)
      )
    );
    return datas.sort().reverse();
  }, [listaRetidos, hojeIso, ontemIso]);

  // Filtro de data e busca por nome, prontuário ou data de nascimento
  const listaFiltrada = useMemo(() => {
    let base = listaRetidos;
    if (dataFiltro) {
      const dataFiltroIso = normalizarDataIso(dataFiltro);
      base = base.filter((i) => normalizarDataIso(i.data) === dataFiltroIso);
    }

    if (!busca.trim()) return base;
    const termo = normalizarTexto(busca.trim());
    const termoDigits = busca.replace(/\D/g, "");

    return base.filter((i) => {
      const nome = normalizarTexto(i.nome_paciente || "");
      const pront = String(i.prontuario || "").replace(/\D/g, "");
      const dn = (i.data_nascimento || "").replace(/\D/g, "");
      return (
        nome.includes(termo) ||
        (termoDigits && pront.includes(termoDigits)) ||
        (termoDigits && dn.includes(termoDigits))
      );
    });
  }, [listaRetidos, dataFiltro, busca]);

  const toggleSelecionar = (chave: string) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(chave)) {
        novo.delete(chave);
      } else {
        novo.add(chave);
      }
      return novo;
    });
  };

  const toggleSelecionarTodos = () => {
    if (selecionados.size === listaFiltrada.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(listaFiltrada.map(getChaveItem)));
    }
  };

  // Lista isolada para o relatório exclusivo de retidos
  const listaParaRelatorio = useMemo(() => {
    if (selecionados.size > 0) {
      const sel = listaFiltrada.filter((i) => selecionados.has(getChaveItem(i)));
      if (sel.length > 0) return sel;
    }
    return listaFiltrada;
  }, [listaFiltrada, selecionados]);

  // Liberar 1 tubo retido para a grade de hoje (com trava anti-erro)
  const liberarItem = async (item: ItemTriagemEdta) => {
    if (item.tipo_destino === "apenas_glicada" || !item.tem_hemograma) {
      mostrarNotificacao("Bloqueado pela regra anti-erro: tubo Apenas Glicada não pode ir para o Apoio!", "error");
      return;
    }

    if (!item.data_nascimento || !item.data_nascimento.trim()) {
      const confSemDn = window.confirm(
        `ATENÇÃO (Regra Anti-Erro):\nO paciente ${item.nome_paciente} (#${formatarProntuario(item.prontuario)}) está SEM Data de Nascimento preenchida.\n\nDeseja liberar para o Apoio mesmo assim? (Recomendado conferir antes no Conecta SUS)`
      );
      if (!confSemDn) return;
    }

    setIsProcessing(true);
    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const chave = getChaveItem(item);

    // Atualização otimista na tela
    setItens((prev) =>
      prev.map((i) =>
        getChaveItem(i) === chave
          ? {
              ...i,
              status: "pronto_grade",
              colocado_grade: true,
              enviar_hemograma_hoje: true,
              retidoParaFracionar: false,
              data_liberacao_apoio: hojeIso,
              horario_bipado: agora,
            }
          : i
      )
    );

    try {
      const res = await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_item",
          id: item.id,
          prontuario: item.prontuario,
          data: item.data,
          updates: {
            id: item.id,
            data: item.data,
            nome_paciente: item.nome_paciente,
            data_nascimento: item.data_nascimento,
            status: "pronto_grade",
            colocado_grade: true,
            enviar_hemograma_hoje: true,
            retidoParaFracionar: false,
            data_liberacao_apoio: hojeIso,
            horario_bipado: agora,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        mostrarNotificacao(`Tubo de ${item.nome_paciente} liberado para envio ao Apoio hoje!`, "success");
        setSelecionados((prev) => {
          const novo = new Set(prev);
          novo.delete(chave);
          return novo;
        });
      } else {
        throw new Error(data.error || "Erro ao salvar liberação no servidor");
      }
    } catch (err: any) {
      console.error("Erro ao liberar tubo:", err);
      mostrarNotificacao(`Erro ao liberar tubo: ${err.message}`, "error");
      carregarDados();
    } finally {
      setIsProcessing(false);
    }
  };

  // Liberar múltiplos tubos selecionados ou filtrados (com confirmação anti-erro)
  const liberarEmLote = async (itensParaLiberar: ItemTriagemEdta[]) => {
    const elegiveis = itensParaLiberar.filter(
      (i) => i.tipo_destino !== "apenas_glicada" && Boolean(i.tem_hemograma)
    );
    if (elegiveis.length === 0) {
      mostrarNotificacao("Nenhum tubo elegível (Hemograma + Glicada) selecionado para o Apoio.", "warning");
      return;
    }

    const semDn = elegiveis.filter((i) => !i.data_nascimento || !i.data_nascimento.trim()).length;
    const conf = window.confirm(
      `Confirmar liberação de ${elegiveis.length} tubo(s) retido(s) para a Grade do Apoio de HOJE?` +
        (semDn > 0 ? `\n\nAviso: ${semDn} paciente(s) ainda estão sem Data de Nascimento.` : "")
    );
    if (!conf) return;

    setIsProcessing(true);
    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const chavesSet = new Set(elegiveis.map(getChaveItem));

    // Atualização otimista
    setItens((prev) =>
      prev.map((i) =>
        chavesSet.has(getChaveItem(i))
          ? {
              ...i,
              status: "pronto_grade",
              colocado_grade: true,
              enviar_hemograma_hoje: true,
              retidoParaFracionar: false,
              data_liberacao_apoio: hojeIso,
              horario_bipado: agora,
            }
          : i
      )
    );

    let sucessos = 0;
    for (const item of elegiveis) {
      try {
        await fetch("/api/triagem-edta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "atualizar_item",
            id: item.id,
            prontuario: item.prontuario,
            data: item.data,
            updates: {
              id: item.id,
              data: item.data,
              nome_paciente: item.nome_paciente,
              data_nascimento: item.data_nascimento,
              status: "pronto_grade",
              colocado_grade: true,
              enviar_hemograma_hoje: true,
              retidoParaFracionar: false,
              data_liberacao_apoio: hojeIso,
              horario_bipado: agora,
            },
          }),
        });
        sucessos++;
      } catch (e) {
        console.warn("Erro ao liberar item em lote:", item.prontuario, e);
      }
    }

    setSelecionados(new Set());
    setIsProcessing(false);
    mostrarNotificacao(`${sucessos} tubos liberados com segurança para a Grade do Apoio de Hoje!`, "success");
    carregarDados();
  };

  return (
    <>
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 print:hidden">
      {/* TOAST FLUTUANTE */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-700"
                : toast.type === "warning"
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-rose-600 text-white border-rose-700"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toast.type === "warning" && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/triagem-edta"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Voltar para Triagem EDTA"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Clock className="w-5 h-5" />
                </span>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Tubos Retidos Glicada
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs px-2.5 py-0.5 rounded-full">
                  {listaRetidos.length} {listaRetidos.length === 1 ? "tubo" : "tubos"}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Glicada dosada na bancada local • Amostras retidas na gradinha aguardando envio do hemograma ao Apoio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={carregarDados}
              disabled={isLoading || isProcessing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setMostrarRelatorioPrint(true)}
              disabled={listaFiltrada.length === 0}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-40"
              title="Gera folha A4 exclusiva dos tubos retidos, sem misturar com outras listas"
            >
              <Printer className="w-4 h-4" />
              <span>
                {selecionados.size > 0
                  ? `Gerar Relatório Somente Retidos (${selecionados.size})`
                  : `Gerar Relatório Somente Retidos (${listaFiltrada.length})`}
              </span>
            </button>

            <Link
              href="/triagem-edta"
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Bancada EDTA</span>
            </Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        {/* REGRA FIRME ANTI-ERRO DA GRADINHA */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-0.5">
              <div className="font-black uppercase tracking-wide text-[11px] text-amber-900">
                Regra Firme Anti-Erro — Gradinha de Tubos Retidos
              </div>
              <p className="leading-snug">
                Esta lista exibe <strong>exclusivamente tubos com Hemograma + Glicada</strong> aguardando envio do
                Hemograma ao Apoio. Tubos <strong>Apenas Glicada</strong> (Bancada Local) ou <strong>Apenas Hemograma</strong> são
                bloqueados automaticamente para evitar mistura no relatório.
              </p>
            </div>
          </div>

          {inconsistentesApenasGlicada.length > 0 && (
            <div className="shrink-0 bg-white border border-rose-300 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="text-[11px] text-rose-900">
                <strong>{inconsistentesApenasGlicada.length} Apenas Glicada</strong> retido(s) por engano no banco.
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={regularizarApenasGlicada}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition"
              >
                Regularizar p/ Local
              </button>
            </div>
          )}
        </div>
        {/* BARRA DE SELEÇÃO DE PERÍODO / DATA DE ORIGEM */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Data de Origem:</span>
            </span>

            <button
              type="button"
              onClick={() => setDataFiltro("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                !dataFiltro
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <span>Todos os Dias</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                !dataFiltro ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {listaRetidos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDataFiltro(hojeIso)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dataFiltro === hojeIso
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              <span>Hoje</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                dataFiltro === hojeIso ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}>
                {contagemHoje}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDataFiltro(ontemIso)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dataFiltro === ontemIso
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              <span>Ontem</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                dataFiltro === ontemIso ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}>
                {contagemOntem}
              </span>
            </button>

            {outrasDatasComRetidos.map((dt) => {
              const qtd = listaRetidos.filter((i) => normalizarDataIso(i.data) === dt).length;
              return (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDataFiltro(dt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    dataFiltro === dt
                      ? "bg-purple-700 text-white shadow-xs"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200"
                  }`}
                >
                  <span>{formatarData(dt)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      dataFiltro === dt ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {qtd}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SELETOR DE DATA MANUAL (CALENDÁRIO) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Data Específica:</span>
            <input
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-amber-600 bg-white shadow-2xs"
            />
            {dataFiltro && (
              <button
                type="button"
                onClick={() => setDataFiltro("")}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE AÇÕES & BUSCA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, prontuário ou data de nascimento..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {listaFiltrada.length > 0 && (
              <button
                type="button"
                onClick={() => setMostrarRelatorioPrint(true)}
                className="min-h-[44px] px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Gerar folha impressa somente com os tubos retidos"
              >
                <Printer className="w-4 h-4" />
                <span>Relatório Somente Retidos ({listaParaRelatorio.length})</span>
              </button>
            )}

            {selecionados.size > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  liberarEmLote(listaFiltrada.filter((i) => selecionados.has(getChaveItem(i))))
                }
                className="min-h-[44px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Liberar {selecionados.size} Selecionados</span>
              </button>
            )}

            {listaRetidos.length > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => liberarEmLote(listaRetidos)}
                className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Libera todos os tubos retidos para irem na grade do apoio hoje"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Liberar Todos ({listaRetidos.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* LISTAGEM DE TUBOS RETIDOS */}
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
            <p className="font-bold text-slate-700">Carregando tubos retidos da gradinha...</p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-base mb-1">
              {busca ? "Nenhum tubo retido encontrado na busca" : "Gradinha Vazia!"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              {busca
                ? "Verifique o termo digitado ou limpe a busca para ver todas as amostras."
                : "Não há tubos de glicada retidos na bancada no momento. Todos os hemogramas estão liberados ou já foram enviados ao Apoio."}
            </p>
            <Link
              href="/triagem-edta"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Ir para a Triagem EDTA</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelecionarTodos}
                        className="cursor-pointer text-slate-600 hover:text-slate-900"
                        title="Selecionar todos"
                      >
                        {selecionados.size === listaFiltrada.length ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-2 w-12 text-center">Nº</th>
                    <th className="py-3 px-3 w-28 text-center">Prontuário</th>
                    <th className="py-3 px-3">Nome do Paciente</th>
                    <th className="py-3 px-3 w-32 text-center">Data Nasc.</th>
                    <th className="py-3 px-3 w-40 text-center">Exames</th>
                    <th className="py-3 px-2 w-20 text-center">VHS?</th>
                    <th className="py-3 px-3 w-36 text-center">Data de Origem</th>
                    <th className="py-3 px-4 w-36 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {listaFiltrada.map((item, index) => {
                    const chave = getChaveItem(item);
                    const isSel = selecionados.has(chave);
                    const rawDn = item.data_nascimento || "";
                    const dnFormatada = rawDn ? formatarDataNascimento(rawDn) : "";

                    return (
                      <tr
                        key={chave + "-" + index}
                        className={`hover:bg-amber-50/50 transition ${
                          isSel ? "bg-amber-50/70" : index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelecionar(chave)}
                            className="cursor-pointer text-slate-500 hover:text-slate-900"
                          >
                            {isSel ? (
                              <CheckSquare className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-2 text-center font-bold text-slate-500">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          #{formatarProntuario(item.prontuario)}
                        </td>

                        <td className="py-3 px-3 font-black text-slate-900 uppercase">
                          <div className="flex items-center gap-1.5">
                            {item.urgencia && (
                              <span className="bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded border border-rose-700">
                                URG
                              </span>
                            )}
                            <span>{item.nome_paciente}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {dnFormatada ? (
                            dnFormatada
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                              DN Pendente
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                              item.tipo_destino === "apenas_glicada"
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-purple-100 text-purple-900 border-purple-200"
                            }`}
                          >
                            {item.tipo_destino === "apenas_glicada"
                              ? "Apenas Glicada (Bancada)"
                              : "Glicada + Hemograma"}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-center">
                          {item.tem_vhs ? (
                            <span className="inline-block bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                              SIM
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {item.data ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                                item.data === hojeIso
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : item.data === ontemIso
                                  ? "bg-amber-100 text-amber-950 border-amber-300 font-black"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}
                              title={`Data do atendimento: ${item.data}`}
                            >
                              <Calendar className="w-3 h-3 shrink-0" />
                              {item.data === hojeIso
                                ? "Hoje"
                                : item.data === ontemIso
                                ? "Ontem"
                                : formatarData(item.data)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => liberarItem(item)}
                            className="w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                            title="Liberar para envio na grade de hoje"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Liberar Hoje</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>
                Mostrando {listaFiltrada.length} de {listaRetidos.length} tubos retidos
              </span>
              <span className="text-[11px] italic">
                Ao clicar em &quot;Liberar Hoje&quot;, o tubo entra automaticamente no relatório de envio do Apoio.
              </span>
            </div>
          </div>
        )}
      </main>
    </div>

    {/* MODAL DE PRÉVIA (TELA) PARA IMPRESSÃO ISOLADA DOS RETIDOS */}
    {mostrarRelatorioPrint && (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:hidden">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Printer className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-sm">
                  Relatório Exclusivo — Tubos Retidos na Gradinha ({listaParaRelatorio.length})
                </h3>
                <p className="text-[11px] text-slate-300">
                  Lista isolada somente dos tubos retidos (Hemograma + Glicada). Não inclui tubos da grade normal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[40px] px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Folha A4</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarRelatorioPrint(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-300 max-w-3xl mx-auto text-black">
              <div className="text-center border-b-2 border-black pb-3 mb-4">
                <div className="text-[11px] font-black uppercase tracking-wider">
                  SISTEMA ÚNICO DE SAÚDE — SUS | LABORATÓRIO MUNICIPAL DE CACONDE
                </div>
                <h2 className="text-base font-black uppercase mt-1">
                  RELAÇÃO EXCLUSIVA — TUBOS RETIDOS NA GRADINHA (GLICADA / APOIO POSTERIOR)
                </h2>
                <div className="text-xs text-slate-700 mt-1 flex items-center justify-center gap-4 flex-wrap">
                  <span>Emissão: <strong>{formatarData(hojeIso)}</strong></span>
                  <span>Filtro Origem: <strong>{dataFiltro ? formatarData(dataFiltro) : "Todos os Dias"}</strong></span>
                  <span>Total Isolado: <strong>{listaParaRelatorio.length} tubo(s)</strong></span>
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-slate-200 border-b border-black text-[10px] uppercase font-bold text-center">
                    <th className="border border-black p-1.5 w-10">Nº</th>
                    <th className="border border-black p-1.5 w-24">Prontuário</th>
                    <th className="border border-black p-1.5 text-left">Nome do Paciente</th>
                    <th className="border border-black p-1.5 w-24">Data Nasc.</th>
                    <th className="border border-black p-1.5 w-32">Exame</th>
                    <th className="border border-black p-1.5 w-12">VHS</th>
                    <th className="border border-black p-1.5 w-24">Origem</th>
                    <th className="border border-black p-1.5 w-28">Conf. Tubo</th>
                  </tr>
                </thead>
                <tbody>
                  {listaParaRelatorio.map((item, idx) => (
                    <tr key={(item.id || item.prontuario) + "-prev-" + idx} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                      <td className="border border-black p-1.5 text-center font-bold">{String(idx + 1).padStart(2, "0")}</td>
                      <td className="border border-black p-1.5 text-center font-mono font-bold">#{formatarProntuario(item.prontuario)}</td>
                      <td className="border border-black p-1.5 font-bold uppercase">
                        {item.urgencia ? "[URG] " : ""}{item.nome_paciente}
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono">
                        {item.data_nascimento ? formatarDataNascimento(item.data_nascimento) : "Pendente"}
                      </td>
                      <td className="border border-black p-1.5 text-center text-[10.5px] font-bold">GLICADA + HEMOGRAMA</td>
                      <td className="border border-black p-1.5 text-center font-bold">{item.tem_vhs ? "SIM" : "—"}</td>
                      <td className="border border-black p-1.5 text-center font-mono text-[11px]">{formatarData(item.data)}</td>
                      <td className="border border-black p-1.5 text-center text-[10px]">[  ] Gradinha</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 pt-4 border-t border-slate-400 flex items-center justify-between text-xs text-slate-700">
                <div>Conferente (Bancada Local): ___________________________</div>
                <div>Data: ____/____/________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* FOLHA DE IMPRESSÃO A4 EXCLUSIVA PARA @media print */}
    <div className="hidden print:block p-4 bg-white text-black font-sans">
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <div className="text-[10px] font-black uppercase tracking-wider">
          SISTEMA ÚNICO DE SAÚDE — SUS | LABORATÓRIO MUNICIPAL DE CACONDE
        </div>
        <h2 className="text-sm font-black uppercase mt-0.5">
          RELATÓRIO EXCLUSIVO — TUBOS RETIDOS NA GRADINHA (SEM MISTURA COM OUTRAS LISTAS)
        </h2>
        <div className="text-[11px] mt-1 flex items-center justify-center gap-4">
          <span>Emissão: <strong>{formatarData(hojeIso)}</strong></span>
          <span>Filtro Origem: <strong>{dataFiltro ? formatarData(dataFiltro) : "Todos os Dias"}</strong></span>
          <span>Total de Tubos Retidos: <strong>{listaParaRelatorio.length}</strong></span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black text-[11px]">
        <thead>
          <tr className="bg-slate-200 border-b border-black text-[10px] uppercase font-bold text-center">
            <th className="border border-black p-1 w-9">Nº</th>
            <th className="border border-black p-1 w-22">Prontuário</th>
            <th className="border border-black p-1 text-left">Nome do Paciente</th>
            <th className="border border-black p-1 w-22">Data Nasc.</th>
            <th className="border border-black p-1 w-32">Exame</th>
            <th className="border border-black p-1 w-10">VHS</th>
            <th className="border border-black p-1 w-22">Data Origem</th>
            <th className="border border-black p-1 w-24">Conf. Tubo</th>
          </tr>
        </thead>
        <tbody>
          {listaParaRelatorio.map((item, idx) => (
            <tr key={(item.id || item.prontuario) + "-print-" + idx}>
              <td className="border border-black p-1 text-center font-bold">{String(idx + 1).padStart(2, "0")}</td>
              <td className="border border-black p-1 text-center font-mono font-bold">#{formatarProntuario(item.prontuario)}</td>
              <td className="border border-black p-1 font-bold uppercase">
                {item.urgencia ? "[URG] " : ""}{item.nome_paciente}
              </td>
              <td className="border border-black p-1 text-center font-mono">
                {item.data_nascimento ? formatarDataNascimento(item.data_nascimento) : "Pendente"}
              </td>
              <td className="border border-black p-1 text-center text-[10px] font-bold">GLICADA + HEMOGRAMA</td>
              <td className="border border-black p-1 text-center font-bold">{item.tem_vhs ? "SIM" : "—"}</td>
              <td className="border border-black p-1 text-center font-mono">{formatarData(item.data)}</td>
              <td className="border border-black p-1 text-center text-[9.5px]">[  ] OK</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 pt-3 border-t border-black flex items-center justify-between text-[11px]">
        <div>Responsável pela Conferência: _____________________________</div>
        <div>Hora: ____:____</div>
      </div>
    </div>
    </>
  );
}
