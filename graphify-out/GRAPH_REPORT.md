# Graph Report - Urinalise PWA Automatico  (2026-11-05)

## Corpus Check
- 49 files · ~108,465 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 330 nodes · 799 edges · 24 communities (22 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b0545a0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- googleSheets.ts
- package.json
- compilerOptions
- listarLaudos
- operadores/route.ts
- next
- dependencies
- test-sheets/route.ts
- exportadorXmlExtensao.ts
- extrair-arquivo/route.ts
- manifest.json
- medicos/route.ts
- extratorBancada.ts
- eslint.config.mjs
- TriagemEdtaReal.tsx
- scripts
- vercel.json
- postcss.config.mjs
- EdtaBarcodeScanner.tsx
- listarLaudos

## God Nodes (most connected - your core abstractions)
1. `formatarProntuario()` - 24 edges
2. `react` - 23 edges
3. `TriagemEdtaPage()` - 22 edges
4. `next` - 19 edges
5. `LaudoUrina` - 16 edges
6. `lucide-react` - 16 edges
7. `compilerOptions` - 16 edges
8. `getGoogleSheetsClient()` - 15 edges
9. `listarTriagemEdta()` - 14 edges
10. `salvarTriagemEdta()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ResultadoSalvarTriagemEdta` --references--> `ItemTriagemEdta`  [EXTRACTED]
  src/lib/googleSheets.ts → src/types/urinalise.ts
- `RetidosGlicadaPage()` --calls--> `normalizarDataIso()`  [EXTRACTED]
  src/app/retidos-glicada/page.tsx → src/lib/extratorBancada.ts
- `GET()` --calls--> `isGoogleSheetsConfigured()`  [EXTRACTED]
  src/app/api/test-sheets/route.ts → src/lib/googleSheets.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/googleSheets.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/googleSheets.ts

## Import Cycles
- None detected.

## Communities (24 total, 2 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.11
Nodes (35): lucide-react, react, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+27 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.31
Nodes (17): TriagemEdtaPage(), RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma(), tocarSomConfirmado(), tocarSomHemogramaGlicada(), tocarSomNaoEncontrado() (+9 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.17
Nodes (20): geistMono, geistSans, metadata, RootLayout(), viewport, AppLayoutWrapper(), AppLayoutWrapperProps, Logo() (+12 more)

### Community 3 - "googleSheets.ts"
Cohesion: 0.08
Nodes (22): CABECALHO_LAUDOS, CABECALHO_MEDICOS, CABECALHO_OPERADORES, CABECALHO_ROTINA, CABECALHO_TRIAGEM_EDTA, DATA_DIR, DEFAULT_CLIENT_EMAIL, DEFAULT_SHEET_ID (+14 more)

### Community 4 - "package.json"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "listarLaudos"
Cohesion: 0.24
Nodes (10): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+2 more)

### Community 7 - "operadores/route.ts"
Cohesion: 0.43
Nodes (6): dynamic, GET(), POST(), revalidate, listarOperadoresGoogleSheets(), salvarOperadoresGoogleSheets()

### Community 8 - "next"
Cohesion: 0.21
Nodes (9): nextConfig, next, dynamic, POST(), revalidate, dynamic, POST(), revalidate (+1 more)

### Community 9 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0, @tailwindcss/postcss@^4.3.3, tesseract.js@^7.0.0 (+4 more)

### Community 10 - "test-sheets/route.ts"
Cohesion: 0.32
Nodes (7): dynamic, GET(), revalidate, ensureSheetsExist(), extractSpreadsheetId(), getGoogleSheetsCredentials(), indexParaColunaA1()

### Community 11 - "exportadorXmlExtensao.ts"
Cohesion: 0.35
Nodes (10): baixarXlsxUrinalise(), baixarXmlUrinalise(), escaparXml(), estaNoIntervaloData(), extrairNumero(), formatarDataPtBr(), gerarStringXmlUrinalise(), ItemXmlUrinalise (+2 more)

### Community 12 - "extrair-arquivo/route.ts"
Cohesion: 0.22
Nodes (8): pdf-parse@^2.4.5, xlsx@^0.18.5, pdf-parse, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "medicos/route.ts"
Cohesion: 0.43
Nodes (6): dynamic, GET(), POST(), revalidate, listarMedicosGoogleSheets(), salvarMedicosGoogleSheets()

### Community 15 - "extratorBancada.ts"
Cohesion: 0.13
Nodes (36): dynamic, GET(), POST(), revalidate, RetidosGlicadaPage(), LoteVdrlPage(), DadosPacienteCapturados, EdtaOcrScanner() (+28 more)

### Community 16 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 17 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 18 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 23 - "listarLaudos"
Cohesion: 0.43
Nodes (6): dynamic, GET(), revalidate, GET(), isGoogleSheetsConfigured(), listarLaudos()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `listarLaudos`, `operadores/route.ts`, `dependencies`, `test-sheets/route.ts`, `extrair-arquivo/route.ts`, `medicos/route.ts`, `extratorBancada.ts`, `listarLaudos`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10666666666666667 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._