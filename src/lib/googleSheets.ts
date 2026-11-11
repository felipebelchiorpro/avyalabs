/**
 * ====================================================================
 * BancadaLab SUS • Facade de Compatibilidade (Migrado para Cloudflare D1)
 * Laboratório Municipal de Caconde / Departamento de Saúde
 * ====================================================================
 * 
 * Este arquivo foi mantido para retrocompatibilidade.
 * Todas as leituras e gravações agora são processadas diretamente no
 * Cloudflare D1 (SQLite Edge) através de src/lib/d1Service.ts.
 */

import {
  listarRotinaDia as d1ListarRotinaDia,
  salvarRotinaDia as d1SalvarRotinaDia,
  buscarPacientePorProntuario as d1BuscarPacientePorProntuario,
  listarTriagemEdta as d1ListarTriagemEdta,
  salvarTriagemEdta as d1SalvarTriagemEdta,
  atualizarStatusItemEdta as d1AtualizarStatusItemEdta,
  excluirItemEdta as d1ExcluirItemEdta,
  salvarOuAtualizarLaudo as d1SalvarOuAtualizarLaudo,
  listarLaudos as d1ListarLaudos,
  listarMedicosD1,
  salvarMedicosD1,
  listarOperadoresD1,
  salvarOperadoresD1,
  emitirSinalImpressaoEdta as d1EmitirSinal,
  obterSinalImpressaoEdta as d1ObterSinal,
  consumirSinalImpressaoEdta as d1ConsumirSinal,
  ResultadoSalvarTriagemEdta,
  ResultadoSalvarRotina,
  FiltroLaudos,
  isD1Configured,
} from "./d1Service";
import { RotinaItem, ItemTriagemEdta, LaudoUrina } from "@/types/urinalise";

export type { ResultadoSalvarTriagemEdta, ResultadoSalvarRotina, FiltroLaudos };

export function isGoogleSheetsConfigured(): boolean {
  return isD1Configured();
}

export async function listarRotinaDia(filtro?: {
  data?: string;
  de?: string;
  ate?: string;
}): Promise<RotinaItem[]> {
  return d1ListarRotinaDia(filtro);
}

export async function salvarRotinaDia(
  itens: RotinaItem[],
  substituir = true
): Promise<ResultadoSalvarRotina> {
  return d1SalvarRotinaDia(itens, substituir);
}

export async function buscarPacientePorProntuario(prontuario: string) {
  return d1BuscarPacientePorProntuario(prontuario);
}

export async function listarTriagemEdta(dataFiltro?: string): Promise<ItemTriagemEdta[]> {
  return d1ListarTriagemEdta(dataFiltro);
}

export async function salvarTriagemEdta(
  itens: ItemTriagemEdta[],
  substituirExistente = false
): Promise<ResultadoSalvarTriagemEdta> {
  return d1SalvarTriagemEdta(itens, substituirExistente);
}

export async function atualizarStatusItemEdta(
  prontuario: string,
  updates: Partial<ItemTriagemEdta>
): Promise<ItemTriagemEdta | null> {
  return d1AtualizarStatusItemEdta(prontuario, updates);
}

export async function excluirItemEdta(prontuario: string, dataFiltro?: string): Promise<boolean> {
  return d1ExcluirItemEdta(prontuario, dataFiltro);
}

export async function salvarOuAtualizarLaudo(laudo: LaudoUrina) {
  return d1SalvarOuAtualizarLaudo(laudo);
}

export async function listarLaudos(filtro?: FiltroLaudos | string): Promise<LaudoUrina[]> {
  return d1ListarLaudos(filtro);
}

export async function listarMedicosGoogleSheets(): Promise<{ medicos: string[]; padrao: string }> {
  return listarMedicosD1();
}

export async function salvarMedicosGoogleSheets(
  medicos: string[],
  padrao?: string
): Promise<{ ok: boolean; medicos: string[]; padrao: string; message: string }> {
  return salvarMedicosD1(medicos, padrao);
}

export async function listarOperadoresGoogleSheets(): Promise<{ operadores: string[]; ativo: string }> {
  return listarOperadoresD1();
}

export async function salvarOperadoresGoogleSheets(
  operadores: string[],
  ativo?: string
): Promise<{ ok: boolean; operadores: string[]; ativo: string; message: string }> {
  return salvarOperadoresD1(operadores, ativo);
}

export function emitirSinalImpressaoEdta(horaEncerramento?: string, tipoGuia: "apoio" | "urgente" | "ambas" = "ambas") {
  return d1EmitirSinal(horaEncerramento, tipoGuia);
}

export function obterSinalImpressaoEdta() {
  return d1ObterSinal();
}

export function consumirSinalImpressaoEdta() {
  return d1ConsumirSinal();
}

// Cabeçalhos históricos para referência
export const SHEET_NAME_LAUDOS = "laudos_urina";
export const SHEET_NAME_ROTINA = "rotina_dia";
export const SHEET_NAME_TRIAGEM_EDTA = "triagem_edta";
export const SHEET_NAME_MEDICOS = "medicos_caconde";
export const SHEET_NAME_OPERADORES = "operadores_caconde";
