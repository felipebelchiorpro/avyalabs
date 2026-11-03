// Armazenamento e sincronização permanente de médicos solicitantes da rede de Caconde
// Fica gravado no Google Sheets (aba Medicos_Caconde) e compartilhado entre PC e celular para todos os dias.

export const MEDICOS_PADRAO_INICIAIS: string[] = [];

const STORAGE_KEY_MEDICOS = "caconde_medicos_lista";
const STORAGE_KEY_MEDICO_PADRAO = "caconde_medico_padrao";

/**
 * Retorna os médicos cadastrados.
 * Não injeta médicos aleatórios — se o usuário não cadastrou nenhum ou apagou todos, retorna vazio.
 */
export function obterMedicosCadastrados(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MEDICOS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler médicos cadastrados:", e);
  }
  return [];
}

/**
 * Salva a lista de médicos localmente e sincroniza com o Google Sheets no servidor
 */
export function salvarMedicosCadastrados(lista: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unicos = Array.from(new Set(lista.map((s) => s.trim()))).filter(Boolean);
    localStorage.setItem(STORAGE_KEY_MEDICOS, JSON.stringify(unicos));
    window.dispatchEvent(new CustomEvent("medicos-atualizados", { detail: unicos }));

    // Sincronizar permanentemente com o Google Sheets / Servidor
    fetch("/api/medicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "salvar_todos",
        lista: unicos,
        padrao: obterMedicoPadrao(),
      }),
    }).catch((err) => console.warn("Aviso ao sincronizar médicos no servidor:", err));
  } catch (e) {
    console.error("Erro ao salvar médicos:", e);
  }
}

/**
 * Adiciona um médico de forma permanente
 */
export function adicionarMedico(nome: string): string[] {
  const limpo = nome.trim();
  if (!limpo) return obterMedicosCadastrados();
  const atuais = obterMedicosCadastrados();
  if (!atuais.includes(limpo)) {
    const novaLista = [...atuais, limpo].sort((a, b) => a.localeCompare(b, "pt-BR"));
    salvarMedicosCadastrados(novaLista);
    return novaLista;
  }
  return atuais;
}

/**
 * Remove um médico de forma permanente
 */
export function removerMedico(nome: string): string[] {
  const atuais = obterMedicosCadastrados();
  const novaLista = atuais.filter((m) => m !== nome);
  salvarMedicosCadastrados(novaLista);

  if (obterMedicoPadrao() === nome) {
    definirMedicoPadrao("");
  }
  return novaLista;
}

/**
 * Retorna o médico padrão selecionado
 */
export function obterMedicoPadrao(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY_MEDICO_PADRAO) || "";
  } catch {
    return "";
  }
}

/**
 * Define o médico padrão permanente
 */
export function definirMedicoPadrao(nome: string): void {
  if (typeof window === "undefined") return;
  try {
    const limpo = nome.trim();
    localStorage.setItem(STORAGE_KEY_MEDICO_PADRAO, limpo);
    fetch("/api/medicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "definir_padrao", padrao: limpo }),
    }).catch(() => {});
  } catch {}
}

/**
 * Sincroniza os médicos salvos no Google Sheets / Servidor com o dispositivo atual
 * (Garante que cadastros feitos no PC apareçam no celular e permaneçam para todos os dias)
 */
export async function sincronizarMedicosComServidor(): Promise<{ medicos: string[]; padrao: string }> {
  try {
    const res = await fetch("/api/medicos");
    const data = await res.json();
    if (data.ok && Array.isArray(data.medicos)) {
      const listaServidor: string[] = data.medicos;
      const padraoServidor: string = data.padrao || "";

      if (typeof window !== "undefined") {
        const locais = obterMedicosCadastrados();

        // Se o servidor tem dados cadastrados, prioriza o servidor (Google Sheets)
        if (listaServidor.length > 0) {
          localStorage.setItem(STORAGE_KEY_MEDICOS, JSON.stringify(listaServidor));
          if (padraoServidor) {
            localStorage.setItem(STORAGE_KEY_MEDICO_PADRAO, padraoServidor);
          }
          window.dispatchEvent(new CustomEvent("medicos-atualizados", { detail: listaServidor }));
          return { medicos: listaServidor, padrao: padraoServidor };
        } else if (locais.length > 0) {
          // Se o servidor está vazio mas o navegador já tem médicos salvos, envia para o Google Sheets
          salvarMedicosCadastrados(locais);
          return { medicos: locais, padrao: obterMedicoPadrao() };
        }
      }
      return { medicos: listaServidor, padrao: padraoServidor };
    }
  } catch (err) {
    console.warn("Aviso ao buscar médicos no servidor:", err);
  }
  return { medicos: obterMedicosCadastrados(), padrao: obterMedicoPadrao() };
}
