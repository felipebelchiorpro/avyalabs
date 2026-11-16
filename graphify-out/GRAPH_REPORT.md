# Graph Report - Urinalise PWA Automatico  (2026-11-15)

## Corpus Check
- 60 files · ~132,430 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 407 nodes · 972 edges · 32 communities (26 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b876ebed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- importar/page.tsx
- triagem-edta/page.tsx
- layout.tsx
- googleSheets.ts
- content_conectasus.js
- compilerOptions
- devDependencies
- rotina/route.ts
- extensao-chrome/manifest.json
- urinalise.ts
- background.js
- manifest.json
- getD1Database
- dependencies
- D1PreparedStatement
- extratorBancada.ts
- medicos/route.ts
- vercel.json
- postcss.config.mjs
- listarLaudos
- next
- d1Service.ts
- package.json
- scripts
- eslint.config.mjs
- EdtaBarcodeScanner.tsx
- TriagemEdtaReal.tsx
- laboratorio-apoio/page.tsx
- D1Database

## God Nodes (most connected - your core abstractions)
1. `obterHojeIsoLocal()` - 31 edges
2. `react` - 27 edges
3. `TriagemEdtaPage()` - 25 edges
4. `formatarProntuario()` - 24 edges
5. `getD1Database()` - 23 edges
6. `next` - 22 edges
7. `normalizarDataIso()` - 21 edges
8. `lucide-react` - 19 edges
9. `normalizarProntuario()` - 18 edges
10. `LaudoUrina` - 17 edges

## Surprising Connections (you probably didn't know these)
- `atualizarStatusItemEdta()` --calls--> `atualizarStatusItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `consumirSinalImpressaoEdta()` --calls--> `consumirSinalImpressaoEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `excluirItemEdta()` --calls--> `excluirItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `listarTriagemEdta()` --calls--> `listarTriagemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `salvarTriagemEdta()` --calls--> `salvarTriagemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts

## Import Cycles
- None detected.

## Communities (32 total, 6 thin omitted)

### Community 0 - "importar/page.tsx"
Cohesion: 0.14
Nodes (14): xlsx@^0.18.5, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), MapaBancadaPrintView() (+6 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.16
Nodes (31): TriagemEdtaPage(), DadosPacienteCapturados, Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu (+23 more)

### Community 2 - "layout.tsx"
Cohesion: 0.29
Nodes (6): geistMono, geistSans, metadata, RootLayout(), viewport, SidebarLateral()

### Community 3 - "googleSheets.ts"
Cohesion: 0.13
Nodes (16): emitirSinalImpressaoEdta(), obterSinalImpressaoEdta(), ResultadoSalvarRotina, atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta(), excluirItemEdta(), listarTriagemEdta() (+8 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.36
Nodes (7): aguardarElemento(), executarFluxoCompletoConectaSus(), iniciarObservadorSupervisor(), procurarJwtEmStorage(), simularClique(), simularInput(), sincronizarTokenComBackground()

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19, typescript@^5, tailwindcss (+5 more)

### Community 7 - "rotina/route.ts"
Cohesion: 0.19
Nodes (11): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+3 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "urinalise.ts"
Cohesion: 0.07
Nodes (47): lucide-react, react, ConsultaAuditoriaPage(), PainelLaudosPage(), HomeDashboard(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+39 more)

### Community 10 - "background.js"
Cohesion: 0.50
Nodes (8): atualizarLog(), consultarConectaSusPorApi(), extrairPacienteIdDaLinha(), iniciarBuscaConectaSus(), localizarAbaConectaSus(), normPront(), notificarBancada(), obterTokenSessao()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "getD1Database"
Cohesion: 0.16
Nodes (16): dynamic, GET(), POST(), revalidate, dynamic, GET(), revalidate, criarD1HttpDriver() (+8 more)

### Community 15 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @emnapi/core@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0, @tailwindcss/postcss@^4.3.3 (+6 more)

### Community 17 - "extratorBancada.ts"
Cohesion: 0.17
Nodes (30): dynamic, GET(), POST(), revalidate, RetidosGlicadaPage(), LoteVdrlPage(), EdtaOcrScanner(), EdtaOcrScannerProps (+22 more)

### Community 18 - "medicos/route.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), POST(), revalidate, listarMedicosD1(), listarMedicosGoogleSheets(), salvarMedicosD1(), salvarMedicosGoogleSheets() (+2 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "listarLaudos"
Cohesion: 0.31
Nodes (8): dynamic, GET(), revalidate, GET(), isD1Configured(), listarLaudos(), isGoogleSheetsConfigured(), listarLaudos()

### Community 23 - "next"
Cohesion: 0.19
Nodes (10): nextConfig, next, dynamic, POST(), revalidate, dynamic, POST(), revalidate (+2 more)

### Community 24 - "d1Service.ts"
Cohesion: 0.18
Nodes (6): D1Result, DATA_DIR, FallbackDbStructure, FiltroLaudos, LOCAL_DB_PATH, SinalImpressaoState

### Community 25 - "package.json"
Cohesion: 0.20
Nodes (9): @emnapi/runtime@^1.11.3, pdf-parse@^2.4.5, @types/pdf-parse@^1.1.5, name, private, version, @emnapi/runtime, pdf-parse (+1 more)

### Community 26 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 27 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 28 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 29 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 30 - "laboratorio-apoio/page.tsx"
Cohesion: 0.50
Nodes (4): classificarExame(), ExameClassificado, LaboratorioApoioPage(), RegistroTriagemAutomatica

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `importar/page.tsx`, `triagem-edta/page.tsx`, `layout.tsx`, `rotina/route.ts`, `urinalise.ts`, `getD1Database`, `dependencies`, `extratorBancada.ts`, `medicos/route.ts`, `listarLaudos`, `package.json`, `laboratorio-apoio/page.tsx`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Should `importar/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `importar/page.tsx`, `triagem-edta/page.tsx`, `dependencies`, `extratorBancada.ts`, `package.json`, `EdtaBarcodeScanner.tsx`, `TriagemEdtaReal.tsx`, `laboratorio-apoio/page.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `importar/page.tsx`, `triagem-edta/page.tsx`, `dependencies`, `extratorBancada.ts`, `package.json`, `EdtaBarcodeScanner.tsx`, `TriagemEdtaReal.tsx`, `laboratorio-apoio/page.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07327001356852103 - nodes in this community are weakly interconnected._