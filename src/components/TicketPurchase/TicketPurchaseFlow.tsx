import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TicketSelection } from './TicketSelection';
import { AttendeeData } from './AttendeeData';
import { ContactInfo } from './ContactInfo';
import { PaymentMethod } from './PaymentMethod';
import { OrderSummary } from './OrderSummary';
import { ProgressBar } from './ProgressBar';
import { ClientData, CouponEvent, EventDto, GenderEnum, Prevent, PreventStatusEnum, PurchaseComboItem, PurchaseData, PurchaseProductItem } from '@/lib/types';
import { PurchaseStatus } from './PurchaseStatus';
import { NavigationButtons } from '../NavigationButtons';
import { motion, AnimatePresence, PanInfo, useDragControls, useAnimate, useMotionValue } from "framer-motion";
import { createPreference, fetchProducerEventDetailData, submitTicketForm } from '@/lib/api';
import Spinner from '../Spinner';
import { Button } from '../ui/button';
import { EventInfo } from './EventInfo';
import useMeasure from "react-use-measure";
import { ProductSelection } from './ProductSelection';
import { toast } from 'sonner';
import { toNum } from '@/lib/utils';
import { useProducer } from '@/context/ProducerContext';
import { useTracking } from '@/hooks/use-tracking';
import { Send } from 'lucide-react';

const DRAG_CLOSE_PX = 100;
const DRAG_CLOSE_VELOCITY = 800;
const TOUCH_PULL_CLOSE_PX = 100;

const steps = [
  'Seleccionar Entradas',
  'Datos de Asistentes',
  'Información de Contacto',
  'Productos',
  'Método de Pago',
  'Confirmación',
  'Resumen',
  'Estado'
];

