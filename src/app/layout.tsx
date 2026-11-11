import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarLateral } from "@/components/SidebarLateral";
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
  themeColor: "#070b14",
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
      <body className="bg-[#070b14] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black">
        <div className="flex h-screen overflow-hidden">
          
          {/* MENU LATERAL FIXO (NOVO TEMA AZUL NOITE PROFUNDO COM MODAL DE RESPONSÁVEL) */}
          <SidebarLateral />

          {/* CONTEÚDO PRINCIPAL DA PÁGINA */}
          <main className="flex-1 overflow-y-auto bg-[#070b14]">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
