import { Wallet } from "@mercadopago/sdk-react";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

export default function MercadoPagoButton({
  publicKey,
  preferenceId,
  loadingButton,
  setLoadingButton,
  onStartPayment
}: {
  publicKey: string;
  preferenceId: string;
  loadingButton: boolean;
  setLoadingButton: (b: boolean) => void;
  onStartPayment?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bricksRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let clickedOnce = false;

    const handlePreClickRedirect = () => {
      if (clickedOnce) return;
      clickedOnce = true;
      try { onStartPayment?.(); } catch { }
    }

    async function mount() {
      if (!window.MercadoPago || !preferenceId || !containerRef.current) return;
      try {
        const mp = new window.MercadoPago(publicKey, { locale: "es-AR" });
        bricksRef.current = mp.bricks();
        await bricksRef.current.create("wallet", "mp-wallet", {
          initialization: { redirectMode: 'self', preferenceId },
          customization: { theme: 'dark', valueProp: 'smart_option', customStyle: { hideValueProp: true } },
        });
        if (!cancelled) setLoadingButton(false);
      } catch {
        if (!cancelled) setLoadingButton(false);
      }
    }

    if (containerRef.current) containerRef.current.innerHTML = "";
    setLoadingButton(true);
    mount();

    const el = containerRef.current;
    el?.addEventListener("click", handlePreClickRedirect, { capture: true, once: true });

    return () => {
      cancelled = true;
      try {
        bricksRef.current?.unmount("mp-wallet");
      } catch { }
    };
  }, [publicKey, preferenceId, setLoadingButton]);

  return (
    <div className="w-full">
      <div
        id="mp-wallet"
        ref={containerRef}
        className="w-full rounded-lg bg-white/5 border border-white/10 p-0"
        aria-busy={loadingButton}
      />
      {/* Fallback si el Brick tarda o falla */}
      {loadingButton && (
        <div className="mt-2 text-center text-sm text-zinc-300">Cargando botón de Mercado Pago…</div>
      )}
    </div>
  );
}