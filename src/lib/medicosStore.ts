// Armazenamento e gerenciamento de médicos solicitantes da rede municipal de Caconde

export const MEDICOS_PADRAO_INICIAIS: string[] = [
  "Dr. Carlos Eduardo (Clínico Geral)",
  "Dra. Mariana Rezende (Clínica / UBS)",
  "Dr. Lucas Fernandes (Pediatria)",
  "Dra. Patrícia Silveira (Ginecologia / Pré-Natal)",
  "Dr. Marcelo Vieira (UBS Central)",
  "Dr. Fernando Rocha (PSF Redentora)",
  "Dra. Camila Duarte (UBS Barrânia)",
  "Dr(a). Plantonista / Pronto Atendimento",
];

const STORAGE_KEY_MEDICOS = "caconde_medicos_lista";
const STORAGE_KEY_MEDICO_PADRAO = "caconde_medico_padrao";

export function obterMedicosCadastrados(): string[] {
  if (typeof window === "undefined") return MEDICOS_PADRAO_INICIAIS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MEDICOS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler médicos cadastrados:", e);
  }
  return MEDICOS_PADRAO_INICIAIS;
}

export function salvarMedicosCadastrados(lista: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unicos = Array.from(new Set(lista.map((s) => s.trim()))).filter(Boolean);
    localStorage.setItem(STORAGE_KEY_MEDICOS, JSON.stringify(unicos));
    window.dispatchEvent(new CustomEvent("medicos-atualizados", { detail: unicos }));
  } catch (e) {
    console.error("Erro ao salvar médicos:", e);
  }
}

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

export function removerMedico(nome: string): string[] {
  const atuais = obterMedicosCadastrados();
  const novaLista = atuais.filter((m) => m !== nome);
  salvarMedicosCadastrados(novaLista);
  return novaLista;
}

export function obterMedicoPadrao(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY_MEDICO_PADRAO) || "";
  } catch {
    return "";
  }
}

export function definirMedicoPadrao(nome: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_MEDICO_PADRAO, nome.trim());
  } catch {}
}

