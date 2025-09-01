"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { formatPrice, generateQrCode } from "@/lib/utils";
import { ClipboardCopy, Share2, RefreshCw } from "lucide-react";

type QRStepProps = {
  total: number;
  qrValue: string;
  onClose: () => void;
};

export default function QRStep({ total, qrValue, onClose }: QRStepProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!(navigator as any).share);
  }, []);

  async function loadQr() {
    setLoading(true);
    setQrSrc(null);
    setError(null);
    try {
      const dataUrl = await generateQrCode(qrValue);
      setQrSrc(dataUrl);
    } catch {
      setError("No pudimos generar el QR. Reintentá más tarde.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setQrSrc(null);
      setError(null);
      try {
        const dataUrl = await generateQrCode(qrValue);
        if (alive) setQrSrc(dataUrl);
      } catch {
        if (alive) setError("No pudimos generar el QR. Reintentá más tarde.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [qrValue]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const shareCode = async () => {
    try {
      if (canShare) {
        await (navigator as any).share({
          title: "Código de compra",
          text: `Mi código de compra: ${qrValue}`,
        });
      }
    } catch {}
  };

  return (
    <div
      className="
        relative p-6 flex flex-col items-center gap-4 text-center
        rounded-2xl border border-white/10
        bg-gradient-to-b from-zinc-950 via-zinc-950 to-black
        overflow-hidden
      "
    >
      {/* Glows decorativos */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-fuchsia-600/10 blur-3xl" />

      <h3 className="relative z-10 text-2xl font-extrabold text-white">
        ¡Listo! Mostrá este QR en la barra
      </h3>

      {/* Tarjeta de QR */}
      <div
        className="
          relative bg-white rounded-2xl shadow-xl
          min-w-[248px] min-h-[248px] flex items-center justify-center p-4
        "
        aria-busy={loading}
      >
        {qrSrc && !error && (
          <img
            src={qrSrc}
            alt="Código QR"
            className="w-[220px] h-[220px] rounded"
            draggable={false}
          />
        )}

        {!qrSrc && !error && (
          <div className="w-[220px] h-[220px] rounded bg-zinc-200 relative overflow-hidden">
            {/* skeleton shimmer */}
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-red-600 text-sm">{error}</span>
            <Button
              onClick={loadQr}
              className="h-9 rounded-lg bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="text-zinc-300">
        Total abonado:{" "}
        <span className="font-semibold text-white">{formatPrice(total)}</span>
      </div>

      {/* Código + acciones */}
      <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
        <span className="text-xs text-zinc-300">Código:</span>
        <span className="font-mono text-sm font-semibold text-white">{qrValue}</span>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300 border border-emerald-400/30 hover:brightness-110"
          aria-label="Copiar código"
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          {copied ? "Copiado" : "Copiar"}
        </button>
        {canShare && (
          <button
            onClick={shareCode}
            className="inline-flex items-center gap-1 rounded-full bg-blue-600/15 px-2 py-0.5 text-[11px] text-blue-300 border border-blue-500/30 hover:brightness-110"
            aria-label="Compartir código"
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartir
          </button>
        )}
      </div>

      <div className="text-xs text-zinc-400">
        Guardá una captura por si perdés señal. También te lo enviamos por email.
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full justify-center">
        {qrSrc && (
          <a href={qrSrc} download="qr.png" className="w-full sm:w-auto">
            <Button
              className="
                w-full sm:w-auto
                bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600
                hover:brightness-110 text-white font-semibold
              "
            >
              Descargar PNG
            </Button>
          </a>
        )}
        <Button
          onClick={onClose}
          className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
}
