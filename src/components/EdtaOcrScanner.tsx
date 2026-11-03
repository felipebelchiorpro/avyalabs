"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, AlertCircle, Zap, ZapOff, Check, ScanLine } from "lucide-react";
import { normalizarProntuario, formatarDataNascimento, normalizarDigitosData } from "@/lib/extratorBancada";

export interface DadosPacienteCapturados {
  prontuario: string; // normalizado sem zeros à esquerda (ex: "24087")
  prontuarioOriginal: string; // com zeros ou como veio (ex: "0024087")
  dataNascimento: string; // DD/MM/AAAA
  dataNascimentoDigitos: string; // 8 dígitos (ex: "23122025")
  textoCompleto: string;
}

interface EdtaOcrScannerProps {
  onDetectarPaciente: (dados: DadosPacienteCapturados) => void;
  ativo: boolean;
  pausado: boolean;
}

export const EdtaOcrScanner: React.FC<EdtaOcrScannerProps> = ({
  onDetectarPaciente,
  ativo,
  pausado,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tesseractWorkerRef = useRef<any>(null);

  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchDisponivel, setTorchDisponivel] = useState<boolean>(false);
  const [torchLigado, setTorchLigado] = useState<boolean>(false);
  const [ocrPronto, setOcrPronto] = useState<boolean>(false);
  const [statusTexto, setStatusTexto] = useState<string>("Iniciando câmera...");
  const [ultimoProntDetectado, setUltimoProntDetectado] = useState<string | null>(null);

  const isProcessingFrameRef = useRef<boolean>(false);
  const ultimoProntuarioRef = useRef<string>("");
  const ultimoHorarioRef = useRef<number>(0);
  const timerLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar o Worker do Tesseract.js uma única vez
  useEffect(() => {
    let montado = true;

    const carregarOcr = async () => {
      try {
        setStatusTexto("Preparando motor OCR...");
        const { createWorker } = await import("tesseract.js");
        if (!montado) return;

        const worker = await createWorker("por");
        if (!montado) {
          await worker.terminate();
          return;
        }

        // Parâmetros para velocidade máxima focando em documentos laboratoriais
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789/.-:ABCDEFGHIJLKMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ",
        });

        tesseractWorkerRef.current = worker;
        setOcrPronto(true);
        setStatusTexto("OCR pronto para leitura contínua");
      } catch (err) {
        console.warn("Falha ao inicializar Tesseract OCR em 'por', tentando modo padrão:", err);
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("eng");
          await worker.setParameters({
            tessedit_char_whitelist: "0123456789/.-:ABCDEFGHIJLKMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ",
          });
          if (montado) {
            tesseractWorkerRef.current = worker;
            setOcrPronto(true);
            setStatusTexto("OCR pronto para leitura contínua");
          }
        } catch (e) {
          console.error("Erro crítico ao inicializar Tesseract:", e);
        }
      }
    };

    carregarOcr();

    return () => {
      montado = false;
      if (tesseractWorkerRef.current) {
        try {
          tesseractWorkerRef.current.terminate();
        } catch (_) {}
        tesseractWorkerRef.current = null;
      }
    };
  }, []);

  // Iniciar e Parar Câmera
  const pararCamera = useCallback(() => {
    if (timerLoopRef.current) {
      clearInterval(timerLoopRef.current);
      timerLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const iniciarCamera = useCallback(async () => {
    setIsStarting(true);
    setCameraError(null);
    setStatusTexto("Acessando câmera traseira...");

    try {
      pararCamera();

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Verificar suporte a lanterna (Torch)
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as any;
        if (capabilities && "torch" in capabilities) {
          setTorchDisponivel(true);
        }
      }

      setIsStarting(false);
      setStatusTexto("Aponte para o bloco 'Dados do Paciente'");
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      setIsStarting(false);
      const msg =
        err.name === "NotAllowedError" || err.message?.includes("Permission")
          ? "Permissão da câmera negada. Permita o acesso nas configurações do navegador."
          : "Não foi possível acessar a câmera traseira do dispositivo.";
      setCameraError(msg);
    }
  }, [pararCamera]);

  useEffect(() => {
    if (ativo) {
      iniciarCamera();
    } else {
      pararCamera();
    }

    return () => {
      pararCamera();
    };
  }, [ativo, iniciarCamera, pararCamera]);

  // Alternar Lanterna
  const alternarTorch = async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const novoEstado = !torchLigado;
      await (track as any).applyConstraints({
        advanced: [{ torch: novoEstado }],
      });
      setTorchLigado(novoEstado);
    } catch (e) {
      console.warn("Erro ao alternar lanterna:", e);
    }
  };

  // Parser do texto capturado pelo OCR na folha de agendamento impressa
  const analisarTextoFolha = useCallback(
    (textoBruto: string): DadosPacienteCapturados | null => {
      if (!textoBruto || textoBruto.length < 5) return null;

      const texto = textoBruto.replace(/\r/g, " ");

      // 1. EXTRAÇÃO DE PRONTUÁRIO
      let prontuarioOriginal = "";
      let prontuarioNorm = "";

      // Regex 1: Busca termos explícitos como Prontuário, Pront, Cód, Matrícula
      const matchProntExplicito = texto.match(
        /(?:prontu[aá]rio|pront|c[oó]d(?:igo)?|matr[ií]cula|atend(?:imento)?|ficha)\s*[:\.\s#]*([0-9]{3,12})/i
      );

      if (matchProntExplicito && matchProntExplicito[1]) {
        prontuarioOriginal = matchProntExplicito[1].trim();
        prontuarioNorm = normalizarProntuario(prontuarioOriginal);
      } else {
        // Regex 2: Se não houver termo explícito, procura sequências numéricas de 5 a 8 dígitos (padrão de prontuários)
        const matchNumeros = texto.match(/\b([0-9]{5,8})\b/);
        if (matchNumeros && matchNumeros[1]) {
          prontuarioOriginal = matchNumeros[1].trim();
          prontuarioNorm = normalizarProntuario(prontuarioOriginal);
        }
      }

      if (!prontuarioNorm) return null;

      // 2. EXTRAÇÃO DE DATA DE NASCIMENTO
      let dataNascFormatada = "";
      let dataNascDigitos = "";

      // Regex 1: Busca termos explícitos como Nasc, Nascimento, Dt Nasc, DN
      const matchDataExplicita = texto.match(
        /(?:nasc(?:imento)?|dt\.?\s*nasc|data\s*de\s*nasc(?:imento)?|dn)\s*[:\.\s#]*([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-][0-9]{2,4})/i
      );

      if (matchDataExplicita && matchDataExplicita[1]) {
        dataNascFormatada = formatarDataNascimento(matchDataExplicita[1]);
        dataNascDigitos = normalizarDigitosData(dataNascFormatada);
      } else {
        // Regex 2: Qualquer data formato DD/MM/AAAA na folha
        const matchDataGeral = texto.match(
          /\b([0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-](?:19|20)[0-9]{2})\b/
        );
        if (matchDataGeral && matchDataGeral[1]) {
          dataNascFormatada = formatarDataNascimento(matchDataGeral[1]);
          dataNascDigitos = normalizarDigitosData(dataNascFormatada);
        }
      }

      return {
        prontuario: prontuarioNorm,
        prontuarioOriginal,
        dataNascimento: dataNascFormatada,
        dataNascimentoDigitos: dataNascDigitos,
        textoCompleto: texto,
      };
    },
    []
  );

  // Processamento Contínuo de Frame da Câmera
  const processarFrameOcr = useCallback(async () => {
    if (pausado || !ativo || isProcessingFrameRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    isProcessingFrameRef.current = true;

    try {
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;

      // Foco na Região de Interesse (ROI) central: 70% largura e 45% altura central
      const cropWidth = Math.floor(vWidth * 0.75);
      const cropHeight = Math.floor(vHeight * 0.45);
      const startX = Math.floor((vWidth - cropWidth) / 2);
      const startY = Math.floor((vHeight - cropHeight) / 2);

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        isProcessingFrameRef.current = false;
        return;
      }

      // Desenhar o recorte da ROI no canvas
      ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      // Pré-processamento de imagem: Escala de cinza e realce de contraste para papel impresso
      const imgData = ctx.getImageData(0, 0, cropWidth, cropHeight);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Luminância média
        const cinza = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Binarização suave / contraste
        const val = cinza < 125 ? 0 : 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);

      let textoReconhecido = "";

      // 1. Tentar ler se houver código de barras impresso no papel via BarcodeDetector nativo
      if ("BarcodeDetector" in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ["code_128", "code_39", "ean_13", "qr_code"],
          });
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes && barcodes.length > 0) {
            const rawCode = barcodes[0].rawValue;
            if (rawCode && /^\d+$/.test(rawCode.trim())) {
              textoReconhecido = `PRONTUARIO: ${rawCode.trim()}`;
            }
          }
        } catch (_) {}
      }

      // 2. Se não detectou código de barras nativo, executa OCR no Tesseract Worker
      if (!textoReconhecido && tesseractWorkerRef.current && ocrPronto) {
        const resultado = await tesseractWorkerRef.current.recognize(canvas);
        textoReconhecido = resultado?.data?.text || "";
      }

      // Analisar texto da folha
      if (textoReconhecido) {
        const dadosPaciente = analisarTextoFolha(textoReconhecido);

        if (dadosPaciente && dadosPaciente.prontuario) {
          const agora = Date.now();
          const pront = dadosPaciente.prontuario;

          // PROTEÇÃO CONTRA REPETIÇÃO (DEBOUNCE DE 3 SEGUNDOS):
          // Enquanto a mesma folha estiver sob a lente, bloqueia leituras duplicadas do mesmo prontuário
          if (
            pront === ultimoProntuarioRef.current &&
            agora - ultimoHorarioRef.current < 3000
          ) {
            isProcessingFrameRef.current = false;
            return;
          }

          ultimoProntuarioRef.current = pront;
          ultimoHorarioRef.current = agora;
          setUltimoProntDetectado(pront);

          // Disparar busca e processamento contínuo
          onDetectarPaciente(dadosPaciente);
        }
      }
    } catch (loopErr) {
      console.warn("Erro no frame do OCR:", loopErr);
    } finally {
      isProcessingFrameRef.current = false;
    }
  }, [pausado, ativo, ocrPronto, analisarTextoFolha, onDetectarPaciente]);

  // Loop de processamento de frame a cada 650ms
  useEffect(() => {
    if (timerLoopRef.current) {
      clearInterval(timerLoopRef.current);
      timerLoopRef.current = null;
    }

    if (ativo && !pausado && ocrPronto) {
      timerLoopRef.current = setInterval(() => {
        processarFrameOcr();
      }, 650);
    }

    return () => {
      if (timerLoopRef.current) {
        clearInterval(timerLoopRef.current);
        timerLoopRef.current = null;
      }
    };
  }, [ativo, pausado, ocrPronto, processarFrameOcr]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950 border-2 border-purple-500/50 shadow-xl">
      {/* Elemento de Vídeo */}
      <div className="relative w-full aspect-4/3 max-h-[300px] overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            pausado ? "opacity-30 blur-xs" : "opacity-100"
          }`}
        />

        {/* Canvas de processamento (invisível ao usuário) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* MIRA DE ENQUADRAMENTO DA FOLHA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <div className="relative w-[85%] h-[60%] border-2 border-purple-400/80 rounded-xl bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex flex-col justify-between p-2">
            {/* Cantos Estilizados */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-purple-400 rounded-tl" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-purple-400 rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-purple-400 rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-purple-400 rounded-br" />

            {/* Linha de Scanner Animada */}
            {!pausado && (
              <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent animate-pulse shadow-sm" />
            )}

            <div className="flex items-center justify-between text-[10px] font-bold text-purple-200 uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs w-fit mx-auto border border-purple-400/30">
              <ScanLine className="w-3 h-3 mr-1 text-purple-400 animate-spin" />
              <span>Dados do Paciente</span>
            </div>

            <div className="text-center text-[10px] font-medium text-slate-300 bg-slate-900/90 py-1 px-2 rounded backdrop-blur-xs border border-slate-700">
              Enquadre: <strong className="text-purple-300">Prontuário</strong> e <strong className="text-purple-300">Data de Nasc.</strong>
            </div>
          </div>
        </div>

        {/* ESTADO PAUSADO (AGUARDANDO CONFIRMAÇÃO DO CARD) */}
        {pausado && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 text-white z-20 p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400 flex items-center justify-center mb-2 animate-pulse">
              <Check className="w-6 h-6 text-purple-300" />
            </div>
            <p className="text-xs font-black text-purple-200">Amostra em confirmação no card</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Confirme no botão abaixo para reativar o scanner automaticamente
            </p>
          </div>
        )}

        {/* LOADING INICIAL */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white z-20 p-4">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <p className="text-xs font-bold text-slate-200">{statusTexto}</p>
          </div>
        )}

        {/* ERRO DE CÂMERA */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white z-20 p-4 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs font-semibold text-rose-200 mb-2">{cameraError}</p>
            <p className="text-[11px] text-slate-400">
              Utilize o campo manual logo acima para digitar prontuário e nascimento.
            </p>
          </div>
        )}
      </div>

      {/* BARRA INFERIOR DE CONTROLE E STATUS */}
      <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 flex items-center justify-between text-white text-[11px]">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className={`w-2 h-2 rounded-full ${pausado ? "bg-amber-400" : "bg-emerald-400 animate-ping"}`} />
          <span className="text-slate-300 truncate">
            {pausado
              ? "Pausa momentânea • Confirmando ação"
              : ultimoProntDetectado
              ? `Último lido: #${ultimoProntDetectado}`
              : "Leitura contínua ativa na pilha de folhas"}
          </span>
        </div>

        {torchDisponivel && (
          <button
            type="button"
            onClick={alternarTorch}
            className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
              torchLigado
                ? "bg-amber-400 text-slate-950 border-amber-300"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
            title="Alternar lanterna do celular"
          >
            {torchLigado ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ZapOff className="w-3.5 h-3.5" />}
            <span className="text-[10px]">Luz</span>
          </button>
        )}
      </div>
    </div>
  );
};
