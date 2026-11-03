"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { EdtaOcrScanner, DadosPacienteCapturados } from "@/components/EdtaOcrScanner";
import { RelatorioTriagemEdtaPrintView } from "@/components/RelatorioTriagemEdtaPrintView";
import { ModalSelecionarOperador } from "@/components/ModalSelecionarOperador";
import { ItemTriagemEdta, LabConfig, DEFAULT_LAB_CONFIG } from "@/types/urinalise";
import {
  formatarProntuario,
  normalizarProntuario,
  formatarDataNascimento,
  normalizarDigitosData,
  processarMatrizLinhasBancada,
} from "@/lib/extratorBancada";
import {
  obterMedicosCadastrados,
  adicionarMedico,
  removerMedico,
  obterMedicoPadrao,
  definirMedicoPadrao,
  sincronizarMedicosComServidor,
} from "@/lib/medicosStore";
import {
  obterOperadorAtivo,
  definirOperadorAtivo,
  sincronizarOperadoresComServidor,
} from "@/lib/operadoresStore";
import {
  tocarSomHemogramaGlicada,
  tocarSomApenasHemograma,
  tocarSomApenasGlicada,
  tocarSomConfirmado,
  tocarSomSutil,
} from "@/lib/audioFeedback";
import {
  Camera,
  Keyboard,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  X,
  FileSpreadsheet,
  UploadCloud,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  FlaskConical,
  Info,
  Calendar,
  Hash,
  Stethoscope,
  Plus,
  Trash2,
} from "lucide-react";

