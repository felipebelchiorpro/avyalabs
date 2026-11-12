// =========================================================================
// BancadaLab SUS • Service Worker v2.0 (API Direta Instantânea)
// Captura automaticamente o Bearer Token da sessão do Conecta SUS,
// consulta os endpoints oficiais de cadastro e agendamento em < 1s e
// grava os dados enriquecidos no Cloudflare D1 do BancadaLab.
// =========================================================================

const CONECTASUS_URL_PATTERN = "https://caconde.conectasus.com.br/*";
const API_CONECTA_BASE = "https://api-saude.conectasus.com.br/api";

function normPront(val) {
  const dig = String(val || "").replace(/\D/g, "");
  return dig ? dig.replace(/^0+/, "") || "0" : String(val || "").trim().toLowerCase();
}

async function atualizarLog(mensagem, tipo = "info") {
  const { bancadalab_logs = [] } = await chrome.storage.local.get("bancadalab_logs");
  const novo = {
    hora: new Date().toLocaleTimeString("pt-BR"),
    tipo,
    mensagem,
  };
  const atualizados = [novo, ...bancadalab_logs].slice(0, 35);
  await chrome.storage.local.set({ bancadalab_logs: atualizados });
}

async function notificarBancada(tabId, payload) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, payload);
  } catch (err) {
    console.warn("[BancadaLab Ext] Não foi possível notificar aba do BancadaLab:", err.message);
  }
}

async function localizarAbaConectaSus() {
  const tabs = await chrome.tabs.query({ url: CONECTASUS_URL_PATTERN });
  if (!tabs || tabs.length === 0) return null;
  const logada = tabs.find((t) => t.url && !t.url.toLowerCase().includes("login"));
  return logada || tabs[0];
}

// =========================================================================
// 1. CAPTURA PASSIVA DO BEARER TOKEN DO CONECTA SUS
// =========================================================================
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders || [];
    const authHeader = headers.find((h) => h.name.toLowerCase() === "authorization");
    if (authHeader && authHeader.value && authHeader.value.startsWith("Bearer ")) {
      const token = authHeader.value.slice(7).trim();
      if (token.length > 20) {
        chrome.storage.local.set({
          conectasus_bearer_token: token,
          conectasus_token_at: Date.now(),
        });
      }
    }
  },
  { urls: ["https://api-saude.conectasus.com.br/*"] },
  ["requestHeaders"]
);

// Tenta obter o JWT ativo: 1) cache webRequest, 2) varredura na aba do Conecta SUS
async function obterTokenSessao() {
  const { conectasus_bearer_token } = await chrome.storage.local.get("conectasus_bearer_token");
  if (conectasus_bearer_token) {
    return conectasus_bearer_token;
  }

  const aba = await localizarAbaConectaSus();
  if (!aba) return null;

  try {
    const resp = await chrome.tabs.sendMessage(aba.id, { type: "OBTER_TOKEN_CONECTASUS" });
    if (resp && resp.token) {
      await chrome.storage.local.set({
        conectasus_bearer_token: resp.token,
        conectasus_token_at: Date.now(),
      });
      return resp.token;
    }
  } catch (_) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: aba.id },
        files: ["content_conectasus.js"],
      });
      const resp = await chrome.tabs.sendMessage(aba.id, { type: "OBTER_TOKEN_CONECTASUS" });
      if (resp && resp.token) {
        await chrome.storage.local.set({
          conectasus_bearer_token: resp.token,
          conectasus_token_at: Date.now(),
        });
        return resp.token;
      }
    } catch (_) {}
  }

  return null;
}

