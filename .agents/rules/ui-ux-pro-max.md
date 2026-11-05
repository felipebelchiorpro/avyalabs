---
trigger: always_on
description: UI/UX Pro Max design intelligence system - Diretrizes visuais, acessibilidade e design system para interfaces.
---

## REGRA MANDATÓRIA: UI/UX Pro Max Design System

Para TODAS as implementações, refatorações e criações de telas, componentes e interfaces visuais neste projeto:

1. **Fonte Única da Verdade do Design (Design System)**:
   - Consulte e respeite estritamente as diretrizes em `design-system/bancadalab-sus/MASTER.md` e overrides em `design-system/bancadalab-sus/pages/`.
   - Estilo Principal: **Accessible & Ethical / Healthcare Enterprise (SUS)**.
   - Padrão de Cores:
     - Primária (Ciano Saúde): `#0891B2`
     - Secundária: `#22D3EE`
     - Sucesso / Ação de Bancada (Verde Clínico): `#059669`
     - Alerta / Triagem Crítica: `#D97706`
     - Perigo / Rejeição: `#DC2626`
     - Fundo Limpo: `#F8FAFC` / `#ECFEFF`
     - Texto de Alto Contraste: `#0F172A` / `#164E63` (Mínimo WCAG AAA).

2. **Checklist Pré-Entrega Obrigatório**:
   - [ ] Nunca use emojis soltos como ícones principais; utilize **Lucide React** (`lucide-react`).
   - [ ] Todos os botões e áreas clicáveis devem ter `cursor-pointer`, transições suaves (150-200ms) e estados `:hover` e `:active`.
   - [ ] Alvos de toque acessíveis para bancada touchscreen/tablet (mínimo 44x44px).
   - [ ] Tipografia clara, legível e técnica (Inter / Geist / Fira).
   - [ ] Responsividade testada para tablets e monitores de bancada (375px, 768px, 1024px, 1440px).

3. **Consultas Rápidas via Engine**:
   - Para buscar estilos, paletas ou gráficos específicos do UI/UX Pro Max:
     ```bash
     python "C:\Users\conta\.gemini\config\skills\ui-ux-pro-max\scripts\search.py" "<termo>" --domain <domain>
     ```

