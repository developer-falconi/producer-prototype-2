import { Event, PurchaseData } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import React from 'react';
import MercadoPagoButton from '../MercadoPago';

interface OrderSummaryProps {
  eventData: Event;
  purchaseData: PurchaseData;
  mpPreferenceId: string | null;
  mpPublicKey: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  eventData,
  purchaseData,
  mpPreferenceId,
  mpPublicKey
}) => {
  const ticketPrice = purchaseData.selectedPrevent?.price || 0;
  const subtotalTickets = ticketPrice * purchaseData.ticketQuantity;

  const productsSummary = purchaseData.products.map(item => {
    const priceNum = parseFloat(item.product.price);
    const discountNum = parseFloat(item.product.discountPercentage);
    const effectivePrice = priceNum * (1 - discountNum / 100);

    return {
      name: item.product.product.name,
      price: effectivePrice,
      quantity: item.quantity,
    };
  });

  const totalProductsPrice = productsSummary.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const combosSummary = purchaseData.combos.map(item => {
    const priceNum = item.combo.price;
    return {
      name: item.combo.name,
      price: priceNum,
      quantity: item.quantity,
    };
  });

  const totalCombosPrice = combosSummary.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const subtotalAllItems = subtotalTickets + totalProductsPrice + totalCombosPrice;

  const mercadoPagoFee = purchaseData.paymentMethod === 'mercadopago' ? subtotalAllItems * 0.0824 : 0;
  const total = subtotalAllItems + mercadoPagoFee;

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold text-gray-300 mb-6 text-center">Resumen de tu Compra</h2>

      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Detalles Generales</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Evento:</span>
            <span className="font-medium text-white">{eventData.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Cantidad de Entradas:</span>
            <span className="font-medium text-white">{purchaseData.ticketQuantity} {purchaseData.ticketQuantity > 1 ? 'entradas' : 'entrada'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Email:</span>
            <span className="font-medium text-white">{purchaseData.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Método de Pago:</span>
            <span className="font-medium text-white">
              {purchaseData.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia Bancaria'}
            </span>
          </div>
        </div>
      </div>

      {/* --- Selected Products Section --- */}
      {productsSummary.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Productos Seleccionados</h3>
          <div className="space-y-3 text-sm text-gray-300">
            {productsSummary.map((item, index) => (
              <div key={`product-${index}`} className="flex justify-between items-center">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Selected Combos Section --- */}
      {combosSummary.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Combos Seleccionados</h3>
          <div className="space-y-3 text-sm text-gray-300">
            {combosSummary.map((item, index) => (
              <div key={`combo-${index}`} className="flex justify-between items-center">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Price Summary Section --- */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Resumen de Precios</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Entradas:</span>
            <span className="font-medium text-white">{formatPrice(subtotalTickets)}</span>
          </div>
          {totalProductsPrice > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Productos:</span>
              <span className="font-medium text-white">{formatPrice(totalProductsPrice)}</span>
            </div>
          )}
          {totalCombosPrice > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Combos:</span>
              <span className="font-medium text-white">{formatPrice(totalCombosPrice)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-semibold pt-2 border-t border-gray-700">
            <span className="text-gray-300">Subtotal:</span>
            <span className="text-green-400">{formatPrice(subtotalAllItems)}</span>
          </div>
          {mercadoPagoFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Comisión Mercado Pago:</span>
              <span className="text-red-400">{formatPrice(mercadoPagoFee)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xl font-bold pt-3 border-t border-gray-600 mt-4">
            <span className="text-white">Total Final:</span>
            <span className="text-green-500">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Render MercadoPagoButton if preferenceId is available and MP is selected */}
      {purchaseData.paymentMethod === 'mercadopago' && mpPreferenceId && mpPublicKey && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm mb-4">Haz click en el botón para finalizar tu compra con Mercado Pago:</p>
          <MercadoPagoButton
            preferenceId={mpPreferenceId}
            publicKey={mpPublicKey}
          />
        </div>
      )}

      {/* For Bank Transfer, the "Confirmar Compra" button is handled by NavigationButtons */}
      {purchaseData.paymentMethod === 'bank_transfer' && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Al hacer click en "Confirmar Compra", tu pedido será enviado para validación manual de la transferencia.
          </p>
        </div>
      )}
    </div>
  );
};