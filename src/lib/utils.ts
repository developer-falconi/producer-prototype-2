import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PreventStatusEnum } from "./types";
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