import * as XLSX from "xlsx";
import { LaudoUrina, RotinaItem } from "@/types/urinalise";

function escaparXml(valor: any): string {
  if (valor === null || valor === undefined) return "";
  const str = String(valor).trim();
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function limparAspecto(val?: string): string {
  if (!val) return "Límpido";
  const v = val.trim();
  if (v.toLowerCase().includes("límpido") || v.toLowerCase().includes("limpido")) {
    if (v.toLowerCase().includes("ligeiramente")) return "Ligeiramente Turvo";
    return "Límpido";
  }
  if (v.toLowerCase().includes("turvo")) {
    if (v.toLowerCase().includes("ligeiramente")) return "Ligeiramente Turvo";
    return "Turvo";
  }
  return v;
}

function extrairNumero(val?: string): string {
  if (!val) return "";
  const match = val.replace(/\./g, "").match(/\d+/);
  return match ? match[0] : "";
}

function formatarDataPtBr(iso: string): string {
  if (!iso) return "";
  const parte = iso.split("T")[0];
  const [ano, mes, dia] = parte.split("-");
  if (ano && mes && dia) {
    return `${dia}/${mes}/${ano}`;
  }
  return parte;
}

export interface ItemXmlUrinalise {
  prontuario: string;
  data: string;
  data_formatada: string;
  nome_paciente: string;
  idade_sexo: string;
  posto_unidade: string;
  solicitante: string;
  status: string;
  recoleta: "sim" | "nao";
  recoleta_motivo?: string;

  // Exame Físico
  volume: string;
  volume_completo: string;
  cor: string;
  aspecto: string;
  ph: string;
  densidade: string;

  // Exame Químico
  proteina: string;
  glicose: string;
  corpos_cetonicos: string;
  bilirrubina: string;
  urobilinogenio: string;
  nitrito: string;
  sangue_oculto: string;

  // Sedimentoscopia
  hemacias: string;
  hemacias_numero: string;
  leucocitos: string;
  leucocitos_numero: string;
  celulas_epiteliais: string;
  cilindros: string;
  cristais: string;
  bacterias: string;
  filamentos_de_muco: string;
  outros_elementos: string;
  observacao: string;
}

function estaNoIntervaloData(d?: string, de?: string, ate?: string): boolean {
  if (!d) return true;
  const data = d.split("T")[0];
  if (de && ate) {
    return data >= de && data <= ate;
  }
  if (de) {
    return data === de;
  }
  return true;
}

/**
 * Monta os dados padronizados para o modelo de laudo oficial
 * garantindo a trava de segurança por DATA (somente exames do dia ou período solicitado).
 */
export function prepararDadosXmlUrinalise(
  dataAlvo: string,
  rotina: RotinaItem[],
  laudos: LaudoUrina[],
  dataFim?: string
): { dataAlvo: string; dataFormatada: string; itens: ItemXmlUrinalise[] } {
  const de = (dataAlvo || "").split("T")[0];
  const ate = (dataFim || "").split("T")[0] || de;
  const ehPeriodo = Boolean(dataFim && ate !== de);

  const dataFormatada = ehPeriodo
    ? `${formatarDataPtBr(de)} a ${formatarDataPtBr(ate)}`
    : formatarDataPtBr(de);

  // Mapa de laudos indexados por prontuário LIMPO
  const mapaLaudos = new Map<string, LaudoUrina>();
  laudos.forEach((l) => {
    const d = (l.data_hora || "").split("T")[0];
    // Trava de segurança: somente laudos com data compatível
    if (!d || estaNoIntervaloData(d, de, ate)) {
      const p = (l.prontuario || "").replace(/\D/g, "");
      if (p) {
        mapaLaudos.set(p, l);
      }
    }
  });

  const itensResultado: ItemXmlUrinalise[] = [];
  const prontuariosProcessados = new Set<string>();

  // 1. Processar a partir da rotina do dia
  rotina.forEach((item) => {
    const dItem = (item.data || item.data_rotina || "").split("T")[0];
    if (dItem && !estaNoIntervaloData(dItem, de, ate)) return; // Trava: ignora qualquer paciente fora do período

    const prontLimpo = (item.prontuario || "").replace(/\D/g, "");
    if (!prontLimpo || prontuariosProcessados.has(prontLimpo)) return;

    // Apenas quem tem Urina 1 ou laudo gerado
    const laudo = mapaLaudos.get(prontLimpo);
    const temUrina = item.tem_urina !== false || (laudo && laudo.tem_urina !== false);
    if (!temUrina && !laudo) return;

    prontuariosProcessados.add(prontLimpo);

    const isRecoleta = (laudo?.status === "recoleta") || (item.status_laudo === "recoleta");
    const recExames = (laudo?.recoleta_exames || item.recoleta_exames || []).map((x) => x.toLowerCase());
    const recoletaUrina = isRecoleta && (recExames.includes("urina") || (!recExames.length && temUrina));

    const vol = laudo?.volume || "60 mL";
    const volNum = extrairNumero(vol) || "60";
    const cor = laudo?.cor || "Amarelo Claro";
    const asp = limparAspecto(laudo?.aspecto);
    const ph = laudo?.ph || "6.0";
    const dens = laudo?.densidade || "1.020";

    const proteina = laudo?.proteina || "Negativo";
    const glicose = laudo?.glicose || "Negativo";
    const cetona = laudo?.cetona || "Negativo";
    const bilirrubina = laudo?.bilirrubina || "Negativo";
    const urobilinogenio = laudo?.urobilinogenio || "Negativo";
    const nitrito = laudo?.nitrito || "Negativo";
    const sangue = laudo?.sangue || "Negativo";

    const hemRaw = laudo?.hemacias_campo || "1.000 /mL";
    const leuRaw = laudo?.leucocitos_campo || "4.000 /mL";
    const hemNum = extrairNumero(hemRaw) || "1000";
    const leuNum = extrairNumero(leuRaw) || "4000";

    const cel = laudo?.celulas_epiteliais || "Raras";
    const cil = laudo?.cilindros || "Ausentes";
    const cris = laudo?.cristais || "Ausentes";
    const bac = laudo?.bacterias || "Ausentes";
    const muco = laudo?.muco || "Ausentes";
    const outros = laudo?.outros_elementos || "Ausentes";
    const obs = laudo?.observacoes || "";

    itensResultado.push({
      prontuario: item.prontuario || laudo?.prontuario || "",
      data: dItem || de,
      data_formatada: formatarDataPtBr(dItem || de),
      nome_paciente: item.nome_paciente || laudo?.nome_paciente || "",
      idade_sexo: item.idade_sexo || laudo?.idade_sexo || "",
      posto_unidade: item.posto_unidade || laudo?.posto_unidade || "",
      solicitante: item.solicitante || laudo?.solicitante || "",
      status: laudo?.status || "pendente",
      recoleta: recoletaUrina ? "sim" : "nao",
      recoleta_motivo: recoletaUrina ? (laudo?.recoleta_motivo || laudo?.observacoes || "Amostra inadequada") : undefined,

      volume: volNum,
      volume_completo: vol,
      cor,
      aspecto: asp,
      ph,
      densidade: dens,

      proteina,
      glicose,
      corpos_cetonicos: cetona,
      bilirrubina,
      urobilinogenio: urobilinogenio === "Normal" ? "Negativo" : urobilinogenio,
      nitrito,
      sangue_oculto: sangue,

      hemacias: hemRaw.replace(/\s*\/mL\s*/i, "").trim() || "1.000",
      hemacias_numero: hemNum,
      leucocitos: leuRaw.replace(/\s*\/mL\s*/i, "").trim() || "4.000",
      leucocitos_numero: leuNum,
      celulas_epiteliais: cel,
      cilindros: cil,
      cristais: cris,
      bacterias: bac,
      filamentos_de_muco: muco,
      outros_elementos: outros,
      observacao: obs,
    });
  });

  // 2. Se houver laudos que não estavam na lista de rotina mas pertencem ao dia/período
  laudos.forEach((laudo) => {
    const d = (laudo.data_hora || "").split("T")[0];
    if (d && !estaNoIntervaloData(d, de, ate)) return; // Trava estrita de data/período

    const prontLimpo = (laudo.prontuario || "").replace(/\D/g, "");
    if (!prontLimpo || prontuariosProcessados.has(prontLimpo)) return;
    if (laudo.tem_urina === false) return;

    prontuariosProcessados.add(prontLimpo);

    const isRecoleta = laudo.status === "recoleta";
    const recExames = (laudo.recoleta_exames || []).map((x) => x.toLowerCase());
    const recoletaUrina = isRecoleta && (recExames.includes("urina") || !recExames.length);

    const vol = laudo.volume || "60 mL";
    const volNum = extrairNumero(vol) || "60";
    const cor = laudo.cor || "Amarelo Claro";
    const asp = limparAspecto(laudo.aspecto);
    const ph = laudo.ph || "6.0";
    const dens = laudo.densidade || "1.020";

    const hemRaw = laudo.hemacias_campo || "1.000 /mL";
    const leuRaw = laudo.leucocitos_campo || "4.000 /mL";

    itensResultado.push({
      prontuario: laudo.prontuario,
      data: d || de,
      data_formatada: formatarDataPtBr(d || de),
      nome_paciente: laudo.nome_paciente || "",
      idade_sexo: laudo.idade_sexo || "",
      posto_unidade: laudo.posto_unidade || "",
      solicitante: laudo.solicitante || "",
      status: laudo.status || "finalizado",
      recoleta: recoletaUrina ? "sim" : "nao",
      recoleta_motivo: recoletaUrina ? (laudo.recoleta_motivo || laudo.observacoes || "Amostra inadequada") : undefined,

      volume: volNum,
      volume_completo: vol,
      cor,
      aspecto: asp,
      ph,
      densidade: dens,

      proteina: laudo.proteina || "Negativo",
      glicose: laudo.glicose || "Negativo",
      corpos_cetonicos: laudo.cetona || "Negativo",
      bilirrubina: laudo.bilirrubina || "Negativo",
      urobilinogenio: laudo.urobilinogenio === "Normal" ? "Negativo" : (laudo.urobilinogenio || "Negativo"),
      nitrito: laudo.nitrito || "Negativo",
      sangue_oculto: laudo.sangue || "Negativo",

      hemacias: hemRaw.replace(/\s*\/mL\s*/i, "").trim() || "1.000",
      hemacias_numero: extrairNumero(hemRaw) || "1000",
      leucocitos: leuRaw.replace(/\s*\/mL\s*/i, "").trim() || "4.000",
      leucocitos_numero: extrairNumero(leuRaw) || "4000",
      celulas_epiteliais: laudo.celulas_epiteliais || "Raras",
      cilindros: laudo.cilindros || "Ausentes",
      cristais: laudo.cristais || "Ausentes",
      bacterias: laudo.bacterias || "Ausentes",
      filamentos_de_muco: laudo.muco || "Ausentes",
      outros_elementos: laudo.outros_elementos || "Ausentes",
      observacao: laudo.observacoes || "",
    });
  });

  return {
    dataAlvo: de,
    dataFormatada,
    itens: itensResultado,
  };
}

/**
 * Gera string XML estruturada e compatível com extensões de automação
 */
export function gerarStringXmlUrinalise(
  dataAlvo: string,
  rotina: RotinaItem[],
  laudos: LaudoUrina[],
  dataFim?: string
): string {
  const dados = prepararDadosXmlUrinalise(dataAlvo, rotina, laudos, dataFim);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rotina_urinalise data="${escaparXml(dados.dataAlvo)}" data_formatada="${escaparXml(dados.dataFormatada)}" total_pacientes="${dados.itens.length}" gerado_em="${new Date().toISOString()}">\n`;

  dados.itens.forEach((it) => {
    xml += `  <paciente>\n`;
    xml += `    <prontuario>${escaparXml(it.prontuario)}</prontuario>\n`;
    xml += `    <data>${escaparXml(it.data)}</data>\n`;
    xml += `    <data_formatada>${escaparXml(it.data_formatada)}</data_formatada>\n`;
    xml += `    <nome>${escaparXml(it.nome_paciente)}</nome>\n`;
    xml += `    <status>${escaparXml(it.status)}</status>\n`;
    xml += `    <recoleta>${escaparXml(it.recoleta)}</recoleta>\n`;
    if (it.recoleta_motivo) {
      xml += `    <recoleta_motivo>${escaparXml(it.recoleta_motivo)}</recoleta_motivo>\n`;
    }

    xml += `    <!-- EXAME FISICO -->\n`;
    xml += `    <volume>${escaparXml(it.volume)}</volume>\n`;
    xml += `    <volume_ml>${escaparXml(it.volume)}</volume_ml>\n`;
    xml += `    <volume_completo>${escaparXml(it.volume_completo)}</volume_completo>\n`;
    xml += `    <cor>${escaparXml(it.cor)}</cor>\n`;
    xml += `    <aspecto>${escaparXml(it.aspecto)}</aspecto>\n`;
    xml += `    <ph>${escaparXml(it.ph)}</ph>\n`;
    xml += `    <densidade>${escaparXml(it.densidade)}</densidade>\n`;

    xml += `    <!-- EXAME QUIMICO -->\n`;
    xml += `    <proteina>${escaparXml(it.proteina)}</proteina>\n`;
    xml += `    <glicose>${escaparXml(it.glicose)}</glicose>\n`;
    xml += `    <corpos_cetonicos>${escaparXml(it.corpos_cetonicos)}</corpos_cetonicos>\n`;
    xml += `    <bilirrubina>${escaparXml(it.bilirrubina)}</bilirrubina>\n`;
    xml += `    <urobilinogenio>${escaparXml(it.urobilinogenio)}</urobilinogenio>\n`;
    xml += `    <nitrito>${escaparXml(it.nitrito)}</nitrito>\n`;
    xml += `    <sangue_oculto>${escaparXml(it.sangue_oculto)}</sangue_oculto>\n`;

    xml += `    <!-- SEDIMENTOSCOPIA -->\n`;
    xml += `    <hemacias>${escaparXml(it.hemacias)}</hemacias>\n`;
    xml += `    <hemacias_numero>${escaparXml(it.hemacias_numero)}</hemacias_numero>\n`;
    xml += `    <leucocitos>${escaparXml(it.leucocitos)}</leucocitos>\n`;
    xml += `    <leucocitos_numero>${escaparXml(it.leucocitos_numero)}</leucocitos_numero>\n`;
    xml += `    <celulas_epiteliais>${escaparXml(it.celulas_epiteliais)}</celulas_epiteliais>\n`;
    xml += `    <cilindros>${escaparXml(it.cilindros)}</cilindros>\n`;
    xml += `    <cristais>${escaparXml(it.cristais)}</cristais>\n`;
    xml += `    <bacterias>${escaparXml(it.bacterias)}</bacterias>\n`;
    xml += `    <filamentos_de_muco>${escaparXml(it.filamentos_de_muco)}</filamentos_de_muco>\n`;
    xml += `    <muco>${escaparXml(it.filamentos_de_muco)}</muco>\n`;
    xml += `    <outros_elementos>${escaparXml(it.outros_elementos)}</outros_elementos>\n`;
    xml += `    <observacao>${escaparXml(it.observacao)}</observacao>\n`;
    xml += `  </paciente>\n`;
  });

  xml += `</rotina_urinalise>\n`;
  return xml;
}

/**
 * Dispara o download automático do arquivo XML no navegador
 */
export function baixarXmlUrinalise(
  dataAlvo: string,
  rotina: RotinaItem[],
  laudos: LaudoUrina[],
  dataFim?: string
): { sucesso: boolean; totalItens: number; nomeArquivo: string } {
  const xmlString = gerarStringXmlUrinalise(dataAlvo, rotina, laudos, dataFim);
  const de = (dataAlvo || new Date().toISOString().split("T")[0]).split("T")[0];
  const ate = (dataFim || "").split("T")[0];
  const ehPeriodo = Boolean(ate && ate !== de);

  const nomeArquivo = ehPeriodo
    ? `urinalise_rotina_${de}_a_${ate}.xml`
    : `urinalise_rotina_${de}.xml`;

  const blob = new Blob([xmlString], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const dados = prepararDadosXmlUrinalise(dataAlvo, rotina, laudos, dataFim);
  return {
    sucesso: true,
    totalItens: dados.itens.length,
    nomeArquivo,
  };
}

/**
 * Dispara o download automático do arquivo Excel (.xlsx) para a Extensão / Validador
 * com todos os parâmetros formatados e padronizados
 */
export function baixarXlsxUrinalise(
  dataAlvo: string,
  rotina: RotinaItem[],
  laudos: LaudoUrina[],
  dataFim?: string
): { sucesso: boolean; totalItens: number; nomeArquivo: string } {
  const dados = prepararDadosXmlUrinalise(dataAlvo, rotina, laudos, dataFim);

  const rows = dados.itens.map((it) => ({
    PRONTUARIO: it.prontuario,
    PACIENTE: it.nome_paciente,
    DATA: it.data,
    DATA_FORMATADA: it.data_formatada,
    POSTO_UNIDADE: it.posto_unidade || "UBS Central",
    SOLICITANTE: it.solicitante || "Dr(a). Clínico Geral",
    VOLUME_ML: it.volume,
    COR: it.cor,
    ASPECTO: it.aspecto,
    DENSIDADE: it.densidade,
    PH: it.ph,
    PROTEINA: it.proteina,
    GLICOSE: it.glicose,
    CETONAS: it.corpos_cetonicos,
    BILIRRUBINA: it.bilirrubina,
    UROBILINOGENIO: it.urobilinogenio,
    NITRITO: it.nitrito,
    SANGUE: it.sangue_oculto,
    HEMACIAS: it.hemacias,
    HEMACIAS_NUMERO: it.hemacias_numero,
    LEUCOCITOS: it.leucocitos,
    LEUCOCITOS_NUMERO: it.leucocitos_numero,
    CELULAS_EPITELIAIS: it.celulas_epiteliais,
    CILINDROS: it.cilindros,
    CRISTAIS: it.cristais,
    BACTERIAS: it.bacterias,
    MUCO: it.filamentos_de_muco,
    OUTROS_ELEMENTOS: it.outros_elementos,
    OBSERVACOES: it.observacao,
    STATUS: it.status.toUpperCase(),
    RECOLETA: it.recoleta.toUpperCase(),
    RECOLETA_MOTIVO: it.recoleta_motivo || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "AutoLaudo_Urina");

  const de = (dataAlvo || new Date().toISOString().split("T")[0]).split("T")[0];
  const ate = (dataFim || "").split("T")[0];
  const ehPeriodo = Boolean(ate && ate !== de);

  const nomeArquivo = ehPeriodo
    ? `AutoLaudo_Urinalise_${de}_a_${ate}.xlsx`
    : `AutoLaudo_Urinalise_${de}.xlsx`;

  XLSX.writeFile(wb, nomeArquivo);

  return {
    sucesso: true,
    totalItens: dados.itens.length,
    nomeArquivo,
  };
}
