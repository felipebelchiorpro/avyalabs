"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ItemRotina, RotinaItem, LaudoUrina, VALORES_PADRAO_NORMAL } from "@/types/urinalise";
import {
  formatarProntuario,
  normalizarDataIso,
  normalizarProntuario,
  obterHojeIsoLocal,
  obterOntemIsoLocal,
} from "@/lib/extratorBancada";
import {
  Package,
  Printer,
  CheckCircle2,
  Search,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  X,
  FileSpreadsheet,
  UserPlus,
  ArrowDownToLine,
  PlusCircle,
  Save,
  User,
} from "lucide-react";

export default function LoteVdrlPage() {
  const [rotina, setRotina] = useState<ItemRotina[]>([]);
  const [laudos, setLaudos] = useState<LaudoUrina[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>("");
  const [dataRodagem, setDataRodagem] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);

  // Mapa de prontuário -> resultado selecionado ("Não Reagente", "Reagente 1/1", etc.)
  const [titulacoes, setTitulacoes] = useState<Record<string, string>>({});
  // Prontuários selecionados para rodar neste lote
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  // Modal de impressão do mapa da bancada
  const [mostrarMapaPrint, setMostrarMapaPrint] = useState<boolean>(false);
  const [mostrarHistoricoFinalizados, setMostrarHistoricoFinalizados] = useState<boolean>(false);

  // Estados para Adicionar Paciente Avulso (VDRL + Triagem do Dia)
  const [mostrarModalAvulso, setMostrarModalAvulso] = useState<boolean>(false);
  const [novoNome, setNovoNome] = useState<string>("");
  const [novoProntuario, setNovoProntuario] = useState<string>("");
  const [novoIdadeSexo, setNovoIdadeSexo] = useState<string>("SUS");
  const [novoPosto, setNovoPosto] = useState<string>("UBS Central Caconde");
  const [novoSolicitante, setNovoSolicitante] = useState<string>("Dr(a). Clínico(a) Geral / UBS");
  const [incluirUrina, setIncluirUrina] = useState<boolean>(false);
  const [incluirPso, setIncluirPso] = useState<boolean>(false);
  const [salvandoAvulso, setSalvandoAvulso] = useState<boolean>(false);

  // Estado de movimentação em lote dos retidos para a triagem de hoje
  const [isMoverRetidos, setIsMoverRetidos] = useState<boolean>(false);

  const hojeIso = useMemo(() => obterHojeIsoLocal(), []);
  const ontemIso = useMemo(() => obterOntemIsoLocal(), []);

  const getChaveVdrl = (pront: string, data?: string) => `${normalizarDataIso(data) || hojeIso}::${formatarProntuario(pront)}`;

  const formatarDataCurta = (dStr?: string) => {
    const norm = normalizarDataIso(dStr);
    if (!norm) return "Hoje";
    if (norm === hojeIso) return "Hoje";
    if (norm === ontemIso) return "Ontem";
    const [ano, mes, dia] = norm.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    setDataRodagem(obterHojeIsoLocal());
    carregarDados();
  }, []);

  const mostrarNotificacao = (message: string, type: "success" | "warning" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [resRot, resLaudos] = await Promise.all([
        fetch("/api/rotina?data=todas"),
        fetch("/api/laudos?data=todas"),
      ]);

      const dataRot = await resRot.json();
      const dataLau = await resLaudos.json();

      const listaRotina: ItemRotina[] = dataRot.ok && Array.isArray(dataRot.rotina) ? dataRot.rotina : [];
      const listaLaudos: LaudoUrina[] = dataLau.ok && Array.isArray(dataLau.laudos) ? dataLau.laudos : [];

      setRotina(listaRotina);
      setLaudos(listaLaudos);

      const hojeAtual = obterHojeIsoLocal();
      // Auto-selecionar os que têm VDRL de hoje ou acumulados de dias anteriores e ainda não foram finalizados
      const chavesPendentes = new Set<string>();
      const titIniciais: Record<string, string> = {};

      listaRotina.forEach((p) => {
        if (!p.tem_vdrl) return;
        const pront = formatarProntuario(p.prontuario);
        const dataItem = normalizarDataIso(p.data || p.data_rotina) || hojeAtual;
        const chave = `${dataItem}::${pront}`;

        const l =
          listaLaudos.find(
            (la) =>
              formatarProntuario(la.prontuario) === pront &&
              normalizarDataIso((la as any).data_atendimento || la.data_hora?.split("T")[0]) === dataItem
          ) || listaLaudos.find((la) => formatarProntuario(la.prontuario) === pront);

        const estaFinalizado =
          l &&
          l.status === "finalizado" &&
          !l.vdrl_acumular_lote &&
          l.resultado_vdrl !== "Aguardando lote semanal";

        if (!estaFinalizado) {
          chavesPendentes.add(chave);
          titIniciais[chave] =
            l?.resultado_vdrl && l.resultado_vdrl !== "Aguardando lote semanal"
              ? l.resultado_vdrl
              : "Não Reagente";
        }
      });

      setSelecionados(chavesPendentes);
      setTitulacoes(titIniciais);
    } catch (err: any) {
      console.error("Erro ao carregar dados do VDRL:", err);
      mostrarNotificacao("Erro de conexão ao carregar rotina.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar pacientes com VDRL: hoje (todos) + dias anteriores pendentes/acumulados (e finalizados se toggle ativo)
  const todosVdrl = useMemo(() => {
    return rotina
      .filter((p) => Boolean(p.tem_vdrl))
      .map((p) => {
        const pront = formatarProntuario(p.prontuario);
        const dataItem = normalizarDataIso(p.data || p.data_rotina) || hojeIso;
        const chave = `${dataItem}::${pront}`;
        const l =
          laudos.find(
            (la) =>
              formatarProntuario(la.prontuario) === pront &&
              normalizarDataIso((la as any).data_atendimento || la.data_hora?.split("T")[0]) === dataItem
          ) || laudos.find((la) => formatarProntuario(la.prontuario) === pront);

        const estaAcumulado = Boolean(l?.vdrl_acumular_lote || l?.resultado_vdrl === "Aguardando lote semanal");
        const estaFinalizado = Boolean(l && l.status === "finalizado" && !estaAcumulado);
        return {
          ...p,
          data: dataItem,
          chave,
          prontuario: pront,
          laudo: l || null,
          estaAcumulado,
          estaFinalizado,
          resultadoGravado: l?.resultado_vdrl || "",
        };
      })
      .filter((item) => {
        if (mostrarHistoricoFinalizados) return true;
        // Por padrão mostra todos de hoje + quaisquer acumulados/pendentes de dias anteriores
        return item.data === hojeIso || !item.estaFinalizado;
      })
      .sort((a, b) => {
        if (a.estaFinalizado !== b.estaFinalizado) return a.estaFinalizado ? 1 : -1;
        if (a.data !== b.data) return b.data.localeCompare(a.data);
        return a.nome_paciente.localeCompare(b.nome_paciente, "pt-BR");
      });
  }, [rotina, laudos, hojeIso, mostrarHistoricoFinalizados]);

  // Lista com filtro de busca
  const vdrlFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return todosVdrl.filter((p) => {
      if (!q) return true;
      return (
        p.nome_paciente.toLowerCase().includes(q) ||
        p.prontuario.toLowerCase().includes(q) ||
        (p.posto_unidade && p.posto_unidade.toLowerCase().includes(q))
      );
    });
  }, [todosVdrl, busca]);

  const pendentesCount = todosVdrl.filter((p) => !p.estaFinalizado).length;
  const finalizadosCount = todosVdrl.filter((p) => p.estaFinalizado).length;

  // Pacientes com VDRL retidos/acumulados de datas anteriores ou guardados para lote
  const retidosAcumulados = useMemo(() => {
    return todosVdrl.filter(
      (p) => !p.estaFinalizado && (p.estaAcumulado || p.data !== hojeIso)
    );
  }, [todosVdrl, hojeIso]);

  // Salvar Paciente Avulso (VDRL + Triagem do Dia / Urina)
  const salvarPacienteAvulso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      mostrarNotificacao("Informe o nome do paciente.", "warning");
      return;
    }
    if (!novoProntuario.trim()) {
      mostrarNotificacao("Informe o prontuário do paciente.", "warning");
      return;
    }

    setSalvandoAvulso(true);
    try {
      const hoje = obterHojeIsoLocal();
      const prontFormatado = formatarProntuario(novoProntuario);
      const examesArray = ["VDRL"];
      if (incluirUrina) examesArray.push("URINA I");
      if (incluirPso) examesArray.push("SANGUE OCULTO");
      const exameTexto = examesArray.join(" + ");

      const itemNovo: RotinaItem = {
        id: `rot-${hoje}-${normalizarProntuario(prontFormatado)}`,
        data: hoje,
        prontuario: prontFormatado,
        nome_paciente: novoNome.trim().toUpperCase(),
        idade_sexo: novoIdadeSexo.trim() || "SUS",
        posto_unidade: novoPosto.trim() || "UBS Central Caconde",
        solicitante: novoSolicitante.trim() || "Dr(a). Clínico(a) Geral / UBS",
        exame: exameTexto,
        status_coleta: "REALIZADO",
        status_laudo: "rascunho",
        tem_vdrl: true,
        tem_urina: incluirUrina,
        tem_pso: incluirPso,
      };

      // 1. Salvar na rotina_dia do D1
      const resRot = await fetch("/api/rotina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: [itemNovo], substituir: false }),
      });
      const dataRot = await resRot.json();
      if (!dataRot.ok) throw new Error(dataRot.error || "Erro ao salvar na rotina.");

      // 2. Salvar laudo rascunho com o VDRL
      await fetch("/api/laudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...VALORES_PADRAO_NORMAL,
          prontuario: prontFormatado,
          nome_paciente: novoNome.trim().toUpperCase(),
          idade_sexo: novoIdadeSexo.trim() || "SUS",
          posto_unidade: novoPosto.trim() || "UBS Central Caconde",
          solicitante: novoSolicitante.trim() || "Dr(a). Clínico(a) Geral / UBS",
          status: "rascunho",
          tem_vdrl: true,
          resultado_vdrl: "Não Reagente",
          vdrl_acumular_lote: false,
          tem_urina: incluirUrina,
          tem_pso: incluirPso,
          data_atendimento: hoje,
          data_hora: `${hoje}T12:00:00`,
        }),
      });

      mostrarNotificacao(
        `✓ Paciente ${novoNome.trim().toUpperCase()} cadastrado com sucesso! Já está visível na lista do VDRL e na Triagem do Dia (/urina).`,
        "success"
      );

      // Limpa os campos e fecha o modal
      setNovoNome("");
      setNovoProntuario("");
      setIncluirUrina(false);
      setIncluirPso(false);
      setMostrarModalAvulso(false);

      await carregarDados();
    } catch (err: any) {
      console.error("Erro ao salvar paciente avulso:", err);
      mostrarNotificacao(`Erro ao cadastrar avulso: ${err.message}`, "error");
    } finally {
      setSalvandoAvulso(false);
    }
  };

  // Mover Pacientes Retidos / Acumulados para a Triagem do Dia de HOJE
  const mandarRetidosParaTriagemDeHoje = async (lista: typeof todosVdrl) => {
    if (!lista || lista.length === 0) {
      mostrarNotificacao("Nenhum paciente retido selecionado para mover.", "warning");
      return;
    }

    setIsMoverRetidos(true);
    let totalMovidos = 0;
    try {
      const hoje = obterHojeIsoLocal();
      const itensRotinaHoje: RotinaItem[] = lista.map((pac) => {
        const prontNorm = normalizarProntuario(pac.prontuario);
        const exameBase = pac.exame || "VDRL";
        const exameFinal = exameBase.includes("VDRL") ? exameBase : `${exameBase} + VDRL`;

        return {
          id: `rot-${hoje}-${prontNorm}`,
          data: hoje,
          prontuario: formatarProntuario(pac.prontuario),
          nome_paciente: pac.nome_paciente,
          idade_sexo: pac.idade_sexo || "SUS",
          posto_unidade: pac.posto_unidade || "UBS Central Caconde",
          solicitante: pac.solicitante || "Dr(a). Clínico(a) Geral / UBS",
          exame: exameFinal,
          status_coleta: "REALIZADO",
          status_laudo: "rascunho",
          tem_vdrl: true,
          tem_urina: Boolean(pac.tem_urina),
          tem_pso: Boolean(pac.tem_pso),
        };
      });

      // 1. Salvar na rotina_dia do D1 com a data de HOJE
      const resRot = await fetch("/api/rotina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: itensRotinaHoje, substituir: false }),
      });
      const dataRot = await resRot.json();
      if (!dataRot.ok) throw new Error(dataRot.error || "Erro ao gravar na rotina de hoje.");

      // 2. Atualizar os laudos para data_atendimento de hoje e desmarcar lote acumulado
      for (const pac of lista) {
        const laudoExistente = pac.laudo;
        const resVdrl =
          titulacoes[pac.chave] && titulacoes[pac.chave] !== "Aguardando lote semanal"
            ? titulacoes[pac.chave]
            : "Não Reagente";

        await fetch("/api/laudos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(laudoExistente || VALORES_PADRAO_NORMAL),
            prontuario: pac.prontuario,
            nome_paciente: pac.nome_paciente,
            idade_sexo: pac.idade_sexo || "SUS",
            posto_unidade: pac.posto_unidade || "UBS Central Caconde",
            solicitante: pac.solicitante || "Dr(a). Clínico(a) Geral / UBS",
            status: "rascunho",
            tem_vdrl: true,
            resultado_vdrl: resVdrl,
            vdrl_acumular_lote: false,
            data_atendimento: hoje,
            data_hora: `${hoje}T12:00:00`,
          }),
        });
        totalMovidos++;
      }

      mostrarNotificacao(
        `✓ ${totalMovidos} paciente(s) retido(s) enviados para a Triagem do Dia de HOJE! Já estão disponíveis em /urina e na montagem do lote.`,
        "success"
      );

      await carregarDados();
    } catch (err: any) {
      console.error("Erro ao mover retidos para triagem de hoje:", err);
      mostrarNotificacao(`Erro ao mover retidos: ${err.message}`, "error");
    } finally {
      setIsMoverRetidos(false);
    }
  };

  // Alternar seleção individual para montagem do dia
  const toggleSelecionado = (chave: string) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  };

  // Selecionar todos os pendentes para rodar hoje
  const selecionarTodosPendentes = () => {
    const novo = new Set<string>();
    todosVdrl.forEach((p) => {
      if (!p.estaFinalizado) novo.add(p.chave);
    });
    setSelecionados(novo);
  };

  // Desmarcar todos
  const desmarcarTodos = () => {
    setSelecionados(new Set());
  };

  // Definir todos os selecionados como "Não Reagente"
  const definirSelecionadosNaoReagente = () => {
    if (selecionados.size === 0) {
      mostrarNotificacao("Selecione ao menos um paciente para aplicar o resultado.", "warning");
      return;
    }
    const novo = { ...titulacoes };
    selecionados.forEach((chave) => {
      novo[chave] = "Não Reagente";
    });
    setTitulacoes(novo);
    mostrarNotificacao(`${selecionados.size} amostras definidas como 'Não Reagente'. Clique em Salvar e Liberar Marcados para gravar no D1.`, "success");
  };

  // Salvar selecionados como ACUMULADOS para outro dia (em lote no D1)
  const acumularSelecionadosParaOutroDia = async () => {
    if (selecionados.size === 0) {
      mostrarNotificacao("Selecione ao menos um paciente para guardar no lote para outro dia.", "warning");
      return;
    }
    setIsSaving(true);
    let sucessos = 0;
    try {
      const listaParaAcumular = todosVdrl.filter((p) => selecionados.has(p.chave));
      for (const pac of listaParaAcumular) {
        const laudoExistente = pac.laudo;
        const payload: Partial<LaudoUrina> & { data_atendimento?: string } = {
          ...(laudoExistente || VALORES_PADRAO_NORMAL),
          prontuario: pac.prontuario,
          nome_paciente: pac.nome_paciente,
          idade_sexo: pac.idade_sexo || "SUS",
          posto_unidade: pac.posto_unidade || "Conecta SUS",
          solicitante: pac.solicitante || "Conecta SUS",
          status: "rascunho",
          tem_vdrl: true,
          resultado_vdrl: "Aguardando lote semanal",
          vdrl_acumular_lote: true,
          data_atendimento: pac.data,
          data_hora: laudoExistente?.data_hora || `${pac.data}T12:00:00`,
        };

        const res = await fetch("/api/laudos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok) sucessos++;
      }
      mostrarNotificacao(
        `${sucessos} amostra(s) salvas no D1 como Lote Acumulado! Elas permanecerão visíveis aqui nos próximos dias até você rodar a placa.`,
        "warning"
      );
      await carregarDados();
    } catch (err: any) {
      mostrarNotificacao(`Erro ao acumular lote: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar todo o lote montado
  const salvarLote = async () => {
    if (selecionados.size === 0) {
      mostrarNotificacao("Nenhum paciente selecionado para salvar.", "warning");
      return;
    }
    setIsSaving(true);
    let sucessos = 0;
    try {
      const listaParaSalvar = todosVdrl.filter((p) => selecionados.has(p.chave));

      for (const pac of listaParaSalvar) {
        const pront = pac.prontuario;
        const resVdrl = titulacoes[pac.chave] || "Não Reagente";
        const laudoExistente = pac.laudo;

        const payload: Partial<LaudoUrina> & { data_atendimento?: string } = {
          ...(laudoExistente || VALORES_PADRAO_NORMAL),
          prontuario: pront,
          nome_paciente: pac.nome_paciente,
          idade_sexo: pac.idade_sexo || "SUS",
          posto_unidade: pac.posto_unidade || "Conecta SUS",
          solicitante: pac.solicitante || "Conecta SUS",
          status: "finalizado",
          tem_vdrl: true,
          resultado_vdrl: resVdrl,
          vdrl_acumular_lote: false,
          data_atendimento: pac.data,
          data_hora: laudoExistente?.data_hora || `${pac.data}T12:00:00`,
        };

        const res = await fetch("/api/laudos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok && data.laudo) {
          sucessos++;
        }
      }
      mostrarNotificacao(`Lote concluído com sucesso! ${sucessos} laudo(s) de VDRL gravados no Cloudflare D1.`, "success");
      await carregarDados();
    } catch (err: any) {
      console.error("Erro ao salvar lote de VDRL:", err);
      mostrarNotificacao(`Erro ao gravar lote: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar individualmente um paciente
  const salvarIndividual = async (pac: typeof todosVdrl[0]) => {
    const pront = pac.prontuario;
    const resVdrl = titulacoes[pac.chave] || "Não Reagente";
    const laudoExistente = pac.laudo;

    try {
      const payload: Partial<LaudoUrina> & { data_atendimento?: string } = {
        ...(laudoExistente || VALORES_PADRAO_NORMAL),
        prontuario: pront,
        nome_paciente: pac.nome_paciente,
        idade_sexo: pac.idade_sexo || "SUS",
        posto_unidade: pac.posto_unidade || "Conecta SUS",
        solicitante: pac.solicitante || "Conecta SUS",
        status: "finalizado",
        tem_vdrl: true,
        resultado_vdrl: resVdrl,
        vdrl_acumular_lote: false,
        data_atendimento: pac.data,
        data_hora: laudoExistente?.data_hora || `${pac.data}T12:00:00`,
      };

      const res = await fetch("/api/laudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.laudo) {
        mostrarNotificacao(`VDRL de ${pac.nome_paciente.split(" ")[0]} salvo como '${resVdrl}' no D1!`, "success");
        await carregarDados();
      }
    } catch (err: any) {
      mostrarNotificacao(`Erro ao salvar: ${err.message}`, "error");
    }
  };

  // Marcar para continuar acumulando (outro dia)
  const marcarContinuarAcumulado = async (pac: typeof todosVdrl[0]) => {
    const pront = pac.prontuario;
    try {
      const payload: Partial<LaudoUrina> & { data_atendimento?: string } = {
        ...(pac.laudo || VALORES_PADRAO_NORMAL),
        prontuario: pront,
        nome_paciente: pac.nome_paciente,
        idade_sexo: pac.idade_sexo || "SUS",
        posto_unidade: pac.posto_unidade || "Conecta SUS",
        solicitante: pac.solicitante || "Conecta SUS",
        status: "rascunho",
        tem_vdrl: true,
        resultado_vdrl: "Aguardando lote semanal",
        vdrl_acumular_lote: true,
        data_atendimento: pac.data,
        data_hora: pac.laudo?.data_hora || `${pac.data}T12:00:00`,
      };

      await fetch("/api/laudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      mostrarNotificacao(`VDRL de ${pac.nome_paciente.split(" ")[0]} salvo para outro dia (Lote Acumulado no D1).`, "warning");
      await carregarDados();
    } catch (err: any) {
      mostrarNotificacao("Erro ao atualizar status.", "error");
    }
  };

  return (
    <>
    <div className="min-h-screen bg-slate-100/90 py-6 px-3 sm:px-6 max-w-7xl mx-auto print:hidden">
      {/* TOAST FLUTUANTE */}
      {toast && (
        <div className="fixed top-16 right-3 left-3 sm:left-auto z-50 max-w-md animate-in fade-in duration-200">
          <div
            className={`p-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-950 text-emerald-50 border-emerald-700"
                : toast.type === "warning"
                ? "bg-amber-950 text-amber-50 border-amber-700"
                : "bg-rose-950 text-rose-50 border-rose-700"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* CABEÇALHO DO LOTE */}
      <div className="bg-white rounded-3xl border border-purple-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-purple-700/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Imunologia & Sorologia SUS
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Data de Rodagem: {dataRodagem.split("-").reverse().join("/")}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Central de Montagem do Lote de VDRL (Sífilis)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Junte os soros dos dias anteriores para pipetar a placa, titular e liberar todos de uma vez só.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setMostrarModalAvulso(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md shadow-purple-900/20 active:scale-95 min-h-[42px]"
              title="Cadastrar paciente avulso com VDRL para entrar no lote e na rotina do dia"
            >
              <UserPlus className="w-4 h-4 text-purple-200" />
              <span>+ Paciente Avulso (VDRL)</span>
            </button>

            <button
              type="button"
              onClick={carregarDados}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs min-h-[42px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarMapaPrint(true)}
              disabled={todosVdrl.length === 0}
              className="px-4 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md shadow-purple-800/20 active:scale-95 min-h-[42px]"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Mapa da Placa VDRL</span>
            </button>
          </div>
        </div>

        {/* ESTATÍSTICAS E CONTADORES EM TEMPO REAL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200">
            <span className="text-[10px] font-black uppercase text-purple-900 block">Total de VDRLs</span>
            <span className="text-2xl font-black text-purple-950 font-mono">{todosVdrl.length}</span>
            <span className="text-[10.5px] text-purple-800 block mt-0.5">Cadastrados no sistema</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
            <span className="text-[10px] font-black uppercase text-amber-900 block">📦 Pendentes / Acumulados</span>
            <span className="text-2xl font-black text-amber-950 font-mono">{pendentesCount}</span>
            <span className="text-[10.5px] text-amber-800 block mt-0.5">
              {retidosAcumulados.length} retido(s) p/ outro dia
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200">
            <span className="text-[10px] font-black uppercase text-sky-900 block">🎯 Selecionados Hoje</span>
            <span className="text-2xl font-black text-sky-950 font-mono">{selecionados.size}</span>
            <span className="text-[10.5px] text-sky-800 block mt-0.5">Montados para rodagem</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[10px] font-black uppercase text-emerald-900 block">✅ Liberados / Finalizados</span>
            <span className="text-2xl font-black text-emerald-950 font-mono">{finalizadosCount}</span>
            <span className="text-[10.5px] text-emerald-800 block mt-0.5">Com laudo pronto</span>
          </div>
        </div>
      </div>

      {/* BANNER DE RETIDOS DE DIAS ANTERIORES PARA MANDAR PARA A TRIAGEM DE HOJE */}
      {retidosAcumulados.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-amber-950/30 rounded-2xl border border-amber-500/40 p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-200 uppercase tracking-wide">
                  Tubos Retidos / Acumulados de Dias Anteriores
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-mono">
                  {retidosAcumulados.length} Amostra(s) na Geladeira/Bancada
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Você possui exames de VDRL retidos de datas anteriores. Deseja mandar para a <strong>Triagem do Dia de Hoje</strong> para que apareçam na lista de bancada (<code>/urina</code>) e no mapa de hoje?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              disabled={isMoverRetidos}
              onClick={() => {
                const marcados = retidosAcumulados.filter((p) => selecionados.has(p.chave));
                mandarRetidosParaTriagemDeHoje(marcados.length > 0 ? marcados : retidosAcumulados);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-900/30 cursor-pointer active:scale-95 disabled:opacity-50 min-h-[42px]"
            >
              <ArrowDownToLine className="w-4 h-4 text-amber-200" />
              <span>
                {isMoverRetidos
                  ? "Transferindo para Hoje..."
                  : retidosAcumulados.filter((p) => selecionados.has(p.chave)).length > 0
                  ? `Mandar Marcados (${retidosAcumulados.filter((p) => selecionados.has(p.chave)).length}) p/ Triagem de Hoje`
                  : `Mandar Todos (${retidosAcumulados.length}) p/ Triagem de Hoje`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE AÇÕES EM MASSA PARA MONTAR O DIA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase text-slate-700 mr-1">Montar o Lote:</span>
            <button
              type="button"
              onClick={selecionarTodosPendentes}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer active:scale-95"
            >
              Marcar Todos Pendentes ({pendentesCount})
            </button>
            <button
              type="button"
              onClick={desmarcarTodos}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer active:scale-95"
            >
              Desmarcar Todos
            </button>
            <button
              type="button"
              onClick={() => setMostrarHistoricoFinalizados((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                mostrarHistoricoFinalizados
                  ? "bg-purple-100 text-purple-900 border-purple-300"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {mostrarHistoricoFinalizados ? "Ocultar Lotes Antigos Liberados" : "Ver Histórico Liberado"}
            </button>
          </div>

          {/* AÇÕES DE LANÇAMENTO EM MASSA */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={acumularSelecionadosParaOutroDia}
              disabled={isSaving || selecionados.size === 0}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95 shadow-sm"
              title="Salva os pacientes selecionados no D1 para realizar o lote em outro dia"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Salvar p/ Outro Dia ({selecionados.size})</span>
            </button>

            <button
              type="button"
              onClick={definirSelecionadosNaoReagente}
              disabled={selecionados.size === 0}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-black border border-purple-300 transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Definir Marcados como NÃO REAGENTE</span>
            </button>

            <button
              type="button"
              disabled={isSaving || selecionados.size === 0}
              onClick={salvarLote}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? "Gravando no D1..." : `Salvar e Liberar Marcados (${selecionados.size})`}</span>
            </button>
          </div>
        </div>

        {/* CAMPO DE BUSCA RÁPIDA */}
        <div className="relative pt-1 border-t border-slate-100">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por nome do paciente, prontuário ou posto de saúde..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-purple-600 transition"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* LISTA / TABELA DE PACIENTES COM VDRL */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase">
            Amostras Cadastradas ({vdrlFiltrados.length})
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Selecione as amostras para incluir na rodagem da placa e toque no resultado para titular
          </div>
        </div>

        {vdrlFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm text-slate-700">Nenhum exame de VDRL encontrado.</p>
            <p className="text-xs">
              Quando você importar uma planilha do Conecta SUS com exames de VDRL, eles aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {vdrlFiltrados.map((pac, idx) => {
              const pront = pac.prontuario;
              const chave = pac.chave;
              const estaSelecionado = selecionados.has(chave);
              const titAtual = titulacoes[chave] || (pac.resultadoGravado !== "Aguardando lote semanal" ? pac.resultadoGravado : "") || "Não Reagente";

              return (
                <div
                  key={chave + "-" + idx}
                  className={`p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 ${
                    estaSelecionado ? "bg-purple-50/30" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {/* ESQUERDA: CHECKBOX DE MONTAGEM + DADOS DO PACIENTE */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={estaSelecionado}
                      onChange={() => toggleSelecionado(chave)}
                      className="mt-1 w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
                          Poço #{idx + 1}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {pront}
                        </span>
                        <span className="font-black text-sm text-slate-900 uppercase">
                          {pac.nome_paciente}
                        </span>

                        {pac.estaFinalizado ? (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Liberado ({pac.resultadoGravado})
                          </span>
                        ) : pac.estaAcumulado ? (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                            Acumulado p/ Outro Dia
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Data da Coleta: <strong>{formatarDataCurta(pac.data || pac.data_rotina)}</strong></span>
                        <span>Posto: <strong>{pac.posto_unidade || "Conecta SUS"}</strong></span>
                        {pac.idade_sexo && <span>Idade: <strong>{pac.idade_sexo}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* DIREITA: SELEÇÃO DA TITULAÇÃO & BOTÕES DE AÇÃO */}
                  <div className="flex items-center gap-1.5 flex-wrap self-end lg:self-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Titulação:</span>
                    {[
                      { label: "Não Reagente", val: "Não Reagente", cor: "bg-emerald-50 text-emerald-800 border-emerald-300" },
                      { label: "1:1", val: "Reagente 1/1", cor: "bg-purple-50 text-purple-900 border-purple-300" },
                      { label: "1:2", val: "Reagente 1/2", cor: "bg-purple-50 text-purple-900 border-purple-300" },
                      { label: "1:4", val: "Reagente 1/4", cor: "bg-purple-50 text-purple-900 border-purple-300" },
                      { label: "1:8", val: "Reagente 1/8", cor: "bg-purple-50 text-purple-900 border-purple-300" },
                      { label: "1:16", val: "Reagente 1/16", cor: "bg-purple-50 text-purple-900 border-purple-300" },
                      { label: "1:32", val: "Reagente 1/32", cor: "bg-purple-50 text-purple-900 border-purple-300" },
                      { label: "1:64", val: "Reagente 1/64", cor: "bg-purple-50 text-purple-900 border-purple-300" },
                    ].map((chip) => {
                      const ativo = titAtual === chip.val;
                      return (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => {
                            setTitulacoes((prev) => ({ ...prev, [chave]: chip.val }));
                            if (!estaSelecionado) toggleSelecionado(chave);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer active:scale-95 ${
                            ativo
                              ? "bg-purple-800 text-white border-purple-800 shadow-sm font-black"
                              : `${chip.cor} hover:opacity-85`
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}

                    <div className="flex items-center gap-1.5 ml-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => salvarIndividual(pac)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition"
                        title="Salvar apenas este paciente com a titulação escolhida"
                      >
                        Salvar
                      </button>

                      {(pac.estaAcumulado || pac.data !== hojeIso) && !pac.estaFinalizado && (
                        <button
                          type="button"
                          onClick={() => mandarRetidosParaTriagemDeHoje([pac])}
                          disabled={isMoverRetidos}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 transition flex items-center gap-1 shadow-2xs"
                          title="Mandar este paciente retido para a Triagem do Dia de HOJE (/urina)"
                        >
                          <ArrowDownToLine className="w-3 h-3 text-amber-800" />
                          <span>Mandar p/ Hoje</span>
                        </button>
                      )}

                      {!pac.estaFinalizado && (
                        <button
                          type="button"
                          onClick={() => marcarContinuarAcumulado(pac)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-lg cursor-pointer active:scale-95"
                          title="Manter guardado no refrigerador para fazer em outro dia"
                        >
                          Acumular p/ Outro Dia
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* MODAL DE PRÉVIA & IMPRESSÃO DO MAPA DE BANCADA DA PLACA VDRL */}
      {mostrarMapaPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:hidden">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            <div className="p-4 bg-purple-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-sm">
                    Mapa de Bancada — Lote de VDRL (Ordem da Placa / Tubos)
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Folha para o técnico colocar na bancada e anotar as leituras da placa de Kline
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Agora</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarMapaPrint(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-300 max-w-3xl mx-auto font-sans text-black">
                {/* Cabeçalho do Mapa Impresso */}
                <div className="text-center border-b-2 border-black pb-3 mb-4">
                  <div className="text-xs font-black uppercase tracking-wider">
                    SISTEMA ÚNICO DE SAÚDE - SUS | REDE MUNICIPAL DE SAÚDE
                  </div>
                  <h2 className="text-base font-black uppercase mt-1">
                    MAPA DE BANCADA — LOTE SEMANAL DE VDRL (SÍFILIS)
                  </h2>
                  <div className="text-xs text-slate-700 mt-0.5 flex items-center justify-center gap-4">
                    <span>Data da Rodagem: <strong>{dataRodagem.split("-").reverse().join("/")}</strong></span>
                    <span>Total de Amostras: <strong>{todosVdrl.length}</strong></span>
                  </div>
                </div>

                {/* Tabela de Pipetagem da Placa */}
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-slate-200 border-b border-black text-[10px] uppercase font-bold text-center">
                      <th className="border border-black p-1.5 w-12">Poço #</th>
                      <th className="border border-black p-1.5 w-24">Prontuário</th>
                      <th className="border border-black p-1.5 text-left">Paciente</th>
                      <th className="border border-black p-1.5 w-20">Data Coleta</th>
                      <th className="border border-black p-1.5 w-28">Triagem (R / NR)</th>
                      <th className="border border-black p-1.5 w-32">Titulação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Controles de Qualidade */}
                    <tr className="bg-purple-50/60 font-bold">
                      <td className="border border-black p-1.5 text-center font-mono">C+</td>
                      <td className="border border-black p-1.5 text-center font-mono">CONTROLE</td>
                      <td className="border border-black p-1.5">CONTROLE POSITIVO (PADRÃO REAGENTE)</td>
                      <td className="border border-black p-1.5 text-center">-</td>
                      <td className="border border-black p-1.5 text-center">REAGENTE</td>
                      <td className="border border-black p-1.5 text-center">1/4 ou 1/8</td>
                    </tr>
                    <tr className="bg-purple-50/60 font-bold">
                      <td className="border border-black p-1.5 text-center font-mono">C-</td>
                      <td className="border border-black p-1.5 text-center font-mono">CONTROLE</td>
                      <td className="border border-black p-1.5">CONTROLE NEGATIVO (PADRÃO NÃO REAGENTE)</td>
                      <td className="border border-black p-1.5 text-center">-</td>
                      <td className="border border-black p-1.5 text-center">NÃO REAGENTE</td>
                      <td className="border border-black p-1.5 text-center">-</td>
                    </tr>

                    {/* Amostras dos Pacientes */}
                    {todosVdrl.map((p, i) => {
                      const res = titulacoes[p.chave] || (p.resultadoGravado !== "Aguardando lote semanal" ? p.resultadoGravado : "") || "";
                      return (
                        <tr key={p.chave + i} className={i % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                          <td className="border border-black p-2 text-center font-black font-mono">
                            #{i + 1}
                          </td>
                          <td className="border border-black p-2 text-center font-mono font-bold">
                            {p.prontuario}
                          </td>
                          <td className="border border-black p-2 font-bold uppercase">
                            {p.nome_paciente}
                          </td>
                          <td className="border border-black p-2 text-center font-mono text-[11px]">
                            {formatarDataCurta(p.data || p.data_rotina)}
                          </td>
                          <td className="border border-black p-2 text-center font-bold">
                            {res.toLowerCase().includes("reagente 1") ? "REAGENTE" : res || "___________"}
                          </td>
                          <td className="border border-black p-2 text-center font-mono font-black">
                            {res || "___________"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Rodapé do Mapa */}
                <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
                  <div>Técnico Responsável: ___________________________</div>
                  <div>Data: ____/____/________</div>
                  <div>Visto Resp. Técnica: ___________________________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ADICIONAR PACIENTE AVULSO (VDRL + TRIAGEM DO DIA) */}
      {mostrarModalAvulso && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-purple-200 animate-in fade-in zoom-in duration-200">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-purple-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Adicionar Paciente Avulso (VDRL)
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Entra no lote do VDRL e na listagem da triagem do dia (/urina)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalAvulso(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={salvarPacienteAvulso} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Paciente <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: MARIA APARECIDA DA SILVA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prontuário Municipal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={novoProntuario}
                    onChange={(e) => setNovoProntuario(e.target.value)}
                    placeholder="Ex: 0054321 ou 54321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Idade / Sexo
                  </label>
                  <input
                    type="text"
                    value={novoIdadeSexo}
                    onChange={(e) => setNovoIdadeSexo(e.target.value)}
                    placeholder="Ex: 34a F ou SUS"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Posto / Unidade de Coleta
                  </label>
                  <input
                    type="text"
                    value={novoPosto}
                    onChange={(e) => setNovoPosto(e.target.value)}
                    placeholder="UBS Central Caconde"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Médico / Solicitante
                  </label>
                  <input
                    type="text"
                    value={novoSolicitante}
                    onChange={(e) => setNovoSolicitante(e.target.value)}
                    placeholder="Dr(a). Clínico(a) Geral"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 transition"
                  />
                </div>
              </div>

              {/* Exames de Bancada Associados */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                <span className="text-[11px] font-bold text-purple-900 block">
                  Exames da Bancada para Incluir na Triagem do Dia:
                </span>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="rounded text-purple-700 border-slate-300"
                    />
                    <span className="text-purple-950 font-bold">VDRL (Sífilis)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirUrina}
                      onChange={(e) => setIncluirUrina(e.target.checked)}
                      className="rounded text-purple-700 border-slate-300 focus:ring-purple-500 cursor-pointer"
                    />
                    <span>+ Urina Tipo I (EAS)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirPso}
                      onChange={(e) => setIncluirPso(e.target.checked)}
                      className="rounded text-purple-700 border-slate-300 focus:ring-purple-500 cursor-pointer"
                    />
                    <span>+ Sangue Oculto (PSO)</span>
                  </label>
                </div>
              </div>

              {/* Botões de Ação do Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalAvulso(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer min-h-[42px]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvandoAvulso}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black shadow-md shadow-purple-900/20 transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 min-h-[42px]"
                >
                  <Save className="w-4 h-4 text-purple-200" />
                  <span>{salvandoAvulso ? "Salvando no D1..." : "Salvar e Incluir na Triagem do Dia"}</span>
                </button>
              </div>
            </form>
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
            MAPA DE BANCADA — LOTE SEMANAL DE VDRL (SÍFILIS)
          </h2>
          <div className="text-[11px] mt-1 flex items-center justify-center gap-4">
            <span>Data da Rodagem: <strong>{dataRodagem.split("-").reverse().join("/")}</strong></span>
            <span>Total de Amostras: <strong>{todosVdrl.length}</strong></span>
          </div>
        </div>
        <table className="w-full border-collapse border border-black text-[11px]">
          <thead>
            <tr className="bg-slate-200 border-b border-black text-[10px] uppercase font-bold text-center">
              <th className="border border-black p-1 w-10">Poço</th>
              <th className="border border-black p-1 w-22">Prontuário</th>
              <th className="border border-black p-1 text-left">Paciente</th>
              <th className="border border-black p-1 w-20">Coleta</th>
              <th className="border border-black p-1 w-24">Triagem</th>
              <th className="border border-black p-1 w-28">Titulação</th>
            </tr>
          </thead>
          <tbody>
            {todosVdrl.map((p, i) => {
              const res = titulacoes[p.chave] || (p.resultadoGravado !== "Aguardando lote semanal" ? p.resultadoGravado : "") || "";
              return (
                <tr key={p.chave + "-print-" + i}>
                  <td className="border border-black p-1 text-center font-mono font-bold">#{i + 1}</td>
                  <td className="border border-black p-1 text-center font-mono font-bold">{p.prontuario}</td>
                  <td className="border border-black p-1 font-bold uppercase">{p.nome_paciente}</td>
                  <td className="border border-black p-1 text-center font-mono">{formatarDataCurta(p.data || p.data_rotina)}</td>
                  <td className="border border-black p-1 text-center font-bold">{res.toLowerCase().includes("reagente 1") ? "REAGENTE" : res || "________"}</td>
                  <td className="border border-black p-1 text-center font-mono font-bold">{res || "________"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
