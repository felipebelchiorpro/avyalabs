/**
 * ====================================================================
 * BancadaLab SUS • Serviço Oficial Cloudflare D1 (SQLite na Borda)
 * Laboratório Municipal de Caconde / Departamento de Saúde
 * ====================================================================
 * 
 * Substitui o antigo armazenamento de Google Sheets por consultas
 * relacionais otimizadas em SQLite na borda (Cloudflare D1), blindadas
 * contra acúmulo de dados de múltiplos dias e com suporte a upsert atômico.
 */

import fs from "fs";
import path from "path";
import {
  RotinaItem,
  ItemTriagemEdta,
  LaudoUrina,
  TipoEdtaDestino,
  StatusTriagemEdta,
  StatusLaudo,
} from "@/types/urinalise";
import {
  normalizarDataIso,
  formatarProntuario,
  normalizarProntuario,
  obterHojeIsoLocal,
} from "@/lib/extratorBancada";

// ==========================================
// Tipos e Interfaces do Cloudflare D1
// ==========================================

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: any;
  error?: string;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface ResultadoSalvarTriagemEdta {
  ok: boolean;
  count: number;
  total: number;
  novosAdicionados: number;
  jaTriadosPreservados: number;
  atualizadosPendentes: number;
  message: string;
  itens: ItemTriagemEdta[];
}

export interface ResultadoSalvarRotina {
  ok: boolean;
  count: number;
  total: number;
  message: string;
}

export interface FiltroLaudos {
  data?: string;
  de?: string;
  ate?: string;
  prontuario?: string;
  busca?: string;
}

export function isD1Configured(): boolean {
  return true;
}

// ==========================================
// Fallback Local de Armazenamento para Dev
// ==========================================

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(DATA_DIR, "bancadalab_d1_fallback.json");

interface FallbackDbStructure {
  rotina_dia: any[];
  triagem_edta: any[];
  laudos_urina: any[];
  medicos_caconde: { nome_medico: string; padrao: number }[];
  operadores_caconde: { nome_operador: string; ativo: number }[];
  sinal_impressao_edta: any[];
}

function inicializarDbLocal(): FallbackDbStructure {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[D1 Local Fallback] Erro ao carregar arquivo local:", err);
  }

  const base: FallbackDbStructure = {
    rotina_dia: [],
    triagem_edta: [],
    laudos_urina: [],
    medicos_caconde: [
      { nome_medico: "Dr(a). Clínico(a) Geral / UBS", padrao: 1 },
      { nome_medico: "Dr. André Luiz Silveira", padrao: 0 },
      { nome_medico: "Dra. Mariana Fontes", padrao: 0 },
      { nome_medico: "Dr. Carlos Eduardo Zanetti", padrao: 0 },
      { nome_medico: "Dr(a). Plantonista Pronto Socorro", padrao: 0 },
    ],
    operadores_caconde: [
      { nome_operador: "Farmacêutico(a) Bioquímico(a)", ativo: 1 },
      { nome_operador: "Bancada Geral SUS", ativo: 1 },
      { nome_operador: "Operador 01", ativo: 1 },
    ],
    sinal_impressao_edta: [],
  };

  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(base, null, 2), "utf-8");
  } catch (_) {}

  return base;
}

function salvarDbLocal(db: FallbackDbStructure) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[D1 Local Fallback] Erro ao salvar arquivo local:", err);
  }
}

