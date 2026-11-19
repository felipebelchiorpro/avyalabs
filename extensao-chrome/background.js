// =========================================================================
// BancadaLab SUS • Service Worker v2.1 (Multi-SADT & Enriquecimento Automático)
// Captura automaticamente o Bearer Token da sessão do Conecta SUS,
// orquestra a divisão autônoma de agendamentos para Apoio (MS e São Lucas)
// e notifica todas as abas abertas do BancadaLab PWA.
// =========================================================================

const CONECTASUS_URL_PATTERN = "*://*.conectasus.com.br/*";
const API_CONECTA_BASE = "https://api-saude.conectasus.com.br/api";

function normPront(val) {
  const dig = String(val || "").replace(/\D/g, "");
  return dig ? dig.replace(/^0+/, "") || "0" : String(val || "").trim().toLowerCase();
}

async function atualizarLog(mensagem, tipo = "info") {
  console.log(`[BancadaLab Background] ${mensagem}`);
  try {
    const { bancadalab_logs = [] } = await chrome.storage.local.get("bancadalab_logs");
    const novo = {
      hora: new Date().toLocaleTimeString("pt-BR"),
      tipo,
      mensagem,
    };
    const atualizados = [novo, ...bancadalab_logs].slice(0, 35);
    await chrome.storage.local.set({ bancadalab_logs: atualizados });
  } catch (_) {}
}

async function notificarTodasAbasBancadaLab(payload) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (
        t.id &&
        t.url &&
        (t.url.includes("localhost") ||
          t.url.includes("vercel.app") ||
          t.url.includes("127.0.0.1") ||
          t.url.includes("/laboratorio-apoio"))
      ) {
        chrome.tabs.sendMessage(t.id, payload).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("[BancadaLab] Falha ao notificar abas da Bancada:", err);
  }
}

async function localizarAbaConectaSus() {
  const todasTabs = await chrome.tabs.query({});
  if (!todasTabs || todasTabs.length === 0) return null;

  // Busca aba que contenha 'conectasus.com.br' na URL
  const abaConecta = todasTabs.find(
    (t) => t.url && t.url.toLowerCase().includes("conectasus.com.br")
  );

  return abaConecta || null;
}

// Injeta o content_conectasus.js na aba caso ela tenha sido recarregada ou aberta antes da extensão
async function garantirContentScriptInjetado(tabId) {
  try {
    const pingResp = await chrome.tabs.sendMessage(tabId, { type: "PING_CONECTASUS" });
    if (pingResp && pingResp.ok) return true;
  } catch (_) {}

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content_conectasus.js"],
    });
    await new Promise((r) => setTimeout(r, 400));
    return true;
  } catch (err) {
    console.warn("[BancadaLab] Erro ao injetar content_conectasus.js:", err);
    return false;
  }
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
    const custHeader = headers.find((h) => h.name.toLowerCase() === "customer");
    if (custHeader && custHeader.value) {
      chrome.storage.local.set({
        conectasus_customer: custHeader.value,
      });
    }
  },
  { urls: ["https://api-saude.conectasus.com.br/*", "https://caconde.conectasus.com.br/*"] },
  ["requestHeaders"]
);

async function obterTokenSessao() {
  const { conectasus_bearer_token } = await chrome.storage.local.get("conectasus_bearer_token");
  if (conectasus_bearer_token) return conectasus_bearer_token;

  const aba = await localizarAbaConectaSus();
  if (!aba) return null;

  await garantirContentScriptInjetado(aba.id);

  try {
    const resp = await chrome.tabs.sendMessage(aba.id, { type: "OBTER_TOKEN_CONECTASUS" });
    if (resp && resp.token) {
      await chrome.storage.local.set({
        conectasus_bearer_token: resp.token,
        conectasus_token_at: Date.now(),
      });
      return resp.token;
    }
  } catch (_) {}

  return null;
}