interface TicketPurchaseFlowProps {
  initialEvent: EventDto;
  promoterKey: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketPurchaseFlow: React.FC<TicketPurchaseFlowProps> = ({ initialEvent, promoterKey, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const [purchaseData, setPurchaseData] = useState<PurchaseData>({
    selectedPrevent: null,
    ticketQuantity: 0,
    clients: [],
    products: [],
    combos: [],
    email: '',
    comprobante: undefined,
    paymentMethod: null,
    promoter: promoterKey,
    coupon: null,
    total: 0
  });

  const [fullEventDetails, setFullEventDetails] = useState<EventDto | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<{ status: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState(false);

  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [mpGeneratingPreference, setMpGeneratingPreference] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponEvent | null>(null);

  // motion
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  const [scope, animate] = useAnimate();
  const [setSheetMeasureRef, { height }] = useMeasure();
  const sheetElRef = useRef<HTMLDivElement | null>(null);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  const mpPublicKey = useMemo(() => {
    return fullEventDetails?.oAuthMercadoPago?.mpPublicKey || null;
  }, [fullEventDetails]);

  const dynamicSteps = useMemo(() => {
    if (!fullEventDetails) return steps;
    let currentDynamicSteps = [...steps];
    if (fullEventDetails.products?.length === 0 && fullEventDetails.combos?.length === 0) {
      currentDynamicSteps = currentDynamicSteps.filter(step => step !== 'Productos');
    }
    return currentDynamicSteps;
  }, [fullEventDetails]);

  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: 'prevent' });

  const viewTrackedRef = useRef(false);
  const beginCheckoutTrackedRef = useRef(false);
  const lastCartRef = useRef<{
    preventId?: number;
    preventQty: number;
    productQtys: Record<number, number>;
    comboQtys: Record<number, number>;
  }>({
    preventId: undefined,
    preventQty: 0,
    productQtys: {},
    comboQtys: {}
  });

  const buildTrackingItems = useCallback(() => {
    const items: Array<{ prevent?: Prevent; product?: any; combo?: any; qty?: number }> = [];
    if (purchaseData.selectedPrevent && purchaseData.ticketQuantity > 0) {
      items.push({ prevent: purchaseData.selectedPrevent, qty: purchaseData.ticketQuantity });
    }
    purchaseData.products.forEach(p => {
      if (p.quantity > 0) items.push({ product: p.product, qty: p.quantity });
    });
    purchaseData.combos.forEach(c => {
      if (c.quantity > 0) items.push({ combo: c.combo, qty: c.quantity });
    });
    return items;
  }, [purchaseData.selectedPrevent, purchaseData.ticketQuantity, purchaseData.products, purchaseData.combos]);

  const getCheckoutCoupon = useCallback((): string | null => {
    if (purchaseData.coupon?.id != null) return String(purchaseData.coupon.id);
    if (purchaseData.promoter) return purchaseData.promoter;
    return null;
  }, [purchaseData.coupon, purchaseData.promoter]);

  const getCheckoutValue = useCallback((): number => {
    const v = purchaseData.total;
    return toNum(v);
  }, [purchaseData.total]);

  useEffect(() => {
    if (isOpen && fullEventDetails && !viewTrackedRef.current) {
      tracking.viewEvent(fullEventDetails);
      viewTrackedRef.current = true;
    }
  }, [isOpen, fullEventDetails, tracking]);

  useEffect(() => {
    if (!fullEventDetails) return;

    const prev = lastCartRef.current;

    const currentPreventId = purchaseData.selectedPrevent?.id;
    const currentPreventQty = purchaseData.ticketQuantity || 0;

    if (currentPreventId != null) {
      const prevQty = prev.preventId === currentPreventId ? prev.preventQty : 0;
      const delta = currentPreventQty - prevQty;
      if (delta > 0 && purchaseData.selectedPrevent) {
        tracking.addPrevent(fullEventDetails, purchaseData.selectedPrevent, delta);
      }
    }
    lastCartRef.current.preventId = currentPreventId;
    lastCartRef.current.preventQty = currentPreventQty;

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
  }, [
    fullEventDetails,
    purchaseData.selectedPrevent,
    purchaseData.ticketQuantity,
    purchaseData.products,
    purchaseData.combos,
    tracking
  ]);

  useEffect(() => {
    if (!fullEventDetails) return;
    const stepName = dynamicSteps[currentStep - 1];
    if (stepName === 'Confirmación' && !beginCheckoutTrackedRef.current) {
      tracking.beginCheckout(fullEventDetails, buildTrackingItems(), {
        coupon: getCheckoutCoupon(),
        value: getCheckoutValue(),
      });
      beginCheckoutTrackedRef.current = true;
    }
  }, [currentStep, dynamicSteps, fullEventDetails, tracking, purchaseData]);

  useEffect(() => {
    if (!fullEventDetails) return;
    const stepName = dynamicSteps[currentStep - 1];
    if (stepName === 'Confirmación' && !beginCheckoutTrackedRef.current) {
      tracking.beginCheckout(fullEventDetails, buildTrackingItems(), {
        coupon: getCheckoutCoupon(),
        value: getCheckoutValue(),
      });
      beginCheckoutTrackedRef.current = true;
    }
  }, [currentStep, dynamicSteps, fullEventDetails, tracking, purchaseData]);

  useEffect(() => {
    if (isOpen && !fullEventDetails) {
      (async () => {
        try {
          setLoadingDetails(true);
          const resp = await fetchProducerEventDetailData(initialEvent.id);

          if (resp.success && resp.data) {
            setFullEventDetails(resp.data);
            let initialSelectedPrevent: Prevent | null = null;

            if (resp.data.featuredPrevent && resp.data.prevents.some(p => p.id === resp.data.featuredPrevent!.id)) {
              initialSelectedPrevent = resp.data.featuredPrevent;
            } else if (resp.data.prevents.length > 0) {
              const activePrevents = (resp.data.prevents || []).filter((p: Prevent) => p.status === PreventStatusEnum.ACTIVE && p.quantity > 0);
              initialSelectedPrevent = activePrevents[0];
            }

            setPurchaseData(prev => ({
              ...prev,
              selectedPrevent: initialSelectedPrevent,
              ticketQuantity: initialSelectedPrevent ? 1 : 0,
              clients: Array.from({ length: initialSelectedPrevent ? 1 : 0 }, () => ({ fullName: '', docNumber: '', gender: '' as GenderEnum, phone: '', isCompleted: false }))
            }));
          } else {
            setErrorDetails("Error al cargar detalles.");
          }
        } catch (err) {
          console.error("Error fetching event details:", err);
          setErrorDetails("Error de red.");
        } finally {
          setLoadingDetails(false);
        }
      })();
    }
  }, [isOpen, initialEvent.id, fullEventDetails]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const ticketPrice = purchaseData.selectedPrevent?.price || 0;
    const subtotalTickets = ticketPrice * purchaseData.ticketQuantity;

    const totalProductsPrice = purchaseData.products.reduce((sum, item) => {
      const priceNum = parseFloat(item.product.price.toString());
      const discountNum = parseFloat(item.product.discountPercentage.toString());
      const effectivePrice = priceNum * (1 - discountNum / 100);
      return sum + effectivePrice * item.quantity;
    }, 0);

    const totalCombosPrice = purchaseData.combos.reduce((sum, item) => {
      const priceNum = parseFloat(item.combo.price.toString());
      return sum + priceNum * item.quantity;
    }, 0);

    const subtotalAllItems = subtotalTickets + totalProductsPrice + totalCombosPrice;

    let discount = 0;
    if (appliedCoupon) {
      const minOrder = appliedCoupon.minOrderAmount != null ? Number(appliedCoupon.minOrderAmount) : null;
      if (minOrder == null || subtotalAllItems >= minOrder) {
        discount = computeCouponDiscount(subtotalAllItems, appliedCoupon);
      }
    }

    const finalTotal = Math.max(0, subtotalAllItems - discount);

    setPurchaseData(prev => ({
      ...prev,
      total: finalTotal,
      totalWithDiscount: appliedCoupon ? finalTotal : null,
    }));
  }, [
    purchaseData.selectedPrevent,
    purchaseData.ticketQuantity,
    purchaseData.products,
    purchaseData.combos,
    appliedCoupon,
  ]);