// Cria um executor D1 simulado para ambiente Node.js / dev sem Cloudflare Worker runtime
function criarD1LocalDriver(): D1Database {
  return {
    async exec(query: string) {
      return { count: 0, duration: 0 };
    },
    async dump() {
      return new ArrayBuffer(0);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const out: D1Result<T>[] = [];
      for (const st of statements) {
        const res = await st.run<T>();
        out.push(res);
      }
      return out;
    },
    prepare(query: string): D1PreparedStatement {
      let boundValues: any[] = [];
      const normalizedQuery = query.trim().replace(/\s+/g, " ");

      const statement: D1PreparedStatement = {
        bind(...values: any[]) {
          boundValues = values;
          return statement;
        },
        async first<T = unknown>(colName?: string): Promise<T | null> {
          const res = await this.all<T>();
          if (!res.results || res.results.length === 0) return null;
          const primeiro: any = res.results[0];
          if (colName) return primeiro[colName] ?? null;
          return primeiro as T;
        },
        async raw<T = unknown>(): Promise<T[]> {
          const res = await this.all<any>();
          return (res.results || []).map((row) => Object.values(row)) as T[];
        },
        async all<T = unknown>(): Promise<D1Result<T>> {
          const db = inicializarDbLocal();
          const q = normalizedQuery.toUpperCase();

          // SELECT rotina_dia
          if (q.includes("FROM ROTINA_DIA")) {
            let list = [...db.rotina_dia];
            if (q.includes("WHERE DATA = ?") && boundValues[0]) {
              const d = boundValues[0];
              list = list.filter((r) => r.data === d);
            } else if (q.includes("WHERE DATA >= ? AND DATA <= ?")) {
              const de = boundValues[0];
              const ate = boundValues[1];
              list = list.filter((r) => r.data >= de && r.data <= ate);
            } else if (q.includes("WHERE PRONTUARIO = ?")) {
              const p = boundValues[0];
              list = list.filter((r) => r.prontuario === p || normalizarProntuario(r.prontuario) === normalizarProntuario(p));
            }
            if (q.includes("ORDER BY NOME_PACIENTE")) {
              list.sort((a, b) => (a.nome_paciente || "").localeCompare(b.nome_paciente || "", "pt-BR"));
            }
            return { success: true, results: list as unknown as T[] };
          }

          // SELECT triagem_edta
          if (q.includes("FROM TRIAGEM_EDTA")) {
            let list = [...db.triagem_edta];
            if (q.includes("WHERE DATA = ?") && boundValues[0]) {
              const d = boundValues[0];
              list = list.filter((r) => r.data === d);
            } else if (q.includes("WHERE PRONTUARIO_NORMALIZADO = ? OR PRONTUARIO = ?")) {
              const p = String(boundValues[0]);
              list = list.filter((r) => r.prontuario_normalizado === p || r.prontuario === p);
            }
            if (q.includes("ORDER BY NOME_PACIENTE")) {
              list.sort((a, b) => (a.nome_paciente || "").localeCompare(b.nome_paciente || "", "pt-BR"));
            }
            return { success: true, results: list as unknown as T[] };
          }

          // SELECT laudos_urina
          if (q.includes("FROM LAUDOS_URINA")) {
            let list = [...db.laudos_urina];
            if (q.includes("WHERE DATA_ATENDIMENTO = ?") && boundValues[0]) {
              const d = boundValues[0];
              list = list.filter((r) => r.data_atendimento === d);
            } else if (q.includes("WHERE PRONTUARIO = ?")) {
              const p = boundValues[0];
              list = list.filter((r) => r.prontuario === p || normalizarProntuario(r.prontuario) === normalizarProntuario(p));
            }
            if (q.includes("ORDER BY DATA_HORA DESC")) {
              list.sort((a, b) => (b.data_hora || "").localeCompare(a.data_hora || ""));
            }
            return { success: true, results: list as unknown as T[] };
          }

          // SELECT medicos_caconde
          if (q.includes("FROM MEDICOS_CACONDE")) {
            const list = [...db.medicos_caconde].sort((a, b) =>
              (a.nome_medico || "").localeCompare(b.nome_medico || "", "pt-BR")
            );
            return { success: true, results: list as unknown as T[] };
          }

          // SELECT operadores_caconde
          if (q.includes("FROM OPERADORES_CACONDE")) {
            const list = [...db.operadores_caconde].sort((a, b) =>
              (a.nome_operador || "").localeCompare(b.nome_operador || "", "pt-BR")
            );
            return { success: true, results: list as unknown as T[] };
          }

          // SELECT sinal_impressao_edta
          if (q.includes("FROM SINAL_IMPRESSAO_EDTA")) {
            return { success: true, results: db.sinal_impressao_edta as unknown as T[] };
          }

          return { success: true, results: [] };
        },
        async run<T = unknown>(): Promise<D1Result<T>> {
          const db = inicializarDbLocal();
          const q = normalizedQuery.toUpperCase();

          // INSERT / UPSERT rotina_dia
          if (q.includes("INTO ROTINA_DIA")) {
            const [id, data, prontuario, nome_paciente, idade_sexo, posto_unidade, solicitante, exame, status_coleta, status_laudo] = boundValues;
            const idx = db.rotina_dia.findIndex((r) => r.id === id);
            const agora = new Date().toISOString();
            if (idx >= 0) {
              const existente = db.rotina_dia[idx];
              const laudoPreservado =
                existente.status_laudo === "finalizado" || existente.status_laudo === "CONCLUIDO"
                  ? existente.status_laudo
                  : status_laudo || existente.status_laudo;
              db.rotina_dia[idx] = {
                ...existente,
                nome_paciente: nome_paciente || existente.nome_paciente,
                idade_sexo: idade_sexo || existente.idade_sexo,
                posto_unidade: posto_unidade || existente.posto_unidade,
                solicitante: solicitante || existente.solicitante,
                exame: exame || existente.exame,
                status_coleta: status_coleta || existente.status_coleta,
                status_laudo: laudoPreservado,
                updated_at: agora,
              };
            } else {
              db.rotina_dia.push({
                id,
                data,
                prontuario,
                nome_paciente,
                idade_sexo: idade_sexo || "",
                posto_unidade: posto_unidade || "UBS Central Caconde",
                solicitante: solicitante || "Dr(a). Clínico(a) Geral / UBS",
                exame: exame || "",
                status_coleta: status_coleta || "REALIZADO",
                status_laudo: status_laudo || "rascunho",
                created_at: agora,
                updated_at: agora,
              });
            }
            salvarDbLocal(db);
            return { success: true };
          }

          // INSERT / UPSERT triagem_edta
          if (q.includes("INTO TRIAGEM_EDTA")) {
            const [
              id,
              data,
              prontuario,
              prontuario_normalizado,
              data_nascimento,
              data_nascimento_digitos,
              nome_paciente,
              tipo_destino,
              status,
              fracionado_glicada,
              colocado_grade,
              horario_bipado,
              exames,
              solicitante,
              urgencia,
              tem_vhs,
              coletado_dois_tubos,
              qtd_tubos_coletados,
              enviar_hemograma_hoje,
              data_liberacao_apoio,
            ] = boundValues;

            const idx = db.triagem_edta.findIndex((r) => r.id === id);
            const agora = new Date().toISOString();
            if (idx >= 0) {
              const itemAntigo = db.triagem_edta[idx];
              const jaTriado = itemAntigo.status !== "pendente" || itemAntigo.colocado_grade;
              db.triagem_edta[idx] = {
                ...itemAntigo,
                data_nascimento: data_nascimento || itemAntigo.data_nascimento,
                data_nascimento_digitos: data_nascimento_digitos || itemAntigo.data_nascimento_digitos,
                solicitante: itemAntigo.solicitante || solicitante,
                urgencia: itemAntigo.urgencia ?? Boolean(urgencia),
                exames: itemAntigo.exames || exames,
                status: jaTriado ? itemAntigo.status : (status || itemAntigo.status),
                horario_bipado: itemAntigo.horario_bipado || horario_bipado,
                colocado_grade: jaTriado ? itemAntigo.colocado_grade : Boolean(colocado_grade),
                fracionado_glicada: jaTriado ? itemAntigo.fracionado_glicada : Boolean(fracionado_glicada),
                enviar_hemograma_hoje: itemAntigo.enviar_hemograma_hoje ?? (enviar_hemograma_hoje ?? 1),
                updated_at: agora,
              };
            } else {
              db.triagem_edta.push({
                id,
                data,
                prontuario,
                prontuario_normalizado,
                data_nascimento: data_nascimento || "",
                data_nascimento_digitos: data_nascimento_digitos || "",
                nome_paciente,
                tipo_destino,
                status: status || "pendente",
                fracionado_glicada: Number(fracionado_glicada) || 0,
                colocado_grade: Number(colocado_grade) || 0,
                horario_bipado: horario_bipado || "",
                exames: exames || "",
                solicitante: solicitante || "Dr(a). Clínico(a) Geral / UBS",
                urgencia: Number(urgencia) || 0,
                tem_vhs: Number(tem_vhs) || 0,
                coletado_dois_tubos: Number(coletado_dois_tubos) || 0,
                qtd_tubos_coletados: Number(qtd_tubos_coletados) || 1,
                enviar_hemograma_hoje: enviar_hemograma_hoje !== undefined ? Number(enviar_hemograma_hoje) : 1,
                data_liberacao_apoio: data_liberacao_apoio || null,
                created_at: agora,
                updated_at: agora,
              });
            }
            salvarDbLocal(db);
            return { success: true };
          }

          // DELETE FROM triagem_edta
          if (q.includes("DELETE FROM TRIAGEM_EDTA")) {
            const p = boundValues[0];
            db.triagem_edta = db.triagem_edta.filter(
              (r) => r.prontuario !== p && r.prontuario_normalizado !== p
            );
            salvarDbLocal(db);
            return { success: true };
          }

          // INSERT INTO laudos_urina
          if (q.includes("INTO LAUDOS_URINA")) {
            const id = boundValues[0];
            const idx = db.laudos_urina.findIndex((l) => l.id === id);
            const laudoObj: any = { id };
            const colunas = [
              "id", "data_hora", "prontuario", "data_atendimento", "nome_paciente",
              "cor", "aspecto", "deposito", "densidade", "ph", "proteina", "glicose",
              "cetona", "bilirrubina", "urobilinogenio", "sangue", "nitrito",
              "leucocitos_campo", "hemacias_campo", "celulas_epiteliais", "cilindros", "cristais",
              "bacterias", "leveduras", "muco", "filamento_muco", "parasitas", "outros_elementos",
              "observacoes", "responsavel_tecnico", "solicitante", "posto_unidade", "idade_sexo",
              "status", "resultado_vdrl", "vdrl_acumular_lote", "dengue_ns1", "dengue_igm",
              "dengue_igg", "resultado_abo_rh"
            ];
            colunas.forEach((col, i) => {
              laudoObj[col] = boundValues[i] !== undefined ? boundValues[i] : "";
            });
            laudoObj.updated_at = new Date().toISOString();

            if (idx >= 0) {
              db.laudos_urina[idx] = { ...db.laudos_urina[idx], ...laudoObj };
            } else {
              laudoObj.created_at = new Date().toISOString();
              db.laudos_urina.push(laudoObj);
            }
            salvarDbLocal(db);
            return { success: true };
          }

          // Médicos e Operadores
          if (q.includes("INTO MEDICOS_CACONDE")) {
            const [nome_medico, padrao] = boundValues;
            const idx = db.medicos_caconde.findIndex((m) => m.nome_medico === nome_medico);
            if (idx >= 0) {
              db.medicos_caconde[idx].padrao = padrao;
            } else {
              db.medicos_caconde.push({ nome_medico, padrao });
            }
            salvarDbLocal(db);
            return { success: true };
          }

          if (q.includes("INTO OPERADORES_CACONDE")) {
            const [nome_operador, ativo] = boundValues;
            const idx = db.operadores_caconde.findIndex((o) => o.nome_operador === nome_operador);
            if (idx >= 0) {
              db.operadores_caconde[idx].ativo = ativo;
            } else {
              db.operadores_caconde.push({ nome_operador, ativo });
            }
            salvarDbLocal(db);
            return { success: true };
          }

          // DELETE Médicos/Operadores para reset
          if (q.includes("DELETE FROM MEDICOS_CACONDE")) {
            db.medicos_caconde = [];
            salvarDbLocal(db);
            return { success: true };
          }

          if (q.includes("DELETE FROM OPERADORES_CACONDE")) {
            db.operadores_caconde = [];
            salvarDbLocal(db);
            return { success: true };
          }

          // Sinal de impressão
          if (q.includes("INTO SINAL_IMPRESSAO_EDTA")) {
            const [id, timestamp, hora_encerramento, tipo_guia, solicitado_em] = boundValues;
            db.sinal_impressao_edta = [{ id, timestamp, hora_encerramento, tipo_guia, solicitado_em }];
            salvarDbLocal(db);
            return { success: true };
          }

          if (q.includes("DELETE FROM SINAL_IMPRESSAO_EDTA")) {
            db.sinal_impressao_edta = [];
            salvarDbLocal(db);
            return { success: true };
          }

          return { success: true };
        },
      };

      return statement;
    },
  };
}

