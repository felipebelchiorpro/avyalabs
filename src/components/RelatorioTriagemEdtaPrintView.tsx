"use client";

import React from "react";
import { ItemTriagemEdta, LabConfig, DEFAULT_LAB_CONFIG } from "@/types/urinalise";

interface RelatorioTriagemEdtaPrintViewProps {
  itens: ItemTriagemEdta[];
  dataReferencia: string;
  horaEncerramento?: string;
  labConfig?: LabConfig;
  responsavelNome?: string;
  modoImpressao?: "ambos" | "interno" | "apoio";
}

export const RelatorioTriagemEdtaPrintView: React.FC<RelatorioTriagemEdtaPrintViewProps> = ({
  itens,
  dataReferencia,
  horaEncerramento,
  labConfig = DEFAULT_LAB_CONFIG,
  responsavelNome,
  modoImpressao = "ambos",
}) => {
  // Tubos que vão para o Apoio (Apenas Hemograma e Hemograma + Glicada fracionado)
  const tubosApoio = itens.filter(
    (item) => item.tipo_destino === "apenas_hemograma" || item.tipo_destino === "hemograma_glicada"
  );

  const totalFracionados = itens.filter(
    (item) => item.tipo_destino === "hemograma_glicada" || item.fracionado_glicada
  ).length;

  const totalRetidos = itens.filter(
    (item) => item.tipo_destino === "apenas_glicada" || item.status === "retido_bancada"
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

  const renderCabecalhoCaconde = (tituloPrincipal: string, subtituloLote: string, badgeTipo: string) => (
    <div className="border-b-2 border-slate-900 pb-2 mb-3">
      {/* LOGO PREFEITURA DE CACONDE CENTRALIZADA */}
      <div className="flex flex-col items-center justify-center text-center mb-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-caconde.jpg"
          alt="Prefeitura Municipal da Estância Climática de Caconde"
          className="h-16 w-auto object-contain mx-auto mb-1"
        />
        <h1 className="text-[12.5px] font-black uppercase tracking-tight text-slate-900 leading-tight">
          {labConfig.nomeInstituicao || "PREFEITURA MUNICIPAL DE CACONDE"}
        </h1>
        <p className="text-[9.5px] uppercase font-bold text-slate-700">
          {labConfig.subtitulo || "ESTÂNCIA CLIMÁTICA DE CACONDE • DEPARTAMENTO MUNICIPAL DE SAÚDE"}
        </p>
        <p className="text-[9.5px] text-slate-600 font-semibold">
          {labConfig.nomeLaboratorio || "LABORATÓRIO MUNICIPAL DE ANÁLISES CLÍNICAS"}
        </p>
      </div>

      {/* FAIXA DO RELATÓRIO */}
      <div className="text-center bg-slate-100 py-1.5 border border-slate-300 rounded relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
          {badgeTipo}
        </span>
        <h2 className="text-[12px] font-black text-slate-900 tracking-wide uppercase">
          {tituloPrincipal}
        </h2>
        <p className="text-[9px] font-semibold text-slate-700">
          {subtituloLote}
        </p>
      </div>
    </div>
  );

  return (
    <div className="hidden print:block w-full max-w-[210mm] mx-auto bg-white text-black p-4 font-sans text-xs">
      {/* ========================================================================= */}
      {/* RELATÓRIO 1: RETIDO NO LABORATÓRIO (CONTROLE INTERNO & PIPETAGEM)        */}
      {/* ========================================================================= */}
      {(modoImpressao === "ambos" || modoImpressao === "interno") && (
        <div className="w-full">
          {renderCabecalhoCaconde(
            "RELAÇÃO DE TRIAGEM EDTA — CONTROLE INTERNO DO LABORATÓRIO",
            "Acompanhamento de Pipetagem de Glicada e Destino de Tubos (Fica Retido no Laboratório)",
            "Uso Interno Lab"
          )}

          {/* METADADOS */}
          <div className="grid grid-cols-5 gap-2 text-[9.5px] bg-slate-50 p-2 border border-slate-200 rounded mb-3">
            <div>
              <span className="font-bold text-slate-500 uppercase block">Data da Rotina:</span>
              <span className="font-black text-slate-900 text-[10.5px]">{formatarData(dataReferencia)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block">Encerramento:</span>
              <span className="font-black text-slate-900 text-[10.5px]">{horaFinal}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block">Total Tubos EDTA:</span>
              <span className="font-black text-slate-900 text-[10.5px]">{itens.length} tubos</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block">Fracionados p/ Glicada:</span>
              <span className="font-black text-purple-900 text-[10.5px]">{totalFracionados} pipetados</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block">Retidos na Bancada:</span>
              <span className="font-black text-slate-900 text-[10.5px]">{totalRetidos} (Apenas Glicada)</span>
            </div>
          </div>

          {/* TABELA 1: DETALHAMENTO DE PIPETAGEM & DESTINO */}
          <table className="w-full border-collapse border border-slate-400 text-[9.5px] mb-4">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                <th className="py-1 px-1 border-r border-slate-300 text-center w-7 font-black">Nº</th>
                <th className="py-1 px-1.5 border-r border-slate-300 text-center w-18 font-black">Prontuário</th>
                <th className="py-1 px-2 border-r border-slate-300 text-left font-black">Nome Completo do Paciente</th>
                <th className="py-1 px-2 border-r border-slate-300 text-left w-36 font-black">Médico Solicitante</th>
                <th className="py-1 px-2 border-r border-slate-300 text-center w-40 font-black">Pipetagem / Fracionamento</th>
                <th className="py-1 px-1.5 border-r border-slate-300 text-center w-24 font-black">Destino</th>
                <th className="py-1 px-1 border-slate-400 text-center w-12 font-black">Visto</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-500 italic">
                    Nenhum tubo EDTA registrado nesta data.
                  </td>
                </tr>
              ) : (
                itens.map((item, index) => {
                  const ehFracionado =
                    item.tipo_destino === "hemograma_glicada" || item.fracionado_glicada;
                  const ehApenasGlicada = item.tipo_destino === "apenas_glicada";

                  return (
                    <tr
                      key={item.id || item.prontuario || index}
                      className={`border-b border-slate-300 ${
                        index % 2 === 1 ? "bg-slate-100/70" : "bg-white"
                      }`}
                    >
                      <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-slate-700">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="py-1 px-1.5 border-r border-slate-300 text-center font-black text-slate-900 font-mono">
                        {item.prontuario}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 font-bold uppercase text-slate-900">
                        {item.urgencia && (
                          <span className="inline-block bg-rose-600 text-white font-black text-[9px] px-1 py-0.5 rounded mr-1.5 tracking-wide border border-rose-700">
                            🚨 URGÊNCIA
                          </span>
                        )}
                        <span className={item.urgencia ? "text-rose-950 font-black" : "text-slate-900"}>
                          {item.nome_paciente}
                        </span>
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-slate-800 truncate max-w-[130px]">
                        {item.solicitante || "Dr(a). Clínico(a) Geral / UBS"}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                        {ehFracionado ? (
                          <span className="font-black text-purple-950 bg-purple-100 px-1 py-0.5 rounded border border-purple-300">
                            ⚠️ SIM — Pipetado 500 µL
                          </span>
                        ) : ehApenasGlicada ? (
                          <span className="text-slate-600 font-medium">
                            🟣 Retido Integral (Bancada)
                          </span>
                        ) : (
                          <span className="text-slate-600 font-normal">
                            NÃO (Integral ao Apoio)
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-1.5 border-r border-slate-300 text-center font-semibold">
                        {ehApenasGlicada ? (
                          <span className="text-slate-700">Bancada Local</span>
                        ) : (
                          <span className="text-blue-900">Grade Apoio</span>
                        )}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-[9px] text-emerald-800 font-bold">
                        {item.status === "pronto_grade" || item.colocado_grade ? "✓" : "[  ]"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* RODAPÉ DO RELATÓRIO INTERNO */}
          <div className="border border-slate-300 bg-slate-50 rounded p-2.5 mt-4">
            <div className="flex justify-between items-center text-[9.5px]">
              <div>
                <p className="font-bold text-slate-800">
                  Responsável pela Triagem e Pipetagem:
                </p>
                <p className="font-black text-slate-950 uppercase mt-0.5">
                  {responsavelNome || "Não informado (Procedimento de Bancada)"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">
                  Documento arquivado no Laboratório Municipal de Caconde.
                </p>
                <p className="font-bold text-slate-700">
                  Assinatura / Visto: ____________________________________
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUEBRA DE PÁGINA ENTRE OS DOIS RELATÓRIOS QUANDO FOR IMPRIMIR AMBOS */}
      {modoImpressao === "ambos" && (
        <div style={{ pageBreakBefore: "always", breakBefore: "page", height: "1px" }} className="my-6" />
      )}

      {/* ========================================================================= */}
      {/* RELATÓRIO 2: REMESSA AO APOIO (SOMENTE NOME, PRONTUÁRIO E MÉDICO)        */}
      {/* ========================================================================= */}
      {(modoImpressao === "ambos" || modoImpressao === "apoio") && (
        <div className="w-full">
          {renderCabecalhoCaconde(
            "RELAÇÃO DE HEMOGRAMAS ENCAMINHADOS AO LABORATÓRIO DE APOIO",
            "Guia de Remessa e Faturamento • Amostras Biológicas em Tubo EDTA (Tampa Roxa)",
            "Guia do Apoio"
          )}

          {/* METADADOS DA REMESSA */}
          <div className="grid grid-cols-4 gap-2 text-[9.5px] bg-slate-50 p-2 border border-slate-200 rounded mb-3">
            <div>
              <span className="font-bold text-slate-500 uppercase block">Data da Remessa:</span>
              <span className="font-black text-slate-900 text-[10.5px]">{formatarData(dataReferencia)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block">Hora de Fechamento:</span>
              <span className="font-black text-slate-900 text-[10.5px]">{horaFinal}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block">Total de Tubos na Grade:</span>
              <span className="font-black text-slate-900 text-[10.5px]">{tubosApoio.length} amostras</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase block">Origem do Envio:</span>
              <span className="font-black text-slate-900 text-[10.5px]">Lab. Municipal Caconde</span>
            </div>
          </div>

          {/* TABELA 2: LIMPA (SOMENTE PRONTUÁRIO, NOME COMPLETO E NOME DO MÉDICO) */}
          <table className="w-full border-collapse border border-slate-400 text-[10px] mb-4">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                <th className="py-1.5 px-1.5 border-r border-slate-300 text-center w-10 font-black">Nº</th>
                <th className="py-1.5 px-2 border-r border-slate-300 text-center w-24 font-black">Prontuário</th>
                <th className="py-1.5 px-3 border-r border-slate-300 text-left font-black">Nome Completo do Paciente</th>
                <th className="py-1.5 px-3 border-r border-slate-300 text-left w-56 font-black">Médico Solicitante</th>
                <th className="py-1.5 px-2 border-slate-400 text-center w-16 font-black">Check</th>
              </tr>
            </thead>
            <tbody>
              {tubosApoio.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                    Nenhum hemograma a ser enviado ao apoio nesta data.
                  </td>
                </tr>
              ) : (
                tubosApoio.map((item, index) => (
                  <tr
                    key={item.id || item.prontuario || index}
                    className={`border-b border-slate-300 ${
                      index % 2 === 1 ? "bg-slate-100/70" : "bg-white"
                    }`}
                  >
                    <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-bold text-slate-700">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-black text-slate-900 font-mono">
                      {item.prontuario}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-bold uppercase text-slate-900">
                      {item.urgencia && (
                        <span className="inline-block bg-rose-600 text-white font-black text-[9.5px] px-1.5 py-0.5 rounded mr-1.5 tracking-wide border border-rose-700">
                          🚨 URGÊNCIA
                        </span>
                      )}
                      <span className={item.urgencia ? "text-rose-950 font-black" : "text-slate-900"}>
                        {item.nome_paciente}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300 text-slate-800 font-medium">
                      {item.solicitante || "Dr(a). Clínico(a) Geral / UBS"}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <div className="w-4 h-4 border-2 border-slate-500 mx-auto rounded-xs" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* RODAPÉ COM ASSINATURAS DO LABORATÓRIO E DO FATURAMENTO/APOIO */}
          <div className="border border-slate-300 bg-slate-50 rounded p-3 mt-6">
            <div className="grid grid-cols-2 gap-8">
              {/* ENTREGA LAB */}
              <div className="text-center pt-8 border-t border-slate-400">
                <p className="font-black uppercase text-[10px] text-slate-900">
                  Entregue por (Laboratório de Caconde)
                </p>
                <p className="text-[9px] text-slate-600 font-bold uppercase">
                  {responsavelNome || "Responsável pela Triagem e Envio"}
                </p>
                <p className="text-[8.5px] text-slate-500 mt-1">
                  Data: {formatarData(dataReferencia)} às {horaFinal}
                </p>
              </div>

              {/* RECEBIMENTO APOIO */}
              <div className="text-center pt-8 border-t border-slate-400">
                <p className="font-black uppercase text-[10px] text-slate-900">
                  Recebido por (Faturamento / Apoio)
                </p>
                <p className="text-[9px] text-slate-600">
                  Conferência de Grade e Tubos Recebidos
                </p>
                <p className="text-[8.5px] text-slate-500 mt-1">
                  Assinatura / Matrícula: __________________________
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[8px] text-slate-500">
              Guia oficial de remessa e custódia de amostras biológicas para faturamento junto ao laboratório de apoio.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
