# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 54 files · ~118,444 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 367 nodes · 867 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a9dd7b49`
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
- package.json
- D1Database
- eslint.config.mjs
- AppLayoutWrapper.tsx
- exportadorXmlExtensao.ts
- EdtaBarcodeScanner.tsx
- manifest.json
- D1PreparedStatement
- TriagemEdtaReal.tsx
- vercel.json
- postcss.config.mjs
- next
- scripts

## God Nodes (most connected - your core abstractions)
1. `react` - 26 edges
2. `getD1Database()` - 23 edges
3. `formatarProntuario()` - 23 edges
4. `TriagemEdtaPage()` - 22 edges
5. `next` - 21 edges
6. `normalizarProntuario()` - 18 edges
7. `lucide-react` - 18 edges
8. `LaudoUrina` - 17 edges
9. `normalizarDataIso()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/d1Service.ts
- `TriagemEdtaPage()` --calls--> `ModalSelecionarOperador()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/components/ModalSelecionarOperador.tsx
- `TriagemEdtaPage()` --calls--> `normalizarProntuario()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/lib/extratorBancada.ts
- `TriagemEdtaPage()` --calls--> `obterOperadorAtivo()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/lib/operadoresStore.ts

## Import Cycles
- None detected.

## Communities (21 total, 5 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.09
Nodes (36): lucide-react, react, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), HomeDashboard(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL (+28 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.13
Nodes (36): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+28 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.33
Nodes (13): Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu, Navbar(), adicionarOperador() (+5 more)

### Community 3 - "d1Service.ts"
Cohesion: 0.06
Nodes (77): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+69 more)

### Community 4 - "package.json"
Cohesion: 0.15
Nodes (13): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19, typescript@^5, tailwindcss (+5 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @emnapi/core@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0, @tailwindcss/postcss@^4.3.3 (+6 more)

### Community 7 - "package.json"
Cohesion: 0.20
Nodes (9): @emnapi/runtime@^1.11.3, pdf-parse@^2.4.5, @types/pdf-parse@^1.1.5, name, private, version, @emnapi/runtime, pdf-parse (+1 more)

### Community 9 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 11 - "exportadorXmlExtensao.ts"
Cohesion: 0.16
Nodes (16): xlsx@^0.18.5, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate, baixarXlsxUrinalise(), baixarXmlUrinalise() (+8 more)

### Community 12 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

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
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `dependencies`, `package.json`, `exportadorXmlExtensao.ts`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0936026936026936 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `dependencies`, `package.json`, `AppLayoutWrapper.tsx`, `EdtaBarcodeScanner.tsx`, `TriagemEdtaReal.tsx`, `next`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `triagem-edta/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1254355400696864 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `dependencies`, `package.json`, `EdtaBarcodeScanner.tsx`, `TriagemEdtaReal.tsx`, `next`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05541368743615935 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._