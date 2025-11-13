import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCourtesyInvite, claimCourtesyInvite } from "@/lib/api";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CourtesyDto, GenderEnum } from "@/lib/types";

const ClaimSchema = z.object({
  fullName: z.string().min(3, "Ingresá tu nombre y apellido"),
  phone: z
    .string()
    .min(6, "Teléfono inválido")
    .regex(/^[0-9+\-() ]+$/, "Sólo números y símbolos + - ( )"),
  gender: z.nativeEnum(GenderEnum, { required_error: "Seleccioná una opción" }),
  docNumber: z.string().min(6, "Documento inválido"),
});

type ClaimForm = z.infer<typeof ClaimSchema>;
type ClaimVariables = ClaimForm & { token: string };

export default function CourtesyClaim() {
  const { token = "" } = useParams<{ token: string }>();
  const [formSubmitted, setFormSubmitted] = useState(false);

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ["courtesy-invite", token],
    queryFn: () => getCourtesyInvite(token),
    enabled: Boolean(token),
  });
  const invite = res?.data as CourtesyDto | undefined;

  const expired = useMemo(() => {
    if (!invite?.expiresAt) return false;
    return new Date(invite.expiresAt).getTime() < Date.now();
  }, [invite?.expiresAt]);

  const disabledReason = useMemo(() => {
    if (!invite) return null;
    if (invite?.revoked) return "Esta cortesía fue revocada.";
    if (expired) return "Esta cortesía expiró.";
    if (invite.remainingClaims <= 0) return "Ya no hay cupos disponibles en esta cortesía.";
    return null;
  }, [invite, expired]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClaimForm>({
    resolver: zodResolver(ClaimSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", phone: "", gender: undefined as GenderEnum, docNumber: "" },
  });

  const { mutateAsync } = useMutation<any, Error, ClaimVariables>({
    mutationFn: (vars) => claimCourtesyInvite(vars.token, invite.eventId, {
      fullName: vars.fullName,
      phone: vars.phone,
      gender: vars.gender,
      docNumber: vars.docNumber,
    }),
    onSuccess: async () => {
      toast.success("¡Cortesía confirmada! Te enviamos el mail con tus entradas.");

      const res = await getCourtesyInvite(token);
      if (res?.data?.remainingClaims <= 0) {
        setFormSubmitted(true);
      } else {
        reset();
      }
    },
    onError: (err) => {
      toast.error(err?.message || "No se pudo reclamar la cortesía.");
    },
  });

  const onSubmit = async (values: ClaimForm) => {
    await mutateAsync({ token, ...values });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Completar cortesía</title>
        <meta name="description" content="Completá tus datos para obtener tu cortesía." />
      </Helmet>

      <main className="min-h-screen bg-neutral-950 text-white py-8 px-4 flex items-center justify-center">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner />
            </div>
          ) : isError ? (
            <div className="text-center">
              <p className="text-red-400 mb-4">No se pudo cargar la cortesía.</p>
              <Link to="/" className="underline text-neutral-200">Volver al inicio</Link>
            </div>
          ) : formSubmitted ? (
            <motion.div
              className="rounded-3xl bg-green-950/30 border border-green-600/40 text-green-200 p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <header className="mb-6 text-center">
                <h1 className="text-2xl font-bold">¡Cortesía reclamada!</h1>
                <p>Ya no hay más cortesías disponibles para este evento.</p>
              </header>
            </motion.div>
          ) : (
            <motion.div
              className="rounded-3xl bg-black/30 border border-white/10 p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <header className="mb-6 flex items-center gap-4">
                {invite?.flyerUrl && (
                  <img
                    src={invite.flyerUrl}
                    alt="Flyer"
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10"
                    loading="lazy"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{invite?.eventName ?? "Cortesía"}</h1>
                  <p className="text-neutral-300 text-sm">
                    {invite?.remainingClaims ?? 0} cupo(s) disponible(s)
                    {invite?.expiresAt && (
                      <> · vence el {new Date(invite.expiresAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </header>

              {disabledReason ? (
                <div className="rounded-xl bg-red-950/30 border border-red-600/40 text-red-200 p-4">
                  {disabledReason}
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
                  noValidate
                >
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">Nombre y apellido</Label>
                    <Input
                      id="fullName"
                      placeholder="Juan Pérez"
                      className={cn("mt-2 bg-white/5 border-white/10")}
                      {...register("fullName")}
                      autoComplete="name"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="+54 9 11 1234 5678"
                      className={cn("mt-2 bg-white/5 border-white/10")}
                      {...register("phone")}
                      autoComplete="tel"
                      inputMode="tel"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender">Género</Label>
                    <Select onValueChange={(v) => setValue("gender", v as any)} >
                      <SelectTrigger id="gender" className="mt-2 bg-white/5 border-white/10">
                        <SelectValue placeholder="Seleccioná" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-white/10 text-white">
                        <SelectItem
                          value={GenderEnum.HOMBRE}
                          className={cn(
                            "relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                            "outline-none transition-colors",
                            "hover:bg-emerald-700/20 hover:text-emerald-200",
                            "data-[state=checked]:bg-emerald-600/30 data-[state=checked]:text-white",
                            "data-[highlighted]:bg-emerald-600/25 data-[highlighted]:text-white"
                          )}
                        >
                          Masculino
                        </SelectItem>
                        <SelectItem
                          value={GenderEnum.MUJER}
                          className={cn(
                            "relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                            "outline-none transition-colors",
                            "hover:bg-emerald-700/20 hover:text-emerald-200",
                            "data-[state=checked]:bg-emerald-600/30 data-[state=checked]:text-white",
                            "data-[highlighted]:bg-emerald-600/25 data-[highlighted]:text-white"
                          )}
                        >
                          Femenino
                        </SelectItem>
                        <SelectItem
                          value={GenderEnum.OTRO}
                          className={cn(
                            "relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                            "outline-none transition-colors",
                            "hover:bg-emerald-700/20 hover:text-emerald-200",
                            "data-[state=checked]:bg-emerald-600/30 data-[state=checked]:text-white",
                            "data-[highlighted]:bg-emerald-600/25 data-[highlighted]:text-white"
                          )}
                        >
                          Otro
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-400">{errors.gender.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="docNumber">Documento</Label>
                    <Input
                      id="docNumber"
                      placeholder="DNI / Pasaporte"
                      className={cn("mt-2 bg-white/5 border-white/10")}
                      {...register("docNumber")}
                      autoComplete="off"
                    />
                    {errors.docNumber && (
                      <p className="mt-1 text-sm text-red-400">{errors.docNumber.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end pt-2">
                    <Button
                      type="submit"
                      className="bg-emerald-900 hover:bg-emerald-900/85"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Enviando…" : "Confirmar cortesía"}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}
