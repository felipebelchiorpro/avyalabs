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
  const { agendamento, prontuario, destinoExames, modo } = message;
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
      laboratorioDestino: message.laboratorioDestino || "SAO_LUCAS",
      modo: modo || "mudar_laboratorio",
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
      conectasus_token_at: Date.now(),
    });
    sendResponse({ ok: true });
    return;
  }

  if (message.type === "BANCADALAB_EXECUTAR_APOIO") {
    executarApoioConectaSus(message, sendResponse);
    return true; // Comunicação assíncrona
  }

  return true;
});
