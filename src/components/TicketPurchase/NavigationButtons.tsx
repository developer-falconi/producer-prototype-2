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
  isSubmitting: boolean;
  isMercadoPagoSelected: boolean;
  isGeneratingPreference: boolean;
  hasPreferenceId: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onComplete,
  isSubmitting,
  isMercadoPagoSelected,
  isGeneratingPreference,
  hasPreferenceId
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 2;

  const isPaymentMethodStep = currentStep === 5;
  const isOrderSummaryStep = currentStep === 6;
  const isLastClickableStep = currentStep === (totalSteps - 2);

  let nextButtonText = 'Continuar';
  let nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
  let nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
  let nextButtonAction = onNext;

  if (isFirstStep) {
    nextButtonText = 'Comprar Tickets';
    nextButtonIcon = <Ticket className="w-4 h-4 mr-2" />;
    nextButtonClass = 'w-full bg-red-700 hover:bg-red-700/80';
  } else if (isPaymentMethodStep) {
    if (isMercadoPagoSelected && !hasPreferenceId) {
      nextButtonText = isGeneratingPreference ? 'Generando pago...' : 'Generar Link de Pago';
      nextButtonIcon = isGeneratingPreference ? <SmallSpinner /> : <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      nextButtonAction = onNext;
    } else if (isMercadoPagoSelected && hasPreferenceId) {
      nextButtonText = 'Continuar al Resumen';
      nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
      nextButtonAction = onNext;
    } else {
      nextButtonText = 'Continuar';
      nextButtonIcon = <ChevronRight className="w-4 h-4 ml-2" />;
      nextButtonClass = 'bg-green-700 hover:bg-green-700/80';
      nextButtonAction = onNext;
    }
  } else if (isOrderSummaryStep) {
    if (isMercadoPagoSelected && hasPreferenceId) {
      nextButtonText = 'Confirmar Compra';
      nextButtonIcon = isSubmitting ? <SmallSpinner /> : <Check className="w-4 h-4 mr-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      nextButtonAction = onComplete;
    } else {
      nextButtonText = 'Confirmar Compra';
      nextButtonIcon = isSubmitting ? <SmallSpinner /> : <Check className="w-4 h-4 mr-2" />;
      nextButtonClass = 'bg-blue-700 hover:bg-blue-700/80';
      nextButtonAction = onComplete;
    }
  }
  
  return (
    <div className="w-full bg-black/50 backdrop-blur-sm p-2">
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            onClick={onPrevious}
            className="flex-1 bg-red-700 hover:bg-red-700/80"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
        )}

        <Button
          onClick={isLastStep ? onComplete : onNext}
          disabled={!canProceed || isGeneratingPreference || isSubmitting}
          className={cn(
            "flex-1",
            nextButtonClass,
            isFirstStep ? 'w-full bg-red-700 hover:bg-red-700/80' : '',
          )}
        >
          <div className='flex items-center justify-center gap-2'>
            {nextButtonIcon}
            {nextButtonText}
          </div>
        </Button>
      </div>
    </div>
  );
};
