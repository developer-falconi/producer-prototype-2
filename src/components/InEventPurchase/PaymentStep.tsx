import { useMemo, useRef, useState, UIEvent } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CreditCard, DollarSign, ShieldCheck, Zap } from "lucide-react";

export default function PaymentStep({
  hasMP,
  subtotal,
  onPaymentMethodSelected,
}: {
  hasMP: boolean;
  subtotal: number;
  onPaymentMethodSelected: (method: "mercadopago" | "cash") => void;
}) {
  const [selected, setSelected] = useState<"mercadopago" | "cash">(hasMP ? "mercadopago" : "cash");
  const [page, setPage] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const cards = useMemo(() => {
    const base = [
      {
        key: "cash" as const,
        title: "Efectivo",
        icon: DollarSign,
        desc: "Pagás en la barra al retirar.",
        accent: "from-green-600 to-green-900",
        border: "border-emerald-500",
        badge: null,
      },
    ];
    return hasMP
      ? [
          {
            key: "mercadopago" as const,
            title: "Mercado Pago",
            icon: CreditCard,
            desc: "Tarjeta o saldo en tu cuenta MP.",
            accent: "from-blue-600 to-blue-900",
            border: "border-blue-500",
            badge: "Recomendado",
          },
          ...base,
        ]
      : base;
  }, [hasMP]);

  const idxOf = (k: "mercadopago" | "cash") => cards.findIndex((c) => c.key === k);

  const pick = (m: "mercadopago" | "cash") => {
    setSelected(m);
    onPaymentMethodSelected(m);
    const i = idxOf(m);
    if (trackRef.current) {
      const el = trackRef.current.children[i] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const childWidth = (el.firstElementChild as HTMLElement)?.clientWidth ?? 1;
    const gap = parseFloat(getComputedStyle(el).columnGap || "12");
    const approxIndex = Math.round(el.scrollLeft / (childWidth + gap));
    setPage(Math.max(0, Math.min(cards.length - 1, approxIndex)));
  };

  return (
    <div
      className={cn(
        "relative px-4 space-y-4 mx-auto rounded-2xl",
        "overflow-x-hidden h-full",
      )}
    >
      {/* Glows sutiles */}
      <div className="pointer-events-none absolute -top-20 -right-16 h-20 w-48 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-10 h-20 w-56 rounded-full bg-fuchsia-600/10 blur-3xl" />

      <header className="relative z-10 text-center space-y-1">
        <h2 className="text-xl font-extrabold text-white">Elegí cómo pagar</h2>
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Pago seguro • Confirmás antes de emitir tu QR
        </p>
      </header>

      {/* Carousel */}
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
          {cards.map((c, i) => {
            const Icon = c.icon;
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
                  "min-w-[80%] snap-center transition-all relative",
                  "rounded-2xl overflow-hidden",
                  active ? c.border : "border-none",
                  active ? "bg-white/5" : "bg-white/[0.03]"
                )}
              >
                {/* Accento superior */}
                <div
                  className={cn(
                    "h-1 w-full",
                    "bg-gradient-to-r",
                    active ? c.accent : "from-white/10 to-white/5"
                  )}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full",
                        "bg-gradient-to-r",
                        c.accent
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 text-white" />
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

                  {/* beneficios cortos */}
                  {c.key === "mercadopago" && (
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

        {/* Dots indicadores */}
        {cards.length > 1 && (
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

      {/* Resumen compacto */}
      <div
        className={cn(
          "relative rounded-xl p-4",
          "border border-white/10 bg-white/[0.03]"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Subtotal</span>
          <span className="text-sm font-bold text-white">{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-2 border-t border-white/10 pt-2 flex items-center justify-between">
          <span className="text-base text-zinc-200">Total</span>
          <span className="text-xl font-extrabold text-white">{formatPrice(subtotal)}</span>
        </div>
      </div>

      {/* Hint de acción siguiente */}
      <p className="text-center text-[11px] text-zinc-400">
        Deslizá para ver opciones • Tocá una tarjeta para seleccionar
      </p>
    </div>
  );
}