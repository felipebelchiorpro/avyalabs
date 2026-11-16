# Graph Report - Urinalise PWA Automatico  (2026-11-15)

## Corpus Check
- 60 files · ~131,167 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 403 nodes · 965 edges · 26 communities (21 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b582e76`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- extrair-arquivo/route.ts
- triagem-edta/page.tsx
- next
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
- formatarProntuario
- d1Service.ts
- vercel.json
- postcss.config.mjs
- listarLaudos
- scripts
- eslint.config.mjs
- EdtaBarcodeScanner.tsx

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

## Communities (26 total, 5 thin omitted)

### Community 0 - "extrair-arquivo/route.ts"
Cohesion: 0.22
Nodes (8): pdf-parse@^2.4.5, xlsx@^0.18.5, pdf-parse, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.17
Nodes (26): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), RelatorioTriagemEdtaPrintViewProps, getAudioContext(), tocarSomApenasGlicada() (+18 more)

### Community 2 - "next"
Cohesion: 0.11
Nodes (25): nextConfig, lucide-react, next, DESTINOS_LABORATORIO, RegistroEnvioApoio, geistMono, geistSans, metadata (+17 more)

### Community 3 - "googleSheets.ts"
Cohesion: 0.14
Nodes (15): emitirSinalImpressaoEdta(), FiltroLaudos, obterSinalImpressaoEdta(), atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta(), excluirItemEdta(), listarTriagemEdta() (+7 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.53
Nodes (5): aguardarElemento(), executarAutomacaoApoio(), processarLinhasTabela(), procurarJwtEmStorage(), sincronizarTokenComBackground()

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "devDependencies"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 7 - "rotina/route.ts"
Cohesion: 0.17
Nodes (13): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+5 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "urinalise.ts"
Cohesion: 0.06
Nodes (71): react, dynamic, POST(), revalidate, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), RetidosGlicadaPage() (+63 more)

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

### Community 17 - "formatarProntuario"
Cohesion: 0.44
Nodes (12): dynamic, GET(), POST(), revalidate, atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), excluirItemEdta(), listarTriagemEdta() (+4 more)

### Community 18 - "d1Service.ts"
Cohesion: 0.12
Nodes (16): dynamic, GET(), POST(), revalidate, D1Result, DATA_DIR, FallbackDbStructure, listarMedicosD1() (+8 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "listarLaudos"
Cohesion: 0.15
Nodes (16): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, dynamic (+8 more)

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
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `extrair-arquivo/route.ts`, `triagem-edta/page.tsx`, `devDependencies`, `rotina/route.ts`, `urinalise.ts`, `getD1Database`, `dependencies`, `formatarProntuario`, `d1Service.ts`, `listarLaudos`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.10960960960960961 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `next`, `devDependencies`, `dependencies`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `next` to `triagem-edta/page.tsx`, `devDependencies`, `urinalise.ts`, `dependencies`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._