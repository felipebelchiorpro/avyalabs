"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Calendar,
  UserCheck,
  Stethoscope,
  X,
  FileCheck,
  Trash2,
  Clock,
  Layers,
  Check,
} from "lucide-react";

export type StatusTriagem = "pendente" | "concluido" | "retido_local" | "pronto_grade" | "retido_bancada";

export interface PacienteRotinaEdta {
  prontuario: string;
  dataNascimento: string; // DD/MM/AAAA
  nome: string;
  temHemo?: boolean;
  temGlicada?: boolean;
  tipo_destino?: "hemograma_glicada" | "apenas_hemograma" | "apenas_glicada";
  medico?: string;
  retidoParaFracionar?: boolean;
  dataAtendimento: string; // YYYY-MM-DD
  status?: StatusTriagem;
}

interface TriagemEdtaRealProps {
  rotinaDoDia?: PacienteRotinaEdta[];
  onAtualizarRotina?: (rotinaAtualizada: PacienteRotinaEdta[]) => void;
  onSalvarItemServidor?: (prontuario: string, updates: Partial<PacienteRotinaEdta>) => Promise<boolean>;
  medicosCadastrados?: string[];
}

const limparProntuario = (p: string | number) => String(p || "").trim().replace(/^0+/, "");
const limparDataNasc = (d: string) => String(d || "").replace(/\D/g, "");

