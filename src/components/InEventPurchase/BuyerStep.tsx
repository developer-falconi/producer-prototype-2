import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { IdCard, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "../ui/form-input";

const DOC_NUMBER_MIN_LENGTH = 6;
const DOC_NUMBER_MAX_LENGTH = 12;
const docNumberPattern = /^[A-Z0-9]+$/;
const hasLetterAndNumber = (value: string) => /[A-Z]/.test(value) && /\d/.test(value);
const normalizeDocNumber = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

export default function BuyerStep({
  buyer,
  setBuyer,
}: {
  buyer: { fullName: string; docNumber: string; email: string };
  setBuyer: (b: { fullName: string; docNumber: string; email: string }) => void;
}) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(buyer.email);
  const isDocOk =
    docNumberPattern.test(buyer.docNumber) &&
    hasLetterAndNumber(buyer.docNumber) &&
    buyer.docNumber.length >= DOC_NUMBER_MIN_LENGTH &&
    buyer.docNumber.length <= DOC_NUMBER_MAX_LENGTH;
  const isNameOk = buyer.fullName.trim().length >= 6;

  return (
    <div className="p-4 sm:p-6">
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10",
          "bg-gradient-to-b from-zinc-900 via-zinc-900 to-black",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_30px_-10px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* Glows */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <CardHeader className="px-5 sm:px-6 pt-5 pb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-200">
            Compra segura • Datos requeridos
          </div>
          <CardTitle className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Tus datos
          </CardTitle>
          <p className="mt-1 text-sm text-zinc-300">
            Completá tus datos para avanzar al catálogo y elegir productos.
          </p>
        </CardHeader>

        <CardContent className="px-5 sm:px-6 pb-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              id="doc"
              label="Documento"
              placeholder="Ej.: ABC123456"
              maxLength={DOC_NUMBER_MAX_LENGTH}
              autoCapitalize="characters"
              autoComplete="off"
              value={buyer.docNumber}
              onChange={(e) =>
                setBuyer({ ...buyer, docNumber: normalizeDocNumber(e.target.value) })
              }
              iconLeft={<IdCard className="h-4 w-4" />}
              error={
                !isDocOk && buyer.docNumber
                  ? "El documento debe tener entre 6 y 12 caracteres alfanuméricos en mayúscula y combinar letras con números."
                  : undefined
              }
              hint={
                isDocOk || buyer.docNumber === ""
                  ? "Usa letras mayúsculas y números, sin espacios ni símbolos."
                  : undefined
              }
            />

            <FormInput
              id="fullname"
              label="Nombre y Apellido"
              placeholder="Ej.: Juan Pérez"
              autoCapitalize="words"
              autoComplete="name"
              value={buyer.fullName}
              onChange={(e) => setBuyer({ ...buyer, fullName: e.target.value })}
              iconLeft={<User className="h-4 w-4" />}
              error={!isNameOk && buyer.fullName ? "El nombre debe tener al menos 6 caracteres." : undefined}
              hint={isNameOk || buyer.fullName === "" ? "Usá tu nombre y apellido reales." : undefined}
            />

            <div className="sm:col-span-2">
              <FormInput
                id="email"
                label="Email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="tu@email.com"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value.trim() })}
                iconLeft={<Mail className="h-4 w-4" />}
                error={buyer.email && !isEmailValid ? "Ingresá un email válido para recibir tu QR." : undefined}
                hint={buyer.email === "" || isEmailValid ? "Te enviaremos el comprobante y tu QR de retiro." : undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
