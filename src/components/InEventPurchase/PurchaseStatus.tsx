"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Check, CheckCircle, CheckCircle2, Circle, CircleDot, ClipboardCheck, ClipboardCopy, Info, Loader2, PackageCheck, PartyPopper, QrCode, RefreshCw, Share2, Soup, Sparkles, XCircle } from "lucide-react";
import { cn, formatPrice, generateQrCode } from "@/lib/utils";
import { LiveOrderStateEnum, LiveOrderStatusDto } from "@/lib/types";
import React from "react";

const STEP_ICONS: Record<LiveOrderStateEnum, React.ReactNode> = {
  PENDING: <ClipboardCheck className="h-4 w-4" />,
  CONFIRMED: <CheckCircle2 className="h-4 w-4 animate-ping" />,
  PREPARING: <Soup className="h-4 w-4 animate-pulse" />,
  READY: <QrCode className="h-4 w-4 animate-bounce" />,
  DELIVERED: <PackageCheck className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4 animate-pulse" />,
};

const STATUS_VISUALS: Record<LiveOrderStateEnum, { icon: React.ReactNode; classes: string }> = {
  PENDING: {
    icon: <Loader2 className="h-16 w-16 animate-spin" />,
    classes: "text-zinc-400",
  },
  CONFIRMED: {
    icon: <CheckCircle className="h-16 w-16 animate-ping" />,
    classes: "text-blue-400",
  },
  PREPARING: {
    icon: <Soup className="h-16 w-16 animate-pulse" />,
    classes: "text-amber-400",
  },
  READY: {
    icon: <QrCode className="h-16 w-16 animate-bounce" />,
    classes: "text-emerald-400",
  },
  DELIVERED: {
    icon: <PartyPopper className="h-16 w-16 animate-pulse" />,
    classes: "text-emerald-400",
  },
  CANCELLED: {
    icon: <XCircle className="h-16 w-16 animate-pulse" />,
    classes: "text-rose-500",
  },
};

const STATUS_STEPS: { state: LiveOrderStateEnum; title: string; helper: string }[] = [
  { state: LiveOrderStateEnum.PENDING, title: "Pedido recibido", helper: "Estamos registrando tu pedido" },
  { state: LiveOrderStateEnum.CONFIRMED, title: "Confirmado", helper: "El bar aceptó la orden" },
  { state: LiveOrderStateEnum.PREPARING, title: "Preparando", helper: "El staff está preparando tu pedido" },
  { state: LiveOrderStateEnum.READY, title: "Listo para retirar", helper: "Acercate con tu QR" },
  { state: LiveOrderStateEnum.DELIVERED, title: "Entregado", helper: "¡Disfrutalo!" },
];

const STATE_COPY: Record<LiveOrderStateEnum, { title: string; description: string }> = {
  PENDING: {
    title: "Pedido recibido",
    description: "Guardamos tus datos y estamos esperando que el staff confirme tu orden.",
  },
  CONFIRMED: {
    title: "Pedido confirmado",
    description: "El staff aceptó tu pedido y pronto lo vas a ver en preparación.",
  },
  PREPARING: {
    title: "Estamos preparando tu pedido",
    description: "Ya está en la barra. Te avisaremos apenas esté listo para retirar.",
  },
  READY: {
    title: "¡Tu pedido está listo!",
    description: "Acercate a la barra mostrando tu QR para retirarlo.",
  },
  DELIVERED: {
    title: "Pedido entregado",
    description: "Esperamos que lo disfrutes. Podés cerrar este seguimiento cuando quieras.",
  },
  CANCELLED: {
    title: "Pedido cancelado",
    description: "El staff canceló este pedido. Si necesitás ayuda hablá con la barra.",
  },
};

