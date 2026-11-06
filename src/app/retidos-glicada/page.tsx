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
} from "lucide-react";

export default function RetidosGlicadaPage() {
  const [itens, setItens] = useState<ItemTriagemEdta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>("");
  const [dataFiltro, setDataFiltro] = useState<string>("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
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

  // Helper centralizado para verificar se o item é um tubo retido de glicada aguardando envio ao apoio
  const verificarSeEhRetido = (i: ItemTriagemEdta) => {
    // 0. Pacientes que têm APENAS glicada (sem hemograma) não vão para o Apoio, logo não precisam ficar na aba de retidos
    if (i.tipo_destino === "apenas_glicada" || (!i.tem_hemograma && i.tipo_destino !== "hemograma_glicada")) {
      return false;
    }

    // 1. Se o tubo já foi formalmente liberado para o apoio e colocado na grade com envio hoje, ele NÃO está mais retido
    const jaFoiLiberadoAoApoio =
      Boolean(i.data_liberacao_apoio) ||
      (i.status === "pronto_grade" && i.colocado_grade === true && i.enviar_hemograma_hoje === true && !i.retidoParaFracionar);

    if (jaFoiLiberadoAoApoio) return false;

    // 2. É retido se possui Hemograma + Glicada (HbA1c) aguardando envio do hemograma ao apoio
    const temHemogramaEGlicada =
      (Boolean(i.tem_glicada) ||
        i.tipo_destino === "hemograma_glicada" ||
        i.tipo_destino.includes("glic") ||
        (Array.isArray(i.exames_originais) &&
          i.exames_originais.some((e: string) =>
            e.toLowerCase().includes("glic") || e.toLowerCase().includes("hba1c")
          ))) &&
      (Boolean(i.tem_hemograma) || i.tipo_destino.includes("hemogr") || i.tipo_destino === "hemograma_glicada");

    // 3. Ou se foi expressamente retido na bancada
    const retidoExpresso =
      i.status === "retido_envio_posterior" ||
      i.status === "retido_bancada" ||
      (i as any).status === "retido_local" ||
      Boolean((i as any).retidoParaFracionar) ||
      i.enviar_hemograma_hoje === false ||
      (Boolean(i.fracionado_glicada) && !i.colocado_grade);

    return temHemogramaEGlicada || retidoExpresso;
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

  const toggleSelecionar = (prontuario: string) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(prontuario)) {
        novo.delete(prontuario);
      } else {
        novo.add(prontuario);
      }
      return novo;
    });
  };

  const toggleSelecionarTodos = () => {
    if (selecionados.size === listaFiltrada.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(listaFiltrada.map((i) => i.prontuario)));
    }
  };

  // Liberar 1 tubo retido para a grade de hoje
  const liberarItem = async (item: ItemTriagemEdta) => {
    setIsProcessing(true);
    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Atualização otimista na tela
    setItens((prev) =>
      prev.map((i) =>
        i.prontuario === item.prontuario
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
          prontuario: item.prontuario,
          updates: {
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
        mostrarNotificacao(`🚀 Tubo de ${item.nome_paciente} liberado para envio ao Apoio hoje!`, "success");
        setSelecionados((prev) => {
          const novo = new Set(prev);
          novo.delete(item.prontuario);
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

  // Liberar múltiplos tubos selecionados ou todos
  const liberarEmLote = async (itensParaLiberar: ItemTriagemEdta[]) => {
    if (itensParaLiberar.length === 0) return;
    setIsProcessing(true);
    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const prontsSet = new Set(itensParaLiberar.map((i) => i.prontuario));

    // Atualização otimista
    setItens((prev) =>
      prev.map((i) =>
        prontsSet.has(i.prontuario)
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
    for (const item of itensParaLiberar) {
      try {
        await fetch("/api/triagem-edta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "atualizar_item",
            prontuario: item.prontuario,
            updates: {
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
    mostrarNotificacao(`🚀 ${sucessos} tubos foram liberados com sucesso para a Grade de Hoje!`, "success");
    carregarDados();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
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

            <Link
              href="/triagem-edta"
              className="px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Bancada EDTA</span>
            </Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
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

          <div className="flex items-center gap-2">
            {selecionados.size > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  liberarEmLote(listaRetidos.filter((i) => selecionados.has(i.prontuario)))
                }
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                    const isSel = selecionados.has(item.prontuario);
                    const rawDn = item.data_nascimento || "";
                    const dnFormatada = rawDn ? formatarDataNascimento(rawDn) : "—";

                    return (
                      <tr
                        key={item.id || item.prontuario || index}
                        className={`hover:bg-amber-50/50 transition ${
                          isSel ? "bg-amber-50/70" : index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelecionar(item.prontuario)}
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
                          {dnFormatada}
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
  );
}
