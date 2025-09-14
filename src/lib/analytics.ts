import type { EventDto, Prevent, ComboEventDto, ProductEventDto, Producer } from "@/lib/types";

type GAParams = Record<string, any>;
type FBParams = Record<string, any>;
type Currency = "ARS" | "USD" | "UYU" | "BRL" | string;
type Channel = "live" | "prevent";
type Meta = { channel?: Channel;[k: string]: any };
type EntryChannel =
  | "direct"
  | "organic_search"
  | "paid_search"
  | "social"
  | "paid_social"
  | "referral"
  | "email"
  | "unknown";

type Attribution = {
  promoter?: string | null;
  influencer?: string | null;
  instagram_user?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  ref?: string | null;
  referrerDomain?: string | null;
  source?: string | null;
  landing_path?: string | null;
  landing_search?: string | null;
  first_touch_ts?: number | null;
};

type EntryInfo = {
  channel: EntryChannel;
  source?: string;
  medium?: string;
  campaign?: string | null;
  ref?: string | null;
  ref_host?: string | null;
};

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

const SOCIAL_HOSTS: Record<string, string> = {
  "instagram.com": "instagram",
  "l.instagram.com": "instagram",
  "facebook.com": "facebook",
  "l.facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "twitter.com": "twitter",
  "t.co": "twitter",
  "x.com": "twitter",
  "whatsapp.com": "whatsapp",
  "tiktok.com": "tiktok",
  "t.tiktok.com": "tiktok",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "linkedin.com": "linkedin",
  "lnkd.in": "linkedin",
};

const SEARCH_HOSTS = [
  "google.",
  "bing.com",
  "search.yahoo.com",
  "duckduckgo.com",
  "yandex.",
  "baidu.com",
];

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

function hostMatches(host: string | null | undefined, list: string[]) {
  if (!host) return false;
  const h = host.toLowerCase();
  return list.some((p) => h.includes(p));
}

function mapSocialHost(host?: string | null) {
  if (!host) return null;
  const key = host.toLowerCase();
  const found = Object.keys(SOCIAL_HOSTS).find((k) => key.endsWith(k));
  return found ? SOCIAL_HOSTS[found] : null;
}

