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
  // Exclui tubos retidos na bancada local para envio em outro dia e exclui pacientes com apenas glicada (não vão ao apoio)
  const tubosApoio = itens.filter(
    (item) =>
      item.tipo_destino !== "apenas_glicada" &&
      (item.tipo_destino === "apenas_hemograma" ||
        item.tipo_destino === "hemograma_glicada" ||
        item.tem_hemograma) &&
      item.enviar_hemograma_hoje !== false &&
      item.status !== "retido_envio_posterior" &&
      item.status !== "retido_bancada" &&
      (item.colocado_grade || item.status === "pronto_grade")
  );

  // Todos os tubos da rotina do laboratório (para a guia interna do laboratório)
  // Pacientes com apenas glicada são dosados internamente e não entram no relatório de remessa/faturamento
  const tubosLaboratorio = itens.filter(
    (item) =>
      item.tipo_destino !== "apenas_glicada" &&
      item.status !== "retido_bancada" &&
      (item.status === "pronto_grade" ||
        item.colocado_grade ||
        item.fracionado_glicada ||
        item.status === "retido_envio_posterior" ||
        item.tipo_destino === "apenas_hemograma" ||
        item.tipo_destino === "hemograma_glicada")
  );

  const totalFracionados = tubosLaboratorio.filter(
    (item) => item.tipo_destino === "hemograma_glicada" || item.fracionado_glicada || (item.tem_hemograma && item.tem_glicada)
  ).length;

  const totalComVhs = tubosLaboratorio.filter((item) => item.tem_vhs).length;

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
        className="h-12 w-auto object-contain mx-auto mb-1"
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
  // 1. RELATÓRIO DE ENVIO PARA O APOIO (FATURAMENTO)
  // Layout limpo e otimizado em modo PAISAGEM (landscape) para acompanhar os tubos.
  // Colunas obrigatórias na tabela:
  // 1. Nº Sequencial
  // 2. Nome Completo do Paciente
  // 3. Data de Nascimento
  // 4. Médico Solicitante (com suporte à edição manual feita na bancada)
  // *Nota: O prontuário interno e a indicação de glicada/fracionamento NÃO devem aparecer neste relatório.
  // =========================================================================
  const renderGuiaApoio = () => (
    <div className="w-full">
      <div className="border-b-2 border-slate-900 pb-2 mb-2">
        {renderCabecalhoInstitucional()}

        <div className="text-center bg-slate-100 py-1.5 border border-slate-300 rounded">
          <h2 className="text-[13px] font-black text-slate-900 tracking-wider uppercase">
            RELAÇÃO DE REMESSA DE TUBOS EDTA • LABORATÓRIO DE APOIO (FATURAMENTO)
          </h2>
        </div>
      </div>

      {/* METADADOS DA REMESSA DO APOIO (SEM PRONTUÁRIO INTERNO E SEM FRACIONAMENTO) */}
      <div className="grid grid-cols-4 gap-2 text-[9.5px] bg-slate-50 p-2 border border-slate-300 rounded mb-3">
        <div>
          <span className="font-bold text-slate-500 uppercase block">Data da Remessa:</span>
          <span className="font-black text-slate-900 text-[11px]">{formatarData(dataReferencia)}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Horário de Fechamento:</span>
          <span className="font-black text-slate-900 text-[11px]">{horaFinal}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Exame dos Tubos:</span>
          <span className="font-black text-blue-900 text-[11px]">HEMOGRAMA COMPLETO</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Total de Tubos na Grade:</span>
          <span className="font-black text-slate-900 text-[11px]">{tubosApoio.length} amostras</span>
        </div>
      </div>

      {/* TABELA DE APOIO: Nº, NOME COMPLETO, DATA DE NASCIMENTO, MÉDICO SOLICITANTE E CHECK */}
      <table className="w-full border-collapse border border-slate-400 text-[10px] mb-3">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
            <th className="py-2 px-2 border-r border-slate-300 text-center w-12 font-black">Nº</th>
            <th className="py-2 px-3 border-r border-slate-300 text-left font-black">Nome Completo do Paciente</th>
            <th className="py-2 px-2 border-r border-slate-300 text-center w-36 font-black">Data de Nascimento</th>
            <th className="py-2 px-3 border-r border-slate-300 text-left font-black">Médico Solicitante</th>
            <th className="py-2 px-2 border-slate-400 text-center w-16 font-black">Check [✓]</th>
          </tr>
        </thead>
        <tbody>
          {tubosApoio.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-500 italic text-[11px]">
                Nenhum tubo de hemograma a ser enviado ao apoio nesta data.
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
              const medicoSolicitante =
                item.solicitante && item.solicitante.trim()
                  ? item.solicitante.trim()
                  : "Dr(a). Clínico(a) Geral / UBS";

              return (
                <tr
                  key={item.id || item.prontuario || index}
                  className={`border-b border-slate-300 ${
                    index % 2 === 1 ? "bg-slate-100/70" : "bg-white"
                  }`}
                >
                  <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold text-slate-700">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold uppercase text-slate-900 text-[10.5px]">
                    {item.urgencia && (
                      <span className="inline-block bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded mr-1.5 tracking-wide border border-rose-700">
                        🚨 URGÊNCIA
                      </span>
                    )}
                    <span>{item.nome_paciente}</span>
                  </td>

                  <td className="py-1.5 px-2 border-r border-slate-300 text-center font-black text-slate-950 font-mono text-[11px]">
                    {dnFormatada}
                  </td>

                  <td className="py-1.5 px-3 border-r border-slate-300 font-semibold uppercase text-slate-800 text-[10px]">
                    {medicoSolicitante}
                  </td>

                  {/* Campo para o Lab Apoio fazer o Check do Tubo Físico */}
                  <td className="py-1.5 px-2 text-center">
                    <span className="inline-block w-4 h-4 border-2 border-slate-900 rounded bg-white" />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* RODAPÉ GUIA APOIO: APENAS CONFERÊNCIA E NOME */}
      <div className="border border-slate-300 bg-slate-50 rounded p-2.5 mt-2">
        <div className="flex items-center justify-between text-[10.5px]">
          <div>
            <span className="font-bold text-slate-600 uppercase">Conferência / Responsável do Envio: </span>
            <span className="font-black text-slate-900 uppercase">
              {responsavelNome || "Operador Responsável"}
            </span>
          </div>
          <div className="text-slate-600">
            <span>Data e Hora da Remessa: </span>
            <span className="font-black text-slate-900">
              {formatarData(dataReferencia)} às {horaFinal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // 2. RELATÓRIO INTERNO DO LABORATÓRIO (CONTROLE DE BANCADA)
  // Layout para uso interno da equipe.
  // Colunas obrigatórias na tabela:
  // 1. Nº Sequencial
  // 2. Prontuário
  // 3. Nome Completo do Paciente
  // 4. Data de Nascimento
  // 5. Indicativo de Fracionamento / Glicada (Sim/Não)
  // *Nota: O médico solicitante NÃO deve aparecer neste relatório.
  // =========================================================================
  const renderGuiaLaboratorio = () => (
    <div className="w-full">
      <div className="border-b-2 border-slate-900 pb-2 mb-2">
        {renderCabecalhoInstitucional()}

        <div className="text-center bg-slate-100 py-1.5 border border-slate-300 rounded">
          <h2 className="text-[13px] font-black text-slate-900 tracking-wide uppercase">
            CONTROLE INTERNO DE BANCADA • TRIAGEM EDTA E FRACIONAMENTO
          </h2>
        </div>
      </div>

      {/* METADADOS DA BANCADA INTERNA */}
      <div className="grid grid-cols-4 gap-2 text-[9px] bg-slate-50 p-2 border border-slate-300 rounded mb-3">
        <div>
          <span className="font-bold text-slate-500 uppercase block">Data da Rotina:</span>
          <span className="font-black text-slate-900 text-[10px]">{formatarData(dataReferencia)}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Horário Fechamento:</span>
          <span className="font-black text-slate-900 text-[10px]">{horaFinal}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Glicadas Fracionadas:</span>
          <span className="font-black text-purple-900 text-[10px]">
            {totalFracionados} alíquotas (500 µL)
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase block">Total Bancada EDTA:</span>
          <span className="font-black text-emerald-900 text-[10px]">
            {tubosLaboratorio.length} pacientes
          </span>
        </div>
      </div>

      {/* TABELA INTERNA DO LABORATÓRIO:
          1. Nº Sequencial
          2. Prontuário
          3. Nome Completo do Paciente
          4. Data de Nascimento
          5. Indicativo de Fracionamento / Glicada (Sim/Não)
          (Sem médico solicitante)
      */}
      <table className="w-full border-collapse border border-slate-400 text-[9.5px] mb-3">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
            <th className="py-2 px-1 border-r border-slate-300 text-center w-8 font-black">Nº</th>
            <th className="py-2 px-2 border-r border-slate-300 text-center w-24 font-black">Prontuário</th>
            <th className="py-2 px-2 border-r border-slate-300 text-left font-black">Nome Completo do Paciente</th>
            <th className="py-2 px-1.5 border-r border-slate-300 text-center w-28 font-black">Data de Nascimento</th>
            <th className="py-2 px-2 border-r border-slate-300 text-center w-36 font-black">
              Fracionamento / Glicada
            </th>
            <th className="py-2 px-1 border-slate-400 text-center w-12 font-black">Check [✓]</th>
          </tr>
        </thead>
        <tbody>
          {tubosLaboratorio.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-500 italic text-[11px]">
                Nenhum tubo EDTA registrado na rotina de hoje.
              </td>
            </tr>
          ) : (
            tubosLaboratorio.map((item, index) => {
              const temGlicada =
                item.tipo_destino === "hemograma_glicada" ||
                item.fracionado_glicada ||
                (item.tem_hemograma && item.tem_glicada);

              const rawDn = (item.data_nascimento && item.data_nascimento.trim()) || (
                item.data_nascimento_digitos && item.data_nascimento_digitos.length === 8
                  ? `${item.data_nascimento_digitos.slice(0, 2)}/${item.data_nascimento_digitos.slice(2, 4)}/${item.data_nascimento_digitos.slice(4)}`
                  : ""
              );
              const dnFormatada = rawDn ? formatarDataNascimento(rawDn) : "—";

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

                  <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-900 text-[10px]">
                    {item.prontuario}
                  </td>

                  <td className="py-1.5 px-2 border-r border-slate-300 font-bold uppercase text-slate-900">
                    {item.urgencia && (
                      <span className="inline-block bg-rose-600 text-white font-black text-[8px] px-1 py-0.2 rounded mr-1">
                        URG
                      </span>
                    )}
                    <span>{item.nome_paciente}</span>
                    {item.tem_vhs && (
                      <span className="ml-1.5 inline-block text-[8px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1 rounded">
                        VHS
                      </span>
                    )}
                  </td>

                  <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-950 text-[10.5px]">
                    {dnFormatada}
                  </td>

                  {/* Indicativo de Fracionamento / Glicada (Sim / Não) */}
                  <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold">
                    {temGlicada ? (
                      <span className="inline-block bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded text-[9px] font-black">
                        SIM (500 µL)
                      </span>
                    ) : (
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                        NÃO (Integral)
                      </span>
                    )}
                  </td>

                  {/* Caixinha de conferência física à caneta para o operador */}
                  <td className="py-1.5 px-1 text-center">
                    <span className="inline-block w-4 h-4 border-2 border-slate-900 rounded bg-white" />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* RODAPÉ GUIA LAB: APENAS CONFERÊNCIA E NOME */}
      <div className="border border-slate-300 bg-slate-50 rounded p-2.5 mt-2">
        <div className="flex items-center justify-between text-[10.5px]">
          <div>
            <span className="font-bold text-slate-600 uppercase">Operador Responsável da Bancada: </span>
            <span className="font-black text-slate-900 uppercase">
              {responsavelNome || "Operador Responsável"}
            </span>
          </div>
          <div className="text-slate-600">
            <span>Data e Hora de Fechamento: </span>
            <span className="font-black text-slate-900">
              {formatarData(dataReferencia)} às {horaFinal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Injeção dinâmica de CSS @page para respeitar modo paisagem no Apoio e retrato no Lab */}
      {tipoGuia === "apoio" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 landscape !important;
                  margin: 8mm 10mm 10mm 10mm !important;
                }
              }
            `,
          }}
        />
      )}

      {tipoGuia === "laboratorio" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait !important;
                  margin: 10mm 12mm 12mm 12mm !important;
                }
              }
            `,
          }}
        />
      )}

      {tipoGuia === "ambas" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 landscape !important;
                  margin: 8mm 10mm 10mm 10mm !important;
                }
              }
            `,
          }}
        />
      )}

      <div
        className={`hidden print:block w-full mx-auto bg-white text-black font-sans text-xs ${
          tipoGuia === "apoio" || tipoGuia === "ambas"
            ? "max-w-[297mm] p-2"
            : "max-w-[210mm] p-4"
        }`}
      >
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
    </>
  );
};
