'use client';

import { useState } from 'react';

export default function BarraAcoesTiragem() {
  const [exportando, setExportando] = useState(false);

  const handleExportarParaExtensao = async () => {
    setExportando(true);
    try {
      // Requisição para buscar os dados do dia e formatar para a extensão
      const res = await fetch('/api/laudos-dia');
      const dados = await res.json();

      // Formato JSON pronto para a extensão de urinálise capturar/importar
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dados, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `urinalise-extensao-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error("Erro ao exportar dados para a extensão:", error);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/[0.02] border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Tiragem do Dia</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Ativo</span>
        </h2>
        <p className="text-xs text-slate-400">Gerenciamento de exames de urina, rápidos e rotina de atendimento.</p>
      </div>

      <div className="flex items-center gap-3">
        {/* BOTÃO DE EXPORTAÇÃO PARA A EXTENSÃO DE URINÁLISE */}
        <button
          onClick={handleExportarParaExtensao}
          disabled={exportando}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-lg shadow-cyan-500/5 disabled:opacity-50 cursor-pointer active:scale-95"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>{exportando ? 'Exportando...' : 'Exportar para Extensão Urinálise'}</span>
        </button>
      </div>
    </div>
  );
}
