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
} from 'lucide-react';

interface RegistroEnvioApoio {
  id: string;
  agendamento: string;
  paciente?: string;
  destinoId: string;
  destinoNome: string;
  tipoExame: string;
  motivo: string;
  dataHora: string;
  status: 'pronto_extensao' | 'em_processamento' | 'concluido';
}

const DESTINOS_LABORATORIO = [
  { id: 'SaoLucas', nome: 'Laboratório São Lucas', descricao: 'Contingência bioquímica e rotina de apoio terceirizada' },
  { id: 'ApoioGeral', nome: 'Laboratório de Apoio Geral (Padrão SUS)', descricao: 'Fluxo centralizado de exames complementares de média complexidade' },
  { id: 'HermesPardini', nome: 'Hermes Pardini / Fleury Apoio', descricao: 'Exames especializados, genéticos e biologia molecular' },
];

export default function LaboratorioApoioPage() {
  const [agendamentoBusca, setAgendamentoBusca] = useState('');
  const [nomePaciente, setNomePaciente] = useState('');
  const [laboratorioDestino, setLaboratorioDestino] = useState('SaoLucas');
  const [tipoExame, setTipoExame] = useState('Bioquímica / Geral');
  const [motivoEnvio, setMotivoEnvio] = useState('Contingência Técnica Bancada');
  const [processando, setProcessando] = useState(false);
  const [historicoEnvios, setHistoricoEnvios] = useState<RegistroEnvioApoio[]>([]);
  const [ultimoResultado, setUltimoResultado] = useState<RegistroEnvioApoio | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [extensaoAtiva, setExtensaoAtiva] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'alerta' | 'erro' } | null>(null);

  // Carregar histórico local e detectar extensão
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('bancadalab_historico_apoio');
      if (salvo) {
        setHistoricoEnvios(JSON.parse(salvo));
      }
    } catch (_) {}

    // Detecção da extensão do Chrome BancadaLab
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
      if (event.data?.type === 'BANCADALAB_RETORNO_CONECTASUS') {
        if (event.data.status || event.data.resultado) {
          exibirNotificacao(
            `✓ Automação Conecta SUS: Agendamento #${event.data.agendamento || ''} processado com sucesso!`,
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
    }, 4000);
  };

  const handleEnviarParaApoio = async (e: React.FormEvent) => {
    e.preventDefault();
    const agendamentoLimpo = agendamentoBusca.trim();

    if (!agendamentoLimpo) {
      exibirNotificacao('Por favor, informe o número do agendamento ou guia SADT.', 'alerta');
      return;
    }

    setProcessando(true);

    try {
      const destinoObj = DESTINOS_LABORATORIO.find((d) => d.id === laboratorioDestino) || DESTINOS_LABORATORIO[0];

      const novoRegistro: RegistroEnvioApoio = {
        id: `apoio_${Date.now()}`,
        agendamento: agendamentoLimpo,
        paciente: nomePaciente.trim() || undefined,
        destinoId: destinoObj.id,
        destinoNome: destinoObj.nome,
        tipoExame,
        motivo: motivoEnvio,
        dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'pronto_extensao',
      };

      // Disparar evento para a extensão se conectada
      window.postMessage(
        {
          type: 'BANCADALAB_EXECUTAR_APOIO',
          agendamento: agendamentoLimpo,
          destinoExames: {
            bioquimica: laboratorioDestino === 'SaoLucas' ? 'SAO_LUCAS' : 'OUTRO_APOIO',
            hemograma: 'APOIO_MS',
          },
          destinoNome: destinoObj.nome,
          bancadaUrl: window.location.origin,
        },
        '*'
      );

      // Simulação rápida de processamento de bancada
      await new Promise((r) => setTimeout(r, 600));

      const listaAtualizada = [novoRegistro, ...historicoEnvios];
      setHistoricoEnvios(listaAtualizada);
      setUltimoResultado(novoRegistro);
      localStorage.setItem('bancadalab_historico_apoio', JSON.stringify(listaAtualizada));

      // Limpar campos
      setAgendamentoBusca('');
      setNomePaciente('');
      exibirNotificacao(`Agendamento #${agendamentoLimpo} encaminhado para ${destinoObj.nome}!`, 'sucesso');
    } catch (err) {
      exibirNotificacao('Erro ao processar encaminhamento para apoio.', 'erro');
    } finally {
      setProcessando(false);
    }
  };

  const copiarAgendamento = (id: string, valor: string) => {
    navigator.clipboard.writeText(valor);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
    exibirNotificacao(`Agendamento #${valor} copiado para a área de transferência!`, 'sucesso');
  };

  const removerRegistro = (id: string) => {
    const listaAtualizada = historicoEnvios.filter((item) => item.id !== id);
    setHistoricoEnvios(listaAtualizada);
    localStorage.setItem('bancadalab_historico_apoio', JSON.stringify(listaAtualizada));
    if (ultimoResultado?.id === id) {
      setUltimoResultado(null);
    }
  };

  const limparHistorico = () => {
    if (confirm('Deseja realmente limpar toda a fila de envios para o apoio?')) {
      setHistoricoEnvios([]);
      setUltimoResultado(null);
      localStorage.removeItem('bancadalab_historico_apoio');
      exibirNotificacao('Histórico de apoios esvaziado.', 'alerta');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
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
              Logística Externa • Contingência Analítica
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
              {extensaoAtiva ? 'Extensão Chrome Ativa' : 'Extensão Standby'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Envio para <span className="text-cyan-400">Laboratório de Apoio</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Redirecionamento de guias SADT e remessas de exames para parceiros externos (São Lucas & Apoio SUS).
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
        </div>
      </div>

      {/* Grid Principal: Formulário + Painel Informativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulário de Configuração (2 colunas no desktop) */}
        <div className="lg:col-span-2 bg-gradient-to-b from-[#0a1222] to-[#070b14] border border-cyan-950/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Configurar Encaminhamento de Agendamento
            </h2>
            <span className="text-[11px] font-medium text-slate-400 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5">
              SADT / Guia Digital
            </span>
          </div>

          <form onSubmit={handleEnviarParaApoio} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Número do Agendamento / Guia <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={agendamentoBusca}
                    onChange={(e) => setAgendamentoBusca(e.target.value)}
                    placeholder="Ex: 36389 ou 202409"
                    className="w-full bg-[#050811] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all min-h-[44px] outline-none font-mono"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Paciente <span className="text-slate-500 font-normal">(Opcional para conferência)</span>
                </label>
                <input
                  type="text"
                  value={nomePaciente}
                  onChange={(e) => setNomePaciente(e.target.value)}
                  placeholder="Ex: Maria da Silva"
                  className="w-full bg-[#050811] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all min-h-[44px] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Laboratório de Destino (Apoio)
                </label>
                <select
                  value={laboratorioDestino}
                  onChange={(e) => setLaboratorioDestino(e.target.value)}
                  className="w-full bg-[#050811] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white transition-all min-h-[44px] outline-none cursor-pointer"
                >
                  {DESTINOS_LABORATORIO.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0a1222] text-white">
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo / Especialidade do Exame
                </label>
                <select
                  value={tipoExame}
                  onChange={(e) => setTipoExame(e.target.value)}
                  className="w-full bg-[#050811] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white transition-all min-h-[44px] outline-none cursor-pointer"
                >
                  <option value="Bioquímica / Geral">Bioquímica / Rotina Geral</option>
                  <option value="Hormônios & Imunologia">Hormônios & Imunologia</option>
                  <option value="Sorologia Especializada">Sorologia Especializada</option>
                  <option value="Urinálise / Microbiologia">Cultura / Microbiologia Externa</option>
                  <option value="Hemograma / Hematologia">Hematologia de Alta Resolução</option>
                  <option value="Outros">Outro Exame Terceirizado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Motivo / Justificativa do Encaminhamento
              </label>
              <input
                type="text"
                value={motivoEnvio}
                onChange={(e) => setMotivoEnvio(e.target.value)}
                placeholder="Ex: Manutenção preventiva do equipamento / Exame não padronizado local"
                className="w-full bg-[#050811] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all min-h-[44px] outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={processando}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-50 min-h-[48px] cursor-pointer"
              >
                {processando ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                    <span>Processando e Sincronizando com Extensão...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 text-white" />
                    <span>Marcar para Apoio & Disparar SADT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card Lateral Informativo: Destino & Dicas Operacionais */}
        <div className="space-y-6">
          <div className="bg-[#0a1222]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Destino Selecionado
            </h3>
            
            {(() => {
              const destinoAtual = DESTINOS_LABORATORIO.find((d) => d.id === laboratorioDestino) || DESTINOS_LABORATORIO[0];
              return (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-2">
                  <p className="text-sm font-semibold text-cyan-300">{destinoAtual.nome}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{destinoAtual.descricao}</p>
                  <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Canal de integração pronto</span>
                  </div>
                </div>
              );
            })()}

            <div className="mt-5 space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  A extensão Chrome automatiza a impressão de etiquetas e o preenchimento do formulário SADT no portal Conecta SUS.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Certifique-se de embalar os tubos com refrigeração adequada para a rota do malote.
                </span>
              </div>
            </div>
          </div>

          {/* Card do Último Agendamento Processado */}
          {ultimoResultado && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-xl animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Último Envio Registrado
                </span>
                <span className="text-[10px] text-slate-400">{ultimoResultado.dataHora}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Agendamento:</span>
                  <span className="text-sm font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded">
                    #{ultimoResultado.agendamento}
                  </span>
                </div>
                {ultimoResultado.paciente && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Paciente:</span>
                    <span className="text-xs font-medium text-slate-200">{ultimoResultado.paciente}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Destino:</span>
                  <span className="text-xs font-semibold text-cyan-300">{ultimoResultado.destinoNome}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex gap-2">
                <button
                  type="button"
                  onClick={() => copiarAgendamento('ultimo', ultimoResultado.agendamento)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold transition-all min-h-[38px] cursor-pointer"
                >
                  {copiadoId === 'ultimo' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoId === 'ultimo' ? 'Copiado!' : 'Copiar Número'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Histórico de Remessas do Dia */}
      <div className="bg-[#0a1222] border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              Remessas & Agendamentos Encaminhados
              <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30 ml-2">
                {historicoEnvios.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fila local de atendimento para expedição diária de malote externo.
            </p>
          </div>

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

        {historicoEnvios.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Nenhum agendamento despachado hoje</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Utilize o formulário acima para registrar encaminhamentos para o Laboratório São Lucas ou parceiros externos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 font-semibold">Hora</th>
                  <th className="py-3 px-4 font-semibold">Agendamento</th>
                  <th className="py-3 px-4 font-semibold">Paciente</th>
                  <th className="py-3 px-4 font-semibold">Laboratório Destino</th>
                  <th className="py-3 px-4 font-semibold">Exame / Motivo</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historicoEnvios.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{item.dataHora}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">#{item.agendamento}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{item.paciente || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">{item.destinoNome}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{item.tipoExame}</div>
                      <div className="text-[11px] text-slate-500">{item.motivo}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        Pronto p/ Extensão
                      </span>
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

