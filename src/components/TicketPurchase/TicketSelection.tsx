import React, { useMemo, useState, useEffect } from 'react';
import { cn, formatDate, formatPrice, preventStatusLabels, toNum } from '@/lib/utils';
import {
  EventDto,
  PurchaseData,
  Prevent,
  PreventStatusEnum,
  PreventPromoTypeEnum
} from '@/lib/types';
import { Button } from '../ui/button';
import { motion, Easing } from 'framer-motion';
import { CountdownPrevent } from '../CountdownPrevent';
import { useProducer } from '@/context/ProducerContext';
import { useTracking } from '@/hooks/use-tracking';

type TicketLine = { prevent: Prevent; quantity: number };

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as Easing },
  },
};

const getLineQty = (lines: TicketLine[] | undefined, pid: number) =>
  (lines ?? []).find(l => l.prevent.id === pid)?.quantity ?? 0;

const totalTicketLinesQty = (lines: TicketLine[] | undefined) =>
  (lines ?? []).reduce((acc, l) => acc + l.quantity, 0);

interface TicketSelectionProps {
  eventData: EventDto;
  purchaseData: PurchaseData;
  onUpdatePurchase: (data: Partial<PurchaseData>) => void;
}

export const TicketSelection: React.FC<TicketSelectionProps> = ({
  eventData,
  purchaseData,
  onUpdatePurchase,
}) => {
  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: 'prevent' });

  const allAvailablePrevents = useMemo(
    () => eventData.prevents || [],
    [eventData.prevents]
  );

  const sortedPrevents = useMemo(() => {
    return [...allAvailablePrevents].sort((a, b) => {
      const aActive = a.status === PreventStatusEnum.ACTIVE;
      const bActive = b.status === PreventStatusEnum.ACTIVE;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      const aTime = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const bTime = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [allAvailablePrevents]);

  const computeMaxTickets = (prevent?: Prevent) => {
    if (!prevent) return 0;

    const total = toNum(prevent.quantity);
    const remaining = prevent.remaining != null ? toNum(prevent.remaining) : total;
    const stockCap = Math.max(0, Math.min(total, remaining));

    const defaultMax = Number(prevent.price) === 0 ? 2 : 10;
    const limitCap = toNum(prevent.ticketsLimit);
    const policyCap = limitCap > 0 ? limitCap : defaultMax;

    const hasBundleCap =
      prevent.promoType === PreventPromoTypeEnum.X_FOR_Y &&
      toNum(prevent.promoPackSize) > 0 &&
      toNum(prevent.promoMaxBundlesPerPurchase) > 0;

    if (hasBundleCap) {
      const pack = toNum(prevent.promoPackSize);
      const bundlesCap = toNum(prevent.promoMaxBundlesPerPurchase);
      const promoCapTickets = bundlesCap * pack;
      return Math.max(0, Math.min(stockCap, policyCap, promoCapTickets));
    }

    return Math.max(0, Math.min(stockCap, policyCap));
  };

  const handleQtyChange = (prevent: Prevent, newQty: number) => {
    const max = computeMaxTickets(prevent);
    const q = Math.max(0, Math.min(newQty, max));

    const next = [...(purchaseData.ticketLines ?? [])];
    const idx = next.findIndex(l => l.prevent.id === prevent.id);

    if (idx === -1 && q > 0) {
      next.push({ prevent, quantity: q });
      tracking.addPrevent?.(eventData, prevent, q);
    } else if (idx >= 0) {
      const prevQ = next[idx].quantity;
      next[idx] = { ...next[idx], quantity: q };
      const delta = q - prevQ;
      if (delta > 0) tracking.addPrevent?.(eventData, prevent, delta);
    }

    const cleaned = next.filter(l => l.quantity > 0);
    const totalQty = cleaned.reduce((acc, l) => acc + l.quantity, 0);

    const first = cleaned[0] ?? null;

    onUpdatePurchase({
      ticketLines: cleaned,
      selectedPrevent: first ? first.prevent : null,
      ticketQuantity: totalQty
    });
  };

  const ticketSubtotal = useMemo(() => {
    const lines = purchaseData.ticketLines ?? [];
    return lines.reduce((sum, l) => sum + toNum(l.prevent.price) * l.quantity, 0);
  }, [purchaseData.ticketLines]);

  const activePreventsExist = sortedPrevents.some(p => p.status === PreventStatusEnum.ACTIVE);
  const activePreventsQty = sortedPrevents.filter(p => p.status === PreventStatusEnum.ACTIVE).length;
  const noTicketsAvailableGlobally = allAvailablePrevents.length === 0;
  const totalSelectedQty = totalTicketLinesQty(purchaseData.ticketLines);

  useEffect(() => {
    if (
      purchaseData.selectedPrevent &&
      (purchaseData.ticketLines?.length ?? 0) === 0 &&
      purchaseData.ticketQuantity > 0
    ) {
      onUpdatePurchase({
        ticketLines: [{ prevent: purchaseData.selectedPrevent, quantity: purchaseData.ticketQuantity }],
      });
    }
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6 p-6 md:p-8"
    >
      {/* 1) Tipo de entrada */}
      <motion.h2
        variants={itemVariants}
        className="text-xl md:text-2xl font-semibold tracking-tight text-white flex items-center gap-2"
      >
        <span className="w-3/4">Seleccionar entradas</span>
        <span className="text-xs w-1/4 md:w-fit font-medium px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 truncate">
          {activePreventsQty} opciones
        </span>
      </motion.h2>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-4"
      >
        {noTicketsAvailableGlobally ? (
          <div className="col-span-full rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-center">
            <p className="text-zinc-300">No hay entradas activas disponibles para este evento.</p>
          </div>
        ) : (
          sortedPrevents.map((prevent) => {
            const isActive = prevent.status === PreventStatusEnum.ACTIVE;
            const qty = getLineQty(purchaseData.ticketLines, prevent.id);
            const max = computeMaxTickets(prevent);

            const promoBadge = prevent.promoIsActive && prevent.promoPackSize && prevent.promoPayFor
              ? `${prevent.promoPackSize}×${prevent.promoPayFor}`
              : null;

            return (
              <div
                key={prevent.id}
                className={cn(
                  'relative flex h-full min-w-0 flex-col items-start gap-2 rounded-2xl p-4 text-left',
                  'transition-all duration-200 ease-in-out',
                  'border bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur',
                  isActive
                    ? 'border-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5'
                    : 'border-white/5 opacity-60'
                )}
              >
                {/* Ribbons / badges */}
                <div className="absolute -right-2 -top-4 md:-top-2 flex items-center gap-2">
                  {promoBadge && (
                    <span className="rounded-full uppercase bg-emerald-700/80 text-white border border-emerald-400/20 text-[11px] px-2 py-0.5 font-semibold shadow-sm">
                      Promo {promoBadge}
                    </span>
                  )}
                  {prevent.featured && (
                    <span className="rounded-full bg-sky-600 text-white border border-sky-400/20 text-[11px] px-2 py-0.5 font-semibold shadow-sm">
                      Destacada
                    </span>
                  )}
                </div>

                {/* Título + precio */}
                <div
                  className={cn(
                    'flex w-full items-center gap-3 md:min-h-[3.5rem]',
                    prevent.price > 0 ? 'justify-between' : 'justify-start'
                  )}
                >
                  <span className="whitespace-pre-wrap font-medium text-white line-clamp-2">
                    {prevent.name}
                  </span>

                  {prevent.price > 0 && (
                    <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-white">
                      {formatPrice(prevent.price)}
                    </span>
                  )}
                </div>

                {/* Descripción */}
                {prevent.description && (
                  <div className="min-w-0 w-full">
                    <p className="block w-full text-xs leading-5 whitespace-pre-wrap text-zinc-300/90 break-words overflow-hidden">
                      {prevent.description}
                    </p>
                  </div>
                )}

                {/* Footer: fecha / estado / contador */}
                <div className="mt-1 flex w-full items-center justify-between gap-3">
                  {prevent.endDate ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 border border-white/10">
                        Hasta:{' '}
                        <span className="ml-1 font-medium text-white">
                          {formatDate(prevent.endDate, 'short')}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <span />
                  )}

                  {isActive ? (prevent.endDate ? <CountdownPrevent to={prevent.endDate} /> : null) : (
                    <span className="rounded-md bg-rose-600/20 text-rose-200 border border-rose-400/20 text-xs px-2 py-1 font-semibold">
                      {preventStatusLabels[prevent.status]}
                    </span>
                  )}
                </div>

                {/* === Stepper de cantidad === */}
                <div className="mt-auto flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="text-sm text-zinc-300">Cantidad</span>
                    {/* Info de tope si aplica */}
                    {isActive && max > 0 && (
                      <span className="mt-1 text-[10px] text-zinc-400">
                        Máx. {max} {max === 1 ? 'ticket' : 'tickets'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="h-8 w-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white"
                      disabled={!isActive || qty === 0}
                      onClick={() => handleQtyChange(prevent, qty - 1)}
                    >
                      –
                    </Button>
                    <span className="w-6 text-center text-white">{qty}</span>
                    <Button
                      variant="ghost"
                      className="h-8 w-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white"
                      disabled={!isActive || qty >= max}
                      onClick={() => handleQtyChange(prevent, qty + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      {/* 3) Resumen de precio */}
      {totalSelectedQty > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur p-5 shadow"
        >
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-sm">Entradas seleccionadas</span>
            <span className="text-sm font-semibold text-white">{totalSelectedQty}</span>
          </div>

          <div className="mt-3 space-y-1 text-sm text-zinc-300">
            {(purchaseData.ticketLines ?? []).map(l => (
              <div key={l.prevent.id} className="flex items-center justify-between">
                <span className="w-3/5 line-clamp-2">
                  {l.quantity}× {l.prevent.name}
                </span>
                <span className="text-right">
                  {formatPrice(toNum(l.prevent.price) * l.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
            <span className="text-base font-medium text-white">Subtotal</span>
            <span className="text-base font-bold text-sky-400">
              {ticketSubtotal === 0 ? 'Liberado' : formatPrice(ticketSubtotal)}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};