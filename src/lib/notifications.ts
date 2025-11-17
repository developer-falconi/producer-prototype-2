import { registerLiveOrderPushSubscription, unregisterLiveOrderPushSubscription } from "./api";
import * as crypto from 'crypto';

const SW_PATH = "/live-order-sw.js";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const isNotificationSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const ensureNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
};

export const registerOrderServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH);
    return registration;
  } catch (error) {
    console.error("No se pudo registrar el service worker de pedidos:", error);
    return null;
  }
};

export const showOrderNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
) => {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration) return;
  await registration.showNotification(title, {
    body,
    tag: "live-order-status",
    data,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
};

export const subscribeLiveOrderNotifications = async (
  token: string
): Promise<string | null> => {
  if (!isNotificationSupported()) return null;
  const permission = await ensureNotificationPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.getRegistration(SW_PATH) || await registerOrderServiceWorker();
  if (!registration) return null;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    if (!VAPID_PUBLIC_KEY) {
      console.warn("VITE_VAPID_PUBLIC_KEY no está configurada. No se pueden activar las notificaciones push.");
      return null;
    }
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  try {
    const subscriptionJSON = subscription.toJSON();
    if (!subscriptionJSON.endpoint) {
      console.error("La suscripción no tiene un endpoint válido");
      return null;
    }
    await registerLiveOrderPushSubscription(token, subscriptionJSON);
    return subscription.endpoint;
  } catch (error) {
    console.error("No se pudo registrar la suscripción de notificaciones:", error);
    return null;
  }
};

export const unsubscribeLiveOrderNotifications = async (
  token: string,
  endpoint?: string | null
) => {
  if (!isNotificationSupported()) return;
  try {
    const registration =
      (await navigator.serviceWorker.getRegistration(SW_PATH)) ||
      (await navigator.serviceWorker.ready.catch(() => null));
    const subscription = await registration?.pushManager.getSubscription();
    const targetEndpoint = endpoint || subscription?.endpoint;
    if (!targetEndpoint) return;

    await unregisterLiveOrderPushSubscription(token, targetEndpoint);
  } catch (error) {
    console.error("No se pudo eliminar la suscripción de notificaciones:", error);
  }
};

export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}
