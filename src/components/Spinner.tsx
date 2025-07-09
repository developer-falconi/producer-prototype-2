import { cn } from "@/lib/utils";

export default function Spinner({ textColor, borderColor }: { textColor?: string, borderColor?: string }) {
  const text = textColor && textColor.length > 0 ? textColor : 'text-gray-900';
  const border = borderColor && borderColor.length > 0 ? borderColor : 'border-t-gray-900';
  return (
    <div className="pt-32 pb-20 px-4 flex items-center justify-center">
      <div className="text-center">
        <div
          className={cn(
            "animate-spin w-16 h-16 border-4",
            border,
            "rounded-full mx-auto mb-4"
          )}
        ></div>
        <p className={cn("text-lg", text)}>Cargando...</p>
      </div>
    </div>
  )
}