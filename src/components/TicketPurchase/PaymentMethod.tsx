import React, { useEffect, useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { motion, Easing } from "framer-motion";
import { Event, PurchaseData } from '@/lib/types';
import { Button } from '../ui/button';

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

interface PaymentMethodProps {
  eventData: Event;
  purchaseData: PurchaseData;
  onUpdatePaymentMethod: (method: 'mercadopago' | 'bank_transfer' | 'free') => void;
  onUpdatePurchaseFile: (file: File) => void;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  eventData,
  purchaseData,
  onUpdatePaymentMethod,
  onUpdatePurchaseFile
}) => {
  const [error, setError] = useState<string>();
  const [isMpConfiguredForEvent, setIsMpConfiguredForEvent] = useState<boolean>(false);

  const calculateSubtotal = () => {
    const ticketPrice = purchaseData.selectedPrevent?.price || 0;
    const subtotalTickets = ticketPrice * purchaseData.ticketQuantity;

    const totalProductsPrice = purchaseData.products.reduce(
      (sum, item) => {
        const priceNum = parseFloat(item.product.price.toString());
        const discountNum = parseFloat(item.product.discountPercentage.toString());
        const effectivePrice = priceNum * (1 - discountNum / 100);
        return sum + effectivePrice * item.quantity;
      },
      0
    );

    const totalCombosPrice = purchaseData.combos.reduce(
      (sum, item) => {
        const priceNum = parseFloat(item.combo.price.toString());
        return sum + priceNum * item.quantity;
      },
      0
    );

    return subtotalTickets + totalProductsPrice + totalCombosPrice;
  };

  const mpFeeRate = 0.0824;
  const subtotalBeforeFee = calculateSubtotal();
  const calculatedMercadoPagoFee = subtotalBeforeFee * mpFeeRate;

  useEffect(() => {
    if (eventData.oAuthMercadoPago?.mpPublicKey) {
      setIsMpConfiguredForEvent(true);
      setError(null);
    } else {
      setIsMpConfiguredForEvent(false);
      if (purchaseData.paymentMethod === 'mercadopago') {
        setError("Mercado Pago no está configurado para este evento. Se seleccionó Transferencia.");
        onUpdatePaymentMethod('bank_transfer');
      }
    }
  }, [eventData.oAuthMercadoPago, purchaseData.paymentMethod, onUpdatePaymentMethod]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUpdatePurchaseFile(file);
    }
  };

  return (
    <motion.div
      className="space-y-4 p-8"
      initial="hidden"
      animate="visible"
      variants={itemVariants}
    >
      <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
        Selecciona método de pago
      </motion.h2>

      <div className="space-y-4">
        {
          purchaseData.total === 0 ? (
            <motion.div
              onClick={() => onUpdatePaymentMethod('free')}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                purchaseData.paymentMethod
                  ? "border-blue-700 bg-blue-700/10"
                  : "border-border hover:border-blue-700/50"
              )}
              variants={itemVariants}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-300">Entrada Liberada</h3>
                  <p className="text-sm text-blue-700">
                    Sin comisiones
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* <motion.div
                onClick={() => onUpdatePaymentMethod('bank_transfer')}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                  purchaseData.paymentMethod === 'bank_transfer'
                    ? "border-blue-700 bg-blue-700/10"
                    : "border-border hover:border-blue-700/50"
                )}
                variants={itemVariants}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-300">Transferencia Bancaria</h3>
                    <p className="text-sm text-blue-700">
                      Sin comisiones <br />
                      <span className='text-xs'>(Acreditación manual)</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-300">0%</p>
                  </div>
                </div>
              </motion.div> */}

              {isMpConfiguredForEvent && (
                <motion.div
                  onClick={() => onUpdatePaymentMethod('mercadopago')}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                    purchaseData.paymentMethod === 'mercadopago'
                      ? "border-blue-700 bg-blue-700/10"
                      : "border-border hover:border-blue-700/50"
                  )}
                  variants={itemVariants}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-300">MercadoPago</h3>
                      <p className="text-sm text-blue-700">
                        Tu pago se acredita al instante <br />
                        <span className='text-xs'>(Comision exclusiva de Mercado Pago)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-300">8.24%</p>
                      <p className="text-xs text-gray-400 whitespace-nowrap">+ {formatPrice(calculatedMercadoPagoFee)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )
        }

        {purchaseData.paymentMethod === 'bank_transfer' && purchaseData.total > 0 && (
          <div className="space-y-4 p-4 bg-green-700/20 border border-green-700 rounded-lg">
            <div className="text-lg text-gray-300">
              <h4 className="font-medium">Detalles de la Cuenta Bancaria:</h4>
              <p className='font-bold text-white text-xl'>Alias: {eventData.alias}</p>
            </div>

            <div className="mt-4">
              <label className="block text-gray-300 font-medium mb-2">Adjuntar comprobante</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="border border-gray-300 p-2 rounded-lg text-gray-300 w-full cursor-pointer hover:border-2"
              />
            </div>
          </div>
        )}

        {error && (
          <p className='text-destructive'>{error}</p>
        )}
      </div>
    </motion.div>
  );
};