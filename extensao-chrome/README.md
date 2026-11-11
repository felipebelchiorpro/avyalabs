# Extensão Chrome • BancadaLab SUS (Ponte Conecta SUS → Cloudflare D1)

Esta extensão automatiza em **segundo plano** (Opção B) a consulta de pacientes e agendamentos na aba já aberta e logada do Conecta SUS (`https://caconde.conectasus.com.br`) a partir da tela **Triagem EDTA** do BancadaLab.

## Arquivos da Extensão
- `manifest.json`: Permissões (Manifest V3) para `caconde.conectasus.com.br` e seu app na Vercel.
- `background.js`: Orquestrador que mantém o estado da busca mesmo quando o Conecta SUS recarrega a página entre etapas, e envia o `POST /api/triagem-edta` para o D1.
- `content_bancadalab.js`: Ponte entre a página do BancadaLab e o Service Worker da extensão.
- `content_conectasus.js`: Executa os 7 passos exatos dentro do Conecta SUS e extrai Data de Nascimento, Médico Solicitante e Exames.
- `popup.html` / `popup.js`: Painel rápido com status da aba do Conecta SUS, configuração da URL da Vercel, teste direto e logs passo a passo.

## Como Instalar no Google Chrome (30 segundos)
1. Abra o Chrome e acesse `chrome://extensions`.
2. Ative a chave **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** (*Load unpacked*).
4. Selecione a pasta **`extensao-chrome`** dentro deste projeto.

## Como Testar Hoje
1. Abra uma aba com `https://caconde.conectasus.com.br` e faça o login normalmente.
2. Em outra aba, abra o **BancadaLab** (na Vercel ou `http://localhost:3000`) e entre em **Triagem EDTA**.
3. O selo no topo do módulo mudará para **"Extensão Chrome Conectada"**.
4. Digite o **Prontuário Municipal** e o **Número do Agendamento** de um paciente de hoje e clique em **Localizar & Enriquecer**.
5. Acompanhe os passos em tempo real na tela (ou clicando no ícone da extensão para ver os logs detalhados).

