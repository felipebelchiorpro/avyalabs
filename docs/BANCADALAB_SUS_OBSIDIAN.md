---
title: "BancadaLab SUS • Sistema de Automação de Bancada e Triagem Laboratorial"
date: 2026-11-08
aliases:
  - "Urinalise PWA Automatico"
  - "BancadaLab Caconde"
  - "Triagem EDTA SUS"
tags:
  - "#laboratorio"
  - "#sus"
  - "#biomedicina"
  - "#pwa"
  - "#nextjs"
  - "#automacao"
  - "#saude-publica"
institution: "Prefeitura Municipal da Estância Climática de Caconde • Departamento de Saúde"
lab: "Laboratório Municipal de Análises Clínicas"
version: "2.4.0"
status: "Produção / Bancada Ativa"
---

# BancadaLab SUS • Sistema de Automação de Bancada & Triagem Laboratorial

> [!abstract] Visão Executiva
> O **BancadaLab SUS** (originalmente *Urinálise PWA Automático*) é uma Progressive Web Application (PWA) de alta performance desenvolvida especificamente para resolver os gargalos operacionais, de triagem e de faturamento do **Laboratório Municipal de Análises Clínicas de Caconde - SP**.
> 
> Ele automatiza a ingestão de rotinas brutas exportadas pelo sistema **ConectaSUS / PSO**, realiza a separação inteligente de bancadas (*Urinálise, EDTA / Hematologia, VDRL / Sorologia*), opera triagem com câmera/OCR em tempo real e gerencia a cisão crítica entre exames executados localmente e amostras enviadas ao **Laboratório de Apoio terceirizado**.

---

## 🧭 Mapa Mental do Ecossistema (Mermaid)

```mermaid
flowchart TD
    subgraph Ingestao["1. Ingestão de Dados (ConectaSUS / PSO)"]
        A["Planilha CSV / Excel Bruta"] --> B["Extrator Inteligente (extratorBancada.ts)"]
        B --> C{"Merge Seguro & Upsert<br/>(Anti-Apagamento)"}
    end

    subgraph Roteamento["2. Roteamento por Bancada"]
        C --> D["Bancada Urinálise (Fita + Sedimento)"]
        C --> E["Bancada EDTA (Hemograma & HbA1c)"]
        C --> F["Bancada VDRL & Testes Rápidos"]
    end

    subgraph TriagemEDTA["3. Fluxo Clínico EDTA & Apoio"]
        E --> G{"Classificação do Tubo"}
        G -->|"Apenas Hemograma"| H["Grade do Apoio (Envio Imediato)"]
        G -->|"Hemograma + Glicada"| I["Gradinha de Retidos (Fracionar 500µL / Local)"]
        G -->|"Apenas Glicada"| J["Bancada Local (Não vai ao Apoio)"]
        
        I -->|"Liberar Hoje / Amanhã"| H
    end

    subgraph Persistencia["4. Persistência & Integração"]
        C --> K[("Google Sheets API Oficial")]
        C --> L[("LocalStorage & Cache Offline PWA")]
        H --> M["Guia de Remessa Apoio (A4 Paisagem)"]
        D --> N["Extensão ConectaSUS / XML Laudos"]
    end
```

---

## 🏥 Contexto Clínico & Desafios Reais no SUS

> [!quote] O Problema da Bancada Municipal
> No atendimento do SUS de pequeno e médio porte, centenas de pacientes são colhidos logo no início da manhã. Cada paciente pode ter exames que são **processados na bancada do laboratório local** e exames que precisam ser **enviados de van à tarde para um laboratório de apoio terceirizado** (ex: Álvaro, Pardini, etc.).

### Os 4 Grandes Desafios Resolvidos:

1. **A Cisão Hemograma vs. Hemoglobina Glicada (HbA1c):**
   - No mesmo tubo roxo (EDTA), o médico pede *Hemograma* (que vai para o Apoio) e *HbA1c* (que é dosado na máquina local de bancada).
   - *Risco:* Mandar o tubo integral para o apoio sem dosar a glicada (perda do exame local) ou reter o tubo e esquecer de enviar o hemograma (atraso de laudo de urgência).
