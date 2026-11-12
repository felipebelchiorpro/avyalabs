# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 59 files · ~125,902 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 396 nodes · 945 edges · 30 communities (23 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8eb1fd1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- importar/page.tsx
- triagem-edta/page.tsx
- layout.tsx
- d1Service.ts
- content_conectasus.js
- compilerOptions
- devDependencies
- next
- extensao-chrome/manifest.json
- urinalise.ts
- background.js
- manifest.json
- getD1Database
- dependencies
- D1PreparedStatement
- rotina/route.ts
- googleSheets.ts
- vercel.json
- postcss.config.mjs
- laudos/route.ts
- extratorBancada.ts
- package.json
- TriagemEdtaReal.tsx
- scripts
- eslint.config.mjs
- EdtaBarcodeScanner.tsx
- D1Database

## God Nodes (most connected - your core abstractions)
1. `obterHojeIsoLocal()` - 31 edges
2. `react` - 26 edges
3. `TriagemEdtaPage()` - 25 edges
4. `formatarProntuario()` - 24 edges
5. `getD1Database()` - 23 edges
6. `next` - 21 edges
7. `normalizarProntuario()` - 18 edges
8. `lucide-react` - 18 edges
9. `LaudoUrina` - 17 edges
10. `normalizarDataIso()` - 17 edges

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

## Communities (30 total, 7 thin omitted)

### Community 0 - "importar/page.tsx"
Cohesion: 0.14
Nodes (14): xlsx@^0.18.5, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), MapaBancadaPrintView() (+6 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.16
Nodes (31): TriagemEdtaPage(), DadosPacienteCapturados, Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu (+23 more)

### Community 2 - "layout.tsx"
Cohesion: 0.29
Nodes (6): geistMono, geistSans, metadata, RootLayout(), viewport, SidebarLateral()

### Community 3 - "d1Service.ts"
Cohesion: 0.13
Nodes (15): dynamic, GET(), POST(), revalidate, D1Result, DATA_DIR, FallbackDbStructure, listarMedicosD1() (+7 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19, typescript@^5, tailwindcss (+5 more)

### Community 7 - "next"
Cohesion: 0.19
Nodes (10): nextConfig, next, dynamic, POST(), revalidate, dynamic, POST(), revalidate (+2 more)

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

### Community 17 - "rotina/route.ts"
Cohesion: 0.17
Nodes (13): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+5 more)

### Community 18 - "googleSheets.ts"
Cohesion: 0.13
Nodes (16): emitirSinalImpressaoEdta(), FiltroLaudos, obterSinalImpressaoEdta(), ResultadoSalvarRotina, atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta(), excluirItemEdta() (+8 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "laudos/route.ts"
Cohesion: 0.31
Nodes (8): dynamic, GET(), revalidate, GET(), isD1Configured(), listarLaudos(), isGoogleSheetsConfigured(), listarLaudos()

### Community 23 - "extratorBancada.ts"
Cohesion: 0.17
Nodes (29): dynamic, GET(), POST(), revalidate, RetidosGlicadaPage(), LoteVdrlPage(), EdtaOcrScanner(), EdtaOcrScannerProps (+21 more)

### Community 24 - "package.json"
Cohesion: 0.20
Nodes (9): @emnapi/runtime@^1.11.3, pdf-parse@^2.4.5, @types/pdf-parse@^1.1.5, name, private, version, @emnapi/runtime, pdf-parse (+1 more)

### Community 25 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 26 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 27 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 28 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `importar/page.tsx`, `triagem-edta/page.tsx`, `layout.tsx`, `d1Service.ts`, `urinalise.ts`, `getD1Database`, `dependencies`, `rotina/route.ts`, `laudos/route.ts`, `extratorBancada.ts`, `package.json`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Should `importar/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `importar/page.tsx`, `triagem-edta/page.tsx`, `dependencies`, `extratorBancada.ts`, `package.json`, `TriagemEdtaReal.tsx`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._
- **Why does `obterHojeIsoLocal()` connect `extratorBancada.ts` to `importar/page.tsx`, `triagem-edta/page.tsx`, `d1Service.ts`, `next`, `urinalise.ts`, `rotina/route.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07374890254609306 - nodes in this community are weakly interconnected._