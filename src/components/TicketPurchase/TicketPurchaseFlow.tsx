import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TicketSelection } from './TicketSelection';
import { AttendeeData } from './AttendeeData';
import { ContactInfo } from './ContactInfo';
import { PaymentMethod } from './PaymentMethod';
import { OrderSummary } from './OrderSummary';
import { ProgressBar } from './ProgressBar';
import { ClientData, Event, GenderEnum, Prevent, PurchaseComboItem, PurchaseData, PurchaseProductItem } from '@/lib/types';
import { PurchaseStatus } from './PurchaseStatus';
import { NavigationButtons } from './NavigationButtons';
import { motion, AnimatePresence, PanInfo, useDragControls, useAnimate, useMotionValue } from "framer-motion";
import { createPreference, fetchProducerEventDetailData, submitTicketForm } from '@/lib/api';
import Spinner from '../Spinner';
import { Button } from '../ui/button';
import { EventInfo } from './EventInfo';
import useMeasure from "react-use-measure";
import { ProductSelection } from './ProductSelection';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { toast } from 'sonner';

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
  initialEvent: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketPurchaseFlow: React.FC<TicketPurchaseFlowProps> = ({ initialEvent, isOpen, onClose }) => {
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
    total: 0
  });
  const [fullEventDetails, setFullEventDetails] = useState<Event | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<{ status: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [mpGeneratingPreference, setMpGeneratingPreference] = useState<boolean>(false);

  //motion
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  const [scope, animate] = useAnimate();
  const [sheetRef, { height }] = useMeasure();
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const [isAtTop, setIsAtTop] = useState(true);

  const isSDKInitializedRef = useRef(false);
  const mpPublicKey = useMemo(() => {
    return fullEventDetails?.oAuthMercadoPago?.mpPublicKey || null;
  }, [fullEventDetails]);

  useEffect(() => {
    if (isOpen && mpPublicKey && !isSDKInitializedRef.current) {
      initMercadoPago(mpPublicKey, { locale: 'es-AR' });
      isSDKInitializedRef.current = true;
      console.log('Mercado Pago SDK initialized successfully.');
    }
  }, [isOpen, mpPublicKey]);

  const dynamicSteps = useMemo(() => {
    if (!fullEventDetails) return steps;

    let currentDynamicSteps = [...steps];

    if (fullEventDetails.products?.length === 0 && fullEventDetails.combos?.length === 0) {
      currentDynamicSteps = currentDynamicSteps.filter(step => step !== 'Productos');
    }

    return currentDynamicSteps;
  }, [fullEventDetails]);

  useEffect(() => {
    if (isOpen && !fullEventDetails) {
      (async () => {
        try {
          setLoadingDetails(true);
          const resp = await fetchProducerEventDetailData(initialEvent.id);

          if (resp.success && resp.data) {
            setFullEventDetails(resp.data);
            const activePrevents = (resp.data.prevents || []).filter((p: Prevent) => p.status === 'ACTIVE' && p.quantity > 0);
            let initialSelectedPrevent: Prevent | null = null;

            if (resp.data.featuredPrevent && activePrevents.some(p => p.id === resp.data.featuredPrevent!.id)) {
              initialSelectedPrevent = resp.data.featuredPrevent;
            } else if (activePrevents.length > 0) {
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

    const handleScroll = () => {
      if (scrollableContentRef.current) {
        setIsAtTop(scrollableContentRef.current.scrollTop === 0);
      }
    };

    const currentScrollRef = scrollableContentRef.current;
    if (currentScrollRef) {
      currentScrollRef.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen, initialEvent.id, fullEventDetails]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const ticketPrice = purchaseData.selectedPrevent?.price || 0;
    const subtotalTickets = ticketPrice * purchaseData.ticketQuantity;

    const totalProductsPrice = purchaseData.products.reduce(
      (sum, item) => {
        const priceNum = parseFloat(item.product.price.toString());
        const discountNum = parseFloat(item.product.discountPercentage.toString());
        const effectivePrice = priceNum * (1 - discountNum / 100);
        return sum + effectivePrice * item.quantity;
      },
      0
    );

    const totalCombosPrice = purchaseData.combos.reduce(
      (sum, item) => {
        const priceNum = parseFloat(item.combo.price.toString());
        return sum + priceNum * item.quantity;
      },
      0
    );

    const subtotalAllItems = subtotalTickets + totalProductsPrice + totalCombosPrice;
    const newTotal = subtotalAllItems;

    if (purchaseData.total !== newTotal) {
      setPurchaseData(prev => ({ ...prev, total: newTotal }));
    }
  }, [
    purchaseData.selectedPrevent,
    purchaseData.ticketQuantity,
    purchaseData.products,
    purchaseData.combos,
    purchaseData.total
  ]);

  const onUpdatePurchase = (data: Partial<PurchaseData>) => {
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
  };

  const updateClient = (index: number, field: keyof ClientData, value: string) => {
    const newClients = [...purchaseData.clients];
    newClients[index] = { ...newClients[index], [field]: value };
    setPurchaseData({ ...purchaseData, clients: newClients });
  };

  const updateEmail = (email: string) => {
    setPurchaseData({ ...purchaseData, email });
  };

  const updatePaymentMethod = (paymentMethod: 'mercadopago' | 'bank_transfer') => {
    setPurchaseData({ ...purchaseData, paymentMethod });
  };

  const updatePaymentFile = (file: File) => {
    setPurchaseData({ ...purchaseData, comprobante: file });
  };

  const handleUpdateProductsAndCombos = (products: PurchaseProductItem[], combos: PurchaseComboItem[]) => {
    setPurchaseData(prev => ({ ...prev, products, combos }));
  };

  const generateMercadoPagoPreference = async () => {
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

    try {
      const res = await createPreference(purchaseData.selectedPrevent.id, updatedParticipants, updatedProducts, updatedCombos, purchaseData.total);
      if (res.success) {
        setMpPreferenceId(res.data.preferenceId);
        setMpGeneratingPreference(false);
        setCurrentStep(currentStep + 1);
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
  };

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

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }
    if (!mpGeneratingPreference && currentStep < dynamicSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setPurchaseData({
      selectedPrevent: null,
      ticketQuantity: 0,
      clients: [],
      products: [],
      combos: [],
      email: '',
      comprobante: undefined,
      paymentMethod: null,
      total: 0
    });
    setMpPreferenceId(null);
    setMpGeneratingPreference(false);
  }

  const handleComplete = async () => {
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

      if (purchaseData.comprobante) {
        submitData.append('comprobante', purchaseData.comprobante);
      }

      const result = await submitTicketForm(submitData, initialEvent.id, purchaseData.selectedPrevent.id, purchaseData.total);
      if (result.success) {
        setSubmissionStatus({ status: 'success', message: result['message'] || "¡Compra Exitosa! 🎉" });
      } else {
        setSubmissionStatus({ status: 'error', message: result['message'] || "Error al procesar tu compra. Por favor, inténtalo de nuevo." });
      }

      setCurrentStep(dynamicSteps.length);
    } catch (error) {
      setSubmissionStatus({ status: 'error', message: "Error enviando información" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDrawer = async () => {
    await animate(scope.current, { opacity: [1, 0] }, { duration: 0.3 });

    const yStart = typeof y.get() === "number" ? y.get() : 0;
    await animate("#ticket-sheet", { y: [yStart, height] }, {
      ease: "easeInOut",
      duration: 0.3
    });

    setCurrentStep(0);
    setFullEventDetails(null);
    setErrorDetails(null);
    handleReset();
    onClose();
  };

  const onDragEndSheet = async (_: any, info: PanInfo) => {
    if (y.get() >= 100) {
      handleCloseDrawer();
    } else {
      await animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  const handlePointerDown = (event) => {
    if (isAtTop) {
      dragControls.start(event);
    }
  };

  const renderCurrentStep = () => {
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
  };

  const isConfirmationStep = dynamicSteps[currentStep - 1] === 'Confirmación';
  const isPaymentMethodStep = dynamicSteps[currentStep - 1] === 'Método de Pago';

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
            onDragEnd={onDragEndSheet}
            onPointerDown={handlePointerDown}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: isAtTop ? 'grab' : 'auto', y }}
          >
            <div
              className="flex justify-center mt-1 cursor-grab"
            >
              <button className="h-2 w-14 cursor-grab touch-none rounded-full bg-gray-300 active:cursor-grabbing"></button>
            </div>

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
                  {/* Progress Bar */}
                  {currentStep > 0 && currentStep <= dynamicSteps.length && (
                    <ProgressBar currentStep={currentStep} steps={dynamicSteps} />
                  )}

                  {/* Content */}
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
                mpPublicKey={mpPublicKey}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};