export default function TriagemEdtaPage() {
  const [itens, setItens] = useState<ItemTriagemEdta[]>([]);
  const [dataReferencia, setDataReferencia] = useState<string>("");
  const [horaEncerramento, setHoraEncerramento] = useState<string>("");
  const [labConfig, setLabConfig] = useState<LabConfig>(DEFAULT_LAB_CONFIG);

  // Modo de Entrada Híbrido: Câmera com OCR contínuo vs Manual
  const [leitorCameraAtivo, setLeitorCameraAtivo] = useState<boolean>(true);
  const [scannerPausado, setScannerPausado] = useState<boolean>(false);

  // Fallback Manual Rápido
  const [manualProntuario, setManualProntuario] = useState<string>("");
  const [manualDataNasc, setManualDataNasc] = useState<string>("");
  const manualProntRef = useRef<HTMLInputElement>(null);

  // Tubo Ativo em Destaque no Card de Ação
  const [tuboAtivo, setTuboAtivo] = useState<ItemTriagemEdta | null>(null);
  const [isUrgente, setIsUrgente] = useState<boolean>(false);

  // Conferência e Ajuste da Data de Nascimento (Destaque Visual p/ Bater o Olho)
  const [dataNascConferencia, setDataNascConferencia] = useState<string>("");
  const [editandoDataNasc, setEditandoDataNasc] = useState<boolean>(false);

  // Controle de Coleta de 2 Tubos EDTA (1 Apoio + 1 VHS Local vs Falta de Tubos)
  const [coletadoDoisTubos, setColetadoDoisTubos] = useState<boolean>(true);

  // Controle de Envio de Hemograma: HOJE vs OUTRO DIA (Retido por alto volume de glicadas)
  const [enviarHemogramaHoje, setEnviarHemogramaHoje] = useState<boolean>(true);
  const [gavetaRetidosAberta, setGavetaRetidosAberta] = useState<boolean>(true);

  // CASO 3: Toast rápido e discreto (1.5 segundos) para folhas sem EDTA
  const [toastSemEdta, setToastSemEdta] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Responsável do Procedimento e Médicos
  const [operadorAtivo, setOperadorAtivo] = useState<string>("");
  const [mostrarModalOperadores, setMostrarModalOperadores] = useState<boolean>(false);
  const [medicosCadastrados, setMedicosCadastrados] = useState<string[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<string>("");
  const [medicoPadrao, setMedicoPadraoState] = useState<string>("");
  const [mostrarModalMedicos, setMostrarModalMedicos] = useState<boolean>(false);
  const [novoMedicoNome, setNovoMedicoNome] = useState<string>("");

  // Feedback e Sincronização
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<{
    titulo: string;
    subtitulo?: string;
  } | null>(null);

  // Input de arquivo para Merge Incremental direto na bancada
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sinal de Impressão Remoto (PC escutando celular na bancada)
  const lastSignalTimeRef = useRef<number>(0);

  // Debounce de Leituras na Folha
  const ultimoProntuarioProcessadoRef = useRef<string>("");
  const ultimoHorarioProcessadoRef = useRef<number>(0);

  // 1. Inicialização
  useEffect(() => {
    document.title = "Triagem EDTA • Hemograma & HbA1c • Laboratório Caconde";
    setDataReferencia(new Date().toISOString().split("T")[0]);

    // Carregar configurações de laboratório
    const savedConfig = localStorage.getItem("urinalise_lab_config");
    if (savedConfig) {
      try {
        setLabConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error(e);
      }
    }

    // Carregar Médicos e Operadores
    const listaMedicos = obterMedicosCadastrados();
    setMedicosCadastrados(listaMedicos);
    const padrao = obterMedicoPadrao();
    setMedicoPadraoState(padrao);

    sincronizarMedicosComServidor().then((dados) => {
      if (dados && Array.isArray(dados.medicos)) {
        setMedicosCadastrados(dados.medicos);
        if (dados.padrao) setMedicoPadraoState(dados.padrao);
      }
    });

    setOperadorAtivo(obterOperadorAtivo());
    sincronizarOperadoresComServidor().then((dados) => {
      if (dados?.ativo) setOperadorAtivo(dados.ativo);
    });

    const handleOperadorUpdate = (e: any) => {
      if (e.detail?.ativo !== undefined) {
        setOperadorAtivo(e.detail.ativo);
      }
    };
    window.addEventListener("operador-atualizado", handleOperadorUpdate);

    carregarDadosEdta();

    // Polling a cada 3.5s para detectar sinal de impressão disparado do celular para o PC
    const pollInterval = setInterval(() => {
      verificarSinalImpressaoRemota();
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("operador-atualizado", handleOperadorUpdate);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

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

          // Resetar sinal no servidor
          await fetch("/api/triagem-edta?reset_print=true");

          // Disparar diálogo de impressão formatado A4
          tocarSomConfirmado();
          setTimeout(() => {
            window.print();
          }, 300);
        }
      }
    } catch (_) {}
  };

  // CONTADORES DO TOPO
  const totalEdta = itens.length;
  const pendentesFracionar = itens.filter(
    (i) => i.tipo_destino === "hemograma_glicada" && !i.fracionado_glicada && i.status !== "retido_envio_posterior"
  ).length;
  const concluidosGrade = itens.filter(
    (i) => (i.status === "pronto_grade" || i.colocado_grade) && i.enviar_hemograma_hoje !== false
  ).length;
  const tubosRetidosLocal = itens.filter(
    (i) => i.status === "retido_envio_posterior" || i.status === "retido_bancada" || i.enviar_hemograma_hoje === false
  ).length;

  // Formatar Máscara de Data de Nascimento (DD/MM/AAAA) enquanto o usuário digita
  const aplicarMascaraData = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, "").slice(0, 8);
    if (apenasDigitos.length <= 2) return apenasDigitos;
    if (apenasDigitos.length <= 4) {
      return `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2)}`;
    }
    return `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2, 4)}/${apenasDigitos.slice(4)}`;
  };

  // BUSCA INTELIGENTE NA BASE DE EDTA DO DIA
  const buscarPacienteNaBase = useCallback(
    (prontuarioBruto: string, dataNascBruta?: string): ItemTriagemEdta | null => {
      const pNorm = normalizarProntuario(prontuarioBruto).toLowerCase();
      const pOriginal = prontuarioBruto.trim().toLowerCase();
      const dDigitos = normalizarDigitosData(dataNascBruta || "");

      // Procura primeiro pelo casamento exato de Prontuário Normalizado
      const encontrado = itens.find((item) => {
        const itemPNorm = (
          item.prontuario_normalizado || normalizarProntuario(item.prontuario)
        ).toLowerCase();
        const itemPOriginal = (item.prontuario || "").toLowerCase();

        const matchPront =
          itemPNorm === pNorm ||
          itemPOriginal === pOriginal ||
          itemPOriginal.replace(/^0+/, "") === pNorm;

        if (!matchPront) return false;

        // Se a data de nascimento foi fornecida com 8 dígitos e o registro tem data
        if (dDigitos && dDigitos.length === 8 && item.data_nascimento_digitos) {
          return item.data_nascimento_digitos === dDigitos;
        }

        return true;
      });

      return encontrado || null;
    },
    [itens]
  );

  // Exibir Toast flutuante rápido e discreto (1.5 segundos) para CASO 3 (Sem EDTA)
  const exibirToastSemEdta = useCallback((mensagem: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastSemEdta(mensagem);
    tocarSomSutil();
    toastTimeoutRef.current = setTimeout(() => {
      setToastSemEdta(null);
    }, 1500);
  }, []);

  // PROCESSAR LEITURA CONTÍNUA DA CÂMERA (OCR) OU FALLBACK MANUAL
  const processarIdentificacaoPaciente = useCallback(
    (prontuarioBruto: string, dataNascBruta?: string) => {
      const prontLimpo = prontuarioBruto.trim();
      if (!prontLimpo) return;

      const prontNorm = normalizarProntuario(prontLimpo);
      const agora = Date.now();

      // Debounce de 3 segundos para a mesma folha sob a lente
      if (
        prontNorm === ultimoProntuarioProcessadoRef.current &&
        agora - ultimoHorarioProcessadoRef.current < 3000
      ) {
        return;
      }

      ultimoProntuarioProcessadoRef.current = prontNorm;
      ultimoHorarioProcessadoRef.current = agora;

      const encontrado = buscarPacienteNaBase(prontLimpo, dataNascBruta);

      if (encontrado) {
        // Pausa momentânea na câmera para foco na ação do tubo
        setScannerPausado(true);
        setTuboAtivo(encontrado);
        setIsUrgente(Boolean(encontrado.urgencia));
        setToastSemEdta(null);

        // Se o tubo estava retido de dia anterior, pré-seleciona envio HOJE para liberação imediata
        if (encontrado.status === "retido_envio_posterior") {
          setEnviarHemogramaHoje(true);
        } else {
          setEnviarHemogramaHoje(encontrado.enviar_hemograma_hoje !== false);
        }

        // Data de nascimento capturada via OCR/manual ou já existente na planilha
        const dataNascDetectada = formatarDataNascimento(
          dataNascBruta || encontrado.data_nascimento || ""
        );
        setDataNascConferencia(dataNascDetectada);
        setEditandoDataNasc(false);

        // Se o paciente tem VHS ou se já foi registrado status de 2 tubos
        if (encontrado.tem_vhs) {
          setColetadoDoisTubos(encontrado.coletado_dois_tubos !== false);
        } else {
          setColetadoDoisTubos(Boolean(encontrado.coletado_dois_tubos));
        }

        // Seleção de médico solicitante
        const medExistente = encontrado.solicitante;
        if (
          medExistente &&
          !medExistente.includes("Conecta") &&
          !medExistente.includes("UBS") &&
          medExistente !== "Dr(a). Clínico(a) Geral / UBS"
        ) {
          setMedicoSelecionado(medExistente);
        } else if (medicoPadrao) {
          setMedicoSelecionado(medicoPadrao);
        } else if (medicosCadastrados.length > 0) {
          setMedicoSelecionado(medicosCadastrados[0]);
        } else {
          setMedicoSelecionado("");
        }

        // FEEDBACK SONORO IMEDIATO CONFORME O CASO
        if (
          encontrado.tipo_destino === "hemograma_glicada" ||
          (encontrado.tem_hemograma && encontrado.tem_glicada)
        ) {
          // CASO 1: Beep sonoro duplo (agudo)
          tocarSomHemogramaGlicada();
        } else if (
          encontrado.tipo_destino === "apenas_hemograma" ||
          (encontrado.tem_hemograma && !encontrado.tem_glicada)
        ) {
          // CASO 2: Beep sonoro simples
          tocarSomApenasHemograma();
        } else if (encontrado.tipo_destino === "apenas_glicada") {
          tocarSomApenasGlicada();
        }
      } else {
        // CASO 3: FOLHA SEM EDTA / NÃO LOCALIZADA (Urina, Fezes, Bioquímica)
        // NÃO exibir alert(), NÃO abrir pop-up e NÃO travar o scanner.
        // O scanner CONTINUA rodando sem parar para a próxima folha da pilha!
        exibirToastSemEdta("ℹ️ Sem exames de EDTA (Avançar folha)");
      }
    },
    [buscarPacienteNaBase, exibirToastSemEdta, medicoPadrao, medicosCadastrados]
  );

  // Callback do OCR da Câmera
  const handleOcrDetectado = useCallback(
    (dados: DadosPacienteCapturados) => {
      processarIdentificacaoPaciente(dados.prontuario, dados.dataNascimento);
    },
    [processarIdentificacaoPaciente]
  );

  // Submissão do Fallback Manual
  const handleBuscarManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualProntuario.trim()) return;
    processarIdentificacaoPaciente(manualProntuario, manualDataNasc);
  };

  // CONFIRMAÇÃO DO CARD DE AÇÃO (CASO 1 / CASO 2 / BANCADA / RETIDO)
  const confirmarAcaoTubo = async () => {
    if (!tuboAtivo) return;

    tocarSomConfirmado();
    setIsSyncing(true);

    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const hojeIso = new Date().toISOString().split("T")[0];

    let novoStatus: "pronto_grade" | "retido_bancada" | "retido_envio_posterior" = "pronto_grade";
    let fracionado = tuboAtivo.fracionado_glicada;
    let colocado = true;
    let vaiEnviarHoje = enviarHemogramaHoje;
    let dataLiberacao: string | undefined = undefined;

    // Se marcado para enviar em outro dia (alto volume de HbA1c)
    if (!enviarHemogramaHoje) {
      novoStatus = "retido_envio_posterior";
      colocado = false;
      fracionado = false;
      vaiEnviarHoje = false;
      dataLiberacao = undefined;
    } else if (
      tuboAtivo.tipo_destino === "hemograma_glicada" ||
      (tuboAtivo.tem_hemograma && tuboAtivo.tem_glicada) ||
      tuboAtivo.status === "retido_envio_posterior"
    ) {
      novoStatus = "pronto_grade";
      fracionado = true;
      colocado = true;
      vaiEnviarHoje = true;
      dataLiberacao = hojeIso;
    } else if (tuboAtivo.tipo_destino === "apenas_hemograma") {
      novoStatus = "pronto_grade";
      colocado = true;
      vaiEnviarHoje = true;
      dataLiberacao = hojeIso;
    } else if (tuboAtivo.tipo_destino === "apenas_glicada") {
      novoStatus = "retido_bancada";
      colocado = false;
      vaiEnviarHoje = false;
    }

    const medicoFinal =
      medicoSelecionado.trim() || tuboAtivo.solicitante || "Dr(a). Clínico(a) Geral / UBS";

    const dataNascFinal = (dataNascConferencia || tuboAtivo.data_nascimento || "").trim();
    const dataNascDigitos = normalizarDigitosData(dataNascFinal);

    const itemAtualizado: ItemTriagemEdta = {
      ...tuboAtivo,
      data_nascimento: dataNascFinal,
      data_nascimento_digitos: dataNascDigitos,
      status: novoStatus,
      fracionado_glicada: fracionado,
      colocado_grade: colocado,
      horario_bipado: agora,
      solicitante: medicoFinal,
      urgencia: isUrgente,
      coletado_dois_tubos: coletadoDoisTubos,
      qtd_tubos_coletados: coletadoDoisTubos ? 2 : 1,
      enviar_hemograma_hoje: vaiEnviarHoje,
      data_liberacao_apoio: dataLiberacao,
    };

    // Atualização otimista no estado local
    setItens((prev) =>
      prev.map((i) =>
        i.prontuario === tuboAtivo.prontuario ||
        (i.prontuario_normalizado &&
          i.prontuario_normalizado === tuboAtivo.prontuario_normalizado)
          ? itemAtualizado
          : i
      )
    );

    // Persistir no backend
    try {
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_item",
          prontuario: tuboAtivo.prontuario,
          updates: {
            data_nascimento: dataNascFinal,
            data_nascimento_digitos: dataNascDigitos,
            status: novoStatus,
            fracionado_glicada: fracionado,
            colocado_grade: colocado,
            horario_bipado: agora,
            solicitante: medicoFinal,
            urgencia: isUrgente,
            coletado_dois_tubos: coletadoDoisTubos,
            qtd_tubos_coletados: coletadoDoisTubos ? 2 : 1,
            enviar_hemograma_hoje: vaiEnviarHoje,
            data_liberacao_apoio: dataLiberacao,
          },
        }),
      });

      if (!vaiEnviarHoje) {
        setMensagemSucesso({
          titulo: `📦 Tubo de ${tuboAtivo.nome_paciente} retido na gradinha local!`,
          subtitulo: `Fazer dosagem de HbA1c hoje. Tubo integral retido para envio amanhã (NÃO sai no relatório de hoje).`,
        });
      } else {
        setMensagemSucesso({
          titulo: `✓ Tubo de ${tuboAtivo.nome_paciente} confirmado na Grade do Apoio!`,
          subtitulo: `Status: Pronto na Grade • DN: ${dataNascFinal || "N/A"} • ${
            coletadoDoisTubos ? "2 Tubos (VHS/Apoio)" : "1 Tubo"
          }`,
        });
      }
      setTimeout(() => setMensagemSucesso(null), 3500);
    } catch (e) {
      console.warn("Aviso ao salvar status no servidor:", e);
    } finally {
      setIsSyncing(false);
      // Limpa o card e reativa a câmera instantaneamente
      setTuboAtivo(null);
      setDataNascConferencia("");
      setEditandoDataNasc(false);
      setManualProntuario("");
      setManualDataNasc("");
      setScannerPausado(false);
      if (manualProntRef.current) {
        manualProntRef.current.focus();
      }
    }
  };

  // LIBERAR TUBO RETIDO DIRETAMENTE PARA O APOIO DE HOJE (1 CLIQUE)
  const liberarTuboRetidoHoje = async (itemRetido: ItemTriagemEdta) => {
    tocarSomConfirmado();
    setIsSyncing(true);

    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const hojeIso = new Date().toISOString().split("T")[0];

    const itemAtualizado: ItemTriagemEdta = {
      ...itemRetido,
      status: "pronto_grade",
      colocado_grade: true,
      enviar_hemograma_hoje: true,
      data_liberacao_apoio: hojeIso,
      horario_bipado: agora,
    };

    setItens((prev) =>
      prev.map((i) =>
        i.prontuario === itemRetido.prontuario ||
        (i.prontuario_normalizado &&
          i.prontuario_normalizado === itemRetido.prontuario_normalizado)
          ? itemAtualizado
          : i
      )
    );

    try {
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_item",
          prontuario: itemRetido.prontuario,
          updates: {
            status: "pronto_grade",
            colocado_grade: true,
            enviar_hemograma_hoje: true,
            data_liberacao_apoio: hojeIso,
            horario_bipado: agora,
          },
        }),
      });

      setMensagemSucesso({
        titulo: `🚀 Tubo de ${itemRetido.nome_paciente} liberado para a Grade de Hoje!`,
        subtitulo: `Paciente incluído com sucesso no relatório de faturamento/apoio.`,
      });
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (e) {
      console.warn("Aviso ao liberar tubo retido:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // UPLOAD INCREMENTAL DA PLANILHA DO DIA (MERGE / UPSERT)
  const handleUploadPlanilhaIncremental = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMensagemSucesso(null);

    const isPdf = file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/extrair-arquivo", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.ok) {
          await carregarDadosEdta(true);
          const msg = data.resultadoMergeEdta?.message || "Lista atualizada com sucesso!";
          setMensagemSucesso({
            titulo: msg,
            subtitulo: `Arquivo "${file.name}" mesclado com sucesso`,
          });
          tocarSomConfirmado();
        }
      } catch (err: any) {
        console.error("Erro ao enviar PDF:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

            const res = processarMatrizLinhasBancada(rows, false);

            if (res.pacientesEdta && res.pacientesEdta.length > 0) {
              const resApi = await fetch("/api/triagem-edta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itens: res.pacientesEdta, substituir: false }),
              });
              const data = await resApi.json();
              if (data.ok) {
                if (Array.isArray(data.itens)) {
                  setItens(data.itens);
                } else {
                  await carregarDadosEdta(true);
                }
                setMensagemSucesso({
                  titulo: data.message || "Lista atualizada com sucesso!",
                  subtitulo: `Planilha "${file.name}" • Total: ${data.total} tubos`,
                });
                tocarSomConfirmado();
              }
            } else {
              setMensagemSucesso({
                titulo: "Planilha processada, mas nenhum exame EDTA identificado nela.",
              });
            }
          } catch (err: any) {
            console.error("Erro ao processar planilha:", err);
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsBinaryString(file);
      } catch (err: any) {
        setIsLoading(false);
      }
    }
    e.target.value = "";
  };

  // FINALIZAÇÃO E IMPRESSÃO PARA O FATURAMENTO DA TARDE (Requisito 5)
  const handleFinalizarEEnviarImpressao = async () => {
    const horaAgora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setHoraEncerramento(horaAgora);

    try {
      // Disparar sinal para o computador da bancada
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "solicitar_impressao",
          horaEncerramento: horaAgora,
        }),
      });

      tocarSomConfirmado();
      setMensagemSucesso({
        titulo: `🏁 Triagem finalizada às ${horaAgora}!`,
        subtitulo: "Sinal transmitido para a tela do computador abrir a impressão A4.",
      });

      // Abre diálogo de impressão no dispositivo atual se acionado nele
      setTimeout(() => {
        window.print();
      }, 350);
    } catch (err) {
      console.error("Erro ao emitir sinal de impressão:", err);
    }
  };

  // Gerenciamento de Médicos
  const handleAdicionarMedico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMedicoNome.trim()) return;
    const atualizados = adicionarMedico(novoMedicoNome.trim());
    setMedicosCadastrados(atualizados);
    setNovoMedicoNome("");
  };

  const handleRemoverMedico = (nome: string) => {
    const atualizados = removerMedico(nome);
    setMedicosCadastrados(atualizados);
    if (medicoPadrao === nome) {
      definirMedicoPadrao("");
      setMedicoPadraoState("");
    }
  };

  // BLOCO DE CONFERÊNCIA EM DESTAQUE (DATA DE NASCIMENTO MAIORZINHA & SELEÇÃO DE TUBOS VHS)
  const renderBlocoConferenciaPaciente = (tubo: ItemTriagemEdta) => (
    <div className="space-y-3">
      {/* IDENTIFICAÇÃO DO PACIENTE */}
      <div className="bg-black/25 border border-white/20 rounded-2xl p-3.5 space-y-1">
        <p className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
          {tubo.nome_paciente}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/80">
          <span>
            Prontuário de busca: <strong className="text-white font-mono font-bold">#{tubo.prontuario}</strong>
          </span>
          {tubo.urgencia && (
            <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
              Urgência
            </span>
          )}
        </div>
      </div>

      {/* CONFERÊNCIA VISUAL DA DATA DE NASCIMENTO (EM DESTAQUE PARA BATER O OLHO) */}
      <div className="bg-black/35 border-2 border-amber-400 rounded-2xl p-3.5 shadow-md space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-300" />
            Data de Nascimento (Identificador Apoio)
          </span>
          <button
            type="button"
            onClick={() => setEditandoDataNasc(!editandoDataNasc)}
            className="text-[11px] font-bold text-amber-200 hover:text-white underline cursor-pointer bg-white/10 px-2 py-0.5 rounded"
          >
            {editandoDataNasc ? "Cancelar" : "✏️ Ajustar data"}
          </button>
        </div>

        {editandoDataNasc ? (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={dataNascConferencia}
              onChange={(e) => setDataNascConferencia(aplicarMascaraData(e.target.value))}
              placeholder="DD/MM/AAAA"
              className="flex-1 px-3 py-2 bg-white text-slate-900 rounded-xl text-xl font-mono font-black border-2 border-amber-400 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setEditandoDataNasc(false)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300 drop-shadow">
              {dataNascConferencia || tubo.data_nascimento || "NÃO INFORMADA"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 bg-amber-500/30 px-2.5 py-1 rounded-md border border-amber-400/40">
              Confira no Papel
            </span>
          </div>
        )}
      </div>

      {/* ALERTA SE O PACIENTE FOR UM TUBO RETIDO DE DIA ANTERIOR */}
      {tubo.status === "retido_envio_posterior" && (
        <div className="bg-amber-400 text-slate-950 rounded-2xl p-3 border-2 border-amber-200 shadow-md">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950 shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </span>
            <div>
              <p className="font-black text-xs sm:text-sm uppercase tracking-tight">
                🚨 Tubo Retido de Dia Anterior (Glicada Já Dosada)
              </p>
              <p className="text-[11px] font-semibold text-slate-900 leading-tight">
                Amostra retida na gradinha local pronta para ser despachada para a grade de hoje!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICAÇÃO DE VHS E CAIXINHA DE SELEÇÃO DE TUBOS */}
      <div
        className={`rounded-2xl p-3 border transition-colors ${
          tubo.tem_vhs ? "bg-amber-500/25 border-amber-300" : "bg-white/10 border-white/20"
        }`}
      >
        {tubo.tem_vhs && (
          <div className="flex items-center gap-1.5 mb-2 text-amber-300 font-black text-xs uppercase tracking-tight">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>⚡ Exame de VHS Solicitado (Bancada Local)</span>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={coletadoDoisTubos}
            onChange={(e) => setColetadoDoisTubos(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-2 border-amber-300 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-400 shrink-0"
          />
          <div className="text-xs leading-snug">
            <span className="font-black text-white block text-xs sm:text-sm">
              {coletadoDoisTubos
                ? "✓ Coletado 2 tubos EDTA (1 Apoio + 1 VHS Local)"
                : "⚠️ Coletado apenas 1 tubo EDTA (Compartilhado por falta de tubos)"}
            </span>
            <span className="text-[11px] text-white/80 block mt-0.5 font-medium">
              {coletadoDoisTubos
                ? "Rotina padrão: 1 tubo integral para a grade do apoio e 1 tubo secundário para dosagem de VHS."
                : "Falta de tubos: Coletado tubo único. Alerta registrado para o laboratório."}
            </span>
          </div>
        </label>
      </div>

      {/* CONTROLE DE ENVIO DO HEMOGRAMA: HOJE vs OUTRO DIA (ALTO VOLUME DE GLICADAS) */}
      {(tubo.tem_glicada ||
        tubo.tipo_destino === "hemograma_glicada" ||
        tubo.status === "retido_envio_posterior") && (
        <div
          className={`rounded-2xl p-3.5 border-2 transition-all shadow-md ${
            enviarHemogramaHoje
              ? "bg-emerald-950/40 border-emerald-400/80"
              : "bg-amber-950/50 border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                enviarHemogramaHoje ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              Destino do Tubo Original do Hemograma
            </span>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                enviarHemogramaHoje
                  ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/40"
                  : "bg-amber-400/20 text-amber-200 border-amber-400/40"
              }`}
            >
              {enviarHemogramaHoje ? "Grade de Hoje" : "Reter na Gradinha"}
            </span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enviarHemogramaHoje}
              onChange={(e) => setEnviarHemogramaHoje(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-2 border-emerald-300 text-emerald-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-400 shrink-0"
            />
            <div className="text-xs leading-snug">
              <span className="font-black text-white block text-xs sm:text-sm">
                {enviarHemogramaHoje
                  ? "✓ Enviar Hemograma HOJE p/ Apoio (Entra no relatório de hoje)"
                  : "📦 RETER TUBO na gradinha local (Enviar Hemograma no OUTRO DIA)"}
              </span>
              <span className="text-[11px] text-white/80 block mt-1 font-medium leading-relaxed">
                {enviarHemogramaHoje
                  ? "Rotina regular: Fraciona 500µL para bancada e coloca tubo original na grade do Apoio de hoje."
                  : "⚠️ Muito volume de glicadas: Faz a HbA1c hoje e guarda o tubo integral na gradinha para enviar amanhã. O paciente NÃO sairá no relatório de remessa de hoje!"}
              </span>
            </div>
          </label>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. VISUALIZAÇÃO DE IMPRESSÃO A4 (@media print)                            */}
      {/* ========================================================================= */}
      <RelatorioTriagemEdtaPrintView
        itens={itens}
        dataReferencia={dataReferencia}
        horaEncerramento={horaEncerramento}
        labConfig={labConfig}
        responsavelNome={operadorAtivo}
      />

      {/* ========================================================================= */}
      {/* 2. MODAIS DE OPERADOR E MÉDICO                                           */}
      {/* ========================================================================= */}
      <ModalSelecionarOperador
        aberto={mostrarModalOperadores}
        onFechar={() => setMostrarModalOperadores(false)}
      />

      {mostrarModalMedicos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900 text-sm">Médicos Solicitantes</h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalMedicos(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdicionarMedico} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Dr(a). Nome do Médico"
                value={novoMedicoNome}
                onChange={(e) => setNovoMedicoNome(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-purple-600"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-4 h-4" /> Cadastrar
              </button>
            </form>

            <div className="mt-3 max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {medicosCadastrados.map((medico) => (
                <div key={medico} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <span className="font-bold text-slate-800">{medico}</span>
                  <div className="flex items-center gap-2">
                    {medicoPadrao === medico ? (
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                        Padrão
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          definirMedicoPadrao(medico);
                          setMedicoPadraoState(medico);
                        }}
                        className="text-[11px] font-bold text-purple-600 hover:underline"
                      >
                        Tornar padrão
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoverMedico(medico)}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded-md"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarModalMedicos(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INTERFACE PRINCIPAL DA ABA "TRIAGEM EDTA"                             */}
      {/* ========================================================================= */}
      <div className="min-h-screen bg-slate-100 pb-28 print:hidden">
        {/* TOPO: SELETOR DE ABAS PRINCIPAIS DO PWA (URINÁLISE vs TRIAGEM EDTA) */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 sticky top-0 z-30 shadow-xs">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
            {/* ABAS TÁTEIS NO TOPO */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl w-full max-w-sm border border-slate-200/80">
              <Link
                href="/"
                className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition text-center"
              >
                <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
                <span>Urinálise</span>
              </Link>
              <div className="py-1.5 px-3 rounded-lg text-xs font-black bg-purple-700 text-white shadow-xs flex items-center justify-center gap-1.5 text-center">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Triagem EDTA</span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO TOPO */}
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleUploadPlanilhaIncremental}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                title="Subir nova planilha ou atualização de atrasados do dia (Merge / Upsert)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Nova Planilha (Merge)</span>
                <span className="sm:hidden">+ Planilha</span>
              </button>

              <button
                type="button"
                onClick={() => setMostrarModalOperadores(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition"
              >
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span className="truncate max-w-[120px]">{operadorAtivo || "Operador"}</span>
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto p-3 sm:p-4 space-y-3.5">
          {/* CONTADORES NO TOPO: [Total EDTA], [Pendentes Fracionar], [Concluídos na Grade] e [Retidos na Gradinha] */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-2xs text-center">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-tight block">
                Total EDTA
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {totalEdta}
              </span>
            </div>

            <div className="bg-purple-50 rounded-2xl p-2.5 sm:p-3 border border-purple-200 shadow-2xs text-center">
              <span className="text-[10px] sm:text-[11px] font-black text-purple-700 uppercase tracking-tight block">
                Pendentes Fracionar
              </span>
              <span className="text-xl sm:text-2xl font-black text-purple-900 leading-tight">
                {pendentesFracionar}
              </span>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-2.5 sm:p-3 border border-emerald-200 shadow-2xs text-center">
              <span className="text-[10px] sm:text-[11px] font-black text-emerald-700 uppercase tracking-tight block">
                Concluídos na Grade
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-900 leading-tight">
                {concluidosGrade}
              </span>
            </div>

            <div
              className={`rounded-2xl p-2.5 sm:p-3 border shadow-2xs text-center transition-all ${
                tubosRetidosLocal > 0
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/40"
                  : "bg-slate-50 border-slate-200 opacity-75"
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-black text-amber-800 uppercase tracking-tight block">
                Retidos Gradinha
              </span>
              <span
                className={`text-xl sm:text-2xl font-black leading-tight ${
                  tubosRetidosLocal > 0 ? "text-amber-900" : "text-slate-600"
                }`}
              >
                {tubosRetidosLocal}
              </span>
            </div>
          </div>

          {/* CASO 3: TOAST / BANNER FLUTUANTE RÁPIDO E DISCRETO (1.5s) */}
          {toastSemEdta && (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
              <div className="bg-slate-800/95 text-slate-200 border border-slate-600 px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 backdrop-blur-xs">
                <Info className="w-4 h-4 text-slate-400" />
                <span>{toastSemEdta}</span>
              </div>
            </div>
          )}

          {/* FEEDBACK VISUAL INFORMATIVO DO MERGE / UPSERT */}
          {mensagemSucesso && (
            <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                </span>
                <div>
                  <p className="font-black text-xs sm:text-sm text-white leading-tight">
                    {mensagemSucesso.titulo}
                  </p>
                  {mensagemSucesso.subtitulo && (
                    <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                      {mensagemSucesso.subtitulo}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMensagemSucesso(null)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FALLBACK MANUAL RÁPIDO NO TOPO: [Prontuário] e [Data de Nascimento] */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-700 flex items-center gap-1.5 uppercase text-[10.5px]">
                <Keyboard className="w-3.5 h-3.5 text-purple-600" />
                Busca Rápida de Folha / Tubo
              </span>
              <button
                type="button"
                onClick={() => setLeitorCameraAtivo(!leitorCameraAtivo)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border transition flex items-center gap-1 ${
                  leitorCameraAtivo
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <Camera className="w-3 h-3" />
                {leitorCameraAtivo ? "Câmera Ativa" : "Câmera Pausada"}
              </button>
            </div>

            <form onSubmit={handleBuscarManual} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Campo Prontuário */}
              <div className="sm:col-span-5 relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={manualProntRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Prontuário (ex: 24087)"
                  value={manualProntuario}
                  onChange={(e) => {
                    const limpo = e.target.value.replace(/^['"]+|['"]+$/g, "");
                    setManualProntuario(limpo);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Campo Data de Nascimento com Máscara DD/MM/AAAA */}
              <div className="sm:col-span-4 relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nascimento (DD/MM/AAAA)"
                  value={manualDataNasc}
                  maxLength={10}
                  onChange={(e) => {
                    const comMascara = aplicarMascaraData(e.target.value);
                    setManualDataNasc(comMascara);
                    // Se digitou os 8 dígitos (10 caracteres) e já há prontuário, busca automaticamente
                    if (comMascara.length === 10 && manualProntuario.trim()) {
                      processarIdentificacaoPaciente(manualProntuario, comMascara);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Botão Buscar */}
              <button
                type="submit"
                disabled={!manualProntuario.trim()}
                className="sm:col-span-3 py-2 px-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Localizar</span>
              </button>
            </form>
          </div>

          {/* LEITOR CONTÍNUO DE CÂMERA (OCR NA FOLHA DE AGENDAMENTO) */}
          {leitorCameraAtivo && (
            <EdtaOcrScanner
              ativo={leitorCameraAtivo}
              pausado={scannerPausado || Boolean(tuboAtivo)}
              onDetectarPaciente={handleOcrDetectado}
            />
          )}

          {/* ======================================================================= */}
          {/* CARDS VIBRANTES DE AÇÃO CONFORME O CASO DO PACIENTE                     */}
          {/* ======================================================================= */}

          {/* CASO 1: HEMOGRAMA + GLICADA (HbA1c) — FUNDO ROXO VIBRANTE */}
          {tuboAtivo &&
            (tuboAtivo.tipo_destino === "hemograma_glicada" ||
              (tuboAtivo.tem_hemograma && tuboAtivo.tem_glicada)) && (
              <div className="bg-purple-700 text-white rounded-3xl p-5 shadow-2xl border-4 border-purple-400 animate-in zoom-in-95 duration-150 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-900/60 border border-purple-400/50">
                    <AlertTriangle className="w-7 h-7 text-amber-300 animate-bounce" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight">
                      ⚠️ TEM GLICADA (HbA1c) — FRACIONAR 500 µL
                    </h2>
                    <p className="text-xs text-purple-200 font-semibold">
                      Amostra com dupla destinação: Alíquota local + Tubo integral ao apoio
                    </p>
                  </div>
                </div>

                {/* BLOCO DE CONFERÊNCIA: DATA DE NASCIMENTO EM DESTAQUE E MARCAÇÃO DE 2 TUBOS */}
                {renderBlocoConferenciaPaciente(tuboAtivo)}

                <div
                  className={`border rounded-xl p-3 text-xs transition-colors ${
                    !enviarHemogramaHoje
                      ? "bg-amber-900/60 border-amber-400 text-amber-100"
                      : "bg-purple-800/80 border-purple-400/40 text-purple-100"
                  }`}
                >
                  <p className="font-bold text-white mb-0.5">
                    {!enviarHemogramaHoje
                      ? "⚠️ Ação Operacional (Tubo Retido p/ Amanhã):"
                      : tuboAtivo.status === "retido_envio_posterior"
                      ? "✓ Ação Operacional (Liberação de Retido):"
                      : "Ação Operacional:"}
                  </p>
                  <p className="leading-relaxed">
                    {!enviarHemogramaHoje ? (
                      <span>
                        Fazer dosagem de HbA1c hoje na bancada local e <strong>reter o tubo integral na gradinha</strong> para despachar o hemograma na van de amanhã. <em>Este paciente NÃO sairá no relatório impresso de hoje.</em>
                      </span>
                    ) : tuboAtivo.status === "retido_envio_posterior" ? (
                      <span>
                        Amostra já teve HbA1c dosada anteriormente. Colocar agora o <strong>tubo original na grade do Apoio de hoje</strong> para seguir na van desta tarde.
                      </span>
                    ) : (
                      <span>
                        Pipetar alíquota de <strong>500 µL</strong> no microtubo local e separar o tubo
                        original para a grade do Apoio de hoje.
                      </span>
                    )}
                  </p>
                </div>

                {/* SELEÇÃO DO MÉDICO SOLICITANTE */}
                <div className="bg-purple-900/60 p-2.5 rounded-xl border border-purple-500/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-purple-200 truncate">
                    <Stethoscope className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                    <span className="truncate">Médico: {medicoSelecionado || "Não selecionado"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarModalMedicos(true)}
                    className="text-[11px] font-bold bg-white text-purple-900 px-2 py-0.5 rounded-md shrink-0 shadow-2xs hover:bg-purple-50"
                  >
                    Alterar
                  </button>
                </div>

                {/* BOTÃO DE CONFIRMAÇÃO DINÂMICO CONFORME A ESCOLHA DE ENVIO */}
                {!enviarHemogramaHoje ? (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={confirmarAcaoTubo}
                    className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer border-2 border-amber-300"
                  >
                    <Clock className="w-6 h-6 stroke-[2.5]" />
                    <span>[ 📦 Tubo Retido na Gradinha (Mandar Outro Dia) ]</span>
                  </button>
                ) : tuboAtivo.status === "retido_envio_posterior" ? (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={confirmarAcaoTubo}
                    className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                    <span>[ 🚀 Liberar Tubo Retido p/ Apoio de Hoje ]</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={confirmarAcaoTubo}
                    className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                    <span>[ ✓ Fracionado & Tubo na Grade de Hoje ]</span>
                  </button>
                )}
              </div>
            )}

          {/* CASO 2: APENAS HEMOGRAMA (Sem Glicada) — FUNDO AZUL VIBRANTE */}
          {tuboAtivo &&
            (tuboAtivo.tipo_destino === "apenas_hemograma" ||
              (tuboAtivo.tem_hemograma && !tuboAtivo.tem_glicada)) && (
              <div className="bg-blue-700 text-white rounded-3xl p-5 shadow-2xl border-4 border-blue-400 animate-in zoom-in-95 duration-150 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-900/60 border border-blue-400/50">
                    <CheckCircle2 className="w-7 h-7 text-sky-300" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight">
                      📦 APENAS HEMOGRAMA — DIRETO PRO APOIO
                    </h2>
                    <p className="text-xs text-blue-200 font-semibold">
                      Não necessita de pipetagem local • Envio integral
                    </p>
                  </div>
                </div>

                {/* BLOCO DE CONFERÊNCIA: DATA DE NASCIMENTO EM DESTAQUE E MARCAÇÃO DE 2 TUBOS */}
                {renderBlocoConferenciaPaciente(tuboAtivo)}

                <div className="bg-blue-800/80 border border-blue-400/40 rounded-xl p-3 text-xs text-blue-100">
                  <p className="font-bold text-white mb-0.5">Ação Operacional:</p>
                  <p className="leading-relaxed">Colocar tubo integral na grade do Apoio.</p>
                </div>

                {/* SELEÇÃO DO MÉDICO SOLICITANTE */}
                <div className="bg-blue-900/60 p-2.5 rounded-xl border border-blue-500/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-blue-200 truncate">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    <span className="truncate">Médico: {medicoSelecionado || "Não selecionado"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarModalMedicos(true)}
                    className="text-[11px] font-bold bg-white text-blue-900 px-2 py-0.5 rounded-md shrink-0 shadow-2xs hover:bg-blue-50"
                  >
                    Alterar
                  </button>
                </div>

                {/* BOTÃO VERDE GRANDE: [ ✓ Tubo na Grade do Apoio ] */}
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={confirmarAcaoTubo}
                  className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>[ ✓ Tubo na Grade do Apoio ]</span>
                </button>
              </div>
            )}

          {/* CASO EXTRA: APENAS GLICADA (Bancada Local) */}
          {tuboAtivo && tuboAtivo.tipo_destino === "apenas_glicada" && (
            <div className="bg-amber-600 text-white rounded-3xl p-5 shadow-2xl border-4 border-amber-300 animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-800/60 border border-amber-300/50">
                  <FlaskConical className="w-7 h-7 text-amber-200" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight">
                    🧪 APENAS GLICADA (HbA1c) — BANCADA LOCAL
                  </h2>
                  <p className="text-xs text-amber-100 font-semibold">
                    Tubo não vai ao apoio • Dosagem interna
                  </p>
                </div>
              </div>

              {/* BLOCO DE CONFERÊNCIA: DATA DE NASCIMENTO EM DESTAQUE E MARCAÇÃO DE 2 TUBOS */}
              {renderBlocoConferenciaPaciente(tuboAtivo)}

              <div className="bg-amber-700/80 border border-amber-400/40 rounded-xl p-3 text-xs text-amber-100">
                <p className="font-bold text-white mb-0.5">Ação Operacional:</p>
                <p className="leading-relaxed">
                  Manter tubo integral na bancada local para dosagem de HbA1c.
                </p>
              </div>

              <button
                type="button"
                disabled={isSyncing}
                onClick={confirmarAcaoTubo}
                className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>[ ✓ Tubo na Bancada Local ]</span>
              </button>
            </div>
          )}

          {/* ======================================================================= */}
          {/* GAVETA / SEÇÃO: TUBOS RETIDOS NA GRADINHA LOCAL (ENVIO POSTERIOR)      */}
          {/* ======================================================================= */}
          {itens.some(
            (i) =>
              i.status === "retido_envio_posterior" ||
              (i.enviar_hemograma_hoje === false && i.tipo_destino !== "apenas_glicada")
          ) && (
            <div className="bg-amber-500/10 border-2 border-amber-300 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-black">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-black text-amber-950 text-xs sm:text-sm uppercase tracking-tight flex items-center gap-1.5">
                      <span>📦 Tubos Retidos na Gradinha Local</span>
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                        {
                          itens.filter(
                            (i) =>
                              i.status === "retido_envio_posterior" ||
                              (i.enviar_hemograma_hoje === false && i.tipo_destino !== "apenas_glicada")
                          ).length
                        }{" "}
                        aguardando
                      </span>
                    </h3>
                    <p className="text-[11px] text-amber-800 font-medium">
                      HbA1c dosada na bancada hoje • Tubo integral aguardando remessa do apoio
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGavetaRetidosAberta(!gavetaRetidosAberta)}
                  className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-xl transition cursor-pointer"
                >
                  {gavetaRetidosAberta ? "Recolher" : "Ver Tubos"}
                </button>
              </div>

              {gavetaRetidosAberta && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-amber-900/80 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200">
                    💡 <strong>Como funciona o envio no dia seguinte:</strong> Ao chegar o dia do envio dos tubos guardados, clique em <strong>&quot;Liberar Hoje&quot;</strong> ou simplesmente <strong>digite o prontuário no topo</strong> para que ele entre automaticamente no relatório de faturamento da van de hoje.
                  </p>

                  <div className="divide-y divide-amber-200/80 bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
                    {itens
                      .filter(
                        (i) =>
                          i.status === "retido_envio_posterior" ||
                          (i.enviar_hemograma_hoje === false && i.tipo_destino !== "apenas_glicada")
                      )
                      .map((item) => (
                        <div
                          key={item.id || item.prontuario}
                          className="p-3 flex items-center justify-between gap-2 hover:bg-amber-50/50 transition"
                        >
                          <div className="truncate">
                            <p className="text-xs font-black text-slate-900 uppercase truncate">
                              {item.nome_paciente}
                            </p>
                            <div className="flex items-center gap-2 text-[10.5px] text-slate-600 mt-0.5">
                              <span className="font-bold text-purple-900">
                                DN: {item.data_nascimento || "Não informada"}
                              </span>
                              <span className="font-mono text-slate-500">
                                (#{item.prontuario})
                              </span>
                              {item.tem_vhs && (
                                <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                  VHS
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setTuboAtivo(item);
                                const dataNasc = formatarDataNascimento(item.data_nascimento || "");
                                setDataNascConferencia(dataNasc);
                                setEditandoDataNasc(false);
                                setEnviarHemogramaHoje(true);
                                setScannerPausado(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition cursor-pointer"
                              title="Abrir card para conferir"
                            >
                              Conferir
                            </button>

                            <button
                              type="button"
                              disabled={isSyncing}
                              onClick={() => liberarTuboRetidoHoje(item)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Liberar Hoje</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LISTA DA ROTINA EDTA DO DIA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Relação EDTA do Dia ({itens.length})
              </span>
              <button
                type="button"
                onClick={() => carregarDadosEdta(false)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {itens.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  Nenhum tubo EDTA carregado para hoje. Suba a planilha Conecta SUS em &quot;Importar&quot;.
                </div>
              ) : (
                itens.map((item, index) => {
                  const ehGlicada =
                    item.tipo_destino === "hemograma_glicada" ||
                    (item.tem_hemograma && item.tem_glicada);
                  const ehRetido =
                    item.status === "retido_envio_posterior" ||
                    (item.enviar_hemograma_hoje === false && item.tipo_destino !== "apenas_glicada");
                  const concluidoGrade =
                    (item.status === "pronto_grade" || item.colocado_grade) && !ehRetido;

                  return (
                    <div
                      key={item.id || item.prontuario || index}
                      onClick={() => {
                        setTuboAtivo(item);
                        const dataNasc = formatarDataNascimento(item.data_nascimento || "");
                        setDataNascConferencia(dataNasc);
                        setEditandoDataNasc(false);
                        setColetadoDoisTubos(
                          item.tem_vhs
                            ? item.coletado_dois_tubos !== false
                            : Boolean(item.coletado_dois_tubos)
                        );
                        if (item.status === "retido_envio_posterior") {
                          setEnviarHemogramaHoje(true);
                        } else {
                          setEnviarHemogramaHoje(item.enviar_hemograma_hoje !== false);
                        }
                        setScannerPausado(true);
                      }}
                      className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-5 text-[10px] font-bold text-slate-400 text-center">
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-black text-slate-900 uppercase truncate">
                            {item.nome_paciente}
                          </p>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                            {item.data_nascimento ? (
                              <span className="font-bold text-purple-900">
                                DN: {item.data_nascimento}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">DN não informada</span>
                            )}
                            <span className="font-mono text-slate-400">
                              (#{item.prontuario})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.tem_vhs && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              item.coletado_dois_tubos !== false
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-rose-100 text-rose-900 border-rose-300"
                            }`}
                            title={
                              item.coletado_dois_tubos !== false
                                ? "2 Tubos coletados (1 Apoio + 1 VHS)"
                                : "1 Tubo coletado (compartilhado)"
                            }
                          >
                            {item.coletado_dois_tubos !== false ? "2 Tubos (VHS)" : "1 Tubo"}
                          </span>
                        )}

                        {ehRetido ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            Retido p/ Amanhã
                          </span>
                        ) : ehGlicada ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
                            Fracionar 500µL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-100 text-blue-900 border border-blue-200">
                            Apoio
                          </span>
                        )}

                        {ehRetido ? (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-amber-400 text-slate-950"
                            title="Tubo retido na gradinha para envio amanhã"
                          >
                            📦
                          </span>
                        ) : (
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                              concluidoGrade
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-400"
                            }`}
                          >
                            {concluidoGrade ? "✓" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>

        {/* ======================================================================= */}
        {/* BOTÃO FIXO NO RODAPÉ: FINALIZAR TRIAGEM & ENVIAR PARA IMPRESSÃO (Req. 5) */}
        {/* ======================================================================= */}
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinalizarEEnviarImpressao}
              className="flex-1 py-3.5 px-4 bg-slate-950 hover:bg-slate-900 active:bg-black text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>🏁 Finalizar Triagem & Enviar para Impressão</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
