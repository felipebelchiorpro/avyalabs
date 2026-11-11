// =========================================================================
// BancadaLab SUS • Service Worker (Background)
// Orquestra a busca em segundo plano na aba logada do Conecta SUS e envia
// os dados capturados diretamente para a API do BancadaLab (Cloudflare D1).
// =========================================================================

const CONECTASUS_URL_PATTERN = "https://caconde.conectasus.com.br/*";
const JOB_TIMEOUT_MS = 90000; // 90 segundos máximo por busca

async function atualizarLog(mensagem, tipo = "info") {
  const { bancadalab_logs = [] } = await chrome.storage.local.get("bancadalab_logs");
  const novo = {
    hora: new Date().toLocaleTimeString("pt-BR"),
    tipo,
    mensagem,
  };
  const atualizados = [novo, ...bancadalab_logs].slice(0, 30);
  await chrome.storage.local.set({ bancadalab_logs: atualizados });
}

async function notificarBancada(tabId, payload) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, payload);
  } catch (err) {
    console.warn("[BancadaLab Ext] Não foi possível notificar a aba do BancadaLab:", err.message);
  }
}

async function localizarAbaConectaSus() {
  const tabs = await chrome.tabs.query({ url: CONECTASUS_URL_PATTERN });
  if (!tabs || tabs.length === 0) return null;
  // Prefere aba que não esteja em página de login, se houver mais de uma
  const logada = tabs.find((t) => t.url && !t.url.toLowerCase().includes("login"));
  return logada || tabs[0];
}

// Inicia o fluxo de 7 passos na aba do Conecta SUS (em segundo plano)
async function iniciarBuscaConectaSus({ prontuario, agendamento, bancadaApiUrl }, bancadaTabId) {
  await atualizarLog(`Iniciando busca: Prontuário ${prontuario} | Agendamento ${agendamento}`);

  const conectaTab = await localizarAbaConectaSus();
  if (!conectaTab) {
    const msg = "Nenhuma aba do Conecta SUS (caconde.conectasus.com.br) encontrada aberta. Abra e faça login primeiro.";
    await atualizarLog(msg, "error");
    await notificarBancada(bancadaTabId, {
      type: "BANCADALAB_ERRO_CONECTASUS",
      error: msg,
    });
    return { ok: false, error: msg };
  }

  // Salvar estado persistente (sobrevive a reloads completos de página do Conecta SUS)
  const job = {
    ativo: true,
    step: 1,
    prontuario: String(prontuario || "").trim(),
    agendamento: String(agendamento || "").trim(),
    bancadaTabId: bancadaTabId || null,
    conectaTabId: conectaTab.id,
    bancadaApiUrl: (bancadaApiUrl || "").replace(/\/+$/, ""),
    startedAt: Date.now(),
    pacienteParcial: {},
  };

  await chrome.storage.local.set({ bancadalab_job: job });
  if (job.bancadaApiUrl) {
    await chrome.storage.local.set({ bancadalab_api_url: job.bancadaApiUrl });
  }

  await notificarBancada(bancadaTabId, {
    type: "BANCADALAB_PROGRESSO_CONECTASUS",
    step: 1,
    mensagem: "Aba do Conecta SUS localizada. Navegando em segundo plano...",
  });

  // Garante que o content script esteja ativo e dispara a máquina de estados
  try {
    await chrome.tabs.sendMessage(conectaTab.id, {
      type: "EXECUTAR_PASSO_CONECTASUS",
    });
  } catch (_) {
    // Se a aba estava aberta antes da instalação da extensão, injeta dinamicamente
    try {
      await chrome.scripting.executeScript({
        target: { tabId: conectaTab.id },
        files: ["content_conectasus.js"],
      });
      setTimeout(() => {
        chrome.tabs.sendMessage(conectaTab.id, { type: "EXECUTAR_PASSO_CONECTASUS" }).catch(() => {});
      }, 300);
    } catch (injectErr) {
      const errMsg = "Falha ao conectar com a aba do Conecta SUS. Recarregue a página do Conecta SUS (F5).";
      await atualizarLog(errMsg, "error");
      await chrome.storage.local.set({ bancadalab_job: { ...job, ativo: false } });
      await notificarBancada(bancadaTabId, {
        type: "BANCADALAB_ERRO_CONECTASUS",
        error: errMsg,
      });
      return { ok: false, error: errMsg };
    }
  }

  return { ok: true, message: "Automação iniciada em segundo plano." };
}

