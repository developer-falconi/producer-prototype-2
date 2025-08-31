import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ClipboardCopy, Check, Share2, Sparkles } from "lucide-react";

interface SuccessCashPaymentStepProps {
  purchaseCode: number;
  onClose: () => void;
}

export default function PurchaseStatus({ purchaseCode, onClose }: SuccessCashPaymentStepProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!(navigator as any).share);
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(String(purchaseCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <motion.div
      className="relative h-full w-full flex flex-col items-center justify-center text-center p-6 overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {/* Glows decorativos */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />

      {/* Icono de éxito */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
        className="mb-4 grid place-items-center rounded-full bg-emerald-500/15 border border-emerald-400/30 h-20 w-20 text-emerald-400"
      >
        <Check className="h-10 w-10" />
      </motion.div>

      <motion.h2
        className="text-2xl font-extrabold tracking-tight text-white"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        ¡Pedido cargado con éxito!
      </motion.h2>

      {/* Código de pedido como pill + copiar */}
      <motion.div
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <span className="text-sm text-zinc-300">Código:</span>
        <span className="font-mono text-sm font-semibold text-white">{purchaseCode}</span>
        <button
          onClick={copyCode}
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-300 border border-emerald-400/30 hover:brightness-110"
          aria-label="Copiar código"
        >
          {copied ? <Sparkles className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </motion.div>

      {/* Mensaje guía */}
      <motion.p
        className="mt-4 max-w-md text-sm text-zinc-300"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        Acercate a la <span className="font-semibold text-white">caja</span> para abonar en efectivo y retirar tu pedido.
      </motion.p>

      {/* Tarjeta con próximos pasos */}
      <motion.div
        className="mt-6 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-semibold text-white">¿Qué sigue?</h3>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-[13px] text-zinc-400">
          <li>Decile tu código al cajero/a para ubicar tu pedido.</li>
          <li>Pagás y te entregan el ticket de retiro.</li>
          <li>Conservá el ticket por cualquier consulta.</li>
        </ul>
      </motion.div>

      {/* CTA principal */}
      <motion.div
        className="mt-6 w-full max-w-md"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
      >
        <Button
          onClick={onClose}
          className="w-full h-11 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:brightness-110 text-white font-semibold rounded-xl"
        >
          Listo
        </Button>

        {/* CTA secundaria opcional (si querés llevar al catálogo otra vez, podés pasar un handler aparte) */}
        {/* <Button variant="ghost" className="mt-2 w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl">
          Seguir comprando
        </Button> */}
      </motion.div>
    </motion.div>
  );
}