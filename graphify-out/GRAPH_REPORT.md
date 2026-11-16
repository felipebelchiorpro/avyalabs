# Graph Report - Urinalise PWA Automatico  (2026-11-16)

## Corpus Check
- 60 files · ~133,087 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 408 nodes · 977 edges · 24 communities (19 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20ade3d3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- importar/page.tsx
- triagem-edta/page.tsx
- content_conectasus.js
- compilerOptions
- devDependencies
- extensao-chrome/manifest.json
- urinalise.ts
- background.js
- manifest.json
- dependencies
- D1PreparedStatement
- d1Service.ts
- vercel.json
- postcss.config.mjs
- next
- package.json
- scripts
- eslint.config.mjs
- EdtaBarcodeScanner.tsx
- TriagemEdtaReal.tsx
- lucide-react

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
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/d1Service.ts
- `RelatorioTriagemEdtaPrintViewProps` --references--> `LabConfig`  [EXTRACTED]
  src/components/RelatorioTriagemEdtaPrintView.tsx → src/types/urinalise.ts
- `StatusBadgeProps` --references--> `StatusLaudo`  [EXTRACTED]
  src/components/StatusBadge.tsx → src/types/urinalise.ts
- `ResultadoSalvarTriagemEdta` --references--> `ItemTriagemEdta`  [EXTRACTED]
  src/lib/d1Service.ts → src/types/urinalise.ts

## Import Cycles
- None detected.

## Communities (24 total, 5 thin omitted)

### Community 0 - "importar/page.tsx"
Cohesion: 0.14
Nodes (14): xlsx@^0.18.5, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), MapaBancadaPrintView() (+6 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.13
Nodes (34): RetidosGlicadaPage(), TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), RelatorioTriagemEdtaPrintViewProps, getAudioContext() (+26 more)

### Community 4 - "content_conectasus.js"
Cohesion: 0.40
Nodes (9): aguardarElemento(), classificarDestinoExame(), criarNovoAgendamentoNoConectaSus(), executarFluxoCompletoConectaSus(), iniciarObservadorSupervisor(), procurarJwtEmStorage(), simularClique(), simularInput() (+1 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19, typescript@^5, tailwindcss (+5 more)

### Community 8 - "extensao-chrome/manifest.json"
Cohesion: 0.15
Nodes (12): action, default_popup, default_title, background, service_worker, content_scripts, description, host_permissions (+4 more)

### Community 9 - "urinalise.ts"
Cohesion: 0.09
Nodes (42): react, ConsultaAuditoriaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA, AppLayoutWrapperProps, BarraAcoesTiragem() (+34 more)

### Community 10 - "background.js"
Cohesion: 0.50
Nodes (8): atualizarLog(), consultarConectaSusPorApi(), extrairPacienteIdDaLinha(), iniciarBuscaConectaSus(), localizarAbaConectaSus(), normPront(), notificarBancada(), obterTokenSessao()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 15 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @emnapi/core@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0, @tailwindcss/postcss@^4.3.3 (+6 more)

### Community 17 - "d1Service.ts"
Cohesion: 0.06
Nodes (72): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+64 more)

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 23 - "next"
Cohesion: 0.07
Nodes (29): nextConfig, next, dynamic, GET(), revalidate, dynamic, GET(), POST() (+21 more)

### Community 25 - "package.json"
Cohesion: 0.20
Nodes (9): @emnapi/runtime@^1.11.3, pdf-parse@^2.4.5, @types/pdf-parse@^1.1.5, name, private, version, @emnapi/runtime, pdf-parse (+1 more)

### Community 26 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 27 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 28 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 29 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 30 - "lucide-react"
Cohesion: 0.21
Nodes (18): lucide-react, classificarExame(), ExameClassificado, LaboratorioApoioPage(), RegistroTriagemAutomatica, Logo(), LogoProps, ModalSelecionarOperador() (+10 more)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `importar/page.tsx`, `triagem-edta/page.tsx`, `urinalise.ts`, `dependencies`, `d1Service.ts`, `package.json`, `lucide-react`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Should `importar/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `importar/page.tsx`, `triagem-edta/page.tsx`, `dependencies`, `d1Service.ts`, `next`, `package.json`, `EdtaBarcodeScanner.tsx`, `TriagemEdtaReal.tsx`, `lucide-react`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `triagem-edta/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13356562137049943 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `importar/page.tsx`, `triagem-edta/page.tsx`, `urinalise.ts`, `dependencies`, `d1Service.ts`, `next`, `package.json`, `EdtaBarcodeScanner.tsx`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0852994555353902 - nodes in this community are weakly interconnected._