// Cria um executor D1 via HTTP REST API da Cloudflare para ambientes externos (ex: Vercel)
function criarD1HttpDriver(accountId: string, databaseId: string, apiToken: string): D1Database {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  return {
    async exec(query: string) {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sql: query }),
      });
      const data = await res.json();
      return { count: data.result?.[0]?.meta?.changes || 0, duration: data.result?.[0]?.meta?.duration || 0 };
    },
    async dump() {
      return new ArrayBuffer(0);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const out: D1Result<T>[] = [];
      for (const st of statements) {
        out.push(await st.run<T>());
      }
      return out;
    },
    prepare(query: string): D1PreparedStatement {
      let boundValues: any[] = [];
      const statement: D1PreparedStatement = {
        bind(...values: any[]) {
          boundValues = values;
          return statement;
        },
        async first<T = unknown>(colName?: string): Promise<T | null> {
          const res = await this.all<T>();
          if (!res.results || res.results.length === 0) return null;
          const p: any = res.results[0];
          return colName ? (p[colName] ?? null) : (p as T);
        },
        async raw<T = unknown>(): Promise<T[]> {
          const res = await this.all<any>();
          return (res.results || []).map((r) => Object.values(r)) as T[];
        },
        async all<T = unknown>(): Promise<D1Result<T>> {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ sql: query, params: boundValues }),
            });
            const data = await res.json();
            if (data.success && data.result?.[0]) {
              return { success: true, results: (data.result[0].results || []) as T[] };
            }
            return { success: false, error: data.errors?.[0]?.message || "Erro na consulta D1" };
          } catch (err: any) {
            return { success: false, error: err.message || String(err) };
          }
        },
        async run<T = unknown>(): Promise<D1Result<T>> {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ sql: query, params: boundValues }),
            });
            const data = await res.json();
            return { success: Boolean(data.success), results: (data.result?.[0]?.results || []) as T[] };
          } catch (err: any) {
            return { success: false, error: err.message || String(err) };
          }
        },
      };
      return statement;
    },
  };
}

/**
 * Obtém a conexão ativa com o Cloudflare D1.
 * Prioridade:
 * 1. env.DB injetado pelo Cloudflare Workers/Pages
 * 2. process.env.DB ou globalThis.DB
 * 3. Cloudflare D1 HTTP REST API (quando CLOUDFLARE_API_TOKEN está na Vercel/Node)
 * 4. Driver de fallback local persistente (ambiente dev/build)
 */
export function getD1Database(): D1Database {
  const g = globalThis as any;
  if (g && g.DB && typeof g.DB.prepare === "function") {
    return g.DB as D1Database;
  }
  if (typeof process !== "undefined" && (process.env as any)?.DB?.prepare) {
    return (process.env as any).DB as D1Database;
  }

  // Suporte a HTTP REST API da Cloudflare na Vercel
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID || "fbfd9da8-1429-452b-9d35-41393fa63094";

  if (accountId && apiToken && databaseId) {
    if (!g.__BANCADALAB_D1_HTTP__) {
      g.__BANCADALAB_D1_HTTP__ = criarD1HttpDriver(accountId, databaseId, apiToken);
    }
    return g.__BANCADALAB_D1_HTTP__ as D1Database;
  }

  // Driver local em memória/disco
  if (!g.__BANCADALAB_D1_LOCAL__) {
    g.__BANCADALAB_D1_LOCAL__ = criarD1LocalDriver();
  }
  return g.__BANCADALAB_D1_LOCAL__ as D1Database;
}

// ====================================================================
// 1. ROTINA DO DIA (rotina_dia)
// ====================================================================

/**
 * Lista os pacientes da rotina diária.
 * BLINDAGEM DE DATA: Se nenhuma data for fornecida, filtra ESTRITAMENTE por hoje,
 * eliminando acúmulo de pacientes de dias anteriores.
 */
