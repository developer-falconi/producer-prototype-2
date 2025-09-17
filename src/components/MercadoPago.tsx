import React, { useEffect, useMemo, useRef, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

type Props = {
  mpPublicKey: string;
  preferenceId: string;
  loadingButton: boolean;
  setLoadingButton: (b: boolean) => void;
  onStartPayment: () => void | Promise<void>;
  locale?: "es-AR" | "es-CL" | "es-CO" | "es-MX" | "es-VE" | "es-UY" | "es-PE" | "pt-BR" | "en-US";
};

function MercadoPagoButton({
  mpPublicKey,
  preferenceId,
  loadingButton,
  setLoadingButton,
  onStartPayment,
  locale = "es-AR",
}: Props) {
  const [ready, setReady] = useState(false);
  const lastInitKeyRef = useRef<string | null>(null);

  const clickTsRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingButton(true);
      if (!mpPublicKey) { setLoadingButton(false); return; }

      if (lastInitKeyRef.current !== mpPublicKey) {
        try { initMercadoPago(mpPublicKey, { locale }); } catch { }
        lastInitKeyRef.current = mpPublicKey;
      }

      if (!cancelled) { setReady(true); setLoadingButton(false); }
    })();
    return () => { cancelled = true; };
  }, [mpPublicKey, locale, setLoadingButton]);

  useEffect(() => {
    const handleNavStart = () => {
      if (firedRef.current) return;
      const ts = clickTsRef.current;
      if (!ts) return;
      if (Date.now() - ts > 15000) return;

      firedRef.current = true;
      onStartPayment();
    };

    window.addEventListener("pagehide", handleNavStart);
    window.addEventListener("unload", handleNavStart);
    return () => {
      window.removeEventListener("pagehide", handleNavStart);
      window.removeEventListener("unload", handleNavStart);
    };
  }, [onStartPayment]);

  const initialization = useMemo(
    () => ({ preferenceId, redirectMode: "self" } as const),
    [preferenceId]
  );

  const customization = useMemo(
    () => ({ theme: "dark", texts: { valueProp: "smart_option" }, customStyle: { hideValueProp: true } } as const),
    []
  );

  return (
    <div className="w-full">
      <div
        className="w-full rounded-lg bg-white/5 border border-white/10 p-0"
        aria-busy={loadingButton || !ready}
      >
        {ready && (
          <Wallet
            id="mp-wallet"
            key={preferenceId}
            locale={locale}
            initialization={initialization}
            customization={customization}
            onSubmit={async () => {
              clickTsRef.current = Date.now();
              firedRef.current = false;
            }}
            onReady={() => setLoadingButton(false)}
            onError={(err) => { console.error("MP Wallet error:", err); setLoadingButton(false); }}
          />
        )}
      </div>

      {(loadingButton || !ready) && (
        <div className="mt-2 text-center text-sm text-zinc-300">Cargando botón de Mercado Pago…</div>
      )}
    </div>
  );
}

export default React.memo(MercadoPagoButton, (prev, next) =>
  prev.mpPublicKey === next.mpPublicKey &&
  prev.preferenceId === next.preferenceId &&
  prev.locale === next.locale &&
  prev.loadingButton === next.loadingButton &&
  prev.setLoadingButton === next.setLoadingButton &&
  prev.onStartPayment === next.onStartPayment
);