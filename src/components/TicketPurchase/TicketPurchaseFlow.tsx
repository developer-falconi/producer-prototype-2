import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TicketSelection } from './TicketSelection';
import { AttendeeData } from './AttendeeData';
import { PaymentMethod } from './PaymentMethod';
import { OrderSummary } from './OrderSummary';
import { ProgressBar } from './ProgressBar';
import { ClientData, CouponEvent, EmptyBannerModule, EventDto, EventStatus, GenderEnum, Prevent, PreventStatusEnum, PurchaseComboItem, PurchaseData, PurchaseProductItem, PurchaseExperienceItem, ShareMeta, Voucher } from '@/lib/types';
import { PurchaseStatus } from './PurchaseStatus';
import { NavigationButtons } from '../NavigationButtons';
import { motion, AnimatePresence, PanInfo, useDragControls, useAnimate, useMotionValue } from "framer-motion";
import { createPreference, fetchProducerEventDetailData, submitTicketForm } from '@/lib/api';
import Spinner from '../Spinner';
import { Button } from '../ui/button';
import { EventInfo } from './EventInfo';
import useMeasure from "react-use-measure";
import { ProductSelection } from './ProductSelection';
import { ExperienceSelection } from './ExperienceSelection';
import { toast } from 'sonner';
import { buildShareMeta, toNum } from '@/lib/utils';
import { useProducer } from '@/context/ProducerContext';
import { useTracking } from '@/hooks/use-tracking';
import { Send } from 'lucide-react';

