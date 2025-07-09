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
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { fetchProducerEventDetailData, submitTicketForm } from '@/lib/api';
import Spinner from '../Spinner';
import { Button } from '../ui/button';
import { EventInfo } from './EventInfo';

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
  const [purchaseFlowCompleted, setPurchaseFlowCompleted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ status: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const total = purchaseData?.selectedPrevent
    ? purchaseData?.selectedPrevent?.price * purchaseData?.ticketQuantity
    : 0;

  //motion
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

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
              clients: Array.from({ length: initialSelectedPrevent ? 1 : 0 }, () => ({ fullName: '', docNumber: '', gender: '' as GenderEnum, phone: '' }))
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

  // Handlers
  const onUpdatePurchase = (data: Partial<PurchaseData>) => {
    setPurchaseData(prevPurchaseData => {
      const newPurchaseData = { ...prevPurchaseData, ...data };

      if (data.ticketQuantity !== undefined && data.ticketQuantity !== prevPurchaseData.ticketQuantity) {
        const newClients = Array.from({ length: data.ticketQuantity }, (_, i) =>
          prevPurchaseData.clients[i] || { fullName: '', docNumber: '', gender: '' as GenderEnum, phone: '' }
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
        return purchaseData.clients.every(client =>
          client.fullName && client.docNumber && client.gender && client.phone
        );
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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
    setSubmissionStatus(null);
    setPurchaseFlowCompleted(false);
  }

  const handleComplete = async () => {
    const updatedParticipants = purchaseData.clients.map(participant => ({
      ...participant,
      email: purchaseData.email
    }));

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('clients', JSON.stringify(updatedParticipants));

      if (purchaseData.comprobante) {
        submitData.append('comprobante', purchaseData.comprobante);
      }

      const result = await submitTicketForm(submitData, initialEvent.id, purchaseData.selectedPrevent.id);

      if (result.success) {
        setSubmissionStatus({ status: 'success', message: result['message'] || "¡Compra Exitosa! 🎉" });
        setPurchaseFlowCompleted(true);
        // handleReset();
      } else {
        setSubmissionStatus({ status: 'error', message: result['message'] || "Error al procesar tu compra. Por favor, inténtalo de nuevo." });
      }
    } catch (error) {
      setSubmissionStatus({ status: 'error', message: "Error enviando información" });
    } finally {
      setIsSubmitting(false);
      setCurrentStep(steps.length - 1);
    }
  };

  const resetAndClose = () => {
    setCurrentStep(0);
    setFullEventDetails(null);
    setErrorDetails(null);
    setSubmissionStatus(null);
    setPurchaseFlowCompleted(false);
    onClose();
  };

  const onDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      resetAndClose();
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
        return (
          <PurchaseStatus
            purchaseData={purchaseData}
            total={total}
            status={submissionStatus}
            onResetAndClose={resetAndClose}
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-end justify-center z-40"
        >
          <motion.div
            key="backdrop"
            ref={backdropRef}
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
          />

          <motion.div
            key="sheet"
            className="relative mx-auto w-full max-w-lg md:max-w-4xl h-[90vh] bg-zinc-900 rounded-t-lg shadow-xl flex flex-col z-50 overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mt-2">
              <div className="w-12 h-1 rounded-full bg-gray-300 cursor-grab" />
            </div>
            <div className="flex-grow overflow-y-auto pt-2">
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
                  <ProgressBar currentStep={currentStep} steps={steps} />

                  {/* Content */}
                  <div className="p-4 animate-fade-in">
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