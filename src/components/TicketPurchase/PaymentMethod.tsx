import React, { useEffect, useMemo, useRef, useState, UIEvent } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { motion, Easing } from "framer-motion";
import { EventDto, PurchaseData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Landmark, ShieldCheck, Zap, BadgeCheck, Paperclip } from 'lucide-react';
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

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  eventData,
  purchaseData,
  onUpdatePaymentMethod,
  onUpdatePurchaseFile
}) => {
  const isMobile = useIsMobile();

  const [error, setError] = useState<string>();
  const [isMpConfiguredForEvent, setIsMpConfiguredForEvent] = useState<boolean>(false);

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

  const subtotal = useMemo(() => calculateSubtotal(), [
    purchaseData.selectedPrevent,
    purchaseData.ticketQuantity,
    purchaseData.products,
    purchaseData.combos,
  ]);

  const mpFeeRate = 0.0824;
  const mpFee = subtotal * mpFeeRate;

  useEffect(() => {
    const mpEnabled = !!eventData.oAuthMercadoPago?.mpPublicKey &&
      !!eventData.payments?.find(pe => pe.paymentMethod.name.toLowerCase().replace(/\s/g, '') === 'mercadopago');

    setIsMpConfiguredForEvent(mpEnabled);

    if (!mpEnabled && purchaseData.paymentMethod === 'mercadopago') {
      setError("Mercado Pago no está configurado para este evento. Se seleccionó Transferencia.");
      onUpdatePaymentMethod('bank_transfer');
    } else {
      setError(undefined);
    }
  }, [eventData.oAuthMercadoPago, eventData.payments, purchaseData.paymentMethod, onUpdatePaymentMethod]);

  const transferMethod = useMemo(
    () => eventData.payments?.find(pe => pe.paymentMethod.name.toLowerCase().replace(/\s/g, '') === 'transferenciabancaria'),
    [eventData.payments]
  );

  const hasMP = isMpConfiguredForEvent && purchaseData.total > 0;
  const isFree = purchaseData.total === 0;

  type CardKey = 'mercadopago' | 'bank_transfer' | 'free';
  const cards = useMemo(() => {
    if (isFree) {
      return [{
        key: 'free' as const,
        title: 'Entrada Liberada',
        desc: 'Sin comisiones ni costo adicional.',
        accent: 'from-emerald-600 to-emerald-900',
        badge: 'Sin cargo',
        Icon: BadgeCheck,
      }];
    }

    const base = transferMethod ? [{
      key: 'bank_transfer' as const,
      title: 'Transferencia Bancaria',
      desc: 'Sin comisiones • Acreditación manual',
      accent: 'from-emerald-600 to-emerald-900',
      badge: null,
      Icon: Landmark,
    }] : [];

    return hasMP
      ? [{
        key: 'mercadopago' as const,
        title: 'Mercado Pago',
        desc: 'Tarjeta o saldo en tu cuenta MP. Acreditación instantánea.',
        accent: 'from-blue-600 to-blue-900',
        badge: 'Recomendado',
        Icon: CreditCard,
      }, ...base]
      : base;
  }, [hasMP, isFree, transferMethod]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);

  const defaultSelected: CardKey = isFree ? 'free' : (hasMP ? 'mercadopago' : 'bank_transfer');
  const [selected, setSelected] = useState<CardKey>(purchaseData.paymentMethod ?? defaultSelected);

  useEffect(() => {
    // Sincroniza estado interno cuando cambia el total o la config del evento
    const next = isFree ? 'free' : (hasMP ? 'mercadopago' : 'bank_transfer');
    setSelected(prev => {
      if (prev === 'mercadopago' && !hasMP) return 'bank_transfer';
      if (isFree) return 'free';
      return prev ?? next;
    });
  }, [isFree, hasMP]);

  useEffect(() => {
    // Propaga método elegido hacia arriba si no coincide
    if (selected !== purchaseData.paymentMethod) {
      onUpdatePaymentMethod(selected);
    }
  }, [selected, onUpdatePaymentMethod, purchaseData.paymentMethod]);

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

  const totalDisplay = selected === 'mercadopago' ? subtotal + mpFee : subtotal;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpdatePurchaseFile(file);
  };

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

      {/* Carousel de métodos */}
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
                aria-pressed={active}
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

      {/* Resumen */}
      <div className={cn("relative rounded-xl p-4", "border border-white/10 bg-white/[0.03]")}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Subtotal</span>
          <span className="text-sm font-bold text-white">{formatPrice(subtotal)}</span>
        </div>

        {selected === 'mercadopago' && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-red-400">Comisión MP (8.24%)</span>
            <span className="font-semibold text-red-400">+ {formatPrice(mpFee)}</span>
          </div>
        )}

        <div className="mt-2 border-t border-white/10 pt-2 flex items-center justify-between">
          <span className="text-base text-zinc-200">Total</span>
          <span className="text-xl font-extrabold text-white">{formatPrice(totalDisplay)}</span>
        </div>
      </div>

      {/* Detalles transferencia + comprobante */}
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

      {error && <p className="text-sm text-rose-400">{error}</p>}
    </motion.div>
  );
};