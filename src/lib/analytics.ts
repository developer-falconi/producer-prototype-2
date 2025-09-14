import type { EventDto, Prevent, ComboEventDto, ProductEventDto, Producer } from "@/lib/types";

type GAParams = Record<string, any>;
type FBParams = Record<string, any>;
type Currency = "ARS" | "USD" | "UYU" | "BRL" | string;
type Channel = "live" | "prevent";
type Meta = { channel?: Channel;[k: string]: any };

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

const hasGA = () => typeof window !== "undefined" && typeof window.gtag === "function";
const hasDL = () => typeof window !== "undefined" && Array.isArray(window.dataLayer);
const hasFB = () => typeof window !== "undefined" && typeof window.fbq === "function";

export function gtag(event: string, params?: GAParams) {
  try {
    if (hasGA()) window.gtag!("event", event, params || {});
    else if (hasDL()) window.dataLayer!.push({ event, ...params });
  } catch (e) {
    // no-op
  }
}

export function fbqTrack(event: string, params?: FBParams) {
  try {
    if (hasFB()) window.fbq!("track", event, params || {});
  } catch (e) {
    // no-op
  }
}

export function setConsent(opts: {
  ad_storage?: "granted" | "denied";
  analytics_storage?: "granted" | "denied";
  functionality_storage?: "granted" | "denied";
  security_storage?: "granted" | "denied";
}) {
  try {
    if (hasGA()) {
      window.gtag!("consent", "update", opts);
    } else if (hasDL()) {
      window.dataLayer!.push({ event: "consent_update", ...opts });
    }
  } catch {
  }
}

export function setUserProperties(user: {
  producerId?: number | string;
  producerName?: string;
  producerDomain?: string;
}) {
  try {
    if (hasGA()) {
      window.gtag!("set", "user_properties", {
        producer_id: user.producerId?.toString(),
        producer_name: user.producerName,
        producer_domain: user.producerDomain,
      });
    }
  } catch {
  }
}

const ATTR_KEY = "produtik_attribution_v1";

export type Attribution = {
  promoter?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  ref?: string | null;
};

