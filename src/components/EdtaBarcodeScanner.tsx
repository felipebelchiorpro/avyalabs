"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RefreshCw, AlertCircle } from "lucide-react";

interface EdtaBarcodeScannerProps {
  onScan: (decodedText: string) => void;
  ativo: boolean;
}

export const EdtaBarcodeScanner: React.FC<EdtaBarcodeScannerProps> = ({ onScan, ativo }) => {
  const scannerRef = useRef<any>(null);
  const containerId = "edta-camera-stream";
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    if (!ativo) {
      pararScanner();
      return;
    }

    const iniciarScanner = async () => {
      setIsStarting(true);
      setCameraError(null);

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted) return;

        // Se já houver instância rodando, para primeiro
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (_) {}
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.333,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            const agora = Date.now();
            // Debounce de 1.8s para evitar leituras repetidas imediatas do mesmo código
            if (
              decodedText === lastScannedCodeRef.current &&
              agora - lastScannedTimeRef.current < 1800
            ) {
              return;
            }

            lastScannedCodeRef.current = decodedText;
            lastScannedTimeRef.current = agora;
            onScan(decodedText);
          },
          () => {
            // Callback de frame sem código (ignorado)
          }
        );

        if (mounted) {
          setIsScanning(true);
          setIsStarting(false);
        }
      } catch (err: any) {
        console.error("Erro ao iniciar leitor de código de barras:", err);
        if (mounted) {
          setIsStarting(false);
          setIsScanning(false);
          const msg =
            err.name === "NotAllowedError" || err.message?.includes("Permission")
              ? "Permissão da câmera negada. Permita o acesso nas configurações do navegador."
              : "Não foi possível acessar a câmera traseira do dispositivo.";
          setCameraError(msg);
        }
      }
    };

    iniciarScanner();

    return () => {
      mounted = false;
      pararScanner();
    };
  }, [ativo]);

  const pararScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn("Erro ao parar scanner:", e);
      }
      scannerRef.current = null;
      setIsScanning(false);
      setIsStarting(false);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border-2 border-purple-400/40 shadow-inner">
      <div id={containerId} className="w-full min-h-[220px] max-h-[300px]" />

      {isStarting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white z-10 p-4">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-2" />
          <p className="text-xs font-semibold text-slate-300">Iniciando câmera traseira...</p>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white z-10 p-4 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
          <p className="text-xs font-medium text-rose-200 mb-3">{cameraError}</p>
          <p className="text-[11px] text-slate-400">
            Você pode utilizar o modo de digitação manual de prontuário abaixo.
          </p>
        </div>
      )}

      {isScanning && !cameraError && (
        <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-10">
          <span className="bg-slate-900/90 text-purple-300 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-500/40 shadow">
            Aponte para o código de barras do tubo EDTA
          </span>
        </div>
      )}
    </div>
  );
};

