const ORDER_NOTIFICATION_TAG = "live-order-status";
const DEFAULT_NOTIFICATION_TITLE = "Actualizacion de tu pedido";
const DEFAULT_NOTIFICATION_BODY = "Tenemos novedades sobre tu pedido.";
const DEFAULT_NOTIFICATION_URL = "/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

const buildTrackingUrl = ({ orderId, pickupCode, token, channel } = {}) => {
  try {
    const params = new URLSearchParams();
    if (orderId != null) params.set("orderId", String(orderId));
    if (pickupCode) params.set("pickupCode", pickupCode);
    if (token) params.set("token", token);
    if (channel) params.set("channel", channel);

    const query = params.toString();
    return query ? `${DEFAULT_NOTIFICATION_URL}?${query}` : DEFAULT_NOTIFICATION_URL;
  } catch {
    return DEFAULT_NOTIFICATION_URL;
  }
};

const normalizeNotificationPayload = raw => {
  if (!raw || typeof raw !== "object") {
    return { title: DEFAULT_NOTIFICATION_TITLE, body: DEFAULT_NOTIFICATION_BODY, data: {} };
  }

  if (raw.title || raw.body || raw.data) {
    return {
      title: raw.title || DEFAULT_NOTIFICATION_TITLE,
      body: raw.body || DEFAULT_NOTIFICATION_BODY,
      data: raw.data || {},
    };
  }

  const {
    statusLabel,
    status,
    pickupCode,
    message,
    eventName,
    orderId,
    token,
    total,
    updatedAt,
    channel,
    timestamps,
    eventDate,
  } = raw;

  const titleParts = [
    statusLabel || DEFAULT_NOTIFICATION_TITLE,
    eventName ? `- ${eventName}` : null,
  ].filter(Boolean);

  const title = titleParts.join(" ");
  const fallbackBody =
    message ||
    (statusLabel && pickupCode ? `Pedido ${pickupCode}: ${statusLabel}.` : DEFAULT_NOTIFICATION_BODY);

  const data = {
    url: buildTrackingUrl({ orderId, pickupCode, token, channel }),
    orderId: orderId ?? null,
    pickupCode: pickupCode ?? null,
    status: status ?? null,
    statusLabel: statusLabel ?? null,
    message: fallbackBody,
    total: total ?? null,
    updatedAt: updatedAt ?? null,
    token: token ?? null,
    channel: channel ?? null,
    eventName: eventName ?? null,
    eventDate: eventDate ?? null,
    timestamps: timestamps ?? null,
    raw,
  };

  return { title, body: fallbackBody, data };
};

const showNotification = (title, options = {}) => {
  const defaultOptions = {
    tag: ORDER_NOTIFICATION_TAG,
    renotify: true,
    badge: "/favicon.ico",
    icon: "/favicon.ico",
    data: {},
  };
  return self.registration.showNotification(title, { ...defaultOptions, ...options });
};

self.addEventListener("push", event => {
  if (!event.data) return;

  let rawPayload = {};
  try {
    rawPayload = event.data.json();
  } catch {
    rawPayload = { body: event.data.text() };
  }

  const { title, body, data } = normalizeNotificationPayload(rawPayload);
  event.waitUntil(showNotification(title, { body, data }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || DEFAULT_NOTIFICATION_URL;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientsArr => {
      const focusedClient = clientsArr.find(client => client.url.includes(targetUrl));
      if (focusedClient) {
        return focusedClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SHOW_ORDER_NOTIFICATION") {
    const { title, body, data } = normalizeNotificationPayload(event.data.payload || {});
    event.waitUntil(showNotification(title, { body, data }));
  }
});
