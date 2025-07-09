import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onComplete,
  isSubmitting
}) => {
  const isLastStep = currentStep === totalSteps - 2;

  return (
    <div className="w-full bg-black/50 backdrop-blur-sm p-2">
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            onClick={onPrevious}
            className="flex-1 bg-red-700"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
        )}

        <Button
          onClick={isLastStep ? onComplete : onNext}
          disabled={!canProceed}
          className={cn(
            "flex-1", isLastStep ? 'bg-blue-700' : 'bg-green-700'
          )}
        >
          {isLastStep ? (
            <div className='flex items-center gap-2'>
              {isSubmitting ? (
                <SmallSpinner />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirmar Compra
            </div>
          ) : (
            <>
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};