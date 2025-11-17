import { cn, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Percent, AlertTriangle } from "lucide-react";
import { useId } from "react";
import OptimizedImage from "@/components/OptimizedImage";

const PRIMARY = "#001B97";

export default function ItemCard({
  title,
  description,
  price,
  stock,
  qty,
  imageUrl,
  originalPrice,
  onInc,
  onDec,
  onSet,
}: {
  title: string;
  description?: string;
  price: number;
  stock: number;
  qty: number;
  imageUrl?: string;
  originalPrice?: number;
  onInc: () => void;
  onDec: () => void;
  onSet: (q: number) => void;
}) {
  const soldOut = stock <= 0;
  const lowStock = !soldOut && stock <= 5;
  const hasDiscount = !!originalPrice && originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
    : 0;

  const qtyInputId = useId();

  const handleQtyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.value.replace(/\D/g, "");
    onSet(Math.max(0, Number(n || "0")));
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900",
        "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]",
        soldOut && "opacity-60"
      )}
    >
      {/* Overlay sold out a nivel card (cubre todo, con/ sin imagen) */}
      {soldOut && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/40 backdrop-blur-[1px]">
          <span className="rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white">
            AGOTADO
          </span>
        </div>
      )}

      {/* Media / Header compacto para combos sin imagen */}
      {imageUrl && (
        <div className="relative h-28 w-full overflow-hidden bg-zinc-900">
          <OptimizedImage
            src={imageUrl}
            alt={title}
            transformOptions={{ width: 600, height: 400, crop: "fit", gravity: "auto", quality: "auto" }}
            wrapperClassName="absolute inset-0"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            draggable={false}
            fallbackSrc="https://via.placeholder.com/600x400?text=Item"
          />
          {/* Badges */}
          <Badges
            hasDiscount={hasDiscount}
            discountPct={discountPct}
            lowStock={lowStock}
            stock={stock}
          />
        </div>
      )}

      <CardContent className="p-3 space-y-3">
        {/* Título + descripción */}
        <div className="space-y-1">
          <div className="line-clamp-1 text-sm font-semibold text-white">
            {title}
          </div>
          {description && (
            <div className="line-clamp-3 text-xs leading-snug text-zinc-400">
              {description}
            </div>
          )}
        </div>

        {/* Precios modernos */}
        <div className="relative flex items-baseline justify-end">
          {hasDiscount && (
            <span className="absolute -top-2 left-0 text-xs line-through text-red-700">
              {formatPrice(originalPrice!)}
            </span>
          )}
          <span
            className="text-lg font-bold text-white"
          >
            {formatPrice(price)}
          </span>
        </div>

        {/* Controles */}
        <div className="mt-2">
          {qty === 0 ? (
            <Button
              onClick={onInc}
              disabled={soldOut}
              className={cn(
                "h-10 w-full text-white font-semibold",
                "hover:brightness-[1.07] active:brightness-110",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
              style={{ backgroundColor: PRIMARY }}
              aria-label={`Agregar ${title} al carrito`}
            >
              Agregar
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                className="h-8 w-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white"
                onClick={onDec}
                disabled={qty === 0 || soldOut}
                aria-label="Disminuir cantidad"
              >
                –
              </Button>

              <label
                htmlFor={qtyInputId}
                className={cn(
                  "flex items-center justify-center rounded-lg border border-white/10 bg-zinc-900 px-1",
                  "focus-within:ring-2",
                )}
                style={{ boxShadow: "none", outline: "none" }}
              >
                <input
                  id={qtyInputId}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qty}
                  onChange={handleQtyInput}
                  className={cn(
                    "h-8 w-12 text-center text-white bg-transparent",
                    "border-0 outline-none focus:outline-none focus-visible:outline-none",
                    "ring-0 ring-offset-0 focus:ring-0 focus-visible:ring-0"
                  )}
                  aria-label="Cantidad"
                />
              </label>

              <Button
                variant="ghost"
                className="h-8 w-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white"
                onClick={onInc}
                disabled={soldOut}
                aria-label="Aumentar cantidad"
              >
                +
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Badges({
  hasDiscount,
  discountPct,
  lowStock,
  stock,
}: {
  hasDiscount: boolean;
  discountPct: number;
  lowStock: boolean;
  stock: number;
}) {
  return (
    <div className="absolute top-2 left-2 flex gap-2 z-10">
      {hasDiscount && (
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-600 text-white"
          title="Descuento aplicado"
        >
          <span>-{discountPct}</span>
          <Percent className="h-3 w-3" />
        </span>
      )}
      {lowStock && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[11px]"
          title="Pocas unidades"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {stock} disp.
        </span>
      )}
    </div>
  );
}