export function classifyEntry(search: string, referrer?: string): EntryInfo {
  const q = new URLSearchParams(search);

  const utm_source = q.get("utm_source") || null;
  const utm_medium = q.get("utm_medium") || null;
  const utm_campaign = q.get("utm_campaign") || null;

  const gclid = q.get("gclid");
  const fbclid = q.get("fbclid");
  const ttclid = q.get("ttclid");

  let ref = referrer || (typeof document !== "undefined" ? document.referrer : "") || null;
  let ref_host: string | null = null;
  try {
    if (ref) ref_host = new URL(ref).host;
  } catch { }

  // Con UTM: respetamos lo que dice el link
  if (utm_source || utm_medium) {
    const medium = (utm_medium || "").toLowerCase();
    const source = (utm_source || "").toLowerCase();

    let channel: EntryChannel = "referral";
    if (/(cpc|ppc|paid|sem|ads)/.test(medium)) {
      channel = SOCIAL_HOSTS[source] ? "paid_social" : "paid_search";
    } else if (/social/.test(medium)) {
      channel = "social";
    } else if (medium === "email") {
      channel = "email";
    } else if (medium === "organic") {
      channel = "organic_search";
    }

    return {
      channel,
      source: source || ref_host || undefined,
      medium: medium || "referral",
      campaign: utm_campaign,
      ref,
      ref_host,
    };
  }

  // Sin UTM: mirar clids
  if (gclid) {
    return {
      channel: "paid_search",
      source: "google",
      medium: "cpc",
      campaign: null,
      ref,
      ref_host,
    };
  }
  if (fbclid) {
    return {
      channel: "paid_social",
      source: "facebook",
      medium: "paid_social",
      campaign: null,
      ref,
      ref_host,
    };
  }
  if (ttclid) {
    return {
      channel: "paid_social",
      source: "tiktok",
      medium: "paid_social",
      campaign: null,
      ref,
      ref_host,
    };
  }

  // Sin UTM ni clids: usar referrer
  const social = mapSocialHost(ref_host || undefined);
  if (social) {
    return {
      channel: "social",
      source: social,
      medium: "social",
      campaign: null,
      ref,
      ref_host,
    };
  }

  if (hostMatches(ref_host, SEARCH_HOSTS)) {
    return {
      channel: "organic_search",
      source: ref_host || undefined,
      medium: "organic",
      campaign: null,
      ref,
      ref_host,
    };
  }

  if (!ref) {
    return {
      channel: "direct",
      source: "(direct)",
      medium: "(none)",
      campaign: null,
      ref: null,
      ref_host: null,
    };
  }

  return {
    channel: "referral",
    source: ref_host || undefined,
    medium: "referral",
    campaign: null,
    ref,
    ref_host,
  };
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

export function readAttribution(): Attribution {
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function safeHostname(u?: string | null) {
  try { return u ? new URL(u).hostname : null; } catch { return null; }
}

export function captureAttributionFromURL(search: string, referrer?: string) {
  const q = new URLSearchParams(search);
  const current = readAttribution();

  const utm_source = q.get("utm_source") || current.utm_source || null;
  const utm_medium = q.get("utm_medium") || current.utm_medium || null;
  const utm_campaign = q.get("utm_campaign") || current.utm_campaign || null;
  const utm_term = q.get("utm_term") || current.utm_term || null;
  const utm_content = q.get("utm_content") || current.utm_content || null;

  const promoter = q.get("promoter") || current.promoter || null;
  const influencer = q.get("inf") || current.influencer || null;
  const instagram_user = q.get("ig_user") || q.get("ig") || current.instagram_user || null;

  const gclid = q.get("gclid") || current.gclid || null;
  const fbclid = q.get("fbclid") || current.fbclid || null;

  const ref = referrer || current.ref || (typeof document !== "undefined" ? document.referrer : null);
  const referrerDomain = safeHostname(ref) || current.referrerDomain || null;

  const landing_path = (typeof window !== "undefined" ? window.location.pathname : current.landing_path) || null;
  const landing_search = search || current.landing_search || null;

  let source = promoter ? "promoter" :
    influencer ? "influencer" :
      (utm_source?.toLowerCase() === "instagram" || instagram_user || (referrerDomain?.includes("instagram.com")))
        ? "instagram"
        : (utm_source || (referrerDomain ? `referral:${referrerDomain}` : "direct"));

  if (!promoter && !influencer && !utm_source && !instagram_user && current.source) {
    source = current.source;
  }

  const next: Attribution = {
    promoter,
    influencer,
    instagram_user,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    gclid,
    fbclid,
    ref,
    referrerDomain,
    source,
    landing_path,
    landing_search,
    first_touch_ts: current.first_touch_ts ?? Date.now(),
  };

  try { localStorage.setItem(ATTR_KEY, JSON.stringify(next)); } catch { }
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
    influencer: attr.influencer || undefined,
    instagram_user: attr.instagram_user || undefined,
    utm_source: attr.utm_source || undefined,
    utm_medium: attr.utm_medium || undefined,
    utm_campaign: attr.utm_campaign || undefined,
    utm_term: attr.utm_term || undefined,
    utm_content: attr.utm_content || undefined,
    gclid: attr.gclid || undefined,
    fbclid: attr.fbclid || undefined,
    referrer: attr.ref || undefined,
    referrer_domain: attr.referrerDomain || undefined,
    source: attr.source || undefined,
    landing_path: attr.landing_path || undefined,
    landing_search: attr.landing_search || undefined,
    first_touch_ts: attr.first_touch_ts || undefined,
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
  const base = baseCommonParams(producer);
  const params = withChannel({
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_path: path, page_title: title,
    ...base
  }, meta?.channel);
  gtag("page_view", params);
  fbqTrack("PageView", withChannel({ page_path: path, ...base }, meta?.channel));
}

export function trackViewEvent(
  event: EventDto,
  producer?: Producer,
  currency: Currency = "ARS",
  meta?: Meta
) {
  const eid = eventId("view_item", event.id);
  const channel = resolveChannel(event, meta);
  const base = baseCommonParams(producer, currency);

  gtag("view_item", withChannel({
    event_id: eid,
    value: 0, currency,
    items: [{ item_id: `event_${event.id}`, item_name: event.name, item_category: "event" }],
    ...base
  }, channel));

  fbqTrack("ViewContent", withChannel({
    event_id: eid,
    content_type: "event",
    content_ids: [`event_${event.id}`],
    content_name: event.name,
    value: 0,
    currency,
    ...base
  }, channel));
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

  const base = baseCommonParams(producer, currency);
  gtag("add_to_cart", withChannel({ event_id: eid, value, currency, items: [item], ...base }, channel));
  fbqTrack("AddToCart", withChannel({
    event_id: eid,
    content_type: "product",
    content_ids: [item.item_id],
    content_name: item.item_name,
    value, currency, quantity: item.quantity,
    ...base
  }, channel));
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

  const gaValue = typeof options.value === "number"
    ? options.value
    : gaItems.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 0),
      0
    );

  const base = baseCommonParams(options.producer, currency);
  gtag("begin_checkout", withChannel({ event_id: eid, coupon: options.coupon || undefined, value: gaValue, currency, items: gaItems, ...base }, channel));
  fbqTrack("InitiateCheckout", withChannel({
    event_id: eid, value: gaValue, currency,
    num_items: gaItems.reduce((a, i) => a + (Number(i.quantity) || 0), 0),
    content_type: "product",
    contents: gaItems.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
    coupon: options.coupon || undefined,
    ...base
  }, channel));
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

  const base = baseCommonParams(options.producer, currency);
  gtag("purchase", withChannel({
    event_id: eid, transaction_id: eid, value: Number(options.value || 0), currency,
    coupon: options.coupon || undefined, items: gaItems, ...base
  }, channel));

  fbqTrack("Purchase", withChannel({
    event_id: eid,
    value: Number(options.value || 0),
    currency,
    contents: gaItems.map(i => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
    content_type: "product",
    num_items: gaItems.reduce((a, i) => a + (Number(i.quantity) || 0), 0),
    coupon: options.coupon || undefined,
    ...base
  }, channel));
}

export function trackSearch(
  query: string,
  resultsCount: number,
  producer?: Producer,
  meta?: Meta
) {
  const base = baseCommonParams(producer);
  gtag("search", withChannel({
    search_term: query,
    results: resultsCount,
    ...base
  }, meta?.channel));
  fbqTrack("Search", withChannel({
    search_string: query,
    ...base
  }, meta?.channel));
}

export function fbqTrackCustom(event: string, params?: Record<string, any>) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq!("trackCustom", event, params || {});
    }
  } catch { }
}

