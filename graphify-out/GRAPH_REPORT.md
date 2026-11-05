# Graph Report - Urinalise PWA Automatico  (2026-11-05)

## Corpus Check
- 48 files · ~108,084 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 324 nodes · 786 edges · 23 communities (21 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9c5e39f`
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

## God Nodes (most connected - your core abstractions)
1. `formatarProntuario()` - 24 edges
2. `react` - 23 edges
3. `TriagemEdtaPage()` - 22 edges
4. `next` - 19 edges
5. `LaudoUrina` - 16 edges
6. `lucide-react` - 16 edges
7. `compilerOptions` - 16 edges
8. `getGoogleSheetsClient()` - 15 edges
9. `formatarDataNascimento()` - 13 edges
10. `normalizarProntuario()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `salvarRotinaDia()`  [EXTRACTED]
  src/app/api/rotina/route.ts → src/lib/googleSheets.ts
- `ResultadoSalvarTriagemEdta` --references--> `ItemTriagemEdta`  [EXTRACTED]
  src/lib/googleSheets.ts → src/types/urinalise.ts
- `TriagemEdtaPage()` --calls--> `EdtaOcrScanner()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/components/EdtaOcrScanner.tsx
- `TriagemEdtaPage()` --calls--> `ModalSelecionarOperador()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/components/ModalSelecionarOperador.tsx
- `TriagemEdtaPage()` --calls--> `formatarDataNascimento()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/lib/extratorBancada.ts

## Import Cycles
- None detected.

## Communities (23 total, 2 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.11
Nodes (34): lucide-react, react, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+26 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.25
Nodes (20): TriagemEdtaPage(), DadosPacienteCapturados, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma(), tocarSomConfirmado(), tocarSomHemogramaGlicada() (+12 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.17
Nodes (20): geistMono, geistSans, metadata, RootLayout(), viewport, AppLayoutWrapper(), AppLayoutWrapperProps, Logo() (+12 more)

### Community 3 - "googleSheets.ts"
Cohesion: 0.11
Nodes (19): CABECALHO_LAUDOS, CABECALHO_MEDICOS, CABECALHO_OPERADORES, CABECALHO_ROTINA, CABECALHO_TRIAGEM_EDTA, DEFAULT_CLIENT_EMAIL, DEFAULT_SHEET_ID, extractPrivateKey() (+11 more)

### Community 4 - "package.json"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "listarLaudos"
Cohesion: 0.27
Nodes (10): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+2 more)

### Community 7 - "operadores/route.ts"
Cohesion: 0.43
Nodes (6): dynamic, GET(), POST(), revalidate, listarOperadoresGoogleSheets(), salvarOperadoresGoogleSheets()

### Community 8 - "next"
Cohesion: 0.19
Nodes (10): nextConfig, next, dynamic, GET(), POST(), revalidate, dynamic, POST() (+2 more)

### Community 9 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0, @tailwindcss/postcss@^4.3.3, tesseract.js@^7.0.0 (+4 more)

### Community 10 - "test-sheets/route.ts"
Cohesion: 0.22
Nodes (11): dynamic, GET(), revalidate, dynamic, GET(), revalidate, ensureSheetsExist(), extractSpreadsheetId() (+3 more)

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
Cohesion: 0.14
Nodes (34): dynamic, GET(), POST(), revalidate, RetidosGlicadaPage(), LoteVdrlPage(), EdtaOcrScanner(), EdtaOcrScannerProps (+26 more)

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

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `listarLaudos`, `operadores/route.ts`, `dependencies`, `test-sheets/route.ts`, `extrair-arquivo/route.ts`, `medicos/route.ts`, `extratorBancada.ts`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11054421768707483 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`, `EdtaBarcodeScanner.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._