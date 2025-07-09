import React, { useEffect, useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { motion, Easing } from "framer-motion";
import { Event, PurchaseData } from '@/lib/types';
import { Button } from '../ui/button';
import MercadoPagoButton from '../MercadoPago';
import { createPreference } from '@/lib/api';

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
  onUpdatePaymentMethod: (method: 'mercadopago' | 'bank_transfer') => void;
  onUpdatePurchaseFile: (file: File) => void;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  eventData,
  purchaseData,
  onUpdatePaymentMethod,
  onUpdatePurchaseFile
}) => {
  const [error, setError] = useState<string>();
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string>("");
  const [isMpConfiguredForEvent, setIsMpConfiguredForEvent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const ticketPrice = purchaseData.selectedPrevent?.price || eventData?.featuredPrevent?.price || 0;
  const subtotalWithoutFees = ticketPrice * purchaseData.ticketQuantity;
  const mercadoPagoFee = subtotalWithoutFees * 0.0824;

  const subtotal = purchaseData.paymentMethod === 'mercadopago'
    ? subtotalWithoutFees + mercadoPagoFee
    : subtotalWithoutFees;

  useEffect(() => {
    if (eventData.oAuthMercadoPago?.mpPublicKey) {
      setIsMpConfiguredForEvent(true);
    } else {
      setIsMpConfiguredForEvent(false);
      if (purchaseData.paymentMethod === 'mercadopago') {
        setError("Mercado Pago no está configurado para este evento. Se seleccionó Transferencia.");
      }
    }
  }, [eventData.oAuthMercadoPago, purchaseData.paymentMethod]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUpdatePurchaseFile(file);
    }
  };

  const handleGoToPay = async () => {
    setIsSubmitting(true);
    const updatedParticipants = purchaseData.clients.map(participant => ({
      ...participant,
      email: purchaseData.email
    }));
    try {
      const res = await createPreference(purchaseData.selectedPrevent.id, updatedParticipants);
      if (res.success) {
        setPreferenceId(res.data.preferenceId);
        setPublicKey(res.data.publicKey);
      }
      if (!res.success) {
        setError(res['message']);
      }
    } catch {
      setError('Error al contactar a Mercado Pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="space-y-4 p-8"
      initial="hidden"
      animate="visible"
      variants={itemVariants}
    >
      <motion.h3
        variants={itemVariants}
        className="px-6 border-green-700 bg-green-700/10 py-2 text-lg font-bold text-gray-100 mb-4 rounded-lg border"
      >
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </motion.h3>

      <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
        Selecciona método de pago
      </motion.h2>

      <div className="space-y-4">
        <motion.div
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
              <p className="text-sm text-blue-700">Sin comisiones <br />(Acreditación manual)</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-300">0%</p>
            </div>
          </div>
        </motion.div>

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
                <p className="text-sm text-blue-700">Pago inmediato</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-300">8.24%</p>
                <p className="text-xs text-gray-400">+ {formatPrice(mercadoPagoFee)}</p>
              </div>
            </div>
          </motion.div>
        )}

        {purchaseData.paymentMethod === 'bank_transfer' && (
          <div className="space-y-4 p-4 bg-green-700/20 border border-green-700 rounded-lg">
            <div className="text-lg text-gray-300">
              <h4 className="font-medium">Detalles de la Cuenta Bancaria:</h4>
              <p className='font-bold'>Alias: {eventData.alias}</p>
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

        {purchaseData.paymentMethod === 'mercadopago' && (
          <div className="mt-4">
            {!preferenceId || !publicKey ? (
              <Button
                onClick={handleGoToPay}
                className="w-full bg-green-800 truncate hover:bg-green-700"
              >
                {isSubmitting ? 'Generando pago...' : 'Ir a pagar'}
              </Button>
            ) : (
              <MercadoPagoButton preferenceId={preferenceId} publicKey={eventData.oAuthMercadoPago.mpPublicKey} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