2. **Pacientes de "Apenas Glicada":**
   - Não possuem hemograma. O sangue fica no laboratório. **Nunca deve constar na guia de remessa e faturamento do apoio**, mas precisa de conferência de presença e horário de chegada.
3. **Controle de Tubos VHS (2 Tubos vs. Tubo Único):**
   - Quando o paciente tem VHS além de Hemograma, alguns postos coletam 2 tubos EDTA (1 exclusivo para a pipeta de VHS e 1 para o Apoio). Se o posto coletou apenas 1 tubo, a bancada precisa ser avisada para não mandar o tubo antes de montar o VHS.
4. **Anti-Apagamento em Lote:**
   - O ConectaSUS gera várias planilhas por dia (rotina da manhã, pacientes atrasados, urgências do hospital). O sistema **jamais pode sobrescrever** o que já foi triado ou apagar dias anteriores.

---

## ⚙️ Arquitetura Técnica do Sistema

```
📦 urinalise-pwa-automatico
├── 📁 src
│   ├── 📁 app
│   │   ├── 📄 page.tsx                 # Bancada de Urinálise & Mapa de Bancada
│   │   ├── 📁 triagem-edta             # Triagem com OCR, Bipagem, Sinal Remoto
│   │   ├── 📁 retidos-glicada          # Gestão de Tubos de Glicada Retidos
│   │   ├── 📁 laudos                   # Central de Digitação & Liberação
│   │   ├── 📁 vdrl                     # Triagem e Laudos de Sorologia/VDRL
│   │   ├── 📁 consulta                 # Busca Rápida de Pacientes e Histórico
│   │   ├── 📁 importar                 # Ingestão inteligente ConectaSUS
│   │   └── 📁 api                      # Endpoints REST (Google Sheets, OCR, etc.)
│   ├── 📁 components                   # Componentes Modulares de UI/UX
│   │   ├── 📄 EdtaOcrScanner.tsx       # Scanner de Folha com OCR Câmera
│   │   ├── 📄 RelatorioTriagemEdtaPrintView.tsx # Guia Oficial Remessa A4
│   │   └── 📄 MapaBancadaPrintView.tsx # Mapa Físico de Bancada Impresso
│   ├── 📁 lib                          # Lógica Pura & Engines
│   │   ├── 📄 extratorBancada.ts       # Parser de planilhas ConectaSUS
│   │   ├── 📄 googleSheets.ts          # Driver de persistência Sheets API
│   │   ├── 📄 audioFeedback.ts         # Síntese Web Audio API (tons clínicos)
│   │   └── 📄 exportadorXmlExtensao.ts # Integração com robô ConectaSUS
│   └── 📁 types                        # Modelagem TypeScript Rígida
```

---

## 🧪 Módulos do Sistema em Detalhes

### 1. [[Módulo-Triagem-EDTA|Triagem EDTA & Câmera OCR]]
- **Modo Câmera Contínua:** Aponte a câmera do celular/tablet para o cabeçalho da requisição impressa. O motor detecta Prontuário, Nome, Data de Nascimento e Médico Solicitante sem tocar na tela.
- **Debounce Inteligente:** Evita leituras duplicadas da mesma folha em 3 segundos.
- **Sinal Remoto PC-Celular:** O operador bipa no celular na bancada de colheita. O computador da triagem escuta via polling leve (`check_print=true`) e dispara a impressão A4 automaticamente no PC da secretaria.
- **Áudio Feedback Clínico:**
  - *Tom Roxo (2 bips agudos):* Hemograma + Glicada (Fracionar 500 µL).
  - *Tom Azul (1 bip harmônico):* Apenas Hemograma (Direto para o Apoio).
  - *Tom Teal (1 bip suave):* Apenas Glicada (Presença confirmada no laboratório).

### 2. [[Módulo-Retidos-Glicada|Gestão de Tubos Retidos (HbA1c)]]
- Painel estilo kanban/tabela das amostras retidas na gradinha.
- **Filtro Multi-Data Resiliente:** Abas rápidas para `Todos os Dias`, `Hoje`, `Ontem` e pílulas automáticas para datas anteriores.
- **Liberação em 1 Clique:** Botões *“Liberar Hoje”* ou *“Liberar Todos”* despacham os tubos diretamente para a grade de faturamento do apoio com registro de horário.