export function readAttribution(): Attribution {
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function captureAttributionFromURL(search: string, referrer?: string) {
  const q = new URLSearchParams(search);
  const current = readAttribution();

  const next: Attribution = {
    promoter: q.get("promoter") || current.promoter || null,
    utm_source: q.get("utm_source") || current.utm_source || null,
    utm_medium: q.get("utm_medium") || current.utm_medium || null,
    utm_campaign: q.get("utm_campaign") || current.utm_campaign || null,
    utm_term: q.get("utm_term") || current.utm_term || null,
    utm_content: q.get("utm_content") || current.utm_content || null,
    ref: referrer || current.ref || (typeof document !== "undefined" ? document.referrer : null),
  };

  try {
    localStorage.setItem(ATTR_KEY, JSON.stringify(next));
  } catch {
    // no-op
  }
  return next;
}

function eventId(prefix: string, id?: string | number) {
  return id ? `${prefix}_${id}` : `${prefix}_${Date.now()}`;
}

function baseCommonParams(producer?: Producer, currency: Currency = "ARS") {
  const attr = readAttribution();
  return {
    currency,
    producer_id: producer?.id?.toString(),
    producer_name: producer?.name,
    producer_domain: producer?.domain,
    promoter: attr.promoter || undefined,
    utm_source: attr.utm_source || undefined,
    utm_medium: attr.utm_medium || undefined,
    utm_campaign: attr.utm_campaign || undefined,
  };
}

function inferChannelByDates(event?: EventDto): Channel | undefined {
  if (!event?.startDate || !event?.endDate) return undefined;
  const now = Date.now();
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  if (Number.isFinite(start) && Number.isFinite(end)) {
    return now >= start && now < end ? "live" : "prevent";
  }
  return undefined;
}

function resolveChannel(
  event?: EventDto,
  meta?: Meta,
  optionChannel?: Channel
): Channel | undefined {
  return optionChannel ?? meta?.channel ?? inferChannelByDates(event);
}

function withChannel<T extends Record<string, any>>(
  params: T,
  channel?: Channel
): T & { sale_channel?: Channel } {
  return channel ? { ...params, sale_channel: channel } : params;
}

function toItemFromPrevent(event: EventDto, prevent: Prevent, qty = 1) {
  return {
    item_id: `event_${event.id}_prevent_${prevent.id}`,
    item_name: `${event.name} - ${prevent.name}`,
    item_category: "ticket",
    price: Number(prevent.price) || 0,
    quantity: qty,
    event_id: event.id?.toString(),
  };
}

function toItemFromCombo(event: EventDto, combo: ComboEventDto, qty = 1) {
  return {
    item_id: `event_${event.id}_combo_${combo.id}`,
    item_name: `${event.name} - Combo ${combo.name}`,
    item_category: "combo",
    price: Number(combo.price) || 0,
    quantity: qty,
    event_id: event.id?.toString(),
  };
}

function toItemFromProduct(event: EventDto, pe: ProductEventDto, qty = 1) {
  const price = Number(pe.price ?? pe.product?.basePrice ?? 0) || 0;
  return {
    item_id: `event_${event.id}_product_${pe.id}`,
    item_name: `${event.name} - ${pe.product?.name}`,
    item_brand: pe.product?.brand,
    item_category: pe.product?.category || "product",
    price,
    quantity: qty,
    event_id: event.id?.toString(),
  };
}

export function trackPageView(
  path: string,
  title?: string,
  producer?: Producer,
  meta?: Meta
) {
  const params = withChannel(
    {
      page_location:
        typeof window !== "undefined" ? window.location.href : undefined,
      page_path: path,
      page_title: title,
      ...baseCommonParams(producer),
    },
    meta?.channel
  );
  gtag("page_view", params);
  fbqTrack("PageView", withChannel({ page_path: path }, meta?.channel));
}

export function trackViewEvent(
  event: EventDto,
  producer?: Producer,
  currency: Currency = "ARS",
  meta?: Meta
) {
  const eid = eventId("view_item", event.id);
  const channel = resolveChannel(event, meta);
  const params = withChannel(
    {
      event_id: eid,
      value: 0,
      currency,
      items: [
        {
          item_id: `event_${event.id}`,
          item_name: event.name,
          item_category: "event",
        },
      ],
      ...baseCommonParams(producer, currency),
    },
    channel
  );
  gtag("view_item", params);
  fbqTrack(
    "ViewContent",
    withChannel(
      {
        event_id: eid,
        content_type: "event",
        content_ids: [`event_${event.id}`],
        content_name: event.name,
        value: 0,
        currency,
      },
      channel
    )
  );
}

export function trackAddToCart(
  event: EventDto,
  line:
    | { prevent: Prevent; qty?: number }
    | { combo: ComboEventDto; qty?: number }
    | { product: ProductEventDto; qty?: number },
  producer?: Producer,
  currency: Currency = "ARS",
  meta?: Meta
) {
  const eid = eventId("add_to_cart", event.id);
  const channel = resolveChannel(event, meta);

  let item: any, value = 0;
  if ("prevent" in line) {
    item = toItemFromPrevent(event, line.prevent, line.qty || 1);
  } else if ("combo" in line) {
    item = toItemFromCombo(event, line.combo, line.qty || 1);
  } else {
    item = toItemFromProduct(event, line.product, line.qty || 1);
  }
  value = (Number(item.price) || 0) * (Number(item.quantity) || 1);

  const params = withChannel(
    {
      event_id: eid,
      value,
      currency,
      items: [item],
      ...baseCommonParams(producer, currency),
    },
    channel
  );
  gtag("add_to_cart", params);
  fbqTrack(
    "AddToCart",
    withChannel(
      {
        event_id: eid,
        content_type: "product",
        content_ids: [item.item_id],
        content_name: item.item_name,
        value,
        currency,
        quantity: item.quantity,
      },
      channel
    )
  );
}

export function trackBeginCheckout(
  event: EventDto,
  items: Array<
    | { prevent: Prevent; qty?: number }
    | { combo: ComboEventDto; qty?: number }
    | { product: ProductEventDto; qty?: number }
  >,
  options: {
    coupon?: string | null;
    value?: number;
    producer?: Producer;
    currency?: Currency;
    channel?: Channel;
  } = {},
  meta?: Meta
) {
  const eid = eventId("begin_checkout", event.id);
  const currency = options.currency || "ARS";
  const channel = resolveChannel(event, meta, options.channel);

  const gaItems = items.map((it) => {
    if ("prevent" in it) return toItemFromPrevent(event, it.prevent, it.qty || 1);
    if ("combo" in it) return toItemFromCombo(event, it.combo, it.qty || 1);
    return toItemFromProduct(event, it.product, it.qty || 1);
  });

  const gaValue =
    typeof options.value === "number"
      ? options.value
      : gaItems.reduce(
        (acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 0),
        0
      );

  const params = withChannel(
    {
      event_id: eid,
      coupon: options.coupon || undefined,
      value: gaValue,
      currency,
      items: gaItems,
      ...baseCommonParams(options.producer, currency),
    },
    channel
  );

  gtag("begin_checkout", params);
  fbqTrack(
    "InitiateCheckout",
    withChannel(
      {
        event_id: eid,
        value: gaValue,
        currency,
        num_items: gaItems.reduce((a, i) => a + (Number(i.quantity) || 0), 0),
        content_type: "product",
        contents: gaItems.map((i) => ({
          id: i.item_id,
          quantity: i.quantity,
          item_price: i.price,
        })),
        coupon: options.coupon || undefined,
      },
      channel
    )
  );
}

export function trackPurchase(
  event: EventDto,
  options: {
    transactionId: string;
    value: number;
    items: Array<
      | { prevent: Prevent; qty?: number }
      | { combo: ComboEventDto; qty?: number }
      | { product: ProductEventDto; qty?: number }
    >;
    coupon?: string | null;
    producer?: Producer;
    currency?: Currency;
    channel?: Channel;
  },
  meta?: Meta
) {
  const eid = options.transactionId || eventId("purchase", event.id);
  const currency = options.currency || "ARS";
  const channel = resolveChannel(event, meta, options.channel);

  const gaItems = options.items.map((it) => {
    if ("prevent" in it) return toItemFromPrevent(event, it.prevent, it.qty || 1);
    if ("combo" in it) return toItemFromCombo(event, it.combo, it.qty || 1);
    return toItemFromProduct(event, it.product, it.qty || 1);
  });

  const gaParams = withChannel(
    {
      event_id: eid,
      transaction_id: eid,
      value: Number(options.value || 0),
      currency,
      coupon: options.coupon || undefined,
      items: gaItems,
      ...baseCommonParams(options.producer, currency),
    },
    channel
  );

  gtag("purchase", gaParams);
  fbqTrack(
    "Purchase",
    withChannel(
      {
        event_id: eid,
        value: Number(options.value || 0),
        currency,
        contents: gaItems.map((i) => ({
          id: i.item_id,
          quantity: i.quantity,
          item_price: i.price,
        })),
        content_type: "product",
        num_items: gaItems.reduce((a, i) => a + (Number(i.quantity) || 0), 0),
        coupon: options.coupon || undefined,
      },
      channel
    )
  );
}

export function trackSearch(
  query: string,
  resultsCount: number,
  producer?: Producer,
  meta?: Meta
) {
  const params = withChannel(
    {
      search_term: query,
      results: resultsCount,
      ...baseCommonParams(producer),
    },
    meta?.channel
  );
  gtag("search", params);
  fbqTrack("Search", withChannel({ search_string: query }, meta?.channel));
}

export function trackSelectItem(
  listName: string,
  event: EventDto,
  producer?: Producer,
  meta?: Meta
) {
  const channel = resolveChannel(event, meta);
  const params = withChannel(
    {
      item_list_name: listName,
      items: [
        {
          item_id: `event_${event.id}`,
          item_name: event.name,
          item_category: "event",
        },
      ],
      ...baseCommonParams(producer),
    },
    channel
  );
  gtag("select_item", params);
}

export function trackShare(
  content: { method: string; content_id?: string; content_type?: string },
  meta?: Meta
) {
  gtag(
    "share",
    withChannel(
      {
        method: content.method,
        content_type: content.content_type,
        item_id: content.content_id,
      },
      meta?.channel
    )
  );
}

export function trackLead(
  type: "newsletter" | "waitlist" | "contact",
  producer?: Producer,
  meta?: Meta
) {
  const params = withChannel(
    { lead_type: type, ...baseCommonParams(producer) },
    meta?.channel
  );
  gtag("generate_lead", params);
  fbqTrack("Lead", withChannel({ lead_type: type }, meta?.channel));
}