  const onUpdatePurchase = useCallback((data: Partial<PurchaseData>) => {
    setPurchaseData(prevPurchaseData => {
      const newPurchaseData = { ...prevPurchaseData, ...data };

      if (data.ticketQuantity !== undefined && data.ticketQuantity !== prevPurchaseData.ticketQuantity) {
        const newClients = Array.from({ length: data.ticketQuantity }, (_, i) =>
          prevPurchaseData.clients[i] || { fullName: '', docNumber: '', gender: '' as GenderEnum, phone: '', isCompleted: false }
        );
        newPurchaseData.clients = newClients;
      }
      return newPurchaseData;
    });
  }, []);

  const updateClient = useCallback((index: number, field: keyof ClientData, value: string) => {
    setPurchaseData(prev => {
      const newClients = [...prev.clients];
      newClients[index] = { ...newClients[index], [field]: value };
      return { ...prev, clients: newClients };
    });
  }, []);

  const updateEmail = useCallback((email: string) => {
    setPurchaseData(prev => ({ ...prev, email }));
  }, []);

  const updatePaymentMethod = useCallback((paymentMethod: 'mercadopago' | 'bank_transfer') => {
    setPurchaseData(prev => ({ ...prev, paymentMethod }));
  }, []);

  const updatePaymentFile = useCallback((file: File) => {
    setPurchaseData(prev => ({ ...prev, comprobante: file }));
  }, []);

  const handleUpdateProductsAndCombos = useCallback((products: PurchaseProductItem[], combos: PurchaseComboItem[]) => {
    setPurchaseData(prev => ({ ...prev, products, combos }));
  }, []);

