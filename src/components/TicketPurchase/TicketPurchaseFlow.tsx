import React, { useEffect, useRef, useState } from 'react';
import { TicketSelection } from './TicketSelection';
import { AttendeeData } from './AttendeeData';
import { ContactInfo } from './ContactInfo';
import { PaymentMethod } from './PaymentMethod';
import { OrderSummary } from './OrderSummary';
import { ProgressBar } from './ProgressBar';
import { ClientData, Event, GenderEnum, Prevent, PurchaseData } from '@/lib/types';
import { PurchaseStatus } from './PurchaseStatus';
import { NavigationButtons } from './NavigationButtons';
import { motion, AnimatePresence, PanInfo, useAnimation, useDragControls, useAnimate, useMotionValue } from "framer-motion";
import { fetchProducerEventDetailData, submitTicketForm } from '@/lib/api';
import Spinner from '../Spinner';
import { Button } from '../ui/button';
import { EventInfo } from './EventInfo';
import useMeasure from "react-use-measure";

const steps = [
  'Seleccionar Entradas',
  'Datos de Asistentes',
  'Información de Contacto',
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
    email: '',
    comprobante: undefined,
    paymentMethod: null
  });
  const [fullEventDetails, setFullEventDetails] = useState<Event | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<{ status: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const total = purchaseData?.selectedPrevent
    ? purchaseData?.selectedPrevent?.price * purchaseData?.ticketQuantity
    : 0;

  //motion
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  const [scope, animate] = useAnimate();
  const [sheetRef, { height }] = useMeasure();
  const y = useMotionValue(0);
  const dragControls = useDragControls();

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

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return purchaseData.selectedPrevent !== null && purchaseData.ticketQuantity > 0;
      case 2:
        if (purchaseData.ticketQuantity === 0) return false;
        return purchaseData.clients.every(client => client.isCompleted);
      case 3:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(purchaseData.email);
      case 4:
        return purchaseData.paymentMethod && purchaseData.paymentMethod === 'bank_transfer' && !!purchaseData.comprobante;
      case 5:
        return true;
      default: return true;
    }
  };

  const adjustedSteps = steps.slice(1, steps.length - 1);

  const handleNext = () => {
    if (currentStep < adjustedSteps.length) {
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
      email: '',
      comprobante: undefined,
      paymentMethod: null
    });
  }

  const handleComplete = async () => {
    const updatedParticipants = purchaseData.clients.map(participant => ({
      ...participant,
      email: purchaseData.email
    }));

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const submitData = new FormData();
      submitData.append('clients', JSON.stringify(updatedParticipants));

      if (purchaseData.comprobante) {
        submitData.append('comprobante', purchaseData.comprobante);
      }

      const result = await submitTicketForm(submitData, initialEvent.id, purchaseData.selectedPrevent.id);
      if (result.success) {
        setSubmissionStatus({ status: 'success', message: result['message'] || "¡Compra Exitosa! 🎉" });
      } else {
        setSubmissionStatus({ status: 'error', message: result['message'] || "Error al procesar tu compra. Por favor, inténtalo de nuevo." });
      }

      setCurrentStep(steps.length - 1);
    } catch (error) {
      setSubmissionStatus({ status: 'error', message: "Error enviando información" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDrawer = async () => {
    animate(scope.current, { opacity: [1, 0] });
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

  const onDragEndSheet = (_: any, info: PanInfo) => {
    if (y.get() >= 100) {
      handleCloseDrawer();
    } else {
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <EventInfo
            event={fullEventDetails}
          />
        );
      case 1:
        return (
          <TicketSelection
            eventData={fullEventDetails}
            purchaseData={purchaseData}
            onUpdatePurchase={onUpdatePurchase}
          />
        );
      case 2:
        return (
          <AttendeeData
            purchaseData={purchaseData}
            onUpdateClient={updateClient}
          />
        );
      case 3:
        return (
          <ContactInfo
            purchaseData={purchaseData}
            onUpdateEmail={updateEmail}
          />
        );
      case 4:
        return (
          <PaymentMethod
            eventData={fullEventDetails}
            purchaseData={purchaseData}
            onUpdatePaymentMethod={updatePaymentMethod}
            onUpdatePurchaseFile={updatePaymentFile}
          />
        );
      case 5:
        return (
          <OrderSummary
            eventData={fullEventDetails}
            purchaseData={purchaseData}
          />
        );
      case steps.length - 1:
        return (<PurchaseStatus
          purchaseData={purchaseData}
          total={total}
          status={submissionStatus}
          onResetAndClose={handleCloseDrawer}
        />);
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
          className="fixed inset-0 flex items-end justify-center z-40"
        >
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCloseDrawer}
          />

          <motion.div
            id="ticket-sheet"
            ref={sheetRef}
            className="relative mx-auto w-full max-w-lg md:max-w-4xl h-[85vh] bg-zinc-900 rounded-t-lg shadow-xl flex flex-col z-50 overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ y }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={onDragEndSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex justify-center mt-1 cursor-grab"
            >
              <button
                onPointerDown={(e) => {
                  dragControls.start(e);
                }}
                className="h-2 w-14 cursor-grab touch-none rounded-full bg-gray-300 active:cursor-grabbing"
              ></button>
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
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <ProgressBar currentStep={currentStep} steps={steps} />
                  )}

                  {/* Content */}
                  <div className="animate-fade-in">
                    {renderCurrentStep()}
                  </div>
                </>
              )}
            </div>
            {currentStep !== steps.length - 1 && (
              <NavigationButtons
                currentStep={currentStep}
                totalSteps={steps.length}
                canProceed={canProceed()}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onComplete={handleComplete}
                isSubmitting={isSubmitting}
              />
            )}
            {/* Navigation */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};