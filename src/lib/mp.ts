// src/lib/mp.ts
import { initMercadoPago } from "@mercadopago/sdk-react";

declare global {
  interface Window {
    __MP_SDK__?: {
      key?: string;
      locale?: string;
      initialized?: boolean;
      initPromise?: Promise<void>;
    };
    MercadoPago?: any;
  }
}

// Pequeño helper de log con prefijo
const MP_LOG_PREFIX = "[MP:init]";
const log  = (...args: any[]) => console.log(MP_LOG_PREFIX, ...args);
const warn = (...args: any[]) => console.warn(MP_LOG_PREFIX, ...args);
const err  = (...args: any[]) => console.error(MP_LOG_PREFIX, ...args);

function teardownMpSdk() {
  log("→ Teardown solicitado: removiendo scripts y reseteando global…");
  try {
    const scripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[src*="mercadopago"]')
    );
    scripts.forEach((s) => {
      log("  ⋅ Remuevo script:", s.src);
      s.parentElement?.removeChild(s);
    });
  } catch (e) {
    err("  ⋅ Error removiendo scripts:", e);
  }
  try {
    log("  ⋅ Borrando window.MercadoPago");
    delete (window as any).MercadoPago;
  } catch {
    (window as any).MercadoPago = undefined;
  }

  const g = (window as any).__MP_SDK__ || {};
  g.initialized = false;
  g.key = undefined;
  (window as any).__MP_SDK__ = g;
  log("✓ Teardown completo");
}

/**
 * Inicializa el SDK si no existe. Si existe con otra key, hace teardown + init.
 * IMPORTANTE: no debe haber <Wallet /> montados cuando cambies de key.
 */
export async function initMpOnce(publicKey: string, locale = "es-AR") {
  if (typeof window === "undefined") {
    log("SSR detectado → no hago nada");
    return;
  }

  const g = (window.__MP_SDK__ ||= {});
  const hasSDK = !!window.MercadoPago;

  log("Estado inicial:", {
    incomingKey: publicKey,
    storedKey: g.key,
    hasSDK,
    initialized: g.initialized,
    hasInitPromise: !!g.initPromise,
    locale,
  });

  // SDK presente pero sin key guardada: adoptamos la entrante
  if (hasSDK && !g.key) {
    log("SDK presente sin storedKey → adopto incomingKey y marco initialized");
    g.key = publicKey;
    g.locale = g.locale ?? locale;
    g.initialized = true;
    log("✓ Adoptada key:", g.key);
    return;
  }

  // Ya inicializado con la misma key
  if (hasSDK && g.key === publicKey) {
    log("SDK ya inicializado con misma key → no hago nada");
    return;
  }

  // SDK con key distinta → teardown + re-init
  if (hasSDK && g.key && g.key !== publicKey) {
    warn(
      "SDK presente con storedKey distinta:",
      g.key,
      "→ teardown y re-init con:",
      publicKey
    );
    teardownMpSdk();
  }

  // Hay una inicialización en curso → la esperamos
  if (g.initPromise) {
    log("Esperando initPromise existente…");
    await g.initPromise;
    log("initPromise resuelta. Estado tras espera:", {
      storedKey: g.key,
      hasSDK: !!window.MercadoPago,
    });
    if (window.__MP_SDK__?.key === publicKey) {
      log("Tras espera, ya tenemos la misma key → listo");
      return;
    }
    // si no coincide, seguimos con init (posible cambio de key)
  }

  // Nueva inicialización
  log("→ Llamando initMercadoPago con key:", publicKey, "locale:", locale);
  g.initPromise = (async () => {
    initMercadoPago(publicKey, { locale: 'es-AR' });
    g.key = publicKey;
    g.locale = locale;
    g.initialized = true;
  })();

  try {
    await g.initPromise;
    log("✓ SDK inicializado. Estado:", {
      storedKey: g.key,
      hasSDK: !!window.MercadoPago,
      initialized: g.initialized,
    });
  } catch (e) {
    err("✗ Error inicializando SDK:", e);
  } finally {
    g.initPromise = undefined;
  }
}