  const currentSubtotal = useMemo(() => {
    const ticketPrice = toNum(purchaseData.selectedPrevent?.price);
    const subtotalTickets = ticketPrice * purchaseData.ticketQuantity;

    const productsSum = purchaseData.products.reduce((s, i) => {
      const p = toNum(i.product.price);
      const d = toNum(i.product.discountPercentage);
      return s + (p * (1 - d / 100)) * i.quantity;
    }, 0);

    const combosSum = purchaseData.combos.reduce(
      (s, i) => s + toNum(i.combo.price) * i.quantity, 0
    );

    return subtotalTickets + productsSum + combosSum;
  }, [
    purchaseData.selectedPrevent,
    purchaseData.ticketQuantity,
    purchaseData.products,
    purchaseData.combos,
  ]);

  const computeCouponDiscount = (subtotal: number, coupon: CouponEvent | null): number => {
    if (!coupon) return 0;

    const value = toNum(coupon.value);

    if (coupon.discountType === 'PERCENT') {
      let d = subtotal * (value / 100);
      const cap = coupon.maxDiscountAmount != null ? toNum(coupon.maxDiscountAmount) : null;
      if (cap != null) d = Math.min(d, cap);
      return Math.max(0, Math.min(d, subtotal));
    }

    return Math.max(0, Math.min(value, subtotal));
  };

  const currentDiscount = React.useMemo(() => {
    if (!appliedCoupon) return 0;

    const minOrder = appliedCoupon.minOrderAmount != null
      ? toNum(appliedCoupon.minOrderAmount)
      : null;

    if (minOrder != null && currentSubtotal < minOrder) return 0;

    return computeCouponDiscount(currentSubtotal, appliedCoupon);
  }, [appliedCoupon, currentSubtotal]);

  useEffect(() => {
    const total = currentSubtotal;
    const totalWithDiscount = Math.max(0, currentSubtotal - currentDiscount);

    setPurchaseData(prev => ({
      ...prev,
      total,
      totalWithDiscount,
    }));
  }, [currentSubtotal, currentDiscount]);

  const generateMercadoPagoPreference = useCallback(async () => {
    if (!mpPublicKey || !purchaseData.selectedPrevent) {
      console.error("Mercado Pago not configured or prevent not selected.");
      return false;
    }

    setMpGeneratingPreference(true);
    const updatedParticipants = purchaseData.clients.map(participant => ({
      ...participant,
      email: purchaseData.email
    }));
    const updatedProducts = purchaseData.products.map(c => ({
      productId: c.product.id,
      quantity: c.quantity
    }));
    const updatedCombos = purchaseData.combos.map(c => ({
      comboId: c.combo.id,
      quantity: c.quantity
    }));

    const couponId = purchaseData.coupon ? purchaseData.coupon?.id : null;

    try {
      const res = await createPreference(
        purchaseData.selectedPrevent.id,
        updatedParticipants,
        updatedProducts,
        updatedCombos,
        purchaseData.total,
        purchaseData.promoter,
        couponId
      );

      if (res.success) {
        setMpPreferenceId(res.data.preferenceId);

        if (fullEventDetails && !beginCheckoutTrackedRef.current) {
          tracking.beginCheckout(fullEventDetails, buildTrackingItems(), {
            coupon: getCheckoutCoupon(),
            value: getCheckoutValue(),
          });
          beginCheckoutTrackedRef.current = true;
        }

        setMpGeneratingPreference(false);
        setCurrentStep(s => s + 1);
        return true;
      }
      if (!res.success) {
        console.error("Error creating Mercado Pago preference:", res.message);
        setMpGeneratingPreference(false);
        toast.error(res.message || 'Error al crear preferencia de pago');
        return false;
      }
    } catch (err) {
      console.error('Error al contactar a Mercado Pago para preferencia:', err);
      setMpGeneratingPreference(false);
      toast.error('Error al crear preferencia de pago');
      return false;
    }
    setMpGeneratingPreference(false);
    return false;
  }, [
    mpPublicKey,
    purchaseData.selectedPrevent,
    purchaseData.clients,
    purchaseData.email,
    purchaseData.products,
    purchaseData.combos,
    purchaseData.total,
    purchaseData.promoter,
    purchaseData.coupon,
    fullEventDetails,
    tracking,
    buildTrackingItems,
    getCheckoutCoupon,
    getCheckoutValue
  ]);

