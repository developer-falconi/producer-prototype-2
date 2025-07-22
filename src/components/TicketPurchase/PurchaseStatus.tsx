import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { PurchaseData } from '@/lib/types';
import { Button } from '../ui/button';
import { formatPrice } from '@/lib/utils';

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
    <CheckCircle className="w-12 h-12 text-green-500" />
  ) : (
    <XCircle className="w-12 h-12 text-red-500" />
  );

  const title = isSuccess ? '¡Compra Exitosa! 🎉' : 'Error en la Compra 😔';
  const message = isSuccess
    ? 'Tu entrada ha sido confirmada.\nUna vez validado tu pago.\nRecibirás un email con todos los detalles del evento.\nNo olvides revisar tu casilla de spam'
    : status?.message || 'Hubo un problema al procesar tu compra. Por favor, inténtalo de nuevo o contacta a soporte.';

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <div className="mb-6">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-glow ${isSuccess ? 'bg-gradient-to-br from-green-600 to-green-800 animate-party-bounce' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
            {icon}
          </div>
        </div>

        <h1 className={`text-3xl font-bold mb-4 animate-fade-in ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
          {title}
        </h1>

        <p className="text-gray-300 mb-6 animate-fade-in whitespace-pre-line">
          {message}
        </p>

        {isSuccess && (
          <div className="space-y-2 text-sm text-gray-400 animate-fade-in">
            <p>📧 Revisa tu bandeja de entrada</p>
            <p>🎫 {purchaseData.ticketQuantity} entrada{purchaseData.ticketQuantity > 1 ? 's' : ''}</p>

            {purchaseData.products.length > 0 && (
              <p>🛒 {purchaseData.products.length} producto{purchaseData.products.length > 1 ? 's' : ''}</p>
            )}

            {purchaseData.combos.length > 0 && (
              <p>📦 {purchaseData.combos.length} combo{purchaseData.combos.length > 1 ? 's' : ''}</p>
            )}

            <p>💰 Total: {formatPrice(total)}</p>
          </div>
        )}

        <div className="mt-8">
          <Button onClick={onResetAndClose} className="w-full bg-gray-500 hover:bg-gray-500/80">
            Cerrar
          </Button>
        </div>

        {/* Confetti Animation for success */}
        {isSuccess && (
          <div className="fixed inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-party-primary animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
