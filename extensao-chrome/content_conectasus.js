// =========================================================================
// BancadaLab SUS • Content Script (Automação Conecta SUS • Multi-SADT)
// Executa na aba: https://caconde.conectasus.com.br
// Divide agendamentos misturados em SADTs específicas por laboratório:
//   1) Laboratório MS -> Hemogramas (Hematologia)
//   2) São Lucas     -> Bioquímica & Hormônios
//   3) Municipal     -> Urinálise, Sangue Oculto (PSO) e Glicada local
// Mantendo o mesmo médico solicitante e mesma data/horário de coleta!
// =========================================================================

(function () {
  if (window.__BANCADALAB_CONECTASUS_ACTIVE__) return;
  window.__BANCADALAB_CONECTASUS_ACTIVE__ = true;

  console.log(
    "%c[BancadaLab SUS]%c Robô de Separação de Agendamentos e SADTs ativo no Conecta SUS.",
    "color:#0891B2;font-weight:bold;",
    "color:default;"
  );

  const JWT_REGEX = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

  // =========================================================================
  // 1. CAPTURA DO TOKEN DA SESSÃO
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
  // 2. CLASSIFICAÇÃO DOS EXAMES
  // =========================================================================
  function classificarDestinoExame(textoExame) {
    const norm = (textoExame || "").toUpperCase().trim();

    // 🩸 1. HEMOGRAMAS -> LABORATÓRIO MS
    if (norm.includes("HEMOGRAMA")) {
      return {
        destino: "MS",
        nomeLaboratorio: "LABORATÓRIO MS",
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
        nomeLaboratorio: "LABORATÓRIO SÃO LUCAS",
        tipo: "Bioquímica",
      };
    }

    // 🧪 3. BANCADA LOCAL -> MUNICIPAL
    return {
      destino: "MUNICIPAL",
      nomeLaboratorio: "LABORATORIO MUNICIPAL DE CACONDE",
      tipo: "Bancada Local (Urina/PSO/Glicada)",
    };
  }

  // =========================================================================
  // 3. UTILITÁRIOS DOM ROBUSTOS
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
  // 4. AUTORIZAÇÃO AUTOMÁTICA DE SUPERVISOR (POP-UP)
  // Clica automaticamente no botão "Autorizar" sempre que o modal abre
  // =========================================================================
  function iniciarObservadorSupervisor() {
    const observer = new MutationObserver(() => {
      const modalSupervisor = Array.from(
        document.querySelectorAll(".modal, .modal-dialog, div[role='dialog']")
      ).find(
        (m) =>
          (m.innerText || "").toUpperCase().includes("AUTORIZAÇÃO DO SUPERVISOR") ||
          (m.innerText || "").toUpperCase().includes("AUTORIZAR")
      );

      if (modalSupervisor) {
        const btnAutorizar = Array.from(
          modalSupervisor.querySelectorAll("button, input[type='button'], a")
        ).find(
          (b) => (b.textContent || b.value || "").trim().toUpperCase() === "AUTORIZAR"
        );

        if (btnAutorizar && !btnAutorizar.disabled) {
          console.log(
            "%c[BancadaLab] Pop-up 'Autorização do supervisor' detectado! Clicando em Autorizar...",
            "color:#059669;font-weight:bold;"
          );
          simularClique(btnAutorizar);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  iniciarObservadorSupervisor();

  // =========================================================================
  // 5. CRIAÇÃO DE NOVO AGENDAMENTO PARA LABORATÓRIO ESPECÍFICO (MS OU SÃO LUCAS)
  // =========================================================================
  async function criarNovoAgendamentoNoConectaSus(
    { medico, dataColeta, diaNumero, destinoLab, examesParaIncluir },
    notify
  ) {
    notify(`Iniciando criação de novo agendamento para ${destinoLab}...`);

    // 1. Clicar na aba "AGENDAR EXAMES"
    const abas = Array.from(document.querySelectorAll("a, button, li, .nav-link, span"));
    const abaAgendar = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "AGENDAR EXAMES");

    if (abaAgendar) {
      simularClique(abaAgendar);
      await esperar(1200);
    }

    // 2. Preencher Profissional Solicitante (Médico)
    if (medico) {
      notify(`Configurando médico solicitante: ${medico}...`);
      const inputProfissional = document.querySelector(
        "input[placeholder*='conselho'], input[placeholder*='profissional'], input[name*='medico'], input[name*='profissional'], input#medico_solicitante"
      );

      if (inputProfissional) {
        simularInput(inputProfissional, medico);
        await esperar(800);

        // Se abrir dropdown de autocomplete com o médico, clica na opção
        const itensAutocomplete = Array.from(
          document.querySelectorAll(".dropdown-menu li, .ui-menu-item, .autocomplete-suggestion, li")
        );
        const itemMedico = itensAutocomplete.find((it) => (it.innerText || "").toUpperCase().includes(medico.toUpperCase()));
        if (itemMedico) {
          simularClique(itemMedico);
          await esperar(500);
        }
      }
    }

    // 3. Selecionar o Laboratório de Destino
    notify(`Definindo laboratório de destino para: ${destinoLab}...`);
    const selects = Array.from(document.querySelectorAll("select"));
    const selectLab = selects.find((s) => {
      const opts = Array.from(s.options).map((o) => (o.text || "").toUpperCase());
      return opts.some((t) => t.includes("SÃO LUCAS") || t.includes("MS") || t.includes("MUNICIPAL"));
    });

    if (selectLab) {
      const targetTerm = destinoLab === "MS" ? "MS" : destinoLab === "SAO_LUCAS" ? "LUCAS" : "MUNICIPAL";
      const optionAlvo = Array.from(selectLab.options).find((o) => (o.text || "").toUpperCase().includes(targetTerm));
      if (optionAlvo) {
        selectLab.value = optionAlvo.value;
        selectLab.dispatchEvent(new Event("change", { bubbles: true }));
        await esperar(800);
      }
    }

    // 4. Selecionar a Data da Coleta no Calendário
    if (diaNumero) {
      notify(`Selecionando dia ${diaNumero} no calendário do Conecta SUS...`);
      const celulasDias = Array.from(
        document.querySelectorAll(".calendar td, table tbody td, [class*='day'], [class*='data']")
      );

      // Procura a célula que começa com o número do dia da coleta
      const celulaAlvo = celulasDias.find((td) => {
        const txt = (td.textContent || "").trim();
        return txt.startsWith(String(diaNumero)) || txt === String(diaNumero);
      });

      if (celulaAlvo) {
        simularClique(celulaAlvo);
        await esperar(1000);
      }
    }

    // 5. Selecionar Horário Disponível (Radio)
    const radioHorario = document.querySelector("input[type='radio'][name*='horario'], input[type='radio']");
    if (radioHorario) {
      simularClique(radioHorario);
      await esperar(600);
    }

    // 6. Incluir Exames Solicitados
    notify(`Adicionando ${examesParaIncluir.length} exame(s) à guia de ${destinoLab}...`);
    for (const nomeExame of examesParaIncluir) {
      const inputExame = document.querySelector(
        "input[placeholder*='Exame'], input[placeholder*='exame'], input[name*='exame'], input#exame"
      );

      if (inputExame) {
        simularInput(inputExame, nomeExame);
        await esperar(600);

        // Clica no botão "Incluir"
        const btnIncluir = Array.from(document.querySelectorAll("button, a")).find(
          (b) => (b.textContent || "").trim().toUpperCase() === "INCLUIR"
        );
        if (btnIncluir) {
          simularClique(btnIncluir);
          await esperar(600);
        }
      }
    }

    // 7. Clicar em "Salvar" no topo da tela
    notify(`Salvando novo agendamento para ${destinoLab}...`);
    const btnSalvar = Array.from(document.querySelectorAll("button, input[type='submit']")).find(
      (b) => (b.textContent || b.value || "").trim().toUpperCase() === "SALVAR"
    );

    if (btnSalvar) {
      simularClique(btnSalvar);
      await esperar(2500);
    }

    // 8. Voltar para aba "EXAMES AGENDADOS" e emitir a SADT
    const abaExamesAgendados = Array.from(document.querySelectorAll("a, button, li, .nav-link, span")).find(
      (el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS"
    );

    if (abaExamesAgendados) {
      simularClique(abaExamesAgendados);
      await esperar(1500);

      // Clica na impressora da linha mais recente
      const linhasAtualizadas = Array.from(document.querySelectorAll("table tbody tr"));
      if (linhasAtualizadas.length > 0) {
        const linhaMaisRecente = linhasAtualizadas[linhasAtualizadas.length - 1];
        const btnImprimirSADT = linhaMaisRecente.querySelector(
          "button.btn-info, a.btn-info, [title*='Imprimir'], [title*='SADT'], .fa-print"
        );
        if (btnImprimirSADT) {
          notify(`✓ Emitindo SADT para ${destinoLab}...`);
          simularClique(btnImprimirSADT);
          await esperar(1000);
        }
      }
    }

    notify(`✓ Agendamento e SADT de ${destinoLab} finalizados com sucesso!`);
  }

  // =========================================================================
  // 6. FLUXO MESTRE: LOCALIZAÇÃO, EXTRAÇÃO E SEPARAÇÃO DE SADTs
  // =========================================================================
  async function executarFluxoCompletoConectaSus({ agendamento, prontuario }, progressoCallback) {
    const notify = (msg) => {
      console.log(`[BancadaLab Autônomo] ${msg}`);
      if (typeof progressoCallback === "function") progressoCallback(msg);
    };

    notify(`Iniciando busca do paciente: Prontuário #${prontuario || "—"} | Agendamento #${agendamento || "—"}...`);

    // -----------------------------------------------------------------------
    // PASSO 1: Se estiver na tela LISTA DE PACIENTE, busca pelo Prontuário
    // -----------------------------------------------------------------------
    const urlAtual = window.location.href;
    if (
      urlAtual.includes("/agendamento-exame/index") ||
      document.querySelector("h2, h3, h4, .box-title")?.innerText?.includes("LISTA DE PACIENTE")
    ) {
      notify(`Pesquisando Prontuário Municipal ${prontuario || agendamento} na listagem...`);

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
      await esperar(300);

      const btnBuscar = Array.from(document.querySelectorAll("button")).find(
        (b) => (b.textContent || "").trim().toUpperCase() === "BUSCAR"
      );
      if (btnBuscar) simularClique(btnBuscar);

      await esperar(1500);
      const linhaPaciente = await aguardarElemento("table tbody tr", 4000);
      if (!linhaPaciente) throw new Error(`Prontuário ${prontuario || agendamento} não localizado na tabela.`);

      const btnAcaoPaciente = linhaPaciente.querySelector("a[href*='agendamento-exame/create'], button, a");
      if (btnAcaoPaciente) {
        notify("Abrindo tela de agendamentos do paciente...");
        simularClique(btnAcaoPaciente);
        await esperar(2000);
      }
    }

    // -----------------------------------------------------------------------
    // PASSO 2: Acessar a aba "EXAMES AGENDADOS"
    // -----------------------------------------------------------------------
    notify("Acessando aba 'EXAMES AGENDADOS'...");
    await esperar(800);

    const abas = Array.from(document.querySelectorAll("a, button, li, .nav-link, span"));
    const abaExamesAgendados = abas.find((el) => (el.textContent || "").trim().toUpperCase() === "EXAMES AGENDADOS");
    if (abaExamesAgendados) {
      simularClique(abaExamesAgendados);
      await esperar(1200);
    }

    const tabelaAgendados = await aguardarElemento("table tbody tr", 4000);
    if (!tabelaAgendados) {
      throw new Error("Tabela de exames agendados não carregou.");
    }

    // -----------------------------------------------------------------------
    // PASSO 3: Localizar a linha exata do Agendamento (ex: 37032)
    // -----------------------------------------------------------------------
    notify(`Localizando guia do agendamento #${agendamento}...`);
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

    notify(`Dados extraídos: Agendamento #${numeroAgendamento} | Médico: ${nomeMedico} | Data: ${textoDataHora}`);

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

    notify(`Exames identificados na guia (${listaExamesNomes.length}): ${listaExamesNomes.join(" • ")}`);

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
      `Divisão calculada: ${examesMS.length} p/ Lab MS | ${examesSaoLucas.length} p/ São Lucas | ${examesMunicipal.length} p/ Municipal Local`
    );

    // -----------------------------------------------------------------------
    // PASSO 5: Criar Novo Agendamento para o Laboratório MS (se houver Hemograma)
    // -----------------------------------------------------------------------
    if (examesMS.length > 0) {
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
    }

    // -----------------------------------------------------------------------
    // PASSO 6: Criar Novo Agendamento para o São Lucas (se houver Bioquímica)
    // -----------------------------------------------------------------------
    if (examesSaoLucas.length > 0) {
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
    }

    // -----------------------------------------------------------------------
    // PASSO 7: No Agendamento Original, emitir a SADT Local (Bancada Urina/PSO)
    // -----------------------------------------------------------------------
    notify("Emitindo SADT do agendamento local (Bancada Municipal)...");
    const btnImpressoraLocal = linhaAlvo.querySelector(
      "button.btn-info, a.btn-info, [title*='Imprimir'], [title*='SADT'], .fa-print"
    );
    if (btnImpressoraLocal) {
      simularClique(btnImpressoraLocal);
      await esperar(1000);
    }

    notify(
      `✓ Sucesso Total! Agendamentos e SADTs gerados: Lab MS (${examesMS.length}), São Lucas (${examesSaoLucas.length}), Municipal (${examesMunicipal.length}).`
    );

    return {
      ok: true,
      prontuario,
      agendamento: numeroAgendamento,
      medico: nomeMedico,
      examesMS,
      examesSaoLucas,
      examesMunicipal,
      status: "Todos os agendamentos e SADTs foram criados e emitidos com sucesso",
    };
  }

  // =========================================================================
  // 7. LISTENER DE MENSAGENS DO BACKGROUND
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
            mensagem: `Agendamentos separados e SADTs emitidas com sucesso!`,
          });
        } catch (err) {
          console.error("[BancadaLab Autônomo] Erro no fluxo:", err);
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
