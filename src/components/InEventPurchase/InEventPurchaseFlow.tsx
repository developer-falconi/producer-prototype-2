import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo, useAnimate, useDragControls, useMotionValue } from "framer-motion";
import { ComboEventDto, CouponEvent, EventDto, InEventPurchaseData, InEventPurchasePayload, LiveOrderStateEnum, ProductEventDto, ProductTypeEnum, StoredLiveOrderSnapshot } from "@/lib/types";
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
  const [purchaseData, setPurchaseData] = useState<InEventPurchaseData>({
    buyer: { docNumber: "", email: "", fullName: "" },
    products: [],
    combos: [],
    experiences: [],
    paymentMethod: 'mercadopago',
    total: 0,
  });

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

  const liveOrderStorageKey = useMemo(() => `produtik.live-order.${event.id}`, [event.id]);

  const persistLiveOrderSnapshot = useCallback((snapshot: StoredLiveOrderSnapshot | null) => {
    if (typeof window === "undefined") return;
    try {
      if (!snapshot) {
        window.localStorage.removeItem(liveOrderStorageKey);
      } else {
        window.localStorage.setItem(liveOrderStorageKey, JSON.stringify(snapshot));
      }
    } catch (err) {
      console.warn("No se pudo persistir el pedido en curso:", err);
    }
  }, [liveOrderStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(liveOrderStorageKey);
      if (stored) {
        const raw = JSON.parse(stored) as Partial<StoredLiveOrderSnapshot> & {
          purchaseId?: number;
          code?: number | string;
        };

        const pickupCode = raw.pickupCode ?? (raw.code != null ? String(raw.code) : null);
        const orderId = raw.orderId ?? raw.purchaseId ?? null;
        const token = typeof raw.token === "string" ? raw.token : null;

        if (pickupCode && orderId && raw.eventId && token) {
          const normalized: StoredLiveOrderSnapshot = {
            eventId: raw.eventId,
            orderId,
            token,
            pickupCode,
            paymentMethod: raw.paymentMethod ?? "cash",
            createdAt: raw.createdAt ?? new Date().toISOString(),
            notificationEndpoint: raw.notificationEndpoint ?? null,
          };
          setSavedOrder(normalized);
          setPurchaseCode(pickupCode);
        } else {
          window.localStorage.removeItem(liveOrderStorageKey);
        }
      }
    } catch (err) {
      console.warn("No pudimos leer el pedido guardado:", err);
    }
  }, [liveOrderStorageKey]);

  useEffect(() => {
    if (savedOrder && !purchaseCode) {
      setPurchaseCode(savedOrder.pickupCode);
    }
  }, [savedOrder, purchaseCode]);

  useEffect(() => {
    savedOrderRef.current = savedOrder;
  }, [savedOrder]);

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
    if (!isOpen) {
      setStep(Step.Banner);
      setPurchaseData({
        buyer: { docNumber: "", email: "", fullName: "" },
        products: [],
        combos: [],
        experiences: [],
        paymentMethod: "mercadopago",
        total: 0,
      });
      setError(null);
      setFullEventDetails(null);
      setIsGeneratingPreference(false);
      setIsSubmitting(false);
      setPurchaseCode(null);
      setAppliedCoupon(null);
      setMpPreferenceId(null);

      viewTrackedRef.current = false;
      beginCheckoutTrackedRef.current = false;
      lastCartRef.current = { productQtys: {}, comboQtys: {} };
      lastPaymentTrackedRef.current = null;
      mpPurchaseRegisteredRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !savedOrder) return;
    setStep(Step.PurchaseStatus);
  }, [isOpen, savedOrder]);

  const detachOrderNotifications = useCallback(async (order?: StoredLiveOrderSnapshot | null) => {
    const target = order ?? savedOrderRef.current;
    if (!target?.token) return;
    await unsubscribeLiveOrderNotifications(target.token, target.notificationEndpoint);
    delete notificationAttemptedRef.current[target.token];
  }, []);

  const handleCloseDrawer = async () => {
    await animate(scope.current, { opacity: [1, 0] }, { duration: 0.3 });

    const yStart = typeof y.get() === "number" ? y.get() : 0;
    await animate("#ticket-sheet", { y: [yStart, height] }, {
      ease: "easeInOut",
      duration: 0.3
    });

    onClose();
  };

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

  const handleCloseTracking = async () => {
    setStep(Step.Banner);
    setPurchaseData({
      buyer: { docNumber: "", email: "", fullName: "" },
      products: [],
      combos: [],
      experiences: [],
      paymentMethod: "mercadopago",
      total: 0,
    });
    setError(null);
    setFullEventDetails(null);
    setIsGeneratingPreference(false);
    setIsSubmitting(false);
    setPurchaseCode(null);
    setAppliedCoupon(null);
    setMpPreferenceId(null);

    viewTrackedRef.current = false;
    beginCheckoutTrackedRef.current = false;
    lastCartRef.current = { productQtys: {}, comboQtys: {} };
    lastPaymentTrackedRef.current = null;
    mpPurchaseRegisteredRef.current = false;

    localStorage.removeItem(liveOrderStorageKey);

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

    const snapshot: StoredLiveOrderSnapshot = {
      eventId: order.eventId,
      orderId: order.id,
      token: order.token,
      pickupCode: order.pickupCode,
      paymentMethod: method,
      createdAt: order.createdAt || new Date().toISOString(),
      notificationEndpoint: null,
    };

    setPurchaseCode(order.pickupCode);
    setSavedOrder(snapshot);
    lastStatusNotifiedRef.current = orderStatus;

    persistLiveOrderSnapshot(snapshot);

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
    subscribeLiveOrderNotifications
  ]);

  useEffect(() => {
    if (step !== Step.Review) return;

    const finalizePayment = async (params?: Record<string, any>) => {
      if (mpPurchaseRegisteredRef.current) return;
      mpPurchaseRegisteredRef.current = true;
      try {
        const txn = params?.collection_id ||
          params?.payment_id ||
          params?.preference_id ||
          mpPreferenceId ||
          `mp_${(fullEventDetails || event).id}_${Date.now()}`;

        await registerLivePurchase("mercadopago", { transactionId: String(txn) });
      } catch (error) {
        console.error("No pudimos confirmar el pago de MP:", error);
        toast.error("Mercado Pago confirmó el cobro pero no pudimos registrar el pedido. Contactanos.");
      }
    };

    const urlPaid = (() => {
      try {
        const usp = new URLSearchParams(window.location.search);
        return usp.get("paid") === "1";
      } catch { return false; }
    })();

    if (urlPaid) finalizePayment();

    const handler = (ev: MessageEvent) => {
      if (ev?.data?.type === "MP_PAYMENT_APPROVED") {
        const params = (ev.data && (ev.data.params || ev.data.payload)) || {};
        finalizePayment(params);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [step, fullEventDetails, event, mpPreferenceId, registerLivePurchase]);

  const clearLiveOrder = useCallback(() => {
    void detachOrderNotifications();
    setSavedOrder(null);
    setPurchaseCode(null);
    persistLiveOrderSnapshot(null);
    lastStatusNotifiedRef.current = null;
  }, [persistLiveOrderSnapshot, detachOrderNotifications]);

  const generatePreference = useCallback(async (): Promise<boolean> => {
    if (!hasMP || !fullEventDetails) {
      setError("Mercado Pago no está configurado para este evento.");
      return false;
    }
    if (totals.grandTotal <= 0) {
      setError("Agregá productos antes de generar el pago.");
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
    getCheckoutValue
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
              onStartPayment={handleCloseDrawer}
              onTrack={tracking.ui}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

