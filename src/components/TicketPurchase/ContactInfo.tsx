import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CouponEvent, PurchaseData } from '@/lib/types';
import { motion, AnimatePresence, Easing } from "framer-motion";
import { validateCoupon } from '@/lib/api';
import { toast } from 'sonner';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as Easing } },
};

interface ContactInfoProps {
  purchaseData: PurchaseData;
  onUpdateEmail: (email: string) => void;
  eventId: number;
  appliedCoupon?: CouponEvent | null;
  discountAmount?: number;
  onCouponApplied: (coupon: CouponEvent) => void;
  onCouponRemoved: () => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({
  purchaseData,
  onUpdateEmail,
  eventId,
  appliedCoupon,
  discountAmount = 0,
  onCouponApplied,
  onCouponRemoved,
}) => {
  const [isEmailCompleted, setIsEmailCompleted] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(true);

  const [showCouponBox, setShowCouponBox] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (purchaseData.email && emailRegex.test(purchaseData.email)) {
      setIsEmailCompleted(true);
      setIsValidEmail(true);
    } else {
      setIsEmailCompleted(false);
      setIsValidEmail(false);
    }
  }, [purchaseData.email]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    onUpdateEmail(emailValue);
    const ok = emailRegex.test(emailValue);
    setIsValidEmail(ok);
    setIsEmailCompleted(!!emailValue && ok);
  };

  const handleValidateCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return toast.error('Ingresá un código de cupón.');

    setValidating(true);
    try {
      const resp: { success: boolean; data?: CouponEvent; message?: string } = await validateCoupon(eventId, code);

      if (!resp.success || !resp.data) {
        toast.error(resp.message || 'Cupón inválido.');
        return;
      }
      onCouponApplied(resp.data);
      toast.success('Cupón aplicado.');
      setShowCouponBox(false);
    } catch {
      toast.error('No se pudo validar el cupón.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-4 p-8">
      <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
        Información de Contacto
      </motion.h2>

      <div>
        <Label htmlFor="email" className="text-gray-300 text-sm font-medium px-1 rounded">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={purchaseData.email}
          onChange={handleEmailChange}
          className={`p-3 bg-transparent text-white rounded-lg transition-all duration-200 ${!isValidEmail && purchaseData.email ? 'border-red-500' : ''}`}
          placeholder="tu@email.com"
        />
        {!isValidEmail && purchaseData.email && (
          <p className="text-sm text-red-400 mt-1">Por favor, ingresa un email válido.</p>
        )}
        <p className="text-sm text-gray-300 mt-4">
          Te enviaremos las entradas y detalles del evento a este email
        </p>
      </div>

      {/* CUPÓN */}
      <div className="mt-6 space-y-3">
        {!appliedCoupon ? (
          <>
            <button
              type="button"
              className="text-sm text-blue-300 hover:underline"
              onClick={() => setShowCouponBox(v => !v)}
            >
              {showCouponBox ? 'Ocultar cupón' : '¿Tenés un cupón?'}
            </button>

            <AnimatePresence>
              {showCouponBox && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex gap-2 items-end"
                >
                  <div className="flex-1">
                    <Label htmlFor="coupon" className="text-gray-300 text-sm font-medium px-1 rounded">
                      Código de cupón
                    </Label>
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="EJ: FESTI20"
                      className="p-3 bg-transparent text-white rounded-lg"
                    />
                  </div>
                  <Button onClick={handleValidateCoupon} disabled={validating}>
                    {validating ? 'Validando…' : 'Validar'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="p-3 rounded-lg border border-emerald-600 bg-emerald-600/10 text-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                Cupón aplicado: <span className="underline">{appliedCoupon.code}</span>
              </p>
              {!!discountAmount && (
                <p className="text-xs opacity-90">Descuento: ${discountAmount.toFixed(2)}</p>
              )}
            </div>
            <Button variant="ghost" className="text-emerald-200 hover:text-white hover:bg-green-800/80" onClick={onCouponRemoved}>
              Quitar
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEmailCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: "easeOut" }}
            className="p-4 bg-blue-600/20 border border-blue-600 rounded-lg text-blue-200 text-center text-md font-semibold shadow-xl"
          >
            ¡Genial! Revisa tu casilla de email, te enviaremos las entradas y toda la info por ahí.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