export function trackSelectItem(
  listName: string,
  event: EventDto,
  producer?: Producer,
  meta?: Meta
) {
  const channel = resolveChannel(event, meta);
  const base = baseCommonParams(producer);

  gtag("select_item", withChannel({
    item_list_name: listName,
    items: [{
      item_id: `event_${event.id}`,
      item_name: event.name,
      item_category: "event",
    }],
    ...base,
  }, channel));

  fbqTrackCustom("SelectItem", withChannel({
    content_type: "event",
    content_ids: [`event_${event.id}`],
    content_name: event.name,
    item_list_name: listName,
    ...base,
  }, channel));
}

export function trackShare(
  content: { method: string; content_id?: string; content_type?: string },
  meta?: Meta
) {
  const base = baseCommonParams(undefined);
  gtag("share", withChannel({
    method: content.method,
    content_type: content.content_type,
    item_id: content.content_id,
    ...base
  }, meta?.channel));
}

export function trackLead(
  type: "newsletter" | "waitlist" | "contact",
  producer?: Producer,
  meta?: Meta
) {
  const base = baseCommonParams(producer);
  gtag("generate_lead", withChannel({
    lead_type: type,
    ...base
  }, meta?.channel));
  fbqTrack("Lead", withChannel({
    lead_type: type,
    ...base
  }, meta?.channel));
}

export function trackLandingEntry(producer?: Producer, info?: EntryInfo) {
  const base = baseCommonParams(producer);
  const params = {
    event_id: eventId("landing_visit"),
    entry_channel: info?.channel,
    entry_source: info?.source,
    entry_medium: info?.medium,
    entry_campaign: info?.campaign ?? undefined,
    ref: info?.ref ?? undefined,
    ref_host: info?.ref_host ?? undefined,
    ...base
  };

  gtag("landing_visit", params);
  fbqTrackCustom("LandingVisit", {
    entry_channel: info?.channel,
    entry_source: info?.source,
    entry_medium: info?.medium,
    entry_campaign: info?.campaign ?? undefined,
    ...base
  });
}