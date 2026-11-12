import { LaudoUrina, RotinaItem } from "@/types/urinalise";
import { obterHojeIsoLocal } from "@/lib/extratorBancada";

export const HOJE_ISO_DATE = obterHojeIsoLocal();

// MODO PRODUÇÃO: Lista limpa para receber apenas os dados reais da planilha do laboratório
export const MOCK_ROTINA: RotinaItem[] = [];

export const MOCK_LAUDOS: LaudoUrina[] = [];
