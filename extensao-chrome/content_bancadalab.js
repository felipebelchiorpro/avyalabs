// =========================================================================
// BancadaLab SUS • Content Script (Ponte na aba do BancadaLab PWA)
// =========================================================================

(function () {
  // Sinaliza para o PWA React que a extensão está instalada e pronta
  document.documentElement.setAttribute("data-bancadalab-extensao", "ativa");
  window.postMessage({ type: "BANCADALAB_EXTENSAO_PRONTA", version: "1.0.0" }, "*");

  // Salva a URL atual do BancadaLab automaticamente para uso pelo background/popup
  try {
    chrome.storage.local.set({ bancadalab_api_url: window.location.origin });
  } catch (_) {}

  // Escuta comandos disparados pela tela de Triagem EDTA do BancadaLab
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "BANCADALAB_PING_EXTENSAO") {
      document.documentElement.setAttribute("data-bancadalab-extensao", "ativa");
      window.postMessage({ type: "BANCADALAB_EXTENSAO_PRONTA", version: "1.0.0" }, "*");
      return;
    }

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
    }
  });

  // Recebe progresso / retorno / erro do background e repassa para a página React
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
