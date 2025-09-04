import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CouponEvent, PurchaseData } from '@/lib/types';
import { motion, AnimatePresence, Easing } from 'framer-motion';
import { validateCoupon } from '@/lib/api';
import { toast } from 'sonner';
import { Mail, Tag, Loader2, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as Easing } },
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
    <div className="space-y-6 p-6 md:p-8">
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">Datos de contacto</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">1 email</span>
      </motion.div>

      {/* Email */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur p-5"
      >
        <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">
          Email
        </Label>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <Mail className="h-4 w-4" />
          </span>
          <Input
            id="email"
            type="email"
            value={purchaseData.email}
            onChange={handleEmailChange}
            placeholder="tu@email.com"
            className={cn(
              'pl-9 bg-white/5 text-white placeholder:text-zinc-400 rounded-xl',
              'border border-white/10 outline-none',
              'hover:border-blue-800/40',
              'focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70',
              'focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0',
              'active:border-blue-800 active:ring-2 active:ring-blue-800/70',
              !isValidEmail && purchaseData.email && 'border-rose-500/60 focus:ring-rose-600/50 focus:border-rose-600'
            )}
          />
        </div>
        <div className="mt-2 min-h-[20px]">
          {!isValidEmail && purchaseData.email ? (
            <p className="text-xs text-rose-300">Por favor, ingresá un email válido.</p>
          ) : (
            <p className="text-xs text-zinc-400">Te enviaremos las entradas y los detalles a este email.</p>
          )}
        </div>
      </motion.div>

      {/* Cupón */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur p-4"
      >
        {!appliedCoupon ? (
          <>
            <button
              type="button"
              className="text-sm text-sky-300 hover:text-white hover:underline inline-flex items-center gap-2"
              onClick={() => setShowCouponBox((v) => !v)}
            >
              <Tag className="h-4 w-4" />
              {showCouponBox ? 'Ocultar cupón' : '¿Tenés un cupón?'}
            </button>

            <AnimatePresence initial={false}>
              {showCouponBox && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
                >
                  <div className="flex-1">
                    <Label htmlFor="coupon" className="text-zinc-300 text-sm font-medium">
                      Código de cupón
                    </Label>
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="EJ: FESTI20"
                      className={cn(
                        'mt-2 bg-white/5 text-white placeholder:text-zinc-400 rounded-xl',
                        'border border-white/10 outline-none',
                        'hover:border-blue-800/40',
                        'focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70',
                        'focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0',
                        'active:border-blue-800 active:ring-2 active:ring-blue-800/70'
                      )}
                    />
                  </div>
                  <Button
                    onClick={handleValidateCoupon}
                    disabled={validating}
                    className="h-11 rounded-xl bg-sky-700 hover:bg-sky-600 text-white px-4"
                  >
                    {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validar'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className="mt-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 p-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm text-emerald-200">
                  Cupón aplicado: <span className="font-semibold underline">{appliedCoupon.code}</span>
                </p>
                {!!discountAmount && (
                  <p className="text-xs text-emerald-300/90">Descuento: ${discountAmount.toFixed(2)}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onCouponRemoved}
              className="text-emerald-200 hover:text-white hover:bg-emerald-600/30"
            >
              <X className="h-4 w-4 mr-1" />
              Quitar
            </Button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isEmailCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-2xl border border-blue-800/40 bg-blue-800/15 p-4 text-blue-100 text-sm md:text-base font-medium"
          >
            ¡Genial! Te enviaremos las entradas y toda la info a tu correo.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};