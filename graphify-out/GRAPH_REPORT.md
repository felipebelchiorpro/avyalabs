# Graph Report - Urinalise PWA Automatico  (2026-11-19)

## Corpus Check
- 60 files · ~144,327 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 421 nodes · 1023 edges · 24 communities (18 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `133145bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TriagemEdtaReal.tsx
- triagem-edta/page.tsx
- extratorBancada.ts
- D1PreparedStatement
- content_conectasus.js
- compilerOptions
- googleSheets.ts
- getD1Database
- extensao-chrome/manifest.json
- urinalise.ts
- background.js
- manifest.json
- next
- package.json
- rotina/route.ts
- d1Service.ts
- salvarOuAtualizarLaudo
- vercel.json
- postcss.config.mjs
- D1Database
- listarLaudos

## God Nodes (most connected - your core abstractions)
1. `obterHojeIsoLocal()` - 31 edges
2. `react` - 27 edges
3. `TriagemEdtaPage()` - 25 edges
4. `formatarProntuario()` - 24 edges
5. `getD1Database()` - 23 edges
6. `next` - 22 edges
7. `normalizarDataIso()` - 21 edges
8. `normalizarProntuario()` - 20 edges
9. `lucide-react` - 19 edges
10. `LaudoUrina` - 17 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `salvarRotinaDia()`  [EXTRACTED]
  src/app/api/rotina/route.ts → src/lib/d1Service.ts
- `atualizarStatusItemEdta()` --calls--> `atualizarStatusItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `consumirSinalImpressaoEdta()` --calls--> `consumirSinalImpressaoEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `excluirItemEdta()` --calls--> `excluirItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `listarTriagemEdta()` --calls--> `listarTriagemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts

## Import Cycles
- None detected.

## Communities (24 total, 6 thin omitted)

### Community 0 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.16
Nodes (31): TriagemEdtaPage(), DadosPacienteCapturados, Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu (+23 more)

### Community 2 - "extratorBancada.ts"
Cohesion: 0.10
Nodes (45): dynamic, extractTextFromPdf(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+37 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.26
Nodes (18): atualizarHud(), classificarDestinoExame(), clicarDiaNoCalendario(), criarNovoAgendamentoNoConectaSus(), executarApenasMudancaLaboratorio(), executarApoioViaApiDireta(), executarFluxoCompletoConectaSus(), extrairDadosDaLinhaAgendamento() (+10 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "googleSheets.ts"
Cohesion: 0.13
Nodes (16): emitirSinalImpressaoEdta(), FiltroLaudos, obterSinalImpressaoEdta(), atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta(), excluirItemEdta(), listarTriagemEdta() (+8 more)

### Community 7 - "getD1Database"
Cohesion: 0.21
Nodes (13): dynamic, GET(), POST(), revalidate, criarD1HttpDriver(), criarD1LocalDriver(), getD1Database(), listarOperadoresD1() (+5 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "urinalise.ts"
Cohesion: 0.07
Nodes (47): lucide-react, react, ConsultaAuditoriaPage(), ExameClassificado, RegistroTriagemAutomatica, PainelLaudosPage(), HomeDashboard(), BancadaOperacionalPage() (+39 more)

### Community 10 - "background.js"
Cohesion: 0.45
Nodes (11): atualizarLog(), consultarConectaSusPorApi(), executarApoioConectaSus(), executarInjecaoLoteConectaSus(), extrairPacienteIdDaLinha(), garantirContentScriptInjetado(), iniciarBuscaConectaSus(), localizarAbaConectaSus() (+3 more)

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "next"
Cohesion: 0.19
Nodes (9): nextConfig, next@16.4.3, next, geistMono, geistSans, metadata, RootLayout(), viewport (+1 more)

### Community 15 - "package.json"
Cohesion: 0.05
Nodes (50): eslintConfig, dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, pdf-parse@^2.4.5 (+42 more)

### Community 16 - "rotina/route.ts"
Cohesion: 0.19
Nodes (11): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+3 more)

### Community 17 - "d1Service.ts"
Cohesion: 0.12
Nodes (16): dynamic, GET(), POST(), revalidate, D1Result, DATA_DIR, FallbackDbStructure, listarMedicosD1() (+8 more)

### Community 18 - "salvarOuAtualizarLaudo"
Cohesion: 0.40
Nodes (5): dynamic, POST(), revalidate, salvarOuAtualizarLaudo(), salvarOuAtualizarLaudo()

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 23 - "listarLaudos"
Cohesion: 0.16
Nodes (14): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, dynamic (+6 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `triagem-edta/page.tsx`, `extratorBancada.ts`, `getD1Database`, `urinalise.ts`, `package.json`, `rotina/route.ts`, `d1Service.ts`, `salvarOuAtualizarLaudo`, `listarLaudos`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Should `extratorBancada.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09805194805194806 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `TriagemEdtaReal.tsx`, `triagem-edta/page.tsx`, `extratorBancada.ts`, `next`, `package.json`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `TriagemEdtaReal.tsx`, `triagem-edta/page.tsx`, `extratorBancada.ts`, `next`, `package.json`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06583850931677018 - nodes in this community are weakly interconnected._