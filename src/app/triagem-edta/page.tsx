"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  normalizarTexto,
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
  ChevronRight,
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

  // Navegação e Filtros de Data e Status da Triagem EDTA
  const hojeIso = new Date().toISOString().split("T")[0];
  const ontemIso = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const [dataFiltro, setDataFiltro] = useState<string>("");
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);
  const [filtroStatusLista, setFiltroStatusLista] = useState<"todos" | "pendentes" | "na_grade" | "retidos">("todos");

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

  // Temporizador de 5 a 6 segundos para conferência visual de bancada antes de auto-avançar
  const [tempoRestante, setTempoRestante] = useState<number>(5);
  const [autoAvancoPausado, setAutoAvancoPausado] = useState<boolean>(false);
  const [editandoMedico, setEditandoMedico] = useState<boolean>(false);
  const autoAvancoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Conferência e Ajuste da Data de Nascimento (Destaque Visual p/ Bater o Olho)
  const [dataNascConferencia, setDataNascConferencia] = useState<string>("");
  const [editandoDataNasc, setEditandoDataNasc] = useState<boolean>(false);
  const [medicoDetectadoFolha, setMedicoDetectadoFolha] = useState<string>("");
  const [cpfDetectadoFolha, setCpfDetectadoFolha] = useState<string>("");

  // Controle de Coleta de 2 Tubos EDTA (1 Apoio + 1 VHS Local vs Falta de Tubos)
  const [coletadoDoisTubos, setColetadoDoisTubos] = useState<boolean>(true);

  // Controle de Envio de Hemograma: HOJE vs OUTRO DIA (Retido por alto volume de glicadas)
  const [enviarHemogramaHoje, setEnviarHemogramaHoje] = useState<boolean>(true);
  const [gavetaRetidosAberta, setGavetaRetidosAberta] = useState<boolean>(true);
  const gavetaRetidosRef = useRef<HTMLDivElement>(null);

  // BOTÕES GLOBAIS DE MODO DO PLANTÃO (Evita clicar na tela a cada folha)
  const [modoGlicadaPlantao, setModoGlicadaPlantao] = useState<"hoje" | "amanha">("amanha");
  const [modoVhsPlantao, setModoVhsPlantao] = useState<"dois_tubos" | "tubo_unico">("dois_tubos");
  const [bipagemContinuaAuto, setBipagemContinuaAuto] = useState<boolean>(true);
  const [tipoGuiaImpressao, setTipoGuiaImpressao] = useState<"apoio" | "laboratorio" | "ambas">("ambas");

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

    // Carregar modo do plantão pré-configurado da bancada
    const modoGlicadaSalvo = localStorage.getItem("edta_modo_glicada");
    if (modoGlicadaSalvo === "hoje" || modoGlicadaSalvo === "amanha") {
      setModoGlicadaPlantao(modoGlicadaSalvo);
    }
    const modoVhsSalvo = localStorage.getItem("edta_modo_vhs");
    if (modoVhsSalvo === "dois_tubos" || modoVhsSalvo === "tubo_unico") {
      setModoVhsPlantao(modoVhsSalvo);
    }
    const bipagemContinuaSalva = localStorage.getItem("edta_bipagem_continua_auto");
    if (bipagemContinuaSalva !== null) {
      setBipagemContinuaAuto(bipagemContinuaSalva === "true");
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
    // e sincronizar a lista a cada 7 segundos para que o PC fique sempre com a bancada em tempo real
    let tickCount = 0;
    const pollInterval = setInterval(() => {
      tickCount++;
      verificarSinalImpressaoRemota();
      if (tickCount % 2 === 0) {
        carregarDadosEdta(true);
      }
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("operador-atualizado", handleOperadorUpdate);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const carregarDadosEdta = async (silencioso = false, dataFiltroEscolhida?: string) => {
    if (!silencioso) setIsLoading(true);
    try {
      const dataParaBuscar = dataFiltroEscolhida !== undefined ? dataFiltroEscolhida : dataFiltro;
      const url = dataParaBuscar ? `/api/triagem-edta?data=${encodeURIComponent(dataParaBuscar)}` : "/api/triagem-edta";
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && Array.isArray(data.itens)) {
        setItens(data.itens);
        if (Array.isArray(data.datasDisponiveis)) {
          setDatasDisponiveis(data.datasDisponiveis);
        }
        if (data.itens.length > 0 && data.itens[0].data && !dataParaBuscar) {
          setDataReferencia(data.itens[0].data);
        } else if (dataParaBuscar) {
          setDataReferencia(dataParaBuscar);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar Triagem EDTA:", e);
    } finally {
      if (!silencioso) setIsLoading(false);
    }
  };

  const selecionarDataFiltro = (novaData: string) => {
    setDataFiltro(novaData);
    carregarDadosEdta(false, novaData);
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
          if (data.sinalImpressao.tipoGuia) {
            setTipoGuiaImpressao(data.sinalImpressao.tipoGuia);
          }

          // Resetar sinal no servidor imediatamente
          await fetch("/api/triagem-edta?reset_print=true");

          // RECARREGAR OS ITENS ATUALIZADOS DO SERVIDOR ANTES DE IMPRIMIR
          try {
            const resItens = await fetch("/api/triagem-edta");
            const dataItens = await resItens.json();
            if (dataItens.ok && Array.isArray(dataItens.itens)) {
              setItens(dataItens.itens);
            }
          } catch (eItens) {
            console.warn("Erro ao recarregar itens para impressão:", eItens);
          }

          // Disparar diálogo de impressão formatado A4 após renderização
          tocarSomConfirmado();
          setTimeout(() => {
            window.print();
          }, 450);
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

  const formatarDataOrigem = (dStr: string) => {
    if (!dStr) return "—";
    if (dStr.includes("-")) {
      const [ano, mes, dia] = dStr.split("-");
      return `${dia}/${mes}/${ano}`;
    }
    return dStr;
  };

  // Contagem para as abas da relação
  const pendentesListaCount = useMemo(() => {
    return itens.filter((i) => {
      const ehRetido =
        i.status === "retido_envio_posterior" ||
        (i.enviar_hemograma_hoje === false && i.tipo_destino !== "apenas_glicada");
      const concluido = (i.status === "pronto_grade" || i.colocado_grade) && !ehRetido;
      return !concluido && !ehRetido;
    }).length;
  }, [itens]);

  const naGradeListaCount = useMemo(() => {
    return itens.filter((i) => {
      const ehRetido =
        i.status === "retido_envio_posterior" ||
        (i.enviar_hemograma_hoje === false && i.tipo_destino !== "apenas_glicada");
      return (i.status === "pronto_grade" || i.colocado_grade) && !ehRetido;
    }).length;
  }, [itens]);

  const retidosListaCount = useMemo(() => {
    return itens.filter((i) => {
      return (
        i.status === "retido_envio_posterior" ||
        i.status === "retido_bancada" ||
        i.enviar_hemograma_hoje === false
      );
    }).length;
  }, [itens]);

  // Lista filtrada pelo chip de status
  const itensExibidos = useMemo(() => {
    return itens.filter((item) => {
      const ehRetido =
        item.status === "retido_envio_posterior" ||
        (item.enviar_hemograma_hoje === false && item.tipo_destino !== "apenas_glicada");
      const concluidoGrade =
        (item.status === "pronto_grade" || item.colocado_grade) && !ehRetido;

      if (filtroStatusLista === "pendentes") {
        return !concluidoGrade && !ehRetido;
      }
      if (filtroStatusLista === "na_grade") {
        return concluidoGrade;
      }
      if (filtroStatusLista === "retidos") {
        return ehRetido;
      }
      return true;
    });
  }, [itens, filtroStatusLista]);

  // Formatar Máscara de Data de Nascimento (DD/MM/AAAA) enquanto o usuário digita
  const aplicarMascaraData = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, "").slice(0, 8);
    if (apenasDigitos.length <= 2) return apenasDigitos;
    if (apenasDigitos.length <= 4) {
      return `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2)}`;
    }
    return `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2, 4)}/${apenasDigitos.slice(4)}`;
  };

  // BUSCA INTELIGENTE NA BASE DE EDTA DO DIA (POR PRONTUÁRIO, DATA DE NASCIMENTO OU NOME)
  const buscarPacienteNaBase = useCallback(
    (prontuarioBruto: string, dataNascBruta?: string, nomeBruto?: string): ItemTriagemEdta | null => {
      const pNorm = normalizarProntuario(prontuarioBruto).toLowerCase();
      const pOriginal = prontuarioBruto.trim().toLowerCase();
      const pDigits = prontuarioBruto.replace(/\D/g, "");
      const dDigitos = normalizarDigitosData(dataNascBruta || "");
      const nNorm = nomeBruto ? normalizarTexto(nomeBruto) : "";

      // 1. Procura primeiro pelo casamento de Prontuário
      let encontrado = itens.find((item) => {
        const itemPNorm = (
          item.prontuario_normalizado || normalizarProntuario(item.prontuario)
        ).toLowerCase();
        const itemPOriginal = (item.prontuario || "").toLowerCase();
        const itemPDigits = (item.prontuario || "").replace(/\D/g, "");

        const matchPront =
          itemPNorm === pNorm ||
          itemPOriginal === pOriginal ||
          itemPOriginal.replace(/^0+/, "") === pNorm ||
          (pDigits && itemPDigits === pDigits);

        if (!matchPront) return false;

        // Se a data de nascimento foi fornecida com 8 dígitos e o registro tem data
        if (dDigitos && dDigitos.length === 8 && item.data_nascimento_digitos) {
          return item.data_nascimento_digitos === dDigitos;
        }

        return true;
      });

      // 2. Fallback de alta precisão por Nome Completo se o prontuário sofreu distorção no OCR
      if (!encontrado && nNorm && nNorm.length >= 5) {
        encontrado = itens.find((item) => {
          const itemNome = normalizarTexto(item.nome_paciente || "");
          if (itemNome === nNorm) return true;
          const partes = nNorm.split(/\s+/).filter((p) => p.length >= 3);
          if (partes.length >= 2 && partes.every((p) => itemNome.includes(p))) {
            return true;
          }
          return false;
        });
      }

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

  // SALVAR ITEM AUTOMATICAMENTE NO MODO DE BIPAGEM CONTÍNUA SEM TRAVAR A TELA
  const salvarItemEdtaAutomatico = useCallback(
    async (
      item: ItemTriagemEdta,
      statusNovo: "pronto_grade" | "retido_envio_posterior",
      vaiEnviarHoje: boolean,
      dataNascDetectada?: string
    ) => {
      const agora = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const hojeIso = new Date().toISOString().split("T")[0];
      const dnFinal = formatarDataNascimento((dataNascDetectada || item.data_nascimento || "").trim());
      const dnDigitos = normalizarDigitosData(dnFinal);
      const temDoisTubos =
        modoVhsPlantao === "dois_tubos" || Boolean(item.coletado_dois_tubos);

      const itemAtualizado: ItemTriagemEdta = {
        ...item,
        data_nascimento: dnFinal,
        data_nascimento_digitos: dnDigitos,
        status: statusNovo,
        fracionado_glicada: statusNovo === "pronto_grade",
        colocado_grade: vaiEnviarHoje,
        enviar_hemograma_hoje: vaiEnviarHoje,
        data_liberacao_apoio: vaiEnviarHoje ? hojeIso : undefined,
        horario_bipado: agora,
        coletado_dois_tubos: temDoisTubos,
        qtd_tubos_coletados: temDoisTubos ? 2 : 1,
      };

      // Atualização otimista no estado local imediata com correspondência flexível
      const pTargetRaw = String(item.prontuario || "").trim();
      const pTargetNorm = normalizarProntuario(pTargetRaw);
      const pTargetDigits = pTargetRaw.replace(/\D/g, "");
      const nTarget = normalizarTexto(item.nome_paciente || "");

      setItens((prev) =>
        prev.map((i) => {
          const iRaw = String(i.prontuario || "").trim();
          const iNorm = normalizarProntuario(iRaw);
          const iDigits = iRaw.replace(/\D/g, "");
          const iNome = normalizarTexto(i.nome_paciente || "");

          const matchPront =
            iRaw === pTargetRaw ||
            (pTargetNorm && iNorm === pTargetNorm) ||
            (pTargetDigits && iDigits === pTargetDigits);
          const matchNome = Boolean(
            nTarget && iNome && (
              iNome === nTarget ||
              (nTarget.length >= 6 && iNome.includes(nTarget)) ||
              (iNome.length >= 6 && nTarget.includes(iNome))
            )
          );

          return matchPront || matchNome ? itemAtualizado : i;
        })
      );

      // Notificação flutuante de sucesso
      if (statusNovo === "retido_envio_posterior") {
        setMensagemSucesso({
          titulo: `📦 ${item.nome_paciente} (#${item.prontuario})`,
          subtitulo: `HbA1c enviada automaticamente para a Gaveta de Retidos (Envio amanhã)`,
        });
      } else {
        setMensagemSucesso({
          titulo: `✓ ${item.nome_paciente} (#${item.prontuario})`,
          subtitulo: `Hemograma confirmado na Grade do Apoio de hoje!`,
        });
      }
      setTimeout(() => setMensagemSucesso(null), 2500);

      // Persistência assíncrona no backend
      try {
        await fetch("/api/triagem-edta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "atualizar_item",
            prontuario: item.prontuario,
            updates: {
              nome_paciente: item.nome_paciente,
              data_nascimento: dnFinal,
              data_nascimento_digitos: dnDigitos,
              status: statusNovo,
              fracionado_glicada: statusNovo === "pronto_grade",
              colocado_grade: vaiEnviarHoje,
              enviar_hemograma_hoje: vaiEnviarHoje,
              data_liberacao_apoio: vaiEnviarHoje ? hojeIso : undefined,
              horario_bipado: agora,
              coletado_dois_tubos: temDoisTubos,
              qtd_tubos_coletados: temDoisTubos ? 2 : 1,
            },
          }),
        });
      } catch (e) {
        console.warn("Aviso ao auto-salvar item EDTA:", e);
      }
    },
    [modoVhsPlantao]
  );

  // PROCESSAR LEITURA CONTÍNUA DA CÂMERA (OCR) OU FALLBACK MANUAL
  const processarIdentificacaoPaciente = useCallback(
    (
      prontuarioBruto: string,
      dataNascBruta?: string,
      medicoDetectado?: string,
      nomeDetectado?: string,
      cpfDetectado?: string
    ) => {
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

      const encontrado = buscarPacienteNaBase(prontLimpo, dataNascBruta, nomeDetectado);

      if (encontrado) {
        if (cpfDetectado) {
          setCpfDetectadoFolha(cpfDetectado);
        } else {
          setCpfDetectadoFolha("");
        }

        const temGlicada =
          encontrado.tipo_destino === "hemograma_glicada" ||
          (encontrado.tem_hemograma && encontrado.tem_glicada);
        const ehApenasHemograma =
          encontrado.tipo_destino === "apenas_hemograma" ||
          (encontrado.tem_hemograma && !encontrado.tem_glicada);

        // Seleção e destaque de médico solicitante (se detectado na folha pelo OCR)
        let medFinalNome = "";
        if (medicoDetectado && medicoDetectado.trim().length >= 3) {
          const limpo = medicoDetectado.trim();
          medFinalNome = limpo.toUpperCase().startsWith("DR") ? limpo : `Dr(a). ${limpo}`;
          setMedicoSelecionado(medFinalNome);
          setMedicoDetectadoFolha(medFinalNome);

          if (!medicosCadastrados.some((m) => m.toLowerCase() === medFinalNome.toLowerCase())) {
            const nova = [...medicosCadastrados, medFinalNome];
            setMedicosCadastrados(nova);
            adicionarMedico(medFinalNome);
          }
        } else {
          setMedicoDetectadoFolha("");
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
        }

        // Configuração de envio do Hemograma:
        if (encontrado.status === "retido_envio_posterior") {
          setEnviarHemogramaHoje(true);
        } else {
          setEnviarHemogramaHoje(
            modoGlicadaPlantao === "amanha" && temGlicada
              ? false
              : encontrado.enviar_hemograma_hoje !== false
          );
        }

        // Data de nascimento capturada via OCR/manual ou já existente na planilha
        const dataNascDetectada = formatarDataNascimento(
          dataNascBruta || encontrado.data_nascimento || ""
        );
        setDataNascConferencia(dataNascDetectada);
        setEditandoDataNasc(false);
        setEditandoMedico(false);

        // Se o paciente tem VHS ou se já foi registrado status de 2 tubos
        if (encontrado.tem_vhs) {
          setColetadoDoisTubos(modoVhsPlantao === "dois_tubos");
        } else {
          setColetadoDoisTubos(Boolean(encontrado.coletado_dois_tubos));
        }

        // FEEDBACK SONORO IMEDIATO CONFORME O CASO
        if (temGlicada) {
          tocarSomHemogramaGlicada();
        } else if (ehApenasHemograma) {
          tocarSomApenasHemograma();
        } else if (encontrado.tipo_destino === "apenas_glicada") {
          tocarSomApenasGlicada();
        }

        // TRAVAR O CARD DE DECISÃO NA TELA POR 5 A 6 SEGUNDOS PARA CONFERÊNCIA VISUAL
        setScannerPausado(true);
        setTuboAtivo(encontrado);
        setIsUrgente(Boolean(encontrado.urgencia));
        setToastSemEdta(null);
      } else {
        // CASO 3: FOLHA SEM EDTA / NÃO LOCALIZADA (Urina, Fezes, Bioquímica)
        exibirToastSemEdta("ℹ️ Sem exames de EDTA (Avançar folha)");
      }
    },
    [
      buscarPacienteNaBase,
      exibirToastSemEdta,
      medicoPadrao,
      medicosCadastrados,
      modoGlicadaPlantao,
      modoVhsPlantao,
      bipagemContinuaAuto,
      salvarItemEdtaAutomatico,
    ]
  );

  // Callback do OCR da Câmera
  const handleOcrDetectado = useCallback(
    (dados: DadosPacienteCapturados) => {
      processarIdentificacaoPaciente(
        dados.prontuario,
        dados.dataNascimento,
        dados.medicoSolicitante,
        dados.nomePaciente,
        dados.cpf
      );
    },
    [processarIdentificacaoPaciente]
  );

  // Submissão do Fallback Manual
  const handleBuscarManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualProntuario.trim()) return;
    processarIdentificacaoPaciente(manualProntuario, manualDataNasc);
  };

  // Limpeza de timer de auto-avanço
  const limparTimerAutoAvanco = useCallback(() => {
    if (autoAvancoTimerRef.current) {
      clearInterval(autoAvancoTimerRef.current);
      autoAvancoTimerRef.current = null;
    }
  }, []);

  // Iniciar contagem regressiva de 5 a 6 segundos toda vez que um tubo for ativado na tela
  useEffect(() => {
    if (!tuboAtivo) {
      limparTimerAutoAvanco();
      setTempoRestante(5);
      setAutoAvancoPausado(false);
      setEditandoMedico(false);
      return;
    }

    setTempoRestante(5);
    setAutoAvancoPausado(false);

    limparTimerAutoAvanco();
    autoAvancoTimerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          limparTimerAutoAvanco();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      limparTimerAutoAvanco();
    };
  }, [tuboAtivo, limparTimerAutoAvanco]);

  // Executar auto-avanço quando o tempo esgotar (se não estiver pausado para edição de dados)
  useEffect(() => {
    if (tuboAtivo && tempoRestante === 0 && !autoAvancoPausado && !isSyncing) {
      confirmarAcaoTubo();
    }
  }, [tempoRestante, tuboAtivo, autoAvancoPausado, isSyncing]);

  // Atalhos de teclado para agilidade na bancada: Enter/Espaço confirma, Esc fecha
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tuboAtivo) return;
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      if (isInput) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        limparTimerAutoAvanco();
        confirmarAcaoTubo();
      } else if (e.key === "Escape") {
        e.preventDefault();
        limparTimerAutoAvanco();
        fecharCardConferencia();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tuboAtivo, limparTimerAutoAvanco]);

  // CONFIRMAÇÃO DO CARD DE AÇÃO (CASO 1 / CASO 2 / BANCADA / RETIDO)
  const confirmarAcaoTubo = async () => {
    if (!tuboAtivo) return;

    limparTimerAutoAvanco();
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

    const dataNascFinal = formatarDataNascimento((dataNascConferencia || tuboAtivo.data_nascimento || "").trim());
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

    // Atualização otimista no estado local com correspondência flexível
    const pTargetRaw = String(tuboAtivo.prontuario || "").trim();
    const pTargetNorm = normalizarProntuario(pTargetRaw);
    const pTargetDigits = pTargetRaw.replace(/\D/g, "");
    const nTarget = normalizarTexto(tuboAtivo.nome_paciente || "");

    setItens((prev) =>
      prev.map((i) => {
        const iRaw = String(i.prontuario || "").trim();
        const iNorm = normalizarProntuario(iRaw);
        const iDigits = iRaw.replace(/\D/g, "");
        const iNome = normalizarTexto(i.nome_paciente || "");

        const matchPront =
          iRaw === pTargetRaw ||
          (pTargetNorm && iNorm === pTargetNorm) ||
          (pTargetDigits && iDigits === pTargetDigits);
        const matchNome = Boolean(
          nTarget && iNome && (
            iNome === nTarget ||
            (nTarget.length >= 6 && iNome.includes(nTarget)) ||
            (iNome.length >= 6 && nTarget.includes(iNome))
          )
        );

        return matchPront || matchNome ? itemAtualizado : i;
      })
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
            nome_paciente: tuboAtivo.nome_paciente,
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
      limparTimerAutoAvanco();
      // Limpa o card e reativa a câmera instantaneamente
      setTuboAtivo(null);
      setDataNascConferencia("");
      setMedicoDetectadoFolha("");
      setCpfDetectadoFolha("");
      setEditandoDataNasc(false);
      setEditandoMedico(false);
      setManualProntuario("");
      setManualDataNasc("");
      setScannerPausado(false);
      if (manualProntRef.current) {
        manualProntRef.current.focus();
      }
    }
  };

  // CANCELAR / FECHAR O CARD DE CONFERÊNCIA SEM SALVAR
  const fecharCardConferencia = () => {
    limparTimerAutoAvanco();
    setTuboAtivo(null);
    setDataNascConferencia("");
    setMedicoDetectadoFolha("");
    setCpfDetectadoFolha("");
    setEditandoDataNasc(false);
    setEditandoMedico(false);
    setScannerPausado(false);
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

    const pTargetRaw = String(itemRetido.prontuario || "").trim();
    const pTargetNorm = normalizarProntuario(pTargetRaw);
    const pTargetDigits = pTargetRaw.replace(/\D/g, "");
    const nTarget = normalizarTexto(itemRetido.nome_paciente || "");

    setItens((prev) =>
      prev.map((i) => {
        const iRaw = String(i.prontuario || "").trim();
        const iNorm = normalizarProntuario(iRaw);
        const iDigits = iRaw.replace(/\D/g, "");
        const iNome = normalizarTexto(i.nome_paciente || "");

        const matchPront =
          iRaw === pTargetRaw ||
          (pTargetNorm && iNorm === pTargetNorm) ||
          (pTargetDigits && iDigits === pTargetDigits);
        const matchNome = Boolean(
          nTarget && iNome && (
            iNome === nTarget ||
            (nTarget.length >= 6 && iNome.includes(nTarget)) ||
            (iNome.length >= 6 && nTarget.includes(iNome))
          )
        );

        return matchPront || matchNome ? itemAtualizado : i;
      })
    );

    try {
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_item",
          prontuario: itemRetido.prontuario,
          updates: {
            nome_paciente: itemRetido.nome_paciente,
            data_nascimento: itemRetido.data_nascimento,
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
      await carregarDadosEdta(true);
    } catch (e) {
      console.warn("Aviso ao liberar tubo retido:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // DESPACHAR TODOS OS TUBOS RETIDOS EM LOTE PARA O APOIO DE HOJE
  const liberarTodosRetidosHoje = async () => {
    const retidos = itens.filter(
      (i) =>
        i.status === "retido_envio_posterior" ||
        (i.enviar_hemograma_hoje === false && (i.tipo_destino === "hemograma_glicada" || i.tem_glicada))
    );
    if (retidos.length === 0) return;

    tocarSomConfirmado();
    setIsSyncing(true);

    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const hojeIso = new Date().toISOString().split("T")[0];

    const prontuariosRetidos = new Set(
      retidos.map((r) => (r.prontuario_normalizado || normalizarProntuario(r.prontuario)).toLowerCase())
    );

    setItens((prev) =>
      prev.map((i) => {
        const chave = (i.prontuario_normalizado || normalizarProntuario(i.prontuario)).toLowerCase();
        if (prontuariosRetidos.has(chave)) {
          return {
            ...i,
            status: "pronto_grade" as const,
            colocado_grade: true,
            enviar_hemograma_hoje: true,
            data_liberacao_apoio: hojeIso,
            horario_bipado: agora,
          };
        }
        return i;
      })
    );

    try {
      for (const r of retidos) {
        await fetch("/api/triagem-edta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "atualizar_item",
            prontuario: r.prontuario,
            updates: {
              nome_paciente: r.nome_paciente,
              data_nascimento: r.data_nascimento,
              status: "pronto_grade",
              colocado_grade: true,
              enviar_hemograma_hoje: true,
              data_liberacao_apoio: hojeIso,
              horario_bipado: agora,
            },
          }),
        });
      }

      setMensagemSucesso({
        titulo: `🚀 ${retidos.length} tubos retidos despachados para a Grade do Apoio de Hoje!`,
        subtitulo: "Todos os tubos entraram imediatamente na relação oficial para a remessa da tarde.",
      });
      setTimeout(() => setMensagemSucesso(null), 4000);
      await carregarDadosEdta(true);
    } catch (e) {
      console.warn("Aviso ao liberar retidos em lote:", e);
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

  // FINALIZAÇÃO E IMPRESSÃO (GUIA DO APOIO, GUIA DO LABORATÓRIO OU AMBAS)
  const dispararImpressao = async (tipo: "apoio" | "laboratorio" | "ambas") => {
    const horaAgora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setHoraEncerramento(horaAgora);
    setTipoGuiaImpressao(tipo);

    // Sincronizar dados mais recentes do servidor antes de imprimir para garantir que todas as datas de nascimento estejam presentes
    try {
      const resItens = await fetch("/api/triagem-edta");
      const dataItens = await resItens.json();
      if (dataItens.ok && Array.isArray(dataItens.itens)) {
        setItens(dataItens.itens);
      }
    } catch (_) {}

    try {
      // Disparar sinal para o computador da bancada com o tipo de guia
      await fetch("/api/triagem-edta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "solicitar_impressao",
          horaEncerramento: horaAgora,
          tipoGuia: tipo,
        }),
      });

      tocarSomConfirmado();
      const titulos = {
        apoio: "📦 Guia Apoio enviada para impressão!",
        laboratorio: "🔬 Guia Lab enviada para impressão!",
        ambas: "🖨️ Ambas as Guias (Apoio + Lab) enviadas para impressão!",
      };
      setMensagemSucesso({
        titulo: titulos[tipo],
        subtitulo: `Fechamento às ${horaAgora}. Diálogo A4 aberto para impressão.`,
      });

      // Abre diálogo de impressão no dispositivo atual após atualização do estado
      setTimeout(() => {
        window.print();
      }, 450);
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

  // CARD DE DECISÃO EM DESTAQUE (ROXO P/ FRACIONAR / AZUL P/ APOIO)
  // PAUSA DE 5 A 6 SEGUNDOS PARA CONFERÊNCIA VISUAL DE BANCADA COM EDIÇÃO MANUAL DE MÉDICO
  const renderCardConferencia = (tubo: ItemTriagemEdta) => {
    const temGlicada =
      tubo.tipo_destino === "hemograma_glicada" ||
      (tubo.tem_hemograma && tubo.tem_glicada);
    const ehApenasHemograma =
      tubo.tipo_destino === "apenas_hemograma" ||
      (tubo.tem_hemograma && !tubo.tem_glicada);
    const ehRetido = tubo.status === "retido_envio_posterior";
    const ehApenasGlicada = tubo.tipo_destino === "apenas_glicada";

    // Definição das cores do card: Roxo para Fracionar / Azul para Apoio / Âmbar para outros
    const cardBorderClass = ehRetido
      ? "border-2 border-amber-500 shadow-xl shadow-amber-500/15"
      : temGlicada
      ? "border-2 border-purple-500 shadow-xl shadow-purple-500/15"
      : ehApenasHemograma
      ? "border-2 border-blue-500 shadow-xl shadow-blue-500/15"
      : "border-2 border-amber-500 shadow-xl shadow-amber-500/15";

    const bannerBgClass = ehRetido
      ? "bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 text-white"
      : temGlicada
      ? "bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white"
      : ehApenasHemograma
      ? "bg-gradient-to-r from-blue-700 via-blue-800 to-sky-900 text-white"
      : "bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-800 text-white";

    return (
      <div
        className={`bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl ${cardBorderClass} animate-in zoom-in-95 duration-150 space-y-3`}
      >
        {/* BANNER SUPERIOR DE ALTO IMPACTO (ROXO P/ FRACIONAR / AZUL P/ APOIO) */}
        <div className={`${bannerBgClass} rounded-xl p-3 sm:p-3.5 shadow-md flex items-center justify-between gap-2`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs shrink-0">
              {ehRetido ? (
                <Clock className="w-5 h-5 text-amber-200" />
              ) : temGlicada ? (
                <AlertTriangle className="w-5 h-5 text-amber-300" />
              ) : ehApenasHemograma ? (
                <CheckCircle2 className="w-5 h-5 text-sky-200" />
              ) : (
                <FlaskConical className="w-5 h-5 text-amber-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
                  {ehRetido
                    ? "⏳ AMOSTRA RETIDA (Glicada já dosada)"
                    : temGlicada
                    ? (modoGlicadaPlantao === "amanha"
                        ? "🧪 TEM GLICADA — RETIDA AUTOMATICAMENTE (ABA RETIDAS)"
                        : "🧪 TEM GLICADA — FRACIONAR 500 µL")
                    : ehApenasHemograma
                    ? "📦 APENAS HEMOGRAMA — ENVIAR AO APOIO"
                    : "🔬 APENAS GLICADA — BANCADA LOCAL"}
                </span>
              </div>
              <p className="text-[11px] text-white/90 font-medium leading-tight">
                {ehRetido
                  ? "Liberar este tubo para envio na remessa de hoje?"
                  : temGlicada
                  ? (modoGlicadaPlantao === "amanha"
                      ? "Amostra retida para dosagem local. O envio ao apoio será liberado no computador."
                      : "Separar 500 µL no microtubo roxo e enviar tubo integral ao apoio hoje.")
                  : ehApenasHemograma
                  ? "Tubo integral direto para a grade do apoio (faturamento)"
                  : "Tubo retido no laboratório para dosagem local (não enviar ao apoio)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fecharCardConferencia}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
            title="Fechar conferência (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TEMPO DE PAUSA DE 5 A 6 SEGUNDOS PARA CONFERÊNCIA VISUAL DE BANCADA */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>
                {autoAvancoPausado ? (
                  <span className="text-amber-800 font-black">⏸️ Timer pausado para conferência / edição</span>
                ) : (
                  <span>
                    Conferência visual: avanço automático em{" "}
                    <strong className="text-purple-900 font-mono font-black text-sm">
                      {tempoRestante}s
                    </strong>
                  </span>
                )}
              </span>
            </div>
            {!autoAvancoPausado ? (
              <button
                type="button"
                onClick={() => setAutoAvancoPausado(true)}
                className="text-[10.5px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 px-2 py-0.5 rounded-lg shadow-2xs transition cursor-pointer"
              >
                Pausar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAutoAvancoPausado(false)}
                className="text-[10.5px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs transition cursor-pointer"
              >
                Retomar
              </button>
            )}
          </div>
          {/* Barra de Progresso Visual */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                autoAvancoPausado
                  ? "bg-amber-500"
                  : temGlicada
                  ? "bg-purple-600"
                  : "bg-blue-600"
              }`}
              style={{ width: `${(tempoRestante / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* DADOS DO PACIENTE */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-snug">
              {tubo.nome_paciente}
            </h2>
            {tubo.urgencia && (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0">
                🚨 Urgência
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span>
              Prontuário: <strong className="text-slate-800 font-mono font-bold text-sm">#{tubo.prontuario}</strong>
            </span>
            {cpfDetectadoFolha && (
              <span>
                CPF: <strong className="text-slate-800 font-mono">{cpfDetectadoFolha}</strong>
              </span>
            )}
          </div>
        </div>

        {/* DATA DE NASCIMENTO (EM DESTAQUE, SUTIL E LEGÍVEL) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Data de Nascimento
            </span>
            {editandoDataNasc ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={dataNascConferencia}
                  onChange={(e) => setDataNascConferencia(aplicarMascaraData(e.target.value))}
                  placeholder="DD/MM/AAAA"
                  className="w-36 px-2.5 py-1.5 bg-white text-slate-900 rounded-lg text-lg font-mono font-bold border border-slate-300 focus:outline-purple-600"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setEditandoDataNasc(false)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  OK
                </button>
              </div>
            ) : (
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
                {formatarDataNascimento(dataNascConferencia || tubo.data_nascimento || "") || "NÃO INFORMADA"}
              </span>
            )}
          </div>

          {!editandoDataNasc && (
            <button
              type="button"
              onClick={() => {
                setEditandoDataNasc(true);
                setAutoAvancoPausado(true);
              }}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg cursor-pointer transition"
            >
              ✏️ Ajustar
            </button>
          )}
        </div>

        {/* MÉDICO SOLICITANTE COM SUPORTE À EDIÇÃO MANUAL DIRETA NO CARD */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Médico Solicitante (Guia de Envio ao Apoio)
            </span>
            {!editandoMedico && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditandoMedico(true);
                    setAutoAvancoPausado(true);
                  }}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg cursor-pointer transition flex items-center gap-1"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalMedicos(true);
                    setAutoAvancoPausado(true);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg cursor-pointer transition"
                  title="Ver lista de médicos cadastrados"
                >
                  Lista
                </button>
              </div>
            )}
          </div>

          {editandoMedico ? (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    list="sugestoes-medicos-card"
                    value={medicoSelecionado}
                    onChange={(e) => setMedicoSelecionado(e.target.value)}
                    placeholder="Dr(a). Nome do Médico Solicitante"
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-lg text-xs sm:text-sm font-bold border border-purple-400 focus:outline-purple-600 focus:ring-1 focus:ring-purple-600 shadow-2xs"
                    autoFocus
                  />
                  <datalist id="sugestoes-medicos-card">
                    {medicosCadastrados.map((med) => (
                      <option key={med} value={med} />
                    ))}
                  </datalist>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditandoMedico(false);
                    const nomeL = medicoSelecionado.trim();
                    if (nomeL && !medicosCadastrados.some((m) => m.toLowerCase() === nomeL.toLowerCase())) {
                      adicionarMedico(nomeL);
                      setMedicosCadastrados((prev) => [...prev, nomeL]);
                    }
                  }}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg cursor-pointer transition shrink-0"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditandoMedico(false)}
                  className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition shrink-0"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                💡 Edite livremente ou selecione uma opção da lista. O nome será gravado para o envio do Apoio.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-black text-slate-900 uppercase truncate">
                {medicoSelecionado || tubo.solicitante || "Dr(a). Clínico(a) Geral / UBS"}
              </p>
              {medicoDetectadoFolha && (
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 border border-emerald-200">
                  Lido da Folha
                </span>
              )}
            </div>
          )}
        </div>

        {/* OPÇÃO DE VHS (2 TUBOS) */}
        <label className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100/70 p-2.5 rounded-xl cursor-pointer select-none transition">
          <input
            type="checkbox"
            checked={coletadoDoisTubos}
            onChange={(e) => setColetadoDoisTubos(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 accent-purple-600 cursor-pointer shrink-0"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-800">
              {coletadoDoisTubos
                ? "Coletado 2 tubos EDTA (1 Apoio + 1 VHS Local)"
                : "Coletado apenas 1 tubo EDTA"}
            </span>
            {tubo.tem_vhs && (
              <span className="ml-1.5 inline-block text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                VHS Solicitado
              </span>
            )}
          </div>
        </label>

        {/* DESTINO AUTOMÁTICO DO HEMOGRAMA CONFORME REGRA DO PLANTÃO ATIVA */}
        {ehRetido ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center gap-2.5 text-xs">
            <div className="p-1.5 bg-amber-200/70 rounded-lg text-amber-900 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="font-black text-amber-950 uppercase text-[11px] block">
                📦 Amostra Retida (Glicada já dosada)
              </span>
              <span className="text-amber-900 text-[10.5px]">
                A ativação para envio ao apoio é feita diretamente no computador na <strong>aba Retidos Glicada</strong>.
              </span>
            </div>
          </div>
        ) : temGlicada && modoGlicadaPlantao === "amanha" ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center gap-2.5 text-xs">
            <div className="p-1.5 bg-amber-200/70 rounded-lg text-amber-900 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="font-black text-amber-950 uppercase text-[11px] block">
                📦 Destino Automático: Aba Retidos Glicada
              </span>
              <span className="text-amber-900 text-[10.5px]">
                Configuração ativa: <strong>Reter p/ Amanhã</strong>. O tubo vai direto para a aba de retidos e será liberado no computador.
              </span>
            </div>
          </div>
        ) : temGlicada && modoGlicadaPlantao === "hoje" ? (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 flex items-center gap-2.5 text-xs">
            <div className="p-1.5 bg-purple-200/70 rounded-lg text-purple-900 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="font-black text-purple-950 uppercase text-[11px] block">
                ⚡ Destino: Fracionamento & Grade de Hoje
              </span>
              <span className="text-purple-900 text-[10.5px]">
                Fracionar 500 µL para a bancada local e colocar o tubo integral na grade do apoio de hoje.
              </span>
            </div>
          </div>
        ) : null}

        {/* BOTÕES DE AÇÃO PRINCIPAIS: BOTÃO VERDE DE CONFIRMAÇÃO IMEDIATA E CANCELAR */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => {
              limparTimerAutoAvanco();
              confirmarAcaoTubo();
            }}
            className="flex-1 py-3 px-4 font-black text-xs sm:text-sm rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {ehRetido
                ? "Manter Amostra Retida"
                : !enviarHemogramaHoje
                ? "Confirmar Amostra Retida"
                : tubo.tipo_destino === "apenas_glicada"
                ? "Confirmar Bancada Local"
                : "Confirmar Tubo na Grade"}
              {!autoAvancoPausado && tempoRestante > 0 ? ` (${tempoRestante}s)` : ""}
            </span>
          </button>

          <button
            type="button"
            onClick={fecharCardConferencia}
            className="py-3 px-3.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };

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
        tipoGuia={tipoGuiaImpressao}
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
              onClick={() => {
                gavetaRetidosRef.current?.scrollIntoView({ behavior: "smooth" });
                setGavetaRetidosAberta(true);
              }}
              className={`rounded-2xl p-2.5 sm:p-3 border shadow-2xs text-center transition-all cursor-pointer hover:scale-102 ${
                tubosRetidosLocal > 0
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/40"
                  : "bg-slate-50 border-slate-200 opacity-75"
              }`}
              title="Clique para rolar até a gaveta de tubos retidos"
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

          {/* BARRA DE ATALHOS / CONFIGURAÇÃO DO MODO DO PLANTÃO */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Modo Glicada */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500">HbA1c:</span>
                <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setModoGlicadaPlantao("amanha");
                      localStorage.setItem("edta_modo_glicada", "amanha");
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black text-[10.5px] transition cursor-pointer flex items-center gap-1 ${
                      modoGlicadaPlantao === "amanha"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Muitas glicadas: reter tubo integral para enviar amanhã e dosar hoje (não sai no relatório de hoje)"
                  >
                    <span>📦 Reter p/ Amanhã</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoGlicadaPlantao("hoje");
                      localStorage.setItem("edta_modo_glicada", "hoje");
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black text-[10.5px] transition cursor-pointer flex items-center gap-1 ${
                      modoGlicadaPlantao === "hoje"
                        ? "bg-purple-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Fracionar 500 µL hoje e enviar hemograma hoje ao apoio"
                  >
                    <span>⚡ Fracionar Hoje</span>
                  </button>
                </div>
              </div>

              {/* Modo VHS */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500">VHS:</span>
                <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setModoVhsPlantao("dois_tubos");
                      localStorage.setItem("edta_modo_vhs", "dois_tubos");
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black text-[10.5px] transition cursor-pointer flex items-center gap-1 ${
                      modoVhsPlantao === "dois_tubos"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="VHS: Coletados 2 tubos EDTA (1 Apoio + 1 VHS Bancada)"
                  >
                    <span>✓ Coleta 2 Tubos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoVhsPlantao("tubo_unico");
                      localStorage.setItem("edta_modo_vhs", "tubo_unico");
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black text-[10.5px] transition cursor-pointer flex items-center gap-1 ${
                      modoVhsPlantao === "tubo_unico"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Falta de tubos: coletado 1 tubo EDTA"
                  >
                    <span>⚠️ 1 Tubo</span>
                  </button>
                </div>
              </div>

              {/* Toggle de Bipagem Contínua */}
              <button
                type="button"
                onClick={() => {
                  const novo = !bipagemContinuaAuto;
                  setBipagemContinuaAuto(novo);
                  localStorage.setItem("edta_bipagem_continua_auto", String(novo));
                }}
                className={`px-2.5 py-1 rounded-xl border text-[10.5px] font-black transition cursor-pointer flex items-center gap-1 ${
                  bipagemContinuaAuto
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
                title="Bipagem Contínua: auto-confirma sem travar a tela em cada leitura"
              >
                <span>{bipagemContinuaAuto ? "⚡ Bipagem Contínua: ON" : "⏸ Bipagem: Manual"}</span>
              </button>
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
          {/* CARD SUTIL E DIRETO DE CONFERÊNCIA DO PACIENTE                         */}
          {/* ======================================================================= */}
          {tuboAtivo && renderCardConferencia(tuboAtivo)}

          {/* ======================================================================= */}
          {/* GAVETA SUTIL: TUBOS RETIDOS NA GRADINHA LOCAL (ENVIO POSTERIOR)        */}
          {/* ======================================================================= */}
          {/* SINALIZADOR DISCRETO DE TUBOS RETIDOS (SEM BLOCO GIGANTE TRAVANDO A TELA) */}
          {itens.some(
            (i) =>
              i.status === "retido_envio_posterior" ||
              (i.enviar_hemograma_hoje === false && (i.tipo_destino === "hemograma_glicada" || i.tem_glicada))
          ) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 rounded-lg bg-amber-200/80 text-amber-900 shrink-0">
                  <Clock className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-950 truncate">
                    {itens.filter((i) => i.status === "retido_envio_posterior" || (i.enviar_hemograma_hoje === false && (i.tipo_destino === "hemograma_glicada" || i.tem_glicada))).length} tubos retidos de glicada na gradinha
                  </p>
                  <p className="text-[11px] text-amber-800/80 hidden sm:block">
                    Amostras aguardando liberação do hemograma para o Apoio.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={liberarTodosRetidosHoje}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                  title="Liberar todos os tubos retidos para o envio de hoje"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Liberar Todos</span>
                </button>

                <Link
                  href="/retidos-glicada"
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-lg border border-amber-300 transition flex items-center gap-1"
                >
                  <span>Aba Retidos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* LISTA DA ROTINA EDTA DO DIA / HISTÓRICO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
            {/* TOPO DA RELAÇÃO */}
            <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  Relação EDTA • {dataFiltro === hojeIso ? "Hoje" : dataFiltro === ontemIso ? "Ontem" : dataFiltro ? formatarDataOrigem(dataFiltro) : "Todas as Datas"}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ({itensExibidos.length}{filtroStatusLista !== "todos" ? ` de ${itens.length}` : ""})
                </span>
              </span>

              <button
                type="button"
                onClick={() => carregarDadosEdta(false)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>

            {/* SELETOR DE PERÍODO / DATA */}
            <div className="p-2.5 sm:p-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => selecionarDataFiltro(hojeIso)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    dataFiltro === hojeIso
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Hoje</span>
                </button>

                <button
                  type="button"
                  onClick={() => selecionarDataFiltro(ontemIso)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    dataFiltro === ontemIso
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>Ontem</span>
                </button>

                <button
                  type="button"
                  onClick={() => selecionarDataFiltro("")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    !dataFiltro
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>Todas</span>
                </button>
              </div>

              {/* CALENDÁRIO MANUAL */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dataFiltro}
                  onChange={(e) => selecionarDataFiltro(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs focus:outline-purple-600"
                  title="Selecionar data específica no calendário"
                />
                {dataFiltro && (
                  <button
                    type="button"
                    onClick={() => selecionarDataFiltro("")}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-700 underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* AVISO SE VISUALIZANDO DATA ANTERIOR */}
            {dataFiltro && dataFiltro !== hojeIso && (
              <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-between">
                <span>
                  ⚠️ Visualizando dados de {dataFiltro === ontemIso ? "Ontem" : formatarDataOrigem(dataFiltro)}.
                </span>
                <button
                  type="button"
                  onClick={() => selecionarDataFiltro(hojeIso)}
                  className="underline hover:text-amber-950 font-black"
                >
                  Voltar para Hoje
                </button>
              </div>
            )}

            {/* CHIPS DE STATUS */}
            <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap items-center gap-1.5 bg-white">
              <button
                type="button"
                onClick={() => setFiltroStatusLista("todos")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  filtroStatusLista === "todos"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos ({itens.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroStatusLista("pendentes")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  filtroStatusLista === "pendentes"
                    ? "bg-purple-700 text-white"
                    : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"
                }`}
              >
                ⏳ Pendentes ({pendentesListaCount})
              </button>

              <button
                type="button"
                onClick={() => setFiltroStatusLista("na_grade")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  filtroStatusLista === "na_grade"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                ✓ Na Grade ({naGradeListaCount})
              </button>

              <button
                type="button"
                onClick={() => setFiltroStatusLista("retidos")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  filtroStatusLista === "retidos"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                }`}
              >
                📦 Retidos ({retidosListaCount})
              </button>
            </div>

            {/* ITENS DA LISTA */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {itensExibidos.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  {itens.length === 0
                    ? `Nenhum tubo EDTA localizado para ${dataFiltro ? formatarDataOrigem(dataFiltro) : "o período"}.`
                    : "Nenhum tubo com o status selecionado."}
                </div>
              ) : (
                itensExibidos.map((item: ItemTriagemEdta, index: number) => {
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
                          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500">
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
                            {item.data && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${
                                  item.data === hojeIso
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : item.data === ontemIso
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "bg-slate-200 text-slate-700 border-slate-300"
                                }`}
                              >
                                {item.data === hojeIso
                                  ? "Hoje"
                                  : item.data === ontemIso
                                  ? "Ontem"
                                  : formatarDataOrigem(item.data)}
                              </span>
                            )}
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
        {/* BOTÕES FIXOS NO RODAPÉ: IMPRESSÃO DA GUIA DO APOIO, DO LAB OU AMBAS      */}
        {/* ======================================================================= */}
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 sm:p-3 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispararImpressao("apoio")}
              className="flex-1 py-3 px-2 sm:px-3 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              title="Imprimir Relação de Remessa para o Apoio (Paisagem / Faturamento)"
            >
              <Printer className="w-4 h-4 text-purple-200 shrink-0" />
              <span className="truncate">📦 Guia Apoio (Paisagem)</span>
            </button>

            <button
              type="button"
              onClick={() => dispararImpressao("laboratorio")}
              className="flex-1 py-3 px-2 sm:px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              title="Imprimir Relatório Interno do Laboratório (Controle de Bancada)"
            >
              <Printer className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate">🔬 Guia Lab (Bancada)</span>
            </button>

            <button
              type="button"
              onClick={() => dispararImpressao("ambas")}
              className="py-3 px-3 sm:px-4 bg-slate-950 hover:bg-slate-900 active:bg-black text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shrink-0"
              title="Imprimir ambas as guias (Apoio Paisagem + Lab Retrato)"
            >
              <Printer className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">🖨️ Ambas</span>
              <span className="sm:hidden">Ambas</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
