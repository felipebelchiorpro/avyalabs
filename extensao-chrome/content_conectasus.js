// =========================================================================
// BancadaLab SUS • Content Script de Automação no Conecta SUS
// Executa na aba logada: https://caconde.conectasus.com.br
// Máquina de estados resiliente a reloads completos e SPAs (Angular/React/Vue)
// =========================================================================

(function () {
  if (window.__BANCADALAB_CONECTASUS_LOADED__) return;
  window.__BANCADALAB_CONECTASUS_LOADED__ = true;

  let executando = false;

  // Normaliza string removendo acentos, espaços extras e colocando em minúsculas
  function norm(txt) {
    return String(txt || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normPront(val) {
    const dig = String(val || "").replace(/\D/g, "");
    return dig ? dig.replace(/^0+/, "") || "0" : norm(val);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Dispara sequência completa de clique compatível com Angular, PrimeNG, React, Vue e HTML padrão
  function clicarForte(el) {
    if (!el) return false;
    try {
      el.scrollIntoView({ block: "center", behavior: "instant" });
    } catch (_) {}
    try {
      el.focus();
    } catch (_) {}
    const opts = { bubbles: true, cancelable: true, view: window };
    try { el.dispatchEvent(new PointerEvent("pointerdown", opts)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent("mousedown", opts)); } catch (_) {}
    try { el.dispatchEvent(new PointerEvent("pointerup", opts)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent("mouseup", opts)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent("click", opts)); } catch (_) {}
    try {
      if (typeof el.click === "function") el.click();
    } catch (_) {}
    return true;
  }

  // Dispara digitação compatível com React, Angular, Vue e HTML padrão
  function preencherInput(input, valor) {
    if (!input) return false;
    input.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(input, valor);
    } else {
      input.value = valor;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
    return true;
  }

  // Seleciona opção em <select> pelo texto da option
  function selecionarOpcaoSelect(selectEl, textoAlvo) {
    if (!selectEl) return false;
    const alvo = norm(textoAlvo);
    const options = Array.from(selectEl.options || []);
    const encontrada = options.find((opt) => norm(opt.textContent).includes(alvo));
    if (!encontrada) return false;

    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      "value"
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(selectEl, encontrada.value);
    } else {
      selectEl.value = encontrada.value;
    }
    selectEl.dispatchEvent(new Event("input", { bubbles: true }));
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // Aguarda até uma condição ser verdadeira no DOM
  async function esperarPor(fn, timeoutMs = 12000, intervalMs = 250) {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
      try {
        const res = fn();
        if (res) return res;
      } catch (_) {}
      await sleep(intervalMs);
    }
    return null;
  }

  // Encontra elemento clicável (a, button, li, span, div[role=tab/button]) pelo texto exato ou parcial
  function encontrarClicavelPorTexto(texto, escopo = document, preferExact = false) {
    const alvo = norm(texto);
    const candidatos = Array.from(
      escopo.querySelectorAll("a, button, [role='button'], [role='tab'], .nav-link, .menu-item, li, span, div")
    ).filter((el) => isVisible(el));

    // Ordena do elemento mais específico (menor texto total) para o mais amplo
    const matches = candidatos
      .filter((el) => {
        const t = norm(el.textContent);
        if (!t) return false;
        return preferExact ? t === alvo : t.includes(alvo);
      })
      .sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);

    return matches[0] || null;
  }

  // Procura um input associado a um label/placeholder contendo o texto alvo
  function encontrarInputPorRotulo(palavrasChave) {
    const termos = palavrasChave.map((p) => norm(p));
    const inputs = Array.from(
      document.querySelectorAll("input:not([type='hidden']):not([type='checkbox']):not([type='radio']):not([type='submit'])")
    ).filter((el) => isVisible(el));

    // 1. Por placeholder, aria-label, name ou id
    for (const inp of inputs) {
      const meta = norm(
        `${inp.placeholder || ""} ${inp.getAttribute("aria-label") || ""} ${inp.name || ""} ${inp.id || ""}`
      );
      if (termos.some((t) => meta.includes(t))) {
        return inp;
      }
    }

    // 2. Por <label for="..."> ou label ancestral / irmão próximo
    const labels = Array.from(document.querySelectorAll("label, th, td, span, div")).filter((el) =>
      isVisible(el)
    );
    for (const lbl of labels) {
      const txt = norm(lbl.textContent);
      if (!txt || txt.length > 60) continue;
      if (termos.some((t) => txt.includes(t))) {
        const forId = lbl.getAttribute("for");
        if (forId) {
          const elById = document.getElementById(forId);
          if (elById && isVisible(elById)) return elById;
        }
        const container = lbl.closest(".form-group, .field, .col, .mb-3, .row, tr, div");
        if (container) {
          const inp = container.querySelector("input:not([type='hidden'])");
          if (inp && isVisible(inp)) return inp;
        }
      }
    }

    return null;
  }

  function encontrarBotaoBuscar(escopo = document) {
    const botoes = Array.from(
      escopo.querySelectorAll("button, input[type='submit'], input[type='button'], a.btn, [role='button']")
    ).filter((el) => isVisible(el));

    const exato = botoes.find((b) => {
      const t = norm(b.textContent || b.value || b.getAttribute("title") || "");
      return t === "buscar" || t === "pesquisar" || t === "filtrar";
    });
    if (exato) return exato;

    return (
      botoes.find((b) => {
        const t = norm(b.textContent || b.value || b.getAttribute("title") || "");
        return t.includes("buscar") || t.includes("pesquisar");
      }) || null
    );
  }

  // Extrai cabeçalho de Data de Nascimento e Nome visíveis no perfil do paciente
  function extrairPerfilCabeçalho() {
    const bodyText = document.body?.innerText || "";
    const resultado = { nome: "", dataNascimento: "" };

    // Busca Data de Nascimento próxima a rótulos comuns
    const dnMatch = bodyText.match(
      /(?:Data\s*de\s*Nascimento|Dt\.?\s*Nasc(?:imento)?|Nascimento)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i
    );
    if (dnMatch) {
      resultado.dataNascimento = dnMatch[1];
    }

    // Busca Nome do Paciente no cabeçalho / título / rótulo
    const nomeMatch = bodyText.match(
      /(?:Paciente|Nome\s*do\s*Paciente|Nome\s*Completo)\s*:?\s*([A-ZÀ-Ú][A-ZÀ-Ú\s]{4,60})/
    );
    if (nomeMatch) {
      resultado.nome = nomeMatch[1].split("\n")[0].trim();
    } else {
      const h = document.querySelector("h1, h2, h3, h4, .paciente-nome, .card-title");
      if (h && isVisible(h)) {
        const t = (h.textContent || "").trim();
        if (t.length >= 5 && !/agendamento|exame|busca|filtro|perfil/i.test(t)) {
          resultado.nome = t;
        }
      }
    }

    return resultado;
  }

  async function reportarProgresso(step, mensagem) {
    await chrome.runtime.sendMessage({
      type: "CONECTASUS_PROGRESSO",
      step,
      mensagem,
    });
  }

  async function reportarErro(step, error) {
    await chrome.runtime.sendMessage({
      type: "CONECTASUS_ERRO",
      step,
      error,
    });
  }

  async function salvarJob(job) {
    await chrome.storage.local.set({ bancadalab_job: job });
  }

  // =========================================================================
  // MÁQUINA DE ESTADOS DOS 7 PASSOS
  // =========================================================================
  async function processarJobAtivo() {
    if (executando) return;
    executando = true;

    try {
      let { bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job");
      if (!job || !job.ativo) {
        executando = false;
        return;
      }

      // Verifica se está na tela de login (sessão expirada)
      if (window.location.href.toLowerCase().includes("login") || document.querySelector("input[type='password']")) {
        await reportarErro(job.step, "Sessão do Conecta SUS expirada ou na tela de login. Faça login na aba do Conecta SUS.");
        executando = false;
        return;
      }

      // -----------------------------------------------------------------
      // PASSO 1: Menu lateral "Exame laboratorial" -> "Agendamento de exame"
      // -----------------------------------------------------------------
      if (job.step === 1) {
        await reportarProgresso(1, 'Abrindo menu "Exame laboratorial" -> "Agendamento de exame"...');

        // Verifica se JÁ estamos na tela de listagem de Agendamento de exame
        const jaNaTelaListagem = Array.from(document.querySelectorAll("select")).some((sel) =>
          Array.from(sel.options || []).some((o) => norm(o.textContent).includes("prontuario municipal"))
        );

        if (!jaNaTelaListagem) {
          const itemAgendamentoVisivel = encontrarClicavelPorTexto("agendamento de exame", document);
          if (!itemAgendamentoVisivel) {
            const menuExameLab = encontrarClicavelPorTexto("exame laboratorial", document);
            if (!menuExameLab) {
              await reportarErro(1, 'Menu "Exame laboratorial" não encontrado na lateral esquerda.');
              executando = false;
              return;
            }
            clicarForte(menuExameLab);
            await sleep(450);
          }

          const linkAgendamento = await esperarPor(
            () => encontrarClicavelPorTexto("agendamento de exame", document),
            6000
          );
          if (!linkAgendamento) {
            await reportarErro(1, 'Submenu "Agendamento de exame" não encontrado.');
            executando = false;
            return;
          }

          job.step = 2;
          await salvarJob(job);
          clicarForte(linkAgendamento);
          await sleep(800);
        } else {
          job.step = 2;
          await salvarJob(job);
        }
      }

      // Recarrega job caso passo 1 tenha disparado reload ou continuado na mesma SPA
      ({ bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job"));
      if (!job || !job.ativo) {
        executando = false;
        return;
      }

      // -----------------------------------------------------------------
      // PASSO 2: Selecionar filtro "Prontuário municipal", digitar prontuário e clicar em "Buscar"
      // -----------------------------------------------------------------
      if (job.step === 2) {
        await reportarProgresso(2, `Filtrando por Prontuário municipal: ${job.prontuario}...`);

        const selectFiltro = await esperarPor(() => {
          const selects = Array.from(document.querySelectorAll("select")).filter(isVisible);
          return selects.find((sel) =>
            Array.from(sel.options || []).some((opt) => norm(opt.textContent).includes("prontuario municipal"))
          );
        }, 8000);

        if (!selectFiltro) {
          await reportarErro(2, 'Caixa de filtro "Prontuário municipal" não encontrada na tela.');
          executando = false;
          return;
        }

        selecionarOpcaoSelect(selectFiltro, "prontuario municipal");
        await sleep(400);

        // Encontra o campo de texto próximo ao select de filtro ou por placeholder
        let inputBusca = encontrarInputPorRotulo(["prontuario", "pesquisar", "buscar", "valor", "termo"]);
        if (!inputBusca) {
          const blocoFiltro = selectFiltro.closest("form, .row, .card-body, .panel-body, div");
          if (blocoFiltro) {
            inputBusca = Array.from(
              blocoFiltro.querySelectorAll("input[type='text'], input[type='search'], input:not([type])")
            ).find(isVisible);
          }
        }

        if (!inputBusca) {
          await reportarErro(2, "Campo de digitação do Prontuário não encontrado.");
          executando = false;
          return;
        }

        preencherInput(inputBusca, job.prontuario);
        await sleep(300);

        const btnBuscar = encontrarBotaoBuscar(selectFiltro.closest("form, .card, .panel") || document);
        if (!btnBuscar) {
          await reportarErro(2, 'Botão "Buscar" não encontrado.');
          executando = false;
          return;
        }

        job.step = 3;
        await salvarJob(job);
        clicarForte(btnBuscar);
        await sleep(1100);
      }

      ({ bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job"));
      if (!job || !job.ativo) {
        executando = false;
        return;
      }

      // -----------------------------------------------------------------
      // PASSO 3: Na tabela de resultados, clicar na "lupinha" de ações do paciente
      // -----------------------------------------------------------------
      if (job.step === 3) {
        await reportarProgresso(3, "Localizando paciente na tabela e clicando na lupinha azul...");

        const alvoNorm = normPront(job.prontuario);

        const acaoLupa = await esperarPor(() => {
          const linhas = Array.from(document.querySelectorAll("table tbody tr")).filter(isVisible);
          if (linhas.length === 0) return null;

          // Aguarda terminar eventual loading de tabela (spinner / Carregando)
          if (linhas.length === 1 && norm(linhas[0].textContent).includes("carregando")) {
            return null;
          }

          // Tenta achar a linha com o prontuário exato (ou normalizado sem zeros)
          let linhaAlvo = linhas.find((tr) => {
            const celulas = Array.from(tr.querySelectorAll("td"));
            return celulas.some((td) => {
              const t = td.textContent || "";
              return t.includes(job.prontuario) || normPront(t) === alvoNorm;
            });
          });

          // Se só retornou 1 linha válida após o filtro, usa ela
          if (
            !linhaAlvo &&
            linhas.length === 1 &&
            !norm(linhas[0].textContent).includes("nenhum registro") &&
            !norm(linhas[0].textContent).includes("nenhum resultado")
          ) {
            linhaAlvo = linhas[0];
          }

          if (!linhaAlvo) return null;

          // Extrai Nome (coluna 0) e Data de Nascimento (coluna 1 ou padrão DD/MM/AAAA) direto da tabela
          const tds = Array.from(linhaAlvo.querySelectorAll("td"));
          let nomeTabela = "";
          let dnTabela = "";
          if (tds[0]) {
            const txtNome = (tds[0].textContent || "").trim();
            if (txtNome && txtNome.length >= 3 && !/^\d+$/.test(txtNome)) {
              nomeTabela = txtNome;
            }
          }
          for (const td of tds) {
            const txt = (td.textContent || "").trim();
            const dn = txt.match(/(\d{2}\/\d{2}\/\d{4})/);
            if (dn && !dnTabela) {
              dnTabela = dn[1];
            }
          }

          // Localiza prioritariamente na última coluna (Ações) onde fica o botão azul da lupinha
          const ultimaCelula = tds[tds.length - 1] || linhaAlvo;
          const candidatosAcoes = Array.from(
            ultimaCelula.querySelectorAll("button, a, [role='button'], .btn, span, i, svg")
          ).filter(isVisible);

          const lupa =
            candidatosAcoes.find((el) => el.tagName === "BUTTON" || el.tagName === "A") ||
            candidatosAcoes.find((el) => el.getAttribute("role") === "button" || el.classList.contains("btn")) ||
            candidatosAcoes[0] ||
            Array.from(linhaAlvo.querySelectorAll("button, a, [role='button']")).filter(isVisible)[0];

          return lupa ? { linhaAlvo, ultimaCelula, lupa, nomeTabela, dnTabela } : null;
        }, 12000);

        if (!acaoLupa) {
          await reportarErro(3, `Paciente com prontuário ${job.prontuario} ou botão da lupinha não localizados na tabela.`);
          executando = false;
          return;
        }

        // Salva Nome e Data de Nascimento extraídos já da listagem de pacientes
        job.pacienteParcial = {
          ...(job.pacienteParcial || {}),
          nome: acaoLupa.nomeTabela || job.pacienteParcial?.nome || "",
          dataNascimento: acaoLupa.dnTabela || job.pacienteParcial?.dataNascimento || "",
        };
        job.step = 4;
        await salvarJob(job);

        await reportarProgresso(3, `Clicando na lupinha (${acaoLupa.lupa.tagName}) do paciente ${acaoLupa.nomeTabela || job.prontuario}...`);
        clicarForte(acaoLupa.lupa);

        // Aguarda transição para o perfil; se ainda estiver na lista após 1.3s, clica no ícone interno ou elemento pai
        await sleep(1300);
        const aindaNaLista = Array.from(document.querySelectorAll("h1, h2, h3, h4, .card-title, th")).some((el) =>
          norm(el.textContent).includes("lista de paciente")
        );
        if (aindaNaLista && isVisible(acaoLupa.ultimaCelula)) {
          const iconeInterno = acaoLupa.lupa.querySelector("i, svg, span") || acaoLupa.ultimaCelula.querySelector("i, svg, button, a");
          if (iconeInterno && iconeInterno !== acaoLupa.lupa) {
            clicarForte(iconeInterno);
            await sleep(900);
          }
        }
      }

      ({ bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job"));
      if (!job || !job.ativo) {
        executando = false;
        return;
      }

      // -----------------------------------------------------------------
      // PASSO 4: Dentro do perfil, capturar cabeçalho e clicar na aba "EXAMES AGENDADOS"
      // -----------------------------------------------------------------
      if (job.step === 4) {
        await reportarProgresso(4, 'Abrindo aba "EXAMES AGENDADOS" no perfil do paciente...');

        const abaExames = await esperarPor(
          () => encontrarClicavelPorTexto("exames agendados", document),
          12000
        );

        if (!abaExames) {
          await reportarErro(4, 'Aba superior "EXAMES AGENDADOS" não encontrada no perfil do paciente.');
          executando = false;
          return;
        }

        // Captura Nome e Data de Nascimento do cabeçalho do perfil antes de trocar de aba
        const perfil = extrairPerfilCabeçalho();
        job.pacienteParcial = {
          nome: perfil.nome || job.pacienteParcial?.nome || "",
          dataNascimento: perfil.dataNascimento || job.pacienteParcial?.dataNascimento || "",
        };

        job.step = 5;
        await salvarJob(job);
        clicarForte(abaExames);
        await sleep(900);
      }

      ({ bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job"));
      if (!job || !job.ativo) {
        executando = false;
        return;
      }

      // -----------------------------------------------------------------
      // PASSO 5: Preencher "Número do agendamento" e clicar em "Buscar"
      // -----------------------------------------------------------------
      if (job.step === 5) {
        await reportarProgresso(5, `Buscando agendamento nº ${job.agendamento}...`);

        // Atualiza dados parciais caso o perfil ainda esteja visível acima da aba
        const perfilAtual = extrairPerfilCabeçalho();
        if (perfilAtual.nome) job.pacienteParcial.nome = perfilAtual.nome;
        if (perfilAtual.dataNascimento) job.pacienteParcial.dataNascimento = perfilAtual.dataNascimento;

        // Se existir um <select> de filtro parecido com a tela anterior contendo "agendamento", seleciona-o
        const selectAgend = Array.from(document.querySelectorAll("select")).filter(isVisible).find((sel) =>
          Array.from(sel.options || []).some((opt) => norm(opt.textContent).includes("agendamento"))
        );
        if (selectAgend) {
          selecionarOpcaoSelect(selectAgend, "agendamento");
          await sleep(300);
        }

        const inputAgendamento = await esperarPor(
          () => {
            let inp = encontrarInputPorRotulo([
              "numero do agendamento",
              "nº agendamento",
              "agendamento",
              "codigo agendamento",
            ]);
            if (!inp && selectAgend) {
              const bloco = selectAgend.closest("form, .row, .card-body, div");
              if (bloco) {
                inp = Array.from(bloco.querySelectorAll("input[type='text'], input[type='search'], input:not([type])")).find(isVisible);
              }
            }
            return inp;
          },
          7000
        );

        if (inputAgendamento) {
          preencherInput(inputAgendamento, job.agendamento);
          await sleep(300);

          const escopoTab =
            inputAgendamento.closest(".tab-pane, .card, form, section, main") || document;
          const btnBuscar = encontrarBotaoBuscar(escopoTab) || encontrarBotaoBuscar(document);
          if (btnBuscar) {
            job.step = 6;
            await salvarJob(job);
            clicarForte(btnBuscar);
            await sleep(1000);
          } else {
            job.step = 6;
            await salvarJob(job);
          }
        } else {
          // Se o campo não existir, segue direto para localizar o agendamento na tabela visível
          job.step = 6;
          await salvarJob(job);
        }
      }

      ({ bancadalab_job: job } = await chrome.storage.local.get("bancadalab_job"));
      if (!job || !job.ativo) {
        executando = false;
        return;
      }

      // -----------------------------------------------------------------
      // PASSO 6 & 7: Extrair Data de Nascimento, Médico Solicitante e Exames da linha e enviar
      // -----------------------------------------------------------------
      if (job.step === 6) {
        await reportarProgresso(6, "Extraindo Data de Nascimento, Médico Solicitante e Exames...");

        const extraido = await esperarPor(() => {
          const tabelas = Array.from(document.querySelectorAll("table")).filter(isVisible);
          for (const tabela of tabelas) {
            const headers = Array.from(tabela.querySelectorAll("thead th")).map((th) =>
              norm(th.textContent)
            );
            const linhas = Array.from(tabela.querySelectorAll("tbody tr")).filter((tr) => {
              if (!isVisible(tr)) return false;
              const txt = norm(tr.textContent);
              return txt && !txt.includes("nenhum registro") && !txt.includes("sem resultados");
            });

            if (linhas.length === 0) continue;

            // Filtra linhas que contêm o número do agendamento informado (pode haver 1 linha por exame!)
            let linhasMatch = linhas.filter((tr) =>
              (tr.textContent || "").includes(job.agendamento)
            );
            if (linhasMatch.length === 0 && linhas.length === 1) {
              linhasMatch = linhas;
            }
            if (linhasMatch.length === 0) continue;

            const idxDn = headers.findIndex((h) => h.includes("nasc"));
            const idxMed = headers.findIndex(
              (h) => h.includes("medico") || h.includes("solicitante") || h.includes("profissional")
            );
            const idxExame = headers.findIndex(
              (h) => h.includes("exame") || h.includes("procedimento") || h.includes("descricao")
            );
            const idxNome = headers.findIndex((h) => h.includes("paciente") || h === "nome");

            let dataNascimento = job.pacienteParcial?.dataNascimento || "";
            let medicoSolicitante = "";
            let nomePaciente = job.pacienteParcial?.nome || "";
            const examesSet = new Set();

            for (const tr of linhasMatch) {
              const tds = Array.from(tr.querySelectorAll("td"));

              if (idxDn >= 0 && tds[idxDn]) {
                const dnMatch = (tds[idxDn].textContent || "").match(/\d{2}\/\d{2}\/\d{4}/);
                if (dnMatch) dataNascimento = dnMatch[0];
              }

              if (idxNome >= 0 && tds[idxNome] && !nomePaciente) {
                nomePaciente = (tds[idxNome].textContent || "").trim();
              }

              if (idxMed >= 0 && tds[idxMed] && !medicoSolicitante) {
                medicoSolicitante = (tds[idxMed].textContent || "").trim();
              }

              if (idxExame >= 0 && tds[idxExame]) {
                const rawEx = (tds[idxExame].innerText || tds[idxExame].textContent || "")
                  .split(/\n|;|•|\|/)
                  .map((x) => x.trim())
                  .filter(Boolean);
                rawEx.forEach((ex) => examesSet.add(ex));
              }

              // Fallback se os headers não estiverem em <thead> padrão
              if (idxExame < 0) {
                for (const td of tds) {
                  const t = (td.textContent || "").trim();
                  if (/hemograma|glicad|hba1c|urina|vdrl|pso|vhs|colesterol|glicose/i.test(t)) {
                    t.split(/\n|;|,/)
                      .map((x) => x.trim())
                      .filter(Boolean)
                      .forEach((x) => examesSet.add(x));
                  }
                  if (!medicoSolicitante && /^dr\.?|^dra\.?/i.test(t)) {
                    medicoSolicitante = t;
                  }
                }
              }
            }

            // Re-verifica cabeçalho do perfil caso DN não estivesse na coluna da tabela
            if (!dataNascimento || !nomePaciente) {
              const perfilFim = extrairPerfilCabeçalho();
              if (!dataNascimento) dataNascimento = perfilFim.dataNascimento;
              if (!nomePaciente) nomePaciente = perfilFim.nome;
            }

            return {
              prontuario: job.prontuario,
              agendamento: job.agendamento,
              nome: (nomePaciente || `PACIENTE #${job.prontuario}`).toUpperCase(),
              dataNascimento: dataNascimento || "",
              medicoSolicitante: medicoSolicitante || "Dr(a). Clínico(a) Geral / UBS",
              exames: Array.from(examesSet),
            };
          }
          return null;
        }, 10000);

        if (!extraido) {
          await reportarErro(
            6,
            `Agendamento #${job.agendamento} não encontrado na tabela de Exames Agendados.`
          );
          executando = false;
          return;
        }

        await reportarProgresso(7, "Enviando dados capturados para o BancadaLab (Cloudflare D1)...");
        await chrome.runtime.sendMessage({
          type: "CONECTASUS_DADOS_CAPTURADOS",
          dados: extraido,
        });
      }
    } catch (err) {
      await reportarErro("?", err?.message || "Erro inesperado durante a automação no Conecta SUS.");
    } finally {
      executando = false;
    }
  }

  // Escuta comandos vindos do background.js
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "EXECUTAR_PASSO_CONECTASUS") {
      processarJobAtivo();
      sendResponse({ ok: true });
    }
  });

  // Se a página acabou de recarregar durante um job ativo, continua automaticamente
  chrome.storage.local.get("bancadalab_job", ({ bancadalab_job }) => {
    if (bancadalab_job && bancadalab_job.ativo) {
      setTimeout(() => processarJobAtivo(), 400);
    }
  });
})();

