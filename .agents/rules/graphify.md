---
trigger: always_on
description: Regra mandatória - todo prompt e tarefa de código deve ser pré-processado e validado pelo Graphify.
---

## REGRA MANDATÓRIA: Processamento Prévio via Graphify

Esta regra é estrita e prioritária para **TODOS os prompts e interações** neste projeto:

1. **Pré-Processamento Obrigatório com Graphify**:
   - Antes de responder, planejar ou alterar código, você **DEVE SEMPRE** consultar o grafo de conhecimento do Graphify (`graphify-out/graph.json`).
   - Use comandos direcionados para contextualizar o prompt:
     - `graphify query "<tema_do_prompt>"` para mapear nós, arquivos e funções envolvidas.
     - `graphify explain "<componente_ou_funcao>"` para inspecionar conexões e dependências de um nó específico.
     - `graphify path "<origem>" "<destino>"` para verificar o impacto de uma alteração entre duas partes do sistema.

2. **Decisões Guiadas pelo Grafo**:
   - Nenhuma refatoração, criação ou edição de arquivo pode ser realizada sem antes conferir os nós dependentes no grafo do projeto para evitar quebra de contratos ou efeitos colaterais.

3. **Sincronização Pós-Edição**:
   - Sempre após criar ou modificar arquivos de código nesta sessão, execute imediatamente:
     ```bash
     graphify update .
     ```
   - Isso garante que `graphify-out/graph.json`, `graphify-out/graph.html` e `public/graph.html` permaneçam sempre 100% atualizados.
