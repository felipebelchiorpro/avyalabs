# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 59 files · ~124,233 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 404 nodes · 927 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7529f4ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- d1Service.ts
- content_conectasus.js
- compilerOptions
- package.json
- extratorBancada.ts
- extensao-chrome/manifest.json
- layout.tsx
- background.js
- manifest.json
- D1PreparedStatement
- TriagemEdtaReal.tsx
- vercel.json
- postcss.config.mjs
- next

## God Nodes (most connected - your core abstractions)
1. `react` - 26 edges
2. `formatarProntuario()` - 24 edges
3. `TriagemEdtaPage()` - 23 edges
4. `getD1Database()` - 23 edges
5. `next` - 21 edges
6. `normalizarProntuario()` - 18 edges
7. `lucide-react` - 18 edges
8. `LaudoUrina` - 17 edges
9. `normalizarDataIso()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `salvarRotinaDia()`  [EXTRACTED]
  src/app/api/rotina/route.ts → src/lib/d1Service.ts
- `LoteVdrlPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/vdrl/page.tsx → src/lib/extratorBancada.ts
- `TriagemEdtaPage()` --calls--> `ModalSelecionarOperador()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/components/ModalSelecionarOperador.tsx
- `TriagemEdtaPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/lib/extratorBancada.ts
- `TriagemEdtaPage()` --calls--> `normalizarProntuario()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/lib/extratorBancada.ts

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.07
Nodes (43): xlsx@^0.18.5, xlsx, ConsultaAuditoriaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA, LoteVdrlPage() (+35 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.12
Nodes (30): lucide-react, react, HomeDashboard(), TriagemEdtaPage(), AppLayoutWrapperProps, DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps (+22 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.33
Nodes (13): Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu, Navbar(), adicionarOperador() (+5 more)

### Community 3 - "d1Service.ts"
Cohesion: 0.06
Nodes (70): POST(), dynamic, GET(), POST(), revalidate, dynamic, GET(), POST() (+62 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.33
Nodes (15): encontrarBotaoBuscar(), encontrarClicavelPorTexto(), encontrarInputPorRotulo(), esperarPor(), extrairPerfilCabeçalho(), isVisible(), norm(), normPront() (+7 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "package.json"
Cohesion: 0.05
Nodes (48): eslintConfig, dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, next@16.4.3 (+40 more)

### Community 7 - "extratorBancada.ts"
Cohesion: 0.14
Nodes (20): pdf-parse@^2.4.5, pdf-parse, dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), MapaBancadaPrintView() (+12 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "layout.tsx"
Cohesion: 0.29
Nodes (6): geistMono, geistSans, metadata, RootLayout(), viewport, SidebarLateral()

### Community 10 - "background.js"
Cohesion: 0.70
Nodes (4): atualizarLog(), iniciarBuscaConectaSus(), localizarAbaConectaSus(), notificarBancada()

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
Cohesion: 0.10
Nodes (24): nextConfig, next, dynamic, GET(), revalidate, dynamic, GET(), revalidate (+16 more)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `extratorBancada.ts`, `layout.tsx`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07456140350877193 - nodes in this community are weakly interconnected._
- **Why does `react` connect `triagem-edta/page.tsx` to `urinalise.ts`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `triagem-edta/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11738648947951273 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `triagem-edta/page.tsx` to `urinalise.ts`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06049382716049383 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._