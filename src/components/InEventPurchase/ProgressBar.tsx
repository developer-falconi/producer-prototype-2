import { StepKey } from "./InEventPurchaseFlow";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  steps: StepKey[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, steps }) => {
  return (
    <div className="py-4 px-8">
      {currentStep > 0 && currentStep < steps.length && (
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  index < currentStep
                    ? "bg-blue-600 text-white shadow-glow"
                    : index === currentStep
                    ? "bg-[#001B97] text-white shadow-md"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                    index < currentStep ? "bg-blue-600" : "bg-muted"
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
