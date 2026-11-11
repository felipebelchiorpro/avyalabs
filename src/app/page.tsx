'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Layers,
  TestTube2,
  Archive,
  FlaskConical,
  Settings,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function HomeDashboard() {
  const [dbStatus, setDbStatus] = useState<'verificando' | 'online' | 'erro'>('verificando');
  const [totalLaudos, setTotalLaudos] = useState<number>(0);

  useEffect(() => {
    // Verificação de conexão com as rotas de API/D1
    async function checkConnection() {
      try {
        const res = await fetch('/api/laudos-dia');
        if (res.ok) {
          const data = await res.json();
          setDbStatus('online');
          if (data && typeof data.total === 'number') {
            setTotalLaudos(data.total);
          }
        } else {
          setDbStatus('erro');
        }
      } catch {
        setDbStatus('erro');
      }
    }
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-10 font-sans">
      {/* Cabeçalho Institucional / Boas-vindas */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              SUS • Caconde
            </span>
            <span className="text-xs text-slate-400">Ambiente de Produção</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Bancada<span className="text-cyan-400">Lab</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Automação de Bancada, Triagem e Laudos Integrados ao Cloudflare D1
          </p>
        </div>

        {/* Status Badge Dinâmico */}
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              dbStatus === 'online'
                ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                : dbStatus === 'verificando'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-400'
            }`}
          />
          <div className="text-xs">
            <p className="font-medium text-slate-200">Conexão Cloudflare D1</p>
            <p className="text-slate-400 capitalize">
              {dbStatus === 'online' ? 'Online / Sincronizado' : dbStatus === 'verificando' ? 'Verificando...' : 'Instável'}
            </p>
          </div>
        </div>
      </header>

      {/* Grid de Atalhos / Bancadas de Rotina */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Bancadas de Rotina e Operação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Triagem do Dia / Urinálise */}
          <Link
            href="/urina"
            className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-500/40 p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase">
                Principal
              </span>
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
              Triagem do Dia
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Urina, exames rápidos e rotina geral de atendimento.
            </p>
          </Link>

          {/* Card: Triagem EDTA */}
          <Link
            href="/triagem-edta"
            className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-purple-500/40 p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <TestTube2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                Teclado Ágil
              </span>
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors">
              Triagem EDTA
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hemograma e HbA1c com digitação rápida por protocolo.
            </p>
          </Link>

          {/* Card: VDRL em Lote */}
          <Link
            href="/vdrl"
            className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-blue-500/40 p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase">
                Lote
              </span>
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
              VDRL em Lote
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Lançamento coletivo rápido de resultados sorológicos.
            </p>
          </Link>

          {/* Card: Tubos Retidos */}
          <Link
            href="/retidos-glicada"
            className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/40 p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Archive className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                Controle
              </span>
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Tubos Retidos
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Gradinha local e controle interno de hemoglobina glicada.
            </p>
          </Link>

        </div>
      </section>

      {/* Resumo de Atividades Recentes ou Atalhos de Configuração */}
      <section className="bg-white/[0.015] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Sistema & Banco de Dados</h3>
          </div>
          <Link
            href="/configuracoes"
            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
          >
            Configurações & Cloudflare D1 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          O sistema está operando com persistência remota no banco Cloudflare D1 via API segura. Todos os registros de triagem, laudos e configurações institucionais estão sincronizados em tempo real.
        </p>
      </section>
    </div>
  );
}
