"use client";

import React, { useState, useEffect } from "react";
import {
  obterOperadorAtivo,
  definirOperadorAtivo,
  obterOperadoresCadastrados,
  adicionarOperador,
  removerOperador,
  sincronizarOperadoresComServidor,
} from "@/lib/operadoresStore";
import { UserCheck, UserPlus, Trash2, X, Check, ShieldCheck } from "lucide-react";

interface ModalSelecionarOperadorProps {
  aberto: boolean;
  onFechar: () => void;
}

export const ModalSelecionarOperador: React.FC<ModalSelecionarOperadorProps> = ({
  aberto,
  onFechar,
}) => {
  const [operadores, setOperadores] = useState<string[]>([]);
  const [operadorAtivo, setOperadorAtivo] = useState<string>("");
  const [novoNome, setNovoNome] = useState<string>("");
  const [carregando, setCarregando] = useState<boolean>(false);

  useEffect(() => {
    if (!aberto) return;

    setOperadores(obterOperadoresCadastrados());
    setOperadorAtivo(obterOperadorAtivo());

    // Sincronizar com servidor
    sincronizarOperadoresComServidor().then((res) => {
      setOperadores(res.operadores);
      setOperadorAtivo(res.ativo);
    });

    const handleAtualizado = (e: any) => {
      if (e.detail?.lista) setOperadores(e.detail.lista);
      if (e.detail?.ativo !== undefined) setOperadorAtivo(e.detail.ativo);
    };

    window.addEventListener("operador-atualizado", handleAtualizado);
    return () => window.removeEventListener("operador-atualizado", handleAtualizado);
  }, [aberto]);

  if (!aberto) return null;

  const handleSelecionar = (nome: string) => {
    definirOperadorAtivo(nome);
    setOperadorAtivo(nome);
    setTimeout(() => {
      onFechar();
    }, 150);
  };

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpo = novoNome.trim();
    if (!limpo) return;

    setCarregando(true);
    try {
      const atualizados = await adicionarOperador(limpo);
      setOperadores(atualizados);
      definirOperadorAtivo(limpo);
      setOperadorAtivo(limpo);
      setNovoNome("");
    } finally {
      setCarregando(false);
    }
  };

  const handleRemover = async (nome: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remover o operador "${nome}" da lista do laboratório?`)) {
      setCarregando(true);
      try {
        const atualizados = await removerOperador(nome);
        setOperadores(atualizados);
        setOperadorAtivo(obterOperadorAtivo());
      } finally {
        setCarregando(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 text-slate-900 relative">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Responsável do Procedimento
              </h3>
              <p className="text-xs text-slate-500">
                Identificação do operador da triagem e bancada no dia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informação explicativa */}
        <div className="my-3 p-2.5 bg-purple-50/70 border border-purple-200/60 rounded-xl text-[11.5px] text-purple-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span>
            Selecione quem está realizando a triagem/pipetagem hoje. Esse nome sairá identificado nos relatórios de faturamento e conferência do apoio.
          </span>
        </div>

        {/* Lista de Operadores Cadastrados */}
        <div className="mt-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
            Profissionais Cadastrados ({operadores.length})
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {operadores.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Nenhum operador cadastrado. Cadastre o primeiro abaixo.
              </div>
            ) : (
              operadores.map((nome) => {
                const isSelected = operadorAtivo === nome;
                return (
                  <div
                    key={nome}
                    onClick={() => handleSelecionar(nome)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${
                          isSelected ? "bg-white text-purple-700" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {nome.charAt(0)}
                      </div>
                      <span className="truncate">{nome}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full ml-1">
                          Ativo Hoje
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && <Check className="w-4 h-4 text-white mr-1" />}
                      <button
                        type="button"
                        onClick={(e) => handleRemover(nome, e)}
                        className={`p-1 rounded-lg transition ${
                          isSelected
                            ? "hover:bg-purple-700 text-purple-200"
                            : "hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                        }`}
                        title="Remover operador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cadastrar Novo Operador */}
        <form onSubmit={handleAdicionar} className="mt-4 pt-3 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
            Cadastrar Novo Operador
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: Felipe Belchior, Mariana, etc."
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={carregando || !novoNome.trim()}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>
        </form>

        {/* Rodapé */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
