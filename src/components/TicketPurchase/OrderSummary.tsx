import { Event, PurchaseData } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import React from 'react';

interface OrderSummaryProps {
  eventData: Event;
  purchaseData: PurchaseData;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  eventData,
  purchaseData
}) => {
  const ticketPrice = purchaseData.selectedPrevent.price || 0;
  const subtotal = ticketPrice * purchaseData.ticketQuantity;
  const mercadoPagoFee = purchaseData.paymentMethod === 'mercadopago' ? subtotal * 0.0824 : 0;
  const total = subtotal + mercadoPagoFee;

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-xl font-semibold text-gray-300">Confirmar Compra</h2>

      <div className="space-y-4">
        <div className="bg-gray-300/60 rounded-lg p-4">
          <h3 className="font-medium text-black mb-2">Resumen de la compra</h3>
          <div className="space-y-2 text-sm text-foreground font-medium">
            <div className="flex justify-between">
              <span>Evento:</span>
              <span>{eventData.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Cantidad:</span>
              <span>{purchaseData.ticketQuantity} entrada{purchaseData.ticketQuantity > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span>{purchaseData.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Pago:</span>
              <span>
                {purchaseData.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Transferencia'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-300/60 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2 text-foreground font-medium">
            <span>Subtotal:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {mercadoPagoFee > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Comisión MercadoPago:</span>
              <span className="text-destructive">{formatPrice(mercadoPagoFee)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};