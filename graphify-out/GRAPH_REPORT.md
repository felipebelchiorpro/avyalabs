# Graph Report - Urinalise PWA Automatico  (2026-11-05)

## Corpus Check
- 49 files · ~109,422 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 333 nodes · 806 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `53f8ff07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- googleSheets.ts
- package.json
- compilerOptions
- next
- manifest.json
- extratorBancada.ts
- TriagemEdtaReal.tsx
- vercel.json
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `formatarProntuario()` - 24 edges
2. `react` - 23 edges
3. `TriagemEdtaPage()` - 22 edges
4. `next` - 19 edges
5. `LaudoUrina` - 16 edges
6. `lucide-react` - 16 edges
7. `compilerOptions` - 16 edges
8. `getGoogleSheetsClient()` - 15 edges
9. `listarRotinaDia()` - 14 edges
10. `listarTriagemEdta()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/googleSheets.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/googleSheets.ts
- `LoteVdrlPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/vdrl/page.tsx → src/lib/extratorBancada.ts
- `GET()` --calls--> `ensureSheetsExist()`  [EXTRACTED]
  src/app/api/test-sheets/route.ts → src/lib/googleSheets.ts
- `listarLaudos()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/extratorBancada.ts

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.09
Nodes (41): lucide-react, react, ConsultaAuditoriaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA, LoteVdrlPage() (+33 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.21
Nodes (22): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+14 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.17
Nodes (20): geistMono, geistSans, metadata, RootLayout(), viewport, AppLayoutWrapper(), AppLayoutWrapperProps, Logo() (+12 more)

### Community 3 - "googleSheets.ts"
Cohesion: 0.07
Nodes (59): dynamic, GET(), POST(), revalidate, dynamic, GET(), POST(), revalidate (+51 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (47): eslintConfig, dependencies, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, next@16.4.3, pdf-parse@^2.4.5, react@19.3.0 (+39 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "next"
Cohesion: 0.09
Nodes (24): nextConfig, next, dynamic, GET(), revalidate, dynamic, GET(), POST() (+16 more)

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 15 - "extratorBancada.ts"
Cohesion: 0.10
Nodes (26): dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), RetidosGlicadaPage(), RelatorioTriagemEdtaPrintViewProps, classificarExameBancada() (+18 more)

### Community 17 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `urinalise.ts`, `triagem-edta/page.tsx`, `Navbar.tsx`, `googleSheets.ts`, `package.json`, `extratorBancada.ts`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09147869674185463 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07272727272727272 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.055272108843537414 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._