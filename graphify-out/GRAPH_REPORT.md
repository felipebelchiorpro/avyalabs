# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 52 files · ~114,715 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 362 nodes · 854 edges · 27 communities (23 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4822e67a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- googleSheets.ts
- package.json
- compilerOptions
- dependencies
- medicos/route.ts
- next
- eslint.config.mjs
- operadores/route.ts
- exportadorXmlExtensao.ts
- EdtaBarcodeScanner.tsx
- manifest.json
- getD1Database
- extratorBancada.ts
- D1PreparedStatement
- TriagemEdtaReal.tsx
- D1Database
- vercel.json
- postcss.config.mjs
- next
- scripts
- d1Service.ts
- googleSheets.ts
- package.json

## God Nodes (most connected - your core abstractions)
1. `react` - 24 edges
2. `TriagemEdtaPage()` - 22 edges
3. `formatarProntuario()` - 22 edges
4. `getD1Database()` - 20 edges
5. `next` - 20 edges
6. `LaudoUrina` - 17 edges
7. `normalizarProntuario()` - 17 edges
8. `lucide-react` - 17 edges
9. `normalizarDataIso()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `LoteVdrlPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/vdrl/page.tsx → src/lib/extratorBancada.ts
- `BancadaOperacionalPage()` --calls--> `baixarXlsxUrinalise()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/exportadorXmlExtensao.ts
- `BancadaOperacionalPage()` --calls--> `baixarXmlUrinalise()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/exportadorXmlExtensao.ts
- `BancadaOperacionalPage()` --calls--> `gerarStringXmlUrinalise()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/exportadorXmlExtensao.ts
- `BancadaOperacionalPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/extratorBancada.ts

## Import Cycles
- None detected.

## Communities (27 total, 4 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.11
Nodes (33): lucide-react, react, ConsultaAuditoriaPage(), PainelLaudosPage(), HomeDashboard(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+25 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.20
Nodes (23): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+15 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.17
Nodes (20): geistMono, geistSans, metadata, RootLayout(), viewport, AppLayoutWrapper(), AppLayoutWrapperProps, Logo() (+12 more)

### Community 3 - "googleSheets.ts"
Cohesion: 0.19
Nodes (14): dynamic, GET(), POST(), revalidate, atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), excluirItemEdta(), listarTriagemEdta() (+6 more)

### Community 4 - "package.json"
Cohesion: 0.15
Nodes (13): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19, typescript@^5, tailwindcss (+5 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @emnapi/core@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0, @tailwindcss/postcss@^4.3.3 (+6 more)

### Community 7 - "medicos/route.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), POST(), revalidate, listarMedicosD1(), listarMedicosGoogleSheets(), salvarMedicosD1(), salvarMedicosGoogleSheets() (+2 more)

### Community 8 - "next"
Cohesion: 0.21
Nodes (10): dynamic, GET(), revalidate, dynamic, GET(), revalidate, listarLaudos(), listarRotinaDia() (+2 more)

### Community 9 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 10 - "operadores/route.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), POST(), revalidate, listarOperadoresD1(), listarOperadoresGoogleSheets(), salvarOperadoresD1(), salvarOperadoresGoogleSheets() (+2 more)

### Community 11 - "exportadorXmlExtensao.ts"
Cohesion: 0.12
Nodes (21): xlsx@^0.18.5, xlsx, dynamic, POST(), revalidate, salvarRotinaDia(), baixarXlsxUrinalise(), baixarXmlUrinalise() (+13 more)

### Community 12 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "getD1Database"
Cohesion: 0.32
Nodes (7): dynamic, GET(), revalidate, criarD1LocalDriver(), getD1Database(), isD1Configured(), isGoogleSheetsConfigured()

### Community 15 - "extratorBancada.ts"
Cohesion: 0.15
Nodes (23): dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), RetidosGlicadaPage(), salvarTriagemEdta(), aplicarFlagsExamesNoItem() (+15 more)

### Community 17 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "next"
Cohesion: 0.18
Nodes (11): nextConfig, next, dynamic, GET(), POST(), revalidate, dynamic, POST() (+3 more)

### Community 23 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 24 - "d1Service.ts"
Cohesion: 0.17
Nodes (8): RelatorioTriagemEdtaPrintViewProps, D1Result, DATA_DIR, FallbackDbStructure, LOCAL_DB_PATH, ResultadoSalvarTriagemEdta, SinalImpressaoState, ItemTriagemEdta

### Community 25 - "googleSheets.ts"
Cohesion: 0.18
Nodes (12): GET(), buscarPacientePorProntuario(), emitirSinalImpressaoEdta(), FiltroLaudos, ResultadoSalvarRotina, buscarPacientePorProntuario(), emitirSinalImpressaoEdta(), SHEET_NAME_LAUDOS (+4 more)

### Community 26 - "package.json"
Cohesion: 0.20
Nodes (9): @emnapi/runtime@^1.11.3, pdf-parse@^2.4.5, @types/pdf-parse@^1.1.5, name, private, version, @emnapi/runtime, pdf-parse (+1 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `googleSheets.ts`, `dependencies`, `medicos/route.ts`, `next`, `operadores/route.ts`, `exportadorXmlExtensao.ts`, `getD1Database`, `extratorBancada.ts`, `package.json`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10799319727891156 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `dependencies`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`, `package.json`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `dependencies`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`, `package.json`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `exportadorXmlExtensao.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._