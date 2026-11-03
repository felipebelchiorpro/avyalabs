"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ModalSelecionarOperador } from "@/components/ModalSelecionarOperador";
import {
  obterOperadorAtivo,
  sincronizarOperadoresComServidor,
} from "@/lib/operadoresStore";
import {
  FlaskConical,
  Package,
  FileSpreadsheet,
  Printer,
  History,
  Settings,
  ShieldCheck,
  Wifi,
  WifiOff,
  CloudCheck,
  Sparkles,
  Menu,
  X,
  UserCheck,
  ChevronRight,
  User,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [sheetsStatus, setSheetsStatus] = useState<"checking" | "connected" | "local">("checking");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [operadorAtivo, setOperadorAtivo] = useState<string>("");
  const [modalOperadorAberto, setModalOperadorAberto] = useState<boolean>(false);
  const [drawerMobileAberto, setDrawerMobileAberto] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(typeof window !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Inicializar operador ativo
    setOperadorAtivo(obterOperadorAtivo());
    sincronizarOperadoresComServidor().then((res) => {
      if (res.ativo) setOperadorAtivo(res.ativo);
    });

    const handleOperador = (e: any) => {
      if (e.detail?.ativo !== undefined) {
        setOperadorAtivo(e.detail.ativo);
      }
    };
    window.addEventListener("operador-atualizado", handleOperador);

    const checkConnection = () => {
      fetch("/api/test-sheets")
        .then((res) => res.json())
        .then((data) => {
          if (data.isConfigured && data.ok) {
            setSheetsStatus("connected");
          } else {
            setSheetsStatus("local");
          }
        })
        .catch(() => setSheetsStatus("local"));
    };

    checkConnection();
    const interval = setInterval(checkConnection, 20000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("operador-atualizado", handleOperador);
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    {
      href: "/",
      label: "Tiragem do Dia",
      sublabel: "Urina, Rápidos & PSO",
      icon: Printer,
      badge: "Bancada",
      color: "text-sky-600",
      activeBg: "bg-sky-50 text-sky-950 border-sky-300 font-black",
    },
    {
      href: "/triagem-edta",
      label: "Triagem EDTA",
      sublabel: "Hemograma & Glicada",
      icon: Sparkles,
      badge: "Roxo",
      color: "text-purple-600",
      activeBg: "bg-purple-50 text-purple-950 border-purple-300 font-black",
    },
    {
      href: "/importar",
      label: "Importar Conecta SUS",
      sublabel: "Subir Planilha Diária",
      icon: FileSpreadsheet,
      color: "text-emerald-600",
      activeBg: "bg-emerald-50 text-emerald-950 border-emerald-300 font-black",
    },
    {
      href: "/vdrl",
      label: "Lote VDRL",
      sublabel: "Lançamento Coletivo",
      icon: Package,
      color: "text-amber-600",
      activeBg: "bg-amber-50 text-amber-950 border-amber-300 font-black",
    },
    {
      href: "/laudos",
      label: "Relatórios & Canhotos",
      sublabel: "Impressões e Guias A4",
      icon: FlaskConical,
      color: "text-teal-600",
      activeBg: "bg-teal-50 text-teal-950 border-teal-300 font-black",
    },
    {
      href: "/consulta",
      label: "Histórico",
      sublabel: "Busca de Pacientes",
      icon: History,
      color: "text-indigo-600",
      activeBg: "bg-indigo-50 text-indigo-950 border-indigo-300 font-black",
    },
    {
      href: "/configuracoes",
      label: "Conexão & Nuvem",
      sublabel: "Google Sheets & Config",
      icon: Settings,
      color: "text-slate-600",
      activeBg: "bg-slate-100 text-slate-950 border-slate-300 font-black",
    },
  ];

  // Bancadas exclusivas para o celular (somente contagem no telefone)
  const mobileBancadas = [
    { id: "urina", href: "/?bancada=urina", label: "Urina I", icon: FlaskConical },
    { id: "imuno", href: "/?bancada=imuno", label: "Rápidos", icon: Sparkles },
    { id: "coag", href: "/?bancada=coag", label: "Coag/TAP", icon: History },
    { id: "pso", href: "/?bancada=pso", label: "S. Oculto", icon: FileSpreadsheet },
    { id: "edta", href: "/triagem-edta", label: "EDTA", icon: Sparkles, isDirectRoute: true },
  ];

  const [bancadaAtual, setBancadaAtual] = useState<string>("urina");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("bancada");
      if (p) setBancadaAtual(p);
    }
  }, [pathname]);

  return (
    <>
      {/* MODAL DE SELEÇÃO DE OPERADOR / RESPONSÁVEL DO DIA */}
      <ModalSelecionarOperador
        aberto={modalOperadorAberto}
        onFechar={() => setModalOperadorAberto(false)}
      />

      {/* ========================================================================= */}
      {/* 1. MENU LATERAL (SIDEBAR) EXCLUSIVO PARA DESKTOP (MD:FLEX)                */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-40 flex-col justify-between p-4 shadow-xs print:hidden">
        {/* Topo do Sidebar: Logo do Laboratório */}
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <Logo />
          </div>

          {/* Card do Responsável do Procedimento / Operador Ativo */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                Responsável do Dia
              </span>
              <button
                type="button"
                onClick={() => setModalOperadorAberto(true)}
                className="text-[10.5px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100/70 hover:bg-purple-200/80 px-2 py-0.5 rounded-md transition"
              >
                Trocar
              </button>
            </div>
            <div
              onClick={() => setModalOperadorAberto(true)}
              className="flex items-center gap-2 cursor-pointer group"
              title="Clique para selecionar ou trocar o operador"
            >
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-xs group-hover:scale-105 transition">
                {operadorAtivo ? operadorAtivo.charAt(0) : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 truncate">
                  {operadorAtivo || "Selecionar Responsável"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {operadorAtivo ? "Triagem & Pipetagem" : "Clique para definir"}
                </p>
              </div>
            </div>
          </div>

          {/* Links de Navegação Verticais */}
          <nav className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Menu de Módulos
            </span>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs transition-all ${
                    isActive
                      ? link.activeBg + " shadow-2xs"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? link.color : "text-slate-400"}`} />
                    <div className="truncate text-left">
                      <span className="font-bold block leading-tight">{link.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                        {link.sublabel}
                      </span>
                    </div>
                  </div>
                  {link.badge && (
                    <span
                      className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                        link.badge === "Roxo"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé do Sidebar: Status de Conectividade e Nuvem */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {/* Status Nuvem Google Sheets */}
          <Link
            href="/configuracoes"
            className={`flex items-center justify-between p-2 rounded-xl border text-[11px] font-bold transition ${
              sheetsStatus === "connected"
                ? "bg-teal-50/80 text-teal-800 border-teal-200 hover:bg-teal-100/70"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <CloudCheck className={`w-4 h-4 ${sheetsStatus === "connected" ? "text-teal-600" : "text-slate-400"}`} />
              <span>{sheetsStatus === "connected" ? "Nuvem Sincronizada" : "Modo Local"}</span>
            </div>
            <span className="text-[10px] font-bold text-teal-700 underline">Acessar</span>
          </Link>

          {/* Status Conexão Internet */}
          <div className="flex items-center justify-between px-2 text-[10.5px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="text-emerald-700 font-bold">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  <span className="text-rose-700 font-bold">Offline</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400">SUS • Caconde</span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. BARRA SUPERIOR PARA MOBILE (MD:HIDDEN)                                 */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 md:hidden print:hidden px-3 h-14 flex items-center justify-between shadow-2xs">
        {/* Logo Mobile */}
        <Logo />

        <div className="flex items-center gap-1.5">
          {/* Botão Operador Ativo no Mobile */}
          <button
            type="button"
            onClick={() => setModalOperadorAberto(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-full text-[11px] font-bold transition"
            title="Responsável pelo procedimento"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span className="max-w-[85px] truncate">{operadorAtivo || "Operador"}</span>
          </button>

          {/* Status Nuvem */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              sheetsStatus === "connected" ? "bg-teal-500" : "bg-slate-300"
            }`}
            title={sheetsStatus === "connected" ? "Nuvem Conectada" : "Modo Local"}
          />

          {/* Botão Menu Gaveta Hambúrguer */}
          <button
            type="button"
            onClick={() => setDrawerMobileAberto(true)}
            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="Abrir Menu Completo"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. DRAWER (GAVETA DESLIZANTE) MOBILE                                      */}
      {/* ========================================================================= */}
      {drawerMobileAberto && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDrawerMobileAberto(false)}
          />
          <div className="fixed inset-y-0 right-0 w-72 bg-white shadow-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Logo />
                <button
                  type="button"
                  onClick={() => setDrawerMobileAberto(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Responsável no Drawer */}
              <div className="my-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                  Responsável da Bancada
                </span>
                <p className="text-xs font-black text-slate-900 mt-0.5 truncate">
                  {operadorAtivo || "Nenhum operador selecionado"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerMobileAberto(false);
                    setModalOperadorAberto(true);
                  }}
                  className="mt-2 w-full py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold transition shadow-xs text-center"
                >
                  Trocar Responsável
                </button>
              </div>

              {/* Links de Navegação Mobile */}
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDrawerMobileAberto(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                        isActive
                          ? link.activeBg
                          : "border-transparent text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${link.color}`} />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              Laboratório Municipal de Caconde • SUS
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BARRA INFERIOR MOBILE (BOTTOM NAV PARA BANCADAS)                       */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden print:hidden px-1 py-1 shadow-lg">
        <div className="grid grid-cols-5 gap-0.5">
          {mobileBancadas.map((b) => {
            const Icon = b.icon;
            const isSelected =
              b.id === "edta"
                ? pathname === "/triagem-edta"
                : pathname === "/" && bancadaAtual === b.id;

            return (
              <Link
                key={b.id}
                href={b.href}
                onClick={() => {
                  if (b.id !== "edta") {
                    setBancadaAtual(b.id);
                    window.dispatchEvent(new CustomEvent("trocar-bancada", { detail: b.id }));
                  }
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-center transition-all active:scale-95 ${
                  isSelected
                    ? b.id === "edta"
                      ? "text-purple-700 bg-purple-50 font-black shadow-2xs border border-purple-200"
                      : "text-sky-700 bg-sky-50 font-black shadow-2xs border border-sky-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isSelected
                      ? b.id === "edta"
                        ? "text-purple-600"
                        : "text-sky-600"
                      : "text-slate-400"
                  }`}
                />
                <span className="text-[9.5px] mt-0.5 leading-tight tracking-tight truncate max-w-full font-bold">
                  {b.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