// =========================================================================
// 2. ORQUESTRAÇÃO DE DIVISÃO DE SADTS / APOIO NO CONECTA SUS
// =========================================================================
async function executarApoioConectaSus(message, sendResponse) {
  const { agendamento, prontuario, destinoExames, modo, blocosExames, exames } = message;
  await atualizarLog(`Ordem recebida: Triar Agendamento #${agendamento || "—"} | Prontuário #${prontuario || "—"}`);

  const abaConecta = await localizarAbaConectaSus();
  if (!abaConecta) {
    const erroAba = "Nenhuma aba do Conecta SUS (caconde.conectasus.com.br) encontrada aberta. Por favor, abra a aba do Conecta SUS.";
    await atualizarLog(erroAba, "error");
    await notificarTodasAbasBancadaLab({
      type: "BANCADALAB_ERRO_CONECTASUS",
      error: erroAba,
    });
    if (typeof sendResponse === "function") sendResponse({ ok: false, error: erroAba });
    return;
  }

  // Garante que o content script está vivo e ativo na aba do Conecta SUS
  await notificarTodasAbasBancadaLab({
    type: "BANCADALAB_PROGRESSO_CONECTASUS",
    mensagem: "Conectando com a aba do Conecta SUS...",
  });

  await garantirContentScriptInjetado(abaConecta.id);

  // Envia a ordem para o content_conectasus.js
  chrome.tabs.sendMessage(
    abaConecta.id,
    {
      type: "EXECUTAR_SEPARACAO_INTELIGENTE_SADT",
      agendamento,
      prontuario,
      destinoExames: destinoExames || {},
      laboratorioDestino: message.laboratorioDestino || "MS",
      modo: modo || "mudar_laboratorio",
      blocosExames: blocosExames || null,
      exames: exames || null,
    },
    async (res) => {
      if (chrome.runtime.lastError) {
        const erroMsg = "Falha ao comunicar com o robô na aba do Conecta SUS: " + chrome.runtime.lastError.message;
        await atualizarLog(erroMsg, "error");
        await notificarTodasAbasBancadaLab({
          type: "BANCADALAB_ERRO_CONECTASUS",
          error: erroMsg,
        });
        if (typeof sendResponse === "function") sendResponse({ ok: false, error: erroMsg });
        return;
      }

      if (res && res.ok) {
        await atualizarLog(`✓ Automação Conecta SUS concluída com sucesso para #${agendamento}!`, "success");
        await notificarTodasAbasBancadaLab({
          type: "BANCADALAB_RETORNO_CONECTASUS",
          ok: true,
          agendamento,
          prontuario,
          resultado: res.resultado,
        });
        if (typeof sendResponse === "function") sendResponse({ ok: true, resultado: res.resultado });
      } else {
        const errFalha = res?.error || "Não foi possível concluir a separação de agendamentos.";
        await atualizarLog(`Erro no Conecta SUS: ${errFalha}`, "error");
        await notificarTodasAbasBancadaLab({
          type: "BANCADALAB_ERRO_CONECTASUS",
          error: errFalha,
        });
        if (typeof sendResponse === "function") sendResponse({ ok: false, error: errFalha });
      }
    }
  );
}

// =========================================================================
// 2.1 INJEÇÃO SEQUENCIAL EM LOTE DE EXAMES NO CONECTA SUS
// =========================================================================
async function executarInjecaoLoteConectaSus(message, sendResponse) {
  const { exames = [], blocosExames = null, destinoAtual = "MS", agendamento, prontuario } = message;
  await atualizarLog(`Iniciando injeção em lote de exames (${exames.length} exames)...`);

  const abaConecta = await localizarAbaConectaSus();
  if (!abaConecta) {
    const erroAba = "Nenhuma aba do Conecta SUS aberta para injetar exames em lote.";
    await atualizarLog(erroAba, "error");
    await notificarTodasAbasBancadaLab({
      type: "BANCADALAB_ERRO_CONECTASUS",
      error: erroAba,
    });
    if (typeof sendResponse === "function") sendResponse({ ok: false, error: erroAba });
    return;
  }

  await garantirContentScriptInjetado(abaConecta.id);

  chrome.tabs.sendMessage(
    abaConecta.id,
    {
      type: "EXECUTAR_INJECAO_LOTE_EXAMES",
      exames,
      blocosExames,
      destinoAtual,
      agendamento,
      prontuario,
    },
    async (res) => {
      if (chrome.runtime.lastError) {
        const erroMsg = "Falha ao enviar lote de exames para o Conecta SUS: " + chrome.runtime.lastError.message;
        await atualizarLog(erroMsg, "error");
        if (typeof sendResponse === "function") sendResponse({ ok: false, error: erroMsg });
        return;
      }

      if (res && res.ok) {
        await atualizarLog(`✓ Injeção em lote concluída com sucesso!`, "success");
        if (typeof sendResponse === "function") sendResponse({ ok: true, resultado: res.resultado });
      } else {
        const errFalha = res?.error || "Falha ao injetar exames em lote.";
        await atualizarLog(`Erro no lote: ${errFalha}`, "error");
        if (typeof sendResponse === "function") sendResponse({ ok: false, error: errFalha });
      }
    }
  );
}

