import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { EventFeeDto, PreventStatusEnum, SettlementEnum, ShareMeta } from "./types";
import * as qrcode from 'qrcode';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | Date, formatType: 'full' | 'short' = 'full'): string {
  const date = new Date(dateString);

  if (formatType === 'short') {
    const day = date.getDate();
    const monthNamesShort = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const month = monthNamesShort[date.getMonth()];
    return `${day < 10 ? '0' + day : day} ${month}`;
  }

  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export const formatPrice = (price: string | number): string => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};

export const formatEventPrice = (price: string | number): string => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};

export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('es-AR', { month: 'short' }).toUpperCase();

  return `${day} ${month}`;
}

export const paymentMethodLabels: Record<'mercadopago' | 'bank_transfer' | 'free', string> = {
  mercadopago: 'Mercado Pago',
  bank_transfer: 'Transferencia Bancaria',
  free: 'Liberado',
};

export const preventStatusLabels: Record<PreventStatusEnum, string> = {
  [PreventStatusEnum.ACTIVE]: 'ACTIVO',
  [PreventStatusEnum.INACTIVE]: 'INACTIVO',
  [PreventStatusEnum.COMPLETED]: 'COMPLETADO',
  [PreventStatusEnum.CANCELLED]: 'CANCELADO',
  [PreventStatusEnum.SOLD_OUT]: 'AGOTADO',
};

export function calculateTimeRemaining(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = new Date();
  const target = new Date(targetDate);
  const difference = target.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total: difference };
}

export const generateQrCode = async (data: string): Promise<string> => {
  try {
    return await qrcode.toDataURL(data, { errorCorrectionLevel: 'H' });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export const toNum = (v: string | number | null | undefined) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const roundTo = (n: number, step: number) => {
  const k = Math.round(n / step);
  return round2(k * step);
};

function pctStrToNum(v?: string | number | null) {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

function normalizeSplit(alpha: number, beta: number): [number, number] {
  let a = clamp01(alpha), b = clamp01(beta);
  const sum = a + b;
  if (sum === 0) return [1, 0];
  if (Math.abs(sum - 1) < 1e-6) return [a, b];
  return [a / sum, b / sum];
}

export type SettlementMode = SettlementEnum.PRODUCER | 'PLATFORM';

export function solveFeesFront(params: {
  baseAmount: number;
  eventFee: EventFeeDto | null | undefined;
  roundPriceStep?: number;
  roundApplicationFeeStep?: number;
  ensureExactNetTarget?: boolean;
  paymentMethod?: 'mercadopago' | 'bank_transfer' | 'free';
}) {
  const B = round2(params.baseAmount);

  // --- Base de política ---
  let p = clamp01(Number(params.eventFee?.platformFeeShare ?? 0.15));
  let alpha = clamp01(Number(params.eventFee?.clientFeeShare ?? 1));
  let beta = clamp01(Number(params.eventFee?.producerFeeShare ?? 0));
  [alpha, beta] = normalizeSplit(alpha, beta);

  // --- Overrides por método (se transforman en platformFeeShare SOLO para ese método) ---
  const method = params.paymentMethod ?? 'mercadopago';
  const mpOverrideP = Number(pctStrToNum(params.eventFee?.mpCommissionShare));
  const xferOverrideP = Number(pctStrToNum(params.eventFee?.transferCommissionShare));
  if (method === 'mercadopago' && mpOverrideP > 0) {
    p = clamp01(mpOverrideP);
  } else if (method === 'bank_transfer' && xferOverrideP > 0) {
    p = clamp01(xferOverrideP);
  }

  const p_client = round2(p * alpha);
  const p_prod = round2(p * beta);

  // --- Costo del procesador (NO usamos los overrides como r_mp) ---
  const mpSettlementRate = Number(pctStrToNum(params.eventFee?.mpSettlement?.mpFeeRateWithIva));
  let r_mp = 0;
  if (method === 'mercadopago') {
    r_mp = clamp01(mpSettlementRate > 0 ? mpSettlementRate : 0);
  } else if (method === 'bank_transfer') {
    r_mp = 0;
  } else {
    r_mp = 0;
  }

  // Precio al comprador
  let P = round2(B * (1 + p_client));
  if (params.roundPriceStep && params.roundPriceStep > 0) P = roundTo(P, params.roundPriceStep);

  const MP = round2(P * r_mp);

  // Neto objetivo productor
  const s = 1.00;
  const N_target = round2((s - p_prod) * B);

  const settlementMode = String(params.eventFee?.settlementMode || SettlementEnum.PRODUCER).toUpperCase() as SettlementMode;

  // Marketplace fee para cerrar neto
  let A = settlementMode === SettlementEnum.PRODUCER ? Math.max(0, round2((P - MP) - N_target)) : 0;
  const stepA = params.roundApplicationFeeStep ?? 0.01;
  if (stepA > 0) A = roundTo(A, stepA);

  if (settlementMode === SettlementEnum.PRODUCER && params.ensureExactNetTarget) {
    const net = round2(P - MP - A);
    const diff = round2(N_target - net);
    if (Math.abs(diff) >= 0.01) A = round2(A - diff);
  }

  const netToProducer = settlementMode === SettlementEnum.PRODUCER ? round2(P - MP - A) : N_target;
  const platformRevenue = settlementMode === SettlementEnum.PRODUCER ? A : round2((P - MP) - N_target);

  return {
    priceToBuyer: P,
    applicationFee: A,
    mpFee: MP,
    netToProducer,
    platformRevenue,
    breakdown: {
      base: B,
      pClientAmount: round2(p_client * B),
      pProducerAmount: round2(p_prod * B),
      surcharge: round2(P - B),
      r_mp,
      p,
      alpha,
      beta,
    },
    settlementMode,
  };
}

function normalizeOrigin(u?: string | null): string | undefined {
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function buildShareMeta(ev: {
  id: number;
  key?: string | null;
  name: string;
  description?: string | null;
  flyer?: string | null;
  producer?: { name?: string | null; domain?: string | null } | null;
}): ShareMeta {
  const plainDesc = String(ev.description || '')
    .replace(/\r?\n+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
  const description = plainDesc.length > 180 ? plainDesc.slice(0, 177) + '…' : plainDesc;

  return {
    title: ev.name,
    description,
    image: ev.flyer || '',
    type: 'event',
    slugOrId: ev.key?.trim()?.length ? ev.key.trim() : String(ev.id),
    producerName: ev.producer?.name || undefined,
    defaultOrigin: normalizeOrigin(ev.producer?.domain || undefined),
  };
}