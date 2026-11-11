# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 53 files · ~116,030 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 364 nodes · 853 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5fd92444`
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
- AppLayoutWrapper.tsx
- @tailwindcss/postcss@^4.3.3
- eslint.config.mjs
- exportadorXmlExtensao.ts
- EdtaBarcodeScanner.tsx
- manifest.json
- extratorBancada.ts
- D1PreparedStatement
- TriagemEdtaReal.tsx
- D1Database
- vercel.json
- postcss.config.mjs
- next
- scripts

## God Nodes (most connected - your core abstractions)
1. `react` - 25 edges
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
- `BancadaOperacionalPage()` --calls--> `baixarXlsxUrinalise()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/exportadorXmlExtensao.ts
- `BancadaOperacionalPage()` --calls--> `baixarXmlUrinalise()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/exportadorXmlExtensao.ts
- `BancadaOperacionalPage()` --calls--> `gerarStringXmlUrinalise()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/exportadorXmlExtensao.ts
- `BancadaOperacionalPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/urina/page.tsx → src/lib/extratorBancada.ts
- `StatusBadgeProps` --references--> `StatusLaudo`  [EXTRACTED]
  src/components/StatusBadge.tsx → src/types/urinalise.ts

## Import Cycles
- None detected.

## Communities (22 total, 6 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.11
Nodes (33): lucide-react, react, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), HomeDashboard(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL (+25 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.21
Nodes (23): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+15 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.33
Nodes (13): Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu, Navbar(), adicionarOperador() (+5 more)

### Community 3 - "d1Service.ts"
Cohesion: 0.05
Nodes (67): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+59 more)

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

### Community 11 - "exportadorXmlExtensao.ts"
Cohesion: 0.20
Nodes (14): baixarXlsxUrinalise(), baixarXmlUrinalise(), escaparXml(), estaNoIntervaloData(), extrairNumero(), formatarDataPtBr(), gerarStringXmlUrinalise(), ItemXmlUrinalise (+6 more)

### Community 12 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 15 - "extratorBancada.ts"
Cohesion: 0.15
Nodes (23): dynamic, extractTextFromPdf(), POST(), revalidate, RetidosGlicadaPage(), LoteVdrlPage(), salvarTriagemEdta(), aplicarFlagsExamesNoItem() (+15 more)

### Community 17 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "next"
Cohesion: 0.08
Nodes (25): nextConfig, next, dynamic, GET(), revalidate, dynamic, GET(), POST() (+17 more)

### Community 23 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `dependencies`, `extratorBancada.ts`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10745098039215686 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `AppLayoutWrapper.tsx`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052614052614052616 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._