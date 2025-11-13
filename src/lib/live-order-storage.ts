import { CouponEvent, InEventPurchasePayload, StoredLiveOrderSnapshot } from "./types";

export const PENDING_LIVE_PURCHASE_KEY = "produtik.pending-live-order";
const ORDER_SNAPSHOT_PREFIX = "produtik.live-order.order.";
const EVENT_SNAPSHOT_PREFIX = "produtik.live-order.";

const orderSnapshotKey = (orderId: string | number) => `${ORDER_SNAPSHOT_PREFIX}${orderId}`;
const eventSnapshotKey = (eventId: number) => `${EVENT_SNAPSHOT_PREFIX}${eventId}`;

export interface PendingLivePurchaseSnapshot {
  eventId: number;
  orderId: number | null;
  payload: InEventPurchasePayload;
  preferenceId: string | null;
  coupon: CouponEvent | null;
  createdAt: string;
}

export function readPendingLivePurchase(): PendingLivePurchaseSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(PENDING_LIVE_PURCHASE_KEY);
    return stored ? (JSON.parse(stored) as PendingLivePurchaseSnapshot) : null;
  } catch (err) {
    console.warn("No se pudo leer la compra pendiente:", err);
    return null;
  }
}

export function writePendingLivePurchase(snapshot: PendingLivePurchaseSnapshot | null) {
  if (typeof window === "undefined") return;
  try {
    if (!snapshot) {
      window.localStorage.removeItem(PENDING_LIVE_PURCHASE_KEY);
      return;
    }
    window.localStorage.setItem(PENDING_LIVE_PURCHASE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn("No se pudo guardar la compra pendiente:", err);
  }
}

export function readSavedOrderSnapshot(orderId: string | number): StoredLiveOrderSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(orderSnapshotKey(orderId));
    return stored ? (JSON.parse(stored) as StoredLiveOrderSnapshot) : null;
  } catch (err) {
    console.warn("No se pudo leer la orden guardada:", err);
    return null;
  }
}

export function writeSavedOrderSnapshot(snapshot: StoredLiveOrderSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(orderSnapshotKey(snapshot.orderId), JSON.stringify(snapshot));
  } catch (err) {
    console.warn("No se pudo guardar la orden en localStorage:", err);
  }
}

export function removeSavedOrderSnapshot(orderId: string | number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(orderSnapshotKey(orderId));
  } catch (err) {
    console.warn("No se pudo eliminar la orden guardada:", err);
  }
}

export function writeEventOrderSnapshot(snapshot: StoredLiveOrderSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(eventSnapshotKey(snapshot.eventId), JSON.stringify(snapshot));
  } catch (err) {
    console.warn("No se pudo guardar la orden del evento:", err);
  }
}

export function readEventOrderSnapshot(eventId: number): StoredLiveOrderSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(eventSnapshotKey(eventId));
    return stored ? (JSON.parse(stored) as StoredLiveOrderSnapshot) : null;
  } catch (err) {
    console.warn("No se pudo leer la orden del evento:", err);
    return null;
  }
}

export function removeEventOrderSnapshot(eventId: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(eventSnapshotKey(eventId));
  } catch (err) {
    console.warn("No se pudo limpiar la orden del evento:", err);
  }
}
