import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenderEnum, PurchaseData, TicketInfo } from '@/lib/types';
import { motion, AnimatePresence, Easing } from "framer-motion";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as Easing },
  },
};

const clientSchemaRequired = z.object({
  fullName: z.string().min(6, "El nombre completo es obligatorio."),
  docNumber: z.string().regex(/^[0-9]+$/, "Solo números.").min(6, "El documento es obligatorio."),
  phone: z.string().regex(/^[0-9]+$/, "Solo números.").min(6, "El teléfono es obligatorio."),
  gender: z.enum([GenderEnum.HOMBRE, GenderEnum.MUJER, GenderEnum.OTRO], {
    errorMap: () => ({ message: "El género es obligatorio." }),
  }),
});

const clientSchemaOptional = z.object({
  fullName: z.string().optional().or(z.literal('')),
  docNumber: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gender: z
    .enum([GenderEnum.HOMBRE, GenderEnum.MUJER, GenderEnum.OTRO])
    .optional()
    .or(z.literal('') as unknown as z.ZodEnum<[GenderEnum.HOMBRE, GenderEnum.MUJER, GenderEnum.OTRO]>),
});

type ClientForm = z.infer<typeof clientSchemaRequired>;

interface AttendeeDataProps {
  purchaseData: PurchaseData;
  onUpdateClient: (index: number, field: keyof TicketInfo, value: string | boolean) => void;
}

