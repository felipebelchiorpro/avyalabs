// =========================================================================
// BancadaLab SUS • Popup da Extensão
// =========================================================================

async function atualizarStatus() {
  const badge = document.getElementById("status-conecta");
  const tabs = await chrome.tabs.query({ url: "https://caconde.conectasus.com.br/*" });
  if (tabs && tabs.length > 0) {
    badge.textContent = "Conecta SUS Aberto";
    badge.className = "badge";
  } else {
    badge.textContent = "Conecta SUS Fechado";
    badge.className = "badge err";
  }

  const { bancadalab_api_url, bancadalab_logs = [] } = await chrome.storage.local.get([
    "bancadalab_api_url",
    "bancadalab_logs",
  ]);
  if (bancadalab_api_url) {
    document.getElementById("api-url").value = bancadalab_api_url;
  }

  const logsEl = document.getElementById("logs");
  if (bancadalab_logs.length === 0) {
    logsEl.textContent = "Aguardando primeira busca...";
  } else {
    logsEl.innerHTML = bancadalab_logs
      .map(
        (l) =>
          `<div class="log-item ${l.tipo || ""}"><span class="log-time">[${l.hora}]</span>${l.mensagem}</div>`
      )
      .join("");
  }
}

document.getElementById("btn-salvar-url").addEventListener("click", async () => {
  const val = document.getElementById("api-url").value.trim().replace(/\/+$/, "");
  await chrome.storage.local.set({ bancadalab_api_url: val });
  const btn = document.getElementById("btn-salvar-url");
  btn.textContent = "✓ URL Salva!";
  setTimeout(() => (btn.textContent = "Salvar URL"), 1500);
});

document.getElementById("btn-testar").addEventListener("click", async () => {
  const prontuario = document.getElementById("teste-prontuario").value.trim();
  const agendamento = document.getElementById("teste-agendamento").value.trim();
  const bancadaApiUrl = document.getElementById("api-url").value.trim().replace(/\/+$/, "");

  if (!prontuario || !agendamento) {
    alert("Informe o Prontuário e o Número do Agendamento.");
    return;
  }

  await chrome.runtime.sendMessage({
    type: "BANCADALAB_INICIAR_BUSCA",
    prontuario,
    agendamento,
    bancadaApiUrl,
  });

  setTimeout(atualizarStatus, 400);
});

document.getElementById("btn-limpar-logs").addEventListener("click", async (e) => {
  e.preventDefault();
  await chrome.storage.local.set({ bancadalab_logs: [] });
  atualizarStatus();
});

chrome.storage.onChanged.addListener(() => atualizarStatus());
atualizarStatus();