export async function listarRotinaDia(filtro?: {
  data?: string;
  de?: string;
  ate?: string;
}): Promise<RotinaItem[]> {
  const db = getD1Database();
  const hoje = obterHojeIsoLocal();

  let query = "SELECT id, data, prontuario, nome_paciente, idade_sexo, posto_unidade, solicitante, exame, status_coleta, status_laudo FROM rotina_dia";
  let stmt: D1PreparedStatement;

  if (filtro?.de && filtro?.ate) {
    query += " WHERE data >= ? AND data <= ? ORDER BY data DESC, nome_paciente ASC";
    stmt = db.prepare(query).bind(filtro.de, filtro.ate);
  } else {
    // Data estrita específica ou hoje por padrão
    const dataAlvo = filtro?.data && filtro.data !== "todas" ? filtro.data : (filtro?.data === "todas" ? null : hoje);
    if (dataAlvo) {
      query += " WHERE data = ? ORDER BY nome_paciente ASC";
      stmt = db.prepare(query).bind(dataAlvo);
    } else {
      query += " ORDER BY data DESC, nome_paciente ASC";
      stmt = db.prepare(query);
    }
  }

  const { results = [] } = await stmt.all<any>();

  return results.map((r) => ({
    id: r.id,
    data: r.data,
    prontuario: r.prontuario,
    nome_paciente: r.nome_paciente,
    idade_sexo: r.idade_sexo || "",
    posto_unidade: r.posto_unidade || "UBS Central Caconde",
    solicitante: r.solicitante || "Dr(a). Clínico(a) Geral / UBS",
    exame: r.exame || "",
    status_coleta: r.status_coleta || "REALIZADO",
    status_laudo: (r.status_laudo as StatusLaudo) || "rascunho",
  }));
}

/**
 * Salva ou atualiza itens na tabela rotina_dia via UPSERT atômico.
 * Preserva o status do laudo caso já tenha sido digitado ou concluído na bancada.
 */
export async function salvarRotinaDia(
  itens: RotinaItem[],
  substituir = true
): Promise<ResultadoSalvarRotina> {
  if (!Array.isArray(itens) || itens.length === 0) {
    return { ok: true, count: 0, total: 0, message: "Nenhum item fornecido." };
  }

  const db = getD1Database();
  const hoje = obterHojeIsoLocal();
  let count = 0;

  for (const item of itens) {
    const dataItem = normalizarDataIso(item.data) || hoje;
    const pFormatado = formatarProntuario(item.prontuario);
    const id = item.id || `rot-${dataItem}-${normalizarProntuario(pFormatado)}`;

    const upsertSql = `
      INSERT INTO rotina_dia (
        id, data, prontuario, nome_paciente, idade_sexo, posto_unidade, solicitante, exame, status_coleta, status_laudo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nome_paciente = excluded.nome_paciente,
        idade_sexo = COALESCE(NULLIF(excluded.idade_sexo, ''), rotina_dia.idade_sexo),
        posto_unidade = COALESCE(NULLIF(excluded.posto_unidade, ''), rotina_dia.posto_unidade),
        solicitante = COALESCE(NULLIF(excluded.solicitante, ''), rotina_dia.solicitante),
        exame = excluded.exame,
        status_coleta = excluded.status_coleta,
        status_laudo = CASE
          WHEN rotina_dia.status_laudo IN ('finalizado', 'CONCLUIDO', 'recoleta') THEN rotina_dia.status_laudo
          ELSE excluded.status_laudo
        END,
        updated_at = datetime('now', 'localtime')
    `;

    await db.prepare(upsertSql).bind(
      id,
      dataItem,
      pFormatado,
      (item.nome_paciente || "").trim().toUpperCase(),
      item.idade_sexo || "",
      item.posto_unidade || "UBS Central Caconde",
      item.solicitante || "Dr(a). Clínico(a) Geral / UBS",
      item.exame || "",
      item.status_coleta || "REALIZADO",
      item.status_laudo || "rascunho"
    ).run();

    count++;
  }

  return {
    ok: true,
    count,
    total: itens.length,
    message: `${count} pacientes da rotina salvos com sucesso no D1.`,
  };
}

/**
 * Busca um paciente por prontuário na rotina e recupera o último laudo salvo.
 */
export async function buscarPacientePorProntuario(prontuario: string): Promise<{
  paciente: RotinaItem | null;
  ultimoLaudo: Partial<LaudoUrina> | null;
}> {
  const db = getD1Database();
  const pNorm = normalizarProntuario(prontuario);
  const pForm = formatarProntuario(prontuario);

  // Busca na rotina do dia (mais recente primeiro)
  const rotinaStmt = db.prepare(`
    SELECT id, data, prontuario, nome_paciente, idade_sexo, posto_unidade, solicitante, exame, status_coleta, status_laudo
    FROM rotina_dia
    WHERE prontuario = ? OR prontuario = ?
    ORDER BY data DESC
    LIMIT 1
  `).bind(pForm, pNorm);

  const pacienteRes = await rotinaStmt.first<any>();

  let paciente: RotinaItem | null = null;
  if (pacienteRes) {
    paciente = {
      id: pacienteRes.id,
      data: pacienteRes.data,
      prontuario: pacienteRes.prontuario,
      nome_paciente: pacienteRes.nome_paciente,
      idade_sexo: pacienteRes.idade_sexo || "",
      posto_unidade: pacienteRes.posto_unidade || "UBS Central Caconde",
      solicitante: pacienteRes.solicitante || "Dr(a). Clínico(a) Geral / UBS",
      exame: pacienteRes.exame || "",
      status_coleta: pacienteRes.status_coleta || "REALIZADO",
      status_laudo: (pacienteRes.status_laudo as StatusLaudo) || "rascunho",
    };
  }

  // Busca último laudo registrado
  const laudoStmt = db.prepare(`
    SELECT * FROM laudos_urina
    WHERE prontuario = ? OR prontuario = ?
    ORDER BY data_hora DESC
    LIMIT 1
  `).bind(pForm, pNorm);

  const ultimoLaudo = await laudoStmt.first<any>();

  return { paciente, ultimoLaudo };
}

// ====================================================================
// 2. TRIAGEM DE TUBOS EDTA (triagem_edta)
// ====================================================================

/**
 * Lista itens de triagem EDTA.
 * BLINDAGEM DE DATA: Se dataFiltro não for informado, filtra ESTRITAMENTE por hoje.
 * Se informado "todas", retorna o histórico de todos os dias.
 */