// Re-dispara a máquina de estados sempre que a aba do Conecta SUS terminar um reload/navegação
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;

  const { bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job");
  if (!job || !job.ativo || job.conectaTabId !== tabId) return;

  if (Date.now() - job.startedAt > JOB_TIMEOUT_MS) {
    await chrome.storage.local.set({ bancadalab_job: { ...job, ativo: false } });
    const msg = "Tempo limite excedido (90s) ao navegar no Conecta SUS.";
    await atualizarLog(msg, "error");
    await notificarBancada(job.bancadaTabId, {
      type: "BANCADALAB_ERRO_CONECTASUS",
      error: msg,
    });
    return;
  }

  // Pequena folga para scripts/frameworks da página do Conecta SUS inicializarem
  setTimeout(() => {
    chrome.tabs.sendMessage(tabId, { type: "EXECUTAR_PASSO_CONECTASUS" }).catch(() => {});
  }, 550);
});

// Escuta mensagens dos content scripts e do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "BANCADALAB_INICIAR_BUSCA") {
      const result = await iniciarBuscaConectaSus(message, sender?.tab?.id || null);
      sendResponse(result);
      return;
    }

    if (message.type === "CONECTASUS_PROGRESSO") {
      const { bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job");
      await atualizarLog(`Passo ${message.step}/7: ${message.mensagem}`, "info");
      if (job?.bancadaTabId) {
        await notificarBancada(job.bancadaTabId, {
          type: "BANCADALAB_PROGRESSO_CONECTASUS",
          step: message.step,
          mensagem: message.mensagem,
        });
      }
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "CONECTASUS_DADOS_CAPTURADOS") {
      const { bancadalab_job: job, bancadalab_api_url } = await chrome.storage.local.get([
        "bancadalab_job",
        "bancadalab_api_url",
      ]);

      // Finaliza job imediatamente para não repetir em outros eventos
      if (job) {
        await chrome.storage.local.set({ bancadalab_job: { ...job, ativo: false } });
      }

      const dados = message.dados || {};
      const apiBase = (job?.bancadaApiUrl || bancadalab_api_url || "").replace(/\/+$/, "");

      await atualizarLog(
        `Dados capturados: ${dados.nome || "Paciente"} | DN: ${dados.dataNascimento || "-"} | Médico: ${dados.medicoSolicitante || "-"} | Exames: ${(dados.exames || []).join(", ")}`,
        "success"
      );

      let respostaServidor = null;
      if (apiBase) {
        try {
          const res = await fetch(`${apiBase}/api/triagem-edta`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prontuario: dados.prontuario || job?.prontuario,
              agendamento: dados.agendamento || job?.agendamento,
              nome: dados.nome,
              dataNascimento: dados.dataNascimento,
              medicoSolicitante: dados.medicoSolicitante,
              exames: dados.exames,
              salvar: true,
            }),
          });
          respostaServidor = await res.json();
          await atualizarLog(
            `Sincronizado com Cloudflare D1 (${res.status}): ${respostaServidor?.message || "OK"}`,
            res.ok ? "success" : "error"
          );
        } catch (apiErr) {
          await atualizarLog(`Erro ao enviar POST para ${apiBase}/api/triagem-edta: ${apiErr.message}`, "error");
        }
      }

      if (job?.bancadaTabId) {
        await notificarBancada(job.bancadaTabId, {
          type: "BANCADALAB_RETORNO_CONECTASUS",
          ok: true,
          paciente: respostaServidor?.paciente || {
            nome: dados.nome,
            prontuario: dados.prontuario || job?.prontuario,
            agendamento: dados.agendamento || job?.agendamento,
            dataNascimento: dados.dataNascimento,
            medicoSolicitante: dados.medicoSolicitante,
            exames: dados.exames || [],
          },
          salvoNoD1: Boolean(respostaServidor?.ok),
        });
      }

      sendResponse({ ok: true, respostaServidor });
      return;
    }

    if (message.type === "CONECTASUS_ERRO") {
      const { bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job");
      if (job) {
        await chrome.storage.local.set({ bancadalab_job: { ...job, ativo: false } });
      }
      await atualizarLog(`Erro no passo ${message.step || "?"}: ${message.error}`, "error");
      if (job?.bancadaTabId) {
        await notificarBancada(job.bancadaTabId, {
          type: "BANCADALAB_ERRO_CONECTASUS",
          step: message.step,
          error: message.error,
        });
      }
      sendResponse({ ok: true });
      return;
    }
  })();

  return true; // Mantém o canal de resposta assíncrona aberto
});

