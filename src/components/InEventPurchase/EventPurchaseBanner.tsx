import { Sparkles, BadgePercent, ShieldCheck, ShoppingBag } from "lucide-react";

export default function EventPurchaseBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-black via-[#4c0017] to-red-700 p-6 m-6">
      <div className="relative">
        {/* Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">
          <Sparkles className="h-3.5 w-3.5" />
          Compra directa con QR
        </div>

        {/* Title + subtitle */}
        <div className="mt-4 max-w-3xl">
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            ¡Evita las filas! Compra y retira con tu <span className="text-red-600">QR directo</span>
          </h3>
          <p className="mt-2 text-slate-200 text-sm sm:text-base">
            Ahorra tiempo comprando durante el evento. Solo escanea el código QR y ¡listo! Recoge tus productos sin colas.
          </p>
        </div>

        {/* Features */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Feature
            icon={<BadgePercent className="h-5 w-5 text-red-600" />}
            title="Compra sin filas"
            desc="Evita el estrés y haz tu compra desde donde estés."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5 text-white" />}
            title="Sin complicaciones"
            desc="Compra, paga y retira todo desde tu móvil."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-3 flex items-start gap-4">
      <div className="text-white text-lg">{icon}</div>
      <div>
        <div className="text-white font-semibold text-sm">{title}</div>
        <div className="text-xs text-slate-300">{desc}</div>
      </div>
    </div>
  );
}
