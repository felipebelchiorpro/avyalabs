# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 51 files · ~112,469 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 355 nodes · 843 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e55d9e88`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- googleSheets.ts
- package.json
- compilerOptions
- app/page.tsx
- d1Service.ts
- next
- medicos/route.ts
- operadores/route.ts
- rotina/route.ts
- listarLaudos
- manifest.json
- getD1Database
- extratorBancada.ts
- D1PreparedStatement
- TriagemEdtaReal.tsx
- D1Database
- vercel.json
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `react` - 23 edges
2. `TriagemEdtaPage()` - 22 edges
3. `formatarProntuario()` - 22 edges
4. `getD1Database()` - 20 edges
5. `next` - 19 edges
6. `LaudoUrina` - 17 edges
7. `normalizarProntuario()` - 17 edges
8. `normalizarDataIso()` - 16 edges
9. `lucide-react` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `salvarTriagemEdta()` --calls--> `salvarTriagemEdta()`  [EXTRACTED]
  src/lib/googleSheets.ts → src/lib/d1Service.ts
- `GET()` --calls--> `listarLaudos()`  [EXTRACTED]
  src/app/api/laudos-dia/route.ts → src/lib/d1Service.ts
- `GET()` --calls--> `listarLaudos()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `GET()` --calls--> `listarMedicosD1()`  [EXTRACTED]
  src/app/api/medicos/route.ts → src/lib/d1Service.ts

## Import Cycles
- None detected.

## Communities (22 total, 4 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.11
Nodes (28): react, ConsultaAuditoriaPage(), PainelLaudosPage(), LaudoPrintViewProps, QuickChipSelect(), QuickChipSelectProps, extrairInfoRecoleta(), pacienteTemUrina() (+20 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.21
Nodes (23): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+15 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.16
Nodes (21): lucide-react, geistMono, geistSans, metadata, RootLayout(), viewport, AppLayoutWrapper(), AppLayoutWrapperProps (+13 more)

### Community 3 - "googleSheets.ts"
Cohesion: 0.15
Nodes (22): dynamic, GET(), POST(), revalidate, atualizarStatusItemEdta(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta(), excluirItemEdta() (+14 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (46): eslintConfig, dependencies, googleapis@^188.0.0, html5-qrcode@^2.3.8, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0 (+38 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "app/page.tsx"
Cohesion: 0.28
Nodes (13): BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA, baixarXlsxUrinalise(), baixarXmlUrinalise(), escaparXml(), estaNoIntervaloData(), extrairNumero() (+5 more)

### Community 7 - "d1Service.ts"
Cohesion: 0.17
Nodes (7): D1Result, DATA_DIR, FallbackDbStructure, FiltroLaudos, LOCAL_DB_PATH, ResultadoSalvarRotina, SinalImpressaoState

### Community 8 - "next"
Cohesion: 0.13
Nodes (16): nextConfig, next, dynamic, GET(), revalidate, dynamic, GET(), POST() (+8 more)

### Community 9 - "medicos/route.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), POST(), revalidate, listarMedicosD1(), listarMedicosGoogleSheets(), salvarMedicosD1(), salvarMedicosGoogleSheets() (+2 more)

### Community 10 - "operadores/route.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), POST(), revalidate, listarOperadoresD1(), listarOperadoresGoogleSheets(), salvarOperadoresD1(), salvarOperadoresGoogleSheets() (+2 more)

### Community 11 - "rotina/route.ts"
Cohesion: 0.28
Nodes (8): dynamic, GET(), POST(), revalidate, buscarPacientePorProntuario(), salvarRotinaDia(), buscarPacientePorProntuario(), salvarRotinaDia()

### Community 12 - "listarLaudos"
Cohesion: 0.32
Nodes (7): dynamic, GET(), revalidate, listarLaudos(), listarRotinaDia(), listarLaudos(), listarRotinaDia()

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "getD1Database"
Cohesion: 0.40
Nodes (5): dynamic, GET(), revalidate, criarD1LocalDriver(), getD1Database()

### Community 15 - "extratorBancada.ts"
Cohesion: 0.11
Nodes (31): pdf-parse@^2.4.5, pdf-parse, dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), RetidosGlicadaPage() (+23 more)

### Community 17 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `triagem-edta/page.tsx`, `Navbar.tsx`, `googleSheets.ts`, `package.json`, `app/page.tsx`, `medicos/route.ts`, `operadores/route.ts`, `rotina/route.ts`, `listarLaudos`, `getD1Database`, `extratorBancada.ts`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11025641025641025 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `app/page.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14855072463768115 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Navbar.tsx` to `urinalise.ts`, `triagem-edta/page.tsx`, `package.json`, `app/page.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.053061224489795916 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._