export async function listarTriagemEdta(dataFiltro?: string): Promise<ItemTriagemEdta[]> {
  const db = getD1Database();
  const hoje = obterHojeIsoLocal();

  let query = "SELECT * FROM triagem_edta";
  let stmt: D1PreparedStatement;

  if (dataFiltro === "todas") {
    query += " ORDER BY data DESC, nome_paciente ASC";
    stmt = db.prepare(query);
  } else {
    const dataAlvo = dataFiltro ? normalizarDataIso(dataFiltro) : hoje;
    query += " WHERE data = ? ORDER BY nome_paciente ASC";
    stmt = db.prepare(query).bind(dataAlvo);
  }

  const { results = [] } = await stmt.all<any>();

  return results.map((r) => {
    const destino = r.tipo_destino as TipoEdtaDestino;
    const temGlic = destino === "hemograma_glicada" || destino === "apenas_glicada";
    const temHemo = destino === "hemograma_glicada" || destino === "apenas_hemograma";

    return {
      id: r.id,
      data: r.data,
      prontuario: r.prontuario,
      prontuario_normalizado: r.prontuario_normalizado,
      data_nascimento: r.data_nascimento || "",
      data_nascimento_digitos: r.data_nascimento_digitos || "",
      nome_paciente: r.nome_paciente,
      tipo_destino: destino,
      tem_hemograma: temHemo,
      tem_glicada: temGlic,
      status: r.status as StatusTriagemEdta,
      fracionado_glicada: Boolean(r.fracionado_glicada),
      colocado_grade: Boolean(r.colocado_grade),
      horario_bipado: r.horario_bipado || "",
      solicitante: r.solicitante || "Dr(a). Clínico(a) Geral / UBS",
      urgencia: Boolean(r.urgencia),
      tem_vhs: Boolean(r.tem_vhs),
      coletado_dois_tubos: Boolean(r.coletado_dois_tubos),
      qtd_tubos_coletados: Number(r.qtd_tubos_coletados) || 1,
      enviar_hemograma_hoje: r.enviar_hemograma_hoje !== undefined ? Boolean(r.enviar_hemograma_hoje) : true,
      data_liberacao_apoio: r.data_liberacao_apoio || undefined,
    };
  });
}

/**
 * Salva itens de triagem EDTA via UPSERT atômico.
 * Preserva o status caso o item já tenha sido triado ou bipado na bancada.
 */
export async function salvarTriagemEdta(
  itens: ItemTriagemEdta[],
  substituirExistente = false
): Promise<ResultadoSalvarTriagemEdta> {
  const db = getD1Database();
  const hoje = obterHojeIsoLocal();

  let novosAdicionados = 0;
  let jaTriadosPreservados = 0;
  let atualizadosPendentes = 0;

  const itensProcessados: ItemTriagemEdta[] = [];

  for (const item of itens) {
    const dataItem = normalizarDataIso(item.data) || hoje;
    const pFormatado = formatarProntuario(item.prontuario);
    const pNorm = item.prontuario_normalizado || normalizarProntuario(pFormatado);
    const id = item.id || `edta-${dataItem}-${pNorm}`;

    // Determinar tipo_destino com regras de segurança clínica
    const tipoStr = (item.tipo_destino || "").toLowerCase();
    const temGlic = Boolean(item.tem_glicada) || tipoStr.includes("glic");
    const temHemo = Boolean(item.tem_hemograma) || tipoStr.includes("hemogr") || (!tipoStr && !temGlic);

    let destinoFinal: TipoEdtaDestino = "apenas_hemograma";
    if (temHemo && temGlic) destinoFinal = "hemograma_glicada";
    else if (temGlic) destinoFinal = "apenas_glicada";

    // Checar se já existe no banco
    const existente = await db.prepare(
      "SELECT * FROM triagem_edta WHERE id = ?"
    ).bind(id).first<any>();

    let statusFinal = item.status || "pendente";
    let colocadoGradeFinal = Boolean(item.colocado_grade);
    let fracionadoFinal = Boolean(item.fracionado_glicada);
    let horarioFinal = item.horario_bipado || "";
    let enviarHojeFinal = item.enviar_hemograma_hoje !== undefined ? (item.enviar_hemograma_hoje ? 1 : 0) : 1;

    if (existente) {
      const jaTriado = existente.status !== "pendente" || existente.colocado_grade;
      if (jaTriado) {
        jaTriadosPreservados++;
        statusFinal = existente.status;
        colocadoGradeFinal = Boolean(existente.colocado_grade);
        fracionadoFinal = Boolean(existente.fracionado_glicada);
        horarioFinal = existente.horario_bipado || horarioFinal;
        enviarHojeFinal = existente.enviar_hemograma_hoje;
      } else {
        atualizadosPendentes++;
      }
    } else {
      novosAdicionados++;
    }

    const examesTexto = destinoFinal === "hemograma_glicada" ? "HEMOGRAMA + GLICADA" : (destinoFinal === "apenas_glicada" ? "GLICADA" : "HEMOGRAMA");

    const upsertSql = `
      INSERT INTO triagem_edta (
        id, data, prontuario, prontuario_normalizado, data_nascimento, data_nascimento_digitos,
        nome_paciente, tipo_destino, status, fracionado_glicada, colocado_grade, horario_bipado,
        exames, solicitante, urgencia, tem_vhs, coletado_dois_tubos, qtd_tubos_coletados,
        enviar_hemograma_hoje, data_liberacao_apoio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data_nascimento = COALESCE(NULLIF(excluded.data_nascimento, ''), triagem_edta.data_nascimento),
        data_nascimento_digitos = COALESCE(NULLIF(excluded.data_nascimento_digitos, ''), triagem_edta.data_nascimento_digitos),
        solicitante = COALESCE(NULLIF(excluded.solicitante, ''), triagem_edta.solicitante),
        urgencia = excluded.urgencia,
        tem_vhs = excluded.tem_vhs,
        coletado_dois_tubos = excluded.coletado_dois_tubos,
        qtd_tubos_coletados = excluded.qtd_tubos_coletados,
        status = CASE
          WHEN triagem_edta.status != 'pendente' OR triagem_edta.colocado_grade = 1 THEN triagem_edta.status
          ELSE excluded.status
        END,
        colocado_grade = CASE
          WHEN triagem_edta.colocado_grade = 1 THEN 1
          ELSE excluded.colocado_grade
        END,
        fracionado_glicada = CASE
          WHEN triagem_edta.fracionado_glicada = 1 THEN 1
          ELSE excluded.fracionado_glicada
        END,
        horario_bipado = COALESCE(NULLIF(triagem_edta.horario_bipado, ''), excluded.horario_bipado),
        enviar_hemograma_hoje = triagem_edta.enviar_hemograma_hoje,
        updated_at = datetime('now', 'localtime')
    `;

    await db.prepare(upsertSql).bind(
      id,
      dataItem,
      pFormatado,
      pNorm,
      item.data_nascimento || "",
      item.data_nascimento_digitos || "",
      (item.nome_paciente || "").trim().toUpperCase(),
      destinoFinal,
      statusFinal,
      fracionadoFinal ? 1 : 0,
      colocadoGradeFinal ? 1 : 0,
      horarioFinal,
      examesTexto,
      item.solicitante || "Dr(a). Clínico(a) Geral / UBS",
      item.urgencia ? 1 : 0,
      item.tem_vhs ? 1 : 0,
      item.coletado_dois_tubos ? 1 : 0,
      item.qtd_tubos_coletados || 1,
      enviarHojeFinal,
      item.data_liberacao_apoio || null
    ).run();

    itensProcessados.push({
      ...item,
      id,
      data: dataItem,
      prontuario: pFormatado,
      prontuario_normalizado: pNorm,
      tipo_destino: destinoFinal,
      tem_hemograma: temHemo,
      tem_glicada: temGlic,
      status: statusFinal as StatusTriagemEdta,
      colocado_grade: colocadoGradeFinal,
      fracionado_glicada: fracionadoFinal,
      horario_bipado: horarioFinal,
      enviar_hemograma_hoje: Boolean(enviarHojeFinal),
    });
  }

  return {
    ok: true,
    count: itensProcessados.length,
    total: itensProcessados.length,
    novosAdicionados,
    jaTriadosPreservados,
    atualizadosPendentes,
    message: `${itensProcessados.length} tubos processados com sucesso no D1.`,
    itens: itensProcessados,
  };
}

