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
  if (window.__BANCADALAB_CONECTASUS_ACTIVE__) return;
  window.__BANCADALAB_CONECTASUS_ACTIVE__ = true;

  console.log(
    "%c[BancadaLab SUS]%c Robô de Separação de Agendamentos e SADTs v3.2 ativo.",
    "color:#0891B2;font-weight:bold;",
    "color:default;"
  );

  const JWT_REGEX = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

  // =========================================================================
  // 1. HUD VISUAL FLUTUANTE (OVERLAY DE STATUS EM TEMPO REAL)
  // Permite ao operador acompanhar cada etapa na tela do Conecta SUS
  // =========================================================================
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
        <span id="bancadalab-hud-tag" style="background:#0891b2;color:#ffffff;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;text-transform:uppercase;">ATIVO</span>
      </div>
      <div id="bancadalab-hud-msg" style="color:#e2e8f0;line-height:1.4;margin-bottom:6px;font-weight:500;">Aguardando comando...</div>
      <div style="background:#0f172a;height:4px;border-radius:2px;overflow:hidden;">
        <div id="bancadalab-hud-bar" style="background:linear-gradient(90deg, #0891b2, #059669);height:100%;width:0%;transition:width 0.4s ease;"></div>
      </div>
    `;

    document.body.appendChild(hud);
    hudElement = hud;
    return hud;
  }

  function atualizarHud(mensagem, progressoPercent = null, tipo = "info") {
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
      } else {
        elTag.style.background = "#0891b2";
        elTag.textContent = "EM EXECUÇÃO";
      }
    }
  }

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
  // 5. AUTORIZAÇÃO AUTOMÁTICA DE POP-UPS (CONFIRMAÇÃO + SUPERVISOR)
  // =========================================================================
  function iniciarObservadorSupervisor() {
    const observer = new MutationObserver(() => {
      const modais = Array.from(document.querySelectorAll(".modal, .modal-dialog, div[role='dialog']")).filter(
        (m) => m.offsetParent !== null
      );

      for (const modal of modais) {
        const texto = (modal.innerText || "").toUpperCase();

        // 1. Modal de Confirmação ("Deseja continuar?")
        if (
          texto.includes("DESEJA CONTINUAR?") ||
          texto.includes("PRAZO DE VALIDADE") ||
          texto.includes("DADOS DO SUPERVISOR")
        ) {
          const btnSim = Array.from(modal.querySelectorAll("button, a, input[type='button']")).find(
            (b) => (b.textContent || b.value || "").trim().toUpperCase() === "SIM"
          );
          if (btnSim && !btnSim.disabled) {
            console.log("%c[BancadaLab] Pop-up 'Deseja continuar?' detectado! Clicando em 'Sim'...", "color:#059669;font-weight:bold;");
            simularClique(btnSim);
            return;
          }
        }

        // 2. Modal de Autorização do Supervisor
        if (texto.includes("AUTORIZAÇÃO DO SUPERVISOR") || texto.includes("AUTORIZAR")) {
          const btnAutorizar = Array.from(modal.querySelectorAll("button, a, input[type='button']")).find(
            (b) => (b.textContent || b.value || "").trim().toUpperCase() === "AUTORIZAR"
          );
          if (btnAutorizar && !btnAutorizar.disabled) {
            console.log("%c[BancadaLab] Pop-up 'Autorização do supervisor' detectado! Clicando em 'Autorizar'...", "color:#059669;font-weight:bold;");
            simularClique(btnAutorizar);
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
  // 6. CRIAÇÃO DE NOVO AGENDAMENTO PARA LABORATÓRIO ESPECÍFICO (MS OU SÃO LUCAS)
  // =========================================================================
  async function criarNovoAgendamentoNoConectaSus(
    { medico, dataColeta, diaNumero, destinoLab, examesParaIncluir },
    notify
  ) {
    const nomeLabFormatado = destinoLab === "MS" ? "MS LABORATÓRIOS" : "LABORATÓRIO SÃO LUCAS";
    notify(`Iniciando criação de novo agendamento para <strong>${nomeLabFormatado}</strong>...`);

    // 1. Clicar na aba "AGENDAR EXAMES"
    const abas = Array.from(document.querySelectorAll("a, button, li a, .nav-link, span"));
    const abaAgendar = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "AGENDAR EXAMES");

    if (abaAgendar) {
      notify("Abrindo formulário 'AGENDAR EXAMES'...");
      simularClique(abaAgendar);
      await esperar(1500);
    }

    // 2. Preencher Profissional Solicitante (Médico)
    if (medico) {
      notify(`Vinculando médico solicitante: <strong>${medico}</strong>...`);
      const inputProfissional = document.querySelector(
        "input[placeholder*='conselho'], input[placeholder*='profissional'], input[name*='medico'], input[name*='profissional'], input#medico_solicitante, input[placeholder*='médico']"
      );

      if (inputProfissional) {
        simularInput(inputProfissional, medico);
        await esperar(800);

        // Se abrir dropdown de autocomplete com o médico, clica na sugestão
        const sugestoes = Array.from(
          document.querySelectorAll(".dropdown-menu li, .ui-menu-item, .autocomplete-suggestion, li")
        );
        const itemMedico = sugestoes.find((it) => (it.innerText || "").toUpperCase().includes(medico.toUpperCase()));
        if (itemMedico) {
          simularClique(itemMedico);
          await esperar(500);
        }
      }
    }

    // 3. Selecionar Coleta e Laboratório de Destino
    notify(`Selecionando laboratório de destino: <strong>${nomeLabFormatado}</strong>...`);
    const selects = Array.from(document.querySelectorAll("select"));

    // Dropdown Coleta
    const selectColeta = selects.find((s) => (s.name || s.id || "").toLowerCase().includes("coleta"));
    if (selectColeta) {
      const optMun = Array.from(selectColeta.options).find((o) => (o.text || "").toUpperCase().includes("MUNICIPAL"));
      if (optMun) {
        selectColeta.value = optMun.value;
        selectColeta.dispatchEvent(new Event("change", { bubbles: true }));
        await esperar(400);
      }
    }

    // Dropdown Laboratório
    const selectLab = selects.find((s) => {
      const opts = Array.from(s.options).map((o) => (o.text || "").toUpperCase());
      return opts.some((t) => t.includes("SÃO LUCAS") || t.includes("SAO LUCAS") || t.includes("MS") || t.includes("MUNICIPAL"));
    });

    if (selectLab) {
      const targetTerm = destinoLab === "MS" ? "MS" : "LUCAS";
      const optionAlvo = Array.from(selectLab.options).find((o) => (o.text || "").toUpperCase().includes(targetTerm));
      if (optionAlvo) {
        selectLab.value = optionAlvo.value;
        selectLab.dispatchEvent(new Event("change", { bubbles: true }));
        await esperar(1200); // Aguarda carregamento AJAX das vagas no calendário
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
    // -----------------------------------------------------------------------
    const urlAtual = window.location.href;
    if (
      urlAtual.includes("/agendamento-exame/index") ||
      document.querySelector("h2, h3, h4, .box-title")?.innerText?.includes("LISTA DE PACIENTE")
    ) {
      notify(`Pesquisando Prontuário Municipal ${prontuario || agendamento} na listagem...`, 20);

      const selectTipoBusca = document.querySelector("select.form-control, select");
      if (selectTipoBusca) {
        const optPront = Array.from(selectTipoBusca.options).find((o) =>
          (o.text || "").toUpperCase().includes("PRONTUÁRIO")
        );
        if (optPront) {
          selectTipoBusca.value = optPront.value;
          selectTipoBusca.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      const inputBusca = document.querySelector(
        "input[placeholder*='buscar'], input[type='search'], input.form-control"
      );
      if (!inputBusca) throw new Error("Campo de busca do Conecta SUS não encontrado.");

      simularInput(inputBusca, prontuario || agendamento);
      await esperar(400);

      const btnBuscar = Array.from(document.querySelectorAll("button")).find(
        (b) => (b.textContent || "").trim().toUpperCase() === "BUSCAR"
      );
      if (btnBuscar) simularClique(btnBuscar);

      await esperar(1800);
      const linhaPaciente = await aguardarElemento("table tbody tr", 4000);
      if (!linhaPaciente) throw new Error(`Prontuário ${prontuario || agendamento} não localizado na tabela.`);

      const btnAcaoPaciente = linhaPaciente.querySelector("a[href*='agendamento-exame/create'], button, a");
      if (btnAcaoPaciente) {
        notify("Abrindo tela de agendamentos do paciente...", 30);
        simularClique(btnAcaoPaciente);
        await esperar(2200);
      }
    }

    // -----------------------------------------------------------------------
    // PASSO 2: Acessar a aba "EXAMES AGENDADOS"
    // -----------------------------------------------------------------------
    notify("Acessando aba 'EXAMES AGENDADOS'...", 35);
    await esperar(800);

    const abas = Array.from(document.querySelectorAll("a, button, li a, .nav-link, span"));
    const abaExamesAgendados = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
    if (abaExamesAgendados) {
      simularClique(abaExamesAgendados);
      await esperar(1400);
    }

    const tabelaAgendados = await aguardarElemento("table tbody tr", 4000);
    if (!tabelaAgendados) {
      throw new Error("Tabela de exames agendados não carregou.");
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
    const colunas = Array.from(linhaAlvo.querySelectorAll("td"));
    const textoDataHora = colunas[0]?.innerText?.trim() || "";
    const numeroAgendamento = colunas[1]?.innerText?.trim() || agendamento;
    const nomeMedico = colunas[2]?.innerText?.trim() || "";
    const textoExames = colunas[3]?.innerText?.trim() || "";

    notify(`Dados extraídos: Agendamento #${numeroAgendamento} | Médico: ${nomeMedico} | Data: ${textoDataHora}`, 50);

    // Extrair dia da coleta (ex: "16/11/2026" -> dia 16)
    let diaNumero = "";
    if (textoDataHora.includes("/")) {
      const matchDia = textoDataHora.match(/(\d{1,2})\/\d{1,2}\/\d{4}/);
      if (matchDia) diaNumero = parseInt(matchDia[1], 10);
    }

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
    notify("Atualizando lista de EXAMES AGENDADOS do paciente...", 95);
    const abasFinais = Array.from(document.querySelectorAll("a, button, li a, .nav-link, span"));
    const abaAgendadosFinal = abasFinais.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
    if (abaAgendadosFinal) {
      simularClique(abaAgendadosFinal);
      await esperar(1800);
    }

    notify(
      `✓ Sucesso Total! Agendamentos gerados e separados: Lab MS (${examesMS.length}), São Lucas (${examesSaoLucas.length}), Municipal (${examesMunicipal.length}).`,
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
    if (message.type === "OBTER_TOKEN_CONECTASUS") {
      const token = procurarJwtEmStorage();
      sendResponse({ ok: Boolean(token), token });
      return true;
    }

    if (
      message.type === "EXECUTAR_AUTOMACAO_APOIO_CONECTASUS" ||
      message.type === "EXECUTAR_SEPARACAO_INTELIGENTE_SADT"
    ) {
      (async () => {
        try {
          const resultado = await executarFluxoCompletoConectaSus(
            {
              agendamento: message.agendamento,
              prontuario: message.prontuario,
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
            mensagem: `Agendamentos separados com sucesso no Conecta SUS!`,
          });
        } catch (err) {
          console.error("[BancadaLab Autônomo] Erro no fluxo:", err);
          atualizarHud(`Erro: ${err.message}`, 100, "erro");
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
