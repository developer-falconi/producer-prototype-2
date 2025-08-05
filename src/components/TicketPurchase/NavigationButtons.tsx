import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import SmallSpinner from '../SmallSpinner';
import MercadoPagoButton from '../MercadoPago';

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
  mpPublicKey
}) => {
  const isInitialStep = currentStep === 0;
  const isFinalStatusStep = currentStep === totalSteps;

  const [loadingMpButton, setLoadingMpButton] = useState(true);

  let nextButtonText = 'Continuar';
  let nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
  let nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
  let nextButtonAction = onNext;
  let disableNextButton = !canProceed || isGeneratingPreference || isSubmitting || isLoading;

  const shouldRenderNextButton = !(isMercadoPagoSelected && isConfirmationStep && mpPreferenceId);

  if (isInitialStep) {
    nextButtonText = 'Comprar Tickets';
    nextButtonIcon = <Ticket className="w-4 h-4 mr-2" />;
    nextButtonClass = 'w-full bg-red-700 hover:bg-red-700/80';
    nextButtonAction = onNext;
    disableNextButton = isLoading;
  } else if (isPaymentMethodStep && isMercadoPagoSelected) {
    if (!mpPreferenceId) {
      nextButtonText = isGeneratingPreference ? 'Generando pago...' : 'Generar Link de Pago';
      nextButtonIcon = isGeneratingPreference ? <SmallSpinner /> : <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      nextButtonAction = onGeneratePreference;
      disableNextButton = isGeneratingPreference || isLoading || !canProceed;
    } else {
      nextButtonText = 'Continuar';
      nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
      disableNextButton = !canProceed || isLoading;
    }
  } else if (isConfirmationStep) {
    if (isMercadoPagoSelected && mpPreferenceId) {
      nextButtonText = '';
      nextButtonIcon = null;
      nextButtonClass = '';
      nextButtonAction = () => { };
      disableNextButton = true;
    } else {
      nextButtonText = 'Confirmar Compra';
      nextButtonIcon = isSubmitting ? <SmallSpinner /> : <Check className="w-4 h-4 mr-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      nextButtonAction = onComplete;
      disableNextButton = isSubmitting || !canProceed || isLoading;
    }
  }

  const containerClasses = cn(
    "w-full bg-black/50 backdrop-blur-sm p-2",
    isConfirmationStep && isMercadoPagoSelected ? 'flex flex-col gap-1' : 'flex gap-3'
  );

  return (
    <div className={containerClasses}>
      {/* Botón MPM */}
      {isConfirmationStep && isMercadoPagoSelected && mpPreferenceId && mpPublicKey && (
        <MercadoPagoButton
          preferenceId={mpPreferenceId}
          publicKey={mpPublicKey}
          loadingButton={loadingMpButton}
          setLoadingButton={setLoadingMpButton}
        />
      )}

      {/* Botón Anterior */}
      {currentStep > 0 && !isFinalStatusStep && (
        <Button
          onClick={onPrevious}
          className={cn(
            "bg-red-700 hover:bg-red-700/80",
            // Hace que el botón de anterior ocupe todo el ancho en el paso de confirmación con MP
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
  );
};