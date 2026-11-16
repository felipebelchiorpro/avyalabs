# Graph Report - Urinalise PWA Automatico  (2026-11-16)

## Corpus Check
- 60 files · ~137,786 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 414 nodes · 993 edges · 27 communities (20 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b98d8dde`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModalSelecionarOperador.tsx
- triagem-edta/page.tsx
- extrair-arquivo/route.ts
- D1PreparedStatement
- content_conectasus.js
- compilerOptions
- D1Database
- urina/page.tsx
- extensao-chrome/manifest.json
- urinalise.ts
- background.js
- manifest.json
- layout.tsx
- package.json
- dependencies
- d1Service.ts
- eslint.config.mjs
- vercel.json
- postcss.config.mjs
- EdtaBarcodeScanner.tsx
- next
- scripts
- AppLayoutWrapper.tsx
- TriagemEdtaReal.tsx

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
- `POST()` --calls--> `salvarRotinaDia()`  [EXTRACTED]
  src/app/api/rotina/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `StatusBadgeProps` --references--> `StatusLaudo`  [EXTRACTED]
  src/components/StatusBadge.tsx → src/types/urinalise.ts
- `ResultadoSalvarTriagemEdta` --references--> `ItemTriagemEdta`  [EXTRACTED]
  src/lib/d1Service.ts → src/types/urinalise.ts
- `TriagemEdtaPage()` --calls--> `ModalSelecionarOperador()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/components/ModalSelecionarOperador.tsx

## Import Cycles
- None detected.

## Communities (27 total, 7 thin omitted)

### Community 0 - "ModalSelecionarOperador.tsx"
Cohesion: 0.33
Nodes (13): Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu, Navbar(), adicionarOperador() (+5 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.18
Nodes (26): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+18 more)

### Community 2 - "extrair-arquivo/route.ts"
Cohesion: 0.20
Nodes (10): pdf-parse@^2.4.5, xlsx@^0.18.5, pdf-parse, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate (+2 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.29
Nodes (15): atualizarHud(), classificarDestinoExame(), clicarDiaNoCalendario(), criarNovoAgendamentoNoConectaSus(), executarApenasMudancaLaboratorio(), executarFluxoCompletoConectaSus(), extrairDadosDaLinhaAgendamento(), gravarLog() (+7 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "urina/page.tsx"
Cohesion: 0.26
Nodes (12): BancadaOperacionalPage(), BarraAcoesTiragem(), baixarXlsxUrinalise(), baixarXmlUrinalise(), escaparXml(), estaNoIntervaloData(), extrairNumero(), formatarDataPtBr() (+4 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "urinalise.ts"
Cohesion: 0.09
Nodes (46): lucide-react, react, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), HomeDashboard(), RetidosGlicadaPage(), VALORES_PADRAO_NORMAL (+38 more)

### Community 10 - "background.js"
Cohesion: 0.46
Nodes (6): atualizarLog(), executarApoioConectaSus(), garantirContentScriptInjetado(), localizarAbaConectaSus(), notificarTodasAbasBancadaLab(), obterTokenSessao()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "layout.tsx"
Cohesion: 0.29
Nodes (6): geistMono, geistSans, metadata, RootLayout(), viewport, SidebarLateral()

### Community 15 - "package.json"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 16 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, react@19.3.0, react-dom@19.3.0, @tailwindcss/postcss@^4.3.3 (+7 more)

### Community 17 - "d1Service.ts"
Cohesion: 0.06
Nodes (68): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+60 more)

### Community 18 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 23 - "next"
Cohesion: 0.07
Nodes (28): nextConfig, next@16.4.3, next, dynamic, GET(), revalidate, dynamic, GET() (+20 more)

### Community 24 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 29 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `ModalSelecionarOperador.tsx`, `triagem-edta/page.tsx`, `extrair-arquivo/route.ts`, `urinalise.ts`, `layout.tsx`, `package.json`, `d1Service.ts`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `ModalSelecionarOperador.tsx`, `triagem-edta/page.tsx`, `urina/page.tsx`, `package.json`, `dependencies`, `EdtaBarcodeScanner.tsx`, `next`, `AppLayoutWrapper.tsx`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08593396653098145 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `ModalSelecionarOperador.tsx`, `triagem-edta/page.tsx`, `package.json`, `dependencies`, `EdtaBarcodeScanner.tsx`, `next`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._