export const AttendeeData: React.FC<AttendeeDataProps> = ({
  purchaseData,
  onUpdateClient,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const [completedClients, setCompletedClients] = useState<boolean[]>(
    () => purchaseData.clients.map(c => !!c.isCompleted)
  );

  useEffect(() => {
    setCompletedClients(purchaseData.clients.map(c => !!c.isCompleted));
  }, [purchaseData.clients.length]);

  const isFirstRequired = activeIndex === 0;

  const resolver = useMemo(
    () => zodResolver(isFirstRequired ? clientSchemaRequired : clientSchemaOptional),
    [isFirstRequired]
  );

  const form = useForm<ClientForm>({
    resolver,
    defaultValues: purchaseData.clients[activeIndex] as ClientForm,
    mode: 'onChange',
    values: purchaseData.clients[activeIndex] as ClientForm
  });

  const { reset, control, watch, handleSubmit, formState: { isValid, isDirty, errors } } = form;

  const watchFullName = watch('fullName' as any);
  const watchDocNumber = watch('docNumber' as any);
  const watchGender = watch('gender' as any);

  useEffect(() => {
    if (purchaseData.clients[activeIndex]) {
      reset(purchaseData.clients[activeIndex] as ClientForm);
    }
  }, [activeIndex, purchaseData.clients, reset]);

  const setCompleted = (idx: number, completed = true) => {
    onUpdateClient(idx, 'isCompleted', completed as unknown as string);
    setCompletedClients(prev => {
      const next = [...prev];
      next[idx] = completed;
      return next;
    });
  };

  const goToNextCard = (fromIndex: number) => {
    const nextUncompleted = purchaseData.clients.findIndex((_, i) => i > fromIndex && !completedClients[i]);
    if (nextUncompleted !== -1) setActiveIndex(nextUncompleted);
    else if (fromIndex < purchaseData.clients.length - 1) setActiveIndex(fromIndex + 1);
    else {
      setShowCompletionMessage(true);
      setActiveIndex(-1);
    }
  };

  const handleInputChange = (index: number, field: keyof TicketInfo, value: string) => {
    onUpdateClient(index, field, value);
  };

  const nextPendingIndex = (from = 0) => {
    const idx = purchaseData.clients.findIndex((_, i) => i > from && !completedClients[i]);
    if (idx !== -1) return idx;
    return purchaseData.clients.length > 1 ? 1 : -1;
  };

  const openNextPending = () => {
    const idx = nextPendingIndex(0);
    if (idx === -1) {
      setShowCompletionMessage(true);
      setActiveIndex(-1);
    } else {
      setActiveIndex(idx);
    }
  };

  const handleCompleteClick = (index: number) => {
    setCompleted(index, true);
    if (index === 0) {
      setActiveIndex(-1);
      return;
    }
    goToNextCard(index);
  };

  const handleSkipClick = (index: number) => {
    if (index === 0) return;
    setCompleted(index, true);
    goToNextCard(index);
  };

  const firstCompleted = completedClients[0] === true;
  const canMarkOthers = purchaseData.clients.length > 1 && firstCompleted;
  const hasMoreClients = purchaseData.clients.length > 1;
  const hasPendingOthers = completedClients.slice(1).some(c => !c);

  const markOthersCompleted = () => {
    const total = purchaseData.clients.length;
    if (total <= 1) return;

    for (let i = 1; i < total; i++) {
      onUpdateClient(i, 'isCompleted', true as unknown as string);
    }

    setCompletedClients(prev => {
      const next = [...prev];
      for (let i = 1; i < total; i++) next[i] = true;
      return next;
    });

    setShowCompletionMessage(true);
    setActiveIndex(-1);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
          Datos de los asistentes
        </h2>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-zinc-300">
          {purchaseData.clients.length} {purchaseData.clients.length === 1 ? 'entrada' : 'entradas'}
        </span>
      </motion.div>

      {purchaseData.clients.length > 1 && (
        <div
          className={cn(
            "rounded-xl border border-white/10 bg-white/5",
            "p-3 sm:p-4",
            "flex flex-col gap-3 sm:gap-4"
          )}
        >
          <p className="text-xs sm:text-sm text-zinc-300">
            El primer asistente (comprador) es obligatorio. Para los demás, podés:
            <span className="block sm:inline"> completar sus datos ahora,</span>{" "}
            <span className="block sm:inline">o marcarlos como “completados” sin datos.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Completar el resto */}
            <div className="flex-1">
              <Button
                size="sm"
                onClick={openNextPending}
                disabled={!(firstCompleted && hasMoreClients && hasPendingOthers)}
                className={cn(
                  "w-full rounded-lg font-semibold",
                  firstCompleted && hasMoreClients && hasPendingOthers
                    ? "bg-blue-700 hover:bg-blue-700/90 text-white"
                    : "bg-zinc-700/60 text-zinc-300 cursor-not-allowed"
                )}
                aria-label="Completar datos de los demás asistentes"
                title="Completar datos de los demás asistentes"
              >
                Completar el resto
              </Button>
              <p className="mt-1 text-[11px] text-zinc-400">
                {firstCompleted
                  ? (hasPendingOthers
                    ? "Abrí el siguiente asistente pendiente."
                    : "Ya no quedan asistentes pendientes.")
                  : "Primero completá los datos del comprador para habilitar."}
              </p>
            </div>

            {/* Marcar restantes como completados */}
            <div className="flex-1">
              <Button
                size="sm"
                onClick={markOthersCompleted}
                disabled={!canMarkOthers}
                className={cn(
                  "w-full rounded-lg font-semibold",
                  canMarkOthers
                    ? "bg-emerald-700 hover:bg-emerald-700/90 text-white"
                    : "bg-zinc-700/60 text-zinc-300 cursor-not-allowed"
                )}
                aria-label="Marcar restantes como completados"
                title="Marcar restantes como completados"
              >
                Marcar restantes como completados
              </Button>
              <p className="mt-1 text-[11px] text-zinc-400">
                {canMarkOthers
                  ? "Marcá todos los restantes sin completar datos."
                  : "Se habilita luego de completar correctamente al comprador."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {purchaseData.clients.map((client, index) => {
          const isActive = index === activeIndex;
          const isExplicitlyCompleted = completedClients[index];

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="rounded-2xl overflow-hidden"
            >
              <Card
                className={cn(
                  "group relative overflow-hidden rounded-2xl p-0",
                  "border border-white/10 bg-zinc-950/90",
                  isActive
                    ? "border-2 border-blue-800/80"
                    : "transition hover:-translate-y-0.5 hover:border-white/20"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between",
                    "border-b border-white/10"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 min-w-0 w-full">
                    <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          isExplicitlyCompleted
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/20"
                            : "bg-white/10 text-white/90 border border-white/15"
                        )}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={cn(
                          "truncate font-medium text-center sm:text-left",
                          isActive ? "text-white" : "text-zinc-200"
                        )}
                      >
                        Entrada {index + 1}
                        {index === 0 && (
                          <span className="block sm:inline sm:ml-2 text-[10px] text-amber-300">
                            (obligatoria)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {isExplicitlyCompleted && !isActive ? (
                    <span className="flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      {client.fullName && client.docNumber
                        ? `${client.fullName} · ${client.docNumber}`
                        : 'Completada sin datos'}
                    </span>
                  ) : null}
                </button>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      key={`active-form-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="px-4 py-4"
                    >
                      <Form {...form}>
                        <form onSubmit={handleSubmit(() => handleCompleteClick(index))} className="space-y-4">
                          <FormField
                            control={control}
                            name={'fullName' as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300 text-sm">Nombre completo{index === 0 && ' *'}</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id={`fullName-${index}`}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleInputChange(index, 'fullName', e.target.value);
                                    }}
                                    placeholder="Juan Pérez"
                                    className={cn(
                                      "rounded-lg bg-white/5 text-white placeholder:text-zinc-400",
                                      "border border-white/10 outline-none",
                                      "hover:border-blue-800/40",
                                      "focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70",
                                      "focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0",
                                      "active:border-blue-800 active:ring-2 active:ring-blue-800/70"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          <AnimatePresence>
                            {(watchFullName || index > 0) && !errors.fullName && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.05 }}
                              >
                                <FormField
                                  control={control}
                                  name={'docNumber' as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-zinc-300 text-sm">Documento{index === 0 && ' *'}</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          id={`docNumber-${index}`}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onUpdateClient(index, 'docNumber', e.target.value);
                                          }}
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          placeholder="12345678"
                                          className={cn(
                                            "rounded-lg bg-white/5 text-white placeholder:text-zinc-400",
                                            "border border-white/10 outline-none",
                                            "hover:border-blue-800/40",
                                            "focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70",
                                            "focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0",
                                            "active:border-blue-800 active:ring-2 active:ring-blue-800/70"
                                          )}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {(watchDocNumber || index > 0) && !errors.docNumber && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                              >
                                <FormField
                                  control={control}
                                  name={'gender' as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-zinc-300 text-sm">Género{index === 0 && ' *'}</FormLabel>
                                      <Select
                                        value={field.value as any}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          onUpdateClient(index, "gender", value as GenderEnum);
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className={cn(
                                              "h-10 w-full rounded-xl px-3",
                                              "bg-white/5 text-white placeholder:text-white/60",
                                              "border border-white/10 shadow-sm",
                                              "transition-[border,box-shadow,background] duration-200",
                                              "hover:bg-white/[0.08] hover:border-white/20",
                                              "focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500",
                                              "data-[state=open]:ring-2 data-[state=open]:ring-blue-500/60 data-[state=open]:border-blue-500",
                                              "disabled:cursor-not-allowed disabled:opacity-50",
                                              "[&>span[data-slot=icon]]:text-white/70 [&>span[data-slot=icon]]:transition-transform",
                                              "data-[state=open]:[&>span[data-slot=icon]]:rotate-180"
                                            )}
                                          >
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                        </FormControl>

                                        <SelectContent
                                          side="bottom"
                                          align="start"
                                          className={cn(
                                            "rounded-lg border border-white/10 bg-zinc-900",
                                            "shadow-lg shadow-black/30 text-white",
                                            "max-h-64 overflow-auto",
                                            "animate-in fade-in-0 zoom-in-95"
                                          )}
                                        >
                                          <SelectItem
                                            value={GenderEnum.HOMBRE}
                                            className={cn(
                                              "relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                                              "outline-none transition-colors",
                                              "hover:bg-blue-500/20 hover:text-blue-800",
                                              "data-[state=checked]:bg-blue-600/30 data-[state=checked]:text-white",
                                              "data-[highlighted]:bg-blue-500/25 data-[highlighted]:text-white"
                                            )}
                                          >
                                            {GenderEnum.HOMBRE}
                                          </SelectItem>

                                          <SelectItem
                                            value={GenderEnum.MUJER}
                                            className={cn(
                                              "relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                                              "outline-none transition-colors",
                                              "hover:bg-white/10",
                                              "data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-white",
                                              "data-[highlighted]:bg-blue-500/25"
                                            )}
                                          >
                                            {GenderEnum.MUJER}
                                          </SelectItem>

                                          <SelectItem
                                            value={GenderEnum.OTRO}
                                            className={cn(
                                              "relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                                              "outline-none transition-colors",
                                              "hover:bg-white/10",
                                              "data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-white",
                                              "data-[highlighted]:bg-blue-500/25"
                                            )}
                                          >
                                            {GenderEnum.OTRO}
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {(watchGender || index > 0) && !errors.gender && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.15 }}
                              >
                                <FormField
                                  control={control}
                                  name={'phone' as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-zinc-300 text-sm">Teléfono{index === 0 && ' *'}</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          id={`phone-${index}`}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onUpdateClient(index, 'phone', e.target.value);
                                          }}
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          placeholder="+54 9 11 1234-5678"
                                          className={cn(
                                            "rounded-lg bg-white/5 text-white placeholder:text-zinc-400",
                                            "border border-white/10 outline-none",
                                            "hover:border-blue-800/40",
                                            "focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70",
                                            "focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0",
                                            "active:border-blue-800 active:ring-2 active:ring-blue-800/70"
                                          )}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center justify-between pt-2">
                            {index > 0 ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSkipClick(index)}
                                className="rounded-lg"
                              >
                                Omitir
                              </Button>
                            ) : <span />}

                            <Button
                              type="submit"
                              disabled={
                                !isValid ||
                                !watchFullName.trim() &&
                                !watchDocNumber.trim() &&
                                !watchGender &&
                                !watch('phone')?.trim()
                              }
                              className={cn(
                                "font-semibold rounded-lg",
                                "bg-green-800 hover:bg-green-800/80 text-white",
                                "disabled:opacity-60 disabled:cursor-not-allowed"
                              )}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Completado
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};