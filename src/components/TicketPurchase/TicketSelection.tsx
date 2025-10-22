import React, { useState, useEffect, useMemo } from 'react';
import { cn, formatDate, formatPrice, preventStatusLabels, toNum } from '@/lib/utils';
import { EventDto, PurchaseData, Prevent, PreventStatusEnum, PreventPromoTypeEnum } from '@/lib/types';
import { Button } from '../ui/button';
import { motion, Easing } from 'framer-motion';
import { CountdownPrevent } from '../CountdownPrevent';
import { useProducer } from '@/context/ProducerContext';
import { useTracking } from '@/hooks/use-tracking';

interface TicketSelectionProps {
  eventData: EventDto;
  purchaseData: PurchaseData;
  onUpdatePurchase: (data: Partial<PurchaseData>) => void;
}

export const TicketSelection: React.FC<TicketSelectionProps> = ({
  eventData,
  purchaseData,
  onUpdatePurchase
}) => {
  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: 'prevent' });
  const allAvailablePrevents = useMemo(() => eventData.prevents || [], [eventData.prevents]);

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

  const initialSelected = useMemo<Prevent | undefined>(() => {
    const selected = purchaseData.selectedPrevent;
    if (selected && selected.status === PreventStatusEnum.ACTIVE && sortedPrevents.some(p => p.id === selected.id)) {
      return selected;
    }
    if (eventData.featuredPrevent?.status === PreventStatusEnum.ACTIVE) {
      const featured = sortedPrevents.find(p => p.id === eventData.featuredPrevent!.id);
      if (featured) return featured;
    }
    return sortedPrevents.find(p => p.status === PreventStatusEnum.ACTIVE);
  }, [purchaseData.selectedPrevent, sortedPrevents, eventData.featuredPrevent]);

  const [localSelectedPrevent, setLocalSelectedPrevent] = useState<Prevent | undefined>(initialSelected);

  const computeMaxTickets = (prevent?: Prevent) => {
    if (!prevent) return 0;

    const defaultMax = Number(prevent.price) === 0 ? 2 : 10;
    const total = toNum(prevent.quantity);
    const remaining = prevent.remaining != null ? toNum(prevent.remaining) : total;
    const maxByStock = Math.max(0, Math.min(defaultMax, total, remaining));

    const hasBundleCap = prevent.promoType === PreventPromoTypeEnum.X_FOR_Y &&
      toNum(prevent.promoPackSize) > 0 &&
      toNum(prevent.promoMaxBundlesPerPurchase) > 0;

    if (hasBundleCap) {
      const bundlesCap = toNum(prevent.promoMaxBundlesPerPurchase);
      const maxByPromo = bundlesCap;
      return Math.max(0, Math.min(maxByStock, maxByPromo));
    }
    return maxByStock;
  };

  const defaultQtyForPrevent = (prevent: Prevent, max: number) => Math.min(max, 1);

  useEffect(() => {
    if (initialSelected?.id !== localSelectedPrevent?.id) {
      setLocalSelectedPrevent(initialSelected);
      if (initialSelected) {
        const max = computeMaxTickets(initialSelected);
        const qty = defaultQtyForPrevent(initialSelected, max);
        onUpdatePurchase({ selectedPrevent: initialSelected, ticketQuantity: qty });
      } else {
        onUpdatePurchase({ selectedPrevent: null, ticketQuantity: 0 });
      }
    }
  }, [initialSelected]);

  const selectedPrevent = allAvailablePrevents.find(p => p.id === localSelectedPrevent?.id);

  const maxTickets = useMemo(() => computeMaxTickets(selectedPrevent), [selectedPrevent]);

  const ticketPrice = selectedPrevent?.price || 0;
  const subtotal = ticketPrice * purchaseData.ticketQuantity;

  const [showMoreQuantities, setShowMoreQuantities] = useState(
    purchaseData.ticketQuantity >= 5 && maxTickets >= 5
  );
  useEffect(() => {
    setShowMoreQuantities(purchaseData.ticketQuantity >= 5 && maxTickets >= 5);
  }, [purchaseData.ticketQuantity, maxTickets]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as Easing },
    },
  };

  const handleSelectQuantity = (quantity: number) => {
    const actualQuantity = Math.min(quantity, maxTickets);
    if (actualQuantity <= 4 && showMoreQuantities) setShowMoreQuantities(false);
    else if (actualQuantity >= 5 && !showMoreQuantities && maxTickets >= 5) setShowMoreQuantities(true);
    onUpdatePurchase({ ticketQuantity: actualQuantity });
  };

  const handleSelectPreventType = (prevent: Prevent) => {
    if (prevent.status !== PreventStatusEnum.ACTIVE) return;
    if (localSelectedPrevent?.id === prevent.id) return;

    const newMax = computeMaxTickets(prevent);
    const newQty = defaultQtyForPrevent(prevent, newMax);

    if (eventData) {
      tracking.selectFromList("Prevents", eventData);
    }

    setLocalSelectedPrevent(prevent);
    onUpdatePurchase({ selectedPrevent: prevent, ticketQuantity: newQty });

    const pack = toNum(prevent.promoPackSize);
    const hasBundle = prevent.promoType === PreventPromoTypeEnum.X_FOR_Y && pack > 4;
    setShowMoreQuantities(hasBundle || (newQty >= 5 && newMax >= 5));
  };

  const handleShowMoreQuantities = () => {
    setShowMoreQuantities(true);
    if (purchaseData.ticketQuantity < 5 && maxTickets >= 5) {
      onUpdatePurchase({ ticketQuantity: 5 });
    }
  };

  const shouldRender5PlusButton = maxTickets >= 5 && !showMoreQuantities;
  const noTicketsAvailableGlobally = allAvailablePrevents.length === 0;
  const activePreventsExist = sortedPrevents.some(p => p.status === PreventStatusEnum.ACTIVE);
  const activePreventsQty = sortedPrevents.filter(p => p.status === PreventStatusEnum.ACTIVE).length;

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
        <span className='w-3/4'>Seleccionar tipo de entrada</span>
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
            const isSelected = localSelectedPrevent?.id === prevent.id;

            const promoBadge = prevent.promoIsActive && prevent.promoPackSize && prevent.promoPayFor
              ? `${prevent.promoPackSize}×${prevent.promoPayFor}`
              : null;

            return (
              <Button
                key={prevent.id}
                disabled={!isActive}
                onClick={() => handleSelectPreventType(prevent)}
                className={cn(
                  "relative flex h-full min-w-0 flex-col items-start gap-2 rounded-2xl p-4 text-left",
                  "transition-all duration-200 ease-in-out",
                  "border bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur",
                  isActive
                    ? "border-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5"
                    : "border-white/5 opacity-60 cursor-not-allowed",
                  isSelected && isActive && "ring-2 ring-sky-500/50 border-sky-500/30"
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
                    "flex w-full items-center gap-3 md:min-h-[3.5rem]",
                    prevent.price > 0 ? "justify-between" : "justify-start"
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
                <div className="mt-auto flex w-full items-center justify-between gap-3">
                  {prevent.endDate ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 border border-white/10">
                        Hasta:{" "}
                        <span className="ml-1 font-medium text-white">
                          {formatDate(prevent.endDate, "short")}
                        </span>
                      </span>
                    </div>
                  ) : <span />}

                  {isActive ? (
                    prevent.endDate ? (
                      <CountdownPrevent to={prevent.endDate} />
                    ) : null
                  ) : (
                    <span className="rounded-md bg-rose-600/20 text-rose-200 border border-rose-400/20 text-xs px-2 py-1 font-semibold">
                      {preventStatusLabels[prevent.status]}
                    </span>
                  )}
                </div>
              </Button>
            );
          })
        )}
      </motion.div>

      {/* 2) Cantidad */}
      {selectedPrevent && maxTickets > 0 && (
        <>
          <motion.h2 variants={itemVariants} className="text-xl md:text-2xl font-semibold tracking-tight text-white">
            Seleccionar cantidad
          </motion.h2>

          <motion.div variants={itemVariants} className="mb-8 grid grid-cols-5 gap-3">
            {Array.from({ length: Math.min(4, maxTickets) }, (_, i) => i + 1).map((num) => {
              const active = purchaseData.ticketQuantity === num && (!showMoreQuantities || num <= 4);
              return (
                <Button
                  key={num}
                  onClick={() => handleSelectQuantity(num)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border px-0 py-3 text-base font-semibold",
                    "bg-zinc-900/60 border-white/10 hover:bg-zinc-800/70 hover:border-white/20",
                    active && "ring-2 ring-sky-500/40 border-sky-500/30 bg-zinc-900/80"
                  )}
                >
                  {num}
                </Button>
              );
            })}

            {shouldRender5PlusButton && (
              <Button
                onClick={handleShowMoreQuantities}
                className={cn(
                  "flex items-center justify-center rounded-xl border px-0 py-3 text-base font-semibold",
                  "bg-zinc-900/60 border-white/10 hover:bg-zinc-800/70 hover:border-white/20",
                  purchaseData.ticketQuantity >= 5 && "ring-2 ring-sky-500/40 border-sky-500/30 bg-zinc-900/80"
                )}
              >
                5+
              </Button>
            )}

            {showMoreQuantities &&
              Array.from({ length: maxTickets - 4 }, (_, i) => i + 5).map((num) => {
                const active = purchaseData.ticketQuantity === num;
                return (
                  <Button
                    key={num}
                    onClick={() => handleSelectQuantity(num)}
                    className={cn(
                      "flex items-center justify-center rounded-xl border px-0 py-3 text-base font-semibold",
                      "bg-zinc-900/60 border-white/10 hover:bg-zinc-800/70 hover:border-white/20",
                      active && "ring-2 ring-sky-500/40 border-sky-500/30 bg-zinc-900/80"
                    )}
                  >
                    {num}
                  </Button>
                );
              })}
          </motion.div>
        </>
      )}

      {/* Mensajes de estado */}
      {!selectedPrevent ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 text-center">
          <p className="text-zinc-300">Por favor, selecciona un tipo de entrada.</p>
        </div>
      ) : selectedPrevent.status === PreventStatusEnum.ACTIVE && maxTickets === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 text-center">
          <p className="text-zinc-300">No hay tickets disponibles para la entrada seleccionada.</p>
        </div>
      ) : null}

      {/* 3) Resumen de precio */}
      {selectedPrevent && maxTickets > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur p-5 shadow"
        >
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-sm">Precio por entrada</span>
            <span className="text-sm font-semibold text-white">
              {Number(ticketPrice) === 0 ? "Entrada liberada" : formatPrice(ticketPrice)}
            </span>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
            <span className="text-base font-medium text-white">Subtotal</span>
            <span className="text-base font-bold text-sky-400">
              {subtotal === 0 ? "Liberado" : formatPrice(subtotal)}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};