  const canProceed = () => {
    if (currentStep === 0) {
      return true;
    }

    const currentStepName = dynamicSteps[currentStep - 1];

    switch (currentStepName) {
      case 'Seleccionar Entradas':
        return purchaseData.selectedPrevent !== null && purchaseData.ticketQuantity > 0;
      case 'Datos de Asistentes':
        if (purchaseData.ticketQuantity === 0) return false;
        return purchaseData.clients.every(client => client.isCompleted);
      case 'Información de Contacto':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(purchaseData.email);
      case 'Productos':
        return true;
      case 'Método de Pago':
        if (purchaseData.paymentMethod === 'bank_transfer' && purchaseData.total > 0) {
          return !!purchaseData.comprobante;
        }
        return !!purchaseData.paymentMethod;
      case 'Confirmación':
        if (purchaseData.paymentMethod === 'mercadopago') {
          return !!mpPreferenceId;
        }
        return true;
      default: return true;
    }
  };

  const handleNext = useCallback(async () => {
    setCurrentStep(s => {
      if (s === 0) return 1;
      if (!mpGeneratingPreference && s < dynamicSteps.length) return s + 1;
      return s;
    });
  }, [mpGeneratingPreference, dynamicSteps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(s => (s > 0 ? s - 1 : s));
  }, []);

  const handleReset = useCallback(() => {
    setPurchaseData({
      selectedPrevent: null,
      ticketQuantity: 0,
      clients: [],
      products: [],
      combos: [],
      email: '',
      promoter: '',
      comprobante: undefined,
      paymentMethod: null,
      coupon: null,
      total: 0
    });
    setMpPreferenceId(null);
    setMpGeneratingPreference(false);
  }, []);

