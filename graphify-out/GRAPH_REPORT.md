# Graph Report - Urinalise PWA Automatico  (2026-11-19)

## Corpus Check
- 60 files · ~143,151 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 418 nodes · 1011 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec9ad14e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModalSelecionarOperador.tsx
- triagem-edta/page.tsx
- extratorBancada.ts
- D1PreparedStatement
- content_conectasus.js
- compilerOptions
- extensao-chrome/manifest.json
- urinalise.ts
- background.js
- manifest.json
- package.json
- d1Service.ts
- vercel.json
- postcss.config.mjs
- listarLaudos

## God Nodes (most connected - your core abstractions)
1. `obterHojeIsoLocal()` - 31 edges
2. `react` - 27 edges
3. `TriagemEdtaPage()` - 25 edges
4. `formatarProntuario()` - 24 edges
5. `getD1Database()` - 23 edges
6. `next` - 22 edges
7. `normalizarDataIso()` - 21 edges
8. `normalizarProntuario()` - 20 edges
9. `lucide-react` - 19 edges
10. `LaudoUrina` - 17 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/d1Service.ts
- `LoteVdrlPage()` --calls--> `obterOntemIsoLocal()`  [EXTRACTED]
  src/app/vdrl/page.tsx → src/lib/extratorBancada.ts
- `RelatorioTriagemEdtaPrintViewProps` --references--> `LabConfig`  [EXTRACTED]
  src/components/RelatorioTriagemEdtaPrintView.tsx → src/types/urinalise.ts
- `ResultadoSalvarTriagemEdta` --references--> `ItemTriagemEdta`  [EXTRACTED]
  src/lib/d1Service.ts → src/types/urinalise.ts

## Import Cycles
- None detected.

## Communities (18 total, 5 thin omitted)

### Community 0 - "ModalSelecionarOperador.tsx"
Cohesion: 0.09
Nodes (26): lucide-react, react, ExameClassificado, RegistroTriagemAutomatica, HomeDashboard(), AppLayoutWrapperProps, EdtaBarcodeScannerProps, Logo() (+18 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.18
Nodes (25): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), RelatorioTriagemEdtaPrintViewProps, getAudioContext(), tocarSomApenasGlicada() (+17 more)

### Community 2 - "extratorBancada.ts"
Cohesion: 0.11
Nodes (25): pdf-parse@^2.4.5, xlsx@^0.18.5, pdf-parse, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate (+17 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.26
Nodes (18): atualizarHud(), classificarDestinoExame(), clicarDiaNoCalendario(), criarNovoAgendamentoNoConectaSus(), executarApenasMudancaLaboratorio(), executarApoioViaApiDireta(), executarFluxoCompletoConectaSus(), extrairDadosDaLinhaAgendamento() (+10 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "urinalise.ts"
Cohesion: 0.08
Nodes (42): dynamic, POST(), revalidate, ConsultaAuditoriaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+34 more)

### Community 10 - "background.js"
Cohesion: 0.50
Nodes (7): atualizarLog(), executarApoioConectaSus(), executarInjecaoLoteConectaSus(), garantirContentScriptInjetado(), localizarAbaConectaSus(), notificarTodasAbasBancadaLab(), obterTokenSessao()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 15 - "package.json"
Cohesion: 0.06
Nodes (47): eslintConfig, dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, next@16.4.3 (+39 more)

### Community 17 - "d1Service.ts"
Cohesion: 0.06
Nodes (73): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+65 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 23 - "listarLaudos"
Cohesion: 0.09
Nodes (25): nextConfig, next, dynamic, GET(), revalidate, dynamic, GET(), POST() (+17 more)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `listarLaudos` to `ModalSelecionarOperador.tsx`, `triagem-edta/page.tsx`, `extratorBancada.ts`, `urinalise.ts`, `package.json`, `d1Service.ts`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Should `ModalSelecionarOperador.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09291521486643438 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ModalSelecionarOperador.tsx` to `triagem-edta/page.tsx`, `extratorBancada.ts`, `urinalise.ts`, `package.json`, `d1Service.ts`, `listarLaudos`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `extratorBancada.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10574712643678161 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `ModalSelecionarOperador.tsx` to `triagem-edta/page.tsx`, `extratorBancada.ts`, `urinalise.ts`, `package.json`, `d1Service.ts`, `listarLaudos`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08417508417508418 - nodes in this community are weakly interconnected._