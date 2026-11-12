# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 59 files · ~127,257 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 406 nodes · 932 edges · 19 communities (13 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc37ed70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- react
- d1Service.ts
- content_conectasus.js
- compilerOptions
- package.json
- extratorBancada.ts
- extensao-chrome/manifest.json
- D1Database
- background.js
- manifest.json
- D1PreparedStatement
- vercel.json
- postcss.config.mjs
- laudos/route.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 26 edges
2. `formatarProntuario()` - 24 edges
3. `TriagemEdtaPage()` - 23 edges
4. `getD1Database()` - 23 edges
5. `next` - 21 edges
6. `normalizarProntuario()` - 18 edges
7. `lucide-react` - 18 edges
8. `processarJobAtivo()` - 17 edges
9. `LaudoUrina` - 17 edges
10. `normalizarDataIso()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `LoteVdrlPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/vdrl/page.tsx → src/lib/extratorBancada.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/d1Service.ts
- `StatusBadgeProps` --references--> `StatusLaudo`  [EXTRACTED]
  src/components/StatusBadge.tsx → src/types/urinalise.ts
- `ResultadoExtracaoBancada` --references--> `ItemTriagemEdta`  [EXTRACTED]
  src/lib/extratorBancada.ts → src/types/urinalise.ts

## Import Cycles
- None detected.

## Communities (19 total, 6 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.07
Nodes (45): dynamic, POST(), revalidate, ConsultaAuditoriaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+37 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.21
Nodes (22): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+14 more)

### Community 2 - "react"
Cohesion: 0.08
Nodes (32): nextConfig, lucide-react, next, react, geistMono, geistSans, metadata, RootLayout() (+24 more)

### Community 3 - "d1Service.ts"
Cohesion: 0.06
Nodes (76): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+68 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.29
Nodes (17): clicarForte(), encontrarBotaoBuscar(), encontrarClicavelPorTexto(), encontrarInputPorRotulo(), esperarPor(), extrairPerfilCabeçalho(), isVisible(), norm() (+9 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "package.json"
Cohesion: 0.06
Nodes (47): eslintConfig, dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, next@16.4.3 (+39 more)

### Community 7 - "extratorBancada.ts"
Cohesion: 0.10
Nodes (26): pdf-parse@^2.4.5, xlsx@^0.18.5, pdf-parse, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate (+18 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 10 - "background.js"
Cohesion: 0.70
Nodes (4): atualizarLog(), iniciarBuscaConectaSus(), localizarAbaConectaSus(), notificarBancada()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "laudos/route.ts"
Cohesion: 0.16
Nodes (12): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, dynamic (+4 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `react` to `urinalise.ts`, `triagem-edta/page.tsx`, `d1Service.ts`, `package.json`, `extratorBancada.ts`, `laudos/route.ts`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07191961924907457 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `urinalise.ts`, `triagem-edta/page.tsx`, `d1Service.ts`, `package.json`, `extratorBancada.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `urinalise.ts`, `triagem-edta/page.tsx`, `d1Service.ts`, `package.json`, `extratorBancada.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05747126436781609 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._