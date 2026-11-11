# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 53 files · ~116,735 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 365 nodes · 857 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b75bc4fc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- d1Service.ts
- package.json
- compilerOptions
- dependencies
- @tailwindcss/postcss@^4.3.3
- eslint.config.mjs
- urina/page.tsx
- EdtaBarcodeScanner.tsx
- manifest.json
- extratorBancada.ts
- D1PreparedStatement
- TriagemEdtaReal.tsx
- vercel.json
- postcss.config.mjs
- next
- scripts

## God Nodes (most connected - your core abstractions)
1. `react` - 25 edges
2. `getD1Database()` - 23 edges
3. `TriagemEdtaPage()` - 22 edges
4. `formatarProntuario()` - 22 edges
5. `next` - 20 edges
6. `LaudoUrina` - 17 edges
7. `normalizarProntuario()` - 17 edges
8. `lucide-react` - 17 edges
9. `normalizarDataIso()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `listarOperadoresD1()`  [EXTRACTED]
  src/app/api/operadores/route.ts → src/lib/d1Service.ts
- `isGoogleSheetsConfigured()` --calls--> `isD1Configured()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `criarD1LocalDriver()` --calls--> `normalizarProntuario()`  [EXTRACTED]
  src/lib/d1Service.ts → src/lib/extratorBancada.ts
- `GET()` --calls--> `getD1Database()`  [EXTRACTED]
  src/app/api/test-sheets/route.ts → src/lib/d1Service.ts
- `GET()` --calls--> `listarRotinaDia()`  [EXTRACTED]
  src/app/api/paciente/route.ts → src/lib/d1Service.ts

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.10
Nodes (29): lucide-react, react, ConsultaAuditoriaPage(), PainelLaudosPage(), HomeDashboard(), AppLayoutWrapperProps, LaudoPrintViewProps, LinhaBancadaIndividual (+21 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.21
Nodes (23): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+15 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.33
Nodes (13): Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu, Navbar(), adicionarOperador() (+5 more)

### Community 3 - "d1Service.ts"
Cohesion: 0.05
Nodes (62): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+54 more)

### Community 4 - "package.json"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, pdf-parse@^2.4.5, react@19.3.0 (+10 more)

### Community 9 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 11 - "urina/page.tsx"
Cohesion: 0.17
Nodes (19): BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA, LoteVdrlPage(), BarraAcoesTiragem(), MapaBancadaPrintView(), QuickChipSelect(), QuickChipSelectProps (+11 more)

### Community 12 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 15 - "extratorBancada.ts"
Cohesion: 0.12
Nodes (27): dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), RetidosGlicadaPage(), listarTriagemEdta(), salvarTriagemEdta() (+19 more)

### Community 17 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "next"
Cohesion: 0.07
Nodes (28): nextConfig, next, dynamic, GET(), revalidate, dynamic, GET(), POST() (+20 more)

### Community 23 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `dependencies`, `urina/page.tsx`, `extratorBancada.ts`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10083256244218317 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `urina/page.tsx`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `urina/page.tsx`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._