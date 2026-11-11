# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 54 files · ~119,549 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 367 nodes · 868 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `092fd1d4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- d1Service.ts
- compilerOptions
- package.json
- extratorBancada.ts
- D1Database
- exportadorXmlExtensao.ts
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
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarTriagemEdta()`  [EXTRACTED]
  src/app/api/extrair-arquivo/route.ts → src/lib/d1Service.ts
- `ImportarRotinaPage()` --calls--> `processarMatrizLinhasBancada()`  [EXTRACTED]
  src/app/importar/page.tsx → src/lib/extratorBancada.ts
- `TriagemEdtaPage()` --calls--> `ModalSelecionarOperador()`  [EXTRACTED]
  src/app/triagem-edta/page.tsx → src/components/ModalSelecionarOperador.tsx

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.09
Nodes (35): lucide-react, react, ConsultaAuditoriaPage(), ImportarRotinaPage(), PainelLaudosPage(), HomeDashboard(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+27 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.21
Nodes (22): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+14 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.33
Nodes (13): Logo(), LogoProps, ModalSelecionarOperador(), ModalSelecionarOperadorProps, GrupoMenu, ItemMenu, Navbar(), adicionarOperador() (+5 more)

### Community 3 - "d1Service.ts"
Cohesion: 0.06
Nodes (77): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+69 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "package.json"
Cohesion: 0.05
Nodes (48): eslintConfig, dependencies, @emnapi/core@^1.11.3, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, next@16.4.3 (+40 more)

### Community 7 - "extratorBancada.ts"
Cohesion: 0.12
Nodes (22): pdf-parse@^2.4.5, xlsx@^0.18.5, pdf-parse, xlsx, dynamic, extractTextFromPdf(), POST(), revalidate (+14 more)

### Community 11 - "exportadorXmlExtensao.ts"
Cohesion: 0.29
Nodes (12): BancadaOperacionalPage(), BarraAcoesTiragem(), baixarXlsxUrinalise(), baixarXmlUrinalise(), escaparXml(), estaNoIntervaloData(), extrairNumero(), formatarDataPtBr() (+4 more)

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

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `extratorBancada.ts`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08766233766233766 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `TriagemEdtaReal.tsx`, `next`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `d1Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055669050051072526 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `d1Service.ts`, `package.json`, `TriagemEdtaReal.tsx`, `next`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._