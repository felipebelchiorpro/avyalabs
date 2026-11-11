-- ====================================================================
-- BancadaLab SUS • Esquema Oficial Cloudflare D1 (SQLite Edge)
-- Laboratório Municipal de Caconde / Departamento de Saúde
-- ====================================================================

-- 1. Tabela: Rotina Diária de Pacientes (Conecta SUS / Ingestão)
CREATE TABLE IF NOT EXISTS rotina_dia (
    id TEXT PRIMARY KEY,                           -- Formato: rot-YYYY-MM-DD-prontuario
    data TEXT NOT NULL,                            -- Data no formato ISO: YYYY-MM-DD
    prontuario TEXT NOT NULL,                     -- Prontuário original (ex: 0016480)
    nome_paciente TEXT NOT NULL,                  -- Nome completo do paciente em CAIXA ALTA
    idade_sexo TEXT,                              -- Demografia (ex: 45A / F ou SUS)
    exame TEXT,                                   -- Lista de exames da guia
    status_coleta TEXT DEFAULT 'REALIZADO',        -- REALIZADO / PENDENTE
    status_laudo TEXT DEFAULT 'PENDENTE',          -- PENDENTE / DIGITADO / CONCLUIDO
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_rotina_dia_data ON rotina_dia(data);
CREATE INDEX IF NOT EXISTS idx_rotina_dia_prontuario ON rotina_dia(prontuario);

-- 2. Tabela: Triagem de Tubos EDTA (Bancada de Hematologia & Apoio)
CREATE TABLE IF NOT EXISTS triagem_edta (
    id TEXT PRIMARY KEY,                           -- Formato: edta-YYYY-MM-DD-prontuario_normalizado
    data TEXT NOT NULL,                            -- Data no formato ISO: YYYY-MM-DD
    prontuario TEXT NOT NULL,                     -- Prontuário com zeros (ex: 0016480)
    prontuario_normalizado TEXT NOT NULL,         -- Prontuário sem zeros (ex: 16480)
    agendamento TEXT,                             -- Número do agendamento Conecta SUS (ex: 104582)
    data_nascimento TEXT,                         -- DD/MM/AAAA
    data_nascimento_digitos TEXT,                 -- DDMMAAAA
    nome_paciente TEXT NOT NULL,                  -- Nome completo
    tipo_destino TEXT NOT NULL,                   -- hemograma_glicada | apenas_hemograma | apenas_glicada
    status TEXT NOT NULL DEFAULT 'pendente',      -- pendente | pronto_grade | retido_bancada | retido_envio_posterior
    fracionado_glicada INTEGER DEFAULT 0,         -- 0 = Não, 1 = Sim
    colocado_grade INTEGER DEFAULT 0,             -- 0 = Não, 1 = Sim
    horario_bipado TEXT,                          -- HH:MM:SS do registro de bancada
    exames TEXT,                                  -- Lista descritiva de exames (ex: HEMOGRAMA + GLICADA)
    solicitante TEXT,                             -- Médico solicitante
    urgencia INTEGER DEFAULT 0,                   -- 0 = Rotina, 1 = Urgência
    tem_vhs INTEGER DEFAULT 0,                    -- 0 = Não, 1 = Sim
    coletado_dois_tubos INTEGER DEFAULT 0,        -- 0 = Não, 1 = Sim
    qtd_tubos_coletados INTEGER DEFAULT 1,        -- Quantidade de tubos
    enviar_hemograma_hoje INTEGER DEFAULT 1,      -- 1 = Enviar hoje, 0 = Retido aguardando próximo dia
    data_liberacao_apoio TEXT,                    -- Data que subiu para o envio de apoio
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_triagem_edta_data ON triagem_edta(data);
CREATE INDEX IF NOT EXISTS idx_triagem_edta_prontuario ON triagem_edta(prontuario_normalizado);
CREATE INDEX IF NOT EXISTS idx_triagem_edta_status ON triagem_edta(status);
CREATE INDEX IF NOT EXISTS idx_triagem_edta_destino ON triagem_edta(tipo_destino);

-- 3. Tabela: Laudos de Urinálise & Bancada Geral
CREATE TABLE IF NOT EXISTS laudos_urina (
    id TEXT PRIMARY KEY,                           -- Formato: laudo-YYYY-MM-DD-prontuario
    data_hora TEXT NOT NULL,                       -- Timestamp completo do salvamento
    prontuario TEXT NOT NULL,                     -- Prontuário
    data_atendimento TEXT NOT NULL,               -- YYYY-MM-DD
    nome_paciente TEXT NOT NULL,                  -- Nome do paciente
    cor TEXT,
    aspecto TEXT,
    deposito TEXT,
    densidade TEXT,
    ph TEXT,
    proteinas TEXT,
    glicose TEXT,
    corpos_cetonicos TEXT,
    pigmentos_biliares TEXT,
    urobilinogenio TEXT,
    hemoglobina TEXT,
    nitrito TEXT,
    leucocitos_campo TEXT,
    hemacias_campo TEXT,
    celulas_epiteliais TEXT,
    cilindros TEXT,
    cristais TEXT,
    flora_bacteriana TEXT,
    leveduras TEXT,
    muco TEXT,
    filamento_muco TEXT,
    parasitas TEXT,
    outros_elementos TEXT,
    observacoes TEXT,
    responsavel_tecnico TEXT,
    medico_solicitante TEXT,
    convenio TEXT,
    idade TEXT,
    sexo TEXT,
    status TEXT DEFAULT 'salvo',
    vdrl_resultado TEXT,
    vdrl_titulacao TEXT,
    vdrl_lote TEXT,
    dengue_ns1 TEXT,
    dengue_igm TEXT,
    dengue_igg TEXT,
    tipagem_abo TEXT,
    fator_rh TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_laudos_data ON laudos_urina(data_atendimento);
CREATE INDEX IF NOT EXISTS idx_laudos_prontuario ON laudos_urina(prontuario);

-- 4. Tabela: Médicos Solicitantes de Caconde
CREATE TABLE IF NOT EXISTS medicos_caconde (
    nome_medico TEXT PRIMARY KEY,
    padrao INTEGER DEFAULT 0
);

-- 5. Tabela: Operadores Técnicos de Bancada
CREATE TABLE IF NOT EXISTS operadores_caconde (
    nome_operador TEXT PRIMARY KEY,
    ativo INTEGER DEFAULT 1
);

-- 6. Tabela de Apoio: Sinal de Impressão Remota
CREATE TABLE IF NOT EXISTS sinal_impressao_edta (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    hora_encerramento TEXT,
    tipo_guia TEXT,
    solicitado_em TEXT
);

-- Carga inicial de médicos e operadores padrão de Caconde
INSERT OR IGNORE INTO medicos_caconde (nome_medico, padrao) VALUES
    ('Dr(a). Clínico(a) Geral / UBS', 1),
    ('Dr. André Luiz Silveira', 0),
    ('Dra. Mariana Fontes', 0),
    ('Dr. Carlos Eduardo Zanetti', 0),
    ('Dr(a). Plantonista Pronto Socorro', 0);

INSERT OR IGNORE INTO operadores_caconde (nome_operador, ativo) VALUES
    ('Farmacêutico(a) Bioquímico(a)', 1),
    ('Bancada Geral SUS', 1),
    ('Operador 01', 1);

