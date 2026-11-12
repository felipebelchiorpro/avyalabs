# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 59 files · ~128,246 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 396 nodes · 954 edges · 29 communities (23 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6f8efb0c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- extrair-arquivo/route.ts
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
- d1Service.ts
- TriagemEdtaReal.tsx
- scripts
- eslint.config.mjs
- EdtaBarcodeScanner.tsx

## God Nodes (most connected - your core abstractions)
1. `obterHojeIsoLocal()` - 31 edges
2. `react` - 26 edges
3. `TriagemEdtaPage()` - 25 edges
4. `formatarProntuario()` - 24 edges
5. `getD1Database()` - 23 edges
6. `normalizarDataIso()` - 21 edges
7. `next` - 21 edges
8. `normalizarProntuario()` - 18 edges
9. `lucide-react` - 18 edges
10. `LaudoUrina` - 17 edges

## Surprising Connections (you probably didn't know these)
- `listarTriagemEdta()` --calls--> `listarTriagemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `salvarTriagemEdta()` --calls--> `salvarTriagemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `atualizarStatusItemEdta()` --calls--> `atualizarStatusItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `excluirItemEdta()` --calls--> `excluirItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `consumirSinalImpressaoEdta()` --calls--> `consumirSinalImpressaoEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts

## Import Cycles
- None detected.

## Communities (29 total, 6 thin omitted)

### Community 0 - "extrair-arquivo/route.ts"
Cohesion: 0.22
Nodes (8): pdf-parse@^2.4.5, xlsx@^0.18.5, pdf-parse, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.16
Nodes (31): TriagemEdtaPage(), DadosPacienteCapturados, Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu (+23 more)

### Community 2 - "layout.tsx"
Cohesion: 0.29
Nodes (6): geistMono, geistSans, metadata, RootLayout(), viewport, SidebarLateral()

### Community 3 - "d1Service.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), POST(), revalidate, listarMedicosD1(), listarMedicosGoogleSheets(), salvarMedicosD1(), salvarMedicosGoogleSheets() (+2 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "devDependencies"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 7 - "next"
Cohesion: 0.19
Nodes (10): nextConfig, next, dynamic, POST(), revalidate, dynamic, POST(), revalidate (+2 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "urinalise.ts"
Cohesion: 0.06
Nodes (55): lucide-react, react, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), HomeDashboard(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL (+47 more)

### Community 10 - "background.js"
Cohesion: 0.50
Nodes (8): atualizarLog(), consultarConectaSusPorApi(), extrairPacienteIdDaLinha(), iniciarBuscaConectaSus(), localizarAbaConectaSus(), normPront(), notificarBancada(), obterTokenSessao()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "getD1Database"
Cohesion: 0.21
Nodes (13): dynamic, GET(), POST(), revalidate, criarD1HttpDriver(), criarD1LocalDriver(), getD1Database(), listarOperadoresD1() (+5 more)

### Community 15 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0 (+8 more)

### Community 17 - "rotina/route.ts"
Cohesion: 0.17
Nodes (13): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+5 more)

### Community 18 - "googleSheets.ts"
Cohesion: 0.14
Nodes (15): emitirSinalImpressaoEdta(), FiltroLaudos, obterSinalImpressaoEdta(), atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta(), excluirItemEdta(), listarTriagemEdta() (+7 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "laudos/route.ts"
Cohesion: 0.21
Nodes (11): dynamic, GET(), revalidate, GET(), dynamic, GET(), revalidate, isD1Configured() (+3 more)

### Community 23 - "extratorBancada.ts"
Cohesion: 0.17
Nodes (29): dynamic, GET(), POST(), revalidate, RetidosGlicadaPage(), LoteVdrlPage(), EdtaOcrScanner(), EdtaOcrScannerProps (+21 more)

### Community 24 - "d1Service.ts"
Cohesion: 0.18
Nodes (6): D1Result, DATA_DIR, FallbackDbStructure, LOCAL_DB_PATH, ResultadoSalvarRotina, SinalImpressaoState

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
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `extrair-arquivo/route.ts`, `triagem-edta/page.tsx`, `layout.tsx`, `d1Service.ts`, `devDependencies`, `urinalise.ts`, `getD1Database`, `dependencies`, `rotina/route.ts`, `laudos/route.ts`, `extratorBancada.ts`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `devDependencies`, `dependencies`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Why does `obterHojeIsoLocal()` connect `extratorBancada.ts` to `triagem-edta/page.tsx`, `next`, `urinalise.ts`, `rotina/route.ts`, `d1Service.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.063568010936432 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._