/**
 * Atualiza campos específicos de um tubo EDTA de forma atômica.
 */
export async function atualizarStatusItemEdta(
  prontuario: string,
  updates: Partial<ItemTriagemEdta>
): Promise<ItemTriagemEdta | null> {
  const db = getD1Database();
  const pNorm = normalizarProntuario(prontuario);
  const pForm = formatarProntuario(prontuario);

  // Buscar item atual
  const item = await db.prepare(`
    SELECT * FROM triagem_edta
    WHERE prontuario_normalizado = ? OR prontuario = ?
    ORDER BY data DESC
    LIMIT 1
  `).bind(pNorm, pForm).first<any>();

  if (!item) return null;

  const camposAtualizar: string[] = [];
  const valores: any[] = [];

  if (updates.status !== undefined) {
    camposAtualizar.push("status = ?");
    valores.push(updates.status);
  }
  if (updates.fracionado_glicada !== undefined) {
    camposAtualizar.push("fracionado_glicada = ?");
    valores.push(updates.fracionado_glicada ? 1 : 0);
  }
  if (updates.colocado_grade !== undefined) {
    camposAtualizar.push("colocado_grade = ?");
    valores.push(updates.colocado_grade ? 1 : 0);
  }
  if (updates.horario_bipado !== undefined) {
    camposAtualizar.push("horario_bipado = ?");
    valores.push(updates.horario_bipado);
  }
  if (updates.solicitante !== undefined) {
    camposAtualizar.push("solicitante = ?");
    valores.push(updates.solicitante);
  }
  if (updates.enviar_hemograma_hoje !== undefined) {
    camposAtualizar.push("enviar_hemograma_hoje = ?");
    valores.push(updates.enviar_hemograma_hoje ? 1 : 0);
  }
  if (updates.data_liberacao_apoio !== undefined) {
    camposAtualizar.push("data_liberacao_apoio = ?");
    valores.push(updates.data_liberacao_apoio);
  }
  if (updates.urgencia !== undefined) {
    camposAtualizar.push("urgencia = ?");
    valores.push(updates.urgencia ? 1 : 0);
  }
  if (updates.tem_vhs !== undefined) {
    camposAtualizar.push("tem_vhs = ?");
    valores.push(updates.tem_vhs ? 1 : 0);
  }
  if (updates.coletado_dois_tubos !== undefined) {
    camposAtualizar.push("coletado_dois_tubos = ?");
    valores.push(updates.coletado_dois_tubos ? 1 : 0);
  }

  camposAtualizar.push("updated_at = datetime('now', 'localtime')");

  if (camposAtualizar.length > 0) {
    const sql = `UPDATE triagem_edta SET ${camposAtualizar.join(", ")} WHERE id = ?`;
    valores.push(item.id);
    await db.prepare(sql).bind(...valores).run();
  }

  const atualizado = await db.prepare("SELECT * FROM triagem_edta WHERE id = ?").bind(item.id).first<any>();
  const destino = atualizado.tipo_destino as TipoEdtaDestino;
  const temGlic = destino === "hemograma_glicada" || destino === "apenas_glicada";
  const temHemo = destino === "hemograma_glicada" || destino === "apenas_hemograma";

  return {
    id: atualizado.id,
    data: atualizado.data,
    prontuario: atualizado.prontuario,
    prontuario_normalizado: atualizado.prontuario_normalizado,
    data_nascimento: atualizado.data_nascimento,
    data_nascimento_digitos: atualizado.data_nascimento_digitos,
    nome_paciente: atualizado.nome_paciente,
    tipo_destino: destino,
    tem_hemograma: temHemo,
    tem_glicada: temGlic,
    status: atualizado.status as StatusTriagemEdta,
    fracionado_glicada: Boolean(atualizado.fracionado_glicada),
    colocado_grade: Boolean(atualizado.colocado_grade),
    horario_bipado: atualizado.horario_bipado || "",
    solicitante: atualizado.solicitante || "Dr(a). Clínico(a) Geral / UBS",
    urgencia: Boolean(atualizado.urgencia),
    tem_vhs: Boolean(atualizado.tem_vhs),
    coletado_dois_tubos: Boolean(atualizado.coletado_dois_tubos),
    qtd_tubos_coletados: Number(atualizado.qtd_tubos_coletados) || 1,
    enviar_hemograma_hoje: Boolean(atualizado.enviar_hemograma_hoje),
    data_liberacao_apoio: atualizado.data_liberacao_apoio || undefined,
  };
}

/**
 * Exclui um item da triagem EDTA.
 */
export async function excluirItemEdta(prontuario: string, dataFiltro?: string): Promise<boolean> {
  const db = getD1Database();
  const pNorm = normalizarProntuario(prontuario);
  const pForm = formatarProntuario(prontuario);

  let sql = "DELETE FROM triagem_edta WHERE (prontuario = ? OR prontuario_normalizado = ?)";
  const params: any[] = [pForm, pNorm];

  if (dataFiltro && dataFiltro !== "todas") {
    sql += " AND data = ?";
    params.push(normalizarDataIso(dataFiltro));
  }

  await db.prepare(sql).bind(...params).run();
  return true;
}

// ====================================================================
// 3. LAUDOS DE URINÁLISE & BANCADA GERAL (laudos_urina)
// ====================================================================

/**
 * Salva ou atualiza um laudo completo no D1.
 */
