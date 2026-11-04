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
  PanelLeftClose,
  PanelLeftOpen,
  Baby,
  Boxes,
  Layers,
  ArrowRight,
  Clock,
} from "lucide-react";

interface ItemMenu {
  id: string;
  href?: string;
  onClick?: () => void;
  label: string;
  sublabel: string;
  icon: any;
  badge?: string;
  color: string;
  activeBg?: string;
}

interface GrupoMenu {
  titulo: string;
  itens: ItemMenu[];
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [sheetsStatus, setSheetsStatus] = useState<"checking" | "connected" | "local">("checking");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [operadorAtivo, setOperadorAtivo] = useState<string>("");
  const [modalOperadorAberto, setModalOperadorAberto] = useState<boolean>(false);
  const [drawerMobileAberto, setDrawerMobileAberto] = useState<boolean>(false);
  const [sidebarCompacta, setSidebarCompacta] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(typeof window !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Carregar estado de sidebar compacta do localStorage
    if (typeof window !== "undefined") {
      const compactSalvo = localStorage.getItem("bancadalab_sidebar_compact") === "true";
      setSidebarCompacta(compactSalvo);
    }

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

  const toggleSidebarCompacta = () => {
    const novo = !sidebarCompacta;
    setSidebarCompacta(novo);
    try {
      localStorage.setItem("bancadalab_sidebar_compact", String(novo));
      window.dispatchEvent(new CustomEvent("sidebar-compact-change", { detail: novo }));
    } catch (_) {}
  };

  // MÓDULOS AGRUPADOS POR CATEGORIA TEMÁTICA
  const gruposMenu: GrupoMenu[] = [
    {
      titulo: "Bancadas de Rotina",
      itens: [
        {
          id: "tiragem_dia",
          href: "/",
          label: "Tiragem do Dia",
          sublabel: "Urina, Rápidos & PSO",
          icon: Printer,
          badge: "Bancada",
          color: "text-sky-600",
          activeBg: "bg-sky-50 text-sky-950 border-sky-300 font-black",
        },
        {
          id: "triagem_edta",
          href: "/triagem-edta",
          label: "Triagem EDTA",
          sublabel: "Hemograma & HbA1c",
          icon: Sparkles,
          badge: "Roxo",
          color: "text-purple-600",
          activeBg: "bg-purple-50 text-purple-950 border-purple-300 font-black",
        },
        {
          id: "lote_vdrl",
          href: "/vdrl",
          label: "VDRL em Lote",
          sublabel: "Lançamento Coletivo",
          icon: Package,
          badge: "Lote",
          color: "text-amber-600",
          activeBg: "bg-amber-50 text-amber-950 border-amber-300 font-black",
        },
        {
          id: "retidos_glicada",
          href: "/retidos-glicada",
          label: "Tubos Retidos Glicada",
          sublabel: "Gradinha Local / Envio",
          icon: Clock,
          badge: "Apoio",
          color: "text-amber-600",
          activeBg: "bg-amber-50 text-amber-950 border-amber-300 font-black",
        },
      ],
    },
    {
      titulo: "Entrada & Integração",
      itens: [
        {
          id: "importar",
          href: "/importar",
          label: "Importar Conecta SUS",
          sublabel: "Subir Planilha / PDF",
          icon: FileSpreadsheet,
          color: "text-emerald-600",
          activeBg: "bg-emerald-50 text-emerald-950 border-emerald-300 font-black",
        },
      ],
    },
    {
      titulo: "Laudos & Relatórios",
      itens: [
        {
          id: "relatorios",
          href: "/laudos",
          label: "Relatórios & Canhotos",
          sublabel: "Impressões e Guias A4",
          icon: FlaskConical,
          color: "text-teal-600",
          activeBg: "bg-teal-50 text-teal-950 border-teal-300 font-black",
        },
        {
          id: "historico",
          href: "/consulta",
          label: "Histórico",
          sublabel: "Busca de Pacientes",
          icon: History,
          color: "text-indigo-600",
          activeBg: "bg-indigo-50 text-indigo-950 border-indigo-300 font-black",
        },
      ],
    },
    {
      titulo: "Sistema & Nuvem",
      itens: [
        {
          id: "configuracoes",
          href: "/configuracoes",
          label: "Conexão & Nuvem",
          sublabel: "Google Sheets & Config",
          icon: Settings,
          color: "text-slate-600",
          activeBg: "bg-slate-100 text-slate-950 border-slate-300 font-black",
        },
      ],
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
      {/* MODAIS GLOBAIS DO SISTEMA */}
      <ModalSelecionarOperador
        aberto={modalOperadorAberto}
        onFechar={() => setModalOperadorAberto(false)}
      />

      {/* ========================================================================= */}
      {/* 1. MENU LATERAL (SIDEBAR) EXCLUSIVO PARA DESKTOP (MD:FLEX)                */}
      {/* Adaptativo para monitores menores (1366x768, 1280x800 e modo compacto)   */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-40 flex-col justify-between shadow-xs print:hidden transition-all duration-200 ${
          sidebarCompacta ? "w-20 p-2.5 items-center" : "w-64 p-3.5"
        }`}
      >
        {/* Topo do Sidebar: Logo e Botão de Recolher */}
        <div className="w-full space-y-3">
          <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
            <Logo compact={sidebarCompacta} />
            <button
              type="button"
              onClick={toggleSidebarCompacta}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title={
                sidebarCompacta
                  ? "Expandir menu lateral"
                  : "Recolher menu lateral para ganhar espaço na tela"
              }
            >
              {sidebarCompacta ? (
                <PanelLeftOpen className="w-4 h-4 text-sky-600" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          {/* Card do Responsável do Procedimento / Operador Ativo */}
          {!sidebarCompacta ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  Responsável do Dia
                </span>
                <button
                  type="button"
                  onClick={() => setModalOperadorAberto(true)}
                  className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100/70 hover:bg-purple-200/80 px-1.5 py-0.5 rounded-md transition cursor-pointer"
                >
                  Trocar
                </button>
              </div>
              <div
                onClick={() => setModalOperadorAberto(true)}
                className="flex items-center gap-2 cursor-pointer group"
                title="Clique para selecionar ou trocar o operador"
              >
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-black uppercase shrink-0 shadow-xs group-hover:scale-105 transition">
                  {operadorAtivo ? operadorAtivo.charAt(0) : <User className="w-3 h-3" />}
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
          ) : (
            <div
              onClick={() => setModalOperadorAberto(true)}
              className="w-10 h-10 mx-auto rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-800 flex items-center justify-center cursor-pointer transition shadow-2xs"
              title={`Responsável: ${operadorAtivo || "Clique para definir"}`}
            >
              <UserCheck className="w-5 h-5 text-purple-700" />
            </div>
          )}

          {/* Links de Navegação Agrupados (com rolagem suave para monitores menores) */}
          <nav className="w-full space-y-3 overflow-y-auto max-h-[calc(100vh-230px)] pr-1 scrollbar-thin">
            {gruposMenu.map((grupo) => (
              <div key={grupo.titulo} className="space-y-1">
                {!sidebarCompacta ? (
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 px-2 block mb-0.5">
                    {grupo.titulo}
                  </span>
                ) : (
                  <div className="w-6 h-px bg-slate-200 mx-auto my-1.5" />
                )}

                {grupo.itens.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.href ? pathname === link.href : false;

                  if (link.onClick) {
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={link.onClick}
                        title={sidebarCompacta ? `${link.label} - ${link.sublabel}` : undefined}
                        className={`w-full flex items-center ${
                          sidebarCompacta
                            ? "justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            : "justify-between px-2.5 py-1.5 rounded-xl border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                        } text-xs transition-all cursor-pointer`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${link.color}`} />
                          {!sidebarCompacta && (
                            <div className="truncate text-left">
                              <span className="font-bold block leading-tight text-[11.5px]">
                                {link.label}
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-medium block leading-tight truncate">
                                {link.sublabel}
                              </span>
                            </div>
                          )}
                        </div>
                        {!sidebarCompacta && link.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 bg-pink-100 text-pink-800">
                            {link.badge}
                          </span>
                        )}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={link.id}
                      href={link.href || "/"}
                      title={sidebarCompacta ? `${link.label} - ${link.sublabel}` : undefined}
                      className={`flex items-center ${
                        sidebarCompacta
                          ? `justify-center p-2 rounded-xl ${
                              isActive
                                ? "bg-sky-100 text-sky-950 font-black"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`
                          : `justify-between px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                              isActive
                                ? link.activeBg + " shadow-2xs"
                                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                            }`
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? link.color : "text-slate-500"}`} />
                        {!sidebarCompacta && (
                          <div className="truncate text-left">
                            <span className="font-bold block leading-tight text-[11.5px]">
                              {link.label}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-medium block leading-tight truncate">
                              {link.sublabel}
                            </span>
                          </div>
                        )}
                      </div>
                      {!sidebarCompacta && link.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                            link.badge === "Roxo"
                              ? "bg-purple-100 text-purple-800"
                              : link.badge === "Imuno"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Rodapé do Sidebar: Status de Conectividade e Nuvem */}
        <div className="w-full pt-2.5 border-t border-slate-100 space-y-1.5">
          {/* Status Nuvem Google Sheets */}
          {!sidebarCompacta ? (
            <Link
              href="/configuracoes"
              className={`flex items-center justify-between p-2 rounded-xl border text-[10.5px] font-bold transition ${
                sheetsStatus === "connected"
                  ? "bg-teal-50/80 text-teal-800 border-teal-200 hover:bg-teal-100/70"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CloudCheck className={`w-3.5 h-3.5 ${sheetsStatus === "connected" ? "text-teal-600" : "text-slate-400"}`} />
                <span>{sheetsStatus === "connected" ? "Nuvem Sincronizada" : "Modo Local"}</span>
              </div>
              <span className="text-[9.5px] font-bold text-teal-700 underline">Acessar</span>
            </Link>
          ) : (
            <Link
              href="/configuracoes"
              className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition"
              title="Configurações de Nuvem & Planilha"
            >
              <CloudCheck className={`w-4 h-4 ${sheetsStatus === "connected" ? "text-teal-600" : "text-slate-400"}`} />
            </Link>
          )}

          {/* Status Conexão Internet */}
          {!sidebarCompacta && (
            <div className="flex items-center justify-between px-2 text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className="text-emerald-700 font-bold">Online</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    <span className="text-rose-700 font-bold">Offline</span>
                  </>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400">SUS • Caconde</span>
            </div>
          )}
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

      {/* SELETOR DE ABAS PRINCIPAIS MOBILE PWA (URINÁLISE vs TRIAGEM EDTA) */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-1.5 md:hidden print:hidden">
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/80 rounded-xl">
          <Link
            href="/"
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition text-center ${
              pathname === "/"
                ? "bg-white text-sky-950 font-black shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
            <span>Urinálise</span>
          </Link>
          <Link
            href="/triagem-edta"
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition text-center ${
              pathname === "/triagem-edta"
                ? "bg-purple-700 text-white font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Triagem EDTA</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DRAWER (GAVETA DESLIZANTE) MOBILE COM CATEGORIAS ORGANIZADAS           */}
      {/* ========================================================================= */}
      {drawerMobileAberto && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDrawerMobileAberto(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
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
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
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
                  className="mt-2 w-full py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-xs text-center"
                >
                  Trocar Responsável
                </button>
              </div>

              {/* Links de Navegação Mobile Agrupados */}
              <nav className="space-y-3">
                {gruposMenu.map((grupo) => (
                  <div key={grupo.titulo} className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block mb-1">
                      {grupo.titulo}
                    </span>
                    {grupo.itens.map((link) => {
                      const Icon = link.icon;
                      const isActive = link.href ? pathname === link.href : false;

                      if (link.onClick) {
                        return (
                          <button
                            key={link.id}
                            type="button"
                            onClick={() => {
                              setDrawerMobileAberto(false);
                              link.onClick?.();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-transparent text-slate-700 hover:bg-slate-50 text-xs font-bold transition text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${link.color}`} />
                              <span>{link.label}</span>
                            </div>
                            {link.badge ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase bg-pink-100 text-pink-800">
                                {link.badge}
                              </span>
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={link.id}
                          href={link.href || "/"}
                          onClick={() => setDrawerMobileAberto(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition ${
                            isActive
                              ? link.activeBg
                              : "border-transparent text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${link.color}`} />
                            <span>{link.label}</span>
                          </div>
                          {link.badge ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase bg-slate-100 text-slate-700">
                              {link.badge}
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              BancadaLab SUS • Laboratório Municipal de Caconde
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