// =========================================================================
// 2.2 CONSULTA E ENRIQUECIMENTO AUTOMÁTICO DE TRIAGEM EDTA / HEMOGRAMA
// Pesquisa automática do Paciente, Médico Solicitante e Data de Nascimento
// através da API do Conecta SUS em < 1 segundo (mesmo sem número de agendamento).
// =========================================================================
function extrairPacienteIdDaLinha(row) {
  if (!row || typeof row !== "object") return null;
  if (row.paciente_id) return row.paciente_id;
  if (row.id) return row.id;
  if (row.cidadao_id) return row.cidadao_id;

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
    await notificarTodasAbasBancadaLab({
      type: "BANCADALAB_PROGRESSO_CONECTASUS",
      step,
      mensagem: msg,
    });
  };

  let token = await obterTokenSessao();
  if (!token) {
    const aba = await localizarAbaConectaSus();
    const errMsg = aba
      ? "Token da sessão ainda não capturado. Dê um clique em qualquer menu na aba do Conecta SUS para ativar a sessão e tente novamente."
      : "Nenhuma aba do Conecta SUS (caconde.conectasus.com.br) encontrada aberta. Abra e faça login primeiro.";
    throw new Error(errMsg);
  }

  const { conectasus_customer = "caconde" } = await chrome.storage.local.get("conectasus_customer");

  const headersApi = {
    Authorization: `Bearer ${token}`,
    customer: conectasus_customer,
    Accept: "application/json, text/plain, */*",
  };

  // --- CHAMADA 1: Buscar paciente pelo Prontuário Municipal ---
  const prontLimpo = String(prontuario || "").trim();
  await stepNotify(1, `Consultando prontuário ${prontLimpo} na API do Conecta SUS...`);

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
    "search[value]": prontLimpo,
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
  let registros = Array.isArray(jsonLista?.data) ? jsonLista.data : [];

  // Fallback caso o prontuário no sistema esteja preenchido com zeros à esquerda
  if (registros.length === 0 && /^\d+$/.test(prontLimpo)) {
    const padded = prontLimpo.padStart(7, "0");
    if (padded !== prontLimpo) {
      params.set("search[value]", padded);
      const resPadded = await fetch(`${API_CONECTA_BASE}/cadastro/paciente/datatable?${params.toString()}`, {
        method: "GET",
        headers: headersApi,
      });
      if (resPadded.ok) {
        const jsonPadded = await resPadded.json();
        if (Array.isArray(jsonPadded?.data) && jsonPadded.data.length > 0) {
          registros = jsonPadded.data;
        }
      }
    }
  }

  if (registros.length === 0) {
    throw new Error(`Prontuário ${prontLimpo} não localizado no Conecta SUS.`);
  }

  const alvoNorm = normPront(prontLimpo);
  const linhaPaciente =
    registros.find((r) => normPront(r.prontuario) === alvoNorm) || registros[0];

  const pacienteId = extrairPacienteIdDaLinha(linhaPaciente);
  if (!pacienteId) {
    throw new Error(
      `Paciente ${linhaPaciente.nome || prontLimpo} localizado, mas ID interno não encontrado.`
    );
  }

  // --- CHAMADA 2: Buscar agendamentos e dados cadastrais completos ---
  await stepNotify(2, `Identificando pedidos e médico solicitante do paciente #${pacienteId}...`);

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

  const nomePaciente = (pacForm.cidadao_nome || linhaPaciente.nome || `PACIENTE #${prontLimpo}`)
    .trim()
    .toUpperCase();
  const prontuarioOficial = pacForm.paciente_prontuario || linhaPaciente.prontuario || prontLimpo;
  const dataNascimento = pacForm.cidadao_data_nascimento || linhaPaciente.data_nascimento || "";

  // Localização Inteligente do Agendamento (Alvo ou Mais Recente com Hemograma)
  const agendStr = String(agendamentoNumero || "").trim();
  let agEncontrado = null;

  if (agendStr && agendStr !== prontLimpo) {
    agEncontrado = agendamentos.find(
      (ag) =>
        String(ag.agendamento_numero) === agendStr ||
        String(ag.agendamento_id) === agendStr
    );
  }

  // Se o agendamento não foi informado ou não foi achado pelo número, pesquisa automaticamente
  if (!agEncontrado && agendamentos.length > 0) {
    // 1. Prioriza agendamentos que contenham HEMOGRAMA nos exames
    const comHemograma = agendamentos.filter((ag) =>
      Array.isArray(ag.incluido) &&
      ag.incluido.some((ex) => /hemogr|hematol|hmg|cbc|eritrog/i.test(ex.nome || ""))
    );

    const candidatos = comHemograma.length > 0 ? comHemograma : agendamentos;

    // 2. Ordena de forma decrescente pelo número do agendamento / id ou data (mais recente)
    const ordenados = [...candidatos].sort((a, b) => {
      const numA = Number(a.agendamento_numero || a.agendamento_id || 0);
      const numB = Number(b.agendamento_numero || b.agendamento_id || 0);
      if (numB !== numA) return numB - numA;
      return String(b.data || "").localeCompare(String(a.data || ""));
    });

    agEncontrado = ordenados[0];
  }

  let medicoSolicitante =
    agEncontrado?.medico_nome ||
    agEncontrado?.medico_solicitante?.cidadao_nome ||
    agEncontrado?.profissional_solicitante_nome ||
    agEncontrado?.medico ||
    "Dr(a). Clínico(a) Geral / UBS";

  medicoSolicitante = String(medicoSolicitante).trim();
  if (
    medicoSolicitante &&
    !medicoSolicitante.toUpperCase().startsWith("DR") &&
    medicoSolicitante !== "Dr(a). Clínico(a) Geral / UBS"
  ) {
    medicoSolicitante = `Dr(a). ${medicoSolicitante}`;
  }

  const exames = Array.isArray(agEncontrado?.incluido) && agEncontrado.incluido.length > 0
    ? agEncontrado.incluido.map((ex) => ex.nome).filter(Boolean)
    : ["HEMOGRAMA COMPLETO"];

  const numeroAgendamentoFinal = String(
    agEncontrado?.agendamento_numero ||
    agEncontrado?.agendamento_id ||
    (agendStr !== prontLimpo ? agendStr : "")
  );

  return {
    prontuario: prontuarioOficial,
    agendamento: numeroAgendamentoFinal,
    nome: nomePaciente,
    dataNascimento,
    medicoSolicitante,
    exames,
    urgente: Boolean(agEncontrado?.urgente),
    dataAgendamento: agEncontrado?.data || "",
    unidade: agEncontrado?.unidade_nome || pacForm?.unidade_nome_fantasia || "",
  };
}

