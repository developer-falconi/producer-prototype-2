import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate, useDragControls, useMotionValue } from "framer-motion";
import { ComboEventDto, CouponEvent, EventDto, InEventPurchaseData, InEventPurchasePayload, ProductBuyerInfo, ProductEventDto, ProductTypeEnum, PurchaseComboItem, PurchaseProductItem } from "@/lib/types";
import { createLiveEventPreference, fetchProducerEventDetailData, submitLiveEventPurchase } from "@/lib/api";
import BuyerStep from "./BuyerStep";
import CatalogStep from "./CatalogStep";
import PaymentStep from "./PaymentStep";
import ReviewStep from "./ReviewStep";
import QRStep from "./QrStep";
import Spinner from "../Spinner";
import useMeasure from "react-use-measure";
import { ProgressBar } from "./ProgressBar";
import { NavigationButtons } from "../NavigationButtons";
import EventPurchaseBanner from "./EventPurchaseBanner";
import PurchaseStatus from "./PurchaseStatus";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { initMpOnce } from "@/lib/mp";

const Step = {
  Banner: 0,
  Buyer: 1,
  Catalog: 2,
  Payment: 3,
  Review: 4,
  QR: 5,
  PurchaseStatus: 6
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
    paymentMethod: 'mercadopago',
    total: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [isGeneratingPreference, setIsGeneratingPreference] = useState(false);

  const [fullEventDetails, setFullEventDetails] = useState<EventDto | null>(null);
  const [purchaseCode, setPurchaseCode] = useState<number | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponEvent | null>(null);

  const [scope, animate] = useAnimate();
  const [sheetRef, { height }] = useMeasure();
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  const mpPublicKey = useMemo(() => {
    return fullEventDetails?.oAuthMercadoPago?.mpPublicKey || null;
  }, [fullEventDetails]);

  const hasMP = Boolean(mpPublicKey);

  const availableProducts: ProductEventDto[] = fullEventDetails?.products ?? [];
  const availableCombos: ComboEventDto[] = fullEventDetails?.combos ?? [];

  const updatePurchaseData = (newData: Partial<InEventPurchaseData>) => {
    setPurchaseData(prevData => ({ ...prevData, ...newData }));
  };

  const updateItemQuantity = (type: ProductTypeEnum, id: number, nextQty: number) => {
    if (type === ProductTypeEnum.PRODUCT) {
      const product = availableProducts.find(p => p.id === id);
      if (!product) return;

      let newProducts = [...purchaseData.products];
      const existingItemIndex = newProducts.findIndex(p => p.product.id === id);

      if (nextQty > 0) {
        const newPurchaseProductItem = {
          quantity: nextQty,
          product: product
        };
        if (existingItemIndex > -1) {
          newProducts[existingItemIndex] = newPurchaseProductItem;
        } else {
          newProducts.push(newPurchaseProductItem);
        }
      } else if (existingItemIndex > -1) {
        newProducts.splice(existingItemIndex, 1);
      }

      updatePurchaseData({ products: newProducts });

    } else if (type === ProductTypeEnum.COMBO) {
      const combo = availableCombos.find(c => c.id === id);
      if (!combo) return;

      let newCombos = [...purchaseData.combos];
      const existingItemIndex = newCombos.findIndex(c => c.combo.id === id);

      if (nextQty > 0) {
        const newPurchaseComboItem = {
          quantity: nextQty,
          combo: combo
        };
        if (existingItemIndex > -1) {
          newCombos[existingItemIndex] = newPurchaseComboItem;
        } else {
          newCombos.push(newPurchaseComboItem);
        }
      } else if (existingItemIndex > -1) {
        newCombos.splice(existingItemIndex, 1);
      }

      updatePurchaseData({ combos: newCombos });
    }
  };

  const totals = useMemo(() => {
    const productsTotal = purchaseData.products.reduce((acc, item) => {
      const price = parseFloat(item.product.price.toString());
      const discount = parseFloat(item.product.discountPercentage.toString());
      const effectivePrice = price * (1 - (isNaN(discount) ? 0 : discount) / 100);
      return acc + effectivePrice * item.quantity;
    }, 0);

    const combosTotal = purchaseData.combos.reduce((acc, item) => {
      const price = parseFloat(item.combo.price.toString());
      return acc + price * item.quantity;
    }, 0);

    const grandTotal = productsTotal + combosTotal;
    return { subtotal: productsTotal + combosTotal, grandTotal };
  }, [purchaseData.products, purchaseData.combos]);

  useEffect(() => {
    if (purchaseData.total !== totals.grandTotal) {
      setPurchaseData(prev => ({ ...prev, total: totals.grandTotal }));
    }
  }, [totals.grandTotal]);

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
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== Step.Review) return;

    const urlPaid = (() => {
      try {
        const usp = new URLSearchParams(window.location.search);
        return usp.get("paid") === "1";
      } catch { return false; }
    })();

    const maybeGoToQR = () => {
      if (purchaseData.paymentMethod === "mercadopago" && mpPreferenceId) {
        setStep(Step.QR);
      }
    };

    if (urlPaid) maybeGoToQR();

    const handler = (ev: MessageEvent) => {
      if (ev?.data?.type === "MP_PAYMENT_APPROVED") {
        maybeGoToQR();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [step, purchaseData.paymentMethod, mpPreferenceId]);

  const handleCloseDrawer = async () => {
    await animate(scope.current, { opacity: [1, 0] }, { duration: 0.25 });
    await animate("#ticket-sheet", { y: [0, height] }, { ease: "easeInOut", duration: 0.25 });
    onClose();
  };

  const handlePointerDown = (event) => {
    if (y.get() === 0) {
      y.set(0);
    }
  };

  const generatePreference = async () => {
    if (!hasMP) {
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
        total: totals.grandTotal,
        coupon: appliedCoupon?.id || null
      };

      const res = await createLiveEventPreference(fullEventDetails.id, payload);
      if (res.success) {
        setMpPreferenceId(res.data.preferenceId);
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
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const payload: InEventPurchasePayload = {
        client: purchaseData.buyer,
        products: purchaseData.products.map(p => ({ productId: p.product.id, quantity: p.quantity })),
        combos: purchaseData.combos.map(c => ({ comboId: c.combo.id, quantity: c.quantity })),
        total: totals.grandTotal,
        coupon: appliedCoupon?.id || null
      };
      const result = await submitLiveEventPurchase(payload, event.id);

      if (result.success) {
        setPurchaseCode(result.data.id)
        setStep(Step.PurchaseStatus);
      }
    } catch (error) {
      console.log(error)
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleNext = () => {
    if (step < Step.QR) {
      setStep((prevStep) => prevStep + 1 as StepKey);
    }
  };

  const handlePrevious = () => {
    if (step > Step.Buyer) {
      setStep((prevStep) => prevStep - 1 as StepKey);
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
      case Step.QR:
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
        return <BuyerStep
          buyer={purchaseData.buyer}
          setBuyer={(newBuyer) => updatePurchaseData({ buyer: newBuyer })}
        />;
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
            onPaymentMethodSelected={(method) => updatePurchaseData({ paymentMethod: method })}
          />
        );
      case Step.Review:
        return (
          <ReviewStep purchaseData={purchaseData} />
        );
      case Step.QR:
        return (
          <QRStep
            total={totals.grandTotal}
            qrValue={mpPreferenceId || ""}
            onClose={handleCloseDrawer}
          />
        );
      case Step.PurchaseStatus:
        return (
          <PurchaseStatus
            purchaseCode={purchaseCode}
            onClose={handleCloseDrawer}
          />
        );
      default:
        return null;
    }
  };

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
            ref={sheetRef}
            className="relative mx-auto w-full max-w-lg md:max-w-4xl h-[85vh] bg-zinc-900 rounded-t-lg shadow-xl flex flex-col z-50 overflow-hidden touch-none"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onPointerDown={handlePointerDown}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mt-1 cursor-grab">
              <button className="h-2 w-14 cursor-grab touch-none rounded-full bg-gray-300 active:cursor-grabbing"></button>
            </div>

            <div className="flex-grow pt-1 relative overflow-y-auto">
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
                      steps={[Step.Buyer, Step.Catalog, Step.Payment, Step.Review, Step.QR]}
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
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}