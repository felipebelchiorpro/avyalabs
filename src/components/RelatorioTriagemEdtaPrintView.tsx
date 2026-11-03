"use client";

import React from "react";
import { ItemTriagemEdta, LabConfig, DEFAULT_LAB_CONFIG } from "@/types/urinalise";

interface RelatorioTriagemEdtaPrintViewProps {
  itens: ItemTriagemEdta[];
  dataReferencia: string;
  horaEncerramento?: string;
  labConfig?: LabConfig;
  responsavelNome?: string;
}

export const RelatorioTriagemEdtaPrintView: React.FC<RelatorioTriagemEdtaPrintViewProps> = ({
  itens,
  dataReferencia,
  horaEncerramento,
  labConfig = DEFAULT_LAB_CONFIG,
  responsavelNome,
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

  const totalFracionados = tubosApoio.filter(
    (item) => item.tipo_destino === "hemograma_glicada" || item.fracionado_glicada
  ).length;

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

  return (
    <div className="hidden print:block w-full max-w-[210mm] mx-auto bg-white text-black p-4 font-sans text-xs">
      {/* ========================================================================= */}
      {/* RELATÓRIO OFICIAL: RELAÇÃO DE HEMOGRAMAS PARA FATURAMENTO E ENVIO AO APOIO */}
      {/* ========================================================================= */}
      <div className="w-full">
        {/* CABEÇALHO INSTITUCIONAL */}
        <div className="border-b-2 border-slate-900 pb-2 mb-3">
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

          {/* FAIXA DO RELATÓRIO */}
          <div className="text-center bg-slate-100 py-1.5 border border-slate-300 rounded relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase bg-purple-900 text-white px-2 py-0.5 rounded">
              Apoio / Remessa
            </span>
            <h2 className="text-[12px] font-black text-slate-900 tracking-wide uppercase">
              RELAÇÃO DE HEMOGRAMAS PARA FATURAMENTO E ENVIO AO APOIO
            </h2>
            <p className="text-[9px] font-semibold text-slate-700">
              Triagem de Tubos EDTA (Tampa Roxa) • Remessa da Tarde para Processamento Externo
            </p>
          </div>
        </div>

        {/* METADADOS DA REMESSA */}
        <div className="grid grid-cols-4 gap-2 text-[9.5px] bg-slate-50 p-2 border border-slate-300 rounded mb-3">
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
          <div>
            <span className="font-bold text-slate-500 uppercase block">Glicadas Fracionadas:</span>
            <span className="font-black text-purple-900 text-[10.5px]">{totalFracionados} alíquotas</span>
          </div>
        </div>

        {/* TABELA ZEBRADA: NOME COMPLETO, DATA DE NASCIMENTO (EM VEZ DO PRONTUÁRIO), EXAME E FRACIONADO */}
        <table className="w-full border-collapse border border-slate-400 text-[10px] mb-4">
          <thead>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
              <th className="py-2 px-1.5 border-r border-slate-300 text-center w-10 font-black">Nº</th>
              <th className="py-2 px-3 border-r border-slate-300 text-left font-black">Nome Completo do Paciente</th>
              <th className="py-2 px-2 border-r border-slate-300 text-center w-36 font-black">Data de Nascimento</th>
              <th className="py-2 px-2 border-r border-slate-300 text-center w-32 font-black">Exame Solicitado</th>
              <th className="py-2 px-2 border-slate-400 text-center w-36 font-black">Fracionado p/ Glicada?</th>
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
                const foiFracionado =
                  item.tipo_destino === "hemograma_glicada" || item.fracionado_glicada;

                return (
                  <tr
                    key={item.id || item.prontuario || index}
                    className={`border-b border-slate-300 ${
                      index % 2 === 1 ? "bg-slate-100/70" : "bg-white"
                    }`}
                  >
                    {/* Nº Sequencial */}
                    <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-bold text-slate-700">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* Nome Completo do Paciente */}
                    <td className="py-1.5 px-3 border-r border-slate-300 font-bold uppercase text-slate-900">
                      {item.urgencia && (
                        <span className="inline-block bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded mr-1.5 tracking-wide border border-rose-700">
                          🚨 URGÊNCIA
                        </span>
                      )}
                      <span>{item.nome_paciente}</span>
                    </td>

                    {/* Data de Nascimento em Destaque (substituindo prontuário para busca direta pelo Apoio) */}
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-black text-slate-950 font-mono text-[10.5px]">
                      {item.data_nascimento || "—"}
                    </td>

                    {/* Exame */}
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold text-slate-800">
                      HEMOGRAMA
                    </td>

                    {/* Indicação se foi Fracionado para Glicada (Sim/Não) */}
                    <td className="py-1.5 px-2 text-center font-bold">
                      {foiFracionado ? (
                        <span className="inline-block bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded text-[9px] font-black">
                          SIM (500 µL)
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[9.5px]">NÃO (Integral)</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* RODAPÉ COM CAMPOS DE ASSINATURA */}
        <div className="border border-slate-300 bg-slate-50 rounded p-3 mt-4">
          <div className="grid grid-cols-2 gap-8">
            {/* ASSINATURA DO RESPONSÁVEL PELA TRIAGEM */}
            <div className="text-center pt-8 border-t border-slate-400">
              <p className="font-black uppercase text-[10px] text-slate-900">
                Responsável pela Triagem (Laboratório Municipal)
              </p>
              <p className="text-[9.5px] text-slate-700 font-bold uppercase mt-0.5">
                {responsavelNome || "Responsável Técnico / Operador"}
              </p>
              <p className="text-[8.5px] text-slate-500 mt-1">
                Data: {formatarData(dataReferencia)} às {horaFinal}
              </p>
              <p className="text-[9px] text-slate-600 font-semibold mt-2">
                Assinatura: _________________________________________
              </p>
            </div>

            {/* ASSINATURA DO RECEBEDOR DA TARDE (FATURAMENTO DO APOIO) */}
            <div className="text-center pt-8 border-t border-slate-400">
              <p className="font-black uppercase text-[10px] text-slate-900">
                Recebedor da Tarde (Faturamento / Apoio)
              </p>
              <p className="text-[9px] text-slate-600">
                Conferência de Grade e Tubos Recebidos
              </p>
              <p className="text-[8.5px] text-slate-500 mt-1">
                Data do Recebimento: ____/____/________
              </p>
              <p className="text-[9px] text-slate-600 font-semibold mt-2">
                Assinatura / Matrícula: _______________________________
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[8px] text-slate-500">
            Documento emitido pelo Sistema de Automação Laboratorial • Laboratório Municipal de Caconde • SUS
          </div>
        </div>
      </div>
    </div>
  );
};
