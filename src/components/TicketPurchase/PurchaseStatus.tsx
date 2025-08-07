import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { PurchaseData } from '@/lib/types';
import { Button } from '../ui/button';
import { cn, formatPrice } from '@/lib/utils';

interface PurchaseStatusProps {
  purchaseData: PurchaseData;
  total: number;
  status: { status: 'success' | 'error', message: string } | null;
  onResetAndClose: () => void;
}

export const PurchaseStatus: React.FC<PurchaseStatusProps> = ({
  purchaseData,
  total,
  status,
  onResetAndClose
}) => {
  const isSuccess = status?.status === 'success';
  const icon = isSuccess ? (
    <CheckCircle className="w-10 h-10 text-green-500" />
  ) : (
    <XCircle className="w-10 h-10 text-red-500" />
  );

  const title = isSuccess ? '¡Compra Exitosa! 🎉' : 'Error en la Compra 😔';
  const message = isSuccess
    ? 'Tu entrada ha sido confirmada.\nUna vez validado tu pago.\nRecibirás un email con todos los detalles del evento.\nNo olvides revisar tu casilla de spam'
    : status?.message || 'Hubo un problema al procesar tu compra. Por favor, inténtalo de nuevo o contacta a soporte.';

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg w-full space-y-6">
        <div className="flex flex-col w-full items-center justify-center gap-4 mb-6">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl flex-shrink-0",
            isSuccess ? 'bg-gradient-to-br from-green-500 to-green-700 animate-pulse-grow' : 'bg-gradient-to-br from-red-600 to-red-800'
          )}>
            {icon}
          </div>
          <h1 className={cn(
            "text-3xl md:text-4xl font-extrabold animate-fade-in line-clamp-2",
            isSuccess ? 'text-green-300' : 'text-red-400'
          )}>
            {title}
          </h1>
        </div>

        <p className="text-gray-300 text-sm md:text-lg mb-6 animate-fade-in whitespace-pre-line text-left">
          {message}
        </p>

        {isSuccess && (
          <div className="space-y-3 text-base text-gray-400 animate-fade-in bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <p className="flex items-center justify-center gap-2">
              <span role="img" aria-label="email">📧</span> Revisa tu bandeja de entrada
            </p>
            <p className="flex items-center justify-center gap-2">
              <span role="img" aria-label="ticket">🎫</span> {purchaseData.ticketQuantity} entrada{purchaseData.ticketQuantity !== 1 ? 's' : ''}
            </p>

            {purchaseData.products.length > 0 && (
              <p className="flex items-center justify-center gap-2">
                <span role="img" aria-label="cart">🛒</span> {purchaseData.products.length} producto{purchaseData.products.length !== 1 ? 's' : ''}
              </p>
            )}

            {purchaseData.combos.length > 0 && (
              <p className="flex items-center justify-center gap-2">
                <span role="img" aria-label="box">📦</span> {purchaseData.combos.length} combo{purchaseData.combos.length !== 1 ? 's' : ''}
              </p>
            )}

            <p className="text-xl font-semibold text-green-400 flex items-center justify-center gap-2 pt-2 border-t border-gray-700">
              <span role="img" aria-label="money">💰</span>
              Total: {
                total === 0
                  ? 'Liberado'
                  : formatPrice(total)
              }
            </p>
          </div>
        )}

        <div className="mt-8">
          <Button onClick={onResetAndClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200">
            Cerrar
          </Button>
        </div>

        {isSuccess && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full bg-party-primary animate-confetti-fall"
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}vh`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${4 + Math.random() * 3}s`,
                  opacity: Math.random() * 0.7 + 0.3,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};