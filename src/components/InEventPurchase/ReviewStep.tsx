import { formatPrice } from "@/lib/utils";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { User, Mail, CreditCard, ShoppingCart, AlertCircle, BadgePercent } from "lucide-react";
import { EventDto, InEventPurchaseData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useProducer } from "@/context/ProducerContext";
import { useTracking } from "@/hooks/use-tracking";
import { useEffect } from "react";

export default function ReviewStep({
  eventData,
  purchaseData,
  couponId,
}: {
  eventData: EventDto;
  purchaseData: InEventPurchaseData;
  couponId?: number | null;
}) {
  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: "live" });

  const { buyer, products, combos, experiences = [], total, paymentMethod } = purchaseData;

  const { subtotal, discountTotal } = calcTotals(products, combos, experiences);
  const allItems = [
    ...products.map(p => ({
      key: `p-${p.product.id}`,
      name: p.product.product.name,
      qty: p.quantity,
      unit: Number(p.product.price),
      discountPct: Number(p.product.discountPercentage) || 0,
      line: Number(p.product.price) * p.quantity * (1 - (Number(p.product.discountPercentage) || 0) / 100),
    })),
    ...combos.map(c => ({
      key: `c-${c.combo.id}`,
      name: c.combo.name,
      qty: c.quantity,
      unit: Number(c.combo.price),
      discountPct: 0,
      line: Number(c.combo.price) * c.quantity,
    })),
    ...experiences.map(exp => ({
      key: `e-${exp.experience.id}`,
      name: exp.experience.name ?? "Experiencia",
      qty: exp.quantity,
      unit: Number(exp.experience.price),
      discountPct: 0,
      line: Number(exp.experience.price) * exp.quantity,
    })),
  ].filter(i => i.qty > 0);

  useEffect(() => {
    if (!eventData) return;

    const items = [
      ...products.map(p => ({ product: p.product, qty: p.quantity })),
      ...combos.map(c => ({ combo: c.combo, qty: c.quantity })),
    ];

    tracking.viewCart(eventData, items, {
      value: Number(total || 0),
      coupon: String(couponId) ?? undefined,
    });
  }, [eventData, products, combos, total, couponId, tracking]);

  return (
    <div
      className={cn(
        "relative px-4 sm:px-10 pb-4 space-y-2 max-w-3xl mx-auto overflow-x-hidden"
      )}
    >
      {/* Glows sutiles */}
      <div className="pointer-events-none absolute -top-20 -right-16 h-20 w-48 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-10 h-20 w-56 rounded-full bg-fuchsia-600/10 blur-3xl" />

      <h2 className="text-xl font-extrabold text-center text-white">Revisá tu compra</h2>

      {/* Datos del comprador */}
      <Card className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-white">Datos del Comprador</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <InfoRow icon={<User className="text-zinc-400 h-4 w-4" />} label="Nombre" value={buyer.fullName} />
          <InfoRow icon={<CreditCard className="text-zinc-400 h-4 w-4" />} label="Documento" value={buyer.docNumber} />
          <InfoRow icon={<Mail className="text-zinc-400 h-4 w-4" />} label="Email" value={buyer.email} />
        </div>
        {paymentMethod && (
          <div className="mt-1 text-xs text-zinc-400">
            Método de pago seleccionado:{" "}
            <span className="font-medium text-zinc-200">
              {paymentMethod === "mercadopago" ? "Mercado Pago" : "Efectivo"}
            </span>
          </div>
        )}
      </Card>

      {/* Ítems */}
      <Card className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-zinc-300">
          <ShoppingCart className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-white">Tu Pedido</h3>
        </div>

        {allItems.length === 0 ? (
          <div className="text-center text-zinc-400 py-6">No hay ítems seleccionados.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {allItems.map((it) => (
              <div
                key={it.key}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white line-clamp-1">
                    {it.qty} × {it.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>Unitario: {formatPrice(it.unit)}</span>
                    {it.discountPct > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-pink-500/40 bg-pink-600/15 px-1.5 py-[1px] text-pink-300">
                        <BadgePercent className="h-3 w-3" />
                        -{it.discountPct}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-white">{formatPrice(it.line)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Breakdown */}
        <Separator className="my-4 bg-white/10" />
        <div className="space-y-1.5">
          <Row label="Subtotal" value={formatPrice(subtotal)} muted />
          {discountTotal > 0 && (
            <Row
              label="Descuentos"
              value={`- ${formatPrice(discountTotal)}`}
              accent="text-emerald-300"
            />
          )}
          <Separator className="my-2 bg-white/10" />
          <Row label="Total" value={formatPrice(total)} strong />
        </div>
      </Card>

      {/* Estado MP */}
      {paymentMethod === 'mercadopago' && (
        <div className="flex items-start p-4 rounded-2xl border border-blue-500/30 bg-blue-600/10 text-blue-200 text-sm">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <span>
            ¡Tu link de pago ya está listo! Tocá <strong className="text-white">“Pagar con Mercado Pago”</strong> abajo
            y luego volvé para confirmar y emitir tu QR.
          </span>
        </div>
      )}
      {paymentMethod === 'cash' && (
        <div className="flex items-start p-4 rounded-2xl border border-blue-500/30 bg-blue-600/10 text-blue-200 text-sm">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <span>
            Tocá <strong className="text-white">“Confirmar Compra”</strong> y acercate a la barra para abonar y retirar
          </span>
        </div>
      )}
    </div>
  );
}

function calcTotals(
  products: InEventPurchaseData["products"],
  combos: InEventPurchaseData["combos"],
  experiences: InEventPurchaseData["experiences"]
) {
  let subtotal = 0;
  let discountTotal = 0;

  for (const p of products) {
    const price = Number(p.product.price);
    const pct = Number(p.product.discountPercentage) || 0;
    const unitAfter = price * (1 - pct / 100);
    subtotal += unitAfter * p.quantity;
    discountTotal += (price - unitAfter) * p.quantity;
  }
  for (const c of combos) {
    const price = Number(c.combo.price);
    subtotal += price * c.quantity;
  }
  for (const e of experiences) {
    const price = Number(e.experience.price) || 0;
    subtotal += price * e.quantity;
  }
  return { subtotal, discountTotal };
}

function Row({
  label,
  value,
  strong,
  muted,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", muted ? "text-zinc-400" : "text-zinc-200")}>{label}</span>
      <span
        className={cn(
          strong ? "text-xl font-extrabold text-white" : "text-sm font-semibold text-zinc-100",
          accent
        )}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center rounded-lg p-2">
      {icon}
      <div className="min-w-0 ml-3">
        <div className="text-xs tracking-widest text-zinc-400">{label}</div>
        <div className="text-sm text-white font-medium break-words">{value || "—"}</div>
      </div>
    </div>
  );
}


