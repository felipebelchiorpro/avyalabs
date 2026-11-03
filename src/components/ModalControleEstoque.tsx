"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  X,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShoppingCart,
  Layers,
  Sparkles,
} from "lucide-react";

export interface ItemEstoque {
  id: string;
  nome: string;
  categoria: "tubos" | "tiras" | "frascos" | "rapidos";
  unidade: string;
  quantidade: number;
  minimoRecomendado: number;
  solicitarReposicao?: boolean;
}

const ITENS_ESTOQUE_PADRAO: ItemEstoque[] = [
  {
    id: "tubo_edta",
    nome: "Tubos EDTA Tampa Roxa 4 mL (Hemograma / HbA1c / VHS)",
    categoria: "tubos",
    unidade: "unidades",
    quantidade: 180,
    minimoRecomendado: 50,
  },
  {
    id: "microtubo_500ul",
    nome: "Microtubos de Fracionamento 1.5 mL (Alíquotas HbA1c)",
    categoria: "tubos",
    unidade: "unidades",
    quantidade: 240,
    minimoRecomendado: 80,
  },
  {
    id: "tubo_citrato",
    nome: "Tubos Tampa Azul Citrato de Sódio (TAP / TTPA)",
    categoria: "tubos",
    unidade: "unidades",
    quantidade: 95,
    minimoRecomendado: 30,
  },
  {
    id: "tiras_urina",
    nome: "Tiras Reagentes de Urina 10 Parâmetros",
    categoria: "tiras",
    unidade: "tiras (frascos)",
    quantidade: 320,
    minimoRecomendado: 100,
  },
  {
    id: "frascos_urina",
    nome: "Frascos Coletores Universais de Urina 80 mL",
    categoria: "frascos",
    unidade: "frascos",
    quantidade: 140,
    minimoRecomendado: 60,
  },
  {
    id: "coletores_fezes",
    nome: "Coletores de Fezes com pazinha (PSO)",
    categoria: "frascos",
    unidade: "frascos",
    quantidade: 85,
    minimoRecomendado: 40,
  },
  {
    id: "kits_vdrl",
    nome: "Kits de Teste Rápido Sífilis / VDRL",
    categoria: "rapidos",
    unidade: "testes",
    quantidade: 60,
    minimoRecomendado: 25,
  },
  {
    id: "kits_hcg",
    nome: "Kits de Teste Rápido Beta-HCG Tira",
    categoria: "rapidos",
    unidade: "testes",
    quantidade: 45,
    minimoRecomendado: 20,
  },
];

interface ModalControleEstoqueProps {
  aberto: boolean;
  onFechar: () => void;
}

export const ModalControleEstoque: React.FC<ModalControleEstoqueProps> = ({
  aberto,
  onFechar,
}) => {
  const [itens, setItens] = useState<ItemEstoque[]>(ITENS_ESTOQUE_PADRAO);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [mensagemSalvo, setMensagemSalvo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const salvo = localStorage.getItem("bancadalab_estoque_v1");
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItens(parsed);
          }
        }
      } catch (_) {}
    }
  }, []);

  const salvarEstoque = (novos: ItemEstoque[]) => {
    setItens(novos);
    try {
      localStorage.setItem("bancadalab_estoque_v1", JSON.stringify(novos));
      setMensagemSalvo("Estoque salvo com sucesso!");
      setTimeout(() => setMensagemSalvo(null), 2000);
    } catch (_) {}
  };

  const alterarQuantidade = (id: string, delta: number) => {
    const atualizados = itens.map((item) => {
      if (item.id === id) {
        const novaQtd = Math.max(0, item.quantidade + delta);
        return {
          ...item,
          quantidade: novaQtd,
          solicitarReposicao: novaQtd < item.minimoRecomendado,
        };
      }
      return item;
    });
    salvarEstoque(atualizados);
  };

  const toggleReposicao = (id: string) => {
    const atualizados = itens.map((item) => {
      if (item.id === id) {
        return { ...item, solicitarReposicao: !item.solicitarReposicao };
      }
      return item;
    });
    salvarEstoque(atualizados);
  };

  if (!aberto) return null;

  const itensFiltrados =
    filtroCategoria === "todos"
      ? itens
      : itens.filter((i) => i.categoria === filtroCategoria);

  const totalCriticos = itens.filter(
    (i) => i.quantidade < i.minimoRecomendado || i.solicitarReposicao
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-amber-300">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Controle de Insumos & Tubos de Bancada
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Conferência rápida de materiais da rotina diária
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra Informativa / Filtros */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroCategoria("todos")}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filtroCategoria === "todos"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Todos ({itens.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria("tubos")}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filtroCategoria === "tubos"
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Tubos EDTA & Citrato
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria("tiras")}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filtroCategoria === "tiras"
                  ? "bg-sky-700 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Tiras & Frascos
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria("rapidos")}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filtroCategoria === "rapidos"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Testes Rápidos
            </button>
          </div>

          {totalCriticos > 0 ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[11px] border border-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              {totalCriticos} itens com estoque baixo
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Estoque abastecido
            </span>
          )}
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 space-y-1">
          {itensFiltrados.map((item) => {
            const estaBaixo = item.quantidade < item.minimoRecomendado;
            return (
              <div
                key={item.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-2xl transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                      {item.nome}
                    </p>
                    {estaBaixo && (
                      <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                        Baixo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mínimo recomendado:{" "}
                    <strong className="text-slate-700">{item.minimoRecomendado}</strong> {item.unidade}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  {/* Controle de Quantidade (+ / -) */}
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl shadow-2xs p-0.5">
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.id, -10)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Diminuir 10"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-black text-sm text-slate-900 px-3 min-w-[50px] text-center">
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.id, +10)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Adicionar 10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Botão Pedido Reposição */}
                  <button
                    type="button"
                    onClick={() => toggleReposicao(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      item.solicitarReposicao
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{item.solicitarReposicao ? "Solicitado" : "Pedir"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {mensagemSalvo ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {mensagemSalvo}
              </span>
            ) : (
              "Dados salvos na memória da bancada"
            )}
          </span>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};