# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 59 files · ~127,389 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 407 nodes · 973 edges · 29 communities (22 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb844de5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- react
- d1Service.ts
- content_conectasus.js
- compilerOptions
- devDependencies
- extrair-arquivo/route.ts
- extensao-chrome/manifest.json
- obterHojeIsoLocal
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
- formatarProntuario
- package.json
- TriagemEdtaReal.tsx
- scripts
- @types/react-dom@^19
- typescript@^5

## God Nodes (most connected - your core abstractions)
1. `obterHojeIsoLocal()` - 31 edges
2. `react` - 26 edges
3. `TriagemEdtaPage()` - 25 edges
4. `formatarProntuario()` - 24 edges
5. `getD1Database()` - 23 edges
6. `next` - 21 edges
7. `normalizarProntuario()` - 18 edges
8. `lucide-react` - 18 edges
9. `normalizarDataIso()` - 17 edges
10. `LaudoUrina` - 17 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/d1Service.ts
- `atualizarStatusItemEdta()` --calls--> `atualizarStatusItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `consumirSinalImpressaoEdta()` --calls--> `consumirSinalImpressaoEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `excluirItemEdta()` --calls--> `excluirItemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `listarTriagemEdta()` --calls--> `listarTriagemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts

## Import Cycles
- None detected.

## Communities (29 total, 7 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.07
Nodes (42): dynamic, POST(), revalidate, ImportarRotinaPage(), LoteVdrlPage(), LaudoPrintViewProps, LinhaBancadaIndividual, MapaBancadaPrintView() (+34 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.21
Nodes (22): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+14 more)

### Community 2 - "react"
Cohesion: 0.10
Nodes (26): nextConfig, lucide-react, next, react, geistMono, geistSans, metadata, RootLayout() (+18 more)

### Community 3 - "d1Service.ts"
Cohesion: 0.11
Nodes (17): dynamic, GET(), POST(), revalidate, D1Result, DATA_DIR, FallbackDbStructure, FiltroLaudos (+9 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.29
Nodes (17): clicarForte(), encontrarBotaoBuscar(), encontrarClicavelPorTexto(), encontrarInputPorRotulo(), esperarPor(), extrairPerfilCabeçalho(), isVisible(), norm() (+9 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "devDependencies"
Cohesion: 0.14
Nodes (14): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.3, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5 (+6 more)

### Community 7 - "extrair-arquivo/route.ts"
Cohesion: 0.29
Nodes (6): pdf-parse@^2.4.5, pdf-parse, dynamic, extractTextFromPdf(), POST(), revalidate

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "obterHojeIsoLocal"
Cohesion: 0.15
Nodes (26): xlsx@^0.18.5, xlsx, ConsultaAuditoriaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA, BarraAcoesTiragem() (+18 more)

### Community 10 - "background.js"
Cohesion: 0.70
Nodes (4): atualizarLog(), iniciarBuscaConectaSus(), localizarAbaConectaSus(), notificarBancada()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "getD1Database"
Cohesion: 0.16
Nodes (16): dynamic, GET(), POST(), revalidate, dynamic, GET(), revalidate, criarD1HttpDriver() (+8 more)

### Community 15 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @emnapi/core@^1.11.3, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0 (+7 more)

### Community 17 - "rotina/route.ts"
Cohesion: 0.17
Nodes (13): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario() (+5 more)

### Community 18 - "googleSheets.ts"
Cohesion: 0.15
Nodes (14): emitirSinalImpressaoEdta(), obterSinalImpressaoEdta(), atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta(), excluirItemEdta(), listarTriagemEdta(), obterSinalImpressaoEdta() (+6 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "laudos/route.ts"
Cohesion: 0.19
Nodes (13): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, isD1Configured() (+5 more)

### Community 23 - "formatarProntuario"
Cohesion: 0.37
Nodes (13): dynamic, GET(), POST(), revalidate, RetidosGlicadaPage(), atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), excluirItemEdta() (+5 more)

### Community 24 - "package.json"
Cohesion: 0.20
Nodes (9): @emnapi/runtime@^1.11.3, tesseract.js@^7.0.0, @types/react@^19, name, private, version, @emnapi/runtime, tesseract.js (+1 more)

### Community 25 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 26 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `react` to `urinalise.ts`, `triagem-edta/page.tsx`, `d1Service.ts`, `extrair-arquivo/route.ts`, `obterHojeIsoLocal`, `getD1Database`, `dependencies`, `rotina/route.ts`, `laudos/route.ts`, `formatarProntuario`, `package.json`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `urinalise.ts`, `triagem-edta/page.tsx`, `obterHojeIsoLocal`, `dependencies`, `package.json`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.10121951219512196 - nodes in this community are weakly interconnected._
- **Why does `obterHojeIsoLocal()` connect `obterHojeIsoLocal` to `urinalise.ts`, `triagem-edta/page.tsx`, `react`, `d1Service.ts`, `rotina/route.ts`, `laudos/route.ts`, `formatarProntuario`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11462450592885376 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._