interface PurchaseStatusProps {
  purchaseCode: string | null;
  pendingOrder: LiveOrderStatusDto | null;
  onClose: () => void;
  onClearOrder: () => void;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export default function PurchaseStatus({
  purchaseCode,
  pendingOrder,
  onClose,
  onClearOrder,
  errorMessage,
  onRetry,
}: PurchaseStatusProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const order = pendingOrder;

  const currentState: LiveOrderStateEnum = order?.status ?? LiveOrderStateEnum.PENDING;
  const statusCopy = STATE_COPY[currentState];
  const visual = STATUS_VISUALS[currentState];
  const isErrorState = Boolean(errorMessage);
  const displayTitle = isErrorState ? "No pudimos registrar tu pedido" : statusCopy?.title;
  const displayDescription = errorMessage ?? statusCopy?.description;

  const codeString = purchaseCode || order?.pickupCode || "—";
  const qrValue = useMemo(() => order?.qrCode || order?.pickupCode || (codeString !== "—" ? codeString : null), [order, codeString]);
  const totalAmount = order?.total ?? null;
  const lastUpdate = order?.updatedAt
    ? new Date(order.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const stateIndex = STATUS_STEPS.findIndex((step) => step.state === currentState);
  const activeIndex = (currentState === "DELIVERED" || currentState === "CANCELLED") ? STATUS_STEPS.length : stateIndex;

  const isDanger = currentState === "CANCELLED";
  const isDelivered = currentState === "DELIVERED";
  const isPending = currentState === "PENDING";
  const canMarkAsDone = Boolean(pendingOrder);
  const isFinal = isDelivered || isDanger;

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!(navigator as any).share);
  }, []);

  useEffect(() => {
    if (!qrValue || currentState !== "READY") {
      setQrSrc(null);
      return;
    }
    let alive = true;
    setLoadingQr(true);
    setQrError(null);
    generateQrCode(qrValue)
      .then((dataUrl) => {
        if (alive) setQrSrc(dataUrl);
      })
      .catch(() => {
        if (alive) setQrError("No pudimos generar el QR. Reintentá más tarde.");
      })
      .finally(() => {
        if (alive) setLoadingQr(false);
      });

    return () => {
      alive = false;
    };
  }, [qrValue, currentState]);

  const reloadQr = async () => {
    if (!qrValue || currentState !== "READY") return;
    setLoadingQr(true);
    setQrError(null);
    try {
      const dataUrl = await generateQrCode(qrValue);
      setQrSrc(dataUrl);
    } catch {
      setQrError("No pudimos generar el QR. Reintentá más tarde.");
    } finally {
      setLoadingQr(false);
    }
  };

  const copyCode = async () => {
    if (!codeString || codeString === "—") return;
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  };

  const shareCode = async () => {
    if (!canShare || !codeString || codeString === "—") return;
    try {
      await navigator.share({
        title: "Mi pedido en la barra",
        text: `Pedido ${codeString} - ${totalAmount ? formatPrice(totalAmount) : ""}`,
      });
    } catch { }
  };

  return (
    <motion.div
      className="relative flex-1 h-full min-h-full w-full flex flex-col items-center justify-between text-center p-6 overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative z-10 text-center">
        <motion.h2
          className={cn(
            "text-xl font-extrabold tracking-tight text-white mb-4",
            isDanger
              ? "text-rose-200"
              : isDelivered
                ? "text-emerald-200"
                : "text-amber-100"
          )}
        >
          {displayTitle}
        </motion.h2>
        {displayDescription && (
          <motion.div
            className={cn(
              "mx-auto my-4 flex max-w-sm items-center gap-2 rounded-2xl px-4 py-2 text-sm",
              isErrorState ? "text-rose-200 border border-rose-500/60 bg-rose-500/10" : "text-zinc-300"
            )}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <Info className="h-4 w-4" />
            <span>{displayDescription}</span>
          </motion.div>
        )}
      </div>

      {!isErrorState && (
        <div className="relative z-10 grid gap-6 lg:grid-cols-2 w-full min-w-0 mt-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 min-w-0 lg:overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-xs text-zinc-400">Código de pedido</span>
                <span className="font-mono text-lg text-white">{codeString}</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2">
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white border border-white/15 hover:bg-white/15"
                >
                  {copied ? <Sparkles className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                {canShare && (
                  <button
                    onClick={shareCode}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white border border-white/15 hover:bg-white/15"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Compartir
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-black/30 border border-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">
                    Total: {' '}
                    {totalAmount !== null ? formatPrice(totalAmount) : "Calculando..."}
                  </p>
                </div>
                {lastUpdate && <p className="text-xs text-zinc-400">Actualizado {lastUpdate}</p>}
              </div>
            </div>

            <div className="rounded-xl bg-black/30 border border-white/5 p-4">
              <ol className="relative space-y-4">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = activeIndex > idx;
                  const isActive = activeIndex === idx;

                  return (
                    <li key={step.state} className="relative flex items-start gap-3">
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-3.5 top-9 -bottom-4 w-px",
                            isCompleted ? "bg-emerald-400" : "bg-zinc-700",
                            isDanger && 'bg-red-500/20'
                          )}
                          aria-hidden="true"
                        />
                      )}

                      {/* Icono del paso */}
                      <div
                        className={cn(
                          "relative z-10 h-7 w-7 rounded-full flex items-center justify-center",
                          isDanger && (isCompleted || isActive) ? "bg-rose-500/20 text-rose-300" :
                            isCompleted ? "bg-emerald-500/20 text-emerald-300" :
                              isActive ? "bg-blue-500/20 text-blue-300" :
                                "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> :
                          isActive ? (STEP_ICONS[step.state] || <CircleDot className="h-4 w-4 animate-pulse" />) :
                            <Circle className="h-4 w-4" />
                        }
                      </div>

                      {/* Texto del paso */}
                      <div>
                        <p className={cn(
                          "text-sm font-semibold",
                          isCompleted || isActive ? "text-white" : "text-zinc-400"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-zinc-500">{step.helper}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {currentState === "READY" && !isFinal && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center gap-4 min-w-0 lg:overflow-y-auto">
              <>
                <div className="w-full flex items-center justify-between text-xs text-zinc-400">
                  <span>Mostrá este QR en la barra</span>
                  {loadingQr && (
                    <span className="inline-flex items-center gap-1 text-emerald-200">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generando...
                    </span>
                  )}
                </div>

                <div
                  className="relative bg-white rounded-2xl shadow-xl w-full max-w-[260px] mx-auto min-h-[248px] flex items-center justify-center p-4"
                  aria-busy={loadingQr}
                >
                  {qrSrc && !qrError && (
                    <img src={qrSrc} alt="Código QR" className="w-[220px] h-[220px]" draggable={false} />
                  )}
                  {!qrSrc && !qrError && (
                    <div className="w-[220px] h-[220px] rounded bg-zinc-200 relative overflow-hidden">
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200" />
                    </div>
                  )}
                  {qrError && (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="text-sm text-rose-400">{qrError}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white"
                        onClick={reloadQr}
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Reintentar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[260px] mx-auto">
                  {qrSrc && (
                    <a href={qrSrc} download={`pedido-${codeString}.png`} className="w-full">
                      <Button className="w-full bg-blue-800 hover:bg-blue-800/80 text-white">Descargar QR</Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-white/20 hover:bg-gray-300"
                    onClick={copyCode}
                  >
                    {copied ? "Copiado" : "Copiar código"}
                  </Button>
                </div>
              </>

              {currentState !== "READY" && !isFinal && (
                <div className={cn("flex flex-col items-center justify-center text-center gap-4 p-8", visual.classes)}>
                  {visual.icon}
                  <p className="text-sm text-zinc-400 max-w-xs">
                    {isFinal
                      ? "Ya no necesitás el QR para este pedido."
                      : "Tu QR aparecerá acá apenas el pedido esté listo para retirar."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 flex gap-3 w-full max-w-xl mx-auto mt-8">
        {errorMessage && onRetry && !isFinal && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full h-11 font-semibold rounded-xl"
          >
            Reintentar
          </Button>
        )}
        {!isFinal && (
          <Button
            onClick={onClose}
            className={cn(
              "w-full h-11 text-white font-semibold rounded-xl",
              isDelivered
                ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:brightness-110"
                : "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:brightness-110"
            )}
          >
            Cerrar
          </Button>
        )}

        {!isPending && (
          <Button
            variant="ghost"
            className={cn(
              "w-full h-11 border border-white/10 text-white",
              "hover:bg-white/10 inline-flex items-center gap-2",
              isFinal && 'bg-red-700'
            )}
            onClick={onClearOrder}
            disabled={!canMarkAsDone}
          >
            {isFinal ? "Cerrar seguimiento" : "Ya retiré mi pedido"}
            {isFinal ? <XCircle className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

