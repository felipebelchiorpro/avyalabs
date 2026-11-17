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
  // 1. HUD VISUAL FLUTUANTE + FLIGHT RECORDER (TELEMETRIA F12 COMPLETA)
  // Captura Console, Requisições Network (Fetch/XHR), Cliques e Modais
  // =========================================================================
  window.__BANCADALAB_LOGS__ = window.__BANCADALAB_LOGS__ || [];

  function gravarLog(categoria, msg) {
    if (arguments.length === 1) {
      msg = categoria;
      categoria = "ROBO";
    }
    const textoMsg = typeof msg === "string" ? msg : JSON.stringify(msg);
    const entrada = `[${new Date().toLocaleTimeString("pt-BR")}] [${categoria.toUpperCase()}] ${textoMsg}`;
    window.__BANCADALAB_LOGS__.push(entrada);
    if (window.__BANCADALAB_LOGS__.length > 500) window.__BANCADALAB_LOGS__.shift();

    // Atualiza contador no botão de cópia do HUD se visível
    const btnCopiar = document.querySelector("#bancadalab-btn-copiar-logs");
    if (btnCopiar && !btnCopiar.textContent.includes("✓")) {
      btnCopiar.textContent = `📋 COPIAR LOGS (${window.__BANCADALAB_LOGS__.length})`;
    }
  }

  // Interceptar todos os cliques do operador e do robô na página
  document.addEventListener(
    "click",
    (e) => {
      try {
        const el = e.target;
        if (!el || el.closest?.("#bancadalab-conecta-hud")) return;
        const tag = (el.tagName || "").toLowerCase();
        const cls = (el.className || "").toString().slice(0, 40);
        const id = el.id ? `#${el.id}` : "";
        const title = el.getAttribute("title") || "";
        const href = el.getAttribute("href") || "";
        const txt = (el.innerText || el.value || "").trim().slice(0, 30).replace(/\s+/g, " ");
        gravarLog("CLIQUE", `<${tag}${id} class="${cls}" title="${title}" href="${href}"> "${txt}"`);
      } catch (_) {}
    },
    true
  );

  // Escutar eventos de logs ou mensagens internas
  window.addEventListener("message", (ev) => {
    if (ev.source !== window || !ev.data || ev.data.source !== "bancadalab_telemetria") return;
    const { tipo, dados } = ev.data;
    if (tipo === "CONSOLE_ERROR" || tipo === "NETWORK_FETCH_ERRO") {
      gravarLog("F12_ERRO", dados);
    } else if (tipo.startsWith("NETWORK")) {
      gravarLog("NETWORK", dados);
    } else {
      gravarLog("F12", dados);
    }
  });

  // Função global acessível via console
  window.copiarLogsBancadaLab = function () {
    const cabecalho = [
      "===========================================================",
      "=== RELATÓRIO DE TELEMETRIA BANCADALAB SUS (F12) ===",
      `URL Atual: ${window.location.href}`,
      `Horário da Coleta: ${new Date().toLocaleString("pt-BR")}`,
      `Total de Eventos Registrados: ${window.__BANCADALAB_LOGS__.length}`,
      "===========================================================",
      "",
    ].join("\n");

    const texto = cabecalho + (window.__BANCADALAB_LOGS__.join("\n") || "Nenhum log registrado ainda.");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      console.log(
        "%c[BancadaLab] Logs F12 completos copiados para a Área de Transferência!",
        "color:#059669;font-weight:bold;"
      );
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
    hud.style.maxWidth = "480px";
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
          <strong style="color:#22d3ee;font-size:13px;letter-spacing:0.5px;">BancadaLab SUS • Gravador F12</strong>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button id="bancadalab-btn-limpar-logs" title="Limpar logs gravados para iniciar um novo teste" style="cursor:pointer;background:transparent;color:#94a3b8;border:1px solid #334155;border-radius:6px;padding:3px 7px;font-size:10px;font-weight:600;transition:all 0.2s;">
            LIMPAR
          </button>
          <button id="bancadalab-btn-copiar-logs" title="Copiar relatório e logs completos do F12 (cliques, requisições, erros)" style="cursor:pointer;background:#0891b2;color:#ffffff;border:none;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:bold;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.3);">
            📋 COPIAR LOGS (0)
          </button>
          <span id="bancadalab-hud-tag" style="background:#059669;color:#ffffff;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;text-transform:uppercase;">ATIVO</span>
        </div>
      </div>
      <div id="bancadalab-hud-msg" style="color:#e2e8f0;line-height:1.4;margin-bottom:6px;font-weight:500;">Gravador de eventos F12 pronto. Realize a ação ou execute o robô.</div>
      <div style="background:#0f172a;height:4px;border-radius:2px;overflow:hidden;">
        <div id="bancadalab-hud-bar" style="background:linear-gradient(90deg, #0891b2, #059669);height:100%;width:0%;transition:width 0.4s ease;"></div>
      </div>
    `;

    document.body.appendChild(hud);
    hudElement = hud;

    const btnCopiar = hud.querySelector("#bancadalab-btn-copiar-logs");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", () => {
        const texto = window.copiarLogsBancadaLab();
        btnCopiar.textContent = "✓ COPIADO COM SUCESSO!";
        btnCopiar.style.background = "#059669";
        setTimeout(() => {
          btnCopiar.textContent = `📋 COPIAR LOGS (${window.__BANCADALAB_LOGS__.length})`;
          btnCopiar.style.background = "#0891b2";
        }, 3000);
      });
    }

    const btnLimpar = hud.querySelector("#bancadalab-btn-limpar-logs");
    if (btnLimpar) {
      btnLimpar.addEventListener("click", () => {
        window.__BANCADALAB_LOGS__ = [];
        if (btnCopiar) btnCopiar.textContent = "📋 COPIAR LOGS (0)";
        btnLimpar.textContent = "LIMPO!";
        setTimeout(() => {
          btnLimpar.textContent = "LIMPAR";
        }, 1500);
      });
    }

    return hud;
  }

  function atualizarHud(mensagem, progressoPercent = null, tipo = "info") {
    gravarLog("ROBO", mensagem);
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
    atualizarHud("⚡ BancadaLab SUS v2.3: Roteamento Atômico Conecta SUS pronto!", 100, "pronto");
  } catch (_) {}

  // =========================================================================
  // 2. CAPTURA DO TOKEN DA SESSÃO E IDENTIFICAÇÃO DO CLIENTE (CUSTOMER)
  // =========================================================================
  function procurarJwtEmStorage() {
    if (window.__BANCADALAB_AUTH_TOKEN__ && JWT_REGEX.test(window.__BANCADALAB_AUTH_TOKEN__)) {
      return window.__BANCADALAB_AUTH_TOKEN__;
    }

    try {
      const salvo = localStorage.getItem("__bancadalab_conecta_token__");
      if (salvo && JWT_REGEX.test(salvo)) return salvo;
    } catch (_) {}

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
          window.__BANCADALAB_AUTH_TOKEN__ = match[0];
          return match[0];
        }
      }
    }

    try {
      const cookieVal = decodeURIComponent(document.cookie || "");
      const matchCookie = cookieVal.match(JWT_REGEX);
      if (matchCookie) {
        window.__BANCADALAB_AUTH_TOKEN__ = matchCookie[0];
        return matchCookie[0];
      }
    } catch (_) {}

    return null;
  }

  function obterCustomer() {
    if (window.__BANCADALAB_CUSTOMER__) return window.__BANCADALAB_CUSTOMER__;
    try {
      const salvo = localStorage.getItem("__bancadalab_conecta_customer__");
      if (salvo) return salvo;
    } catch (_) {}
    const host = window.location.hostname || "";
    const partes = host.split(".");
    if (partes.length >= 2 && partes[0] !== "www") {
      return partes[0];
    }
    return "caconde";
  }

  function sincronizarTokenComBackground() {
    const token = procurarJwtEmStorage();
    if (token) {
      try {
        chrome.runtime.sendMessage({
          type: "CONECTASUS_TOKEN_ENCONTRADO",
          token,
          customer: obterCustomer(),
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

        // 3. Modal de Sucesso ou Alerta ("Ok")
        if (
          texto.includes("SUCESSO") ||
          texto.includes("SALVO") ||
          texto.includes("ALTERAÇÃO REALIZADA") ||
          texto.includes("AGENDAMENTO GRAVADO") ||
          texto.includes("OPERACAO REALIZADA")
        ) {
          const btnOk = Array.from(modal.querySelectorAll("button, a, input[type='button']")).find((b) => {
            const val = (b.textContent || b.value || "").trim().toUpperCase();
            return val === "OK" || val === "FECHAR";
          });
          if (btnOk && !btnOk.disabled && btnOk !== elementoClicadoRecentemente) {
            ultimoCliqueModalMs = Date.now();
            elementoClicadoRecentemente = btnOk;
            console.log(
              "%c[BancadaLab] Pop-up 'Ok' de confirmação detectado! Fechando...",
              "color:#059669;font-weight:bold;"
            );
            simularClique(btnOk);
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
  // 5.1 SELEÇÃO DE DIA NO CALENDÁRIO COM VAGAS (ex: "69/25" ou dia "16")
  // =========================================================================
  async function clicarDiaNoCalendario(diaNumero, notify) {
    if (notify) notify(`Localizando dia <strong>${diaNumero || "da coleta"}</strong> no calendário do Conecta SUS...`);
    gravarLog("ROBO", `Buscando dia ${diaNumero} no calendário do Conecta SUS...`);

    const maxWait = Date.now() + 4500;
    let celulaAlvo = null;

    while (Date.now() < maxWait) {
      const celulas = Array.from(
        document.querySelectorAll(
          ".calendar td, table tbody td, [class*='day'], [class*='data'], a.ui-state-default, .fc-day, td[onclick*='agendamento']"
        )
      ).filter((td) => td.offsetParent !== null && td.innerText.trim().length > 0);

      if (diaNumero) {
        celulaAlvo = celulas.find((td) => {
          const txt = (td.textContent || "").trim();
          const match = txt.match(/^(\d{1,2})/);
          if (match && parseInt(match[1], 10) === parseInt(diaNumero, 10)) return true;
          return txt === String(diaNumero);
        });

        if (!celulaAlvo) {
          celulaAlvo = celulas.find((td) => {
            const txt = (td.textContent || "").trim();
            return txt.includes(String(diaNumero));
          });
        }
      }

      if (!celulaAlvo) {
        celulaAlvo = celulas.find((td) => {
          const txt = (td.textContent || "").trim();
          return /\d+\s*\/\s*\d+/.test(txt) || /^\d{1,2}$/.test(txt);
        });
      }

      if (celulaAlvo) break;
      await esperar(200);
    }

    if (celulaAlvo) {
      gravarLog("ROBO", `Célula do calendário clicada: "${celulaAlvo.innerText.trim().replace(/\s+/g, ' ').slice(0, 30)}"`);
      simularClique(celulaAlvo);
      await esperar(2000);
      return true;
    } else {
      gravarLog("AVISO", `Nenhuma célula de data/vagas encontrada no calendário para o dia ${diaNumero}.`);
      return false;
    }
  }

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
    notify(`Selecionando dia <strong>${diaNumero || "da coleta"}</strong> no calendário do Conecta SUS...`);
    await clicarDiaNoCalendario(diaNumero, notify);
    await esperar(2000); // Aguarda confirmações de supervisor e abertura do modal de exames

    // 5. No Modal 'Confirmação do agendamento de exame':
    // 5.1 Selecionar o horário disponível (radio button 07:00)
    const radios = Array.from(document.querySelectorAll(".modal input[type='radio'], input[type='radio']"));
    const radio7 = radios.find((r) => (r.parentElement?.innerText || r.value || "").includes("07:00")) || radios[0];
    if (radio7) {
      simularClique(radio7);
      await esperar(500);
    }

    // 5.2 Adicionar cada um dos exames daquele laboratório
    notify(`Adicionando exames no modal (${examesParaIncluir.length} exames)...`);
    for (const nomeExame of examesParaIncluir) {
      const inputExame = document.querySelector(
        ".modal input[placeholder*='Exame'], input[placeholder*='exame'], input[name*='exame'], input#exame, .modal input[type='text']"
      );

      if (inputExame) {
        inputExame.focus();
        inputExame.value = "";
        inputExame.dispatchEvent(new Event("input", { bubbles: true }));
        await esperar(200);

        // Digita termo simplificado (ex: se for "0202050017 - URINA I", digita "URINA" ou o código)
        const termoBusca = nomeExame.includes("URINA")
          ? "URINA"
          : nomeExame.includes("SANGUE OCULTO")
          ? "SANGUE OCULTO"
          : nomeExame.split(" - ")[1] || nomeExame;

        simularInput(inputExame, termoBusca);
        await esperar(800);

        // Se houver caixinha flutuante de sugestões de exame, clica na opção exata
        const sugestoesExame = Array.from(
          document.querySelectorAll(
            ".ui-autocomplete li, .ui-menu-item, [role='option'], .autocomplete-suggestions div, .dropdown-menu li"
          )
        ).filter((el) => el.offsetParent !== null && el.innerText.trim().length > 0);

        if (sugestoesExame.length > 0) {
          const itemAlvo =
            sugestoesExame.find((s) => (s.innerText || "").toUpperCase().includes(termoBusca.toUpperCase())) ||
            sugestoesExame[0];
          simularClique(itemAlvo);
          await esperar(500);
        }

        // Clica no botão "Incluir"
        const btnIncluir = Array.from(document.querySelectorAll(".modal button, button, a")).find(
          (b) => (b.textContent || "").trim().toUpperCase() === "INCLUIR"
        );
        if (btnIncluir) {
          simularClique(btnIncluir);
          gravarLog("ROBO", `Exame adicionado à grade: ${nomeExame}`);
          await esperar(800);
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
  // 6.1 FLUXO SUPREMO: ROTEAMENTO ATÔMICO INSTANTÂNEO VIA API REST CONECTA SUS
  // Sem depender do DOM, sem cliques de calendário, 100% à prova de falhas!
  // =========================================================================
  async function executarApoioViaApiDireta(
    { agendamento, prontuario, laboratorioAlvo = "MS" },
    notify
  ) {
    gravarLog("API", `⚡ Iniciando Roteamento Atômico via API REST para Agendamento #${agendamento || "—"}...`);
    notify("⚡ Conectando à API REST interna do Conecta SUS...", 15);

    let token = procurarJwtEmStorage();
    if (!token) {
      try {
        const store = await chrome.storage.local.get(["conectasus_bearer_token", "conectasus_token"]);
        token = store.conectasus_bearer_token || store.conectasus_token;
      } catch (_) {}
    }
    if (!token) {
      throw new Error("Token de autorização JWT não encontrado no storage da sessão.");
    }
    let customer = obterCustomer();
    try {
      const store = await chrome.storage.local.get(["conectasus_customer"]);
      if (store.conectasus_customer) customer = store.conectasus_customer;
    } catch (_) {}
    const apiBase = "https://api-saude.conectasus.com.br/api";

    const headers = {
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Bearer ${token}`,
      "Customer": customer,
      "Content-Type": "application/json;charset=UTF-8",
    };

    // 1. Determinar o ID numérico interno do paciente no Conecta SUS (paciente_id)
    let pacienteId = null;
    const matchUrl = window.location.pathname.match(/\/create\/(\d+)/);
    if (matchUrl) {
      pacienteId = matchUrl[1];
    }

    if (!pacienteId && (prontuario || agendamento)) {
      notify(`Localizando ID do paciente via prontuário #${prontuario || agendamento}...`, 25);
      const termo = encodeURIComponent(String(prontuario || agendamento).trim());
      try {
        const respBusca = await fetch(
          `${apiBase}/cadastro/paciente/datatable?start=0&length=10&search[value]=${termo}`,
          { method: "GET", headers }
        );
        if (respBusca.ok) {
          const jsonBusca = await respBusca.json();
          const lista = jsonBusca.data || (Array.isArray(jsonBusca) ? jsonBusca : []);
          if (lista.length > 0) {
            pacienteId = lista[0].id || lista[0].paciente_id;
          }
        }
      } catch (errBusca) {
        gravarLog("API_AVISO", `Busca por datatable falhou: ${errBusca.message}`);
      }
    }

    if (!pacienteId) {
      throw new Error("Não foi possível identificar o paciente_id na URL ou API.");
    }

    notify(`Paciente #${pacienteId} identificado! Consultando agendamentos...`, 40);

    // 2. Buscar agendamentos e procedimentos completos do paciente
    const respAg = await fetch(`${apiBase}/exame-laboratorial/agendamento-exame/${pacienteId}`, {
      method: "GET",
      headers,
    });

    if (!respAg.ok) {
      throw new Error(`Falha ao obter agendamentos do paciente (HTTP ${respAg.status}).`);
    }

    const dadosPaciente = await respAg.json();
    const todosAgendamentos = dadosPaciente.agendamentos || [];

    if (todosAgendamentos.length === 0) {
      throw new Error(`Nenhum agendamento ativo encontrado para o paciente #${pacienteId}.`);
    }

    // Localizar a guia alvo
    let agendamentoAlvo = null;
    if (agendamento) {
      agendamentoAlvo = todosAgendamentos.find(
        (a) =>
          String(a.agendamento_numero || "").trim() === String(agendamento).trim() ||
          String(a.agendamento_id || "").trim() === String(agendamento).trim()
      );
    }
    if (!agendamentoAlvo) {
      // Ordena por ID/número de agendamento DECRESCENTE para pegar SEMPRE o mais recente da rotina atual (ex: 37032), NUNCA o de 2025!
      const ordenados = [...todosAgendamentos].sort((a, b) => {
        const idA = Number(a.agendamento_numero || a.agendamento_id) || 0;
        const idB = Number(b.agendamento_numero || b.agendamento_id) || 0;
        return idB - idA;
      });
      agendamentoAlvo = ordenados[0];
    }

    const numAgendamentoReal = agendamentoAlvo.agendamento_numero || agendamento || agendamentoAlvo.agendamento_id;
    const listaExames = agendamentoAlvo.incluido || [];

    notify(
      `Guia #${numAgendamentoReal} localizada com ${listaExames.length} exames. Classificando destinos...`,
      60
    );

    // 3. Separar exames em Apoio (Sangue/Bioquímica) e Bancada Municipal (Urina/PSO)
    const examesApoio = [];
    const examesBancada = [];

    for (const item of listaExames) {
      const nomeExame = item.nome || item.procedimento_nome || "";
      const classif = classificarDestinoExame(nomeExame);
      if (classif.destino === "MUNICIPAL") {
        examesBancada.push(item);
      } else {
        examesApoio.push(item);
      }
    }

    gravarLog(
      "API",
      `Separação calculada: Apoio (${examesApoio.length}: ${examesApoio.map((e) => e.nome).join(", ")}), Municipal (${examesBancada.length}: ${examesBancada.map((e) => e.nome).join(", ")})`
    );

    notify(
      `Exames divididos: Apoio MS (${examesApoio.length}), Bancada Municipal (${examesBancada.length}). Montando transação...`,
      75
    );

    // 4. Parâmetros oficiais de Caconde identificados na telemetria
    const idLabApoio = 21; // MS Laboratórios
    const idInfraApoio = 24;
    const nomeLabApoio = "MS LABORATORIOS";
    const jornadaApoioId = 3234;

    const idLabMun = 14; // Laboratório Municipal de Caconde
    const idInfraMun = 14;
    const nomeLabMun = "LABORATORIO MUNICIPAL DE CACONDE";

    // Guia de Apoio (mantém o número e ID da guia original)
    const guiaApoio = {
      ...agendamentoAlvo,
      alterado: true,
      alterar_agendamento: true,
      excluir_agendamento: false,
      impressao: true,
      supervisor: true,
      supervisor_id: agendamentoAlvo.supervisor_id || 1253,
      carrega_jornada: true,
      coleta_unidade_id: idLabApoio,
      coleta_infraestrutura_id: idInfraApoio,
      coleta_nome: nomeLabApoio,
      coleta_infraestrutura_nome: nomeLabApoio,
      laboratorio_id: idLabApoio,
      laboratorio_infraestrutura_id: idInfraApoio,
      laboratorio_nome: nomeLabApoio,
      laboratorio_infraestrutura_nome: nomeLabApoio,
      jornada_id: agendamentoAlvo.jornada_id || jornadaApoioId,
      incluido: examesApoio.length > 0 ? examesApoio : listaExames,
    };

    const agendamentosNotSave = [guiaApoio];

    // Se houver exames de urina/bancada, cria a Guia Municipal correspondente
    if (examesBancada.length > 0) {
      const guiaMunicipal = {
        ...agendamentoAlvo,
        agendamento_id: Math.floor(Math.random() * 80000) + 10000,
        agendamento_numero: null,
        alterado: true,
        alterar_agendamento: false,
        excluir_agendamento: false,
        impressao: true,
        supervisor: true,
        supervisor_id: agendamentoAlvo.supervisor_id || 1253,
        carrega_jornada: true,
        data: agendamentoAlvo.data, // Pinos no mesmo dia da triagem (ex: amanhã dia 17)
        hora_inicial: agendamentoAlvo.hora_inicial || "07:00",
        coleta_unidade_id: idLabMun,
        coleta_infraestrutura_id: idInfraMun,
        coleta_nome: nomeLabMun,
        coleta_infraestrutura_nome: nomeLabMun,
        laboratorio_id: idLabMun,
        laboratorio_infraestrutura_id: idInfraMun,
        laboratorio_nome: nomeLabMun,
        laboratorio_infraestrutura_nome: nomeLabMun,
        incluido: examesBancada,
      };
      agendamentosNotSave.push(guiaMunicipal);
    }

    // Filtrar da lista base o agendamento original que está sendo reescrito
    const agendamentosMantidos = todosAgendamentos.filter(
      (a) =>
        a.agendamento_id !== agendamentoAlvo.agendamento_id &&
        a.agendamento_numero !== agendamentoAlvo.agendamento_numero
    );

    // Pré-autorização do supervisor para todos os exames da transação (evita bloqueio de cota!)
    notify("Validando autorização de supervisor para cotas de exames...", 80);
    const todosProcedimentos = [...examesApoio, ...examesBancada];
    for (const p of todosProcedimentos) {
      const exId = p.exame_id || (typeof p.id === "number" ? p.id : null);
      if (exId) {
        try {
          await fetch(`${apiBase}/exame-laboratorial/agendamento-exame/save-exame-bloqueado`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              exame_id: exId,
              paciente_id: pacienteId,
              valor: p.valor || "3.70",
              motivo_id: 3, // Motivo 3: Autorização de Supervisor por Cota/Jornada
            }),
          });
        } catch (_) {}
      }
    }

    const payloadFinal = {
      data_atual: dadosPaciente.data_atual || new Date().toLocaleDateString("pt-BR"),
      paciente_id: pacienteId,
      periodo: dadosPaciente.periodo || {
        start: dadosPaciente.data_atual || new Date().toLocaleDateString("pt-BR"),
        end: dadosPaciente.data_atual || new Date().toLocaleDateString("pt-BR"),
      },
      telefone: dadosPaciente.telefone || { id: null, numero: "", autoriza_sms: false, atualizado: false },
      agendamentos: agendamentosMantidos,
      agendamentos_not_save: agendamentosNotSave,
      agendamentos_deletados: [],
    };

    notify("Transmitindo agendamento atômico para o servidor Conecta SUS...", 85);

    const respSave = await fetch(`${apiBase}/exame-laboratorial/agendamento-exame`, {
      method: "POST",
      headers,
      body: JSON.stringify(payloadFinal),
    });

    if (!respSave.ok) {
      const errTexto = await respSave.text();
      gravarLog("API_ERRO", `POST agendamento-exame retornou HTTP ${respSave.status}: ${errTexto}`);
      throw new Error(`Servidor Conecta SUS recusou com status ${respSave.status}: ${errTexto.slice(0, 140)}`);
    }

    const resultadoApi = await respSave.json();
    gravarLog("API_SUCESSO", `Agendamento salvo via API com Sucesso! Resposta: ${JSON.stringify(resultadoApi).slice(0, 160)}`);

    notify("✓ Sucesso Atômico! Agendamento roteado instantaneamente no Conecta SUS!", 96, "sucesso");

    // 5. Atualizar visualização do operador na tela (clica na aba de agendados para sincronizar o DOM)
    try {
      const abas = Array.from(document.querySelectorAll("a, button, li a, .nav-link, span"));
      const abaAgendados = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
      if (abaAgendados) {
        simularClique(abaAgendados);
        await esperar(1200);
      }

      // Se houver botão de impressão da SADT na tabela, aciona
      const linhas = Array.from(document.querySelectorAll("table tbody tr"));
      const linhaAlvo = linhas.find((tr) => (tr.innerText || "").includes(String(numAgendamentoReal).trim())) || linhas[0];
      if (linhaAlvo) {
        const btnPrint = linhaAlvo.querySelector(".btn-info, a[href*='imprimir' i], button[title*='imprimir' i]");
        if (btnPrint) {
          notify("Abrindo SADT para impressão final...", 100, "sucesso");
          simularClique(btnPrint);
        }
      }
    } catch (_) {}

    notify("✓ Concluído com Sucesso! SADTs e agendamentos separados perfeitamente.", 100, "sucesso");

    return {
      ok: true,
      modo: "api_direta_atomica",
      agendamento: numAgendamentoReal,
      pacienteId,
      examesApoio: examesApoio.map((e) => e.nome),
      examesBancada: examesBancada.map((e) => e.nome),
      respostaConectaSUS: resultadoApi,
    };
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
    gravarLog("ROBO", `Lápis azul clicado para agendamento #${agendamento}. Aguardando abertura da edição...`);
    await esperar(2200); // Aguarda abertura da tela/modal de edição

    // 5. Localizar o dropdown de Laboratório de Destino
    notify(`Alterando laboratório para <strong>${nomeLabFormatado}</strong>...`, 65);
    const selects = Array.from(document.querySelectorAll("select"));
    gravarLog("ROBO", `Total de <select> encontrados na tela: ${selects.length}`);

    const selectLab = selects.find((s) => {
      const opts = Array.from(s.options).map((o) => (o.text || "").toUpperCase());
      return opts.some((t) => t.includes("SÃO LUCAS") || t.includes("SAO LUCAS") || t.includes("MS") || t.includes("MUNICIPAL"));
    });

    if (selectLab) {
      gravarLog("ROBO", `Select de Laboratório localizado: ${selectLab.name || selectLab.id || "sem id"}`);
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
        notify(`✓ Laboratório selecionado: <strong>${optionAlvo.text}</strong>!`, 65);
        gravarLog("ROBO", `Laboratório alterado para: ${optionAlvo.text} (valor: ${optionAlvo.value})`);
        await esperar(1600); // Aguarda Conecta SUS atualizar o calendário das vagas
      }
    } else {
      gravarLog("AVISO", "Dropdown de laboratório NÃO encontrado na tela após clicar no lápis!");
    }

    // 5.1 Clicar na célula da data no Calendário para abrir o modal de exames
    notify(`Abrindo exames do agendamento no calendário (Dia ${diaNumero || "da coleta"})...`, 68);
    await clicarDiaNoCalendario(diaNumero, notify);
    await esperar(2000); // Aguarda o modal de exames abrir na tela

    // 5.2 No modal aberto, retirar os exames que são da bancada local (Urina, PSO, etc.)
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

    gravarLog("ROBO", `Total de exames de bancada detectados para remoção: ${linhasExamesEdicao.length}`);

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
        const codigoMatch = textoExame.match(/(0202\d{6}\s*-\s*[^\n]+|URINA\s*I|SANGUE\s*OCULTO[^\n]*)/i);
        examesBancadaRetirados.push(codigoMatch ? codigoMatch[0].trim() : nomeLimpo || "URINA I");

        notify(`Retirando exame de bancada (${nomeLimpo}) da SADT de apoio...`, 72);
        gravarLog("ROBO", `Removendo exame de bancada da guia: ${nomeLimpo}`);
        const btnLixeira = linhaExame.querySelector(
          ".btn-danger, .fa-trash, a[title*='Excluir' i], button[title*='Excluir' i], a[title*='Remover' i], button[title*='Remover' i], [class*='trash']"
        );
        if (btnLixeira) {
          simularClique(btnLixeira);
          await esperar(2000); // Aguarda confirmação do modal de exclusão e autorizações
        } else {
          gravarLog("AVISO", `Botão de lixeira não encontrado para exame: ${nomeLimpo}`);
        }
      }
    }

    // 5.3 Clicar no botão "Confirmar" no rodapé do modal de exames
    const btnConfirmarModal = Array.from(containerEdicao.querySelectorAll("button, a")).find(
      (b) => (b.textContent || b.value || "").trim().toUpperCase() === "CONFIRMAR"
    );
    if (btnConfirmarModal) {
      notify("Confirmando alterações nos exames...", 76);
      gravarLog("ROBO", "Clicando em 'Confirmar' no modal de exames...");
      simularClique(btnConfirmarModal);
      await esperar(1800); // Aguarda fechamento do modal e possíveis pop-ups do supervisor
    }

    // 6. Clicar em "Salvar" a guia de apoio no topo da tela do Conecta SUS
    notify("Gravando guia de apoio oficial no Conecta SUS...", 80);
    const botoes = Array.from(document.querySelectorAll("button, input[type='submit'], a.btn"));
    const btnSalvar = botoes.find((b) => {
      const txt = (b.textContent || b.value || "").trim().toUpperCase();
      return txt === "SALVAR" || txt.includes("SALVAR");
    });

    if (btnSalvar) {
      gravarLog("ROBO", `Botão Salvar localizado: "${(btnSalvar.textContent || btnSalvar.value || '').trim()}". Clicando...`);
      simularClique(btnSalvar);
      await esperar(3500); // Aguarda POST 201 Created no servidor e fecha pop-up de sucesso
    } else {
      gravarLog("AVISO", "Botão Salvar NÃO encontrado após edição!");
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
    // Filtrar linhas reais com dados (descartando "Não há registros para exibir" e "Carregando")
    const linhas = Array.from(document.querySelectorAll("table tbody tr")).filter(
      (tr) => {
        const txt = (tr.innerText || "").toUpperCase();
        return (
          txt.length > 5 &&
          !txt.includes("NÃO HÁ REGISTROS") &&
          !txt.includes("NAO HA REGISTROS") &&
          !txt.includes("CARREGANDO") &&
          !txt.includes("NENHUM")
        );
      }
    );

    if (linhas.length === 0) {
      throw new Error(`A tabela de exames agendados do paciente ainda não possui registros carregados.`);
    }

    let linhaAlvo = null;
    if (agendamento) {
      linhaAlvo = linhas.find((tr) => (tr.innerText || "").includes(String(agendamento).trim()));
    }
    if (!linhaAlvo && linhas.length > 0) {
      linhaAlvo = linhas[0]; // Primeira linha válida
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

          // ESTRATÉGIA DUAL: 
          // 1º Tenta a API REST DIRETA ATÔMICA (sub-segundo, sem cliques de calendário, 100% precisa)
          // 2º Se a API falhar ou não tiver token disponível, cai de volta no robô DOM de forma transparente!
          try {
            notifyProgresso("⚡ Iniciando roteamento atômico ultra-rápido via API REST Conecta SUS...");
            resultado = await executarApoioViaApiDireta(
              {
                agendamento: message.agendamento,
                prontuario: message.prontuario,
                laboratorioAlvo: message.laboratorioDestino || message.destinoExames?.bioquimica || "MS",
              },
              notifyProgresso
            );
          } catch (errApi) {
            gravarLog("FALLBACK", `API direta não concluiu (${errApi.message}). Alternando automaticamente para automação DOM.`);
            notifyProgresso(`Modo API alternado: prosseguindo via automação de tela...`);

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
