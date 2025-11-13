import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo, useAnimate, useDragControls, useMotionValue } from "framer-motion";
import { ComboEventDto, CouponEvent, EventDto, InEventPurchaseData, InEventPurchasePayload, LiveOrderStateEnum, LiveOrderSummary, ProductEventDto, ProductTypeEnum, StoredLiveOrderSnapshot } from "@/lib/types";
import { createLiveEventPreference, fetchProducerEventDetailData, submitLiveEventPurchase } from "@/lib/api";
import { subscribeLiveOrderNotifications, unsubscribeLiveOrderNotifications } from "@/lib/notifications";
import BuyerStep from "./BuyerStep";
import CatalogStep from "./CatalogStep";
import PaymentStep from "./PaymentStep";
import ReviewStep from "./ReviewStep";
import Spinner from "../Spinner";
import useMeasure from "react-use-measure";
import { ProgressBar } from "./ProgressBar";
import { NavigationButtons } from "../NavigationButtons";
import EventPurchaseBanner from "./EventPurchaseBanner";
import PurchaseStatus from "./PurchaseStatus";
import { useProducer } from "@/context/ProducerContext";
import { useTracking } from "@/hooks/use-tracking";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeOrder } from "@/hooks/use-realtime-order";
import {
  PendingLivePurchaseSnapshot,
  readPendingLivePurchase,
  readSavedOrderSnapshot,
  removeEventOrderSnapshot,
  removeSavedOrderSnapshot,
  writeEventOrderSnapshot,
  writePendingLivePurchase,
  writeSavedOrderSnapshot,
} from "@/lib/live-order-storage";

const DRAG_CLOSE_PX = 100;
const DRAG_CLOSE_VELOCITY = 800;
const TOUCH_PULL_CLOSE_PX = 100;

const Step = {
  Banner: 0,
  Buyer: 1,
  Catalog: 2,
  Payment: 3,
  Review: 4,
  PurchaseStatus: 5
} as const;

const APPROVED_RETURN_STATUSES = new Set(["approved", "accredited", "pagado", "paid"]);

export type StepKey = typeof Step[keyof typeof Step];

interface QuickInEventPurchaseProps {
  event: EventDto;
  isOpen: boolean;
  onClose: () => void;
}

