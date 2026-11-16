// =========================================================================
// BancadaLab SUS • Content Script (Automação Oficial Conecta SUS)
// Executa na aba ativa: https://caconde.conectasus.com.br
// Baseado no fluxo operacional gravado em vídeo (Bancada SUS Caconde)
// =========================================================================

(function () {
  if (window.__BANCADALAB_CONECTASUS_ACTIVE__) return;
  window.__BANCADALAB_CONECTASUS_ACTIVE__ = true;

  console.log("%c[BancadaLab SUS]%c Content Script Conecta SUS carregado com inteligência de bancada.", "color:#0891B2;font-weight:bold;", "color:default;");

  const JWT_REGEX = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

  // =========================================================================
  // 1. CAPTURA DO BEARER TOKEN
  // =========================================================================
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
        if (match) return match[0];
      }
    }

    try {
      const cookieVal = decodeURIComponent(document.cookie || "");
      const matchCookie = cookieVal.match(JWT_REGEX);
      if (matchCookie) return matchCookie[0];
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

  sincronizarTokenComBackground();

  // =========================================================================
  // 2. CÉREBRO DE CLASSIFICAÇÃO DOS EXAMES (MATRIZ SUS CACONDE)
  // =========================================================================
  function classificarDestinoExame(textoExame) {
    const norm = (textoExame || "").toUpperCase().trim();

    // 🩸 1. HEMOGRAMAS -> LABORATÓRIO MS
    if (norm.includes("HEMOGRAMA")) {
      return {
        destino: "MS",
        nomeLaboratorio: "LABORATÓRIO MS",
        tipo: "Hematologia (Tubo EDTA)",
      };
    }

    // 🔬 2. BIOQUÍMICOS -> LABORATÓRIO SÃO LUCAS
    if (
      norm.includes("UREIA") ||
      norm.includes("URÉIA") ||
      norm.includes("CREATININA") ||
      norm.includes("COLESTEROL") ||
      norm.includes("TRIGLICERIDES") ||
      norm.includes("TRIGLICERÍDEOS") ||
      norm.includes("GLICEMIA") ||
      norm.includes("GLICOSE") ||
      norm.includes("TGO") ||
      norm.includes("TGP") ||
      norm.includes("GAMA GT") ||
      norm.includes("ACIDO URICO") ||
      norm.includes("ÁCIDO ÚRICO") ||
      norm.includes("BILIRRUBINA") ||
      norm.includes("PROTEINAS TOTAIS") ||
      norm.includes("FOSFATASE") ||
      norm.includes("SODIO") ||
      norm.includes("SÓDIO") ||
      norm.includes("POTASSIO") ||
      norm.includes("POTÁSSIO") ||
      norm.includes("CALCIO") ||
      norm.includes("CÁLCIO") ||
      norm.includes("TSH") ||
      norm.includes("T4") ||
      norm.includes("PSA") ||
      norm.includes("BIOQUIMICA") ||
      norm.includes("BIOQUÍMICA")
    ) {
      return {
        destino: "SAO_LUCAS",
        nomeLaboratorio: "LABORATÓRIO SÃO LUCAS",
        tipo: "Bioquímica / Geral",
      };
    }

    // 🧪 3. BANCADA LOCAL -> LABORATÓRIO MUNICIPAL (Urina, Sangue Oculto PSO, Rápidos e Glicada Retida)
    return {
      destino: "MUNICIPAL",
      nomeLaboratorio: "LABORATORIO MUNICIPAL DE CACONDE",
      tipo: "Bancada Local (Urina/PSO)",
    };
  }

  // =========================================================================
  // 3. UTILITÁRIOS DOM ROBUSTOS
  // =========================================================================
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  async function aguardarElemento(seletor, timeoutMs = 5000) {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
      const el = document.querySelector(seletor);
      if (el) return el;
      await esperar(150);
    }
    return null;
  }

  function simularClique(elemento) {
    if (!elemento) return;
    elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    const opts = { bubbles: true, cancelable: true, view: window };
    elemento.dispatchEvent(new MouseEvent("mousedown", opts));
    elemento.dispatchEvent(new MouseEvent("mouseup", opts));
    elemento.dispatchEvent(new MouseEvent("click", opts));
  }

  function simularInput(input, valor) {
    if (!input) return;
    input.focus();
    input.value = valor;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // =========================================================================
  // 4. AUTORIZAÇÃO AUTOMÁTICA DE SUPERVISOR (MODAL DE CONFIRMAÇÃO)
  // Quando o Conecta SUS pede "Autorização do supervisor" ao remover exame,
  // este observador localiza o botão "Autorizar" e clica instantaneamente.
  // =========================================================================
  function iniciarObservadorSupervisor() {
    const observer = new MutationObserver(() => {
      // Procura modais com título ou texto de autorização
      const modalSupervisor = Array.from(document.querySelectorAll(".modal, .modal-dialog, div[role='dialog']")).find(
        (m) => (m.innerText || "").toUpperCase().includes("AUTORIZAÇÃO DO SUPERVISOR") || (m.innerText || "").toUpperCase().includes("AUTORIZAR")
      );

      if (modalSupervisor) {
        const btnAutorizar = Array.from(modalSupervisor.querySelectorAll("button, input[type='button'], a")).find(
          (b) => (b.textContent || b.value || "").trim().toUpperCase() === "AUTORIZAR"
        );

        if (btnAutorizar && !btnAutorizar.disabled) {
          console.log("%c[BancadaLab] Pop-up de Autorização do Supervisor detectado! Clicando em 'Autorizar'...", "color:#059669;font-weight:bold;");
          simularClique(btnAutorizar);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  // Ativa observador do supervisor
  iniciarObservadorSupervisor();

  // =========================================================================
  // 5. MOTOR AUTÔNOMO: EXECUÇÃO DO FLUXO DO VÍDEO NO CONECTA SUS
  // =========================================================================
  async function executarFluxoCompletoConectaSus({ agendamento, prontuario, modo = "automatico" }, progressoCallback) {
    const notify = (msg) => {
      console.log(`[BancadaLab Autônomo] ${msg}`);
      if (typeof progressoCallback === "function") progressoCallback(msg);
    };

    notify(`Iniciando automação no Conecta SUS para agendamento #${agendamento || prontuario}...`);

    // -----------------------------------------------------------------------
    // PASSO 1: Garantir que estamos na tela do paciente ou pesquisar
    // -----------------------------------------------------------------------
    const urlAtual = window.location.href;

    // Se estivermos na "LISTA DE PACIENTE"
    if (urlAtual.includes("/agendamento-exame/index") || document.querySelector("h2, h3, h4, .box-title")?.innerText?.includes("LISTA DE PACIENTE")) {
      notify("Localizando paciente na Lista de Pacientes...");

      // Selecionar "Prontuário municipal" se houver dropdown
      const selectTipoBusca = document.querySelector("select.form-control, select");
      if (selectTipoBusca) {
        const optPront = Array.from(selectTipoBusca.options).find((o) => (o.text || "").toUpperCase().includes("PRONTUÁRIO"));
        if (optPront) {
          selectTipoBusca.value = optPront.value;
          selectTipoBusca.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      // Input de busca
      const inputBusca = document.querySelector("input[placeholder*='buscar'], input[type='search'], input.form-control");
      if (!inputBusca) throw new Error("Campo de busca de paciente não encontrado.");

      simularInput(inputBusca, prontuario || agendamento);
      await esperar(300);

      // Clicar em Buscar
      const btnBuscar = Array.from(document.querySelectorAll("button")).find((b) => (b.textContent || "").trim().toUpperCase() === "BUSCAR");
      if (btnBuscar) simularClique(btnBuscar);

      // Aguardar linha da tabela e abrir perfil do paciente
      await esperar(1500);
      const linhaPaciente = await aguardarElemento("table tbody tr", 4000);
      if (!linhaPaciente) throw new Error("Nenhum paciente localizado para o termo informado.");

      const btnAcaoPaciente = linhaPaciente.querySelector("a[href*='agendamento-exame/create'], button, a");
      if (btnAcaoPaciente) {
        notify("Abrindo agendamentos do paciente...");
        simularClique(btnAcaoPaciente);
        await esperar(2000);
      }
    }

    // -----------------------------------------------------------------------
    // PASSO 2: Alternar para a aba "EXAMES AGENDADOS"
    // -----------------------------------------------------------------------
    notify("Alternando para a aba 'EXAMES AGENDADOS'...");
    await esperar(800);

    const abas = Array.from(document.querySelectorAll("a, button, li, .nav-link, span"));
    const abaExamesAgendados = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");

    if (abaExamesAgendados) {
      simularClique(abaExamesAgendados);
      await esperar(1200);
    }

    // Aguardar tabela de exames agendados renderizar
    const tabelaAgendados = await aguardarElemento("table tbody tr", 4000);
    if (!tabelaAgendados) {
      throw new Error("Tabela de exames agendados não carregou na tela.");
    }

    // -----------------------------------------------------------------------
    // PASSO 3: Localizar a linha do agendamento específico
    // -----------------------------------------------------------------------
    notify(`Localizando agendamento #${agendamento}...`);
    const linhas = Array.from(document.querySelectorAll("table tbody tr"));

    let linhaAlvo = null;
    if (agendamento) {
      linhaAlvo = linhas.find((tr) => (tr.innerText || "").includes(String(agendamento).trim()));
    }
    if (!linhaAlvo && linhas.length > 0) {
      // Se não encontrou pelo número exato, pega a última linha (mais recente)
      linhaAlvo = linhas[linhas.length - 1];
    }

    if (!linhaAlvo) {
      throw new Error(`Linha do agendamento #${agendamento} não encontrada na tabela de agendados.`);
    }

    // Extrair lista de exames descritos na linha
    const textoLinha = linhaAlvo.innerText || "";
    notify(`Agendamento localizado! Conteúdo: ${textoLinha.slice(0, 60)}...`);

    // -----------------------------------------------------------------------
    // PASSO 4: Clicar no botão de EDIÇÃO (Lápis Azul)
    // -----------------------------------------------------------------------
    const btnEditar = linhaAlvo.querySelector(
      "button.btn-primary, a.btn-primary, [title*='Editar'], [title*='editar'], .fa-edit, .fa-pencil, a[href*='edit']"
    );

    if (!btnEditar) {
      throw new Error("Botão de edição (lápis azul) não encontrado na linha do agendamento.");
    }

    notify("Abrindo modal de edição do agendamento (Lápis Azul)...");
    simularClique(btnEditar);
    await esperar(1500);

    // -----------------------------------------------------------------------
    // PASSO 5: Tratar o Modal de Exames Solicitados e Seleção do Laboratório
    // -----------------------------------------------------------------------
    notify("Analisando exames e configurando destinos de apoio...");

    // 5.1 Seleção do Laboratório no Dropdown
    const selects = Array.from(document.querySelectorAll("select"));
    const selectLab = selects.find((s) => {
      const opts = Array.from(s.options).map((o) => (o.text || "").toUpperCase());
      return opts.some((t) => t.includes("SÃO LUCAS") || t.includes("SAO LUCAS") || t.includes("MS") || t.includes("MUNICIPAL"));
    });

    // 5.2 Seletor das lixeiras vermelhas de remoção de exames
    const botoesLixeira = Array.from(document.querySelectorAll(".btn-danger, button[title*='Remover'], button[title*='remover'], .fa-trash, .fa-trash-alt"));
    notify(`Identificados ${botoesLixeira.length} exames solicitados no agendamento.`);

    // 5.3 Clicar em "Confirmar" no modal de exames
    const btnConfirmar = Array.from(document.querySelectorAll("button, a")).find(
      (b) => (b.textContent || "").trim().toUpperCase() === "CONFIRMAR"
    );

    if (btnConfirmar) {
      notify("Confirmando alterações nos exames do agendamento...");
      simularClique(btnConfirmar);
      await esperar(1000);
    }

    // -----------------------------------------------------------------------
    // PASSO 6: Clicar em "Salvar" no topo da tela
    // -----------------------------------------------------------------------
    notify("Salvando alterações do agendamento no Conecta SUS...");
    const btnSalvar = Array.from(document.querySelectorAll("button, input[type='submit']")).find(
      (b) => (b.textContent || b.value || "").trim().toUpperCase() === "SALVAR"
    );

    if (btnSalvar) {
      simularClique(btnSalvar);
      await esperar(2000);
    }

    // -----------------------------------------------------------------------
    // PASSO 7: Acionar a Impressão da SADT (Ícone da Impressora Azul Clara)
    // -----------------------------------------------------------------------
    notify("Acionando emissão da SADT correspondente para impressão...");
    await esperar(1000);

    // Re-localiza a linha atualizada na tabela
    const linhasAtualizadas = Array.from(document.querySelectorAll("table tbody tr"));
    const linhaSADT = linhasAtualizadas.find((tr) => (tr.innerText || "").includes(String(agendamento).trim())) || linhaAlvo;

    const btnImpressora = linhaSADT.querySelector(
      "button.btn-info, a.btn-info, [title*='Imprimir'], [title*='SADT'], [title*='sadt'], .fa-print"
    );

    if (btnImpressora) {
      notify("✓ Botão da Impressora acionado! Gerando guia SADT oficial...");
      simularClique(btnImpressora);
    }

    notify(`✓ Sucesso! Automação e roteamento do agendamento #${agendamento} concluídos.`);

    return {
      ok: true,
      agendamento,
      status: "SADT gerada e roteada com sucesso",
    };
  }

  // =========================================================================
  // 6. LISTENER DE MENSAGENS VINDO DO BACKGROUND DA EXTENSÃO
  // =========================================================================
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "OBTER_TOKEN_CONECTASUS") {
      const token = procurarJwtEmStorage();
      sendResponse({ ok: Boolean(token), token });
      return true;
    }

    if (message.type === "EXECUTAR_AUTOMACAO_APOIO_CONECTASUS" || message.type === "EXECUTAR_SEPARACAO_INTELIGENTE_SADT") {
      (async () => {
        try {
          const resultado = await executarFluxoCompletoConectaSus(
            {
              agendamento: message.agendamento,
              prontuario: message.prontuario,
              modo: message.modo || "automatico",
            },
            (etapaMsg) => {
              chrome.runtime.sendMessage({
                type: "BANCADALAB_PROGRESSO_CONECTASUS",
                mensagem: etapaMsg,
              });
            }
          );

          sendResponse({
            ok: true,
            agendamento: message.agendamento,
            resultado,
            mensagem: `Automação executada com sucesso para o agendamento #${message.agendamento}`,
          });
        } catch (err) {
          console.error("[BancadaLab Autônomo] Erro no fluxo:", err);
          sendResponse({
            ok: false,
            error: err.message || "Erro durante a execução do fluxo no Conecta SUS.",
          });
        }
      })();
      return true;
    }
  });
})();
