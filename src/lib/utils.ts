import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string, formatType: 'full' | 'short' = 'full'): string {
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