export default function TriagemEdtaReal({
  rotinaDoDia = [],
  onAtualizarRotina,
  onSalvarItemServidor,
  medicosCadastrados = [],
}: TriagemEdtaRealProps) {
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [prontuarioInput, setProntuarioInput] = useState("");
  const [dataNascInput, setDataNascInput] = useState("");
  const [pacienteAtivo, setPacienteAtivo] = useState<PacienteRotinaEdta | null>(null);
  const [mensagemToast, setMensagemToast] = useState<{ tipo: "sucesso" | "alerta" | "erro"; texto: string } | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Filtra os pacientes reais com base na data selecionada
  const pacientesDoDia = useMemo(() => {
    return rotinaDoDia.filter((p) => p.dataAtendimento === dataSelecionada);
  }, [rotinaDoDia, dataSelecionada]);

  // Estatísticas de bancada
  const stats = useMemo(() => {
    const total = pacientesDoDia.length;
    const concluidos = pacientesDoDia.filter((p) => p.status === "concluido" || p.status === "pronto_grade").length;
    const fracionar = pacientesDoDia.filter((p) => p.retidoParaFracionar).length;
    const pendentes = total - concluidos;
    return { total, concluidos, fracionar, pendentes };
  }, [pacientesDoDia]);

  const dispararToast = (texto: string, tipo: "sucesso" | "alerta" | "erro" = "sucesso") => {
    setMensagemToast({ tipo, texto });
    setTimeout(() => setMensagemToast(null), 3500);
  };

  const handleBuscaManual = (e: React.FormEvent) => {
    e.preventDefault();
    const prontuarioLimpo = limparProntuario(prontuarioInput);
    const dataNascLimpa = limparDataNasc(dataNascInput);

    if (!prontuarioLimpo) {
      dispararToast("Informe o número do prontuário para validar o tubo.", "alerta");
      return;
    }

    const encontrado = pacientesDoDia.find((p) => {
      const pId = limparProntuario(p.prontuario);
      const pNasc = limparDataNasc(p.dataNascimento);
      const matchPront = pId === prontuarioLimpo;
      const matchNasc = !dataNascLimpa || pNasc === dataNascLimpa;
      return matchPront && matchNasc;
    });

    if (encontrado) {
      setPacienteAtivo({ ...encontrado });
      setConfirmandoExclusao(false);
    } else {
      dispararToast("Paciente não localizado ou data de nascimento divergente nesta data.", "alerta");
    }
  };

  const atualizarCampoPaciente = <K extends keyof PacienteRotinaEdta>(campo: K, valor: PacienteRotinaEdta[K]) => {
    setPacienteAtivo((prev) => (prev ? { ...prev, [campo]: valor } : null));
  };

  const salvarEConcluir = async (prontuario: string) => {
    if (!pacienteAtivo) return;
    setSalvando(true);

    const novoStatus: StatusTriagem = "concluido";

    // 1. Atualização via callback de estado pai
    if (onAtualizarRotina) {
      const rotinaAtualizada = rotinaDoDia.map((p) =>
        p.prontuario === prontuario
          ? {
              ...p,
              status: novoStatus,
              medico: pacienteAtivo.medico,
              retidoParaFracionar: !!pacienteAtivo.retidoParaFracionar,
            }
          : p
      );
      onAtualizarRotina(rotinaAtualizada);
    }

    // 2. Persistência remota opcional (caso passe a prop de servidor)
    if (onSalvarItemServidor) {
      try {
        await onSalvarItemServidor(prontuario, {
          status: novoStatus,
          medico: pacienteAtivo.medico,
          retidoParaFracionar: !!pacienteAtivo.retidoParaFracionar,
        });
      } catch (err) {
        console.error("Falha ao salvar no servidor remoto:", err);
      }
    }

    setPacienteAtivo(null);
    setProntuarioInput("");
    setDataNascInput("");
    setSalvando(false);
    dispararToast("✓ Paciente concluído com sucesso!", "sucesso");
  };

  // Função para apagar/remover o paciente da rotina (glicada recente, cancelamento, etc.)
  const apagarPaciente = (prontuario: string) => {
    if (onAtualizarRotina) {
      const rotinaAtualizada = rotinaDoDia.filter((p) => p.prontuario !== prontuario);
      onAtualizarRotina(rotinaAtualizada);
    }
    setPacienteAtivo(null);
    setConfirmandoExclusao(false);
    dispararToast("🗑️ Paciente removido da triagem do dia.", "alerta");
  };

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 font-sans bg-[#F8FAFC] rounded-2xl border border-slate-200/90 shadow-xs">
      
      {/* Toast Feedback - UI/UX Pro Max */}
      {mensagemToast && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4 text-sm font-medium shadow-md transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            mensagemToast.tipo === "sucesso"
              ? "bg-[#059669] text-white"
              : mensagemToast.tipo === "alerta"
              ? "bg-[#D97706] text-white"
              : "bg-[#DC2626] text-white"
          }`}
        >
          {mensagemToast.tipo === "sucesso" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {mensagemToast.tipo === "alerta" && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {mensagemToast.tipo === "erro" && <X className="w-5 h-5 shrink-0" />}
          <span>{mensagemToast.texto}</span>
        </div>
      )}

      {/* Header Healthcare Enterprise */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-4 mb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#0891B2] shadow-xs">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
              Triagem EDTA — Bancada Clínica
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ambiente de Bancada (Validação, Fracionamento & Gestão de Rotina)
            </p>
          </div>
        </div>

        {/* Badges de Resumo em Tempo Real */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#059669] border border-emerald-200 font-semibold">
            {stats.concluidos} Concluídos
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-[#D97706] border border-amber-200 font-semibold">
            {stats.fracionar} Fracionamento
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
            {stats.pendentes} Pendentes
          </span>
        </div>
      </div>

      {/* Barra de Filtro de Data */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-5">
        <div className="flex items-center gap-2 text-[#164E63]">
          <Calendar className="w-4 h-4 text-[#0891B2]" />
          <label htmlFor="filtro-data-edta" className="text-xs font-bold uppercase tracking-wider">
            Data da Rotina:
          </label>
        </div>
        <input
          id="filtro-data-edta"
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0891B2] transition-colors"
        />
        <span className="text-xs font-medium text-slate-500 sm:ml-auto">
          Total na data: <strong className="text-[#0F172A]">{pacientesDoDia.length}</strong> paciente(s)
        </span>
      </div>

      {/* Formulário de Busca e Bipagem */}
      <form
        onSubmit={handleBuscaManual}
        className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-5 transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#0891B2]" />
            Leitura de Folha / Entrada Manual
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Bipagem ou digitação rápida</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Prontuário"
              value={prontuarioInput}
              onChange={(e) => setProntuarioInput(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] border border-slate-300 rounded-xl text-sm font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0891B2] transition-colors"
            />
          </div>

          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Nascimento (DD/MM/AAAA)"
              value={dataNascInput}
              onChange={(e) => setDataNascInput(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] border border-slate-300 rounded-xl text-sm font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0891B2] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="sm:col-span-1 min-h-[44px] bg-[#0F172A] hover:bg-slate-800 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </form>

      {/* Card de Decisão e Gestão do Paciente Ativo */}
      {pacienteAtivo && (
        <div className="bg-white border-2 border-[#0891B2] p-5 rounded-2xl mb-5 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-3 border-b border-slate-100">
            <span className="text-xs bg-cyan-100 text-[#164E63] px-3 py-1 rounded-lg font-bold tracking-wide">
              PRONTUÁRIO: {pacienteAtivo.prontuario}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Nasc: <strong className="text-slate-700">{pacienteAtivo.dataNascimento}</strong>
            </div>
          </div>

          <h3 className="text-base font-bold text-[#0F172A] mb-3">{pacienteAtivo.nome}</h3>

          {/* Campo Editável do Médico Solicitante */}
          <div className="mb-3.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#0891B2]" />
              Médico Solicitante (Editável):
            </label>
            <input
              type="text"
              list="lista-medicos-sugestoes"
              value={pacienteAtivo.medico || ""}
              onChange={(e) => atualizarCampoPaciente("medico", e.target.value)}
              placeholder="Nome do médico solicitante..."
              className="w-full px-3 py-2 min-h-[40px] border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891B2] transition-colors"
            />
            {medicosCadastrados.length > 0 && (
              <datalist id="lista-medicos-sugestoes">
                {medicosCadastrados.map((med) => (
                  <option key={med} value={med} />
                ))}
              </datalist>
            )}
          </div>

          {/* Opção de Retenção para Fracionamento (Checkbox Touch Target 44px) */}
          <div className="mb-5 bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl">
            <label
              htmlFor="retidoFracionar"
              className="flex items-center gap-3 cursor-pointer select-none min-h-[36px]"
            >
              <input
                type="checkbox"
                id="retidoFracionar"
                checked={!!pacienteAtivo.retidoParaFracionar}
                onChange={(e) => atualizarCampoPaciente("retidoParaFracionar", e.target.checked)}
                className="w-5 h-5 rounded text-[#0891B2] border-slate-300 focus:ring-[#0891B2] cursor-pointer"
              />
              <div>
                <span className="text-sm font-bold text-[#92400E] block">
                  Retido para fracionar (Fica no laboratório)
                </span>
                <span className="text-xs text-amber-800/80 font-medium">
                  Marque se o tubo precisa ter alíquota fracionada para glicada ou dosagem local.
                </span>
              </div>
            </label>
          </div>

          {/* Caixa de Confirmação de Exclusão Segura */}
          {confirmandoExclusao ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Remover paciente da triagem do dia?
              </div>
              <p className="text-xs text-red-700 mb-3">
                Esta ação removerá o paciente da rotina ativa (útil para casos de exame cancelado ou coleta repetida recente).
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => apagarPaciente(pacienteAtivo.prontuario)}
                  className="bg-[#DC2626] hover:bg-red-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Sim, Excluir Paciente
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(false)}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : null}

          {/* Botões de Ação com Touch Target 44px */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => salvarEConcluir(pacienteAtivo.prontuario)}
              disabled={salvando}
              className="flex-1 min-h-[44px] bg-[#059669] hover:bg-emerald-700 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {salvando ? "Salvando..." : "✓ Confirmar & Concluir"}
            </button>

            {!confirmandoExclusao && (
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(true)}
                className="min-h-[44px] bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            )}

            <button
              onClick={() => {
                setPacienteAtivo(null);
                setConfirmandoExclusao(false);
              }}
              className="min-h-[44px] bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 px-5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Rotina com Badges */}
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          Pacientes Carregados ({dataSelecionada})
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          {pacientesDoDia.length} paciente(s)
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="p-3">Prontuário</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Nascimento</th>
              <th className="p-3">Solicitante</th>
              <th className="p-3">Fracionamento</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pacientesDoDia.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FlaskConical className="w-8 h-8 text-slate-300" />
                    <span>Nenhum paciente carregado para esta data.</span>
                  </div>
                </td>
              </tr>
            ) : (
              pacientesDoDia.map((p) => {
                const isConcluido = p.status === "concluido" || p.status === "pronto_grade";

                return (
                  <tr
                    key={p.prontuario}
                    onClick={() => {
                      setPacienteAtivo({ ...p });
                      setConfirmandoExclusao(false);
                    }}
                    className="hover:bg-cyan-50/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold text-slate-700">{p.prontuario}</td>
                    <td className="p-3 font-medium text-slate-800">{p.nome}</td>
                    <td className="p-3 text-slate-600 font-mono">{p.dataNascimento}</td>
                    <td className="p-3 text-slate-600 truncate max-w-[180px]">{p.medico || "—"}</td>
                    <td className="p-3">
                      {p.retidoParaFracionar ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-[#92400E] px-2 py-0.5 rounded text-[10px] font-bold">
                          <Layers className="w-3 h-3" /> Fica Local
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isConcluido
                            ? "bg-emerald-100 text-[#059669]"
                            : "bg-amber-100 text-[#D97706]"
                        }`}
                      >
                        {isConcluido ? "Concluído" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
