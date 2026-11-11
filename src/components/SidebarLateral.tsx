'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FlaskConical,
  TestTube2,
  Layers,
  Archive,
  UploadCloud,
  FileText,
  Clock,
  Settings,
  User,
  Check,
  Plus,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export function SidebarLateral() {
  const pathname = usePathname();
  const [responsavelAtivo, setResponsavelAtivo] = useState<string>('Felipe A. Belchior');
  const [modalOperadorAberto, setModalOperadorAberto] = useState<boolean>(false);
  const [operadores, setOperadores] = useState<string[]>([
    'Felipe A. Belchior',
    'Farmacêutico(a) Bioquímico(a)',
    'Bancada Geral SUS',
    'Operador 01',
  ]);
  const [novoOperador, setNovoOperador] = useState<string>('');
  const [carregandoOperadores, setCarregandoOperadores] = useState<boolean>(false);
  const [statusNuvem, setStatusNuvem] = useState<'sincronizado' | 'verificando'>('sincronizado');

  // Carregar responsável e lista de operadores
  useEffect(() => {
    // 1. Tentar ler do localStorage
    try {
      const respSalvo = localStorage.getItem('bancadalab_responsavel_ativo');
      if (respSalvo) {
        setResponsavelAtivo(respSalvo);
      }
    } catch (_) {}

    // 2. Buscar da API
    carregarOperadoresApi();
  }, []);

  const carregarOperadoresApi = async () => {
    try {
      setCarregandoOperadores(true);
      const res = await fetch('/api/operadores');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.operadores) && data.operadores.length > 0) {
          setOperadores(data.operadores);
          // Se não tiver responsável local salvo, usa o ativo da API
          const salvoLocal = typeof window !== 'undefined' ? localStorage.getItem('bancadalab_responsavel_ativo') : null;
          if (!salvoLocal && data.ativo) {
            setResponsavelAtivo(data.ativo);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar operadores:', err);
    } finally {
      setCarregandoOperadores(false);
    }
  };

  const selecionarResponsavel = async (nome: string) => {
    setResponsavelAtivo(nome);
    try {
      localStorage.setItem('bancadalab_responsavel_ativo', nome);
      // Salva também na API como ativo
      await fetch('/api/operadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'definir_ativo', ativo: nome }),
      });
    } catch (_) {}
    setModalOperadorAberto(false);
  };

  const adicionarNovoOperador = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novoOperador.trim();
    if (!nomeLimpo) return;

    if (!operadores.includes(nomeLimpo)) {
      const novaLista = [...operadores, nomeLimpo];
      setOperadores(novaLista);
      selecionarResponsavel(nomeLimpo);
      setNovoOperador('');

      try {
        await fetch('/api/operadores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acao: 'adicionar', nome: nomeLimpo }),
        });
      } catch (_) {}
    } else {
      selecionarResponsavel(nomeLimpo);
      setNovoOperador('');
    }
  };

  const inicialNome = responsavelAtivo ? responsavelAtivo.charAt(0).toUpperCase() : 'F';

  const menuSections = [
    {
      titulo: 'Bancadas de Rotina',
      itens: [
        {
          label: 'Tiragem do Dia',
          href: '/urina',
          badge: 'BANCADA',
          badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          icon: FlaskConical,
          iconColor: 'text-cyan-400 group-hover:text-cyan-300',
        },
        {
          label: 'Triagem EDTA',
          href: '/triagem-edta',
          badge: 'ROXO',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: TestTube2,
          iconColor: 'text-purple-400 group-hover:text-purple-300',
        },
        {
          label: 'VDRL em Lote',
          href: '/vdrl',
          badge: 'LOTE',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          icon: Layers,
          iconColor: 'text-blue-400 group-hover:text-blue-300',
        },
        {
          label: 'Tubos Retidos Glicada',
          href: '/retidos-glicada',
          badge: 'APOIO',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: Archive,
          iconColor: 'text-emerald-400 group-hover:text-emerald-300',
        },
      ],
    },
    {
      titulo: 'Entrada & Integração',
      itens: [
        {
          label: 'Importar Conecta SUS',
          href: '/importar',
          badge: null,
          badgeColor: '',
          icon: UploadCloud,
          iconColor: 'text-amber-400 group-hover:text-amber-300',
        },
      ],
    },
    {
      titulo: 'Laudos & Relatórios',
      itens: [
        {
          label: 'Relatórios & Canhotos',
          href: '/laudos',
          badge: null,
          badgeColor: '',
          icon: FileText,
          iconColor: 'text-rose-400 group-hover:text-rose-300',
        },
        {
          label: 'Histórico de Pacientes',
          href: '/consulta',
          badge: null,
          badgeColor: '',
          icon: Clock,
          iconColor: 'text-sky-400 group-hover:text-sky-300',
        },
      ],
    },
    {
      titulo: 'Sistema & Nuvem',
      itens: [
        {
          label: 'Conexão & Nuvem D1',
          href: '/configuracoes',
          badge: null,
          badgeColor: '',
          icon: Settings,
          iconColor: 'text-slate-300 group-hover:text-white',
        },
      ],
    },
  ];

  return (
    <>
      {/* ASIDE LATERAL FIXO (TEMA AZUL NOITE PROFUNDO E ELEGANTE) */}
      <aside className="w-72 bg-gradient-to-b from-[#0a101f] via-[#070b14] to-[#04070e] border-r border-cyan-950/40 flex flex-col justify-between z-20 select-none hidden md:flex shadow-2xl">
        
        {/* Topo do Menu: Logo Institucional SUS Caconde */}
        <div className="p-5 border-b border-white/[0.06] bg-[#0c1424]/40 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-all">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Bancada<span className="text-cyan-400">Lab</span>
                <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-400/30 tracking-wide">
                  SUS
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Automação de Bancada & Laudos</p>
            </div>
          </Link>

          {/* Cartão do Responsável Técnico do Dia */}
          <div className="mt-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between transition-colors shadow-inner">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-indigo-600/30 text-purple-200 font-bold text-xs flex items-center justify-center border border-purple-400/30 shrink-0 shadow-sm">
                {inicialNome}
              </div>
              <div className="truncate">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Responsável do Dia
                </p>
                <p className="text-xs font-semibold text-slate-100 truncate" title={responsavelAtivo}>
                  {responsavelAtivo}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOperadorAberto(true)}
              className="text-[11px] text-cyan-300 hover:text-white font-bold px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              Trocar
            </button>
          </div>
        </div>

        {/* Links de Navegação com Contraste Elevado */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {menuSections.map((secao) => (
            <div key={secao.titulo}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400/90 px-3 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                {secao.titulo}
              </p>
              <div className="space-y-1">
                {secao.itens.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/15 text-white border border-cyan-400/30 shadow-md shadow-cyan-500/5'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${item.iconColor}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé do Menu (Status da Nuvem D1) */}
        <div className="p-4 border-t border-white/[0.06] bg-[#060a14]/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
              Nuvem D1 Conectada
            </span>
            <Link
              href="/configuracoes"
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
            >
              Verificar
            </Link>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Bancada SUS • Caconde / SP</p>
        </div>

      </aside>

      {/* ============================================================== */}
      {/* MODAL INTELIGENTE DE SELEÇÃO DE RESPONSÁVEL TÉCNICO            */}
      {/* ============================================================== */}
      {modalOperadorAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#0a1120] border border-white/10 rounded-2xl shadow-2xl p-6 text-slate-100">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Selecionar Responsável</h3>
                  <p className="text-xs text-slate-400">Farmacêutico / Bioquímico de Bancada</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOperadorAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Operadores Cadastrados */}
            <div className="my-5 space-y-2 max-h-60 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Operadores Ativos
              </p>
              {operadores.map((op) => {
                const isSelected = op === responsavelAtivo;

                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => selecionarResponsavel(op)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-white border border-cyan-400/40 shadow-sm'
                        : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-slate-300'
                      }`}>
                        {op.charAt(0).toUpperCase()}
                      </div>
                      <span>{op}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Adicionar Novo Operador Rápido */}
            <form onSubmit={adicionarNovoOperador} className="pt-4 border-t border-white/10">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Cadastrar Novo Nome
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoOperador}
                  onChange={(e) => setNovoOperador(e.target.value)}
                  placeholder="Nome do Farmacêutico(a)..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!novoOperador.trim()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </form>

            {/* Rodapé Informativo */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Gravado automaticamente nos laudos
              </span>
              <button
                type="button"
                onClick={() => setModalOperadorAberto(false)}
                className="text-xs font-semibold text-slate-300 hover:text-white"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

