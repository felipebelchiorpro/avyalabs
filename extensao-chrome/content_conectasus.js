// =========================================================================
// BancadaLab SUS • Content Script (Extração Automática do Token Conecta SUS)
// Executa na aba logada: https://caconde.conectasus.com.br
// Não interfere na navegação do usuário e nunca trava a tela.
// =========================================================================

(function () {
  if (window.__BANCADALAB_CONECTASUS_TOKEN_WATCHER__) return;
  window.__BANCADALAB_CONECTASUS_TOKEN_WATCHER__ = true;

  const JWT_REGEX = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

  function procurarJwtEmStorage() {
    const storages = [];
    try { storages.push(window.localStorage); } catch (_) {}
    try { storages.push(window.sessionStorage); } catch (_) {}

    for (const store of storages) {
      if (!store) continue;
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key) continue;
        const val = store.getItem(key) || "";
        const match = val.match(JWT_REGEX);
        if (match) {
          return match[0];
        }
      }
    }

    // Fallback em document.cookie (caso armazenado pelo nuxt-auth / js-cookie)
    try {
      const cookieVal = decodeURIComponent(document.cookie || "");
      const matchCookie = cookieVal.match(JWT_REGEX);
      if (matchCookie) {
        return matchCookie[0];
      }
    } catch (_) {}

    return null;
  }

  function sincronizarTokenComBackground() {
    const token = procurarJwtEmStorage();
    if (token) {
      try {
        chrome.runtime.sendMessage({
          type: "CONECTASUS_TOKEN_ENCONTRADO",
          token,
        });
      } catch (_) {}
    }
    return token;
  }

  // Sincroniza assim que abre a aba e quando recebe pedido direto do background
  sincronizarTokenComBackground();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "OBTER_TOKEN_CONECTASUS") {
      const token = procurarJwtEmStorage();
      sendResponse({ ok: Boolean(token), token });
    }
  });
})();
