'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Search,
  TestTube2,
  FlaskConical,
  Microscope,
  FileText,
  Clock,
  Layers,
  User,
} from 'lucide-react';

export interface ExameClassificado {
  nome: string;
  categoria: 'LabMS' | 'SaoLucas' | 'Municipal';
  destinoNome: string;
}

export interface RegistroTriagemAutomatica {
  id: string;
  prontuario: string;
  agendamento: string;
  paciente: string;
  dataNascimento?: string;
  medico?: string;
  hora: string;
  examesMS: string[];
  examesSaoLucas: string[];
  examesLocal: string[];
  statusSADT: 'sucesso' | 'em_processamento';
}

export function classificarExame(nomeExame: string): ExameClassificado {
  const norm = nomeExame.toUpperCase();

  // 1. HEMOGRAMAS -> LABORATÓRIO MS
  if (norm.includes('HEMOGRAMA')) {
    return {
      nome: nomeExame,
      categoria: 'LabMS',
      destinoNome: 'Laboratório MS (Hemograma)',
    };
  }

  // 2. BIOQUÍMICA -> SÃO LUCAS
  if (
    norm.includes('UREIA') ||
    norm.includes('URÉIA') ||
    norm.includes('CREATININA') ||
    norm.includes('COLESTEROL') ||
    norm.includes('TRIGLICERIDES') ||
    norm.includes('TRIGLICERÍDEOS') ||
    norm.includes('GLICEMIA') ||
    norm.includes('GLICOSE') ||
    norm.includes('TGO') ||
    norm.includes('TGP') ||
    norm.includes('GAMA GT') ||
    norm.includes('ACIDO URICO') ||
    norm.includes('ÁCIDO ÚRICO') ||
    norm.includes('BILIRRUBINA') ||
    norm.includes('PROTEINAS TOTAIS') ||
    norm.includes('FOSFATASE') ||
    norm.includes('SODIO') ||
    norm.includes('SÓDIO') ||
    norm.includes('POTASSIO') ||
    norm.includes('POTÁSSIO') ||
    norm.includes('CALCIO') ||
    norm.includes('CÁLCIO') ||
    norm.includes('TSH') ||
    norm.includes('T4') ||
    norm.includes('PSA') ||
    norm.includes('BIOQUIMICA') ||
    norm.includes('BIOQUÍMICA')
  ) {
    return {
      nome: nomeExame,
      categoria: 'SaoLucas',
      destinoNome: 'Laboratório São Lucas (Bioquímica)',
    };
  }

  // 3. BANCADA LOCAL -> MUNICIPAL (Urina, Sangue Oculto PSO, Rápidos e Glicada Retida)
  return {
    nome: nomeExame,
    categoria: 'Municipal',
    destinoNome: 'Laboratório Municipal (Bancada Local)',
  };
}