// =========================================================================
// 2. CONSULTA DIRETA NA API DO CONECTA SUS (2 CHAMADAS JSON)
// =========================================================================
function extrairPacienteIdDaLinha(row) {
  if (!row || typeof row !== "object") return null;
  if (row.paciente_id) return row.paciente_id;
  if (row.id) return row.id;

  // Se o id vier embutido no HTML/string da coluna "actions"
  const actionsStr = String(row.actions || "");
  const match =
    actionsStr.match(/agendamento-exame\/(\d+)/i) ||
    actionsStr.match(/paciente(?:_id)?[\/=: "'']+?(\d+)/i) ||
    actionsStr.match(/\((\d{3,8})\)/) ||
    actionsStr.match(/\/(\d{3,8})(?:["'\/\s]|$)/);

  return match ? match[1] : null;
}

async function consultarConectaSusPorApi(prontuario, agendamentoNumero, bancadaTabId) {
  const stepNotify = async (step, msg) => {
    await atualizarLog(`Passo ${step}/3: ${msg}`, "info");
    await notificarBancada(bancadaTabId, {
      type: "BANCADALAB_PROGRESSO_CONECTASUS",
      step,
      mensagem: msg,
    });
  };

  let token = await obterTokenSessao();
  if (!token) {
    const aba = await localizarAbaConectaSus();
    const errMsg = aba
      ? "Token da sessão não capturado ainda. Clique em qualquer menu ou faça 1 busca no Conecta SUS para ativar a sessão e tente de novo."
      : "Nenhuma aba do Conecta SUS (caconde.conectasus.com.br) encontrada aberta. Abra e faça login primeiro.";
    throw new Error(errMsg);
  }

  const headersApi = {
    Authorization: `Bearer ${token}`,
    customer: "caconde",
    Accept: "application/json, text/plain, */*",
  };

  // --- CHAMADA 1: Buscar paciente pelo Prontuário Municipal ---
  await stepNotify(1, `Consultando prontuário ${prontuario} na API do Conecta SUS...`);

  const params = new URLSearchParams({
    "columns[0][data]": "nome",
    "columns[0][name]": "cadastro_cidadao.nome",
    "columns[0][orderable]": "true",
    "columns[0][searchable]": "false",
    "columns[1][data]": "nome_social",
    "columns[1][name]": "cadastro_cidadao.nome_social",
    "columns[1][orderable]": "true",
    "columns[1][searchable]": "false",
    "columns[2][data]": "data_nascimento",
    "columns[2][name]": "cadastro_cidadao.data_nascimento",
    "columns[2][orderable]": "true",
    "columns[2][searchable]": "false",
    "columns[3][data]": "nome_mae",
    "columns[3][name]": "cadastro_cidadao.nome_mae",
    "columns[3][orderable]": "true",
    "columns[3][searchable]": "false",
    "columns[4][data]": "prontuario",
    "columns[4][name]": "cadastro_paciente.prontuario",
    "columns[4][orderable]": "true",
    "columns[4][searchable]": "true",
    "columns[5][data]": "cpf",
    "columns[5][name]": "cadastro_cidadao.cpf",
    "columns[5][orderable]": "true",
    "columns[5][searchable]": "false",
    "columns[6][data]": "cns",
    "columns[6][name]": "cadastro_cidadao.cns",
    "columns[6][orderable]": "true",
    "columns[6][searchable]": "false",
    "columns[7][data]": "actions",
    "columns[7][name]": "actions",
    "columns[7][orderable]": "false",
    "columns[7][searchable]": "false",
    draw: "1",
    length: "10",
    "search[value]": String(prontuario).trim(),
    start: "0",
    "order[0][column]": "0",
    "order[0][dir]": "asc",
    "order[0][columnName]": "nome",
  });

  const urlDatatable = `${API_CONECTA_BASE}/cadastro/paciente/datatable?${params.toString()}`;
  const resLista = await fetch(urlDatatable, { method: "GET", headers: headersApi });

  if (resLista.status === 401 || resLista.status === 403) {
    await chrome.storage.local.remove("conectasus_bearer_token");
    throw new Error("Sessão do Conecta SUS expirada (401). Faça login novamente ou clique na aba do Conecta SUS.");
  }

  if (!resLista.ok) {
    throw new Error(`Erro HTTP ${resLista.status} ao consultar paciente no Conecta SUS.`);
  }

  const jsonLista = await resLista.json();
  const registros = Array.isArray(jsonLista?.data) ? jsonLista.data : [];
  if (registros.length === 0) {
    throw new Error(`Prontuário ${prontuario} não encontrado no Conecta SUS.`);
  }

  const alvoNorm = normPront(prontuario);
  const linhaPaciente =
    registros.find((r) => normPront(r.prontuario) === alvoNorm) || registros[0];

  const pacienteId = extrairPacienteIdDaLinha(linhaPaciente);
  if (!pacienteId) {
    throw new Error(
      `Paciente encontrado (${linhaPaciente.nome || prontuario}), mas não foi possível identificar o paciente_id.`
    );
  }

  // --- CHAMADA 2: Buscar perfil completo + lista de agendamentos de exames ---
  await stepNotify(2, `Carregando exames agendados do paciente #${pacienteId}...`);

  const urlAgendamentos = `${API_CONECTA_BASE}/exame-laboratorial/agendamento-exame/${pacienteId}`;
  const resAgend = await fetch(urlAgendamentos, { method: "GET", headers: headersApi });

  if (!resAgend.ok) {
    throw new Error(`Erro HTTP ${resAgend.status} ao buscar exames do paciente #${pacienteId}.`);
  }

  const jsonAgend = await resAgend.json();
  const pacForm = jsonAgend?.form?.paciente || {};
  const agendamentos = Array.isArray(jsonAgend?.model?.agendamentos)
    ? jsonAgend.model.agendamentos
    : [];

  const nomePaciente = (pacForm.cidadao_nome || linhaPaciente.nome || `PACIENTE #${prontuario}`)
    .trim()
    .toUpperCase();
  const prontuarioOficial = pacForm.paciente_prontuario || linhaPaciente.prontuario || prontuario;
  const dataNascimento = pacForm.cidadao_data_nascimento || linhaPaciente.data_nascimento || "";

  const agendStr = String(agendamentoNumero || "").trim();
  let agEncontrado = agendamentos.find(
    (ag) =>
      String(ag.agendamento_numero) === agendStr ||
      String(ag.agendamento_id) === agendStr
  );

  // Se o usuário não informou número de agendamento, tenta pegar o último do dia atual
  if (!agEncontrado && !agendStr && agendamentos.length > 0) {
    agEncontrado = agendamentos[agendamentos.length - 1];
  }

  if (!agEncontrado) {
    const numsDisponiveis = agendamentos
      .slice(-5)
      .map((a) => `${a.agendamento_numero} (${a.data})`)
      .join(", ");
    throw new Error(
      `Agendamento nº ${agendStr} não encontrado para ${nomePaciente}.` +
        (numsDisponiveis ? ` Recentes: ${numsDisponiveis}` : "")
    );
  }

  const medicoSolicitante =
    agEncontrado.medico_nome ||
    agEncontrado.medico_solicitante?.cidadao_nome ||
    "Dr(a). Clínico(a) Geral / UBS";

  const exames = Array.isArray(agEncontrado.incluido)
    ? agEncontrado.incluido.map((ex) => ex.nome).filter(Boolean)
    : [];

  return {
    prontuario: prontuarioOficial,
    agendamento: String(agEncontrado.agendamento_numero || agendStr),
    nome: nomePaciente,
    dataNascimento,
    medicoSolicitante,
    exames,
    urgente: Boolean(agEncontrado.urgente),
    dataAgendamento: agEncontrado.data || "",
    unidade: agEncontrado.unidade_nome || pacForm.unidade_nome_fantasia || "",
  };
}

// =========================================================================
// 3. ORQUESTRAÇÃO E SINCRONIZAÇÃO COM CLOUDFLARE D1 (BANCADALAB)
// =========================================================================
async function iniciarBuscaConectaSus({ prontuario, agendamento, bancadaApiUrl }, bancadaTabId) {
  await atualizarLog(`Iniciando consulta API: Prontuário ${prontuario} | Agendamento ${agendamento}`);

  const { bancadalab_api_url } = await chrome.storage.local.get("bancadalab_api_url");
  const apiBase = (bancadaApiUrl || bancadalab_api_url || "").replace(/\/+$/, "");
  if (apiBase) {
    await chrome.storage.local.set({ bancadalab_api_url: apiBase });
  }

  try {
    const dados = await consultarConectaSusPorApi(prontuario, agendamento, bancadaTabId);

    await notificarBancada(bancadaTabId, {
      type: "BANCADALAB_PROGRESSO_CONECTASUS",
      step: 3,
      mensagem: `Salvando ${dados.nome} no Cloudflare D1...`,
    });

    await atualizarLog(
      `Localizado: ${dados.nome} | DN: ${dados.dataNascimento} | Médico: ${dados.medicoSolicitante} | Exames: ${dados.exames.join(", ")}`,
      "success"
    );

    let respostaServidor = null;
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/triagem-edta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prontuario: dados.prontuario,
            agendamento: dados.agendamento,
            nome: dados.nome,
            dataNascimento: dados.dataNascimento,
            medicoSolicitante: dados.medicoSolicitante,
            exames: dados.exames,
            urgencia: dados.urgente,
            salvar: true,
          }),
        });
        respostaServidor = await res.json();
        await atualizarLog(
          `Salvo no Cloudflare D1 (${res.status}): ${respostaServidor?.message || "OK"}`,
          res.ok ? "success" : "error"
        );
      } catch (apiErr) {
        await atualizarLog(`Erro ao gravar no D1 (${apiBase}): ${apiErr.message}`, "error");
      }
    }

    await notificarBancada(bancadaTabId, {
      type: "BANCADALAB_RETORNO_CONECTASUS",
      ok: true,
      paciente: respostaServidor?.paciente || dados,
      salvoNoD1: Boolean(respostaServidor?.ok),
    });

    return { ok: true, paciente: respostaServidor?.paciente || dados };
  } catch (err) {
    const msg = err?.message || "Erro ao consultar API do Conecta SUS.";
    await atualizarLog(msg, "error");
    await notificarBancada(bancadaTabId, {
      type: "BANCADALAB_ERRO_CONECTASUS",
      error: msg,
    });
    return { ok: false, error: msg };
  }
}

// Escuta mensagens dos content scripts e do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "CONECTASUS_TOKEN_ENCONTRADO" && message.token) {
      await chrome.storage.local.set({
        conectasus_bearer_token: message.token,
        conectasus_token_at: Date.now(),
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "BANCADALAB_INICIAR_BUSCA") {
      const result = await iniciarBuscaConectaSus(message, sender?.tab?.id || null);
      sendResponse(result);
      return;
    }
  })();

  return true;
});
