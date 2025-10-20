import { useProducer } from '@/context/ProducerContext';
import { useTracking } from '@/hooks/use-tracking';
import { CouponEvent, EventDto, PurchaseData } from '@/lib/types';
import { formatPrice, paymentMethodLabels, solveFeesFront, toNum } from '@/lib/utils';
import React, { useEffect, useMemo } from 'react';

interface OrderSummaryProps {
  eventData: EventDto;
  purchaseData: PurchaseData;
}

const num = (v: unknown, def = 0) => {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : def;
};

function calcCouponDiscount(subtotal: number, coupon: CouponEvent | null): {
  discount: number;
  details?: string;
  reason?: string;
} {
  if (!coupon) return { discount: 0 };

  const minOrder = num(coupon.minOrderAmount, 0);
  if (subtotal < minOrder) {
    return {
      discount: 0,
      details:
        coupon.discountType === 'PERCENT'
          ? `${coupon.value}%${minOrder > 0 ? ` · mínimo ${formatPrice(minOrder)}` : ''}`
          : `${formatPrice(num(coupon.value))}${minOrder > 0 ? ` · mínimo ${formatPrice(minOrder)}` : ''}`,
      reason: `No cumple el mínimo de compra (${formatPrice(minOrder)})`,
    };
  }

  if (coupon.discountType === 'PERCENT') {
    const pct = num(coupon.value);
    const cap = coupon.maxDiscountAmount ? num(coupon.maxDiscountAmount) : null;

    let d = subtotal * (pct / 100);
    if (cap != null) d = Math.min(d, cap);
    d = Math.max(0, Math.min(d, subtotal));

    return {
      discount: d,
      details: `${pct}%${cap != null ? ` · tope ${formatPrice(cap)}` : ''}${minOrder > 0 ? ` · mínimo ${formatPrice(minOrder)}` : ''
        }`,
    };
  } else {
    const amount = num(coupon.value);
    const d = Math.max(0, Math.min(amount, subtotal));
    return {
      discount: d,
      details: `${formatPrice(amount)}${minOrder > 0 ? ` · mínimo ${formatPrice(minOrder)}` : ''}`,
    };
  }
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  eventData,
  purchaseData,
}) => {
  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: 'prevent' });

  const ticketPrice = purchaseData.selectedPrevent?.price || 0;
  const subtotalTickets = ticketPrice * purchaseData.ticketQuantity;

  const productsSummary = purchaseData.products.map(item => {
    const priceNum = num(item.product.price);
    const discountNum = num(item.product.discountPercentage);
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
    const priceNum = num(item.combo.price);
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

  const { discount, details: couponDetails, reason: couponReason } = calcCouponDiscount(
    subtotalAllItems,
    purchaseData.coupon ?? null
  );

  const baseNet = Math.max(0, subtotalAllItems - discount);

  const solved = useMemo(() => solveFeesFront({
    baseAmount: toNum(baseNet),
    eventFee: eventData?.fee ?? null,
    roundPriceStep: 0.01,
    roundApplicationFeeStep: 0.01,
    ensureExactNetTarget: true,
    paymentMethod: purchaseData.paymentMethod ?? 'mercadopago',
  }), [baseNet, eventData?.fee, purchaseData.paymentMethod]);

  const total = solved.priceToBuyer;
  const clientFeePortion = solved.breakdown.pClientAmount;

  useEffect(() => {
    if (!eventData) return;

    const items: Array<{ prevent?: any; product?: any; combo?: any; qty?: number }> = [];

    if (purchaseData.selectedPrevent && purchaseData.ticketQuantity > 0) {
      items.push({ prevent: purchaseData.selectedPrevent, qty: purchaseData.ticketQuantity });
    }
    purchaseData.products.forEach(p => {
      if (p.quantity > 0) items.push({ product: p.product, qty: p.quantity });
    });
    purchaseData.combos.forEach(c => {
      if (c.quantity > 0) items.push({ combo: c.combo, qty: c.quantity });
    });

    const baseForTracking = Number(toNum(baseNet));
    const coupon = purchaseData.coupon?.id != null
      ? String(purchaseData.coupon.id)
      : (purchaseData.promoter || null);

    tracking.viewCart(eventData, items, { coupon, value: baseForTracking });
  }, [eventData, purchaseData, tracking, baseNet]);

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold text-gray-300 mb-6 text-center">Resumen de tu Compra</h2>

      {purchaseData.paymentMethod === 'bank_transfer' && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-900/30 p-4 text-amber-100 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm.75 6.75a.75.75 0 1 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Zm0 7.5a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold text-amber-200">
                Importante sobre tu pago por transferencia
              </p>
              <p className="mt-1 text-sm">
                Al hacer click en <span className="font-semibold">“Confirmar Compra”</span>, tu pedido será
                <span className="font-semibold"> enviado para validación manual de la transferencia</span>.
                Te notificaremos por email cuando se apruebe y se generen tus entradas.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Detalles Generales</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Evento:</span>
            <span className="font-medium text-white text-right">{eventData.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Entradas:</span>
            <span className="font-medium text-white text-right">{purchaseData.ticketQuantity} {purchaseData.ticketQuantity > 1 ? 'entradas' : 'entrada'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Email:</span>
            <span className="font-medium text-white text-right">{purchaseData.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Método de Pago:</span>
            <span className="font-medium text-white text-right">
              {paymentMethodLabels[purchaseData.paymentMethod]}
            </span>
          </div>
        </div>
      </div>

      {/* --- Productos Seleccionados --- */}
      {productsSummary.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Productos Seleccionados</h3>
          <div className="space-y-3 text-sm text-gray-300">
            {productsSummary.map((item, index) => (
              <div key={`product-${index}`} className="flex justify-between items-center">
                <span className='w-3/5 line-clamp-2'>{item.quantity}x {item.name}</span>
                <span className='text-right'>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Combos Seleccionados --- */}
      {combosSummary.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Combos Seleccionados</h3>
          <div className="space-y-3 text-sm text-gray-300">
            {combosSummary.map((item, index) => (
              <div key={`combo-${index}`} className="flex justify-between items-center">
                <span className='w-4/5'>{item.quantity}x {item.name}</span>
                <span className='text-right'>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Resumen de Precios con política de fee --- */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Resumen de Precios</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Entradas:</span>
            {subtotalTickets === 0 ? (
              <span className="font-medium text-green-400 text-right">
                Entrada liberada
              </span>
            ) : (
              <span className="font-medium text-white text-right">
                {formatPrice(subtotalTickets)}
              </span>
            )}
          </div>

          {totalProductsPrice > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Productos:</span>
              <span className="font-medium text-white text-right">{formatPrice(totalProductsPrice)}</span>
            </div>
          )}
          {totalCombosPrice > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Combos:</span>
              <span className="font-medium text-white text-right">{formatPrice(totalCombosPrice)}</span>
            </div>
          )}

          {/* Cupón */}
          {purchaseData.coupon && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">
                  Cupón ({purchaseData.coupon.code}):
                </span>
                <span className={`font-medium ${discount > 0 ? 'text-red-400' : 'text-gray-400'} text-right`}>
                  {discount > 0 ? `- ${formatPrice(discount)}` : 'No aplica'}
                </span>
              </div>
              <div className="flex justify-between items-center -mt-2">
                <span className="text-xs text-gray-500">
                  {couponDetails}
                </span>
                {couponReason && (
                  <span className="text-xs text-amber-400 text-right">{couponReason}</span>
                )}
              </div>
            </>
          )}

          {total === 0 ? (
            <div className="flex justify-between items-center text-base font-semibold pt-2 border-t border-gray-700">
              <span className="text-gray-300">Total:</span>
              <span className="text-green-400 text-right">¡Total Gratis!</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-base font-semibold pt-2 border-t border-gray-700">
                <span className="text-gray-300">Subtotal:</span>
                <span className="text-green-400 text-right">{formatPrice(subtotalAllItems)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Descuento cupón:</span>
                  <span className="text-red-400 text-right">- {formatPrice(discount)}</span>
                </div>
              )}

              {/* Comisión / Cargo (según política) */}
              {baseNet > 0 && clientFeePortion > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300">Cargo por servicio</span>
                  <span className="text-emerald-300 text-right">+ {formatPrice(clientFeePortion)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xl font-bold pt-3 border-t border-gray-600 mt-4">
                <span className="text-white">Total Final:</span>
                <span className="text-green-500 text-right">{formatPrice(total)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};