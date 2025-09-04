import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import {
  Check,
  X,
  ClipboardCopy,
  Sparkles,
  Share2,
  Mail,
  Ticket,
  ShoppingCart,
  Boxes,
} from "lucide-react";
import { PurchaseData } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

interface PurchaseStatusProps {
  purchaseData: PurchaseData;
  total: number;
  status: { status: "success" | "error"; message: string } | null;
  onResetAndClose: () => void;
}

export const PurchaseStatus: React.FC<PurchaseStatusProps> = ({
  purchaseData,
  total,
  status,
  onResetAndClose,
}) => {
  const isSuccess = status?.status === "success";

  const title = isSuccess ? "¡Pedido cargado con éxito!" : "No pudimos completar tu compra";
  const helper = isSuccess
    ? "Te enviaremos un email con tus accesos y/o productos cuando el pago esté confirmado."
    : status?.message || "Hubo un problema al procesar tu compra. Probá de nuevo o contactá soporte.";

  const ticketsCount = purchaseData.ticketQuantity ?? 0;
  const prodCount = purchaseData.products?.length ?? 0;
  const comboCount = purchaseData.combos?.length ?? 0;

  const totalText = total === 0 ? "Liberado" : formatPrice(total);
  const email = purchaseData.email;

  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!(navigator as any).share);
  }, []);

  const shareText = useMemo(() => {
    const parts = [
      "Pedido confirmado ✅",
      ticketsCount ? `Entradas: ${ticketsCount}` : "",
      prodCount ? `Productos: ${prodCount}` : "",
      comboCount ? `Combos: ${comboCount}` : "",
      `Total: ${totalText}`,
    ].filter(Boolean);
    return parts.join(" • ");
  }, [ticketsCount, prodCount, comboCount, totalText]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  };

  const shareSummary = async () => {
    try {
      if (!canShare) return;
      await (navigator as any).share({
        title: "Resumen de compra",
        text: shareText,
      });
    } catch { }
  };

  const method = (purchaseData as any).paymentMethod as "mercadopago" | "bank_transfer" | "free" | undefined;
  const isMP = method === "mercadopago";
  const isTransfer = method === "bank_transfer";
  const isFree = method === "free" || total === 0;

  return (
    <motion.div
      className="relative h-full w-full flex flex-col items-center justify-center text-center p-6 overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {/* Glows decorativos */}
      <div
        className={cn(
          "pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl",
          isSuccess ? "bg-emerald-500/10" : "bg-rose-600/10"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full blur-3xl",
          isSuccess ? "bg-fuchsia-600/10" : "bg-orange-600/10"
        )}
      />

      {/* Icono principal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
        className={cn(
          "mb-4 grid place-items-center rounded-full border h-20 w-20",
          isSuccess
            ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-400"
            : "bg-rose-500/15 border-rose-400/30 text-rose-400"
        )}
      >
        {isSuccess ? <Check className="h-10 w-10" /> : <X className="h-10 w-10" />}
      </motion.div>

      {/* Título */}
      <motion.h2
        className="text-2xl font-extrabold tracking-tight text-white"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        {title}
      </motion.h2>

      {/* Pill resumen / acciones */}
      <motion.div
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <span className="text-sm text-zinc-300">Total:</span>
        <span className="font-mono text-sm font-semibold text-white">{totalText}</span>
        {isSuccess && (
          <>
            <button
              onClick={copySummary}
              className={cn(
                "ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] border",
                "hover:brightness-110",
                isSuccess
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                  : "bg-rose-500/15 text-rose-300 border-rose-400/30"
              )}
              aria-label="Copiar resumen"
            >
              {copied ? <Sparkles className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            {canShare && (
              <button
                onClick={shareSummary}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] border",
                  "hover:brightness-110",
                  isSuccess
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                    : "bg-rose-500/15 text-rose-300 border-rose-400/30"
                )}
                aria-label="Compartir resumen"
              >
                <Share2 className="h-3.5 w-3.5" />
                Compartir
              </button>
            )}
          </>
        )}
      </motion.div>

      {/* Mensaje guía */}
      <motion.p
        className="mt-4 max-w-md text-sm text-zinc-300 whitespace-pre-line"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        {helper}
      </motion.p>

      {/* Tarjeta con resumen + próximos pasos */}
      {
        isSuccess && (
          <motion.div
            className="mt-6 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-white">Resumen</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-[13px] text-zinc-300">
              <li className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-indigo-400" /> {ticketsCount} entrada
                {ticketsCount !== 1 ? "s" : ""}
              </li>
              <li className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-fuchsia-400" /> {prodCount} producto
                {prodCount !== 1 ? "s" : ""}
              </li>
              <li className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-amber-400" /> {comboCount} combo
                {comboCount !== 1 ? "s" : ""}
              </li>
              {email && (
                <li className="col-span-2 flex items-center gap-2 truncate">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  <span className="truncate">{email}</span>
                </li>
              )}
            </ul>

            <div className="mt-4 border-t border-white/10 pt-3">
              <h4 className="text-sm font-semibold text-white">¿Qué sigue?</h4>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-[13px] text-zinc-400">
                {isFree ? (
                  <>
                    <li>Tu compra es liberada. Te enviamos los accesos por email.</li>
                    <li>Revisá spam/promociones si no lo ves en tu bandeja.</li>
                  </>
                ) : isMP ? (
                  <>
                    <li>Pagás con Mercado Pago. La acreditación es automática.</li>
                    <li>Vas a recibir un email con los QR/indicaciones al instante.</li>
                  </>
                ) : isTransfer ? (
                  <>
                    <li>Transferí el importe a la cuenta indicada y subí el comprobante.</li>
                    <li>Validamos el pago y te enviamos los QR por email.</li>
                  </>
                ) : (
                  <>
                    <li>Seguimos el estado de tu pago y te avisamos por email.</li>
                  </>
                )}
              </ul>
            </div>
          </motion.div>
        )
      }

      {/* CTA principal */}
      <motion.div
        className="mt-6 w-full max-w-md"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
      >
        <Button
          onClick={onResetAndClose}
          className={cn(
            "w-full h-11 text-white font-semibold rounded-xl",
            isSuccess
              ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:brightness-110"
              : "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:brightness-110"
          )}
        >
          {isSuccess ? "Listo" : "Cerrar"}
        </Button>
      </motion.div>

      {/* Confetti (opcional, solo éxito) */}
      {isSuccess && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-emerald-400/80 animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}vh`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};