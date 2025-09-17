import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import type {
  Producer,
  EventDto,
  Prevent,
  ComboEventDto,
  ProductEventDto,
  PaymentStatus,
} from "@/lib/types";
import {
  trackPageView,
  trackViewEvent,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackSelectItem,
  trackShare,
  trackLead,
  captureAttributionFromURL,
  setUserProperties,
  readAttribution,
  classifyEntry,
  trackLandingEntry,
  trackAddPaymentInfo,
  trackViewCart,
} from "@/lib/analytics";

type Currency = "ARS" | "USD" | "UYU" | "BRL" | string;
type Channel = "live" | "prevent";

export function useTracking(
  opts: { producer?: Producer; currency?: Currency; channel?: Channel } = {}
) {
  const location = useLocation();
  const currency = opts.currency || "ARS";
  const producer = opts.producer;
  const channel = opts.channel;

  useEffect(() => {
    captureAttributionFromURL(location.search, document.referrer);
  }, [location.search]);

  const attribution = useMemo(() => readAttribution(), [location.search]);

  useEffect(() => {
    const title = document?.title;
    trackPageView(location.pathname + location.search, title, producer, { channel });
  }, [location.pathname, location.search, producer, channel]);

  useEffect(() => {
    if (producer) {
      setUserProperties({
        producerId: producer.id,
        producerName: producer.name,
        producerDomain: producer.domain,
      });
    }
  }, [producer]);

  const entryOnceRef = useRef(false);
  useEffect(() => {
    if (entryOnceRef.current) return;

    const ref = typeof document !== "undefined" ? document.referrer || "" : "";
    let refOrigin = "";
    try { refOrigin = ref ? new URL(ref).origin : ""; } catch { }

    const sameOrigin = typeof window !== "undefined" && refOrigin === window.location.origin;

    if (!sameOrigin) {
      const k = `landing_visit_once_${producer?.id ?? "default"}`;
      try {
        if (sessionStorage.getItem(k) === "1") return;
        sessionStorage.setItem(k, "1");
      } catch { }

      const info = classifyEntry(window.location.search, ref);
      trackLandingEntry(producer, info);
      entryOnceRef.current = true;
    }
  }, [producer]);

  const api = useMemo(() => {
    return {
      viewEvent: (event: EventDto) =>
        trackViewEvent(event, producer, currency, { channel }),

      trackEventOpenOnce: (event: EventDto) => {
        const key = `view_event_${event.id}`;
        try {
          if (sessionStorage.getItem(key) === "1") return false;
          sessionStorage.setItem(key, "1");
        } catch { }
        trackViewEvent(event, producer, currency, { channel });
        return true;
      },

      addPrevent: (event: EventDto, prevent: Prevent, qty = 1) =>
        trackAddToCart(event, { prevent, qty }, producer, currency, { channel }),

      addCombo: (event: EventDto, combo: ComboEventDto, qty = 1) =>
        trackAddToCart(event, { combo, qty }, producer, currency, { channel }),

      addProduct: (event: EventDto, product: ProductEventDto, qty = 1) =>
        trackAddToCart(event, { product, qty }, producer, currency, { channel }),

      beginCheckout: (
        event: EventDto,
        items: Array<{
          prevent?: Prevent;
          combo?: ComboEventDto;
          product?: ProductEventDto;
          qty?: number;
        }>,
        opts?: { coupon?: string | null; value?: number }
      ) => {
        const normalized = items.map((it) =>
          it.prevent
            ? { prevent: it.prevent, qty: it.qty }
            : it.combo
              ? { combo: it.combo, qty: it.qty }
              : { product: it.product!, qty: it.qty }
        );
        trackBeginCheckout(
          event,
          normalized as any,
          {
            coupon: opts?.coupon ?? null,
            value: typeof opts?.value === "number" ? opts.value : undefined,
            producer,
            currency,
            channel,
          }
        );
      },

      purchase: (
        event: EventDto,
        opts: {
          transactionId: string;
          value: number;
          items: Array<{
            prevent?: Prevent;
            combo?: ComboEventDto;
            product?: ProductEventDto;
            qty?: number;
          }>;
          coupon?: string | null;
        }
      ) => {
        const normalized = opts.items.map((it) =>
          it.prevent
            ? { prevent: it.prevent, qty: it.qty }
            : it.combo
              ? { combo: it.combo, qty: it.qty }
              : { product: it.product!, qty: it.qty }
        );
        trackPurchase(
          event,
          {
            transactionId: opts.transactionId,
            value: opts.value,
            items: normalized as any,
            coupon: opts.coupon ?? null,
            producer,
            currency,
            channel,
          }
        );
      },

      handleMercadoPagoReturn: (
        paymentStatus: PaymentStatus | null,
        event: EventDto | undefined,
        totalValue?: number,
        items?: any[]
      ) => {
        if (!paymentStatus || !event) return;
        const status = (paymentStatus.status || "").toLowerCase();
        const ok = ["approved", "success", "accredited"].includes(status);
        const q = paymentStatus.params || {};

        if (ok) {
          const txn =
            q["collection_id"] ||
            q["payment_id"] ||
            q["preference_id"] ||
            q["merchant_order_id"] ||
            q["external_reference"] ||
            `${event.id}-${Date.now()}`;

          api.purchase(event, {
            transactionId: String(txn),
            value: Number(totalValue || 0),
            items: (items || []) as any,
            coupon: q["coupon"] || null,
          });
        }
      },

      search: (term: string, resultsCount: number) =>
        trackSearch(term, resultsCount, producer, { channel }),

      selectFromList: (listName: string, event: EventDto) =>
        trackSelectItem(listName, event, producer, { channel }),

      share: (
        method: "whatsapp" | "instagram" | "copy" | string,
        contentId?: string,
        contentType?: string
      ) => trackShare({ method, content_id: contentId, content_type: contentType }, { channel }),

      lead: (type: "newsletter" | "waitlist" | "contact") =>
        trackLead(type, producer, { channel }),

      ui: (action: string, payload?: Record<string, any>) => {
        const extra = { ...(payload || {}), producerId: producer?.id, currency, sale_channel: channel };
        try {
          (window as any)?.analytics?.track?.(action, extra);
        } catch { }
        try {
          (window as any)?.gtag?.("event", action, extra);
        } catch { }
      },

      addPaymentInfo: (
        event: EventDto,
        items: Array<{
          prevent?: Prevent;
          combo?: ComboEventDto;
          product?: ProductEventDto;
          qty?: number;
        }>,
        opts: { paymentType: 'bank_transfer' | 'mercadopago' | 'cash'; coupon?: string | null; value?: number }
      ) => {
        const normalized = items.map((it) =>
          it.prevent
            ? { prevent: it.prevent, qty: it.qty }
            : it.combo
              ? { combo: it.combo, qty: it.qty }
              : { product: it.product!, qty: it.qty }
        );
        trackAddPaymentInfo(
          event,
          normalized,
          {
            paymentType: opts.paymentType,
            coupon: opts.coupon ?? null,
            value: typeof opts.value === "number" ? opts.value : undefined,
            producer,
            currency,
            channel,
          }
        );
      },

      viewCart: (
        event: EventDto,
        items: Array<{
          prevent?: Prevent;
          combo?: ComboEventDto;
          product?: ProductEventDto;
          qty?: number;
        }>,
        opts?: { coupon?: string | null; value?: number }
      ) => {
        const normalized = items.map((it) =>
          it.prevent
            ? { prevent: it.prevent, qty: it.qty }
            : it.combo
              ? { combo: it.combo, qty: it.qty }
              : { product: it.product!, qty: it.qty }
        );
        trackViewCart(
          event,
          normalized,
          {
            coupon: opts?.coupon ?? null,
            value: typeof opts?.value === "number" ? opts.value : undefined,
            producer,
            currency,
            channel,
          }
        );
      },

      attribution
    };
  }, [producer, currency, channel]);

  return api;
}