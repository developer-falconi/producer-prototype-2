import React, { useState, useEffect, useMemo } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { Event, PurchaseData, Prevent, PreventStatusEnum } from '@/lib/types';
import { Button } from '../ui/button';
import { motion, Easing } from 'framer-motion';


interface TicketSelectionProps {
  eventData: Event;
  purchaseData: PurchaseData;
  onUpdatePurchase: (data: Partial<PurchaseData>) => void;
}

export const TicketSelection: React.FC<TicketSelectionProps> = ({
  eventData,
  purchaseData,
  onUpdatePurchase
}) => {
  const allAvailablePrevents = useMemo(() => {
    return (eventData.prevents || []).filter(
      (p: Prevent) => p.status === PreventStatusEnum.ACTIVE && p.quantity > 0
    );
  }, [eventData.prevents]);

  const initialSelectedPrevent = useMemo(() => {
    if (purchaseData.selectedPrevent && allAvailablePrevents.some(p => p.id === purchaseData.selectedPrevent!.id)) {
      return purchaseData.selectedPrevent;
    }
    if (eventData.featuredPrevent && allAvailablePrevents.some(p => p.id === eventData.featuredPrevent!.id)) {
      return eventData.featuredPrevent;
    }
    if (allAvailablePrevents.length > 0) {
      return allAvailablePrevents[0];
    }
    return undefined;
  }, [purchaseData.selectedPrevent, allAvailablePrevents, eventData.featuredPrevent]);

  const [localSelectedPrevent, setLocalSelectedPrevent] = useState<Prevent | undefined>(initialSelectedPrevent);

  useEffect(() => {
    if (initialSelectedPrevent?.id !== localSelectedPrevent?.id) {
      setLocalSelectedPrevent(initialSelectedPrevent);
      if (initialSelectedPrevent) {
        onUpdatePurchase({ selectedPrevent: initialSelectedPrevent, ticketQuantity: 1 });
      } else {
        onUpdatePurchase({ selectedPrevent: null, ticketQuantity: 0 });
      }
    }
  }, [initialSelectedPrevent, localSelectedPrevent, onUpdatePurchase]);

  const selectedPrevent = allAvailablePrevents.find(p => p.id === localSelectedPrevent?.id);
  const maxTickets = selectedPrevent?.quantity
    ? Math.min(
      Number(selectedPrevent.price) === 0 ? 2 : 10,
      selectedPrevent.quantity
    )
    : 0;

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
      transition: {
        duration: 0.5,
        ease: "easeOut" as Easing
      },
    },
  };

  const handleSelectQuantity = (quantity: number) => {
    const actualQuantity = Math.min(quantity, maxTickets);

    if (actualQuantity <= 4 && showMoreQuantities) {
      setShowMoreQuantities(false);
    } else if (actualQuantity >= 5 && !showMoreQuantities && maxTickets >= 5) {
      setShowMoreQuantities(true);
    }
    onUpdatePurchase({ ticketQuantity: actualQuantity });
  };

  const handleSelectPreventType = (prevent: Prevent) => {
    setLocalSelectedPrevent(prevent);
    onUpdatePurchase({ selectedPrevent: prevent });

    const newMaxTicketsForPrevent = Math.min(10, prevent.quantity);
    if (purchaseData.ticketQuantity === 0 || purchaseData.ticketQuantity > newMaxTicketsForPrevent) {
      onUpdatePurchase({ ticketQuantity: newMaxTicketsForPrevent > 0 ? 1 : 0 });
    }
    setShowMoreQuantities(false);
  };

  const handleShowMoreQuantities = () => {
    setShowMoreQuantities(true);
    if (purchaseData.ticketQuantity < 5 && maxTickets >= 5) {
      onUpdatePurchase({ ticketQuantity: 5 });
    }
  };

  const shouldRender5PlusButton = maxTickets >= 5 && !showMoreQuantities;
  const noTicketsAvailableGlobally = allAvailablePrevents.length === 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-4 p-8"
    >
      {/* 1. Select Ticket Type Section */}
      <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
        Seleccionar Tipo de Entrada
      </motion.h2>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {noTicketsAvailableGlobally ? (
          <p className="text-gray-400 text-center col-span-full">No hay entradas activas disponibles para este evento.</p>
        ) : (
          allAvailablePrevents.map((prevent) => (
            <Button
              key={prevent.id}
              onClick={() => handleSelectPreventType(prevent)}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl shadow-md transition-all duration-200 ease-in-out text-left h-full",
                localSelectedPrevent?.id === prevent.id
                  ? "bg-black/20 border-2 border-blue-700 text-blue-700"
                  : "bg-zinc-800 text-gray-200 border-2 border-zinc-700 hover:border-gray-500 hover:bg-zinc-700 hover:text-white"
              )}
            >
              <div
                className={cn(
                  "flex text-lg w-full",
                  prevent.price > 0 ? 'justify-between' : 'justify-center'
                )}
              >
                <span className='line-clamp-3 whitespace-pre-wrap font-medium'>
                  {prevent.name}
                </span>
                {
                  prevent.price > 0 &&
                  <span className='h-full flex items-center font-bold'>{formatPrice(prevent.price)}</span>
                }
              </div>
              {
                prevent.description && (
                  <span className='text-xs w-full text-white font-light italic line-clamp-3 whitespace-pre-wrap'>
                    {prevent.description}
                  </span>
                )
              }
            </Button>
          ))
        )}
      </motion.div>

      {/* 2. Select Quantity Section (Only shown if a ticket type is selected AND tickets are available) */}
      {selectedPrevent && maxTickets > 0 && (
        <>
          <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
            Seleccionar Cantidad de Entradas
          </motion.h2>

          <motion.div variants={itemVariants} className="grid grid-cols-5 gap-3 mb-8">
            {/* Buttons for 1 to 4 tickets */}
            {Array.from({ length: Math.min(4, maxTickets) }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                onClick={() => handleSelectQuantity(num)}
                className={cn(
                  "flex items-center justify-center p-2 rounded-xl shadow-md transition-all duration-200 ease-in-out",
                  purchaseData.ticketQuantity === num && (!showMoreQuantities || num <= 4)
                    ? "bg-black/20 border-2 border-blue-700 text-blue-700 scale-105 font-bold"
                    : "bg-zinc-800 text-gray-200 border-2 border-zinc-700 hover:border-gray-500 hover:bg-zinc-700 hover:text-white"
                )}
              >
                <div className="text-lg">{num}</div>
              </Button>
            ))}

            {/* "5+" button - conditionally rendered */}
            {shouldRender5PlusButton && (
              <Button
                onClick={handleShowMoreQuantities}
                className={cn(
                  "flex items-center justify-center p-2 rounded-xl shadow-md transition-all duration-200 ease-in-out",
                  purchaseData.ticketQuantity >= 5
                    ? "bg-black/20 border-2 border-blue-700 text-blue-700 scale-105 font-bold"
                    : "bg-zinc-800 text-gray-200 border-2 border-zinc-700 hover:border-gray-500 hover:bg-zinc-700 hover:text-white"
                )}
              >
                <div className="text-lg">5+</div>
              </Button>
            )}

            {/* Additional buttons (5 to maxTickets) - conditionally rendered */}
            {showMoreQuantities && Array.from({ length: maxTickets - 4 }, (_, i) => i + 5).map((num) => (
              <Button
                key={num}
                onClick={() => handleSelectQuantity(num)}
                className={cn(
                  "flex items-center justify-center p-2 rounded-xl shadow-md transition-all duration-200 ease-in-out",
                  purchaseData.ticketQuantity === num
                    ? "bg-black/20 border-2 border-blue-700 text-blue-700 scale-105 font-bold"
                    : "bg-zinc-800 text-gray-200 border-2 border-zinc-700 hover:border-gray-500 hover:bg-zinc-700 hover:text-white"
                )}
              >
                <div className="text-lg">{num}</div>
              </Button>
            ))}
          </motion.div>
        </>
      )}

      {/* Message if a prevent is selected but it has no tickets (maxTickets is 0)
          or if no prevent is selected, but there are active prevents to choose from */}
      {(!selectedPrevent && allAvailablePrevents.length > 0) ? (
        <p className="text-gray-400 text-center col-span-full mb-8">Por favor, selecciona un tipo de entrada.</p>
      ) : (selectedPrevent && maxTickets === 0) ? (
        <p className="text-gray-400 text-center col-span-full mb-8">No hay tickets disponibles para la entrada seleccionada.</p>
      ) : null}


      {/* 3. Price Summary Section (Only shown if a ticket type is selected AND tickets are available) */}
      {selectedPrevent && maxTickets > 0 && (
        <motion.div variants={itemVariants} className="bg-zinc-800 rounded-xl p-5 shadow-lg border border-zinc-700">
          <div className="flex justify-between items-center text-gray-300">
            <span className="text-base">Precio por entrada:</span>
            <span className="font-semibold text-party-primary text-base">
              {
                Number(ticketPrice) === 0
                  ? 'Entrada Liberada'
                  : formatPrice(ticketPrice)
              }
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-700 text-xl font-bold">
            <span className="text-gray-100">Subtotal:</span>
            <span className="text-blue-700">
              {
                subtotal === 0
                  ? 'Liberado'
                  : formatPrice(subtotal)
              }
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};