  const handleComplete = useCallback(async () => {
    const updatedParticipants = purchaseData.clients.map(p => ({
      ...p,
      email: purchaseData.email
    }));
    const updatedProducts = purchaseData.products.map(c => ({
      productId: c.product.id,
      quantity: c.quantity
    }));
    const updatedCombos = purchaseData.combos.map(c => ({
      comboId: c.combo.id,
      quantity: c.quantity
    }));

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const submitData = new FormData();
      submitData.append('clients', JSON.stringify(updatedParticipants));
      submitData.append('products', JSON.stringify(updatedProducts));
      submitData.append('combos', JSON.stringify(updatedCombos));
      submitData.append('total', JSON.stringify(purchaseData.total));

      if (purchaseData.promoter) submitData.append('coupon', purchaseData.promoter);
      if (purchaseData.coupon) submitData.append('coupon', String(purchaseData.coupon.id));
      if (purchaseData.comprobante) {
        submitData.append('comprobante', purchaseData.comprobante);
      }

      const result = await submitTicketForm(submitData, initialEvent.id, purchaseData.selectedPrevent!.id, purchaseData.total);
      if (result.success) {
        setSubmissionStatus({ status: 'success', message: result['message'] || "¡Compra Exitosa! 🎉" });

        if (purchaseData.paymentMethod === 'bank_transfer' && (fullEventDetails || initialEvent)) {
          const evt = fullEventDetails || initialEvent;
          const txn = `bank_${evt.id}_${Date.now()}`;
          tracking.purchase(evt, {
            transactionId: txn,
            value: getCheckoutValue(),
            items: buildTrackingItems(),
            coupon: getCheckoutCoupon(),
          });
        }
      } else {
        setSubmissionStatus({ status: 'error', message: result['message'] || "Error al procesar tu compra. Por favor, inténtalo de nuevo." });
      }

      setCurrentStep(dynamicSteps.length);
    } catch (error) {
      setSubmissionStatus({ status: 'error', message: "Error enviando información" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    purchaseData.clients,
    purchaseData.email,
    purchaseData.products,
    purchaseData.combos,
    purchaseData.total,
    purchaseData.promoter,
    purchaseData.coupon,
    purchaseData.comprobante,
    purchaseData.paymentMethod,
    purchaseData.selectedPrevent,
    initialEvent.id,
    fullEventDetails,
    initialEvent,
    tracking,
    buildTrackingItems,
    getCheckoutValue,
    getCheckoutCoupon,
    dynamicSteps.length
  ]);

  const handleCloseDrawer = useCallback(async () => {
    await animate(scope.current, { opacity: [1, 0] }, { duration: 0.3 });

    const yStart = typeof y.get() === "number" ? y.get() : 0;
    await animate("#ticket-sheet", { y: [yStart, height] }, {
      ease: "easeInOut",
      duration: 0.3
    });

    setCurrentStep(0);
    setFullEventDetails(null);
    setErrorDetails(null);
    viewTrackedRef.current = false;
    beginCheckoutTrackedRef.current = false;
    lastCartRef.current = { preventQty: 0, productQtys: {}, comboQtys: {} };

    handleReset();
    onClose();
  }, [animate, height, handleReset, onClose, y]);

  const onDragEndSheet = useCallback(async (_: any, info: PanInfo) => {
    const dragged = info.offset.y;
    const velocity = info.velocity.y;

    if (dragged > DRAG_CLOSE_PX || velocity > DRAG_CLOSE_VELOCITY) {
      await handleCloseDrawer();
    } else {
      await animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [animate, handleCloseDrawer, y]);

  const handlePointerDown = useCallback((event: any) => {
    dragControls.start(event);
  }, [dragControls]);

  const handleShare = useCallback(async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const id = fullEventDetails?.id ?? initialEvent.id;
      const url = `${origin}/events?event=${id}${purchaseData.promoter ? `&promoter=${encodeURIComponent(purchaseData.promoter)}` : ""
        }`;
      const title = fullEventDetails?.name ?? initialEvent.name;
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
  }, [fullEventDetails, initialEvent.id, initialEvent.name, purchaseData.promoter, tracking]);

  const handleCouponApplied = useCallback((coupon: CouponEvent) => {
    const minOrder = coupon.minOrderAmount != null ? toNum(coupon.minOrderAmount) : null;

    if (minOrder != null && currentSubtotal < minOrder) {
      toast.error(`Este cupón requiere una compra mínima de $${minOrder.toFixed(2)}.`);
      return;
    }

    setAppliedCoupon(coupon);
    setPurchaseData(prev => ({ ...prev, coupon }));
  }, [currentSubtotal]);

  const handleCouponRemoved = useCallback(() => {
    setAppliedCoupon(null);
    setPurchaseData(prev => ({ ...prev, coupon: null }));
  }, []);

  const renderCurrentStep = useCallback(() => {
    if (currentStep === 0) {
      return <EventInfo event={fullEventDetails} />;
    }

    const currentStepName = dynamicSteps[currentStep - 1];

    switch (currentStepName) {
      case 'Seleccionar Entradas':
        return (
          <TicketSelection
            eventData={fullEventDetails}
            purchaseData={purchaseData}
            onUpdatePurchase={onUpdatePurchase}
          />
        );
      case 'Datos de Asistentes':
        return (
          <AttendeeData
            purchaseData={purchaseData}
            onUpdateClient={updateClient}
          />
        );
      case 'Información de Contacto':
        return (
          <ContactInfo
            purchaseData={purchaseData}
            onUpdateEmail={updateEmail}
            eventId={initialEvent.id}
            appliedCoupon={appliedCoupon}
            discountAmount={currentDiscount}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
          />
        );
      case 'Productos':
        return (
          <ProductSelection
            purchaseData={purchaseData}
            availableProducts={fullEventDetails?.products || []}
            availableCombos={fullEventDetails?.combos || []}
            onUpdateProductsAndCombos={handleUpdateProductsAndCombos}
          />
        );
      case 'Método de Pago':
        return (
          <PaymentMethod
            eventData={fullEventDetails}
            purchaseData={purchaseData}
            onUpdatePaymentMethod={updatePaymentMethod}
            onUpdatePurchaseFile={updatePaymentFile}
          />
        );
      case 'Confirmación':
      case 'Resumen':
        return (
          <OrderSummary
            eventData={fullEventDetails!}
            purchaseData={purchaseData}
          />
        );
      case 'Estado':
        return (
          <PurchaseStatus
            purchaseData={purchaseData}
            total={purchaseData.total}
            status={submissionStatus}
            onResetAndClose={handleCloseDrawer}
          />
        );
      default:
        return null;
    }
  }, [
    currentStep,
    dynamicSteps,
    fullEventDetails,
    purchaseData,
    onUpdatePurchase,
    updateClient,
    updateEmail,
    initialEvent.id,
    appliedCoupon,
    currentDiscount,
    handleCouponApplied,
    handleCouponRemoved,
    handleUpdateProductsAndCombos,
    updatePaymentMethod,
    updatePaymentFile,
    submissionStatus,
    handleCloseDrawer
  ]);

  const isConfirmationStep = dynamicSteps[currentStep - 1] === 'Confirmación';
  const isPaymentMethodStep = dynamicSteps[currentStep - 1] === 'Método de Pago';

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

      setCurrentStep(0);
      setFullEventDetails(null);
      setErrorDetails(null);
      viewTrackedRef.current = false;
      beginCheckoutTrackedRef.current = false;
      lastCartRef.current = { preventQty: 0, productQtys: {}, comboQtys: {} };

      handleReset();
      onClose();

      setIsClosing(false);
    })();

    return () => { cancelled = true; };
  }, [isClosing, animate, scope, y, height, handleReset, onClose]);

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

            {currentStep === 0 && (
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
              className="flex-grow pt-1 relative"
              style={{ overflowY: 'auto' }}
            >
              {loadingDetails ? (
                <Spinner textColor="text-white" borderColor="border-transparent border-t-white" />
              ) : errorDetails ? (
                <div className="h-full flex flex-col items-center justify-center text-red-600">
                  <p>{errorDetails}</p>
                  <Button onClick={() => setFullEventDetails(null)}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  {currentStep > 0 && currentStep <= dynamicSteps.length && (
                    <ProgressBar currentStep={currentStep} steps={dynamicSteps} />
                  )}
                  <div className="animate-fade-in overflow-hidden">
                    {renderCurrentStep()}
                  </div>
                </>
              )}
            </div>

            {currentStep <= dynamicSteps.length - 1 && (
              <NavigationButtons
                currentStep={currentStep}
                totalSteps={dynamicSteps.length}
                canProceed={canProceed()}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onComplete={handleComplete}
                onGeneratePreference={generateMercadoPagoPreference}
                isLoading={loadingDetails}
                isSubmitting={isSubmitting || (purchaseData.paymentMethod === 'mercadopago' && mpGeneratingPreference)}
                isMercadoPagoSelected={purchaseData.paymentMethod === 'mercadopago'}
                isGeneratingPreference={mpGeneratingPreference}
                isConfirmationStep={isConfirmationStep}
                isPaymentMethodStep={isPaymentMethodStep}
                mpPreferenceId={mpPreferenceId}
                mpPublicKey={mpPublicKey || ''}
                eventStarted={false}
                onStartPayment={handleCloseDrawer}
                onTrack={tracking.ui}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};