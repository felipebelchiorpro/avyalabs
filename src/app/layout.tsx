import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BancadaLab SUS | Automação de Bancada & Laudos",
  description:
    "Sistema de Automação de Bancadas de Rotina (Urinálise, EDTA/Hemograma, Rápidos, PSO e VDRL) para Postos de Saúde SUS com persistência em Cloudflare D1.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BancadaLab SUS",
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black">
        <div className="flex h-screen overflow-hidden">
          
          {/* MENU LATERAL FIXO */}
          <aside className="w-72 bg-[#0c1220]/80 backdrop-blur-xl border-r border-white/[0.08] flex flex-col justify-between z-20 select-none hidden md:flex">
            
            {/* Topo do Menu: Logo e Identificação */}
            <div className="p-5 border-b border-white/[0.06]">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shadow-lg shadow-cyan-500/5 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                    Bancada<span className="text-cyan-400">Lab</span>
                    <span className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/20">SUS</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">Automação de Bancada & Laudos</p>
                </div>
              </Link>

              {/* Responsável do Dia */}
              <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                    F
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Responsável</p>
                    <p className="text-xs font-medium text-slate-200">Felipe A. Belchior</p>
                  </div>
                </div>
                <Link href="/configuracoes" className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 transition-colors">
                  Trocar
                </Link>
              </div>
            </div>

            {/* Links de Navegação (Bancadas e Relatórios) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
              
              {/* Bancadas de Rotina */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">Bancadas de Rotina</p>
                <div className="space-y-1">
                  <Link href="/urina" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      <span>Tiragem do Dia</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">BANCADA</span>
                  </Link>

                  <Link href="/triagem-edta" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                      <span>Triagem EDTA</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">ROXO</span>
                  </Link>

                  <Link href="/vdrl" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      <span>VDRL em Lote</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">LOTE</span>
                  </Link>

                  <Link href="/retidos-glicada" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      <span>Tubos Retidos Glicada</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">APOIO</span>
                  </Link>
                </div>
              </div>

              {/* Entrada & Integração */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">Entrada & Integração</p>
                <div className="space-y-1">
                  <Link href="/importar" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span>Importar Conecta SUS</span>
                  </Link>
                </div>
              </div>

              {/* Laudos & Relatórios */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">Laudos & Relatórios</p>
                <div className="space-y-1">
                  <Link href="/laudos" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>Relatórios & Canhotos</span>
                  </Link>
                  <Link href="/consulta" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>Histórico de Pacientes</span>
                  </Link>
                </div>
              </div>

              {/* Sistema & Nuvem */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">Sistema & Nuvem</p>
                <div className="space-y-1">
                  <Link href="/configuracoes" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span>Conexão & Nuvem D1</span>
                  </Link>
                </div>
              </div>

            </div>

            {/* Rodapé do Menu (Status Online / Sincronizado) */}
            <div className="p-4 border-t border-white/[0.06] bg-black/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                  Nuvem Sincronizada
                </span>
                <Link href="/configuracoes" className="text-[10px] text-cyan-400 hover:underline cursor-pointer font-medium">
                  Status
                </Link>
              </div>
              <p className="text-[10px] text-slate-400">Online • SUS • Caconde</p>
            </div>

          </aside>

          {/* CONTEÚDO PRINCIPAL DA PÁGINA */}
          <main className="flex-1 overflow-y-auto bg-[#090d16]">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
