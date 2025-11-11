const ORDER_NOTIFICATION_TAG = "live-order-status";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

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
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "Actualización de tu pedido";
  const body = payload.body || "Tenemos novedades sobre tu pedido.";
  const data = payload.data || {};
  event.waitUntil(showNotification(title, { body, data }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

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
    const { title, body, data } = event.data.payload || {};
    event.waitUntil(showNotification(title || "Actualización de pedido", { body, data }));
  }
});
