import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { useProducer } from "@/context/ProducerContext";
import { ApiResponse, EventStatus, ReturnRequestPayload } from "@/lib/types";
import { cn, formatEventDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/Spinner";
import Footer from "@/components/Footer";
import { submitReturnRequest } from "@/lib/api";

const DevolucionSchema = z.object({
  eventId: z.string().min(1, "Selecciona el evento asociado a la devolución"),
  fullName: z.string().min(3, "Ingresa tu nombre completo"),
  docNumber: z.string().min(6, "Documento inválido"),
  email: z.string().email("Correo inválido"),
  phone: z
    .string()
    .min(6, "Teléfono inválido")
    .regex(/^[0-9+\-() ]+$/, "Solo números y símbolos + - ( )"),
  orderReference: z.string().optional(),
  // orderReference: z.string().min(3, "Cuéntanos tu número de compra o reserva"),
  ticketCount: z.coerce
    .number()
    .min(1, "Indica al menos una entrada")
    .max(20, "Si tenías más de 20 entradas, mándanos un mensaje directo"),
  reason: z.string().min(15, "Explícanos por qué necesitas la devolución"),
});

type DevolucionForm = z.infer<typeof DevolucionSchema>;

const defaultValues: DevolucionForm = {
  eventId: "",
  fullName: "",
  docNumber: "",
  email: "",
  phone: "",
  orderReference: "",
  ticketCount: 1,
  reason: "",
};

const Devoluciones = () => {
  const { producer, loadingProducer } = useProducer();
  const activeEvents = useMemo(
    () =>
      producer?.events
        ?.filter((event) => event.status === EventStatus.ACTIVE)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) ?? [],
    [producer]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DevolucionForm>({
    resolver: zodResolver(DevolucionSchema),
    mode: "onTouched",
    defaultValues,
  });

  const mutation = useMutation<ApiResponse<ReturnRequestPayload>, Error, ReturnRequestPayload>({
    mutationFn: (payload) => submitReturnRequest(payload),
  });

  const selectedEventId = watch("eventId");
  const selectedEvent = useMemo(
    () => activeEvents.find((event) => String(event.id) === selectedEventId),
    [activeEvents, selectedEventId]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (values: DevolucionForm) => {
    const payload: ReturnRequestPayload = {
      eventId: Number(values.eventId),
      fullName: values.fullName,
      docNumber: values.docNumber,
      email: values.email,
      phone: values.phone,
      orderReference: values.orderReference ?? "",
      ticketCount: values.ticketCount,
      reason: values.reason,
    };

    try {
      await mutation.mutateAsync(payload);
      toast.success(
        `Solicitud registrada${selectedEvent ? ` para ${selectedEvent.name}` : ""}. Te escribimos a ${values.email}.`
      );
      reset(defaultValues);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hubo un error al enviar la solicitud.";
      toast.error(message);
    }
  };

  if (loadingProducer) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4 py-12">
        <Spinner />
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Solicitar devolución</title>
        <meta name="description" content="Envía una solicitud de devolución para tus entradas." />
      </Helmet>

      <main className="min-h-screen bg-neutral-950 text-white py-8 md:pt-24 md:pb-8 px-4 flex justify-center">
        <div className="w-full max-w-4xl space-y-8">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <header className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Atención</p>
              <h1 className="text-3xl font-semibold">Solicitud de devolución</h1>
              <p className="mx-auto max-w-2xl text-sm text-slate-300">
                Selecciona el evento, cuéntanos qué pasó e indicá los datos que usamos para validar tu compra.
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div className="space-y-3">
                <Label>Evento</Label>

                <Select
                  value={selectedEventId}
                  onValueChange={(value) => setValue("eventId", value, { shouldTouch: true })}
                  disabled={!activeEvents.length}
                >
                  <SelectTrigger
                    className={cn(
                      'h-10 w-full rounded-xl px-3',
                      'bg-white/5 text-white placeholder:text-white/60',
                      'border border-white/10 shadow-sm',
                      'transition-[border,box-shadow,background] duration-200',
                      'hover:bg-white/[0.08] hover:border-white/20',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500',
                      'data-[state=open]:ring-2 data-[state=open]:ring-blue-500/60 data-[state=open]:border-blue-500',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      '[&>span[data-slot=icon]]:text-white/70 [&>span[data-slot=icon]]:transition-transform',
                      'data-[state=open]:[&>span[data-slot=icon]]:rotate-180'
                    )}
                  >
                    <SelectValue placeholder="Elige un evento activo" />
                  </SelectTrigger>
                  <SelectContent
                    side="bottom"
                    align="start"
                    className={cn(
                      'rounded-lg border border-white/10 bg-zinc-900',
                      'shadow-lg shadow-black/30 text-white',
                      'max-h-64 overflow-auto',
                      'animate-in fade-in-0 zoom-in-95'
                    )}
                  >
                    {activeEvents.map((event) => (
                      <SelectItem
                        key={event.id}
                        value={String(event.id)}
                        className={cn(
                          'relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm',
                          'outline-none transition-colors',
                          'hover:bg-blue-500/20 hover:text-blue-800',
                          'data-[state=checked]:bg-blue-600/30 data-[state=checked]:text-white',
                          'data-[highlighted]:bg-blue-500/25 data-[highlighted]:text-white'
                        )}
                      >
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.eventId && <p className="text-xs text-destructive">{errors.eventId.message}</p>}

                {activeEvents.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Actualmente no hay eventos abiertos. Podés enviar la solicitud apenas publiquemos nuevas fechas.
                  </p>
                )}
              </div>

              {selectedEvent && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="text-xs uppercase text-slate-500">Detalles del evento</p>
                  <p className="text-base font-semibold text-white">{selectedEvent.name}</p>
                  <p>
                    {formatEventDate(selectedEvent.startDate)} · {selectedEvent.location}
                  </p>
                  <p className="text-xs text-slate-400">
                    Ventas cerradas: {new Date(selectedEvent.salesEndDate).toLocaleDateString("es-AR")}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Tu nombre y apellido"
                    {...register("fullName")}
                    className="bg-slate-950/80 text-white border-white/10"
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="docNumber">Documento</Label>
                  <Input
                    id="docNumber"
                    placeholder="DNI / Pasaporte"
                    {...register("docNumber")}
                    className="bg-slate-950/80 text-white border-white/10"
                  />
                  {errors.docNumber && <p className="text-xs text-destructive">{errors.docNumber.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Correo (de la compra)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hola@correo.com"
                    {...register("email")}
                    className="bg-slate-950/80 text-white border-white/10"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone">Teléfono de contacto</Label>
                  <Input
                    id="phone"
                    placeholder="+54 9 11 1234 5678"
                    {...register("phone")}
                    className="bg-slate-950/80 text-white border-white/10"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="orderReference">Número de compra o reserva</Label>
                  <Input
                    id="orderReference"
                    placeholder="e.g. 1234-5678-ABCD"
                    {...register("orderReference")}
                    className="bg-slate-950/80 text-white border-white/10"
                  />
                  {errors.orderReference && (
                    <p className="text-xs text-destructive">{errors.orderReference.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ticketCount">Entradas en esta solicitud</Label>
                  <Input
                    id="ticketCount"
                    type="number"
                    min={1}
                    max={20}
                    {...register("ticketCount", { valueAsNumber: true })}
                    className="bg-slate-950/80 text-white border-white/10"
                  />
                  {errors.ticketCount && (
                    <p className="text-xs text-destructive">{errors.ticketCount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reason">Motivo de la devolución</Label>
                <Textarea
                  id="reason"
                  placeholder="Contanos qué pasó y qué estás solicitando"
                  {...register("reason")}
                  className="bg-slate-950/80 text-white border-white/10"
                />
                {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Nuestro equipo revisa cada solicitud y responde en menos de 72 horas hábiles.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || mutation.isPending || !activeEvents.length}
                  className="w-full"
                >
                  {mutation.isPending || isSubmitting ? "Enviando..." : "Solicitar devolución"}
                </Button>
              </div>
            </form>
          </section>

          <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-500">
            Todas las devoluciones se procesan bajo políticas del productor.
          </p>
        </div>
      </main>
      <Footer producer={producer} />
    </>
  );
};

export default Devoluciones;