const DRAG_CLOSE_PX = 100;
const DRAG_CLOSE_VELOCITY = 800;
const TOUCH_PULL_CLOSE_PX = 100;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const steps = [
  'Seleccionar Entradas',
  'Experiencias',
  'Datos de Asistentes y Contacto',
  'Productos',
  'Metodo de Pago',
  'Confirmacion',
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
    ticketLines: [],
    ticketQuantity: 0,
    clients: [],
    products: [],
    combos: [],
    experiences: [],
    email: '',
    comprobante: undefined,
    paymentMethod: null,
    promoter: promoterKey,
    coupon: null,
    total: 0
  });

  const [fullEventDetails, setFullEventDetails] = useState<EventDto | null>(null);
  const [submissionData, setSubmissionData] = useState<Voucher[]>(null);
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

  const requiresClientData = useMemo(() => {
    if (fullEventDetails?.requiresClientData !== undefined) {
      return fullEventDetails.requiresClientData;
    }
    return initialEvent?.requiresClientData ?? false;
  }, [fullEventDetails?.requiresClientData, initialEvent?.requiresClientData]);

  const getEmptyBanner = useCallback((module: EmptyBannerModule) => {
    const source = fullEventDetails ?? initialEvent;
    return source?.emptyBanners?.find((banner) => banner.module === module) ?? null;
  }, [fullEventDetails, initialEvent]);

  const dynamicSteps = useMemo(() => {
    const eventSource = fullEventDetails ?? initialEvent;
    let currentDynamicSteps = [...steps];

    const hasProductsOrCombos =
      (eventSource?.products?.length ?? 0) > 0 ||
      (eventSource?.combos?.length ?? 0) > 0;
    const hasProductsBanner = Boolean(
      eventSource?.emptyBanners?.some((banner) => banner.module === EmptyBannerModule.PRODUCTS)
    );

    if (!hasProductsOrCombos && !hasProductsBanner) {
      currentDynamicSteps = currentDynamicSteps.filter(step => step !== 'Productos');
    }

    const hasExperiences =
      (eventSource?.experiences ?? []).some(exp => (exp?.children?.length ?? 0) > 0);
    const hasExperiencesBanner = Boolean(
      eventSource?.emptyBanners?.some((banner) => banner.module === EmptyBannerModule.EXPERIENCES)
    );

    if (!hasExperiences && !hasExperiencesBanner) {
      currentDynamicSteps = currentDynamicSteps.filter(step => step !== 'Experiencias');
    }

    return currentDynamicSteps;
  }, [fullEventDetails, initialEvent]);

  const statusRetryStep = useMemo(() => {
    const confirmationIndex = dynamicSteps.findIndex(step => step === 'Confirmacion');
    if (confirmationIndex >= 0) {
      return confirmationIndex + 1;
    }
    const fallbackIndex = dynamicSteps.length > 1 ? dynamicSteps.length - 1 : 1;
    return fallbackIndex;
  }, [dynamicSteps]);

  const { producer } = useProducer();
  const tracking = useTracking({ producer, channel: 'prevent' });

  const viewTrackedRef = useRef(false);
  const beginCheckoutTrackedRef = useRef(false);
  const lastCartRef = useRef<{
    preventId?: number;
    preventQty: number;
    productQtys: Record<number, number>;
    comboQtys: Record<number, number>;
    experienceQtys: Record<number, number>;
  }>({
    preventId: undefined,
    preventQty: 0,
    productQtys: {},
    comboQtys: {},
    experienceQtys: {}
  });

  const buildTrackingItems = useCallback(() => {
    const items: Array<{ prevent?: Prevent; product?: any; combo?: any; experience?: PurchaseExperienceItem['experience']; parent?: PurchaseExperienceItem['parent']; qty?: number }> = [];
    if (purchaseData.selectedPrevent && purchaseData.ticketQuantity > 0) {
      items.push({ prevent: purchaseData.selectedPrevent, qty: purchaseData.ticketQuantity });
    }
    purchaseData.products.forEach(p => {
      if (p.quantity > 0) items.push({ product: p.product, qty: p.quantity });
    });
    purchaseData.combos.forEach(c => {
      if (c.quantity > 0) items.push({ combo: c.combo, qty: c.quantity });
    });
    purchaseData.experiences.forEach(exp => {
      if (exp.quantity > 0) items.push({ experience: exp.experience, parent: exp.parent, qty: exp.quantity });
    });
    return items;
  }, [purchaseData.selectedPrevent, purchaseData.ticketQuantity, purchaseData.products, purchaseData.combos, purchaseData.experiences]);

  const totalSelectedTickets = useMemo(() => {
    return (purchaseData.ticketLines ?? []).reduce((acc, line) => acc + line.quantity, 0);
  }, [purchaseData.ticketLines]);

  const allClientsCompleted = useMemo(() => {
    if (totalSelectedTickets === 0) return false;
    if (purchaseData.clients.length < totalSelectedTickets) return false;
    return purchaseData.clients.every(client => client.isCompleted);
  }, [purchaseData.clients, totalSelectedTickets]);

  const isContactEmailValid = useMemo(() => {
    return EMAIL_REGEX.test(purchaseData.email ?? '');
  }, [purchaseData.email]);

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

    const currentExperiences: Record<number, number> = {};
    purchaseData.experiences.forEach(it => { currentExperiences[it.experience.id] = it.quantity; });
    Object.entries(currentExperiences).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      const prevQty = prev.experienceQtys[id] ?? 0;
      const delta = qty - prevQty;
      if (delta > 0) {
        const item = purchaseData.experiences.find(e => e.experience.id === id);
        const sourceEvent = fullEventDetails ?? initialEvent;
        if (item && sourceEvent) {
          tracking.addExperience?.(sourceEvent, item.experience, delta, item.parent ?? null);
        }
      }
    });

    lastCartRef.current.productQtys = currentProducts;
    lastCartRef.current.comboQtys = currentCombos;
    lastCartRef.current.experienceQtys = currentExperiences;
  }, [
    fullEventDetails,
    purchaseData.selectedPrevent,
    purchaseData.ticketQuantity,
    purchaseData.products,
    purchaseData.combos,
    purchaseData.experiences,
    tracking
  ]);

  useEffect(() => {
    if (!fullEventDetails) return;
    const stepName = dynamicSteps[currentStep - 1];
    if (stepName === 'Confirmacion' && !beginCheckoutTrackedRef.current) {
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
    if (stepName === 'Confirmacion' && !beginCheckoutTrackedRef.current) {
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
            let shouldPreselectQuantity = false;

            const featuredPrevent = (resp.data.prevents || []).find(
              (p: Prevent) =>
                p.featured &&
                p.status === PreventStatusEnum.ACTIVE &&
                p.quantity > 0
            );

            if (featuredPrevent) {
              initialSelectedPrevent = featuredPrevent;
              shouldPreselectQuantity = true;
            }

            setPurchaseData(prev => ({
              ...prev,
              selectedPrevent: initialSelectedPrevent,
              ticketQuantity: shouldPreselectQuantity ? 1 : 0,
              clients: Array.from({ length: shouldPreselectQuantity ? 1 : 0 }, () => ({ fullName: '', docNumber: '', gender: '' as GenderEnum, phone: '', isCompleted: false }))
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
    const subtotalTickets = (purchaseData.ticketLines ?? []).reduce(
      (sum, l) => sum + toNum(l.prevent.price) * l.quantity, 0
    );

    const totalProductsPrice = purchaseData.products.reduce((sum, item) => {
      const priceNum = toNum(item.product.price);
      const discountNum = toNum(item.product.discountPercentage);
      const effectivePrice = priceNum * (1 - discountNum / 100);
      return sum + effectivePrice * item.quantity;
    }, 0);

    const totalCombosPrice = purchaseData.combos.reduce((sum, item) => {
      const priceNum = toNum(item.combo.price);
      return sum + priceNum * item.quantity;
    }, 0);

    const totalExperiencesPrice = purchaseData.experiences.reduce((sum, item) => {
      const priceNum = toNum(item.experience.price);
      return sum + priceNum * item.quantity;
    }, 0);

    const subtotalAllItems = subtotalTickets + totalProductsPrice + totalCombosPrice + totalExperiencesPrice;

    let discount = 0;
    if (appliedCoupon) {
      const minOrder = appliedCoupon.minOrderAmount != null ? toNum(appliedCoupon.minOrderAmount) : null;
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
    purchaseData.ticketLines,
    purchaseData.products,
    purchaseData.combos,
    purchaseData.experiences,
    appliedCoupon,
  ]);

  const onUpdatePurchase = useCallback((data: Partial<PurchaseData>) => {
    setPurchaseData(prevPurchaseData => {
      const newPurchaseData = { ...prevPurchaseData, ...data };

      if (data.ticketLines) {
        const totalQty = (data.ticketLines ?? []).reduce((acc, l) => acc + l.quantity, 0);
        newPurchaseData.ticketQuantity = totalQty;
      }

      const effectiveQty = newPurchaseData.ticketQuantity;
      if (effectiveQty !== prevPurchaseData.ticketQuantity || data.ticketLines) {
        const base = prevPurchaseData.clients || [];
        const newClients = Array.from({ length: effectiveQty }, (_, i) =>
          base[i] || { fullName: '', docNumber: '', gender: '' as GenderEnum, phone: '', isCompleted: false }
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

  const handleUpdateExperiences = useCallback((experiences: PurchaseExperienceItem[]) => {
    setPurchaseData(prev => ({ ...prev, experiences }));
  }, []);

  const currentSubtotal = useMemo(() => {
    const subtotalTickets = (purchaseData.ticketLines ?? []).reduce(
      (sum, l) => sum + toNum(l.prevent.price) * l.quantity, 0
    );

    const productsSum = purchaseData.products.reduce((s, i) => {
      const p = toNum(i.product.price);
      const d = toNum(i.product.discountPercentage);
      return s + (p * (1 - d / 100)) * i.quantity;
    }, 0);

    const combosSum = purchaseData.combos.reduce(
      (s, i) => s + toNum(i.combo.price) * i.quantity, 0
    );

    const experiencesSum = purchaseData.experiences.reduce(
      (s, i) => s + toNum(i.experience.price) * i.quantity, 0
    );

    return subtotalTickets + productsSum + combosSum + experiencesSum;
  }, [
    purchaseData.ticketLines,
    purchaseData.products,
    purchaseData.combos,
    purchaseData.experiences,
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

  const purchaseRequestPayload = useMemo(() => {
    if (purchaseData.ticketQuantity === 0) return null;
    if (!purchaseData.clients.every(client => client.isCompleted)) return null;
    if (!EMAIL_REGEX.test(purchaseData.email ?? '')) return null;

    const clients = purchaseData.clients.map(client => ({
      fullName: client.fullName?.trim() ?? '',
      docNumber: client.docNumber?.trim() ?? '',
      phone: client.phone?.trim() ?? '',
      gender: client.gender,
      email: purchaseData.email,
    }));

    const products = purchaseData.products
      .filter(item => item.quantity > 0)
      .map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

    const combos = purchaseData.combos
      .filter(item => item.quantity > 0)
      .map(item => ({
        comboId: item.combo.id,
        quantity: item.quantity,
      }));

    const experiences = purchaseData.experiences
      .filter(item => item.quantity > 0)
      .map(item => ({
        experienceId: item.experience.id,
        quantity: item.quantity,
      }));

    const ticketRequests: Array<{ preventId: number; clientIndex: number; bundles: number }> = [];
    let cursor = 0;
    let missingClient = false;

    for (const line of purchaseData.ticketLines ?? []) {
      for (let i = 0; i < line.quantity; i += 1) {
        if (cursor >= purchaseData.clients.length) {
          missingClient = true;
          break;
        }
        ticketRequests.push({
          preventId: line.prevent.id,
          clientIndex: cursor,
          bundles: 1,
        });
        cursor += 1;
      }
      if (missingClient) break;
    }

    const requiredPreventIds = new Set(
      (purchaseData.ticketLines ?? [])
        .filter(line => line.quantity > 0)
        .map(line => line.prevent.id)
    );

    const requestedPreventIds = new Set(ticketRequests.map(req => req.preventId));

    if (
      missingClient ||
      ticketRequests.length !== purchaseData.ticketQuantity ||
      requestedPreventIds.size !== requiredPreventIds.size
    ) {
      return null;
    }

    return {
      clients,
      products,
      combos,
      experiences,
      total: purchaseData.total,
      promoter: purchaseData.promoter || null,
      coupon: purchaseData.coupon?.id ?? null,
      ticketRequests,
    };
  }, [
    purchaseData.clients,
    purchaseData.email,
    purchaseData.products,
    purchaseData.combos,
    purchaseData.experiences,
    purchaseData.ticketLines,
    purchaseData.ticketQuantity,
    purchaseData.total,
    purchaseData.promoter,
    purchaseData.coupon,
  ]);

  const generateMercadoPagoPreference = useCallback(async () => {
    if (!mpPublicKey || !purchaseData.selectedPrevent) {
      console.error("Mercado Pago not configured or prevent not selected.");
      return false;
    }

    if (!purchaseRequestPayload) {
      toast.error('Completa los datos de los asistentes antes de generar el pago.');
      return false;
    }

    setMpGeneratingPreference(true);

    try {
      const res = await createPreference(
        fullEventDetails.id,
        purchaseRequestPayload
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
    purchaseRequestPayload,
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
        return totalSelectedTickets > 0;
      case 'Datos de Asistentes y Contacto':
        if (totalSelectedTickets === 0) return false;
        return allClientsCompleted && isContactEmailValid;
      case 'Productos':
        return true;
      case 'Experiencias':
        return true;
      case 'Metodo de Pago':
        if (purchaseData.paymentMethod === 'bank_transfer' && purchaseData.total > 0) {
          return !!purchaseData.comprobante;
        }
        return !!purchaseData.paymentMethod;
      case 'Confirmacion':
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
      ticketLines: [],
      ticketQuantity: 0,
      clients: [],
      products: [],
      combos: [],
      experiences: [],
      email: '',
      promoter: '',
      comprobante: undefined,
      paymentMethod: null,
      coupon: null,
      total: 0
    });
    setMpPreferenceId(null);
    setMpGeneratingPreference(false);
    setSubmissionStatus(null);
    setSubmissionData(null);
  }, [setSubmissionStatus, setSubmissionData]);

  const handleComplete = useCallback(async () => {
    if (!purchaseRequestPayload) {
      toast.error('Completa los datos de los asistentes antes de finalizar la compra.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const submitData = new FormData();
      submitData.append('payload', JSON.stringify(purchaseRequestPayload));

      if (purchaseData.comprobante) {
        submitData.append('comprobante', purchaseData.comprobante);
      }

      const result = await submitTicketForm(submitData, initialEvent.id, purchaseData.total);
      if (result.success) {
        setSubmissionStatus({ status: 'success', message: result['message'] || "Compra exitosa!" });
        setSubmissionData(result.data);

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
        setSubmissionStatus({ status: 'error', message: result['message'] || "Error al procesar tu compra. Por favor, intentelo de nuevo." });
      }

      setCurrentStep(dynamicSteps.length);
    } catch (error) {
      setSubmissionStatus({ status: 'error', message: "Error enviando informacion" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    purchaseRequestPayload,
    purchaseData.comprobante,
    purchaseData.paymentMethod,
    purchaseData.total,
    initialEvent.id,
    fullEventDetails,
    initialEvent,
    tracking,
    buildTrackingItems,
    getCheckoutValue,
    getCheckoutCoupon,
    dynamicSteps.length
  ]);

  const handleStatusRetry = useCallback(() => {
    setSubmissionStatus(null);
    setSubmissionData(null);
    setCurrentStep(statusRetryStep);
  }, [setCurrentStep, setSubmissionStatus, setSubmissionData, statusRetryStep]);
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
    lastCartRef.current = { preventQty: 0, productQtys: {}, comboQtys: {}, experienceQtys: {} };

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
      const ev = fullEventDetails ?? initialEvent;
      const meta = buildShareMeta(ev);
      const frontendOrigin = meta.defaultOrigin || origin;

      const url =
        `${frontendOrigin}/events?event=${encodeURIComponent(meta.slugOrId)}` +
        (purchaseData.promoter
          ? `&promoter=${encodeURIComponent(purchaseData.promoter)}`
          : '');

      const title = meta.title;
      const text = `Mira este evento: ${title}`;

      if (navigator.share) {
        await navigator.share({ title, text, url });
        tracking.ui("share_event_native", { event_id: ev.id, success: true });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado al portapapeles");
        tracking.ui("share_event_copy", { event_id: ev.id });
      }
      return meta;
    } catch (e) {
      if (String(e?.name) !== "AbortError") {
        toast.error("No se pudo compartir");
        tracking.ui("share_event_error", { message: String(e?.message || e) });
      }
      return null as ShareMeta | null;
    }
  }, [fullEventDetails, initialEvent, purchaseData.promoter, tracking]);

  const handleCouponApplied = useCallback((coupon: CouponEvent) => {
    const minOrder = coupon.minOrderAmount != null ? toNum(coupon.minOrderAmount) : null;

    if (minOrder != null && currentSubtotal < minOrder) {
      toast.error(`Este cupon requiere una compra minima de $${minOrder.toFixed(2)}.`);
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
      case 'Datos de Asistentes y Contacto':
        return (
          <AttendeeData
            purchaseData={purchaseData}
            onUpdateClient={updateClient}
            onUpdateEmail={updateEmail}
            eventId={initialEvent.id}
            appliedCoupon={appliedCoupon}
            discountAmount={currentDiscount}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            requiresClientData={requiresClientData}
          />
      );
      case 'Productos':
        return (
          <ProductSelection
            purchaseData={purchaseData}
            availableProducts={fullEventDetails?.products || []}
            availableCombos={fullEventDetails?.combos || []}
            onUpdateProductsAndCombos={handleUpdateProductsAndCombos}
            emptyBanner={getEmptyBanner(EmptyBannerModule.PRODUCTS)}
          />
        );
      case 'Experiencias': {
        const availableExperiences = (fullEventDetails?.experiences || initialEvent?.experiences || []).map(exp => ({
          ...exp,
          children: exp.children ?? [],
        }));
        return (
          <ExperienceSelection
            purchaseData={purchaseData}
            experiences={availableExperiences}
            onUpdateExperiences={handleUpdateExperiences}
            emptyBanner={getEmptyBanner(EmptyBannerModule.EXPERIENCES)}
          />
        );
      }
      case 'Metodo de Pago':
        return (
          <PaymentMethod
            eventData={fullEventDetails}
            purchaseData={purchaseData}
            onUpdatePaymentMethod={updatePaymentMethod}
            onUpdatePurchaseFile={updatePaymentFile}
          />
        );
      case 'Confirmacion':
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
            voucher={submissionData}
            onResetAndClose={handleCloseDrawer}
            onRetry={handleStatusRetry}
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
    allClientsCompleted,
    currentDiscount,
    handleCouponApplied,
    handleCouponRemoved,
    handleUpdateProductsAndCombos,
    handleUpdateExperiences,
    updatePaymentMethod,
    updatePaymentFile,
    submissionStatus,
    handleCloseDrawer,
    initialEvent.experiences
  ]);

  const isConfirmationStep = dynamicSteps[currentStep - 1] === 'Confirmacion';
  const isPaymentMethodStep = dynamicSteps[currentStep - 1] === 'Metodo de Pago';

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
      lastCartRef.current = { preventQty: 0, productQtys: {}, comboQtys: {}, experienceQtys: {} };

      handleReset();
      onClose();

      setIsClosing(false);
    })();

    return () => { cancelled = true; };
  }, [isClosing, animate, scope, y, height, handleReset, onClose]);

  const isCompletedOrUpcoming = [EventStatus.COMPLETED, EventStatus.UPCOMING].includes(fullEventDetails?.status);

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
                  {currentStep > 0 && currentStep <= dynamicSteps.length - 1 && (
                    <ProgressBar currentStep={currentStep} steps={dynamicSteps} />
                  )}
                  <div className="animate-fade-in overflow-hidden min-h-0">
                    {renderCurrentStep()}
                  </div>
                </>
              )}
            </div>

            {currentStep <= dynamicSteps.length - 1 && !isCompletedOrUpcoming && (
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

