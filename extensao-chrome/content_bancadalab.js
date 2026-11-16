// =========================================================================
// BancadaLab SUS • Content Script (Ponte Oficial na aba do BancadaLab PWA)
// =========================================================================

(function () {
  // Sinaliza para o PWA React que a extensão está ativa
  document.documentElement.setAttribute("data-bancadalab-extensao", "ativa");
  window.postMessage({ type: "BANCADALAB_EXTENSAO_PRONTA", version: "2.1.0" }, "*");

  try {
    chrome.storage.local.set({ bancadalab_api_url: window.location.origin });
  } catch (_) {}

  // Escuta comandos disparados pela interface do BancadaLab
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "BANCADALAB_PING_EXTENSAO") {
      document.documentElement.setAttribute("data-bancadalab-extensao", "ativa");
      window.postMessage({ type: "BANCADALAB_EXTENSAO_PRONTA", version: "2.1.0" }, "*");
      return;
    }

    // Consulta de enriquecimento de dados da Triagem EDTA
    if (event.data.type === "BANCADALAB_BUSCAR_CONECTASUS") {
      const { prontuario, agendamento, bancadaUrl } = event.data;
      chrome.runtime.sendMessage(
        {
          type: "BANCADALAB_INICIAR_BUSCA",
          prontuario,
          agendamento,
          bancadaApiUrl: bancadaUrl || window.location.origin,
        },
        (res) => {
          if (chrome.runtime.lastError) {
            window.postMessage(
              {
                type: "BANCADALAB_ERRO_CONECTASUS",
                error: "Extensão desconectada. Recarregue a página (F5).",
              },
              "*"
            );
          } else if (res && res.ok === false) {
            window.postMessage(
              {
                type: "BANCADALAB_ERRO_CONECTASUS",
                error: res.error,
              },
              "*"
            );
          }
        }
      );
      return;
    }

    // Disparo da Automação de Separação Inteligente de SADT / Apoio
    if (event.data.type === "BANCADALAB_EXECUTAR_APOIO") {
      const { agendamento, prontuario, destinoExames, modo, laboratorioDestino } = event.data;
      chrome.runtime.sendMessage(
        {
          type: "BANCADALAB_EXECUTAR_APOIO",
          agendamento,
          prontuario,
          destinoExames: destinoExames || {},
          laboratorioDestino: laboratorioDestino || "SAO_LUCAS",
          modo: modo || "mudar_laboratorio",
          bancadaApiUrl: window.location.origin,
        },
        (res) => {
          if (chrome.runtime.lastError) {
            window.postMessage(
              {
                type: "BANCADALAB_ERRO_CONECTASUS",
                error: "Falha na extensão: " + chrome.runtime.lastError.message,
              },
              "*"
            );
          } else if (res && res.ok === false) {
            window.postMessage(
              {
                type: "BANCADALAB_ERRO_CONECTASUS",
                error: res.error,
              },
              "*"
            );
          }
        }
      );
      return;
    }
  });

  // Recebe retorno e progresso em tempo real da extensão e repassa ao React
  chrome.runtime.onMessage.addListener((message) => {
    if (
      message.type === "BANCADALAB_PROGRESSO_CONECTASUS" ||
      message.type === "BANCADALAB_RETORNO_CONECTASUS" ||
      message.type === "BANCADALAB_ERRO_CONECTASUS"
    ) {
      window.postMessage(message, "*");
    }
  });
})();
