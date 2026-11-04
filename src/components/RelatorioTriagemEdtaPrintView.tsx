"use client";

import React from "react";
import { ItemTriagemEdta, LabConfig, DEFAULT_LAB_CONFIG } from "@/types/urinalise";
import { formatarDataNascimento } from "@/lib/extratorBancada";

interface RelatorioTriagemEdtaPrintViewProps {
  itens: ItemTriagemEdta[];
  dataReferencia: string;
  horaEncerramento?: string;
  labConfig?: LabConfig;
  responsavelNome?: string;
  tipoGuia?: "apoio" | "laboratorio" | "ambas";
}

export const RelatorioTriagemEdtaPrintView: React.FC<RelatorioTriagemEdtaPrintViewProps> = ({
  itens,
  dataReferencia,
  horaEncerramento,
  labConfig = DEFAULT_LAB_CONFIG,
  responsavelNome,
  tipoGuia = "ambas",
}) => {
  // Tubos destinados ao faturamento e envio ao Apoio na remessa de hoje
  // Exclui tubos retidos na bancada local para envio em outro dia
  const tubosApoio = itens.filter(
    (item) =>
      (item.tipo_destino === "apenas_hemograma" ||
        item.tipo_destino === "hemograma_glicada" ||
        item.tem_hemograma) &&
      item.enviar_hemograma_hoje !== false &&
      item.status !== "retido_envio_posterior" &&
      item.status !== "retido_bancada" &&
      (item.colocado_grade || item.status === "pronto_grade")
  );

  // Todos os tubos da rotina do laboratório (para a guia interna do laboratório)
  const tubosLaboratorio = itens.filter(
    (item) =>
      item.status !== "retido_bancada" &&
      (item.status === "pronto_grade" ||
        item.colocado_grade ||
        item.fracionado_glicada ||
        item.status === "retido_envio_posterior" ||
        item.tipo_destino === "apenas_hemograma" ||
        item.tipo_destino === "hemograma_glicada")
  );

  const totalFracionados = tubosLaboratorio.filter(
    (item) => item.tipo_destino === "hemograma_glicada" || item.fracionado_glicada
  ).length;

  const totalComVhs = tubosLaboratorio.filter((item) => item.tem_vhs).length;
  const totalDoisTubos = tubosLaboratorio.filter((item) => item.coletado_dois_tubos !== false).length;

  const formatarData = (dStr: string) => {
    if (!dStr) return new Date().toLocaleDateString("pt-BR");
    if (dStr.includes("-")) {
      const [ano, mes, dia] = dStr.split("-");
      return `${dia}/${mes}/${ano}`;
    }
    return dStr;
  };

  const horaFinal =
    horaEncerramento ||
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const renderCabecalhoInstitucional = () => (
    <div className="flex flex-col items-center justify-center text-center mb-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-caconde.jpg"
        alt="Prefeitura Municipal da Estância Climática de Caconde"
        className="h-14 w-auto object-contain mx-auto mb-1"
      />
      <h1 className="text-[12px] font-black uppercase tracking-tight text-slate-900 leading-tight">
        {labConfig.nomeInstituicao || "PREFEITURA MUNICIPAL DE CACONDE"}
      </h1>
      <p className="text-[9px] uppercase font-bold text-slate-700">
        {labConfig.subtitulo || "ESTÂNCIA CLIMÁTICA DE CACONDE • DEPARTAMENTO MUNICIPAL DE SAÚDE"}
      </p>
      <p className="text-[9px] text-slate-600 font-semibold">
        {labConfig.nomeLaboratorio || "LABORATÓRIO MUNICIPAL DE ANÁLISES CLÍNICAS"}
      </p>
    </div>
  );

  // =========================================================================
  // 1. GUIA APOIO (RELAÇÃO DE REMESSA EXTERNA PARA O FATURAMENTO DA TARDE)
  // Contém Nome, Data de Nascimento, Exame, Fracionado e Check [✓] p/ o Apoio
  // =========================================================================
  const renderGuiaApoio = () => (
    <div className="w-full">
      <div className="border-b-2 border-slate-900 pb-2 mb-3">
        {renderCabecalhoInstitucional()}

        <div className="text-center bg-slate-100 py-1.5 border border-slate-300 rounded">
          <h2 className="text-[13px] font-black text-slate-900 tracking-wider uppercase">
            GUIA APOIO
          </h2>
        </div>
      </div>

      {/* METADADOS DA REMESSA DO APOIO (SEM DADOS INTERNOS DE FRACIONAMENTO) */}
      <div className="grid grid-cols-3 gap-2 text-[9.5px] bg-slate-50 p-2 border border-slate-300 rounded mb-3">
        <div>
          <span className="font-bold text-slate-500 uppercase block">Data da Remessa:</span>
          <span className="font-black text-slate-900 text-[10.5px]">{formatarData(dataReferencia)}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Horário de Fechamento:</span>
          <span className="font-black text-slate-900 text-[10.5px]">{horaFinal}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Total de Tubos na Grade:</span>
          <span className="font-black text-slate-900 text-[10.5px]">{tubosApoio.length} amostras</span>
        </div>
      </div>

      {/* TABELA GUIA APOIO: APENAS DADOS DA REMESSA E CHECK P/ O APOIO */}
      <table className="w-full border-collapse border border-slate-400 text-[10px] mb-4">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
            <th className="py-2 px-1.5 border-r border-slate-300 text-center w-10 font-black">Nº</th>
            <th className="py-2 px-3 border-r border-slate-300 text-left font-black">Nome Completo do Paciente</th>
            <th className="py-2 px-2 border-r border-slate-300 text-center w-32 font-black">Data de Nascimento</th>
            <th className="py-2 px-2 border-r border-slate-300 text-center w-36 font-black">Exame Solicitado</th>
            <th className="py-2 px-1.5 border-slate-400 text-center w-16 font-black">Check [✓]</th>
          </tr>
        </thead>
        <tbody>
          {tubosApoio.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                Nenhum hemograma a ser enviado ao apoio nesta data.
              </td>
            </tr>
          ) : (
            tubosApoio.map((item, index) => {
              const rawDn = (item.data_nascimento && item.data_nascimento.trim()) || (
                item.data_nascimento_digitos && item.data_nascimento_digitos.length === 8
                  ? `${item.data_nascimento_digitos.slice(0, 2)}/${item.data_nascimento_digitos.slice(2, 4)}/${item.data_nascimento_digitos.slice(4)}`
                  : ""
              );
              const dnFormatada = rawDn ? formatarDataNascimento(rawDn) : "—";

              return (
                <tr
                  key={item.id || item.prontuario || index}
                  className={`border-b border-slate-300 ${
                    index % 2 === 1 ? "bg-slate-100/70" : "bg-white"
                  }`}
                >
                  <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-bold text-slate-700">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold uppercase text-slate-900">
                    {item.urgencia && (
                      <span className="inline-block bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded mr-1.5 tracking-wide border border-rose-700">
                        🚨 URGÊNCIA
                      </span>
                    )}
                    <span>{item.nome_paciente}</span>
                  </td>

                  <td className="py-1.5 px-2 border-r border-slate-300 text-center font-black text-slate-950 font-mono text-[10.5px]">
                    {dnFormatada}
                  </td>

                  <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold text-slate-800">
                    HEMOGRAMA
                  </td>

                  {/* Campo para o Lab Apoio fazer o Check */}
                  <td className="py-1.5 px-1.5 text-center">
                    <span className="inline-block w-4 h-4 border-2 border-slate-900 rounded bg-white" />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* RODAPÉ GUIA APOIO: APENAS CONFERÊNCIA E NOME */}
      <div className="border border-slate-300 bg-slate-50 rounded p-3 mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <div>
            <span className="font-bold text-slate-600 uppercase">Conferência: </span>
            <span className="font-black text-slate-900 uppercase">
              {responsavelNome || "Operador Responsável"}
            </span>
          </div>
          <div className="text-slate-600 text-[10.5px]">
            <span>Data da Conferência: </span>
            <span className="font-black text-slate-900">
              {formatarData(dataReferencia)} às {horaFinal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // 2. GUIA LAB (CONTROLE INTERNO DE BANCADA, VHS E 2 TUBOS)
  // Contém Prontuário, VHS, 2 Tubos Coletados e Caixinha de [ ] Check Físico
  // =========================================================================
  const renderGuiaLaboratorio = () => (
    <div className="w-full">
      <div className="border-b-2 border-slate-900 pb-2 mb-3">
        {renderCabecalhoInstitucional()}

        <div className="text-center bg-slate-100 py-1.5 border border-slate-300 rounded">
          <h2 className="text-[13px] font-black text-slate-900 tracking-wide uppercase">
            GUIA LAB
          </h2>
        </div>
      </div>

      {/* METADADOS DA BANCADA INTERNA */}
      <div className="grid grid-cols-5 gap-2 text-[9px] bg-slate-50 p-2 border border-slate-300 rounded mb-3">
        <div>
          <span className="font-bold text-slate-500 uppercase block">Data da Rotina:</span>
          <span className="font-black text-slate-900 text-[10px]">{formatarData(dataReferencia)}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Horário Fechamento:</span>
          <span className="font-black text-slate-900 text-[10px]">{horaFinal}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Amostras c/ VHS:</span>
          <span className="font-black text-slate-900 text-[10px]">
            {totalComVhs} pac. ({totalDoisTubos} c/ 2 tubos)
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Glicadas Fracionadas:</span>
          <span className="font-black text-purple-900 text-[10px]">
            {totalFracionados} alíquotas
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Total Bancada:</span>
          <span className="font-black text-emerald-900 text-[10px]">
            {tubosLaboratorio.length} pacientes
          </span>
        </div>
      </div>

      {/* TABELA INTERNA DO LABORATÓRIO: COM PRONTUÁRIO, VHS, 2 TUBOS E CAIXINHA DE CHECK */}
      <table className="w-full border-collapse border border-slate-400 text-[9.5px] mb-4">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
            <th className="py-2 px-1 border-r border-slate-300 text-center w-8 font-black">Nº</th>
            <th className="py-2 px-2 border-r border-slate-300 text-center w-20 font-black">Prontuário</th>
            <th className="py-2 px-2 border-r border-slate-300 text-left font-black">Nome do Paciente</th>
            <th className="py-2 px-1.5 border-r border-slate-300 text-center w-24 font-black">Data Nasc.</th>
            <th className="py-2 px-1.5 border-r border-slate-300 text-center w-14 font-black">VHS?</th>
            <th className="py-2 px-1.5 border-r border-slate-300 text-center w-20 font-black">Coleta</th>
            <th className="py-2 px-1.5 border-r border-slate-300 text-center w-22 font-black">Fracionado?</th>
            <th className="py-2 px-1.5 border-slate-400 text-center w-14 font-black">Check [✓]</th>
          </tr>
        </thead>
        <tbody>
          {tubosLaboratorio.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                Nenhum tubo EDTA registrado na rotina de hoje.
              </td>
            </tr>
          ) : (
            tubosLaboratorio.map((item, index) => {
              const foiFracionado =
                item.tipo_destino === "hemograma_glicada" || item.fracionado_glicada;
              const rawDn = (item.data_nascimento && item.data_nascimento.trim()) || (
                item.data_nascimento_digitos && item.data_nascimento_digitos.length === 8
                  ? `${item.data_nascimento_digitos.slice(0, 2)}/${item.data_nascimento_digitos.slice(2, 4)}/${item.data_nascimento_digitos.slice(4)}`
                  : ""
              );
              const dnFormatada = rawDn ? formatarDataNascimento(rawDn) : "—";
              const coletouDois = item.coletado_dois_tubos !== false;

              return (
                <tr
                  key={`lab-${item.id || item.prontuario || index}`}
                  className={`border-b border-slate-300 ${
                    index % 2 === 1 ? "bg-slate-100/70" : "bg-white"
                  }`}
                >
                  <td className="py-1.5 px-1 border-r border-slate-300 text-center font-bold text-slate-700">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-800">
                    {item.prontuario}
                  </td>

                  <td className="py-1.5 px-2 border-r border-slate-300 font-bold uppercase text-slate-900">
                    {item.urgencia && (
                      <span className="inline-block bg-rose-600 text-white font-black text-[8px] px-1 py-0.2 rounded mr-1">
                        URG
                      </span>
                    )}
                    <span>{item.nome_paciente}</span>
                  </td>

                  <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-950 text-[10px]">
                    {dnFormatada}
                  </td>

                  <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-bold">
                    {item.tem_vhs ? (
                      <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[8.5px] font-black">
                        SIM
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[8.5px]">—</span>
                    )}
                  </td>

                  <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-bold">
                    {coletouDois ? (
                      <span className="text-emerald-700 font-black text-[9px]">2 Tubos</span>
                    ) : (
                      <span className="text-amber-800 font-bold text-[9px]">1 Tubo</span>
                    )}
                  </td>

                  <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-bold">
                    {foiFracionado ? (
                      <span className="text-purple-900 font-black text-[9px]">SIM (500 µL)</span>
                    ) : (
                      <span className="text-slate-500 text-[9px]">Integral</span>
                    )}
                  </td>

                  {/* Caixinha de conferência física à caneta para o operador */}
                  <td className="py-1.5 px-1.5 text-center">
                    <span className="inline-block w-4 h-4 border-2 border-slate-900 rounded bg-white" />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* RODAPÉ GUIA LAB: APENAS CONFERÊNCIA E NOME */}
      <div className="border border-slate-300 bg-slate-50 rounded p-3 mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <div>
            <span className="font-bold text-slate-600 uppercase">Conferência: </span>
            <span className="font-black text-slate-900 uppercase">
              {responsavelNome || "Operador Responsável"}
            </span>
          </div>
          <div className="text-slate-600 text-[10.5px]">
            <span>Data da Conferência: </span>
            <span className="font-black text-slate-900">
              {formatarData(dataReferencia)} às {horaFinal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hidden print:block w-full max-w-[210mm] mx-auto bg-white text-black p-4 font-sans text-xs">
      {tipoGuia === "apoio" && renderGuiaApoio()}

      {tipoGuia === "laboratorio" && renderGuiaLaboratorio()}

      {tipoGuia === "ambas" && (
        <>
          {renderGuiaApoio()}
          <div
            className="hidden print:block break-before-page page-break-before my-8"
            style={{ pageBreakBefore: "always" }}
          />
          {renderGuiaLaboratorio()}
        </>
      )}
    </div>
  );
};