### 3. [[Módulo-Urinalise|Bancada de Urinálise & Sedimento]]
- Mapa visual de bancada ordenado numericamente (tubos 01 a N).
- Teclado numérico rápido para leucócitos, hemácias, flora e cristais.
- **Atalhos SUS:** Botão *"Normal"* preenche automaticamente valores de referência padrão recomendados pela SBPC.
- Exportação direta para extensão do navegador via XML para injeção automática no ConectaSUS.

### 4. [[Módulo-Persistencia|Motor Anti-Apagamento & Google Sheets]]
- Utiliza a API Oficial do Google Sheets v4 via Service Account.
- Chave composta única: `${data}_${prontuario_normalizado}`.
- Ao subir uma nova planilha:
  1. Pacientes já triados têm seu status, médico alterado e fracionamento **preservados intactos**.
  2. Pacientes novos são adicionados no final como pendentes.
  3. Rotinas de outras datas históricas **nunca são apagadas**.

---

## 📊 Regras de Negócio Fundamentais (Matriz de Destino)

| Tipo de Pedido | Exames Típicos | Vai para o Apoio? | Fica na Gradinha de Retidos? | Aparece no Relatório de Remessa? | Ação da Bancada |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Apenas Hemograma** | `HEMOGRAMA COMPLETO` | **SIM** | **NÃO** | **SIM** | Tubo integral direto na grade de transporte |
| **Hemograma + Glicada** | `HEMOGRAMA + HBA1C` | **SIM** (após fracionar) | **SIM** | **SIM** (quando liberado) | Pipetar 500 µL no microtubo local e enviar restante ao apoio |
| **Apenas Glicada** | `HEMOGLOBINA GLICADA` | **NÃO** | **NÃO** | **NÃO** | Bipar apenas para confirmar presença física no lab |
| **Hemograma + VHS** | `HEMO + VHS` | **SIM** | **NÃO** | **SIM** | Verificar se há 2 tubos (1 Apoio + 1 VHS Local) |

---

## 🎨 Design System: BancadaLab SUS (UI/UX Pro Max)

> [!tip] Ergonomia para Ambiente Laboratorial
> Interfaces de laboratório precisam de contraste alto, alvos de toque grandes (para uso com luvas de procedimento) e ausência de distrações.

- **Paleta de Cores WCAG AAA:**
  - `Ciano Saúde (#0891B2)`: Identidade institucional do SUS e navegação primária.
  - `Roxo Fracionamento (#7C3AED)`: Alerta máximo para necessidade de separar alíquota de HbA1c.
  - `Verde Clínico (#059669)`: Confirmação de amostra pronta na grade.
  - `Âmbar Triagem (#D97706)`: Tubos retidos para envio em data posterior.
  - `Teal Bancada Local (#0D9488)`: Amostras exclusivas de dosagem interna.
- **Tipografia Técnica:** Inter / Fira Code para prontuários monoespaçados `#0016480`.
- **Iconografia:** Ícones estritos via `lucide-react` (zero emojis em botões operacionais críticos).

---

## 🚀 Como Executar o Projeto Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/felipebelchiorpro/examebancada.git
cd examebancada

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente (.env.local)
# GOOGLE_SERVICE_ACCOUNT_EMAIL="sua-service-account@iam.gserviceaccount.com"
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
# GOOGLE_SHEET_ID="1234567890abcdef"

# 4. Iniciar servidor de desenvolvimento
npm run dev -- -p 3005
```

---

## 🔗 Links e Relações no Obsidian

- [[Bancada-Urinalise]] • Protocolo operacional de EAS / Tipo 1
- [[Bancada-EDTA]] • Procedimento Operacional Padrão (POP) de Hemograma
- [[Integracao-ConectaSUS]] • Estrutura de arquivos do robô de automação
- [[Manual-Operador-Caconde]] • Guia rápido para plantonistas e técnicos de bancada

#laboratorio #sus #bancadalab #saude-publica #caconde