export default function InEventPurchaseFlow({
  event,
  isOpen,
  onClose,
}: QuickInEventPurchaseProps) {
  const [step, setStep] = useState<StepKey>(Step.Banner);
  const buildInitialPurchaseData = useCallback((): InEventPurchaseData => ({
    buyer: { docNumber: "", email: "", fullName: "" },
    products: [],
    combos: [],
    experiences: [],
    paymentMethod: 'mercadopago',
    total: 0,
  }), []);

  const [purchaseData, setPurchaseData] = useState<InEventPurchaseData>(() => buildInitialPurchaseData());

  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [isGeneratingPreference, setIsGeneratingPreference] = useState(false);

  const [fullEventDetails, setFullEventDetails] = useState<EventDto | null>(null);
  const [purchaseCode, setPurchaseCode] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponEvent | null>(null);
  const [savedOrder, setSavedOrder] = useState<StoredLiveOrderSnapshot | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<PendingLivePurchaseSnapshot | null>(null);
  const [shouldDisplaySavedOrder, setShouldDisplaySavedOrder] = useState(true);

  const { order } = useRealtimeOrder(purchaseCode);

  const [scope, animate] = useAnimate();
  const [setSheetMeasureRef, { height }] = useMeasure();
  const sheetElRef = useRef<HTMLDivElement | null>(null);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  const mpPublicKey = useMemo(() => {
    return fullEventDetails?.oAuthMercadoPago?.mpPublicKey || null;
  }, [fullEventDetails]);

  const hasMP = Boolean(mpPublicKey);

  const availableProducts: ProductEventDto[] = fullEventDetails?.products ?? [];
  const availableCombos: ComboEventDto[] = fullEventDetails?.combos ?? [];

  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: "live" });

  const viewTrackedRef = useRef(false);
  const beginCheckoutTrackedRef = useRef(false);
  const lastPaymentTrackedRef = useRef<null | 'cash' | 'mercadopago'>(null);
  const lastCartRef = useRef<{
    productQtys: Record<number, number>;
    comboQtys: Record<number, number>;
  }>({ productQtys: {}, comboQtys: {} });
  const mpPurchaseRegisteredRef = useRef(false);
  const lastStatusNotifiedRef = useRef<LiveOrderStateEnum | null>(null);
  const savedOrderRef = useRef<StoredLiveOrderSnapshot | null>(null);
  const notificationAttemptedRef = useRef<Record<string, boolean>>({});
  const pendingPurchaseHydratedRef = useRef(false);

  const liveOrderStorageKey = useMemo(() => `produtik.live-order.${event.id}`, [event.id]);

  const syncPendingPurchaseFromStorage = useCallback(() => {
    const stored = readPendingLivePurchase();
    if (stored?.eventId === event.id) {
      setPendingPurchase(stored);
      return stored;
    }
    return null;
  }, [event.id]);

  const clearPendingPurchase = useCallback(() => {
    const stored = readPendingLivePurchase();
    if (stored && stored.eventId !== event.id) return;
    writePendingLivePurchase(null);
    setPendingPurchase(null);
  }, [event.id]);

  const persistPendingPurchase = useCallback((snapshot: PendingLivePurchaseSnapshot | null) => {
    if (!snapshot) {
      clearPendingPurchase();
      return;
    }
    writePendingLivePurchase(snapshot);
    setPendingPurchase(snapshot);
  }, [clearPendingPurchase]);

  const persistLiveOrderSnapshot = useCallback((snapshot: StoredLiveOrderSnapshot | null) => {
    if (typeof window === "undefined") return;
    try {
      if (!snapshot) {
        removeEventOrderSnapshot(event.id);
        const lastOrderId = savedOrderRef.current?.orderId;
        if (lastOrderId != null) {
          removeSavedOrderSnapshot(lastOrderId);
        }
      } else {
        writeEventOrderSnapshot(snapshot);
        writeSavedOrderSnapshot(snapshot);
      }
    } catch (err) {
      console.warn("No se pudo persistir el pedido en curso:", err);
    }
  }, [event.id]);

  const resetFlowState = useCallback(() => {
    setStep(Step.Banner);
    setPurchaseData(buildInitialPurchaseData());
    setAppliedCoupon(null);
    setMpPreferenceId(null);
    setError(null);
    setIsGeneratingPreference(false);
    setIsSubmitting(false);
    setPendingPurchase(null);
    pendingPurchaseHydratedRef.current = false;
    viewTrackedRef.current = false;
    beginCheckoutTrackedRef.current = false;
    lastCartRef.current = { productQtys: {}, comboQtys: {} };
    lastPaymentTrackedRef.current = null;
  }, [buildInitialPurchaseData]);

  useEffect(() => {
    syncPendingPurchaseFromStorage();
  }, [syncPendingPurchaseFromStorage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolveOrderParam = (): { raw: string | null; value: number | null } => {
      try {
        const usp = new URLSearchParams(window.location.search);
        const raw = usp.get("order");
        if (raw == null) return { raw: null, value: null };
        const numeric = Number(raw);
        return Number.isFinite(numeric) ? { raw, value: numeric } : { raw, value: null };
      } catch {
        return { raw: null, value: null };
      }
    };

    try {
      const stored = window.localStorage.getItem(liveOrderStorageKey);
      let rawSnapshot: Partial<StoredLiveOrderSnapshot> & {
        purchaseId?: number;
        code?: number | string;
      } | null = stored ? JSON.parse(stored) : null;

      const { raw: orderParam, value: orderParamValue } = resolveOrderParam();

      if (orderParamValue != null) {
        const matchesStored = rawSnapshot?.orderId === orderParamValue || rawSnapshot?.purchaseId === orderParamValue;
        if (!matchesStored) {
          const snapshot = readSavedOrderSnapshot(orderParamValue);
          if (snapshot && snapshot.eventId === event.id) {
            rawSnapshot = snapshot;
            window.localStorage.setItem(liveOrderStorageKey, JSON.stringify(snapshot));
          } else {
            rawSnapshot = null;
          }
        }
      }

      if (!rawSnapshot) return;

      const pickupCode = rawSnapshot.pickupCode ?? (rawSnapshot.code != null ? String(rawSnapshot.code) : null);
      const orderId = rawSnapshot.orderId ?? rawSnapshot.purchaseId ?? null;
      const token = typeof rawSnapshot.token === "string" ? rawSnapshot.token : null;

      if (pickupCode && orderId && rawSnapshot.eventId && token && rawSnapshot.eventId === event.id) {
        const normalized: StoredLiveOrderSnapshot = {
          eventId: rawSnapshot.eventId,
          orderId,
          token,
          pickupCode,
          paymentMethod: rawSnapshot.paymentMethod ?? "cash",
          createdAt: rawSnapshot.createdAt ?? new Date().toISOString(),
          notificationEndpoint: rawSnapshot.notificationEndpoint ?? null,
        };
        setSavedOrder(normalized);
        setPurchaseCode(pickupCode);
        if (orderParamValue != null && orderParamValue === orderId) {
          setShouldDisplaySavedOrder(true);
        }
      } else {
        window.localStorage.removeItem(liveOrderStorageKey);
      }
    } catch (err) {
      console.warn("No pudimos leer el pedido guardado:", err);
    }
  }, [liveOrderStorageKey, event.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const usp = new URLSearchParams(window.location.search);
      const orderParam = usp.get("order");
      const statusValue = (usp.get("collection_status") || usp.get("status") || "").toLowerCase();
      if (!orderParam || !statusValue) return;
      const orderId = Number(orderParam);
      if (!Number.isFinite(orderId)) return;
      const isApprovedStatus = APPROVED_RETURN_STATUSES.has(statusValue);

      if (!isApprovedStatus) {
        removeSavedOrderSnapshot(orderId);
        removeEventOrderSnapshot(event.id);
        setSavedOrder(null);
        savedOrderRef.current = null;
        setPurchaseCode(null);
        clearPendingPurchase();
        setShouldDisplaySavedOrder(false);
      } else {
        setShouldDisplaySavedOrder(true);
      }
    } catch (err) {
      console.warn("No pudimos procesar los par�metros de pago:", err);
    }
  }, [event.id, clearPendingPurchase]);

  useEffect(() => {
    if (savedOrder && !purchaseCode) {
      setPurchaseCode(savedOrder.pickupCode);
    }
  }, [savedOrder, purchaseCode]);

  useEffect(() => {
    savedOrderRef.current = savedOrder;
  }, [savedOrder]);

  const buildStoredSnapshot = useCallback((order: LiveOrderSummary, method: 'cash' | 'mercadopago'): StoredLiveOrderSnapshot => ({
    eventId: order.eventId,
    orderId: order.id,
    token: order.token,
    pickupCode: order.pickupCode,
    paymentMethod: method,
    createdAt: order.createdAt || new Date().toISOString(),
    notificationEndpoint: null,
  }), []);

  useEffect(() => {
    if (!pendingPurchase) {
      pendingPurchaseHydratedRef.current = false;
    }
  }, [pendingPurchase]);

  useEffect(() => {
    if (!isOpen) {
      pendingPurchaseHydratedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!savedOrder) return;
    if (savedOrder.notificationEndpoint) return;
    if (notificationAttemptedRef.current[savedOrder.token]) return;

    notificationAttemptedRef.current[savedOrder.token] = true;

    (async () => {
      const endpoint = await subscribeLiveOrderNotifications(savedOrder.token);
      if (endpoint) {
        const updatedSnapshot = { ...savedOrder, notificationEndpoint: endpoint };
        setSavedOrder(updatedSnapshot);
        persistLiveOrderSnapshot(updatedSnapshot);
      } else {
        delete notificationAttemptedRef.current[savedOrder.token];
      }
    })();
  }, [savedOrder, persistLiveOrderSnapshot, subscribeLiveOrderNotifications]);

  const updatePurchaseData = (newData: Partial<InEventPurchaseData>) => {
    setPurchaseData(prevData => ({ ...prevData, ...newData }));
  };

  const updateItemQuantity = (type: ProductTypeEnum, id: number, nextQty: number) => {
    if (type === ProductTypeEnum.PRODUCT) {
      const product = availableProducts.find(p => p.id === id);
      if (!product) return;

      let newProducts = [...purchaseData.products];
      const idx = newProducts.findIndex(p => p.product.id === id);

      if (nextQty > 0) {
        const nextItem = { quantity: nextQty, product };
        if (idx > -1) newProducts[idx] = nextItem;
        else newProducts.push(nextItem);
      } else if (idx > -1) {
        newProducts.splice(idx, 1);
      }
      updatePurchaseData({ products: newProducts });

    } else if (type === ProductTypeEnum.COMBO) {
      const combo = availableCombos.find(c => c.id === id);
      if (!combo) return;

      let newCombos = [...purchaseData.combos];
      const idx = newCombos.findIndex(c => c.combo.id === id);

      if (nextQty > 0) {
        const nextItem = { quantity: nextQty, combo };
        if (idx > -1) newCombos[idx] = nextItem;
        else newCombos.push(nextItem);
      } else if (idx > -1) {
        newCombos.splice(idx, 1);
      }
      updatePurchaseData({ combos: newCombos });
    }
  };

  const totals = useMemo(() => {
    const productsTotal = purchaseData.products.reduce((acc, item) => {
      const price = Number(item.product.price) || 0;
      const discount = Number(item.product.discountPercentage) || 0;
      const effectivePrice = price * (1 - discount / 100);
      return acc + effectivePrice * item.quantity;
    }, 0);

    const combosTotal = purchaseData.combos.reduce((acc, item) => {
      const price = Number(item.combo.price) || 0;
      return acc + price * item.quantity;
    }, 0);

    const experiencesTotal = purchaseData.experiences.reduce((acc, item) => {
      const price = Number(item.experience.price) || 0;
      return acc + price * item.quantity;
    }, 0);

    const grandTotal = productsTotal + combosTotal + experiencesTotal;
    return { subtotal: grandTotal, grandTotal };
  }, [purchaseData.products, purchaseData.combos, purchaseData.experiences]);

  const handleShare = useCallback(async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const id = fullEventDetails?.id ?? event.id;
      const url = `${origin}/events?event=${id}`;
      const title = fullEventDetails?.name ?? event.name;
      const text = `Mirá este evento: ${title}`;

      if (navigator.share) {
        await navigator.share({ title, text, url });
        tracking.ui("share_event_native", { event_id: id, success: true });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado al portapapeles");
        tracking.ui("share_event_copy", { event_id: id });
      }
    } catch (e: any) {
      if (String(e?.name) !== "AbortError") {
        toast.error("No se pudo compartir");
        tracking.ui("share_event_error", { message: String(e?.message || e) });
      }
    }
  }, [fullEventDetails, event.id, event.name, tracking]);

  useEffect(() => {
    if (purchaseData.total !== totals.grandTotal) {
      setPurchaseData(prev => ({ ...prev, total: totals.grandTotal }));
    }
  }, [totals.grandTotal, purchaseData.total]);

  useEffect(() => {
    if (isOpen && fullEventDetails && !viewTrackedRef.current) {
      tracking.viewEvent(fullEventDetails);
      viewTrackedRef.current = true;
    }
  }, [isOpen, fullEventDetails, tracking]);

  useEffect(() => {
    if (isOpen && !fullEventDetails) {
      (async () => {
        try {
          setLoadingDetails(true);
          const resp = await fetchProducerEventDetailData(event.id);
          if (resp.success && resp.data) setFullEventDetails(resp.data);
          else setError("No pudimos cargar los detalles del evento.");
        } catch (err) {
          console.error("Error fetching event details:", err);
          setError("Error de red.");
        } finally {
          setLoadingDetails(false);
        }
      })();
    }
  }, [isOpen, event.id, fullEventDetails]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!pendingPurchase || pendingPurchase.eventId !== event.id) return;
    if (!fullEventDetails) return;
    if (pendingPurchaseHydratedRef.current) return;
    if (savedOrder) return;

    const products = (pendingPurchase.payload.products || [])
      .map(item => {
        const product = fullEventDetails.products?.find(p => p.id === item.productId);
        return product ? { product, quantity: item.quantity } : null;
      })
      .filter(Boolean) as typeof purchaseData.products;

    const combos = (pendingPurchase.payload.combos || [])
      .map(item => {
        const combo = fullEventDetails.combos?.find(c => c.id === item.comboId);
        return combo ? { combo, quantity: item.quantity } : null;
      })
      .filter(Boolean) as typeof purchaseData.combos;

    const experiences = (pendingPurchase.payload.experiences || [])
      .map(item => {
        const parent = fullEventDetails.experiences?.find(exp =>
          exp.children?.some(child => child.id === item.experienceId)
        );
        const experience = parent?.children.find(child => child.id === item.experienceId);
        return parent && experience ? { parent, experience, quantity: item.quantity } : null;
      })
      .filter(Boolean) as typeof purchaseData.experiences;

    setPurchaseData({
      buyer: pendingPurchase.payload.client,
      products,
      combos,
      experiences,
      paymentMethod: "mercadopago",
      total: pendingPurchase.payload.total,
    });

    setAppliedCoupon(pendingPurchase.coupon ?? null);
    setMpPreferenceId(prev => prev || pendingPurchase.preferenceId || null);
    setStep(prev => (prev === Step.PurchaseStatus ? prev : Step.Review));
    pendingPurchaseHydratedRef.current = true;
  }, [pendingPurchase, fullEventDetails, event.id, savedOrder]);

  useEffect(() => {
    const hasOrderParam = (() => {
      try {
        const usp = new URLSearchParams(window.location.search);
        return usp.has("order");
      } catch {
        return false;
      }
    })();
    if (hasOrderParam) {
      setShouldDisplaySavedOrder(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetFlowState();
      setFullEventDetails(null);
      mpPurchaseRegisteredRef.current = false;
      clearPendingPurchase();
      setShouldDisplaySavedOrder(true);
    }
  }, [isOpen, resetFlowState, clearPendingPurchase]);

  useEffect(() => {
    if (!isOpen || !savedOrder) return;
    if (!shouldDisplaySavedOrder) return;
    setStep(Step.PurchaseStatus);
  }, [isOpen, savedOrder, shouldDisplaySavedOrder]);

  const detachOrderNotifications = useCallback(async (order?: StoredLiveOrderSnapshot | null) => {
    const target = order ?? savedOrderRef.current;
    if (!target?.token) return;
    await unsubscribeLiveOrderNotifications(target.token, target.notificationEndpoint);
    delete notificationAttemptedRef.current[target.token];
  }, []);

  const handleCloseDrawer = useCallback(async () => {
    await animate(scope.current, { opacity: [1, 0] }, { duration: 0.3 });

    const yStart = typeof y.get() === "number" ? y.get() : 0;
    await animate("#ticket-sheet", { y: [yStart, height] }, {
      ease: "easeInOut",
      duration: 0.3
    });

    onClose();
  }, [animate, scope, y, height, onClose]);

  const onDragEndSheet = async (_: any, info: PanInfo) => {
    const dragged = info.offset.y;
    const velocity = info.velocity.y;

    if (dragged > DRAG_CLOSE_PX || velocity > DRAG_CLOSE_VELOCITY) {
      await handleCloseDrawer();
    } else {
      await animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  const handlePointerDown = (event: any) => {
    dragControls.start(event);
  };

  const handleStartExternalPayment = useCallback(async () => {
    setShouldDisplaySavedOrder(false);
    setSavedOrder(null);
    savedOrderRef.current = null;
    setPurchaseCode(null);
    resetFlowState();
    clearPendingPurchase();
    await handleCloseDrawer();
  }, [resetFlowState, clearPendingPurchase, handleCloseDrawer]);

  const clearLiveOrder = useCallback(() => {
    void detachOrderNotifications();
    setSavedOrder(null);
    setPurchaseCode(null);
    persistLiveOrderSnapshot(null);
    lastStatusNotifiedRef.current = null;
    clearPendingPurchase();
    setShouldDisplaySavedOrder(true);
    savedOrderRef.current = null;
  }, [detachOrderNotifications, persistLiveOrderSnapshot, clearPendingPurchase]);

  const handleCloseTracking = async () => {
    resetFlowState();
    setFullEventDetails(null);
    setPurchaseCode(null);
    mpPurchaseRegisteredRef.current = false;
    clearLiveOrder();
    onClose();
  };

  const handleClearOrder = () => {
    handleCloseTracking();
  };

  useEffect(() => {
    if (!fullEventDetails) return;
    const prev = lastCartRef.current;

    const currentProducts: Record<number, number> = {};
    purchaseData.products.forEach(it => { currentProducts[it.product.id] = it.quantity; });
    Object.entries(currentProducts).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      const prevQty = prev.productQtys[id] ?? 0;
      const delta = qty - prevQty;
      if (delta > 0) {
        const item = purchaseData.products.find(p => p.product.id === id)!;
        tracking.addProduct(fullEventDetails, item.product, delta);
      }
    });

    const currentCombos: Record<number, number> = {};
    purchaseData.combos.forEach(it => { currentCombos[it.combo.id] = it.quantity; });
    Object.entries(currentCombos).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      const prevQty = prev.comboQtys[id] ?? 0;
      const delta = qty - prevQty;
      if (delta > 0) {
        const item = purchaseData.combos.find(c => c.combo.id === id)!;
        tracking.addCombo(fullEventDetails, item.combo, delta);
      }
    });

    lastCartRef.current.productQtys = currentProducts;
    lastCartRef.current.comboQtys = currentCombos;
  }, [fullEventDetails, purchaseData.products, purchaseData.combos, tracking]);

  const buildTrackingItems = () => {
    const items: Array<{ product?: ProductEventDto; combo?: ComboEventDto; qty?: number }> = [];
    purchaseData.products.forEach(p => { if (p.quantity > 0) items.push({ product: p.product, qty: p.quantity }); });
    purchaseData.combos.forEach(c => { if (c.quantity > 0) items.push({ combo: c.combo, qty: c.quantity }); });
    return items;
  };
  const getCheckoutCoupon = (): string | null => (appliedCoupon?.id != null ? String(appliedCoupon.id) : null);
  const getCheckoutValue = (): number => Number(totals.subtotal || 0);

  useEffect(() => {
    if (!fullEventDetails) return;
    if (step === Step.Review && !beginCheckoutTrackedRef.current) {
      tracking.beginCheckout(fullEventDetails, buildTrackingItems(), {
        coupon: getCheckoutCoupon(),
        value: getCheckoutValue(),
      });
      beginCheckoutTrackedRef.current = true;
    }
  }, [step, fullEventDetails, purchaseData.products, purchaseData.combos, tracking]);

  const handlePaymentSelected = (method: 'cash' | 'mercadopago') => {
    updatePurchaseData({ paymentMethod: method });

    if (!fullEventDetails) return;
    if (method !== "mercadopago") {
      clearPendingPurchase();
    }

    if (lastPaymentTrackedRef.current !== method) {
      lastPaymentTrackedRef.current = method;

      const items = buildTrackingItems();

      tracking.addPaymentInfo(
        fullEventDetails,
        items,
        {
          paymentType: method === 'cash' ? 'cash' : 'mercadopago',
          value: Number(totals.subtotal || 0),
          coupon: appliedCoupon?.id != null ? String(appliedCoupon.id) : null,
        }
      );

      tracking.ui('payment_method_selected_live', { method });
    }
  };

  const buildPurchasePayload = useCallback((): InEventPurchasePayload => ({
    client: purchaseData.buyer,
    products: purchaseData.products.map(p => ({ productId: p.product.id, quantity: p.quantity })),
    combos: purchaseData.combos.map(c => ({ comboId: c.combo.id, quantity: c.quantity })),
    experiences: purchaseData.experiences.map(exp => ({ experienceId: exp.experience.id, quantity: exp.quantity })),
    total: totals.grandTotal,
    coupon: appliedCoupon?.id || null
  }), [purchaseData, totals.grandTotal, appliedCoupon]);

  const registerLivePurchase = useCallback(async (
    method: 'cash' | 'mercadopago',
    options?: { transactionId?: string }
  ) => {
    const payload = buildPurchasePayload();
    const result = await submitLiveEventPurchase(payload, event.id);

    if (!result.success || !result.data?.order) {
      throw new Error(result.message || "No pudimos registrar el pedido");
    }

    const { order, voucher } = result.data;
    const orderStatus = (order.status || "PENDING") as LiveOrderStateEnum;

    const snapshot = buildStoredSnapshot(order, method);

    setPurchaseCode(order.pickupCode);
    setSavedOrder(snapshot);
    setShouldDisplaySavedOrder(true);
    lastStatusNotifiedRef.current = orderStatus;

    persistLiveOrderSnapshot(snapshot);
    clearPendingPurchase();

    notificationAttemptedRef.current[order.token] = true;
    (async () => {
      const endpoint = await subscribeLiveOrderNotifications(order.token);
      if (endpoint) {
        const updatedSnapshot = { ...snapshot, notificationEndpoint: endpoint };
        setSavedOrder(updatedSnapshot);
        persistLiveOrderSnapshot(updatedSnapshot);
      } else {
        delete notificationAttemptedRef.current[order.token];
      }
    })();

    tracking.purchase(fullEventDetails || event, {
      transactionId: options?.transactionId || String(voucher?.id ?? order.id),
      value: getCheckoutValue(),
      items: buildTrackingItems(),
      coupon: getCheckoutCoupon(),
    });

    setStep(Step.PurchaseStatus);
    return order;
  }, [
    buildPurchasePayload,
    event,
    totals.grandTotal,
    persistLiveOrderSnapshot,
    tracking,
    fullEventDetails,
    getCheckoutValue,
    buildTrackingItems,
    getCheckoutCoupon,
    subscribeLiveOrderNotifications,
    clearPendingPurchase,
    buildStoredSnapshot
  ]);

  const finalizeMpPayment = useCallback(async (params?: Record<string, any>) => {
    if (mpPurchaseRegisteredRef.current) return;
    mpPurchaseRegisteredRef.current = true;
    try {
      const txn = params?.collection_id ||
        params?.payment_id ||
        params?.preference_id ||
        mpPreferenceId ||
        `mp_${(fullEventDetails || event).id}_${Date.now()}`;

      await registerLivePurchase("mercadopago", { transactionId: String(txn) });
      setShouldDisplaySavedOrder(true);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        ["paid", "status", "collection_status"].forEach((key) => url.searchParams.delete(key));
        const nextSearch = url.searchParams.toString();
        const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
        window.history.replaceState({}, document.title, nextUrl);
      }
    } catch (error) {
      mpPurchaseRegisteredRef.current = false;
      console.error("No pudimos confirmar el pago de MP:", error);
      toast.error("Mercado Pago confirm� el cobro pero no pudimos registrar el pedido. Contactanos.");
    }
  }, [registerLivePurchase, mpPreferenceId, fullEventDetails, event]);

  useEffect(() => {
    if (step !== Step.Review) return;
    if (purchaseData.paymentMethod !== "mercadopago") return;

    const handler = (ev: MessageEvent) => {
      if (ev?.data?.type === "MP_PAYMENT_APPROVED") {
        const params = (ev.data && (ev.data.params || ev.data.payload)) || {};
        finalizeMpPayment(params);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [step, purchaseData.paymentMethod, finalizeMpPayment]);

  useEffect(() => {
    if (mpPurchaseRegisteredRef.current) return;
    if (purchaseData.paymentMethod !== "mercadopago") return;

    let paidFromUrl = false;
    let params: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const usp = new URLSearchParams(window.location.search);
      const status = (usp.get("collection_status") || usp.get("status") || "").toLowerCase();
      const paidFlag = usp.get("paid");
      paidFromUrl = paidFlag === "1" || status === "approved";
      usp.forEach((value, key) => {
        params[key] = value;
      });
    }

    if (!paidFromUrl) return;
    if (step !== Step.Review) {
      if (!pendingPurchase || pendingPurchase.eventId !== event.id) return;
    }

    finalizeMpPayment(params);
  }, [step, pendingPurchase, purchaseData.paymentMethod, finalizeMpPayment, event.id]);

  const generatePreference = useCallback(async (): Promise<boolean> => {
    if (!hasMP || !fullEventDetails) {
      setError("Mercado Pago no está configurado para este evento.");
      return false;
    }
    if (totals.grandTotal <= 0) {
      setError("Agrega productos antes de generar el pago.");
      return false;
    }

    setIsGeneratingPreference(true);
    setError(null);

    try {
      const payload: InEventPurchasePayload = {
        client: purchaseData.buyer,
        products: purchaseData.products.map(p => ({ productId: p.product.id, quantity: p.quantity })),
        combos: purchaseData.combos.map(c => ({ comboId: c.combo.id, quantity: c.quantity })),
        experiences: purchaseData.experiences.map(exp => ({ experienceId: exp.experience.id, quantity: exp.quantity })),
        total: totals.grandTotal,
        coupon: appliedCoupon?.id || null
      };

      const res = await createLiveEventPreference(fullEventDetails!.id, payload);
      if (res.success) {
        setMpPreferenceId(res.data.preferenceId);
        let pendingOrderId: number | null = null;
        if (res.data.order) {
          const snapshot = buildStoredSnapshot(res.data.order, "mercadopago");
          pendingOrderId = res.data.order.id;
          savedOrderRef.current = snapshot;
          setSavedOrder(snapshot);
          setPurchaseCode(snapshot.pickupCode);
          persistLiveOrderSnapshot(snapshot);
          setShouldDisplaySavedOrder(false);
        }
        persistPendingPurchase({
          eventId: fullEventDetails!.id,
          orderId: pendingOrderId,
          payload,
          preferenceId: res.data.preferenceId,
          coupon: appliedCoupon,
          createdAt: new Date().toISOString(),
        });

        if (fullEventDetails && !beginCheckoutTrackedRef.current) {
          tracking.beginCheckout(fullEventDetails, buildTrackingItems(), {
            coupon: getCheckoutCoupon(),
            value: getCheckoutValue(),
          });
          beginCheckoutTrackedRef.current = true;
        }

        setStep(Step.Review);
        return true;
      }
      setError(res.message || "No pudimos generar el link de pago.");
      return false;
    } catch (err) {
      console.error('Error contacting Mercado Pago for preference:', err);
      setError("Error al generar el link de pago. Intentá de nuevo.");
      return false;
    } finally {
      setIsGeneratingPreference(false);
    }
  }, [
    hasMP,
    fullEventDetails,
    totals.grandTotal,
    purchaseData,
    appliedCoupon,
    tracking,
    buildTrackingItems,
    getCheckoutCoupon,
    getCheckoutValue,
    persistPendingPurchase,
    persistLiveOrderSnapshot,
    buildStoredSnapshot
  ]);

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await registerLivePurchase('cash');
    } catch (error) {
      console.error(error);
      toast.error("No pudimos registrar tu pedido. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < Step.Review) {
      setStep((prevStep) => (prevStep + 1) as StepKey);
    }
  };

  const handlePrevious = () => {
    if (step > Step.Buyer) {
      setStep((prevStep) => (prevStep - 1) as StepKey);
    }
  };

  const canProceed = () => {
    switch (step) {
      case Step.Banner:
        return true;
      case Step.Buyer: {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaseData.buyer.email);
        const docOk = purchaseData.buyer.docNumber.length >= 6 && purchaseData.buyer.docNumber.length <= 12;
        const nameOk = purchaseData.buyer.fullName.trim().length >= 6;
        return emailOk && docOk && nameOk;
      }
      case Step.Catalog:
        return purchaseData.products.length > 0 || purchaseData.combos.length > 0;
      case Step.Payment:
        return totals.subtotal > 0;
      case Step.Review:
        return true;
      default:
        return false;
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case Step.Banner:
        return <EventPurchaseBanner />;
      case Step.Buyer:
        return (
          <BuyerStep
            buyer={purchaseData.buyer}
            setBuyer={(newBuyer) => updatePurchaseData({ buyer: newBuyer })}
          />
        );
      case Step.Catalog:
        return (
          <CatalogStep
            products={availableProducts}
            combos={availableCombos}
            selectedProducts={purchaseData.products}
            selectedCombos={purchaseData.combos}
            updateItemQuantity={updateItemQuantity}
          />
        );
      case Step.Payment:
        return (
          <PaymentStep
            hasMP={hasMP}
            subtotal={totals.subtotal}
            onPaymentMethodSelected={handlePaymentSelected}
          />
        );
      case Step.Review:
        return <ReviewStep
          eventData={fullEventDetails}
          purchaseData={purchaseData}
          couponId={appliedCoupon?.id ? appliedCoupon.id : null}
        />;
      case Step.PurchaseStatus:
        return (
          <PurchaseStatus
            purchaseCode={purchaseCode}
            pendingOrder={order}
            onClose={onClose}
            onClearOrder={handleClearOrder}
          />
        );
      default:
        return null;
    }
  };

  const setSheetRef = useCallback((node: HTMLDivElement | null) => {
    setSheetMeasureRef(node);
    sheetElRef.current = node;
  }, [setSheetMeasureRef]);

  useEffect(() => {
    if (!isOpen) return;

    const isPhone = typeof window !== 'undefined'
      ? (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
      : false;

    if (!isPhone) return;

    const sheet = sheetElRef?.current as HTMLElement | null;
    if (!sheet) return;

    const getScrollableAncestor = (start: Element | null): HTMLElement | null => {
      let el: Element | null = start;
      while (el && el !== sheet) {
        const style = window.getComputedStyle(el as HTMLElement);
        const oy = style.overflowY;
        if ((oy === 'auto' || oy === 'scroll') && (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight) {
          return el as HTMLElement;
        }
        el = el.parentElement;
      }
      return scrollableContentRef.current;
    };

    let startY = 0;
    let startX = 0;
    let startedAtTop = false;
    let closingTriggered = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isOpen) return;
      const t = e.touches[0];
      startY = t.clientY;
      startX = t.clientX;
      closingTriggered = false;

      const target = e.target as Element | null;
      const scrollable = getScrollableAncestor(target);
      const st = scrollable ? scrollable.scrollTop : 0;
      startedAtTop = (st <= 0);
    };

    const handleTouchMove = async (e: TouchEvent) => {
      if (!isOpen || closingTriggered === true) return;

      const t = e.touches[0];
      const dy = t.clientY - startY;
      const dx = t.clientX - startX;

      const isMostlyVertical = Math.abs(dy) > Math.abs(dx) * 1.2;

      if (startedAtTop && isMostlyVertical && dy > TOUCH_PULL_CLOSE_PX) {
        closingTriggered = true;
        try { e.preventDefault(); } catch { }
        await handleCloseDrawer();
      }
    };

    const handleTouchEnd = () => {
      startY = 0;
      startX = 0;
      startedAtTop = false;
      closingTriggered = false;
    };

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true });
    sheet.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart as any);
      sheet.removeEventListener('touchmove', handleTouchMove as any);
      sheet.removeEventListener('touchend', handleTouchEnd as any);
      sheet.removeEventListener('touchcancel', handleTouchEnd as any);
    };
  }, [isOpen, sheetElRef, handleCloseDrawer]);

  useEffect(() => {
    if (!isClosing) return;

    let cancelled = false;

    (async () => {
      await animate(scope.current, { opacity: [1, 0] }, { duration: 0.3 });

      const yStart = typeof y.get() === "number" ? y.get() : 0;
      await animate("#ticket-sheet", { y: [yStart, height] }, {
        ease: "easeInOut",
        duration: 0.3
      });

      if (cancelled) return;

      setStep(Step.Banner);
      setFullEventDetails(null);
      setError(null);
      viewTrackedRef.current = false;
      beginCheckoutTrackedRef.current = false;
      lastCartRef.current = { productQtys: {}, comboQtys: {} };
      lastPaymentTrackedRef.current = null;

      onClose();

      setIsClosing(false);
    })();

    return () => { cancelled = true; };
  }, [isClosing, animate, scope, y, height, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-container"
          ref={scope}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-end justify-center z-40 touch-none"
        >
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-40 touch-none"
            onClick={handleCloseDrawer}
          />
          <motion.div
            id="ticket-sheet"
            ref={setSheetRef}
            className="relative mx-auto w-full max-w-lg md:max-w-4xl h-[85vh] bg-zinc-900 rounded-t-lg shadow-xl flex flex-col z-50 overflow-hidden touch-none"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={onDragEndSheet}
            onPointerDown={handlePointerDown}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'auto', y }}
          >
            <div className="flex justify-center mt-1 cursor-grab">
              <button className="h-2 w-14 cursor-grab touch-none rounded-full bg-gray-300 active:cursor-grabbing"></button>
            </div>

            {step === Step.Banner && (
              <div className="absolute top-6 right-2 md:top-5 md:right-5 z-50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black text-white border border-white/20 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition"
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  title="Compartir evento"
                  aria-label="Compartir evento"
                >
                  <Send className="h-5 w-5 text-white" />
                </Button>
              </div>
            )}

            <div
              ref={scrollableContentRef}
              className="flex-grow pt-1 relative overflow-x-hidden"
              style={{ overflowY: 'auto' }}
            >
              {loadingDetails ? (
                <Spinner textColor="text-white" borderColor="border-transparent border-t-white" />
              ) : (
                <>
                  {error && (
                    <div className="mx-4 my-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200 text-sm">
                      {error}
                    </div>
                  )}
                  {step > Step.Banner && step !== Step.PurchaseStatus && (
                    <ProgressBar
                      currentStep={step}
                      steps={[Step.Buyer, Step.Catalog, Step.Payment, Step.Review]}
                    />
                  )}
                  <div className="animate-fade-in">{renderCurrentStep()}</div>
                </>
              )}
            </div>

            <NavigationButtons
              currentStep={step}
              totalSteps={Object.keys(Step).length - 1}
              canProceed={canProceed()}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onComplete={handleComplete}
              onGeneratePreference={generatePreference}
              isLoading={loadingDetails}
              isSubmitting={isSubmitting || (purchaseData.paymentMethod === "mercadopago" && isGeneratingPreference)}
              isMercadoPagoSelected={purchaseData.paymentMethod === "mercadopago"}
              isGeneratingPreference={isGeneratingPreference}
              isConfirmationStep={step === Step.Review}
              isPaymentMethodStep={step === Step.Payment}
              mpPreferenceId={mpPreferenceId}
              mpPublicKey={mpPublicKey || ""}
              eventStarted={true}
              onStartPayment={handleStartExternalPayment}
              onTrack={tracking.ui}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}






