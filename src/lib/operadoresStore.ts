"use client";

const OPERADORES_KEY = "urolab_operadores_lista";
const OPERADOR_ATIVO_KEY = "urolab_operador_ativo";

export function obterOperadoresCadastrados(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OPERADORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function obterOperadorAtivo(): string {
  if (typeof window === "undefined") return "";
  try {
    const ativo = localStorage.getItem(OPERADOR_ATIVO_KEY);
    if (ativo) return ativo;
    const lista = obterOperadoresCadastrados();
    return lista[0] || "";
  } catch {
    return "";
  }
}

export function definirOperadorAtivo(nome: string): void {
  if (typeof window === "undefined") return;
  const limpo = nome.trim();
  localStorage.setItem(OPERADOR_ATIVO_KEY, limpo);

  // Se o operador não estiver na lista local, adiciona
  if (limpo) {
    const lista = obterOperadoresCadastrados();
    if (!lista.includes(limpo)) {
      lista.push(limpo);
      lista.sort((a, b) => a.localeCompare(b, "pt-BR"));
      localStorage.setItem(OPERADORES_KEY, JSON.stringify(lista));
    }
  }

  window.dispatchEvent(new CustomEvent("operador-atualizado", { detail: { ativo: limpo } }));

  // Notificar backend em background
  fetch("/api/operadores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao: "definir_ativo", ativo: limpo }),
  }).catch(() => {});
}

export async function adicionarOperador(nome: string): Promise<string[]> {
  const limpo = nome.trim();
  if (!limpo) return obterOperadoresCadastrados();

  const lista = obterOperadoresCadastrados();
  if (!lista.includes(limpo)) {
    lista.push(limpo);
    lista.sort((a, b) => a.localeCompare(b, "pt-BR"));
    if (typeof window !== "undefined") {
      localStorage.setItem(OPERADORES_KEY, JSON.stringify(lista));
      // Se não havia operador ativo, torna este ativo
      if (!obterOperadorAtivo()) {
        localStorage.setItem(OPERADOR_ATIVO_KEY, limpo);
      }
      window.dispatchEvent(
        new CustomEvent("operador-atualizado", { detail: { lista, ativo: obterOperadorAtivo() } })
      );
    }
  }

  try {
    const res = await fetch("/api/operadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "adicionar", nome: limpo }),
    });
    const dados = await res.json();
    if (dados.ok && Array.isArray(dados.operadores)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(OPERADORES_KEY, JSON.stringify(dados.operadores));
        if (dados.ativo) {
          localStorage.setItem(OPERADOR_ATIVO_KEY, dados.ativo);
        }
      }
      return dados.operadores;
    }
  } catch (err) {
    console.warn("Erro ao sincronizar novo operador com o servidor:", err);
  }

  return lista;
}

export async function removerOperador(nome: string): Promise<string[]> {
  const limpo = nome.trim();
  let lista = obterOperadoresCadastrados().filter((o) => o !== limpo);

  if (typeof window !== "undefined") {
    localStorage.setItem(OPERADORES_KEY, JSON.stringify(lista));
    if (obterOperadorAtivo() === limpo) {
      const novoAtivo = lista[0] || "";
      localStorage.setItem(OPERADOR_ATIVO_KEY, novoAtivo);
    }
    window.dispatchEvent(
      new CustomEvent("operador-atualizado", { detail: { lista, ativo: obterOperadorAtivo() } })
    );
  }

  try {
    const res = await fetch("/api/operadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "remover", nome: limpo }),
    });
    const dados = await res.json();
    if (dados.ok && Array.isArray(dados.operadores)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(OPERADORES_KEY, JSON.stringify(dados.operadores));
        if (dados.ativo !== undefined) {
          localStorage.setItem(OPERADOR_ATIVO_KEY, dados.ativo);
        }
      }
      return dados.operadores;
    }
  } catch (err) {
    console.warn("Erro ao remover operador no servidor:", err);
  }

  return lista;
}

export async function sincronizarOperadoresComServidor(): Promise<{ operadores: string[]; ativo: string }> {
  try {
    const res = await fetch("/api/operadores");
    const dados = await res.json();
    if (dados.ok && Array.isArray(dados.operadores)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(OPERADORES_KEY, JSON.stringify(dados.operadores));
        const localAtivo = localStorage.getItem(OPERADOR_ATIVO_KEY);
        const ativoFinal = localAtivo || dados.ativo || dados.operadores[0] || "";
        if (ativoFinal) {
          localStorage.setItem(OPERADOR_ATIVO_KEY, ativoFinal);
        }
        window.dispatchEvent(
          new CustomEvent("operador-atualizado", {
            detail: { lista: dados.operadores, ativo: ativoFinal },
          })
        );
        return { operadores: dados.operadores, ativo: ativoFinal };
      }
    }
  } catch (err) {
    console.warn("Erro ao sincronizar operadores com servidor:", err);
  }

  return {
    operadores: obterOperadoresCadastrados(),
    ativo: obterOperadorAtivo(),
  };
}

