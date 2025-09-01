import * as React from "react";
import { cn } from "@/lib/utils";

type FormInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
};

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      iconLeft,
      wrapperClassName,
      inputClassName,
      ...props
    },
    ref
  ) => {
    const invalid = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 inline-block text-xs uppercase tracking-wide text-zinc-300"
          >
            {label}
          </label>
        )}

        {/* Wrapper con ring sólo aquí */}
        <div
          className={cn(
            "group flex items-center gap-2 rounded-xl border bg-zinc-900 px-3",
            invalid ? "border-red-500/40" : "border-white/10",
            "focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50",
            wrapperClassName
          )}
        >
          {iconLeft && <span className="text-zinc-400">{iconLeft}</span>}

          {/* Input nativo, sin ring/outline/border */}
          <input
            ref={ref}
            id={id}
            className={cn(
              "h-11 flex-1 bg-transparent text-white placeholder-zinc-400",
              "border-0 outline-none focus:outline-none focus-visible:outline-none",
              "ring-0 ring-offset-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              "!shadow-none focus:!shadow-none focus-visible:!shadow-none",
              inputClassName
            )}
            style={
              {
                ["--tw-ring-offset-width" as any]: "0px",
                ["--tw-ring-color" as any]: "transparent",
              } as React.CSSProperties
            }
            {...props}
          />
        </div>

        {/* Mensaje */}
        {error ? (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-zinc-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";