export async function salvarOuAtualizarLaudo(laudo: LaudoUrina): Promise<{
  ok: boolean;
  message: string;
  id?: string;
  laudo: LaudoUrina;
}> {
  const db = getD1Database();
  const hoje = obterHojeIsoLocal();
  const pFormatado = formatarProntuario(laudo.prontuario);
  const dataAtendimento = normalizarDataIso((laudo as any).data_atendimento || laudo.data_hora?.split("T")[0]) || hoje;
  const id = `laudo-${dataAtendimento}-${normalizarProntuario(pFormatado)}`;
  const agora = laudo.data_hora || new Date().toISOString();

  const laudoNormalizado: LaudoUrina = {
    ...laudo,
    id,
    prontuario: pFormatado,
    data_hora: agora,
    nome_paciente: (laudo.nome_paciente || "").trim().toUpperCase(),
  };

  const upsertSql = `
    INSERT INTO laudos_urina (
      id, data_hora, prontuario, data_atendimento, nome_paciente,
      cor, aspecto, deposito, densidade, ph, proteinas, glicose,
      corpos_cetonicos, pigmentos_biliares, urobilinogenio, hemoglobina, nitrito,
      leucocitos_campo, hemacias_campo, celulas_epiteliais, cilindros, cristais,
      flora_bacteriana, leveduras, muco, filamento_muco, parasitas, outros_elementos,
      observacoes, responsavel_tecnico, medico_solicitante, convenio, idade, sexo,
      status, vdrl_resultado, vdrl_titulacao, vdrl_lote, dengue_ns1, dengue_igm,
      dengue_igg, tipagem_abo, fator_rh
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      data_hora = excluded.data_hora,
      nome_paciente = excluded.nome_paciente,
      cor = excluded.cor,
      aspecto = excluded.aspecto,
      densidade = excluded.densidade,
      ph = excluded.ph,
      proteinas = excluded.proteinas,
      glicose = excluded.glicose,
      corpos_cetonicos = excluded.corpos_cetonicos,
      pigmentos_biliares = excluded.pigmentos_biliares,
      urobilinogenio = excluded.urobilinogenio,
      hemoglobina = excluded.hemoglobina,
      nitrito = excluded.nitrito,
      leucocitos_campo = excluded.leucocitos_campo,
      hemacias_campo = excluded.hemacias_campo,
      celulas_epiteliais = excluded.celulas_epiteliais,
      cilindros = excluded.cilindros,
      cristais = excluded.cristais,
      flora_bacteriana = excluded.flora_bacteriana,
      muco = excluded.muco,
      outros_elementos = excluded.outros_elementos,
      observacoes = excluded.observacoes,
      responsavel_tecnico = excluded.responsavel_tecnico,
      medico_solicitante = excluded.medico_solicitante,
      status = excluded.status,
      vdrl_resultado = excluded.vdrl_resultado,
      dengue_ns1 = excluded.dengue_ns1,
      dengue_igm = excluded.dengue_igm,
      dengue_igg = excluded.dengue_igg,
      tipagem_abo = excluded.tipagem_abo,
      updated_at = datetime('now', 'localtime')
  `;

  await db.prepare(upsertSql).bind(
    id,
    laudoNormalizado.data_hora,
    pFormatado,
    dataAtendimento,
    laudoNormalizado.nome_paciente,
    laudo.cor || "",
    laudo.aspecto || "",
    "", // deposito
    laudo.densidade || "",
    laudo.ph || "",
    laudo.proteina || "",
    laudo.glicose || "",
    laudo.cetona || "",
    laudo.bilirrubina || "",
    laudo.urobilinogenio || "",
    laudo.sangue || "",
    laudo.nitrito || "",
    laudo.leucocitos_campo || "",
    laudo.hemacias_campo || "",
    laudo.celulas_epiteliais || "",
    laudo.cilindros || "",
    laudo.cristais || "",
    laudo.bacterias || "",
    "", // leveduras
    laudo.muco || "",
    "", // filamento_muco
    "", // parasitas
    laudo.outros_elementos || "",
    laudo.observacoes || "",
    laudo.responsavel_tecnico || "Farmacêutico(a) Bioquímico(a)",
    laudo.solicitante || "Dr(a). Clínico(a) Geral / UBS",
    laudo.posto_unidade || "SUS",
    "", // idade
    "", // sexo
    laudo.status || "finalizado",
    laudo.resultado_vdrl || "",
    "", // vdrl_titulacao
    "", // vdrl_lote
    laudo.dengue_ns1 || "",
    laudo.dengue_igm || "",
    laudo.dengue_igg || "",
    laudo.resultado_abo_rh || "",
    "" // fator_rh
  ).run();

  // Marca status_laudo como 'finalizado' na rotina do dia
  try {
    await db.prepare(`
      UPDATE rotina_dia
      SET status_laudo = 'finalizado', updated_at = datetime('now', 'localtime')
      WHERE prontuario = ? AND data = ?
    `).bind(pFormatado, dataAtendimento).run();
  } catch (_) {}

  return {
    ok: true,
    message: "Laudo salvo com sucesso no Cloudflare D1.",
    id,
    laudo: laudoNormalizado,
  };
}

/**
 * Lista laudos de urina com suporte a filtros flexíveis.
 */
