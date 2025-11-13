import { useProducer } from '@/context/ProducerContext';
import { useTracking } from '@/hooks/use-tracking';
import { CouponEvent, EventDto, PurchaseData } from '@/lib/types';
import { cn, formatPrice, paymentMethodLabels, solveFeesFront, toNum } from '@/lib/utils';
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
    return { discount: d, details: `${pct}%${cap != null ? ` · tope ${formatPrice(cap)}` : ''}${minOrder > 0 ? ` · mínimo ${formatPrice(minOrder)}` : ''}` };
  } else {
    const amount = num(coupon.value);
    const d = Math.max(0, Math.min(amount, subtotal));
    return { discount: d, details: `${formatPrice(amount)}${minOrder > 0 ? ` · mínimo ${formatPrice(minOrder)}` : ''}` };
  }
}

const LineRow: React.FC<{ left: React.ReactNode; right: React.ReactNode; dim?: boolean }> = ({ left, right, dim }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <div className={cn("min-w-0 text-sm", dim && "text-zinc-400")}>{left}</div>
    <div className="text-sm font-medium text-white whitespace-nowrap">{right}</div>
  </div>
);

export const OrderSummary: React.FC<OrderSummaryProps> = ({ eventData, purchaseData }) => {
  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: 'prevent' });

  const ticketLinesSummary = (purchaseData.ticketLines ?? []).map(item => {
    const priceNum = num(item.prevent?.price);
    return {
      name: item.prevent?.name ?? 'Entrada',
      desc: item.prevent?.description ?? '',
      price: priceNum,
      quantity: item.quantity ?? 0,
    };
  });
  const subtotalTickets = ticketLinesSummary.reduce((s, i) => s + i.price * i.quantity, 0);

  const productsSummary = purchaseData.products.map(it => {
    const p = num(it.product.price);
    const d = num(it.product.discountPercentage);
    return {
      name: it.product.product.name,
      price: p * (1 - d / 100),
      quantity: it.quantity,
    };
  });
  const totalProductsPrice = productsSummary.reduce((s, i) => s + i.price * i.quantity, 0);

  const combosSummary = purchaseData.combos.map(it => ({
    name: it.combo.name,
    price: num(it.combo.price),
    quantity: it.quantity,
  }));
  const totalCombosPrice = combosSummary.reduce((s, i) => s + i.price * i.quantity, 0);

  const experiencesSummary = purchaseData.experiences.map(it => ({
    name: it.experience.name ?? 'Experiencia',
    parentName: it.parent?.name ?? null,
    price: num(it.experience.price),
    quantity: it.quantity,
  }));
  const totalExperiencesPrice = experiencesSummary.reduce((s, i) => s + i.price * i.quantity, 0);

  const subtotalAllItems = subtotalTickets + totalProductsPrice + totalCombosPrice + totalExperiencesPrice;

  const { discount, details: couponDetails, reason: couponReason } = calcCouponDiscount(
    subtotalAllItems,
    purchaseData.coupon ?? null
  );

  const baseNet = Math.max(0, subtotalAllItems - discount);

  const solved = useMemo(
    () =>
      solveFeesFront({
        baseAmount: toNum(baseNet),
        eventFee: eventData?.fee ?? null,
        roundPriceStep: 0.01,
        roundApplicationFeeStep: 0.01,
        ensureExactNetTarget: true,
        paymentMethod: purchaseData.paymentMethod ?? 'mercadopago',
      }),
    [baseNet, eventData?.fee, purchaseData.paymentMethod]
  );

  const total = solved.priceToBuyer;
  const clientFeePortion = solved.breakdown.pClientAmount;

  useEffect(() => {
    if (!eventData) return;
    const items: Array<{ prevent?: any; product?: any; combo?: any; experience?: any; parent?: any; qty?: number }> = [];
    if (purchaseData.selectedPrevent && purchaseData.ticketQuantity > 0) {
      items.push({ prevent: purchaseData.selectedPrevent, qty: purchaseData.ticketQuantity });
    }
    purchaseData.products.forEach(p => p.quantity > 0 && items.push({ product: p.product, qty: p.quantity }));
    purchaseData.combos.forEach(c => c.quantity > 0 && items.push({ combo: c.combo, qty: c.quantity }));
    purchaseData.experiences.forEach(e => e.quantity > 0 && items.push({ experience: e.experience, parent: e.parent, qty: e.quantity }));

    const coupon = purchaseData.coupon?.id != null ? String(purchaseData.coupon.id) : purchaseData.promoter || null;
    tracking.viewCart(eventData, items, { coupon, value: Number(toNum(baseNet)) });
  }, [eventData, purchaseData, tracking, baseNet]);

  const hasTickets = ticketLinesSummary.some(i => i.quantity > 0);
  const hasProducts = totalProductsPrice > 0;
  const hasCombos = totalCombosPrice > 0;
  const hasExperiences = totalExperiencesPrice > 0;

  return (
    <div className="space-y-5 p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-semibold text-white text-center">Resumen de tu compra</h2>

      {purchaseData.paymentMethod === 'bank_transfer' && (
        <div role="alert" aria-live="polite" className="rounded-lg border border-amber-500/30 bg-amber-900/20 p-3 text-amber-100">
          <p className="text-sm">
            Al confirmar, tu pago por <b>transferencia</b> pasa a validación manual. Te avisaremos por email cuando se apruebe y se generen tus entradas.
          </p>
        </div>
      )}

      {/* Cabecera muy breve */}
      <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
        <LineRow left={<span className="text-zinc-400">Evento</span>} right={<span>{eventData.name}</span>} />
        <LineRow left={<span className="text-zinc-400">Entradas</span>} right={<span>{purchaseData.ticketQuantity}</span>} />
        <LineRow left={<span className="text-zinc-400">Email</span>} right={<span>{purchaseData.email}</span>} />
        <LineRow
          left={<span className="text-zinc-400">Pago</span>}
          right={<span>{paymentMethodLabels[purchaseData.paymentMethod]}</span>}
        />
      </div>

      {/* Ítems (un solo bloque, secciones mínimas) */}
      <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
        {(hasTickets || hasProducts || hasCombos || hasExperiences) ? (
          <>
            {hasTickets && (
              <>
                <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Entradas</div>
                {ticketLinesSummary.map((it, idx) => (
                  <LineRow
                    key={`t-${idx}`}
                    left={
                      <div className="truncate">
                        <span className="text-white">{it.quantity}× {it.name}</span>
                        {it.desc && <div className="text-xs text-zinc-400 truncate">{it.desc}</div>}
                      </div>
                    }
                    right={<span>{formatPrice(it.price * it.quantity)}</span>}
                  />
                ))}
                <div className="my-2 h-px bg-white/10" />
              </>
            )}

            {hasProducts && (
              <>
                <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Productos</div>
                {productsSummary.map((it, idx) => (
                  <LineRow
                    key={`p-${idx}`}
                    left={<span className="truncate text-white">{it.quantity}× {it.name}</span>}
                    right={<span>{formatPrice(it.price * it.quantity)}</span>}
                  />
                ))}
                <div className="my-2 h-px bg-white/10" />
              </>
            )}

            {hasCombos && (
              <>
                <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Combos</div>
                {combosSummary.map((it, idx) => (
                  <LineRow
                    key={`c-${idx}`}
                    left={<span className="truncate text-white">{it.quantity}× {it.name}</span>}
                    right={<span>{formatPrice(it.price * it.quantity)}</span>}
                  />
                ))}
                <div className="my-2 h-px bg-white/10" />
              </>
            )}

            {hasExperiences && (
              <>
                <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Experiencias</div>
                {experiencesSummary.map((it, idx) => (
                  <LineRow
                    key={`e-${idx}`}
                    left={
                      <div className="truncate">
                        <span className="text-white">{it.quantity} x {it.name}</span>
                        {it.parentName && (
                          <div className="text-xs text-zinc-400 truncate">Incluye {it.parentName}</div>
                        )}
                      </div>
                    }
                    right={<span>{formatPrice(it.price * it.quantity)}</span>}
                  />
                ))}
                <div className="my-2 h-px bg-white/10" />
              </>
            )}

            {/* Totales */}
            <LineRow left={<span className="text-zinc-400">Subtotal</span>} right={<span>{formatPrice(subtotalAllItems)}</span>} />

            {purchaseData.coupon && (
              <>
                <LineRow
                  left={
                    <span className={cn("text-zinc-400", discount <= 0 && "line-through opacity-60")}>
                      Cupón ({purchaseData.coupon.code})
                    </span>
                  }
                  right={
                    discount > 0 ? <span className="text-red-400">- {formatPrice(discount)}</span> : <span className="text-zinc-400">No aplica</span>
                  }
                />
                <div className="flex items-start justify-between text-[11px] text-zinc-500 pt-0.5">
                  <span className="truncate">{couponDetails}</span>
                  {couponReason && <span className="truncate text-amber-400">{couponReason}</span>}
                </div>
            </>
            )}

            {baseNet > 0 && clientFeePortion > 0 && (
              <LineRow
                left={<span className="text-emerald-600">Cargo por servicio</span>}
                right={<span className="text-emerald-600">+ {formatPrice(clientFeePortion)}</span>}
              />
            )}

            <div className="mt-2 h-px bg-white/10" />
            <div className="flex items-center justify-between pt-2">
              <span className="text-white text-base font-semibold">Total</span>
              {total === 0 ? (
                <span className="text-green-400 text-base font-semibold">¡Gratis!</span>
              ) : (
                <span className="text-green-400 text-base font-semibold">{formatPrice(total)}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-400">No hay ítems seleccionados.</p>
        )}
      </div>
    </div>
  );
};

