import React, { useEffect, useMemo, useRef, useState, UIEvent } from 'react';
import { cn, formatPrice, getFeeBreakdown, toNum } from '@/lib/utils';
import { motion, Easing, Variants } from "framer-motion";
import { EventDto, PurchaseData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Landmark, ShieldCheck, Zap, BadgeCheck, Paperclip, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: "easeOut" as Easing },
  },
};

interface PaymentMethodProps {
  eventData: EventDto;
  purchaseData: PurchaseData;
  onUpdatePaymentMethod: (method: 'mercadopago' | 'bank_transfer' | 'free') => void;
  onUpdatePurchaseFile: (file: File) => void;
}

type CardKey = 'mercadopago' | 'bank_transfer' | 'free';

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  eventData,
  purchaseData,
  onUpdatePaymentMethod,
  onUpdatePurchaseFile
}) => {
  const isMobile = useIsMobile();
  const [error, setError] = useState<string>();

  const activePaymentMethods = useMemo(() => {
    return eventData.payments?.filter(pe => pe.paymentMethod) || [];
  }, [eventData.payments]);

  const normalize = (s?: string) => (s ?? '').toLowerCase().replace(/\s/g, '');
  const mpMethod = useMemo(
    () => activePaymentMethods.find(pe => normalize(pe.paymentMethod.name) === 'mercadopago'),
    [activePaymentMethods]
  );
  const transferMethod = useMemo(
    () => activePaymentMethods.find(pe => normalize(pe.paymentMethod.name) === 'transferenciabancaria'),
    [activePaymentMethods]
  );

  const calculateSubtotal = () => {
    const ticketPrice = purchaseData.selectedPrevent?.price || 0;
    const subtotalTickets = ticketPrice * purchaseData.ticketQuantity;
    const totalProductsPrice = purchaseData.products.reduce((sum, item) => {
      const priceNum = parseFloat(item.product.price.toString());
      const discountNum = parseFloat(item.product.discountPercentage.toString());
      const effectivePrice = priceNum * (1 - discountNum / 100);
      return sum + effectivePrice * item.quantity;
    }, 0);
    const totalCombosPrice = purchaseData.combos.reduce((sum, item) => {
      const priceNum = parseFloat(item.combo.price.toString());
      return sum + priceNum * item.quantity;
    }, 0);
    return subtotalTickets + totalProductsPrice + totalCombosPrice;
  };

  const base = useMemo(() => {
    const fallbackSubtotal = calculateSubtotal();
    return toNum(purchaseData.total ?? fallbackSubtotal);
  }, [
    purchaseData.total,
    purchaseData.selectedPrevent,
    purchaseData.ticketQuantity,
    purchaseData.products,
    purchaseData.combos
  ]);

  const subtotal = base;

  const mpEnabled = !!eventData.oAuthMercadoPago?.mpPublicKey;
  const hasMP = !!mpMethod && mpEnabled && base > 0;

  const hasTransferDetails =
    !!transferMethod &&
    !!transferMethod.accountAlias?.length &&
    !!transferMethod.accountBank?.length &&
    !!transferMethod.accountFullName?.length;

  const hasBankTransfer = hasTransferDetails;
  const isFree = base <= 0;

  const recommendedKey: CardKey | null = useMemo(() => {
    if (isFree) return 'free';
    if (hasBankTransfer) return 'bank_transfer';
    if (hasMP) return 'mercadopago';
    return null;
  }, [isFree, hasBankTransfer, hasMP]);

  const [selected, setSelected] = useState<CardKey | null>(recommendedKey);

  useEffect(() => {
    if (!hasMP && !hasBankTransfer && !isFree) {
      setError("No hay métodos de pago activos asociados a este evento.");
    } else {
      setError(undefined);
    }
  }, [hasMP, hasBankTransfer, isFree]);

  useEffect(() => {
    if (recommendedKey && selected !== recommendedKey) {
      setSelected(recommendedKey);
    }
  }, [recommendedKey]);

  useEffect(() => {
    if (selected && selected !== purchaseData.paymentMethod) {
      onUpdatePaymentMethod(selected);
    }
  }, [selected, onUpdatePaymentMethod, purchaseData.paymentMethod]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);

  const pick = (k: CardKey) => {
    setSelected(k);
    onUpdatePaymentMethod(k);
    const idx = cards.findIndex(c => c.key === k);
    const el = trackRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const childWidth = (el.firstElementChild as HTMLElement)?.clientWidth ?? 1;
    const gap = parseFloat(getComputedStyle(el).columnGap || '12');
    const approxIndex = Math.round(el.scrollLeft / (childWidth + gap));
    setPage(Math.max(0, Math.min(cards.length - 1, approxIndex)));
  };

  const {
    clientFeePortion, commissionsEnabled,
    mpCommissionAmount, transferCommissionAmount,
  } = useMemo(() => getFeeBreakdown(eventData?.fee ?? null, base), [eventData?.fee, base]);

  const paymentCommission = commissionsEnabled
    ? (selected === 'mercadopago'
      ? mpCommissionAmount
      : selected === 'bank_transfer'
        ? transferCommissionAmount
        : 0)
    : 0;

  const serviceCharge = commissionsEnabled ? paymentCommission : clientFeePortion;
  const totalDisplay = subtotal + serviceCharge;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpdatePurchaseFile(file);
  };

  const cards: Array<{
    key: CardKey;
    title: string;
    desc: string;
    accent: string;
    badge?: string;
    Icon: any;
  }> = useMemo(() => {
    if (isFree) {
      return [{
        key: 'free',
        title: 'Entrada Liberada',
        desc: 'Sin comisiones ni costo adicional.',
        accent: 'from-emerald-600 to-emerald-900',
        badge: 'Recomendado',
        Icon: BadgeCheck,
      }];
    }

    const arr: Array<{
      key: CardKey; title: string; desc: string; accent: string; badge?: string; Icon: any;
    }> = [];

    if (hasBankTransfer) {
      arr.push({
        key: 'bank_transfer',
        title: 'Transferencia Bancaria',
        desc: 'Sin comisiones • Acreditación manual',
        accent: 'from-emerald-600 to-emerald-900',
        badge: recommendedKey === 'bank_transfer' ? 'Recomendado' : undefined,
        Icon: Landmark,
      });
    }

    if (hasMP) {
      arr.push({
        key: 'mercadopago',
        title: 'Mercado Pago',
        desc: 'Tarjeta o saldo en tu cuenta MP. Acreditación instantánea.',
        accent: 'from-blue-600 to-blue-900',
        badge: recommendedKey === 'mercadopago' ? 'Recomendado' : undefined,
        Icon: CreditCard,
      });
    }

    return arr;
  }, [isFree, hasBankTransfer, hasMP, recommendedKey]);

  return (
    <motion.div
      className="space-y-5 p-6 md:p-8"
      initial="hidden"
      animate="visible"
      variants={itemVariants}
    >
      <header className="relative z-10 text-center space-y-1">
        <h2 className="text-xl font-extrabold text-white">Elegí cómo pagar</h2>
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Pago seguro • Confirmás antes de emitir tu QR
        </p>
      </header>

      <div className="relative w-full overflow-hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className={cn(
            "flex gap-3 overflow-x-hidden snap-x snap-mandatory px-1 py-1",
            "scrollbar-none"
          )}
          aria-label="Opciones de pago"
        >
          {cards.map((c) => {
            const active = selected === c.key;
            return (
              <Card
                key={c.key}
                role="button"
                tabIndex={0}
                aria-pressed={!!active}
                onClick={() => pick(c.key)}
                onKeyDown={(e) => e.key === "Enter" && pick(c.key)}
                className={cn(
                  "min-w-[80%] md:min-w-[50%] snap-center transition-all relative rounded-2xl overflow-hidden border-none",
                  active ? "bg-white/5" : "bg-white/[0.03]"
                )}
              >
                <div
                  className={cn(
                    "h-1.5 w-full bg-gradient-to-r",
                    active ? c.accent : "from-white/10 to-white/5"
                  )}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r", c.accent)}>
                      <c.Icon className="h-3.5 w-3.5 text-white" />
                    </span>
                    {c.title}
                  </CardTitle>
                  {c.badge && (
                    <span className="absolute top-2 right-2 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/40 px-2 py-[2px] text-[10px]">
                      {c.badge}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-zinc-400">{c.desc}</p>
                  {c.key === 'mercadopago' && (
                    <ul className="mt-3 text-[11px] text-zinc-400 grid grid-cols-2 gap-2">
                      <li className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-indigo-400" /> Aprobación rápida
                      </li>
                      <li className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Protegido
                      </li>
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {cards.length > 1 && isMobile && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = trackRef.current?.children[i] as HTMLElement | undefined;
                  el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  page === i ? "w-5 bg-white" : "w-2 bg-white/40"
                )}
                aria-label={`Ir a la opción ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className={cn("relative rounded-xl p-4", "border border-white/10 bg-white/[0.03]")}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Subtotal</span>
            <span className="text-sm font-bold text-white">{formatPrice(subtotal)}</span>
          </div>

          {serviceCharge > 0 && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-red-400">Cargo por servicio</span>
              <span className="font-semibold text-red-400">+ {formatPrice(serviceCharge)}</span>
            </div>
          )}

          <div className="mt-2 border-t border-white/10 pt-2 flex items-center justify-between">
            <span className="text-base text-zinc-200">Total</span>
            <span className="text-xl font-extrabold text-white">{formatPrice(totalDisplay)}</span>
          </div>
        </div>
      )}

      {selected === 'bank_transfer' && purchaseData.total > 0 && (
        <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="text-white">
            <h4 className="font-bold">Datos para Transferencia</h4>
            <div className="mt-1 text-sm text-zinc-200">
              <p><span className="text-zinc-400">Alias:</span> {transferMethod?.accountAlias}</p>
              <p><span className="text-zinc-400">Titular:</span> {transferMethod?.accountFullName}</p>
              <p><span className="text-zinc-400">Banco:</span> {transferMethod?.accountBank}</p>
            </div>
          </div>

          <div className="mt-1">
            <label className="block text-sm text-zinc-300 font-medium mb-2">Adjuntar comprobante</label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                className={cn(
                  "block w-full p-1 rounded-lg border border-white/10 bg-white/5 text-white file:bg-transparent file:border-0 file:text-zinc-300",
                  "hover:border-blue-800/40",
                  "focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70 focus-visible:ring-offset-0",
                  "active:border-blue-800 active:ring-2 active:ring-blue-800/70"
                )}
              />
              <Paperclip className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>
        </div>
      )}

      {error && <ErrorNotification message={error} />}
    </motion.div>
  );
};

interface ErrorNotificationProps {
  message: string;
}

const errorVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 10 }
  },
};

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message }) => {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4",
        "text-sm font-medium text-rose-400"
      )}
      variants={errorVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p>{message}</p>
    </motion.div>
  );
};