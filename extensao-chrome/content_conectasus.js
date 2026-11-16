// =========================================================================
// BancadaLab SUS • Content Script (Automação Conecta SUS • Multi-SADT v3.2)
// Executa na aba: https://caconde.conectasus.com.br
// Divide o agendamento misturado em agendamentos dedicados:
//   1) Laboratório MS -> Hemogramas (Hematologia)
//   2) São Lucas     -> Bioquímica & Hormônios
//   3) Municipal     -> Urinálise, Sangue Oculto (PSO) e Glicada local
// Mantendo o mesmo médico solicitante e mesma data/horário de coleta!
// =========================================================================

(function () {
  window.__BANCADALAB_CONECTASUS_ACTIVE__ = true;

  console.log(
    "%c[BancadaLab SUS]%c Robô de Separação de Agendamentos e SADTs v3.2 ativo.",
    "color:#0891B2;font-weight:bold;",
    "color:default;"
  );

  const JWT_REGEX = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

  // =========================================================================
  // 1. HUD VISUAL FLUTUANTE (OVERLAY DE STATUS EM TEMPO REAL) + RECORDER DE LOGS
  // Permite ao operador acompanhar cada etapa na tela do Conecta SUS e copiar logs
  // =========================================================================
  window.__BANCADALAB_LOGS__ = window.__BANCADALAB_LOGS__ || [];

  function gravarLog(msg) {
    const limpo = typeof msg === "string" ? msg.replace(/<[^>]*>/g, "") : JSON.stringify(msg);
    const entrada = `[${new Date().toLocaleTimeString("pt-BR")}] ${limpo}`;
    window.__BANCADALAB_LOGS__.push(entrada);
    if (window.__BANCADALAB_LOGS__.length > 100) window.__BANCADALAB_LOGS__.shift();
  }

  // Função global acessível via console
  window.copiarLogsBancadaLab = function () {
    const texto = window.__BANCADALAB_LOGS__.join("\n");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      console.log("%c[BancadaLab] Logs copiados com sucesso para a Área de Transferência! Basta colar no chat.", "color:#059669;font-weight:bold;");
    }
    return texto;
  };

  let hudElement = null;

  function obterOuCriarHud() {
    if (hudElement && document.body.contains(hudElement)) return hudElement;

    const hud = document.createElement("div");
    hud.id = "bancadalab-conecta-hud";
    hud.style.position = "fixed";
    hud.style.top = "16px";
    hud.style.right = "16px";
    hud.style.zIndex = "9999999";
    hud.style.maxWidth = "460px";
    hud.style.background = "#070b14";
    hud.style.color = "#f8fafc";
    hud.style.borderRadius = "12px";
    hud.style.border = "2px solid #0891b2";
    hud.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(8, 145, 178, 0.3)";
    hud.style.padding = "14px 18px";
    hud.style.fontFamily = "system-ui, -apple-system, sans-serif";
    hud.style.fontSize = "13px";
    hud.style.transition = "all 0.3s ease";
    hud.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border-bottom:1px solid #164e63;padding-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22d3ee;box-shadow:0 0 8px #22d3ee;animation:pulse 1.5s infinite;"></span>
          <strong style="color:#22d3ee;font-size:14px;letter-spacing:0.5px;">BancadaLab SUS • Automação</strong>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button id="bancadalab-btn-copiar-logs" title="Copiar relatório e logs desta sessão para enviar ao assistente" style="cursor:pointer;background:#0e3748;color:#22d3ee;border:1px solid #0891b2;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:bold;transition:background 0.2s;">
            📋 COPIAR LOGS
          </button>
          <span id="bancadalab-hud-tag" style="background:#0891b2;color:#ffffff;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;text-transform:uppercase;">ATIVO</span>
        </div>
      </div>
      <div id="bancadalab-hud-msg" style="color:#e2e8f0;line-height:1.4;margin-bottom:6px;font-weight:500;">Aguardando comando...</div>
      <div style="background:#0f172a;height:4px;border-radius:2px;overflow:hidden;">
        <div id="bancadalab-hud-bar" style="background:linear-gradient(90deg, #0891b2, #059669);height:100%;width:0%;transition:width 0.4s ease;"></div>
      </div>
    `;

    document.body.appendChild(hud);
    hudElement = hud;

    const btnCopiar = hud.querySelector("#bancadalab-btn-copiar-logs");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", () => {
        const texto = window.__BANCADALAB_LOGS__.join("\n") || "Nenhum log registrado ainda.";
        if (navigator.clipboard) {
          navigator.clipboard.writeText(texto).then(() => {
            btnCopiar.textContent = "✓ COPIADO!";
            btnCopiar.style.background = "#059669";
            setTimeout(() => {
              btnCopiar.textContent = "📋 COPIAR LOGS";
              btnCopiar.style.background = "#0e3748";
            }, 3000);
          });
        }
      });
    }

    return hud;
  }

  function atualizarHud(mensagem, progressoPercent = null, tipo = "info") {
    gravarLog(mensagem);
    const hud = obterOuCriarHud();
    hud.style.display = "block";
    const elMsg = hud.querySelector("#bancadalab-hud-msg");
    const elBar = hud.querySelector("#bancadalab-hud-bar");
    const elTag = hud.querySelector("#bancadalab-hud-tag");

    if (elMsg) elMsg.innerHTML = mensagem;

    if (elBar && progressoPercent !== null) {
      elBar.style.width = `${progressoPercent}%`;
    }

    if (elTag) {
      if (tipo === "sucesso") {
        elTag.style.background = "#059669";
        elTag.textContent = "CONCLUÍDO";
      } else if (tipo === "erro") {
        elTag.style.background = "#dc2626";
        elTag.textContent = "ERRO";
      } else if (tipo === "pronto") {
        elTag.style.background = "#0891b2";
        elTag.textContent = "CONECTADO";
      } else {
        elTag.style.background = "#0891b2";
        elTag.textContent = "EM EXECUÇÃO";
      }
    }
  }

  // Inicializa o HUD imediatamente para que o operador veja a confirmação visual
  try {
    obterOuCriarHud();
    atualizarHud("Robô BancadaLab conectado à aba do Conecta SUS. Pronto para triar!", 100, "pronto");
  } catch (_) {}

  // =========================================================================
  // 2. CAPTURA DO TOKEN DA SESSÃO
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
  // 3. CLASSIFICAÇÃO DOS EXAMES
  // =========================================================================
  function classificarDestinoExame(textoExame) {
    const norm = (textoExame || "").toUpperCase().trim();

    // 🩸 1. HEMOGRAMAS -> LABORATÓRIO MS
    if (norm.includes("HEMOGRAMA")) {
      return {
        destino: "MS",
        nomeLaboratorio: "MS LABORATORIOS",
        tipo: "Hematologia",
      };
    }

    // 🔬 2. BIOQUÍMICA -> SÃO LUCAS
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
        nomeLaboratorio: "LABORATORIO SAO LUCAS",
        tipo: "Bioquímica",
      };
    }

    // 🧪 3. BANCADA LOCAL -> MUNICIPAL (Urina, Sangue Oculto PSO, Rápidos e Glicada Retida)
    return {
      destino: "MUNICIPAL",
      nomeLaboratorio: "LABORATORIO MUNICIPAL DE CACONDE",
      tipo: "Bancada Local (Urina/PSO/Glicada)",
    };
  }

  // =========================================================================
  // 4. UTILITÁRIOS DOM ROBUSTOS
  // =========================================================================
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  async function aguardarElemento(seletor, timeoutMs = 6000) {
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
    try {
      elemento.scrollIntoView({ behavior: "instant", block: "center" });
    } catch (_) {}
    const opts = { bubbles: true, cancelable: true, view: window };
    elemento.dispatchEvent(new MouseEvent("mousedown", opts));
    elemento.dispatchEvent(new MouseEvent("mouseup", opts));
    elemento.dispatchEvent(new MouseEvent("click", opts));
    if (typeof elemento.click === "function") {
      elemento.click();
    }
  }

  function simularInput(input, valor) {
    if (!input) return;
    input.focus();
    input.value = valor;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
  }

  // =========================================================================
  // 5. AUTORIZAÇÃO AUTOMÁTICA DE POP-UPS (CONFIRMAÇÃO + SUPERVISOR) COM DEBOUNCE
  // =========================================================================
  let ultimoCliqueModalMs = 0;
  let elementoClicadoRecentemente = null;

  function iniciarObservadorSupervisor() {
    const observer = new MutationObserver(() => {
      // Debounce estrito de 1200ms para evitar cliques múltiplos em Vue.js
      if (Date.now() - ultimoCliqueModalMs < 1200) return;

      const modais = Array.from(document.querySelectorAll(".modal, .modal-dialog, div[role='dialog']")).filter(
        (m) => m.offsetParent !== null
      );

      for (const modal of modais) {
        const texto = (modal.innerText || "").toUpperCase();

        // 1. Modais de Confirmação ("Deseja continuar?", "Excluir exame?", etc.)
        if (
          texto.includes("DESEJA CONTINUAR?") ||
          texto.includes("DESEJA REALMENTE") ||
          texto.includes("CONFIRMA A EXCLUSÃO") ||
          texto.includes("CONFIRMA A EXCLUSAO") ||
          texto.includes("TEM CERTEZA") ||
          texto.includes("EXCLUIR EXAME") ||
          texto.includes("PRAZO DE VALIDADE") ||
          texto.includes("DADOS DO SUPERVISOR")
        ) {
          const btnSim = Array.from(modal.querySelectorAll("button, a, input[type='button']")).find((b) => {
            const val = (b.textContent || b.value || "").trim().toUpperCase();
            return val === "SIM" || val === "CONFIRMAR" || val === "OK" || val === "EXCLUIR";
          });
          if (btnSim && !btnSim.disabled && btnSim !== elementoClicadoRecentemente) {
            ultimoCliqueModalMs = Date.now();
            elementoClicadoRecentemente = btnSim;
            console.log(
              `%c[BancadaLab] Pop-up de confirmação detectado! Clicando em '${(btnSim.textContent || btnSim.value || "").trim()}' (clique único)...`,
              "color:#059669;font-weight:bold;"
            );
            simularClique(btnSim);
            setTimeout(() => {
              elementoClicadoRecentemente = null;
            }, 2500);
            return;
          }
        }

        // 2. Modal de Autorização do Supervisor
        if (texto.includes("AUTORIZAÇÃO DO SUPERVISOR") || texto.includes("AUTORIZAR")) {
          const btnAutorizar = Array.from(modal.querySelectorAll("button, a, input[type='button']")).find(
            (b) => (b.textContent || b.value || "").trim().toUpperCase() === "AUTORIZAR"
          );
          if (btnAutorizar && !btnAutorizar.disabled && btnAutorizar !== elementoClicadoRecentemente) {
            ultimoCliqueModalMs = Date.now();
            elementoClicadoRecentemente = btnAutorizar;
            console.log(
              "%c[BancadaLab] Pop-up 'Autorização do supervisor' detectado! Clicando em 'Autorizar' (clique único)...",
              "color:#059669;font-weight:bold;"
            );
            simularClique(btnAutorizar);
            setTimeout(() => {
              elementoClicadoRecentemente = null;
            }, 2500);
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  iniciarObservadorSupervisor();

  // =========================================================================
  // 5.2 EXTRAÇÃO UNIFICADA E RESILIENTE DA TABELA DO CONECTA SUS
  // Mapeamento real validado:
  // colunas[0] -> Data (16/11/2026)
  // colunas[1] -> Horário (07:00)
  // colunas[2] -> Agendamento (37032)
  // colunas[3] -> Médico solicitante (MAIKELL ESPINOSA PEREZ)
  // colunas[4] -> Exame(s) (HEMOGRAMA, ..., URINA I, SANGUE OCULTO NAS FEZES)
  // colunas[5] -> Unidade solicitante (LABORATORIO MUNICIPAL DE CACONDE)
  // colunas[6] -> Local de atendimento (LABORATORIO MUNICIPAL DE CACONDE)
  // colunas[7] -> Ações [0: Lupa, 1: Impressora Ciano, 2: Tag Amarela, 3: Lápis Azul, 4: Histórico Verde, 5: Lixeira Vermelha]
  // =========================================================================
  function extrairDadosDaLinhaAgendamento(linhaTr, agendamentoPadrao = "") {
    if (!linhaTr) return null;
    const colunas = Array.from(linhaTr.querySelectorAll("td"));
    if (colunas.length === 0) return null;

    let data = "";
    let horario = "";
    let agendamento = agendamentoPadrao;
    let medico = "";
    let exames = "";
    let celulaAcoes = null;

    if (colunas.length >= 7) {
      data = colunas[0]?.innerText?.trim() || "";
      horario = colunas[1]?.innerText?.trim() || "";
      agendamento = colunas[2]?.innerText?.trim() || agendamentoPadrao;
      medico = colunas[3]?.innerText?.trim() || "";
      exames = colunas[4]?.innerText?.trim() || "";
      celulaAcoes = colunas[colunas.length - 1];
    } else {
      data = colunas[0]?.innerText?.trim() || "";
      agendamento = colunas[1]?.innerText?.trim() || agendamentoPadrao;
      medico = colunas[2]?.innerText?.trim() || "";
      exames = colunas[3]?.innerText?.trim() || "";
      celulaAcoes = colunas[colunas.length - 1];
    }

    let diaNumero = "";
    if (data.includes("/")) {
      const matchDia = data.match(/(\d{1,2})\/\d{1,2}\/\d{4}/);
      if (matchDia) diaNumero = parseInt(matchDia[1], 10);
    }

    const botoesAcao = celulaAcoes ? Array.from(celulaAcoes.querySelectorAll("a, button, [role='button']")) : [];

    // Botão Lápis Azul (Editar)
    let btnLapis = botoesAcao.find((b) => {
      const c = (b.className || "").toLowerCase();
      const h = (b.innerHTML || "").toLowerCase();
      const t = (b.getAttribute("title") || "").toLowerCase();
      return (
        c.includes("btn-primary") ||
        h.includes("pencil") ||
        h.includes("edit") ||
        t.includes("editar") ||
        t.includes("alterar")
      );
    });
    if (!btnLapis && botoesAcao.length >= 4) {
      btnLapis = botoesAcao[3]; // 4º botão é o Lápis Azul
    }

    // Botão Impressora Ciano (Imprimir SADT)
    let btnImprimir = botoesAcao.find((b) => {
      const c = (b.className || "").toLowerCase();
      const h = (b.innerHTML || "").toLowerCase();
      const t = (b.getAttribute("title") || "").toLowerCase();
      return (
        c.includes("btn-info") ||
        h.includes("print") ||
        h.includes("imprimir") ||
        t.includes("imprimir") ||
        t.includes("sadt")
      );
    });
    if (!btnImprimir && botoesAcao.length >= 2) {
      btnImprimir = botoesAcao[1]; // 2º botão é a Impressora Ciano
    }

    return {
      data,
      horario,
      agendamento,
      medico,
      exames,
      diaNumero,
      btnLapis,
      btnImprimir,
      botoesAcao,
    };
  }

  // =========================================================================
  // 5.5 SELEÇÃO AUTOMÁTICA DE MÉDICO NO AUTOCOMPLETE COM CAIXINHA FLUTUANTE
  // Digita o nome real do médico e clica fisicamente na sugestão do Conecta SUS
  // =========================================================================
  async function selecionarMedicoNoAutocomplete(medicoNome, notify) {
    if (!medicoNome) return;
    notify(`Vinculando médico solicitante: <strong>${medicoNome}</strong>...`);

    // 1. Localizar o campo de texto do médico solicitante
    const inputs = Array.from(document.querySelectorAll("input[type='text'], input:not([type])"));
    let inputProfissional = inputs.find((inp) => {
      const id = (inp.id || "").toLowerCase();
      const name = (inp.name || "").toLowerCase();
      const ph = (inp.placeholder || "").toLowerCase();
      const cls = (inp.className || "").toLowerCase();
      return (
        id.includes("medico") ||
        id.includes("prof") ||
        name.includes("medico") ||
        name.includes("prof") ||
        ph.includes("medico") ||
        ph.includes("médico") ||
        ph.includes("profissional") ||
        ph.includes("conselho") ||
        ph.includes("crm") ||
        cls.includes("ui-autocomplete")
      );
    });

    if (!inputProfissional) {
      const labels = Array.from(document.querySelectorAll("label"));
      const labelProf = labels.find((l) => {
        const t = (l.textContent || "").toLowerCase();
        return t.includes("médico") || t.includes("medico") || t.includes("profissional");
      });
      if (labelProf) {
        const forId = labelProf.getAttribute("for");
        if (forId) inputProfissional = document.getElementById(forId);
        if (!inputProfissional) inputProfissional = labelProf.parentElement?.querySelector("input");
      }
    }

    if (!inputProfissional) {
      console.warn("[BancadaLab] Campo de médico solicitante não encontrado.");
      return;
    }

    // 2. Focar e limpar campo
    inputProfissional.focus();
    inputProfissional.click();
    inputProfissional.value = "";
    inputProfissional.dispatchEvent(new Event("input", { bubbles: true }));
    await esperar(200);

    // 3. Digitar os 2 primeiros nomes (ex: "MAIKELL ESPINOSA") para abrir a caixinha
    const partesNome = medicoNome.trim().split(/\s+/);
    const termoBusca = partesNome.length > 1 ? `${partesNome[0]} ${partesNome[1]}` : partesNome[0];

    for (const char of termoBusca) {
      inputProfissional.value += char;
      inputProfissional.dispatchEvent(new Event("input", { bubbles: true }));
      inputProfissional.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
      inputProfissional.dispatchEvent(new KeyboardEvent("keypress", { key: char, bubbles: true }));
      inputProfissional.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
      await esperar(45);
    }
    inputProfissional.dispatchEvent(new Event("change", { bubbles: true }));

    // 4. Aguardar a caixinha flutuante de sugestões abrir
    let itemSelecionado = null;
    const maxWait = Date.now() + 3500;
    while (Date.now() < maxWait) {
      const sugestoes = Array.from(
        document.querySelectorAll(
          ".ui-autocomplete li, .ui-autocomplete .ui-menu-item, .ui-menu-item-wrapper, ul.dropdown-menu li, .autocomplete-suggestions div, [role='option'], .dropdown-menu a, .tt-suggestion"
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return (el.offsetParent !== null || rect.height > 0) && el.innerText.trim().length > 0;
      });

      if (sugestoes.length > 0) {
        itemSelecionado =
          sugestoes.find((it) =>
            (it.innerText || "").toUpperCase().includes(partesNome[0].toUpperCase())
          ) || sugestoes[0];
        break;
      }
      await esperar(200);
    }

    // 5. Clicar no item correspondente na caixinha
    if (itemSelecionado) {
      notify(`Médico selecionado na caixinha: <strong>${itemSelecionado.innerText.trim()}</strong>`);
      itemSelecionado.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      itemSelecionado.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      itemSelecionado.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
      simularClique(itemSelecionado);
      await esperar(800);
    } else {
      inputProfissional.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
      await esperar(200);
      inputProfissional.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      await esperar(300);
    }
  }

  // =========================================================================
  // 6. CRIAÇÃO DE NOVO AGENDAMENTO PARA LABORATÓRIO ESPECÍFICO (MS, SÃO LUCAS OU MUNICIPAL)
  // =========================================================================
  async function criarNovoAgendamentoNoConectaSus(
    { medico, dataColeta, diaNumero, destinoLab, examesParaIncluir },
    notify
  ) {
    const nomeLabFormatado =
      destinoLab === "MS"
        ? "MS LABORATÓRIOS"
        : destinoLab === "MUNICIPAL"
        ? "LABORATÓRIO MUNICIPAL DE CACONDE"
        : "LABORATÓRIO SÃO LUCAS";

    notify(`Iniciando criação de novo agendamento para <strong>${nomeLabFormatado}</strong>...`);

    // 1. Clicar na aba "AGENDAR EXAMES"
    const abas = Array.from(document.querySelectorAll("a, button, li a, .nav-link, span"));
    const abaAgendar = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "AGENDAR EXAMES");

    if (abaAgendar) {
      notify("Abrindo formulário 'AGENDAR EXAMES'...");
      simularClique(abaAgendar);
      await esperar(1800);
    }

    // 2. Preencher e Selecionar Profissional Solicitante na caixinha do autocomplete
    if (medico) {
      await selecionarMedicoNoAutocomplete(medico, notify);
    }

    // 3. Selecionar Coleta e Laboratório de Destino
    notify(`Selecionando laboratório de destino: <strong>${nomeLabFormatado}</strong>...`);
    const selects = Array.from(document.querySelectorAll("select"));

    // Dropdown Coleta (Geralmente Unidade Municipal)
    const selectColeta = selects.find((s) => (s.name || s.id || "").toLowerCase().includes("coleta"));
    if (selectColeta) {
      const optMun = Array.from(selectColeta.options).find((o) => (o.text || "").toUpperCase().includes("MUNICIPAL"));
      if (optMun) {
        selectColeta.value = optMun.value;
        selectColeta.dispatchEvent(new Event("change", { bubbles: true }));
        await esperar(400);
      }
    }

    // Dropdown Laboratório / Local de Atendimento
    const selectLab = selects.find((s) => {
      const opts = Array.from(s.options).map((o) => (o.text || "").toUpperCase());
      return opts.some((t) => t.includes("SÃO LUCAS") || t.includes("SAO LUCAS") || t.includes("MS") || t.includes("MUNICIPAL"));
    });

    if (selectLab) {
      const targetTerm = destinoLab === "MS" ? "MS" : destinoLab === "MUNICIPAL" ? "MUNICIPAL" : "LUCAS";
      const optionAlvo = Array.from(selectLab.options).find((o) => (o.text || "").toUpperCase().includes(targetTerm));
      if (optionAlvo) {
        selectLab.value = optionAlvo.value;
        selectLab.dispatchEvent(new Event("change", { bubbles: true }));
        selectLab.dispatchEvent(new Event("input", { bubbles: true }));
        await esperar(1500); // Aguarda carregamento AJAX das cotas e jornadas no calendário
      }
    }

    // 4. Clicar no dia no Calendário (dia da coleta) para abrir o modal de exames
    if (diaNumero) {
      notify(`Selecionando dia <strong>${diaNumero}</strong> no calendário do Conecta SUS...`);
      const celulasDias = Array.from(
        document.querySelectorAll(".calendar td, table tbody td, [class*='day'], [class*='data'], a.ui-state-default")
      );

      const celulaAlvo = celulasDias.find((td) => {
        const txt = (td.textContent || "").trim();
        return txt === String(diaNumero) || txt.startsWith(String(diaNumero) + " ") || txt.startsWith(String(diaNumero) + "\n");
      });

      if (celulaAlvo) {
        simularClique(celulaAlvo);
        await esperar(1800);
      }
    }

    // 5. No Modal 'Confirmação do agendamento de exame':
    // 5.1 Selecionar o horário disponível (radio button 07:00)
    const radioHorario = document.querySelector(".modal input[type='radio'], input[type='radio'][name*='horario'], input[type='radio']");
    if (radioHorario) {
      simularClique(radioHorario);
      await esperar(500);
    }

    // 5.2 Adicionar cada um dos exames daquele laboratório
    notify(`Adicionando exames no modal (${examesParaIncluir.length} exames)...`);
    for (const nomeExame of examesParaIncluir) {
      const inputExame = document.querySelector(
        ".modal input[placeholder*='Exame'], input[placeholder*='exame'], input[name*='exame'], input#exame, .modal input[type='text']"
      );

      if (inputExame) {
        simularInput(inputExame, nomeExame);
        await esperar(700);

        // Se houver checkbox correspondente no dropdown do autocomplete
        const checkboxesModal = Array.from(document.querySelectorAll(".modal input[type='checkbox'], input[type='checkbox']"));
        const checkboxExame = checkboxesModal.find((cb) => {
          const parentText = (cb.parentElement?.innerText || "").toUpperCase();
          return parentText.includes(nomeExame.toUpperCase());
        });

        if (checkboxExame && !checkboxExame.checked) {
          simularClique(checkboxExame);
          await esperar(500);
        } else {
          // Clica no botão "Incluir"
          const btnIncluir = Array.from(document.querySelectorAll(".modal button, button, a")).find(
            (b) => (b.textContent || "").trim().toUpperCase() === "INCLUIR"
          );
          if (btnIncluir) {
            simularClique(btnIncluir);
            await esperar(600);
          }
        }
      }
    }

    // 5.3 Clicar em "Confirmar" no rodapé do modal
    const btnConfirmar = Array.from(document.querySelectorAll(".modal button, button")).find(
      (b) => (b.textContent || "").trim().toUpperCase() === "CONFIRMAR"
    );
    if (btnConfirmar) {
      notify("Confirmando inclusão dos exames na grade...");
      simularClique(btnConfirmar);
      await esperar(1500);
    }

    // 6. Clicar no botão "Salvar" no topo da tela do Conecta SUS
    notify(`Gravando agendamento oficial de <strong>${nomeLabFormatado}</strong>...`);
    const btnSalvar = Array.from(document.querySelectorAll("button, input[type='submit']")).find(
      (b) => (b.textContent || b.value || "").trim().toUpperCase() === "SALVAR"
    );

    if (btnSalvar) {
      simularClique(btnSalvar);
      await esperar(3000);
    }

    notify(`✓ Agendamento criado e salvo com sucesso para <strong>${nomeLabFormatado}</strong>!`);
  }

  // =========================================================================
  // 6.2 FLUXO RÁPIDO: APENAS MUDAR LABORATÓRIO DO AGENDAMENTO (LÁPIS AZUL)
  // Quando a guia já está certa e o operador só quer transferir para Apoio
  // =========================================================================
  async function executarApenasMudancaLaboratorio(
    { agendamento, prontuario, laboratorioAlvo = "SAO_LUCAS" },
    notify
  ) {
    const nomeLabFormatado =
      laboratorioAlvo.includes("MS") ? "MS LABORATÓRIOS" : "LABORATÓRIO SÃO LUCAS";

    notify(`Iniciando transferência da guia #${agendamento} para <strong>${nomeLabFormatado}</strong>...`, 15);

    // 1. Garantir que estamos na tela do paciente (mesma lógica resiliente)
    const urlAtual = window.location.href;
    const temAbasPerfil = Array.from(document.querySelectorAll("a, button, li, .nav-link")).some((el) => {
      const t = (el.textContent || "").trim().toUpperCase();
      return t.includes("EXAMES AGENDADOS") || t.includes("AGENDAR EXAMES");
    });

    const jaEstaNoPerfil =
      urlAtual.includes("/agendamento-exame/create") ||
      urlAtual.includes("/exame-laboratorial/agendamento-exame/create") ||
      urlAtual.includes("/create/") ||
      temAbasPerfil;

    if (!jaEstaNoPerfil) {
      notify(`Pesquisando Prontuário #${prontuario || agendamento} para abrir o paciente...`, 20);
      const inputBusca = document.querySelector(
        "input[placeholder*='buscar' i], input[placeholder*='pesquisar' i], input[type='search'], input.form-control"
      );
      if (inputBusca) {
        simularInput(inputBusca, prontuario || agendamento);
        await esperar(400);
        const btnBuscar = Array.from(document.querySelectorAll("button, input[type='submit']")).find(
          (b) => (b.textContent || b.value || "").trim().toUpperCase() === "BUSCAR"
        );
        if (btnBuscar) simularClique(btnBuscar);
        await esperar(2000);

        const trs = Array.from(document.querySelectorAll("table tbody tr")).filter(
          (tr) => tr.innerText && !tr.innerText.includes("Nenhum") && !tr.innerText.includes("Carregando")
        );
        if (trs.length > 0) {
          const btnAcao = trs[0].querySelector("a[href*='create'], button, a");
          if (btnAcao) {
            simularClique(btnAcao);
            await esperar(2500);
          }
        }
      }
    }

    // 2. Acessar aba "EXAMES AGENDADOS"
    notify("Acessando aba 'EXAMES AGENDADOS'...", 35);
    const abas = Array.from(document.querySelectorAll("a, button, li, .nav-link, span"));
    const abaExames = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
    if (abaExames) {
      simularClique(abaExames);
      await esperar(1600);
    }

    // 3. Localizar a linha do agendamento
    notify(`Localizando agendamento #${agendamento} na tabela...`, 45);
    const linhas = Array.from(document.querySelectorAll("table tbody tr"));
    let linhaAlvo = null;
    if (agendamento) {
      linhaAlvo = linhas.find((tr) => (tr.innerText || "").includes(String(agendamento).trim()));
    }
    if (!linhaAlvo && linhas.length > 0) {
      linhaAlvo = linhas[linhas.length - 1];
    }

    if (!linhaAlvo) {
      throw new Error(`Agendamento #${agendamento} não encontrado na lista do paciente.`);
    }

    // Capturar médico, data e ações da guia original usando o extrator unificado
    const dadosGuiaOriginal = extrairDadosDaLinhaAgendamento(linhaAlvo, agendamento);
    const textoDataHora = dadosGuiaOriginal.data || "";
    const nomeMedico = dadosGuiaOriginal.medico || "";
    const diaNumero = dadosGuiaOriginal.diaNumero || "";
    let btnLapis = dadosGuiaOriginal.btnLapis;

    // 4. Localizar e Clicar no LÁPIS AZUL (Botão de Edição)
    notify(`Abrindo edição do agendamento #${agendamento} (Lápis Azul) | Médico: ${nomeMedico}...`, 55);

    if (!btnLapis) {
      const botoesLinha = Array.from(linhaAlvo.querySelectorAll("a, button, [role='button']"));
      btnLapis = botoesLinha.find((b) => {
        const h = (b.getAttribute("href") || "").toLowerCase();
        const t = (b.getAttribute("title") || "").toLowerCase();
        const c = (b.className || "").toLowerCase();
        const html = (b.innerHTML || "").toLowerCase();
        return (
          c.includes("btn-primary") ||
          c.includes("pencil") ||
          c.includes("edit") ||
          t.includes("editar") ||
          t.includes("alterar") ||
          html.includes("pencil") ||
          html.includes("edit")
        );
      });
      if (!btnLapis && botoesLinha.length >= 4) {
        btnLapis = botoesLinha[3];
      }
    }

    if (!btnLapis) {
      throw new Error(`Botão de edição (Lápis Azul) não encontrado para o agendamento #${agendamento}.`);
    }

    simularClique(btnLapis);
    await esperar(2200); // Aguarda abertura da tela/modal de edição

    // 5. Localizar o dropdown de Laboratório de Destino
    notify(`Alterando laboratório para <strong>${nomeLabFormatado}</strong>...`, 65);
    const selects = Array.from(document.querySelectorAll("select"));
    const selectLab = selects.find((s) => {
      const opts = Array.from(s.options).map((o) => (o.text || "").toUpperCase());
      return opts.some((t) => t.includes("SÃO LUCAS") || t.includes("SAO LUCAS") || t.includes("MS") || t.includes("MUNICIPAL"));
    });

    if (selectLab) {
      const termo = (laboratorioAlvo || "").toUpperCase();
      let optionAlvo = null;
      if (termo.includes("MS")) {
        optionAlvo = Array.from(selectLab.options).find((o) => (o.text || "").toUpperCase().includes("MS"));
      } else if (termo.includes("LUCAS") || termo.includes("SAO_LUCAS")) {
        optionAlvo = Array.from(selectLab.options).find((o) => (o.text || "").toUpperCase().includes("LUCAS"));
      } else {
        optionAlvo = Array.from(selectLab.options).find((o) => (o.text || "").toUpperCase().includes("MUNICIPAL"));
      }

      if (optionAlvo) {
        selectLab.value = optionAlvo.value;
        selectLab.dispatchEvent(new Event("change", { bubbles: true }));
        selectLab.dispatchEvent(new Event("input", { bubbles: true }));
        notify(`✓ Laboratório selecionado: <strong>${optionAlvo.text}</strong>!`, 70);
        await esperar(1200);
      }
    }

    // 5.1 Retirar da guia de apoio os exames que são da bancada local (Urina, PSO, etc.)
    const examesBancadaRetirados = [];
    const containerEdicao =
      document.querySelector(".modal.show, .modal.in, .modal[style*='display: block'], div[role='dialog'], form.form-horizontal, form") ||
      document;

    const linhasExamesEdicao = Array.from(
      containerEdicao.querySelectorAll("table tbody tr, .list-group-item, div[class*='exame']")
    ).filter(
      (el) =>
        el.innerText &&
        (el.innerText.includes("0202") ||
          el.innerText.toUpperCase().includes("URINA") ||
          el.innerText.toUpperCase().includes("SANGUE OCULTO") ||
          el.innerText.toUpperCase().includes("PSO") ||
          el.innerText.toUpperCase().includes("PARASITOLOGICO"))
    );

    for (const linhaExame of linhasExamesEdicao) {
      const textoExame = (linhaExame.innerText || "").toUpperCase();
      const ehBancadaLocal =
        textoExame.includes("URINA") ||
        textoExame.includes("EAS") ||
        textoExame.includes("SANGUE OCULTO") ||
        textoExame.includes("PSO") ||
        textoExame.includes("PARASITOLÓGICO") ||
        textoExame.includes("PARASITOLOGICO") ||
        textoExame.includes("FEZES");

      if (ehBancadaLocal) {
        const nomeLimpo = textoExame.split("\n")[0].replace(/^[\d\s-]+/, "").trim();
        examesBancadaRetirados.push(nomeLimpo || "URINA TIPO I");

        notify(`Retirando exame de bancada (${nomeLimpo}) da SADT de apoio...`, 75);
        const btnLixeira = linhaExame.querySelector(
          ".btn-danger, .fa-trash, a[title*='Excluir' i], button[title*='Excluir' i], a[title*='Remover' i], button[title*='Remover' i], [class*='trash']"
        );
        if (btnLixeira) {
          simularClique(btnLixeira);
          await esperar(2000); // Aguarda confirmação do modal de supervisor
        }
      }
    }

    // 6. Clicar em "Salvar" a guia de apoio
    notify("Gravando guia de apoio oficial no Conecta SUS...", 80);
    const botoes = Array.from(document.querySelectorAll("button, input[type='submit'], a.btn"));
    const btnSalvar = botoes.find((b) => {
      const txt = (b.textContent || b.value || "").trim().toUpperCase();
      return txt === "SALVAR" || txt.includes("SALVAR");
    });

    if (btnSalvar) {
      simularClique(btnSalvar);
      await esperar(3500); // Aguarda POST 201 Created no servidor
    }

    // 7. Voltar para aba "EXAMES AGENDADOS" e emitir a SADT do apoio
    notify("Emitindo SADT de apoio limpa...", 88);
    const abasRetorno = Array.from(document.querySelectorAll("a, button, li, .nav-link, span"));
    const abaAgendadosRetorno = abasRetorno.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
    if (abaAgendadosRetorno) {
      simularClique(abaAgendadosRetorno);
      await esperar(1800);
    }

    // Clicar na impressora da guia de apoio
    const linhasFinais = Array.from(document.querySelectorAll("table tbody tr"));
    const linhaEditada = linhasFinais.find((tr) => (tr.innerText || "").includes(String(agendamento).trim())) || linhasFinais[0];
    if (linhaEditada) {
      const btnPrint = linhaEditada.querySelector(".btn-info, a[href*='imprimir' i], button[title*='imprimir' i]");
      if (btnPrint) {
        notify("Abrindo SADT de apoio para impressão...", 92, "sucesso");
        simularClique(btnPrint);
        await esperar(1500);
      }
    }

    // 8. Se houver exames de bancada que foram retirados, cria a guia local no Laboratório Municipal!
    if (examesBancadaRetirados.length > 0) {
      notify(
        `Criando novo agendamento no Laboratório Municipal para a bancada local (${examesBancadaRetirados.join(", ")})...`,
        94
      );
      try {
        await criarNovoAgendamentoNoConectaSus(
          {
            medico: nomeMedico,
            dataColeta: textoDataHora,
            diaNumero,
            destinoLab: "MUNICIPAL",
            examesParaIncluir: examesBancadaRetirados,
          },
          notify
        );

        // Retorna para a aba de agendados para visualização final
        const abasFinais = Array.from(document.querySelectorAll("a, button, li, .nav-link, span"));
        const abaFinal = abasFinais.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
        if (abaFinal) {
          simularClique(abaFinal);
          await esperar(1800);
        }
      } catch (errBancada) {
        console.warn("[BancadaLab] Aviso ao criar agendamento de bancada local:", errBancada);
      }
    }

    notify(
      `✓ Sucesso Total! Guia de apoio gerada para ${nomeLabFormatado} e exames de bancada (${examesBancadaRetirados.length || 0}) criados no Municipal!`,
      100,
      "sucesso"
    );

    return {
      ok: true,
      agendamento,
      prontuario,
      laboratorioDestino: nomeLabFormatado,
      examesBancadaRetirados,
      status: `Laboratório alterado para ${nomeLabFormatado} e bancada local criada no Municipal`,
    };
  }

  // =========================================================================
  // 7. FLUXO MESTRE: LOCALIZAÇÃO, EXTRAÇÃO E SEPARAÇÃO DE SADTs
  // =========================================================================
  async function executarFluxoCompletoConectaSus({ agendamento, prontuario }, progressoCallback) {
    const notify = (msg, percent = null, tipo = "info") => {
      console.log(`[BancadaLab Autônomo] ${msg}`);
      atualizarHud(msg, percent, tipo);
      if (typeof progressoCallback === "function") progressoCallback(msg);
    };

    notify(`Iniciando busca do paciente: Prontuário #${prontuario || "—"} | Agendamento #${agendamento || "—"}...`, 10);

    // -----------------------------------------------------------------------
    // PASSO 1: Se estiver na tela LISTA DE PACIENTE, busca pelo Prontuário
    // (Se já estiver na tela do paciente /create/[id], pula direto para o Passo 2!)
    // -----------------------------------------------------------------------
    const urlAtual = window.location.href;
    const temAbasPerfil = Array.from(document.querySelectorAll("a, button, li, .nav-link")).some((el) => {
      const t = (el.textContent || "").trim().toUpperCase();
      return t.includes("EXAMES AGENDADOS") || t.includes("AGENDAR EXAMES");
    });

    const jaEstaNoPerfilDoPaciente =
      urlAtual.includes("/agendamento-exame/create") ||
      urlAtual.includes("/exame-laboratorial/agendamento-exame/create") ||
      urlAtual.includes("/create/") ||
      temAbasPerfil;

    if (!jaEstaNoPerfilDoPaciente) {
      notify(`Pesquisando Prontuário Municipal ${prontuario || agendamento} na listagem...`, 18);

      const selects = Array.from(document.querySelectorAll("select"));
      const selectTipoBusca = selects.find((s) =>
        Array.from(s.options).some((o) => (o.text || "").toUpperCase().includes("PRONTUÁRIO"))
      );
      if (selectTipoBusca) {
        const optPront = Array.from(selectTipoBusca.options).find((o) =>
          (o.text || "").toUpperCase().includes("PRONTUÁRIO")
        );
        if (optPront) {
          selectTipoBusca.value = optPront.value;
          selectTipoBusca.dispatchEvent(new Event("change", { bubbles: true }));
          await esperar(200);
        }
      }

      const inputBusca = document.querySelector(
        "input[placeholder*='buscar' i], input[placeholder*='pesquisar' i], input[type='search'], input.form-control"
      );
      if (!inputBusca) throw new Error("Campo de busca do Conecta SUS não encontrado.");

      simularInput(inputBusca, prontuario || agendamento);
      await esperar(400);

      const btnBuscar = Array.from(document.querySelectorAll("button, input[type='submit']")).find(
        (b) => (b.textContent || b.value || "").trim().toUpperCase() === "BUSCAR"
      );
      if (btnBuscar) {
        simularClique(btnBuscar);
      } else {
        inputBusca.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      }

      notify("Aguardando retorno da busca na tabela...", 22);
      await esperar(2000);

      // Aguarda linha do paciente carregar
      let linhaPaciente = null;
      const fimEsperaBusca = Date.now() + 6000;
      while (Date.now() < fimEsperaBusca) {
        const trs = Array.from(document.querySelectorAll("table tbody tr")).filter(
          (tr) => tr.innerText && !tr.innerText.includes("Nenhum") && !tr.innerText.includes("Carregando")
        );
        if (trs.length > 0) {
          linhaPaciente = trs[0];
          break;
        }
        await esperar(300);
      }

      if (!linhaPaciente) {
        throw new Error(`Paciente com prontuário ${prontuario || agendamento} não localizado na tabela.`);
      }

      notify("Paciente localizado! Abrindo tela de agendamentos...", 28);

      // Procura botão/link de ação na linha para abrir o agendamento
      const botoesLinha = Array.from(
        linhaPaciente.querySelectorAll("a, button, [role='button'], i, span")
      );
      let btnAcao = botoesLinha.find((b) => {
        const h = (b.getAttribute("href") || "").toLowerCase();
        const t = (b.getAttribute("title") || "").toLowerCase();
        const c = (b.className || "").toLowerCase();
        return (
          h.includes("create") ||
          h.includes("agendamento") ||
          t.includes("agendar") ||
          t.includes("exame") ||
          c.includes("calendar") ||
          c.includes("btn-primary") ||
          c.includes("btn-info")
        );
      });

      if (!btnAcao) {
        const linksLinha = Array.from(linhaPaciente.querySelectorAll("a, button"));
        btnAcao = linksLinha[linksLinha.length - 1] || linhaPaciente;
      }

      if (!window.location.href.includes("create")) {
        simularClique(btnAcao);
      }
      await esperar(2000);

      // Aguarda até a tela do paciente carregar com as abas
      const fimEsperaPerfil = Date.now() + 8000;
      while (Date.now() < fimEsperaPerfil) {
        const urlAgora = window.location.href;
        const abasAgora = Array.from(document.querySelectorAll("a, button, li, .nav-link")).some((el) => {
          const t = (el.textContent || "").trim().toUpperCase();
          return t.includes("EXAMES AGENDADOS") || t.includes("AGENDAR EXAMES");
        });
        if (urlAgora.includes("create") || abasAgora) {
          break;
        }
        await esperar(400);
      }
    } else {
      notify("Já no perfil do paciente. Prosseguindo direto para agendamentos...", 25);
    }

    // -----------------------------------------------------------------------
    // PASSO 2: Acessar a aba "EXAMES AGENDADOS"
    // -----------------------------------------------------------------------
    notify("Acessando aba 'EXAMES AGENDADOS'...", 35);
    await esperar(800);

    const abas = Array.from(document.querySelectorAll("a, button, li a, .nav-link, span"));
    const abaExamesAgendados = abas.find((el) => {
      const t = (el.textContent || "").trim().toUpperCase();
      return t === "EXAMES AGENDADOS" || t.includes("EXAMES AGENDADOS");
    });

    if (abaExamesAgendados) {
      simularClique(abaExamesAgendados);
      await esperar(1600);
    }

    // Aguarda a tabela de exames agendados carregar (tolerância de até 8s)
    let tabelaCarregou = false;
    const fimEsperaTabela = Date.now() + 8000;
    while (Date.now() < fimEsperaTabela) {
      const trs = Array.from(document.querySelectorAll("table tbody tr")).filter(
        (tr) => tr.innerText && !tr.innerText.includes("Carregando") && tr.innerText.trim().length > 0
      );
      if (trs.length > 0) {
        tabelaCarregou = true;
        break;
      }
      await esperar(400);
    }

    if (!tabelaCarregou) {
      throw new Error("Tabela de exames agendados não carregou após 8 segundos.");
    }

    // -----------------------------------------------------------------------
    // PASSO 3: Localizar a linha exata do Agendamento (ex: 37032)
    // -----------------------------------------------------------------------
    notify(`Localizando guia do agendamento #${agendamento}...`, 40);
    const linhas = Array.from(document.querySelectorAll("table tbody tr"));

    let linhaAlvo = null;
    if (agendamento) {
      linhaAlvo = linhas.find((tr) => (tr.innerText || "").includes(String(agendamento).trim()));
    }
    if (!linhaAlvo && linhas.length > 0) {
      linhaAlvo = linhas[linhas.length - 1];
    }

    if (!linhaAlvo) {
      throw new Error(`Agendamento #${agendamento} não encontrado na lista do paciente.`);
    }

    // -----------------------------------------------------------------------
    // PASSO 4: Extrair Dados Reais da Linha (Médico, Data, Hora, Lista de Exames)
    // -----------------------------------------------------------------------
    const dadosGuia = extrairDadosDaLinhaAgendamento(linhaAlvo, agendamento);
    const textoDataHora = dadosGuia.data || "";
    const numeroAgendamento = dadosGuia.agendamento || agendamento;
    const nomeMedico = dadosGuia.medico || "";
    const textoExames = dadosGuia.exames || "";
    const diaNumero = dadosGuia.diaNumero || "";

    notify(`Dados extraídos: Agendamento #${numeroAgendamento} | Médico: ${nomeMedico} | Data: ${textoDataHora}`, 50);

    // Separar lista de exames por vírgula
    const listaExamesNomes = textoExames
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    notify(`Identificados ${listaExamesNomes.length} exames: ${listaExamesNomes.join(", ")}`, 55);

    // Separar exames nos 3 destinos oficiais
    const examesMS = [];
    const examesSaoLucas = [];
    const examesMunicipal = [];

    listaExamesNomes.forEach((ex) => {
      const c = classificarDestinoExame(ex);
      if (c.destino === "MS") examesMS.push(ex);
      else if (c.destino === "SAO_LUCAS") examesSaoLucas.push(ex);
      else examesMunicipal.push(ex);
    });

    notify(
      `Divisão: Lab MS (${examesMS.length}), São Lucas (${examesSaoLucas.length}), Municipal (${examesMunicipal.length})`,
      60
    );

    // -----------------------------------------------------------------------
    // PASSO 5: Criar Novo Agendamento para o Laboratório MS (se houver Hemograma)
    // -----------------------------------------------------------------------
    if (examesMS.length > 0) {
      try {
        notify(`Criando agendamento 1/2 no <strong>Laboratório MS</strong> (${examesMS.join(", ")})...`, 65);
        await criarNovoAgendamentoNoConectaSus(
          {
            medico: nomeMedico,
            dataColeta: textoDataHora,
            diaNumero,
            destinoLab: "MS",
            examesParaIncluir: examesMS,
          },
          notify
        );
      } catch (errMS) {
        console.warn("[BancadaLab] Aviso ao criar agendamento MS:", errMS);
      }
    }

    // -----------------------------------------------------------------------
    // PASSO 6: Criar Novo Agendamento para o São Lucas (se houver Bioquímica)
    // -----------------------------------------------------------------------
    if (examesSaoLucas.length > 0) {
      try {
        notify(`Criando agendamento 2/2 no <strong>Laboratório São Lucas</strong> (${examesSaoLucas.join(", ")})...`, 80);
        await criarNovoAgendamentoNoConectaSus(
          {
            medico: nomeMedico,
            dataColeta: textoDataHora,
            diaNumero,
            destinoLab: "SAO_LUCAS",
            examesParaIncluir: examesSaoLucas,
          },
          notify
        );
      } catch (errSL) {
        console.warn("[BancadaLab] Aviso ao criar agendamento São Lucas:", errSL);
      }
    }

    // -----------------------------------------------------------------------
    // PASSO 7: Voltar para aba "EXAMES AGENDADOS" para exibir as guias criadas
    // -----------------------------------------------------------------------
    notify("Atualizando lista de EXAMES AGENDADOS do paciente...", 90);
    const abasFinais = Array.from(document.querySelectorAll("a, button, li a, .nav-link, span"));
    const abaAgendadosFinal = abasFinais.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
    if (abaAgendadosFinal) {
      simularClique(abaAgendadosFinal);
      await esperar(2000);
    }

    notify(
      `✓ Sucesso Total! Agendamentos gerados e separados no Conecta SUS: Lab MS (${examesMS.length}), São Lucas (${examesSaoLucas.length}), Municipal (${examesMunicipal.length}).`,
      95,
      "sucesso"
    );

    // -----------------------------------------------------------------------
    // PASSO 8: Acionar impressão das SADTs apenas agora (no final de tudo!)
    // -----------------------------------------------------------------------
    notify("Preparando envio das guias SADT para impressão...", 98, "sucesso");
    await esperar(1200);

    const linhasFinais = Array.from(document.querySelectorAll("table tbody tr"));
    const botoesImpressora = [];

    for (const tr of linhasFinais) {
      const btnPrint = tr.querySelector(".btn-info, a[href*='imprimir' i], button[title*='imprimir' i], [class*='print']");
      if (btnPrint) {
        botoesImpressora.push(btnPrint);
      }
    }

    // Se houver botões de impressora disponíveis na tabela, aciona a impressão da guia mais recente
    if (botoesImpressora.length > 0) {
      try {
        notify("Abrindo SADT para impressão final...", 100, "sucesso");
        simularClique(botoesImpressora[0]);
      } catch (_) {}
    }

    notify(
      `✓ Agendamentos separados e SADT gerada com sucesso! Pronto para a bancada.`,
      100,
      "sucesso"
    );

    return {
      ok: true,
      prontuario,
      agendamento: numeroAgendamento,
      medico: nomeMedico,
      examesMS,
      examesSaoLucas,
      examesMunicipal,
      status: "Todos os agendamentos foram criados e separados com sucesso",
    };
  }

  // =========================================================================
  // 8. LISTENER DE MENSAGENS DO BACKGROUND
  // =========================================================================
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING_CONECTASUS") {
      sendResponse({ ok: true, active: true });
      return true;
    }

    if (message.type === "OBTER_TOKEN_CONECTASUS") {
      const token = procurarJwtEmStorage();
      sendResponse({ ok: Boolean(token), token });
      return true;
    }

    if (
      message.type === "EXECUTAR_AUTOMACAO_APOIO_CONECTASUS" ||
      message.type === "EXECUTAR_SEPARACAO_INTELIGENTE_SADT" ||
      message.type === "EXECUTAR_MUDANCA_LABORATORIO"
    ) {
      (async () => {
        try {
          const isMudancaDireta = message.modo === "mudar_laboratorio" || message.type === "EXECUTAR_MUDANCA_LABORATORIO";
          const notifyProgresso = (etapaMsg) => {
            chrome.runtime.sendMessage({
              type: "BANCADALAB_PROGRESSO_CONECTASUS",
              mensagem: etapaMsg,
            });
          };

          let resultado = null;
          if (isMudancaDireta) {
            resultado = await executarApenasMudancaLaboratorio(
              {
                agendamento: message.agendamento,
                prontuario: message.prontuario,
                laboratorioAlvo: message.laboratorioDestino || message.destinoExames?.bioquimica || "SAO_LUCAS",
              },
              notifyProgresso
            );
          } else {
            resultado = await executarFluxoCompletoConectaSus(
              {
                agendamento: message.agendamento,
                prontuario: message.prontuario,
              },
              notifyProgresso
            );
          }

          try {
            chrome.runtime.sendMessage({
              type: "BANCADALAB_RETORNO_CONECTASUS",
              ok: true,
              agendamento: message.agendamento,
              resultado,
            });
          } catch (_) {}

          sendResponse({
            ok: true,
            agendamento: message.agendamento,
            resultado,
            mensagem: `Operação concluída com sucesso no Conecta SUS!`,
          });
        } catch (err) {
          console.error("[BancadaLab Autônomo] Erro no fluxo:", err);
          atualizarHud(`Erro: ${err.message}`, 100, "erro");
          try {
            chrome.runtime.sendMessage({
              type: "BANCADALAB_ERRO_CONECTASUS",
              error: err.message || "Erro no Conecta SUS",
            });
          } catch (_) {}
          sendResponse({
            ok: false,
            error: err.message || "Erro durante a separação dos agendamentos no Conecta SUS.",
          });
        }
      })();
      return true;
    }
  });
})();
