"use client";

import React, { useState, useEffect, useRef } from "react";
import { EdtaBarcodeScanner } from "@/components/EdtaBarcodeScanner";
import { RelatorioTriagemEdtaPrintView } from "@/components/RelatorioTriagemEdtaPrintView";
import { ItemTriagemEdta, LabConfig, DEFAULT_LAB_CONFIG } from "@/types/urinalise";
import { formatarProntuario } from "@/lib/extratorBancada";
import {
  obterMedicosCadastrados,
  adicionarMedico,
  removerMedico,
  obterMedicoPadrao,
  definirMedicoPadrao,
} from "@/lib/medicosStore";
import {
  tocarSomHemogramaGlicada,
  tocarSomApenasHemograma,
  tocarSomApenasGlicada,
  tocarSomConfirmado,
  tocarSomNaoEncontrado,
} from "@/lib/audioFeedback";
import {
  Camera,
  Keyboard,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Search,
  Check,
  X,
  FileSpreadsheet,
  UploadCloud,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Plus,
  Trash2,
  FileText,
  UserPlus,
} from "lucide-react";

export default function TriagemEdtaPage() {
  const [itens, setItens] = useState<ItemTriagemEdta[]>([]);
  const [dataReferencia, setDataReferencia] = useState<string>("");
  const [horaEncerramento, setHoraEncerramento] = useState<string>("");
  const [labConfig, setLabConfig] = useState<LabConfig>(DEFAULT_LAB_CONFIG);

  // Modo de Entrada: Câmera (Barcode) vs Digitação Manual
  const [modoEntrada, setModoEntrada] = useState<"camera" | "manual">("manual");
  const [prontuarioInput, setProntuarioInput] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Gerenciamento de Médicos Solicitantes
  const [medicosCadastrados, setMedicosCadastrados] = useState<string[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<string>("");
  const [novoMedicoNome, setNovoMedicoNome] = useState<string>("");
  const [medicoPadrao, setMedicoPadraoState] = useState<string>("");
  const [mostrarModalMedicos, setMostrarModalMedicos] = useState<boolean>(false);

  // Modo de Impressão: Ambos (2 Folhas) vs Controle Interno vs Guia Apoio
  const [modoImpressao, setModoImpressao] = useState<"ambos" | "interno" | "apoio">("ambos");

  // Tubo Ativo Bipado / Selecionado no Card Gigante
  const [tuboAtivo, setTuboAtivo] = useState<ItemTriagemEdta | null>(null);
  const [isUrgente, setIsUrgente] = useState<boolean>(false);
  const [avisoNaoEncontrado, setAvisoNaoEncontrado] = useState<string | null>(null);

  // Estados de Sincronização e Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Sinal de Impressão Remoto (PC escutando celular)
  const lastSignalTimeRef = useRef<number>(0);

  // 1. Inicialização
  useEffect(() => {
    document.title = "Triagem EDTA • Hemograma & Glicada • Caconde";
    setDataReferencia(new Date().toISOString().split("T")[0]);

    // Carregar Médicos Cadastrados
    const listaMedicos = obterMedicosCadastrados();
    setMedicosCadastrados(listaMedicos);
    const padrao = obterMedicoPadrao();
    setMedicoPadraoState(padrao);

    const savedConfig = localStorage.getItem("urinalise_lab_config");
    if (savedConfig) {
      try {
        setLabConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error(e);
      }
    }

    carregarDadosEdta();

    // Polling a cada 3.5s para receber sinal de impressão do celular no PC
    const pollInterval = setInterval(() => {
      verificarSinalImpressaoRemota();
    }, 3500);

    return () => clearInterval(pollInterval);
  }, []);

  // Foco no campo quando modo manual estiver ativo
  useEffect(() => {
    if (modoEntrada === "manual" && !tuboAtivo && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [modoEntrada, tuboAtivo]);

  const carregarDadosEdta = async (silencioso = false) => {
    if (!silencioso) setIsLoading(true);
    try {
      const res = await fetch("/api/triagem-edta");
      const data = await res.json();
      if (data.ok && Array.isArray(data.itens)) {
        setItens(data.itens);
        if (data.itens.length > 0 && data.itens[0].data) {
          setDataReferencia(data.itens[0].data);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar Triagem EDTA:", e);
    } finally {
      if (!silencioso) setIsLoading(false);
    }
  };

  // Verifica se o celular enviou sinal de finalização e impressão para o PC
  const verificarSinalImpressaoRemota = async () => {
    try {
      const res = await fetch("/api/triagem-edta?check_print=true");
      const data = await res.json();
      if (data.ok && data.sinalImpressao && data.sinalImpressao.solicitado) {
        const timestamp = data.sinalImpressao.timestamp;
        if (timestamp > lastSignalTimeRef.current) {
          lastSignalTimeRef.current = timestamp;
          if (data.sinalImpressao.horaEncerramento) {
            setHoraEncerramento(data.sinalImpressao.horaEncerramento);
          }

          // Resetar sinal no servidor para não disparar em loop
          await fetch("/api/triagem-edta?reset_print=true");

          // Disparar impressão no PC com os dois relatórios
          setModoImpressao("ambos");
          tocarSomConfirmado();
          setTimeout(() => {
            window.print();
          }, 350);
        }
      }
    } catch (err) {
      // Ignorar erros transitórios de rede no polling
    }
  };

  // Contadores
  const totalTubosEdta = itens.length;
  const totalFracionarGlicada = itens.filter(
    (i) => i.tipo_destino === "hemograma_glicada"
  ).length;
  const totalProntosGrade = itens.filter(
    (i) => i.status === "pronto_grade" || i.colocado_grade
  ).length;

  // Processa o código bipado ou digitado
  const processarCodigoTubo = (codigoBruto: string) => {
    setAvisoNaoEncontrado(null);
    setMensagemSucesso(null);

    const limpo = codigoBruto.trim();
    if (!limpo) return;

    const prontPadrao = formatarProntuario(limpo).toLowerCase();
    const busca = limpo.toLowerCase();

    // Localizar na lista de EDTA do dia
    const encontrado = itens.find(
      (item) =>
        formatarProntuario(item.prontuario).toLowerCase() === prontPadrao ||
        item.prontuario.toLowerCase() === busca ||
        item.nome_paciente.toLowerCase().includes(busca)
    );

    if (encontrado) {
      setTuboAtivo(encontrado);
      setIsUrgente(Boolean(encontrado.urgencia));
      setProntuarioInput("");

      // Pré-selecionar médico: se o paciente já tem, usa o dele; se não, usa o médico padrão cadastrado
      const medExistente = encontrado.solicitante;
      if (medExistente && !medExistente.includes("Conecta") && !medExistente.includes("UBS")) {
        setMedicoSelecionado(medExistente);
      } else if (medicoPadrao) {
        setMedicoSelecionado(medicoPadrao);
      } else if (medicosCadastrados.length > 0) {
        setMedicoSelecionado(medicosCadastrados[0]);
      } else {
        setMedicoSelecionado("Dr(a). Clínico(a) Geral / UBS");
      }

      // Retorno Sonoro Imediato conforme o tipo do exame
      if (encontrado.tipo_destino === "hemograma_glicada") {
        tocarSomHemogramaGlicada();
      } else if (encontrado.tipo_destino === "apenas_hemograma") {
        tocarSomApenasHemograma();
      } else if (encontrado.tipo_destino === "apenas_glicada") {
        tocarSomApenasGlicada();
      }
    } else {
      tocarSomNaoEncontrado();
      setAvisoNaoEncontrado(
        `Prontuário/Código "${limpo}" não localizado na Triagem EDTA de hoje. Verifique se o exame pertence a esta rotina ou importe a planilha do dia.`
      );
      setTuboAtivo(null);
    }
  };

  // Confirmar ação do Card Gigante
  const confirmarAcaoTubo = async () => {
    if (!tuboAtivo) return;

    tocarSomConfirmado();
    setIsSyncing(true);

    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    let novoStatus: "pronto_grade" | "retido_bancada" = "pronto_grade";
    let fracionado = tuboAtivo.fracionado_glicada;
    let colocado = true;

    if (tuboAtivo.tipo_destino === "hemograma_glicada") {
      novoStatus = "pronto_grade";
      fracionado = true;
      colocado = true;
    } else if (tuboAtivo.tipo_destino === "apenas_hemograma") {
      novoStatus = "pronto_grade";
      colocado = true;
    } else if (tuboAtivo.tipo_destino === "apenas_glicada") {
      novoStatus = "retido_bancada";
      colocado = false;
    }

    const medicoFinal = medicoSelecionado.trim() || tuboAtivo.solicitante || "Dr(a). Clínico(a) Geral / UBS";

    const itemAtualizado: ItemTriagemEdta = {
      ...tuboAtivo,
      status: novoStatus,
      fracionado_glicada: fracionado,
      colocado_grade: colocado,
      horario_bipado: agora,
      solicitante: medicoFinal,
      urgencia: isUrgente,
    };

    // Atualização otimista na memória
    setItens((prev) =>
      prev.map((i) =>
        i.prontuario === tuboAtivo.prontuario ? itemAtualizado : i
      )
    );

    try {
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_item",
          prontuario: tuboAtivo.prontuario,
          updates: {
            status: novoStatus,
            fracionado_glicada: fracionado,
            colocado_grade: colocado,
            horario_bipado: agora,
            solicitante: medicoFinal,
            urgencia: isUrgente,
          },
        }),
      });

      setMensagemSucesso(
        `✓ Tubo de ${tuboAtivo.nome_paciente} confirmado! Solicitante: ${medicoFinal}${isUrgente ? " • 🚨 URGÊNCIA" : ""}`
      );
    } catch (e) {
      console.error("Erro ao salvar status no servidor:", e);
    } finally {
      setIsSyncing(false);
      setTuboAtivo(null);
      setProntuarioInput("");
      if (modoEntrada === "manual" && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 120);
      }
    }
  };

  // Botão: Finalizar Triagem & Enviar para Impressão
  const handleFinalizarEEnviarImpressao = async () => {
    const horaAgora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setHoraEncerramento(horaAgora);

    try {
      const res = await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "solicitar_impressao",
          horaEncerramento: horaAgora,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        tocarSomConfirmado();
        setMensagemSucesso(
          `🏁 Triagem finalizada às ${horaAgora}! Sinal transmitido para a tela do PC abrir os relatórios A4.`
        );
      }
    } catch (err) {
      console.error("Erro ao enviar sinal de impressão:", err);
    }
  };

  // Adicionar novo médico
  const handleAdicionarMedico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMedicoNome.trim()) return;
    const atualizados = adicionarMedico(novoMedicoNome.trim());
    setMedicosCadastrados(atualizados);
    setNovoMedicoNome("");
  };

  // Remover médico
  const handleRemoverMedico = (nome: string) => {
    const atualizados = removerMedico(nome);
    setMedicosCadastrados(atualizados);
    if (medicoPadrao === nome) {
      definirMedicoPadrao("");
      setMedicoPadraoState("");
    }
  };

  // Definir médico padrão
  const handleDefinirPadrao = (nome: string) => {
    definirMedicoPadrao(nome);
    setMedicoPadraoState(nome);
  };

  // Alternar Urgência direto na linha do paciente
  const alternarUrgenciaItem = async (e: React.MouseEvent, item: ItemTriagemEdta) => {
    e.stopPropagation();
    const novaUrgencia = !item.urgencia;
    setItens((prev) =>
      prev.map((i) =>
        i.prontuario === item.prontuario ? { ...i, urgencia: novaUrgencia } : i
      )
    );
    if (tuboAtivo && tuboAtivo.prontuario === item.prontuario) {
      setIsUrgente(novaUrgencia);
    }
    try {
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_item",
          prontuario: item.prontuario,
          updates: { urgencia: novaUrgencia },
        }),
      });
      tocarSomConfirmado();
    } catch (err) {
      console.error("Erro ao alternar urgência:", err);
    }
  };

  // Alterar Médico Solicitante direto na linha do paciente
  const alterarMedicoItem = async (prontuario: string, novoMedico: string) => {
    setItens((prev) =>
      prev.map((i) =>
        i.prontuario === prontuario ? { ...i, solicitante: novoMedico } : i
      )
    );
    try {
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_item",
          prontuario,
          updates: { solicitante: novoMedico },
        }),
      });
    } catch (err) {
      console.error("Erro ao alterar médico:", err);
    }
  };

  // Disparar impressão direta
  const dispararImpressao = (tipo: "ambos" | "interno" | "apoio") => {
    setModoImpressao(tipo);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <>
      {/* VISUALIZAÇÃO DE IMPRESSÃO A4 (EXCLUSIVO PARA WINDOW.PRINT()) */}
      <RelatorioTriagemEdtaPrintView
        itens={itens}
        dataReferencia={dataReferencia}
        horaEncerramento={horaEncerramento}
        labConfig={labConfig}
        modoImpressao={modoImpressao}
      />

      {/* INTERFACE DO APLICATIVO (ESCONDIDA NO PRINT) */}
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 print:hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6">
          {/* TOPO COM CONTADORES DE ALTO IMPACTO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Triagem EDTA
                  <span className="text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-full uppercase">
                    Tampa Roxa
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hemograma & Hemoglobina Glicada • Direcionamento de Tubos • Caconde
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMostrarModalMedicos(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-600/50 rounded-xl text-xs font-bold transition shadow-sm"
                title="Cadastrar e gerenciar médicos solicitantes"
              >
                <Stethoscope className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Médicos da Rede</span>
                <span className="sm:hidden">Médicos</span>
              </button>

              <button
                type="button"
                onClick={() => carregarDadosEdta(false)}
                className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
                title="Recarregar dados"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* 3 CONTADORES NO TOPO: [Total Tubos EDTA] [Fracionar Glicada] [Prontos na Grade] */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
            {/* Total Tubos EDTA */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-4 text-center shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Total Tubos EDTA
              </span>
              <span className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-0.5 block">
                {totalTubosEdta}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 block">
                Na rotina de hoje
              </span>
            </div>

            {/* Fracionar Glicada */}
            <div className="bg-purple-950/70 border border-purple-700/60 rounded-2xl p-2.5 sm:p-4 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300 block">
                Fracionar Glicada
              </span>
              <span className="text-2xl sm:text-4xl font-black text-purple-200 tracking-tight mt-0.5 block">
                {totalFracionarGlicada}
              </span>
              <span className="text-[9px] sm:text-[10px] text-purple-400/90 font-semibold mt-0.5 block">
                500 µL Local + Apoio
              </span>
            </div>

            {/* Prontos na Grade */}
            <div className="bg-emerald-950/70 border border-emerald-700/60 rounded-2xl p-2.5 sm:p-4 text-center shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                Prontos na Grade
              </span>
              <span className="text-2xl sm:text-4xl font-black text-emerald-300 tracking-tight mt-0.5 block">
                {totalProntosGrade}
              </span>
              <span className="text-[9px] sm:text-[10px] text-emerald-400/80 font-semibold mt-0.5 block">
                {totalTubosEdta > 0
                  ? `${Math.round((totalProntosGrade / totalTubosEdta) * 100)}% concluído`
                  : "0% concluído"}
              </span>
            </div>
          </div>

          {/* BARRA DE BOTÕES DE IMPRESSÃO NO COMPUTADOR (DOIS RELATÓRIOS OFICIAIS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-white">Relatórios para Impressão A4 (Caconde):</p>
                <p className="text-[10.5px] text-slate-400">1. Controle de Pipetagem (Retido Lab) • 2. Guia de Remessa (Apoio)</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => dispararImpressao("ambos")}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ambos (2 Folhas)</span>
              </button>

              <button
                type="button"
                onClick={() => dispararImpressao("interno")}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
                title="Imprime apenas a relação que fica retida no laboratório"
              >
                Retido Lab
              </button>

              <button
                type="button"
                onClick={() => dispararImpressao("apoio")}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
                title="Imprime apenas a guia que vai para o apoio"
              >
                Guia Apoio
              </button>
            </div>
          </div>

          {/* CADASTRO RÁPIDO DE MÉDICO NA TELA DO PC */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-950 text-sky-400 rounded-xl border border-sky-800 shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white flex items-center gap-1.5">
                  Médicos Solicitantes (Caconde)
                  <span className="text-[10px] font-semibold text-slate-400">({medicosCadastrados.length} cadastrados)</span>
                </p>
                <p className="text-[10.5px] text-slate-400">
                  Cadastre novos médicos para seleção rápida no celular ou atribuição na lista
                </p>
              </div>
            </div>

            <form onSubmit={handleAdicionarMedico} className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Nome do médico (ex: Dr. Lucas Silveira - UBS)..."
                value={novoMedicoNome}
                onChange={(e) => setNovoMedicoNome(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 outline-hidden"
              />
              <button
                type="submit"
                disabled={!novoMedicoNome.trim()}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalMedicos(true)}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                title="Gerenciar lista completa e definir médico padrão"
              >
                Gerenciar
              </button>
            </form>
          </div>

          {/* ALTERNÂNCIA RÁPIDA: CÂMERA (HTML5-QRCODE) vs DIGITAÇÃO MANUAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setModoEntrada("manual")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    modoEntrada === "manual"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Keyboard className="w-4 h-4" />
                  Digitação Manual
                </button>
                <button
                  type="button"
                  onClick={() => setModoEntrada("camera")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    modoEntrada === "camera"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Leitor de Câmera
                </button>
              </div>

              <span className="hidden sm:inline-block text-[11px] font-bold text-slate-400">
                {modoEntrada === "camera" ? "Html5-Qrcode Ativo" : "Enter para buscar"}
              </span>
            </div>

            {/* MODO CÂMERA */}
            {modoEntrada === "camera" && (
              <div className="mb-2">
                <EdtaBarcodeScanner
                  ativo={modoEntrada === "camera" && !tuboAtivo}
                  onScan={(code) => processarCodigoTubo(code)}
                />
              </div>
            )}

            {/* MODO DIGITAÇÃO MANUAL */}
            {modoEntrada === "manual" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processarCodigoTubo(prontuarioInput);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="Bipe ou digite o prontuário (ex: 0021559)..."
                    value={prontuarioInput}
                    onChange={(e) => setProntuarioInput(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white pl-11 pr-4 py-3 rounded-xl text-base sm:text-lg font-mono font-bold tracking-wider placeholder:text-slate-500 transition outline-hidden"
                  />
                  {prontuarioInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setProntuarioInput("");
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!prontuarioInput.trim()}
                  className="bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white px-5 py-3 rounded-xl font-black text-sm sm:text-base flex items-center gap-1.5 transition shadow-lg shadow-purple-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Bipar</span>
                </button>
              </form>
            )}
          </div>

          {/* MENSAGEM DE ALERTA DE NÃO LOCALIZADO */}
          {avisoNaoEncontrado && (
            <div className="mb-4 p-3.5 bg-rose-950/80 border-2 border-rose-600 rounded-2xl flex items-start justify-between gap-2 shadow-lg animate-shake">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-semibold text-rose-200">
                  {avisoNaoEncontrado}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvisoNaoEncontrado(null)}
                className="text-rose-400 hover:text-white text-base leading-none p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* MENSAGEM DE SUCESSO TEMPORÁRIA */}
          {mensagemSucesso && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-600 rounded-2xl flex items-center justify-between gap-2 text-emerald-200 text-xs sm:text-sm font-bold shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{mensagemSucesso}</span>
              </div>
              <button
                type="button"
                onClick={() => setMensagemSucesso(null)}
                className="text-emerald-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CARD GIGANTE COM RETORNO VISUAL, MÉDICO SOLICITANTE E AÇÃO                */}
          {/* ========================================================================= */}
          {tuboAtivo && (
            <div className="mb-6 animate-scaleIn">
              {/* CASO A: HEMOGRAMA + GLICADA (FUNDO ROXO) */}
              {tuboAtivo.tipo_destino === "hemograma_glicada" && (
                <div className="bg-purple-900 border-3 border-purple-400 rounded-3xl p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-purple-700/60 pb-3 mb-4">
                    <span className="text-xs font-black uppercase tracking-widest bg-purple-950/90 text-purple-300 px-3 py-1 rounded-full border border-purple-500/50">
                      Tubo EDTA Tampa Roxa • Alerta de Alíquota
                    </span>
                    <button
                      type="button"
                      onClick={() => setTuboAtivo(null)}
                      className="text-purple-300 hover:text-white p-1 text-sm font-bold"
                    >
                      Cancelar ✕
                    </button>
                  </div>

                  {/* IDENTIFICAÇÃO DO PACIENTE */}
                  <div className="mb-4 bg-purple-950/60 p-3.5 rounded-2xl border border-purple-700/40">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-purple-300">
                        Prontuário: {tuboAtivo.prontuario}
                      </span>
                      <span className="text-[11px] font-bold text-purple-300/80 uppercase">
                        Conecta SUS
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1 uppercase leading-tight">
                      {tuboAtivo.nome_paciente}
                    </h2>

                    {/* SELEÇÃO DO MÉDICO SOLICITANTE E URGÊNCIA */}
                    <div className="mt-3 pt-2.5 border-t border-purple-800/80 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-purple-300">
                          <Stethoscope className="w-4 h-4 text-purple-300 shrink-0" />
                          <span className="font-bold">Médico Solicitante:</span>
                        </div>
                        <select
                          value={medicoSelecionado}
                          onChange={(e) => setMedicoSelecionado(e.target.value)}
                          className="bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-purple-500 focus:outline-hidden focus:ring-2 focus:ring-purple-400 cursor-pointer"
                        >
                          {medicosCadastrados.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* CHECKBOX DE URGÊNCIA NO APP DO CELULAR */}
                      <label className="flex items-center gap-2.5 p-2 bg-purple-950/80 border border-rose-500/60 rounded-xl cursor-pointer hover:bg-purple-950 transition select-none">
                        <input
                          type="checkbox"
                          checked={isUrgente}
                          onChange={(e) => setIsUrgente(e.target.checked)}
                          className="w-5 h-5 rounded-md text-rose-600 bg-slate-900 border-rose-400 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-black text-rose-300 flex items-center gap-1.5">
                            🚨 Hemograma de URGÊNCIA
                          </span>
                          <span className="text-[10px] text-purple-200/80 block">
                            Exibe &quot;🚨 URGÊNCIA&quot; no nome do paciente na folha do Apoio e do Lab
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* MENSAGEM VISUAL DE DESTAQUE */}
                  <div className="bg-purple-950/90 border-2 border-amber-400/80 p-4 rounded-2xl mb-5 text-center shadow-inner">
                    <h3 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wide flex items-center justify-center gap-2 uppercase">
                      <span className="text-2xl">⚠️</span>
                      FRACIONAR 500 µL PARA GLICADA
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-purple-100 mt-2 max-w-lg mx-auto">
                      Pipetar alíquota no microtubo local e colocar o tubo EDTA na grade do Apoio.
                    </p>
                  </div>

                  {/* BOTÃO VERDE GIGANTE: [ ✓ Fracionado & Na Grade ] */}
                  <button
                    type="button"
                    onClick={confirmarAcaoTubo}
                    disabled={isSyncing}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 text-lg sm:text-xl font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition cursor-pointer"
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                    <span>[ ✓ Fracionado & Na Grade ]</span>
                  </button>
                </div>
              )}

              {/* CASO B: APENAS HEMOGRAMA (FUNDO AZUL) */}
              {tuboAtivo.tipo_destino === "apenas_hemograma" && (
                <div className="bg-blue-900 border-3 border-blue-400 rounded-3xl p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-blue-700/60 pb-3 mb-4">
                    <span className="text-xs font-black uppercase tracking-widest bg-blue-950/90 text-blue-300 px-3 py-1 rounded-full border border-blue-500/50">
                      Tubo EDTA Tampa Roxa • Envio Apoio
                    </span>
                    <button
                      type="button"
                      onClick={() => setTuboAtivo(null)}
                      className="text-blue-300 hover:text-white p-1 text-sm font-bold"
                    >
                      Cancelar ✕
                    </button>
                  </div>

                  {/* IDENTIFICAÇÃO DO PACIENTE */}
                  <div className="mb-4 bg-blue-950/60 p-3.5 rounded-2xl border border-blue-700/40">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-blue-300">
                        Prontuário: {tuboAtivo.prontuario}
                      </span>
                      <span className="text-[11px] font-bold text-blue-300/80 uppercase">
                        Conecta SUS
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1 uppercase leading-tight">
                      {tuboAtivo.nome_paciente}
                    </h2>

                    {/* SELEÇÃO DO MÉDICO SOLICITANTE E URGÊNCIA */}
                    <div className="mt-3 pt-2.5 border-t border-blue-800/80 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-blue-300">
                          <Stethoscope className="w-4 h-4 text-blue-300 shrink-0" />
                          <span className="font-bold">Médico Solicitante:</span>
                        </div>
                        <select
                          value={medicoSelecionado}
                          onChange={(e) => setMedicoSelecionado(e.target.value)}
                          className="bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
                        >
                          {medicosCadastrados.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* CHECKBOX DE URGÊNCIA NO APP DO CELULAR */}
                      <label className="flex items-center gap-2.5 p-2 bg-blue-950/80 border border-rose-500/60 rounded-xl cursor-pointer hover:bg-blue-950 transition select-none">
                        <input
                          type="checkbox"
                          checked={isUrgente}
                          onChange={(e) => setIsUrgente(e.target.checked)}
                          className="w-5 h-5 rounded-md text-rose-600 bg-slate-900 border-rose-400 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-black text-rose-300 flex items-center gap-1.5">
                            🚨 Hemograma de URGÊNCIA
                          </span>
                          <span className="text-[10px] text-blue-200/80 block">
                            Exibe &quot;🚨 URGÊNCIA&quot; no nome do paciente na folha do Apoio e do Lab
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* MENSAGEM VISUAL DE DESTAQUE */}
                  <div className="bg-blue-950/90 border-2 border-blue-300/80 p-4 rounded-2xl mb-5 text-center shadow-inner">
                    <h3 className="text-xl sm:text-2xl font-black text-blue-200 tracking-wide flex items-center justify-center gap-2 uppercase">
                      <span className="text-2xl">📦</span>
                      DIRETO PARA O APOIO
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-blue-100 mt-2 max-w-lg mx-auto">
                      Tubo EDTA integral na grade de envio.
                    </p>
                  </div>

                  {/* BOTÃO VERDE GIGANTE: [ ✓ Colocado na Grade ] */}
                  <button
                    type="button"
                    onClick={confirmarAcaoTubo}
                    disabled={isSyncing}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 text-lg sm:text-xl font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition cursor-pointer"
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                    <span>[ ✓ Colocado na Grade ]</span>
                  </button>
                </div>
              )}

              {/* CASO C: APENAS GLICADA (FUNDO VERDE / BANCADA LOCAL) */}
              {tuboAtivo.tipo_destino === "apenas_glicada" && (
                <div className="bg-emerald-900 border-3 border-emerald-400 rounded-3xl p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-emerald-700/60 pb-3 mb-4">
                    <span className="text-xs font-black uppercase tracking-widest bg-emerald-950/90 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/50">
                      Tubo EDTA Tampa Roxa • Bancada Local
                    </span>
                    <button
                      type="button"
                      onClick={() => setTuboAtivo(null)}
                      className="text-emerald-300 hover:text-white p-1 text-sm font-bold"
                    >
                      Cancelar ✕
                    </button>
                  </div>

                  {/* IDENTIFICAÇÃO DO PACIENTE */}
                  <div className="mb-4 bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-700/40">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-emerald-300">
                        Prontuário: {tuboAtivo.prontuario}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-300/80 uppercase">
                        Conecta SUS
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1 uppercase leading-tight">
                      {tuboAtivo.nome_paciente}
                    </h2>

                    {/* SELEÇÃO DO MÉDICO SOLICITANTE E URGÊNCIA */}
                    <div className="mt-3 pt-2.5 border-t border-emerald-800/80 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                          <Stethoscope className="w-4 h-4 text-emerald-300 shrink-0" />
                          <span className="font-bold">Médico Solicitante:</span>
                        </div>
                        <select
                          value={medicoSelecionado}
                          onChange={(e) => setMedicoSelecionado(e.target.value)}
                          className="bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                        >
                          {medicosCadastrados.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* CHECKBOX DE URGÊNCIA NO APP DO CELULAR */}
                      <label className="flex items-center gap-2.5 p-2 bg-emerald-950/80 border border-rose-500/60 rounded-xl cursor-pointer hover:bg-emerald-950 transition select-none">
                        <input
                          type="checkbox"
                          checked={isUrgente}
                          onChange={(e) => setIsUrgente(e.target.checked)}
                          className="w-5 h-5 rounded-md text-rose-600 bg-slate-900 border-rose-400 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-black text-rose-300 flex items-center gap-1.5">
                            🚨 Hemograma de URGÊNCIA
                          </span>
                          <span className="text-[10px] text-emerald-200/80 block">
                            Exibe &quot;🚨 URGÊNCIA&quot; no nome do paciente na folha do Apoio e do Lab
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* MENSAGEM VISUAL DE DESTAQUE */}
                  <div className="bg-emerald-950/90 border-2 border-emerald-300/80 p-4 rounded-2xl mb-5 text-center shadow-inner">
                    <h3 className="text-xl sm:text-2xl font-black text-emerald-200 tracking-wide flex items-center justify-center gap-2 uppercase">
                      <span className="text-2xl">🟣</span>
                      RETER NA BANCADA
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-emerald-100 mt-2 max-w-lg mx-auto">
                      Tubo fica no laboratório (não vai para o apoio).
                    </p>
                  </div>

                  {/* BOTÃO BRANCO/VERDE: [ ✓ Confirmado ] */}
                  <button
                    type="button"
                    onClick={confirmarAcaoTubo}
                    disabled={isSyncing}
                    className="w-full bg-white hover:bg-slate-100 active:scale-98 text-emerald-950 text-lg sm:text-xl font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition cursor-pointer"
                  >
                    <Check className="w-6 h-6 stroke-[3] text-emerald-700" />
                    <span>[ ✓ Confirmado ]</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LISTA RESUMIDA DOS TUBOS DO DIA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Fila de Tubos EDTA ({itens.length})
              </h2>

              <span className="text-[11px] text-slate-400">
                Data: {dataReferencia ? dataReferencia.split("-").reverse().join("/") : "Hoje"}
              </span>
            </div>

            {itens.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-xs font-semibold">Nenhum tubo EDTA cadastrado na rotina de hoje.</p>
                <p className="text-[11px] mt-1 text-slate-600">
                  Importe a planilha diária do Conecta SUS na aba "Importar Conecta SUS".
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {itens.map((item, idx) => {
                  const jaPronto = item.status === "pronto_grade" || item.colocado_grade;
                  const retido = item.status === "retido_bancada";

                  return (
                    <div
                      key={item.id || item.prontuario || idx}
                      onClick={() => {
                        setTuboAtivo(item);
                        setIsUrgente(Boolean(item.urgencia));
                        setMedicoSelecionado(item.solicitante || medicoPadrao || "Dr(a). Clínico(a) Geral / UBS");
                        if (item.tipo_destino === "hemograma_glicada") tocarSomHemogramaGlicada();
                        else if (item.tipo_destino === "apenas_hemograma") tocarSomApenasHemograma();
                        else tocarSomApenasGlicada();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        item.urgencia
                          ? "bg-rose-950/30 border-rose-700/60 text-rose-100 hover:bg-rose-950/50"
                          : jaPronto
                          ? "bg-emerald-950/40 border-emerald-800/60 text-slate-300 hover:bg-emerald-950/70"
                          : retido
                          ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                          : "bg-slate-950 border-slate-800 text-white hover:border-purple-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-purple-300 w-16 text-center">
                          {item.prontuario}
                        </span>
                        <div>
                          <p className="font-bold uppercase truncate max-w-[160px] sm:max-w-md flex items-center gap-1.5">
                            {item.urgencia && (
                              <span className="bg-rose-600 text-white font-black text-[9px] px-1 py-0.5 rounded tracking-wide border border-rose-700 shrink-0">
                                🚨 URGÊNCIA
                              </span>
                            )}
                            <span className={item.urgencia ? "text-rose-200 font-black" : "text-white"}>
                              {item.nome_paciente}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>
                              {item.tipo_destino === "hemograma_glicada"
                                ? "⚠️ Hemograma + Glicada (Fracionar)"
                                : item.tipo_destino === "apenas_hemograma"
                                ? "📦 Apenas Hemograma (Apoio)"
                                : "🟣 Apenas Glicada (Bancada)"}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-sky-300/80 font-medium truncate max-w-[140px]">
                              {item.solicitante || "Sem médico"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* BOTÃO RÁPIDO PARA ALTERNAR URGÊNCIA */}
                        <button
                          type="button"
                          onClick={(e) => alternarUrgenciaItem(e, item)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black border transition shrink-0 ${
                            item.urgencia
                              ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm"
                              : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border-slate-700"
                          }`}
                          title="Alternar se o hemograma é urgente"
                        >
                          {item.urgencia ? "🚨 URGENTE" : "+ Urgência"}
                        </button>

                        {jaPronto ? (
                          <span className="bg-emerald-900/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-600/40 shrink-0">
                            ✓ Na Grade
                          </span>
                        ) : retido ? (
                          <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-600 shrink-0">
                            🟣 Retido
                          </span>
                        ) : (
                          <span className="bg-purple-950 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-800 shrink-0">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTÃO FIXO/PRINCIPAL: FINALIZAR TRIAGEM & ENVIAR PARA IMPRESSÃO */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleFinalizarEEnviarImpressao}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-base sm:text-lg shadow-xl shadow-purple-600/30 transition cursor-pointer"
            >
              <span>🏁 Finalizar Triagem & Enviar para Impressão</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
              Transmite o sinal para o computador abrir as duas folhas A4 (Controle de Pipetagem Retido + Guia de Remessa do Apoio).
            </p>
          </div>
        </div>
      </div>

      {/* MODAL PARA CADASTRAR E GERENCIAR MÉDICOS SOLICITANTES NO COMPUTADOR */}
      {mostrarModalMedicos && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl text-slate-100 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-950 text-sky-400 rounded-xl border border-sky-800">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Médicos Solicitantes (Caconde)</h3>
                  <p className="text-[11px] text-slate-400">Cadastre médicos da rede para vincular aos tubos e relatórios</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalMedicos(false)}
                className="text-slate-400 hover:text-white p-1 text-base leading-none"
              >
                ✕
              </button>
            </div>

            {/* FORMULÁRIO DE ADIÇÃO DE NOVO MÉDICO */}
            <form onSubmit={handleAdicionarMedico} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ex: Dr. Roberto Carlos (UBS Central)..."
                value={novoMedicoNome}
                onChange={(e) => setNovoMedicoNome(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder:text-slate-500 outline-hidden"
              />
              <button
                type="submit"
                disabled={!novoMedicoNome.trim()}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar</span>
              </button>
            </form>

            {/* LISTA DE MÉDICOS JÁ CADASTRADOS */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 mb-4">
              {medicosCadastrados.map((m) => {
                const ehPadrao = medicoPadrao === m;

                return (
                  <div
                    key={m}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs hover:border-slate-700 transition"
                  >
                    <span className="font-semibold text-slate-200 truncate max-w-[260px]">{m}</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDefinirPadrao(m)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                          ehPadrao
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                        title="Definir como médico padrão nos novos tubos"
                      >
                        {ehPadrao ? "★ Padrão" : "Tornar Padrão"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoverMedico(m)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title="Excluir médico da lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarModalMedicos(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
