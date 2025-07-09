import React, { useState, useEffect, useMemo } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { Event, PurchaseData, Prevent } from '@/lib/types';
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
    // Filter prevents that are active and have available quantity
    return (eventData.prevents || []).filter(
      (p: Prevent) => p.status === 'ACTIVE' && p.quantity > 0
    );
  }, [eventData.prevents]);

  const initialSelectedPrevent = useMemo(() => {
    // 1. If purchaseData already has a selectedPrevent and it's active and available
    if (purchaseData.selectedPrevent && allAvailablePrevents.some(p => p.id === purchaseData.selectedPrevent!.id)) {
      return purchaseData.selectedPrevent;
    }
    // 2. Otherwise, try to use eventData.lastPrevent if it's active and available
    if (eventData.featuredPrevent && allAvailablePrevents.some(p => p.id === eventData.featuredPrevent!.id)) {
      return eventData.featuredPrevent;
    }
    // 3. If neither, pick the first active and available prevent
    if (allAvailablePrevents.length > 0) {
      return allAvailablePrevents[0];
    }
    return undefined; // No prevent selected initially
  }, [purchaseData.selectedPrevent, allAvailablePrevents, eventData.featuredPrevent]);

  const [localSelectedPrevent, setLocalSelectedPrevent] = useState<Prevent | undefined>(initialSelectedPrevent);

  // Synchronize local selectedPrevent state with parent's initial selection or eventData changes
  useEffect(() => {
    // Only update if initialSelectedPrevent has changed from the current local state
    // or if localSelectedPrevent is null/undefined and initialSelectedPrevent is not
    if (initialSelectedPrevent?.id !== localSelectedPrevent?.id) {
      setLocalSelectedPrevent(initialSelectedPrevent);
      // Immediately inform parent if initial selection is made or cleared
      if (initialSelectedPrevent) {
        onUpdatePurchase({ selectedPrevent: initialSelectedPrevent, ticketQuantity: 1 });
      } else {
        onUpdatePurchase({ selectedPrevent: null, ticketQuantity: 0 }); // No prevent selected, quantity 0
      }
    }
  }, [initialSelectedPrevent, localSelectedPrevent, onUpdatePurchase]);


  // Derive the currently selected prevent object based on local state (or parent's, if synchronized)
  // This ensures 'selectedPrevent' always reflects the actual prevent object
  const selectedPrevent = allAvailablePrevents.find(p => p.id === localSelectedPrevent?.id);


  // Max tickets for the *selected* prevent, capped at 10 for quantity selector
  // If no prevent is selected or prevent has no quantity, maxTickets is 0
  const maxTickets = selectedPrevent?.quantity ? Math.min(10, selectedPrevent.quantity) : 0;

  // Ticket price based on the selected prevent (parse to number, default to 0)
  const ticketPrice = selectedPrevent?.price || 0;

  // Subtotal based on selected prevent's price and current quantity from parent's purchaseData
  const subtotal = ticketPrice * purchaseData.ticketQuantity;

  // State to control showing extended quantities (5+)
  const [showMoreQuantities, setShowMoreQuantities] = useState(
    purchaseData.ticketQuantity >= 5 && maxTickets >= 5
  );

  // Effect to synchronize showMoreQuantities if purchaseData.ticketQuantity changes externally
  // or if maxTickets changes (e.g., when a different prevent is selected)
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

  // Handler for selecting a specific quantity
  const handleSelectQuantity = (quantity: number) => {
    // Ensure the selected quantity does not exceed the maximum available for the current prevent
    const actualQuantity = Math.min(quantity, maxTickets);

    if (actualQuantity <= 4 && showMoreQuantities) {
      setShowMoreQuantities(false);
    } else if (actualQuantity >= 5 && !showMoreQuantities && maxTickets >= 5) {
      setShowMoreQuantities(true);
    }
    onUpdatePurchase({ ticketQuantity: actualQuantity });
  };

  // Handler for clicking a prevent (ticket type) button
  const handleSelectPreventType = (prevent: Prevent) => {
    setLocalSelectedPrevent(prevent); // Update local state
    onUpdatePurchase({ selectedPrevent: prevent }); // Inform parent about the new selected prevent

    // Reset quantity to 1 (or 0 if new prevent has 0 quantity) when changing prevent type,
    // or keep it if current quantity is valid for the new prevent
    const newMaxTicketsForPrevent = Math.min(10, prevent.quantity);
    if (purchaseData.ticketQuantity === 0 || purchaseData.ticketQuantity > newMaxTicketsForPrevent) {
      onUpdatePurchase({ ticketQuantity: newMaxTicketsForPrevent > 0 ? 1 : 0 });
    }
    setShowMoreQuantities(false); // Collapse quantity options when changing prevent type
  };

  // Handler for clicking the "5+" button
  const handleShowMoreQuantities = () => {
    setShowMoreQuantities(true);
    // If current quantity is less than 5, default to 5 tickets when "5+" is clicked
    if (purchaseData.ticketQuantity < 5 && maxTickets >= 5) { // Ensure maxTickets allows 5
      onUpdatePurchase({ ticketQuantity: 5 });
    }
  };

  // Determine if the "5+" button should be rendered
  const shouldRender5PlusButton = maxTickets >= 5 && !showMoreQuantities;

  // Check if any prevents are available to display
  const noTicketsAvailableGlobally = allAvailablePrevents.length === 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-8 p-4"
    >
      {/* 1. Select Ticket Type Section */}
      <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
        Seleccionar Tipo de Entrada
      </motion.h2>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {noTicketsAvailableGlobally ? (
          <p className="text-gray-400 text-center col-span-full">No hay entradas activas disponibles para este evento.</p>
        ) : (
          allAvailablePrevents.map((prevent) => (
            <Button
              key={prevent.id}
              onClick={() => handleSelectPreventType(prevent)}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl shadow-md transition-all duration-200 ease-in-out text-left h-auto min-h-[80px]",
                localSelectedPrevent?.id === prevent.id
                  ? "bg-black/20 border-2 border-blue-700 text-blue-700 scale-105 font-bold"
                  : "bg-zinc-800 text-gray-200 border-2 border-zinc-700 hover:border-gray-500 hover:bg-zinc-700 hover:text-white"
              )}
            >
              <div className="text-lg truncate w-full">{prevent.name}</div>
              <div className="text-sm mt-1">
                {formatPrice(prevent.price)}
                {prevent.quantity !== undefined && prevent.quantity !== null && (
                  <span className="ml-2">({prevent.quantity} disponibles)</span>
                )}
              </div>
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
                  // Highlight 5+ button if a quantity >= 5 is selected
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
            <span className="font-semibold text-party-primary text-base">{formatPrice(ticketPrice)}</span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-700 text-xl font-bold">
            <span className="text-gray-100">Subtotal:</span>
            <span className="text-blue-700">{formatPrice(subtotal)}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};