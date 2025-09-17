import React, { useEffect, useMemo, useRef, useState } from "react";
import { Wallet, initMercadoPago } from "@mercadopago/sdk-react";
import { MpLocale } from "@/lib/types";

type Props = {
  mpPublicKey: string;
  preferenceId: string;
  loadingButton: boolean;
  setLoadingButton: (b: boolean) => void;
  onStartPayment: () => void | Promise<void>;
  locale?: MpLocale;
};

function MercadoPagoButton({
  mpPublicKey,
  preferenceId,
  loadingButton,
  setLoadingButton,
  onStartPayment,
  locale = "es-AR",
}: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const lastKeyRef = useRef<string | null>(null);
  const clickTsRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingButton(true);

      if (!mpPublicKey) {
        setLoadingButton(false);
        return;
      }

      const effectiveLocale = locale ?? "es-AR";

      if (lastKeyRef.current !== mpPublicKey) {
        try {
          initMercadoPago(mpPublicKey, { locale: effectiveLocale });
          if (cancelled) return;
          lastKeyRef.current = mpPublicKey;
          setSdkReady(true);
        } catch (err) {
          console.error("Error inicializando MercadoPago SDK:", err);
        } finally {
          if (!cancelled) {
            setLoadingButton(false);
          }
        }
      } else {
        setSdkReady(true);
        setLoadingButton(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mpPublicKey, locale, setLoadingButton]);

  const canRenderWallet = sdkReady && !!mpPublicKey && !!preferenceId && typeof window !== "undefined";

  const initialization = useMemo(() => ({
    preferenceId,
    redirectMode: "self"
  } as const), [preferenceId]);

  const customization = useMemo(() => ({
    theme: "dark",
    texts: { valueProp: "smart_option" },
    customStyle: { hideValueProp: true }
  } as const), []);

  return (
    <div className="w-full">
      <div className="w-full rounded-lg bg-white/5 border border-white/10 p-0" aria-busy={loadingButton || !sdkReady}>
        {canRenderWallet && (
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

      {(loadingButton || !sdkReady) && (
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