export async function listarLaudos(
  filtro?: FiltroLaudos | string
): Promise<LaudoUrina[]> {
  const db = getD1Database();
  let query = "SELECT * FROM laudos_urina";
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (typeof filtro === "string") {
    if (filtro && filtro !== "todas") {
      whereClauses.push("data_atendimento = ?");
      params.push(normalizarDataIso(filtro));
    }
  } else if (filtro) {
    if (filtro.data && filtro.data !== "todas") {
      whereClauses.push("data_atendimento = ?");
      params.push(normalizarDataIso(filtro.data));
    } else if (filtro.de && filtro.ate) {
      whereClauses.push("data_atendimento >= ? AND data_atendimento <= ?");
      params.push(normalizarDataIso(filtro.de), normalizarDataIso(filtro.ate));
    }
    if (filtro.prontuario) {
      whereClauses.push("(prontuario = ? OR prontuario = ?)");
      params.push(formatarProntuario(filtro.prontuario), normalizarProntuario(filtro.prontuario));
    }
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  query += " ORDER BY data_hora DESC";

  const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
  const { results = [] } = await stmt.all<any>();

  let out: LaudoUrina[] = results.map((r) => ({
    id: r.id,
    data_hora: r.data_hora,
    prontuario: r.prontuario,
    nome_paciente: r.nome_paciente,
    idade_sexo: r.idade_sexo || "",
    posto_unidade: r.convenio || "UBS Central Caconde",
    solicitante: r.medico_solicitante || "Dr(a). Clínico(a) Geral / UBS",
    cor: r.cor || "",
    aspecto: r.aspecto || "",
    densidade: r.densidade || "",
    ph: r.ph || "",
    proteina: r.proteinas || "",
    glicose: r.glicose || "",
    cetona: r.corpos_cetonicos || "",
    bilirrubina: r.pigmentos_biliares || "",
    urobilinogenio: r.urobilinogenio || "",
    sangue: r.hemoglobina || "",
    nitrito: r.nitrito || "",
    leucocitos_fita: "",
    celulas_epiteliais: r.celulas_epiteliais || "",
    leucocitos_campo: r.leucocitos_campo || "",
    hemacias_campo: r.hemacias_campo || "",
    bacterias: r.flora_bacteriana || "",
    muco: r.muco || "",
    cristais: r.cristais || "",
    cilindros: r.cilindros || "",
    outros_elementos: r.outros_elementos || "",
    observacoes: r.observacoes || "",
    status: (r.status as StatusLaudo) || "finalizado",
    responsavel_tecnico: r.responsavel_tecnico || "Farmacêutico(a) Bioquímico(a)",
    resultado_vdrl: r.vdrl_resultado || undefined,
    dengue_ns1: r.dengue_ns1 || undefined,
    dengue_igm: r.dengue_igm || undefined,
    dengue_igg: r.dengue_igg || undefined,
    resultado_abo_rh: r.tipagem_abo || undefined,
  }));

  if (typeof filtro === "object" && filtro?.busca) {
    const termo = filtro.busca.toLowerCase();
    out = out.filter(
      (l) =>
        (l.nome_paciente || "").toLowerCase().includes(termo) ||
        (l.prontuario || "").toLowerCase().includes(termo)
    );
  }

  return out;
}

// ====================================================================
// 4. MÉDICOS E OPERADORES
// ====================================================================

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

export async function listarMedicosD1(): Promise<{ medicos: string[]; padrao: string }> {
  const db = getD1Database();
  const { results = [] } = await db.prepare(
    "SELECT nome_medico, padrao FROM medicos_caconde ORDER BY padrao DESC, nome_medico ASC"
  ).all<any>();

  let lista = results.map((r) => r.nome_medico);
  const medPadrao = results.find((r) => r.padrao === 1)?.nome_medico || lista[0] || "Dr(a). Clínico(a) Geral / UBS";

  if (lista.length === 0) {
    lista = [
      "Dr(a). Clínico(a) Geral / UBS",
      "Dr. André Luiz Silveira",
      "Dra. Mariana Fontes",
      "Dr. Carlos Eduardo Zanetti",
      "Dr(a). Plantonista Pronto Socorro",
    ];
  }

  return { medicos: lista, padrao: medPadrao };
}

export async function salvarMedicosD1(
  medicos: string[],
  padrao?: string
): Promise<{ ok: boolean; medicos: string[]; padrao: string; message: string }> {
  const db = getD1Database();
  const listaLimpa = Array.from(new Set(medicos.map((m) => m.trim()).filter(Boolean)));
  const padraoFinal = padrao || listaLimpa[0] || "Dr(a). Clínico(a) Geral / UBS";

  await db.prepare("DELETE FROM medicos_caconde").run();

  for (const m of listaLimpa) {
    const isPadrao = m === padraoFinal ? 1 : 0;
    await db.prepare(
      "INSERT INTO medicos_caconde (nome_medico, padrao) VALUES (?, ?)"
    ).bind(m, isPadrao).run();
  }

  return {
    ok: true,
    medicos: listaLimpa,
    padrao: padraoFinal,
    message: `${listaLimpa.length} médicos salvos no Cloudflare D1.`,
  };
}

export async function listarOperadoresD1(): Promise<{ operadores: string[]; ativo: string }> {
  const db = getD1Database();
  const { results = [] } = await db.prepare(
    "SELECT nome_operador, ativo FROM operadores_caconde ORDER BY ativo DESC, nome_operador ASC"
  ).all<any>();

  let lista = results.map((r) => r.nome_operador);
  const opAtivo = results.find((r) => r.ativo === 1)?.nome_operador || lista[0] || "Farmacêutico(a) Bioquímico(a)";

  if (lista.length === 0) {
    lista = ["Farmacêutico(a) Bioquímico(a)", "Bancada Geral SUS", "Operador 01"];
  }

  return { operadores: lista, ativo: opAtivo };
}

export async function salvarOperadoresD1(
  operadores: string[],
  ativo?: string
): Promise<{ ok: boolean; operadores: string[]; ativo: string; message: string }> {
  const db = getD1Database();
  const listaLimpa = Array.from(new Set(operadores.map((o) => o.trim()).filter(Boolean)));
  const ativoFinal = ativo || listaLimpa[0] || "Farmacêutico(a) Bioquímico(a)";

  await db.prepare("DELETE FROM operadores_caconde").run();

  for (const op of listaLimpa) {
    const isAtivo = op === ativoFinal ? 1 : 0;
    await db.prepare(
      "INSERT INTO operadores_caconde (nome_operador, ativo) VALUES (?, ?)"
    ).bind(op, isAtivo).run();
  }

  return {
    ok: true,
    operadores: listaLimpa,
    ativo: ativoFinal,
    message: `${listaLimpa.length} operadores salvos no Cloudflare D1.`,
  };
}

// ====================================================================
// 5. SINAL DE IMPRESSÃO REMOTA (PC DE BANCADA)
// ====================================================================

export interface SinalImpressaoState {
  ativo: boolean;
  timestamp?: number;
  horaEncerramento?: string;
  tipoGuia?: string;
  solicitadoEm?: string;
}

export function emitirSinalImpressaoEdta(
  horaEncerramento?: string,
  tipoGuia: "apoio" | "urgente" | "ambas" = "ambas"
): SinalImpressaoState {
  const db = getD1Database();
  const ts = Date.now();
  const dataHoraLocal = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  try {
    db.prepare(`
      INSERT INTO sinal_impressao_edta (id, timestamp, hora_encerramento, tipo_guia, solicitado_em)
      VALUES ('current', ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        timestamp = excluded.timestamp,
        hora_encerramento = excluded.hora_encerramento,
        tipo_guia = excluded.tipo_guia,
        solicitado_em = excluded.solicitado_em
    `).bind(ts, horaEncerramento || "", tipoGuia, dataHoraLocal).run();
  } catch (_) {}

  return {
    ativo: true,
    timestamp: ts,
    horaEncerramento,
    tipoGuia,
    solicitadoEm: dataHoraLocal,
  };
}

export function obterSinalImpressaoEdta(): SinalImpressaoState {
  const db = getD1Database();
  try {
    const g = globalThis as any;
    if (g && g.__ULTIMO_SINAL_IMPRESSAO__) {
      if (Date.now() - g.__ULTIMO_SINAL_IMPRESSAO__.timestamp < 300000) {
        return g.__ULTIMO_SINAL_IMPRESSAO__;
      }
    }
  } catch (_) {}
  return { ativo: false };
}

export function consumirSinalImpressaoEdta(): void {
  const g = globalThis as any;
  if (g) {
    g.__ULTIMO_SINAL_IMPRESSAO__ = null;
  }
  try {
    const db = getD1Database();
    db.prepare("DELETE FROM sinal_impressao_edta WHERE id = 'current'").run();
  } catch (_) {}
}
