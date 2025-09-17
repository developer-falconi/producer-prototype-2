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
  mpPublicKey: string | null;
  eventStarted: boolean;
  onStartPayment: () => void;
  onTrack: (action: string, payload?: Record<string, any>) => void;
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
  onStartPayment,
  onTrack
}) => {
  const isInitialStep = currentStep === 0;
  const isFinalStatusStep = currentStep === totalSteps;

  const [loadingMpButton, setLoadingMpButton] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [mountWallet, setMountWallet] = useState(false);

  const canShowWallet = useMemo(() => (
    isConfirmationStep &&
    isMercadoPagoSelected &&
    !!mpPreferenceId &&
    !!mpPublicKey
  ), [isConfirmationStep, isMercadoPagoSelected, mpPreferenceId, mpPublicKey]);

  useEffect(() => {
    if (canShowWallet && !mountWallet) {
      setMountWallet(true);
      onTrack?.('mp_wallet_mounted', { step: currentStep });
    }
  }, [canShowWallet, mountWallet, currentStep, onTrack]);

  useEffect(() => {
    if (!loadingMpButton) {
      onTrack?.('mp_wallet_loaded', { step: currentStep });
    }
  }, [loadingMpButton, currentStep, onTrack]);

  const walletNode = useMemo(() => {
    if (!mpPublicKey || !mpPreferenceId) return null;
    const handleStartPayment = () => {
      onTrack?.('mp_wallet_pay_clicked', { step: currentStep });
      onStartPayment();
    };
    return (
      <MercadoPagoButton
        mpPublicKey={mpPublicKey}
        preferenceId={mpPreferenceId}
        loadingButton={loadingMpButton}
        setLoadingButton={setLoadingMpButton}
        onStartPayment={handleStartPayment}
      />
    );
  }, [mpPublicKey, mpPreferenceId, onStartPayment, loadingMpButton, currentStep, onTrack]);

  const handlePrev = () => {
    onTrack?.('checkout_prev_clicked', { step: currentStep });
    onPrevious();
  };

  const handleGeneratePreference = () => {
    onTrack?.('mp_generate_preference_clicked', { step: currentStep });
    onGeneratePreference();
  };

  const handleConfirm = () => {
    onTrack?.('checkout_confirm_clicked', { step: currentStep });
    onComplete();
  };

  const handleNext = () => {
    if (isInitialStep) {
      onTrack?.('checkout_cta_clicked', {
        step: currentStep,
        mode: eventStarted ? 'products' : 'tickets',
      });
    } else if (isPaymentMethodStep && isMercadoPagoSelected && !mpPreferenceId) {
      onTrack?.('mp_generate_preference_attempt_from_next', { step: currentStep });
    } else if (isConfirmationStep) {
      onTrack?.('checkout_next_on_confirmation', { step: currentStep });
    } else {
      onTrack?.('checkout_next_clicked', { step: currentStep });
    }
    onNext();
  };

  let nextButtonText = "Continuar";
  let nextButtonIcon: React.ReactNode = <ChevronRight className="w-4 h-4 ml-2" />;
  let nextButtonClass = "bg-green-700 hover:bg-green-700/80";
  let nextButtonAction = handleNext;
  let disableNextButton = !canProceed || isGeneratingPreference || isSubmitting || isLoading;

  if (isConfirmationStep) disableNextButton ||= !termsAccepted;

  const shouldRenderNextButton = !(isMercadoPagoSelected && isConfirmationStep && mpPreferenceId);

  if (isInitialStep) {
    nextButtonText = !eventStarted ? 'Comprar Tickets' : 'Comprar Productos';
    nextButtonIcon = <Ticket className="w-4 h-4 mr-2" />;
    nextButtonClass = 'w-full bg-red-700 hover:bg-red-700/80';
    nextButtonAction = handleNext;
  } else if (isPaymentMethodStep && isMercadoPagoSelected) {
    if (!mpPreferenceId) {
      nextButtonText = isGeneratingPreference ? 'Generando pago...' : 'Generar Link de Pago';
      nextButtonIcon = isGeneratingPreference ? <SmallSpinner /> : <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-[#001B97] hover:bg-[#001B97]/80';
      nextButtonAction = handleGeneratePreference;
    } else {
      nextButtonText = 'Continuar';
      nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
      nextButtonAction = handleNext;
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
      nextButtonClass = 'bg-[#001B97] hover:bg-[#001B97]/80';
      nextButtonAction = handleConfirm;
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
      {isConfirmationStep && (
        <div className="flex flex-row items-start space-x-2 text-white">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => {
              const accepted = Boolean(checked);
              setTermsAccepted(accepted);
              onTrack?.('terms_toggle', { accepted, step: currentStep });
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

      <div
        className={cn(
          isConfirmationStep && isMercadoPagoSelected ? "flex flex-col gap-2" : "flex gap-3",
          "w-full"
        )}
      >
        {canShowWallet && (
          <div className="relative w-full">
            {!termsAccepted && (
              <div className="absolute inset-0 z-20 rounded-lg bg-black/40 pointer-events-auto" />
            )}
            <div
              className={cn("relative", !termsAccepted && "pointer-events-none")}
              aria-disabled={!termsAccepted}
            >
              {walletNode}
            </div>
          </div>
        )}

        {currentStep > 0 && !isFinalStatusStep && (
          <Button
            onClick={handlePrev}
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