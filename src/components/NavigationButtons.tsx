import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import SmallSpinner from './SmallSpinner';
import MercadoPagoButton from './MercadoPago';
import { Checkbox } from './ui/checkbox';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  onGeneratePreference: () => void;
  isLoading: boolean;
  isSubmitting: boolean;
  isMercadoPagoSelected: boolean;
  isGeneratingPreference: boolean;
  isConfirmationStep: boolean;
  isPaymentMethodStep: boolean;
  mpPreferenceId: string | null;
  mpPublicKey: string;
  eventStarted: boolean;
  onStartPayment: () => void;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onComplete,
  onGeneratePreference,
  isLoading,
  isSubmitting,
  isMercadoPagoSelected,
  isGeneratingPreference,
  isConfirmationStep,
  isPaymentMethodStep,
  mpPreferenceId,
  mpPublicKey,
  eventStarted,
  onStartPayment
}) => {
  const isInitialStep = currentStep === 0;
  const isFinalStatusStep = currentStep === totalSteps;

  const [loadingMpButton, setLoadingMpButton] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [mountWallet, setMountWallet] = useState(false);

  useEffect(() => {
    const canMount =
      isConfirmationStep &&
      isMercadoPagoSelected &&
      !!mpPreferenceId &&
      !!mpPublicKey &&
      termsAccepted;

    if (canMount && !mountWallet) setMountWallet(true);
  }, [
    isConfirmationStep,
    isMercadoPagoSelected,
    mpPreferenceId,
    mpPublicKey,
    termsAccepted,
    mountWallet,
  ]);

  const walletNode = useMemo(() => {
    if (!mpPublicKey || !mpPreferenceId) return null;
    return (
      <MercadoPagoButton
        mpPublicKey={mpPublicKey}
        preferenceId={mpPreferenceId}
        loadingButton={loadingMpButton}
        setLoadingButton={setLoadingMpButton}
        onStartPayment={onStartPayment}
      />
    );
  }, [mpPublicKey, mpPreferenceId, onStartPayment, loadingMpButton]);

  let nextButtonText = "Continuar";
  let nextButtonIcon: React.ReactNode = <ChevronRight className="w-4 h-4 ml-2" />;
  let nextButtonClass = "bg-green-700 hover:bg-green-700/80";
  let nextButtonAction = onNext;
  let disableNextButton = !canProceed || isGeneratingPreference || isSubmitting || isLoading;

  if (isConfirmationStep) disableNextButton ||= !termsAccepted;


  const shouldRenderNextButton = !(isMercadoPagoSelected && isConfirmationStep && mpPreferenceId);

  if (isInitialStep) {
    nextButtonText = !eventStarted ? 'Comprar Tickets' : 'Comprar Productos';
    nextButtonIcon = <Ticket className="w-4 h-4 mr-2" />;
    nextButtonClass = 'w-full bg-red-700 hover:bg-red-700/80';
    nextButtonAction = onNext;
  } else if (isPaymentMethodStep && isMercadoPagoSelected) {
    if (!mpPreferenceId) {
      nextButtonText = isGeneratingPreference ? 'Generando pago...' : 'Generar Link de Pago';
      nextButtonIcon = isGeneratingPreference ? <SmallSpinner /> : <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      nextButtonAction = onGeneratePreference;
    } else {
      nextButtonText = 'Continuar';
      nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
    }
  } else if (isConfirmationStep) {
    if (isMercadoPagoSelected && mpPreferenceId) {
      nextButtonText = '';
      nextButtonIcon = null;
      nextButtonClass = '';
      nextButtonAction = () => { };
    } else {
      nextButtonText = 'Confirmar Compra';
      nextButtonIcon = isSubmitting ? <SmallSpinner /> : <Check className="w-4 h-4 mr-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      nextButtonAction = onComplete;
    }
  }

  return (
    <div
      className={cn(
        "w-full sticky bottom-0 bg-black/60 backdrop-blur-md p-2 pt-3",
        "border-t border-white/10",
        "flex flex-col gap-3",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
      role="region"
      aria-label="Acciones del flujo de compra"
    >
      {/* Checkbox row is now a standalone item in the flex-col container */}
      {isConfirmationStep && (
        <div className="flex flex-row items-start space-x-2 text-white">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => {
              setTermsAccepted(Boolean(checked));
            }}
            className='border-white'
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Acepto los{' '}
            <a href="https://www.produtik.com/terminos" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Términos y Condiciones
            </a>
          </label>
        </div>
      )}

      {/* This new div acts as a container for the buttons, keeping them in a row */}
      <div
        className={cn(
          isConfirmationStep && isMercadoPagoSelected ? "flex flex-col gap-2" : "flex gap-3",
          "w-full"
        )}
      >
        {/* Botón MPM */}
        {isConfirmationStep && isMercadoPagoSelected && mountWallet && (
          <div className="relative w-full">
            {!termsAccepted && (
              <div className="absolute inset-0 z-20 rounded-lg bg-black/40 pointer-events-auto" />
            )}
            <div className={cn("relative", !termsAccepted && "pointer-events-none")} aria-disabled={!termsAccepted}>
              {walletNode}
            </div>
          </div>
        )}

        {/* Botón Anterior */}
        {currentStep > 0 && !isFinalStatusStep && (
          <Button
            onClick={onPrevious}
            className={cn(
              "bg-red-700 hover:bg-red-700/80",
              isConfirmationStep && isMercadoPagoSelected ? 'w-full' : 'flex-1'
            )}
            disabled={isLoading || isSubmitting || isGeneratingPreference}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
        )}

        {shouldRenderNextButton && !isFinalStatusStep && (
          <Button
            onClick={nextButtonAction}
            disabled={disableNextButton}
            className={cn(
              "flex-1",
              nextButtonClass,
              isInitialStep ? 'w-full bg-red-700 hover:bg-red-700/80' : '',
            )}
          >
            <div className='flex items-center justify-center gap-2'>
              {nextButtonIcon}
              {nextButtonText}
            </div>
          </Button>
        )}
      </div>
    </div>
  );
};