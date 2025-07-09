import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  steps: string[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, steps }) => {
  const adjustedSteps = steps.slice(1, steps.length - 1); // Skip first and last step
  const adjustedCurrentStep = currentStep - 1; // Adjust for skipping first step

  return (
    <div className="py-4 px-8">
      {/* Render ProgressBar only when it's not on the first or last step */}
      {currentStep > 0 && currentStep < steps.length - 1 && (
        <div className="flex items-center justify-between">
          {adjustedSteps.map((step, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center",
                index < adjustedSteps.length - 1 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  index <= adjustedCurrentStep
                    ? "bg-blue-600 text-white shadow-glow"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < adjustedCurrentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < adjustedSteps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                    index < adjustedCurrentStep ? "bg-blue-600" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