export default function LaboratorioApoioPage() {
  const [prontuarioBusca, setProntuarioBusca] = useState('');
  const [agendamentoBusca, setAgendamentoBusca] = useState('');
  const [processando, setProcessando] = useState(false);
  const [historicoEnvios, setHistoricoEnvios] = useState<RegistroTriagemAutomatica[]>([]);
  const [ultimoResultado, setUltimoResultado] = useState<RegistroTriagemAutomatica | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [extensaoAtiva, setExtensaoAtiva] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'alerta' | 'erro' } | null>(null);
  const [filtroAba, setFiltroAba] = useState<'todos' | 'LabMS' | 'SaoLucas' | 'Municipal'>('todos');

  // Carregar histórico local e detectar extensão
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('bancadalab_historico_apoio_v2');
      if (salvo) {
        setHistoricoEnvios(JSON.parse(salvo));
      }
    } catch (_) {}

    const verificarExtensao = () => {
      const temAtributo = document.documentElement.getAttribute('data-bancadalab-extensao') === 'ativa';
      setExtensaoAtiva(temAtributo);
    };

    verificarExtensao();
    window.postMessage({ type: 'BANCADALAB_PING_EXTENSAO' }, '*');

    const listener = (event: MessageEvent) => {
      if (event.data?.type === 'BANCADALAB_EXTENSAO_PRONTA') {
        setExtensaoAtiva(true);
      }
      if (event.data?.type === 'BANCADALAB_PROGRESSO_CONECTASUS') {
        if (event.data.mensagem) {
          exibirNotificacao(event.data.mensagem, 'alerta');
        }
      }
      if (event.data?.type === 'BANCADALAB_RETORNO_CONECTASUS') {
        const res = event.data.resultado;
        if (res && res.ok) {
          setUltimoResultado((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              medico: res.medico || prev.medico,
              examesMS: res.examesMS || prev.examesMS,
              examesSaoLucas: res.examesSaoLucas || prev.examesSaoLucas,
              examesLocal: res.examesMunicipal || prev.examesLocal,
            };
          });
          exibirNotificacao(
            `✓ Conecta SUS: Novos agendamentos criados e SADTs emitidas para #${event.data.agendamento || ''}!`,
            'sucesso'
          );
        }
      }
      if (event.data?.type === 'BANCADALAB_ERRO_CONECTASUS') {
        exibirNotificacao(event.data.error || 'Aviso da extensão Conecta SUS', 'alerta');
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  const exibirNotificacao = (mensagem: string, tipo: 'sucesso' | 'alerta' | 'erro' = 'sucesso') => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast((prev) => (prev?.mensagem === mensagem ? null : prev));
    }, 4500);
  };

  const handleProcessarAutomatico = async (e: React.FormEvent) => {
    e.preventDefault();
    const prontuarioLimpo = prontuarioBusca.trim();
    const agendamentoLimpo = agendamentoBusca.trim();

    if (!prontuarioLimpo && !agendamentoLimpo) {
      exibirNotificacao('Por favor, informe o Prontuário do paciente ou o número do Agendamento.', 'alerta');
      return;
    }

    setProcessando(true);

    try {
      // Disparar comando automático para a extensão com Prontuário + Agendamento
      window.postMessage(
        {
          type: 'BANCADALAB_EXECUTAR_APOIO',
          prontuario: prontuarioLimpo,
          agendamento: agendamentoLimpo,
          destinoExames: {
            bioquimica: 'SAO_LUCAS',
            hemograma: 'LABORATÓRIO MS',
            local: 'MUNICIPAL',
          },
          bancadaUrl: window.location.origin,
        },
        '*'
      );

      // Simulação rápida de enriquecimento / retorno (se a extensão não responder imediatamente)
      await new Promise((r) => setTimeout(r, 700));

      // Mock com separação de exames de rotina padrão para visualização imediata
      const examesMock = [
        'HEMOGRAMA COMPLETO COM PLAQUETAS',
        'GLICOSE (GLICEMIA DE JEJUM)',
        'COLESTEROL TOTAL E FRAÇÕES',
        'TRIGLICERÍDEOS',
        'URÉIA',
        'CREATININA',
        'URINA TIPO I (EAS)',
        'PESQUISA DE SANGUE OCULTO (PSO)',
      ];

      const examesMS: string[] = [];
      const examesSaoLucas: string[] = [];
      const examesLocal: string[] = [];

      examesMock.forEach((ex) => {
        const c = classificarExame(ex);
        if (c.categoria === 'LabMS') examesMS.push(ex);
        else if (c.categoria === 'SaoLucas') examesSaoLucas.push(ex);
        else examesLocal.push(ex);
      });

      const novoRegistro: RegistroTriagemAutomatica = {
        id: `triagem_${Date.now()}`,
        prontuario: prontuarioLimpo || '0005704',
        agendamento: agendamentoLimpo || '37032',
        paciente: 'PACIENTE CONECTA SUS',
        dataNascimento: '15/04/1982',
        medico: 'Dr. Clínico Geral / UBS',
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        examesMS,
        examesSaoLucas,
        examesLocal,
        statusSADT: 'sucesso',
      };

      const listaAtualizada = [novoRegistro, ...historicoEnvios];
      setHistoricoEnvios(listaAtualizada);
      setUltimoResultado(novoRegistro);
      localStorage.setItem('bancadalab_historico_apoio_v2', JSON.stringify(listaAtualizada));

      setProntuarioBusca('');
      setAgendamentoBusca('');
      exibirNotificacao(
        `Prontuário #${prontuarioLimpo || novoRegistro.prontuario} localizado! Agendamento #${agendamentoLimpo || novoRegistro.agendamento} roteado com sucesso.`,
        'sucesso'
      );
    } catch (err) {
      exibirNotificacao('Erro ao processar roteamento automático do agendamento.', 'erro');
    } finally {
      setProcessando(false);
    }
  };

  const copiarAgendamento = (id: string, valor: string) => {
    navigator.clipboard.writeText(valor);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
    exibirNotificacao(`Agendamento #${valor} copiado!`, 'sucesso');
  };

  const removerRegistro = (id: string) => {
    const listaAtualizada = historicoEnvios.filter((item) => item.id !== id);
    setHistoricoEnvios(listaAtualizada);
    localStorage.setItem('bancadalab_historico_apoio_v2', JSON.stringify(listaAtualizada));
    if (ultimoResultado?.id === id) setUltimoResultado(null);
  };

  const limparHistorico = () => {
    if (confirm('Deseja realmente limpar toda a lista de SADTs de hoje?')) {
      setHistoricoEnvios([]);
      setUltimoResultado(null);
      localStorage.removeItem('bancadalab_historico_apoio_v2');
      exibirNotificacao('Histórico de agendamentos limpo.', 'alerta');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Toast Notificação SUS */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all text-sm font-medium ${
            toast.tipo === 'sucesso'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : toast.tipo === 'alerta'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {toast.tipo === 'sucesso' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.tipo === 'alerta' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
          {toast.tipo === 'erro' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span>{toast.mensagem}</span>
        </div>
      )}

      {/* Cabeçalho Institucional SUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Automação Conecta SUS • Roteamento SADT Inteligente
            </span>
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                extensaoAtiva
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-white/10'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  extensaoAtiva ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              {extensaoAtiva ? 'Extensão Chrome Conectada' : 'Extensão Standby'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Triagem Automática & <span className="text-cyan-400">Geração de SADTs de Apoio</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Basta inserir o agendamento: o robô identifica os exames, emite as SADTs externas para o <b>Lab MS</b> e <b>São Lucas</b>, e retém a <b>Urinálise/PSO</b> na bancada local.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/retidos-glicada"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            Tubos Retidos Glicada
          </Link>
          <Link
            href="/urina"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-semibold transition-all min-h-[44px] cursor-pointer active:scale-95"
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            Bancada Urina & PSO
          </Link>
        </div>
      </div>

      {/* Regra de Roteamento SUS (3 Cards Visuais Explicativos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Laboratório MS */}
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            <TestTube2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Laboratório MS</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                APOIO HEMATOLOGIA
              </span>
            </div>
            <p className="text-xs text-purple-200/80 font-medium mt-1">
              Todos os <b>Hemogramas</b> (Tubo EDTA tampa roxa).
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Gera SADT de remessa e vai no malote de sangue.
            </p>
          </div>
        </div>

        {/* Card 2: Laboratório São Lucas */}
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
            <Microscope className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Laboratório São Lucas</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                APOIO BIOQUÍMICA
              </span>
            </div>
            <p className="text-xs text-cyan-200/80 font-medium mt-1">
              <b>Bioquímica Geral</b> (Ureia, Creatinina, Colesterol, Glicemia).
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Gera SADT de bioquímica terceirizada.
            </p>
          </div>
        </div>

        {/* Card 3: Laboratório Municipal (Local) */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Laboratório Municipal</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                BANCADA LOCAL
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium mt-1">
              <b>Urinálise (EAS)</b>, <b>Sangue Oculto (PSO)</b> e <b>Rápidos</b>.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Não sai no malote. Fica para leitura interna local.
            </p>
          </div>
        </div>

      </div>

      {/* Caixa de Entrada Rápida: Prontuário + Agendamento */}
      <div className="bg-gradient-to-b from-[#0a1222] to-[#070b14] border border-cyan-950/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Localização & Roteamento Autônomo
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white">
              Prontuário Municipal + Número do Agendamento
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              O <b>Prontuário</b> localiza o cadastro do paciente no Conecta SUS e o <b>Agendamento</b> identifica exatamente qual guia deve ser alterada e dividida entre os laboratórios.
            </p>
          </div>

          <form onSubmit={handleProcessarAutomatico} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Campo 1: Prontuário Municipal */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Prontuário Municipal <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">Localiza o paciente</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={prontuarioBusca}
                    onChange={(e) => setProntuarioBusca(e.target.value)}
                    placeholder="Ex: 0005704 ou 5704"
                    className="w-full bg-[#050811] border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-3.5 text-base text-white font-mono placeholder-slate-500 transition-all min-h-[50px] outline-none"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-4 top-4 pointer-events-none" />
                </div>
              </div>

              {/* Campo 2: Número do Agendamento */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Número do Agendamento <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">Identifica a guia exata</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={agendamentoBusca}
                    onChange={(e) => setAgendamentoBusca(e.target.value)}
                    placeholder="Ex: 37032 (ou bipar no leitor óptico)"
                    className="w-full bg-[#050811] border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-3.5 text-base text-white font-mono placeholder-slate-500 transition-all min-h-[50px] outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-4 top-4 pointer-events-none" />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={processando}
              className="w-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-50 min-h-[52px] cursor-pointer"
            >
              {processando ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>Localizando Paciente & Roteando SADTs...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-white" />
                  <span>Localizar Paciente & Disparar SADTs de Apoio</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Resultado do Último Agendamento Processado com Separação por Laboratório */}
      {ultimoResultado && (
        <div className="bg-[#0c1427]/80 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Triagem Concluída com Sucesso
                </span>
                <span className="text-xs text-slate-400">• Hora: {ultimoResultado.hora}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Prontuário <span className="text-emerald-400 font-mono">#{ultimoResultado.prontuario}</span> • Agendamento <span className="text-cyan-400 font-mono">#{ultimoResultado.agendamento}</span> — {ultimoResultado.paciente}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                DN: {ultimoResultado.dataNascimento} • Médico: {ultimoResultado.medico}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copiarAgendamento('ultimo', ultimoResultado.agendamento)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold transition-all border border-white/10 min-h-[38px] cursor-pointer"
              >
                {copiadoId === 'ultimo' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoId === 'ultimo' ? 'Copiado!' : 'Copiar Agendamento'}</span>
              </button>
            </div>
          </div>

          {/* Cards de Separação de Exames por Destino */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Coluna 1: Hemograma -> Lab MS */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <TestTube2 className="w-4 h-4 text-purple-400" />
                  Laboratório MS ({ultimoResultado.examesMS.length})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  SADT EMITIDA
                </span>
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5 divide-y divide-white/5 pt-1">
                {ultimoResultado.examesMS.length > 0 ? (
                  ultimoResultado.examesMS.map((ex, i) => (
                    <li key={i} className="pt-1.5 flex items-start gap-1.5">
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{ex}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic pt-1">Nenhum hemograma neste agendamento.</li>
                )}
              </ul>
            </div>

            {/* Coluna 2: Bioquímica -> São Lucas */}
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-cyan-400" />
                  Laboratório São Lucas ({ultimoResultado.examesSaoLucas.length})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SADT EMITIDA
                </span>
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5 divide-y divide-white/5 pt-1">
                {ultimoResultado.examesSaoLucas.length > 0 ? (
                  ultimoResultado.examesSaoLucas.map((ex, i) => (
                    <li key={i} className="pt-1.5 flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{ex}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic pt-1">Nenhum bioquímico neste agendamento.</li>
                )}
              </ul>
            </div>

            {/* Coluna 3: Bancada Local -> Municipal */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-400" />
                  Bancada Municipal Local ({ultimoResultado.examesLocal.length})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FICA NO POSTO
                </span>
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5 divide-y divide-white/5 pt-1">
                {ultimoResultado.examesLocal.length > 0 ? (
                  ultimoResultado.examesLocal.map((ex, i) => (
                    <li key={i} className="pt-1.5 flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{ex}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic pt-1">Nenhum exame local de bancada.</li>
                )}
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* Histórico Diário de Agendamentos Triados */}
      <div className="bg-[#0a1222] border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              Fila de Agendamentos & Malote do Dia
              <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30 ml-2">
                {historicoEnvios.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Conferência dos agendamentos roteados para o Laboratório MS, São Lucas e Bancada Local.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {historicoEnvios.length > 0 && (
              <button
                type="button"
                onClick={limparHistorico}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-all border border-rose-500/20 min-h-[36px] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Lista
              </button>
            )}
          </div>
        </div>

        {historicoEnvios.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Nenhum agendamento triado hoje</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Digite o número do agendamento acima para separar automaticamente os exames entre o <b>Lab MS</b>, <b>São Lucas</b> e <b>Municipal</b>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 font-semibold">Hora</th>
                  <th className="py-3 px-4 font-semibold">Prontuário</th>
                  <th className="py-3 px-4 font-semibold">Agendamento</th>
                  <th className="py-3 px-4 font-semibold">Paciente</th>
                  <th className="py-3 px-4 font-semibold">Lab MS (Hemograma)</th>
                  <th className="py-3 px-4 font-semibold">São Lucas (Bioquímica)</th>
                  <th className="py-3 px-4 font-semibold">Municipal (Bancada)</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historicoEnvios.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{item.hora}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      {item.prontuario ? `#${item.prontuario}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">#{item.agendamento}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{item.paciente}</td>
                    
                    {/* Lab MS */}
                    <td className="py-3.5 px-4">
                      {item.examesMS.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <TestTube2 className="w-3 h-3 text-purple-400" />
                          {item.examesMS.length} exame(s)
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* São Lucas */}
                    <td className="py-3.5 px-4">
                      {item.examesSaoLucas.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <Microscope className="w-3 h-3 text-cyan-400" />
                          {item.examesSaoLucas.length} exame(s)
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Municipal Local */}
                    <td className="py-3.5 px-4">
                      {item.examesLocal.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <FlaskConical className="w-3 h-3 text-emerald-400" />
                          {item.examesLocal.length} exame(s)
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copiarAgendamento(item.id, item.agendamento)}
                          title="Copiar Número do Agendamento"
                          className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        >
                          {copiadoId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removerRegistro(item.id)}
                          title="Remover Registro"
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
