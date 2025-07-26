import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import SmallSpinner from '../SmallSpinner';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  isLoading: boolean;
  isSubmitting: boolean;
  isMercadoPagoSelected: boolean;
  isGeneratingPreference: boolean;
  hasPreferenceId: boolean;
  isConfirmationStep: boolean;
  isPaymentMethodStep: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onComplete,
  isLoading,
  isSubmitting,
  isMercadoPagoSelected,
  isGeneratingPreference,
  hasPreferenceId,
  isConfirmationStep,
  isPaymentMethodStep
}) => {
  const isInitialStep = currentStep === 0;
  const isFinalStatusStep = currentStep === totalSteps;

  let nextButtonText = 'Continuar';
  let nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
  let nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
  let nextButtonAction = onNext;
  let disableNextButton = !canProceed || isGeneratingPreference || isSubmitting || isLoading;

  const shouldRenderNextButton = !(isMercadoPagoSelected && isConfirmationStep && hasPreferenceId);
  console.log(isPaymentMethodStep, isInitialStep, currentStep, totalSteps)
  if (isInitialStep) {
    nextButtonText = 'Comprar Tickets';
    nextButtonIcon = <Ticket className="w-4 h-4 mr-2" />;
    nextButtonClass = 'w-full bg-red-700 hover:bg-red-700/80';
    nextButtonAction = onNext;
    disableNextButton = isLoading;
  } else if (isPaymentMethodStep && isMercadoPagoSelected) {
    if (!hasPreferenceId) {
      nextButtonText = isGeneratingPreference ? 'Generando pago...' : 'Generar Link de Pago';
      nextButtonIcon = isGeneratingPreference ? <SmallSpinner /> : <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      disableNextButton = isGeneratingPreference || isLoading || !canProceed;
    } else {
      nextButtonText = 'Continuar';
      nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
      disableNextButton = !canProceed || isLoading;
    }
  } else if (isConfirmationStep) {
    if (isMercadoPagoSelected && hasPreferenceId) {
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

  return (
    <div className="w-full bg-black/50 backdrop-blur-sm p-2">
      <div className="flex gap-3">
        {currentStep > 0 && !isFinalStatusStep && (
          <Button
            onClick={onPrevious}
            className="flex-1 bg-red-700 hover:bg-red-700/80"
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