# Graph Report - Urinalise PWA Automatico  (2026-11-11)

## Corpus Check
- 51 files · ~113,763 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .ico 1, .css 1)

## Summary
- 359 nodes · 849 edges · 25 communities (20 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `144898af`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- urinalise.ts
- triagem-edta/page.tsx
- Navbar.tsx
- googleSheets.ts
- package.json
- compilerOptions
- dependencies
- d1Service.ts
- next
- eslint.config.mjs
- operadores/route.ts
- rotina/route.ts
- EdtaBarcodeScanner.tsx
- manifest.json
- getD1Database
- extratorBancada.ts
- D1PreparedStatement
- TriagemEdtaReal.tsx
- D1Database
- vercel.json
- postcss.config.mjs
- salvarOuAtualizarLaudo
- scripts
- @emnapi/core@^1.11.3

## God Nodes (most connected - your core abstractions)
1. `react` - 23 edges
2. `TriagemEdtaPage()` - 22 edges
3. `formatarProntuario()` - 22 edges
4. `getD1Database()` - 20 edges
5. `next` - 19 edges
6. `LaudoUrina` - 17 edges
7. `normalizarProntuario()` - 17 edges
8. `lucide-react` - 16 edges
9. `normalizarDataIso()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `LoteVdrlPage()` --calls--> `formatarProntuario()`  [EXTRACTED]
  src/app/vdrl/page.tsx → src/lib/extratorBancada.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/laudos/route.ts → src/lib/d1Service.ts
- `GET()` --calls--> `listarRotinaDia()`  [EXTRACTED]
  src/app/api/paciente/route.ts → src/lib/d1Service.ts
- `POST()` --calls--> `salvarOuAtualizarLaudo()`  [EXTRACTED]
  src/app/api/salvar-laudo/route.ts → src/lib/d1Service.ts
- `GET()` --calls--> `isD1Configured()`  [EXTRACTED]
  src/app/api/test-sheets/route.ts → src/lib/d1Service.ts

## Import Cycles
- None detected.

## Communities (25 total, 5 thin omitted)

### Community 0 - "urinalise.ts"
Cohesion: 0.08
Nodes (47): lucide-react, react, xlsx, ConsultaAuditoriaPage(), PainelLaudosPage(), BancadaOperacionalPage(), VALORES_PADRAO_NORMAL, VALORES_SEM_URINA (+39 more)

### Community 1 - "triagem-edta/page.tsx"
Cohesion: 0.20
Nodes (23): TriagemEdtaPage(), DadosPacienteCapturados, EdtaOcrScanner(), EdtaOcrScannerProps, RelatorioTriagemEdtaPrintView(), getAudioContext(), tocarSomApenasGlicada(), tocarSomApenasHemograma() (+15 more)

### Community 2 - "Navbar.tsx"
Cohesion: 0.15
Nodes (22): nextConfig, next, geistMono, geistSans, metadata, RootLayout(), viewport, AppLayoutWrapper() (+14 more)

### Community 3 - "googleSheets.ts"
Cohesion: 0.14
Nodes (24): dynamic, GET(), POST(), revalidate, atualizarStatusItemEdta(), buscarPacientePorProntuario(), consumirSinalImpressaoEdta(), emitirSinalImpressaoEdta() (+16 more)

### Community 4 - "package.json"
Cohesion: 0.15
Nodes (18): devDependencies, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/pdf-parse@^1.1.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+10 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @emnapi/runtime@^1.11.3, googleapis@^188.0.0, lucide-react@^1.61.0, next@16.4.3, pdf-parse@^2.4.5, react@19.3.0, react-dom@19.3.0 (+9 more)

### Community 7 - "d1Service.ts"
Cohesion: 0.12
Nodes (16): dynamic, GET(), POST(), revalidate, D1Result, DATA_DIR, FallbackDbStructure, FiltroLaudos (+8 more)

### Community 8 - "next"
Cohesion: 0.16
Nodes (14): dynamic, GET(), revalidate, dynamic, GET(), POST(), revalidate, dynamic (+6 more)

### Community 9 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 10 - "operadores/route.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET(), POST(), revalidate, listarOperadoresD1(), listarOperadoresGoogleSheets(), salvarOperadoresD1(), salvarOperadoresGoogleSheets() (+2 more)

### Community 11 - "rotina/route.ts"
Cohesion: 0.28
Nodes (8): dynamic, GET(), POST(), revalidate, listarRotinaDia(), salvarRotinaDia(), listarRotinaDia(), salvarRotinaDia()

### Community 12 - "EdtaBarcodeScanner.tsx"
Cohesion: 0.33
Nodes (4): html5-qrcode@^2.3.8, html5-qrcode, EdtaBarcodeScanner(), EdtaBarcodeScannerProps

### Community 13 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 14 - "getD1Database"
Cohesion: 0.40
Nodes (5): dynamic, GET(), revalidate, criarD1LocalDriver(), getD1Database()

### Community 15 - "extratorBancada.ts"
Cohesion: 0.13
Nodes (26): dynamic, extractTextFromPdf(), POST(), revalidate, ImportarRotinaPage(), RetidosGlicadaPage(), RelatorioTriagemEdtaPrintViewProps, ResultadoSalvarTriagemEdta (+18 more)

### Community 17 - "TriagemEdtaReal.tsx"
Cohesion: 0.38
Nodes (6): limparDataNasc(), limparProntuario(), PacienteRotinaEdta, StatusTriagem, TriagemEdtaReal(), TriagemEdtaRealProps

### Community 19 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 22 - "salvarOuAtualizarLaudo"
Cohesion: 0.40
Nodes (5): dynamic, POST(), revalidate, salvarOuAtualizarLaudo(), salvarOuAtualizarLaudo()

### Community 23 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Navbar.tsx` to `urinalise.ts`, `triagem-edta/page.tsx`, `googleSheets.ts`, `package.json`, `dependencies`, `d1Service.ts`, `next`, `operadores/route.ts`, `rotina/route.ts`, `getD1Database`, `extratorBancada.ts`, `salvarOuAtualizarLaudo`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Should `urinalise.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08346134152585766 - nodes in this community are weakly interconnected._
- **Why does `react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `Navbar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1471264367816092 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `urinalise.ts` to `triagem-edta/page.tsx`, `Navbar.tsx`, `package.json`, `dependencies`, `EdtaBarcodeScanner.tsx`, `extratorBancada.ts`, `TriagemEdtaReal.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `googleSheets.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._