async function iniciarBuscaConectaSus({ prontuario, agendamento, bancadaApiUrl }, bancadaTabId) {
  const prontLimpo = String(prontuario || "").trim();
  await atualizarLog(`Iniciando pesquisa automática: Prontuário #${prontLimpo} | Agendamento: ${agendamento || "Auto"}`);

  const { bancadalab_api_url } = await chrome.storage.local.get("bancadalab_api_url");
  const apiBase = (bancadaApiUrl || bancadalab_api_url || "").replace(/\/+$/, "");
  if (apiBase) {
    await chrome.storage.local.set({ bancadalab_api_url: apiBase });
  }

  try {
    const dados = await consultarConectaSusPorApi(prontuario, agendamento, bancadaTabId);

    await notificarTodasAbasBancadaLab({
      type: "BANCADALAB_PROGRESSO_CONECTASUS",
      step: 3,
      mensagem: `Salvando triagem de ${dados.nome} no Cloudflare D1...`,
    });

    await atualizarLog(
      `✓ Paciente: ${dados.nome} | DN: ${dados.dataNascimento} | Médico: ${dados.medicoSolicitante} | Ag: #${dados.agendamento || "—"}`,
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
          `Gravação D1 (${res.status}): ${respostaServidor?.message || "OK"}`,
          res.ok ? "success" : "error"
        );
      } catch (apiErr) {
        await atualizarLog(`Erro ao gravar no D1 (${apiBase}): ${apiErr.message}`, "error");
      }
    }

    const payloadRetorno = {
      type: "BANCADALAB_RETORNO_CONECTASUS",
      ok: true,
      paciente: respostaServidor?.paciente || dados,
      salvoNoD1: Boolean(respostaServidor?.ok),
    };

    await notificarTodasAbasBancadaLab(payloadRetorno);
    return payloadRetorno;
  } catch (err) {
    const errMsg = err.message || "Falha ao consultar paciente no Conecta SUS.";
    await atualizarLog(errMsg, "error");
    await notificarTodasAbasBancadaLab({
      type: "BANCADALAB_ERRO_CONECTASUS",
      error: errMsg,
    });
    return { ok: false, error: errMsg };
  }
}

// =========================================================================
// 3. LISTENER CENTRAL DE MENSAGENS
// =========================================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    message.type === "BANCADALAB_PROGRESSO_CONECTASUS" ||
    message.type === "BANCADALAB_RETORNO_CONECTASUS" ||
    message.type === "BANCADALAB_ERRO_CONECTASUS"
  ) {
    notificarTodasAbasBancadaLab(message);
    return;
  }

  if (message.type === "CONECTASUS_TOKEN_ENCONTRADO" && message.token) {
    chrome.storage.local.set({
      conectasus_bearer_token: message.token,
      conectasus_customer: message.customer || "caconde",
      conectasus_token_at: Date.now(),
    });
    sendResponse({ ok: true });
    return;
  }

  if (message.type === "BANCADALAB_INICIAR_BUSCA") {
    iniciarBuscaConectaSus(message, _sender?.tab?.id).then(sendResponse).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // Resposta assíncrona
  }

  if (message.type === "BANCADALAB_EXECUTAR_APOIO") {
    executarApoioConectaSus(message, sendResponse);
    return true; // Comunicação assíncrona
  }

  if (message.type === "BANCADALAB_INJETAR_EXAMES_LOTE") {
    executarInjecaoLoteConectaSus(message, sendResponse);
    return true;
  }

  return true;
});
