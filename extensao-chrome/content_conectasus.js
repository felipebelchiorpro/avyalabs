// =========================================================================
// BancadaLab SUS • Content Script (Automação de Bancada & Apoio)
// Executa na aba logada: https://caconde.conectasus.com.br
// Não interfere na navegação do usuário e nunca trava a tela.
// =========================================================================

(function () {
  if (window.__BANCADALAB_CONECTASUS_WATCHER__) return;
  window.__BANCADALAB_CONECTASUS_WATCHER__ = true;

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

    // Fallback em document.cookie
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

  // Sincroniza assim que abre a aba
  sincronizarTokenComBackground();

  // =========================================================================
  // AUTOMAÇÃO DE ENCAMINHAMENTO DE APOIO (SÃO LUCAS / SADT)
  // =========================================================================
  async function aguardarElemento(seletor, timeoutMs = 4000) {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
      const el = document.querySelector(seletor);
      if (el) return el;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  }

  function processarLinhasTabela(destinoExames = {}) {
    const linhas = document.querySelectorAll('table tbody tr');
    if (linhas.length === 0) {
      console.warn('[BancadaLab] Nenhum exame encontrado na tabela.');
      return { total: 0, exames: [] };
    }

    const examesProcessados = [];

    linhas.forEach((linha, idx) => {
      const textoExame = (linha.innerText || '').toUpperCase();
      if (!textoExame.trim() || textoExame.includes('NENHUM REGISTRO')) return;

      let laboratorioAlvo = 'MUNICIPAL'; // Padrão local

      if (textoExame.includes('HEMOGRAMA')) {
        laboratorioAlvo = destinoExames.hemograma || 'APOIO_MS';
      } else if (
        textoExame.includes('UREIA') ||
        textoExame.includes('CREATININA') ||
        textoExame.includes('COLESTEROL') ||
        textoExame.includes('TRIGLICERIDES') ||
        textoExame.includes('TRIGLICERÍDEOS') ||
        textoExame.includes('GLICEMIA') ||
        textoExame.includes('GLICOSE') ||
        textoExame.includes('TGO') ||
        textoExame.includes('TGP') ||
        textoExame.includes('ACIDO URICO') ||
        textoExame.includes('ÁCIDO ÚRICO') ||
        textoExame.includes('BIOQUIMICA') ||
        textoExame.includes('BIOQUÍMICA')
      ) {
        laboratorioAlvo = destinoExames.bioquimica || 'SAO_LUCAS';
      }

      console.log(`[BancadaLab Autônomo] Linha ${idx + 1}: "${textoExame.slice(0, 40)}..." -> Destino: ${laboratorioAlvo}`);

      // Identifica o botão de edição/modificação da guia (ícone de lápis / btn-primary / link de ação)
      const btnEditar = linha.querySelector(
        'button.btn-primary, button[title*="Editar"], .fa-edit, .fa-pencil, a[href*="edit"], [class*="edit"]'
      );

      examesProcessados.push({
        texto: textoExame.slice(0, 50).trim(),
        destino: laboratorioAlvo,
        temBotaoEdicao: Boolean(btnEditar),
      });

      if (btnEditar && laboratorioAlvo !== 'MUNICIPAL') {
        // Para acionar o clique de edição automático:
        // btnEditar.click();
      }
    });

    return {
      total: examesProcessados.length,
      exames: examesProcessados,
    };
  }

  async function executarAutomacaoApoio(agendamento, destinoExames = {}) {
    console.log(`[BancadaLab Autônomo] Iniciando automação para agendamento #${agendamento}`, destinoExames);

    // 1. Localizar o campo de busca de agendamento na tela atual do Conecta SUS
    const inputBuscaAgendamento =
      document.querySelector('input[name*="agendamento"]') ||
      document.querySelector('input[id*="agendamento"]') ||
      document.querySelector('input[placeholder*="agendamento"]') ||
      document.querySelector('input[type="search"]') ||
      document.querySelector('.dataTables_filter input');

    if (!inputBuscaAgendamento) {
      throw new Error('Campo de agendamento não encontrado. Certifique-se de estar na aba "Exames Agendados" no Conecta SUS.');
    }

    // 2. Preenche o número do agendamento automaticamente com eventos nativos
    inputBuscaAgendamento.focus();
    inputBuscaAgendamento.value = agendamento;
    inputBuscaAgendamento.dispatchEvent(new Event('input', { bubbles: true }));
    inputBuscaAgendamento.dispatchEvent(new Event('change', { bubbles: true }));

    // 3. Clica no botão de busca da tela (ou aciona Enter no input)
    const btnBuscar = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(
      (el) =>
        (el.textContent && /buscar|pesquisar|filtrar/i.test(el.textContent)) ||
        (el.value && /buscar|pesquisar|filtrar/i.test(el.value)) ||
        el.querySelector('.fa-search')
    );

    if (btnBuscar) {
      btnBuscar.click();
    } else {
      inputBuscaAgendamento.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }

    // 4. Aguarda a tabela renderizar os dados do agendamento
    await new Promise((r) => setTimeout(r, 1200));
    await aguardarElemento('table tbody tr', 3000);

    // 5. Processa as linhas da tabela e classifica destinos
    const resultado = processarLinhasTabela(destinoExames);
    return resultado;
  }

  // Escuta mensagens do background da extensão
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "OBTER_TOKEN_CONECTASUS") {
      const token = procurarJwtEmStorage();
      sendResponse({ ok: Boolean(token), token });
      return true;
    }

    if (message.type === "EXECUTAR_AUTOMACAO_APOIO_CONECTASUS") {
      (async () => {
        try {
          const resultado = await executarAutomacaoApoio(message.agendamento, message.destinoExames);
          sendResponse({
            ok: true,
            agendamento: message.agendamento,
            resultado,
            mensagem: `Agendamento #${message.agendamento} processado: ${resultado.total} exames avaliados.`
          });
        } catch (err) {
          sendResponse({
            ok: false,
            error: err.message || 'Erro ao executar automação no Conecta SUS.'
          });
        }
      })();
      return true; // Mantém canal aberto para resposta assíncrona
    }
  });
})();
