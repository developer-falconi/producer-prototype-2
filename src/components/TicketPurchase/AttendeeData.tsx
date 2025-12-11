import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GenderEnum, PurchaseData, TicketInfo, CouponEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { validateCoupon } from '@/lib/api';
import { motion, AnimatePresence, Easing } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CheckCircle2, Loader2, Mail, Tag, X } from 'lucide-react';
import { toast } from 'sonner';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as Easing } },
};

const DOC_NUMBER_MIN_LENGTH = 6;
const DOC_NUMBER_MAX_LENGTH = 12;
const docNumberPattern = /^[A-Z0-9]+$/;

const docNumberSchema = z
  .string()
  .transform(value => value.trim().toUpperCase())
  .refine(value => docNumberPattern.test(value), {
    message: 'Solo letras mayúsculas y números.',
  })
  .refine(value => /\d/.test(value), {
    message: 'Debe contener al menos un número.',
  })
  .refine(
    value => value.length >= DOC_NUMBER_MIN_LENGTH && value.length <= DOC_NUMBER_MAX_LENGTH,
    {
      message: `El documento debe tener entre ${DOC_NUMBER_MIN_LENGTH} y ${DOC_NUMBER_MAX_LENGTH} caracteres.`,
    }
  );

const normalizeDocNumber = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

const clientSchemaRequired = z.object({
  fullName: z.string().min(6, 'El nombre completo es obligatorio.'),
  docNumber: docNumberSchema,
  phone: z.string().regex(/^[0-9]+$/, 'Solo numeros.').min(6, 'El telefono es obligatorio.'),
  gender: z.enum([GenderEnum.HOMBRE, GenderEnum.MUJER, GenderEnum.OTRO], {
    errorMap: () => ({ message: 'El genero es obligatorio.' }),
  }),
});

const clientSchemaOptional = z.object({
  fullName: z.string().optional().or(z.literal('')),
  docNumber: z.union([docNumberSchema, z.literal('')]),
  phone: z.string().optional().or(z.literal('')),
  gender: z
    .enum([GenderEnum.HOMBRE, GenderEnum.MUJER, GenderEnum.OTRO])
    .optional()
    .or(z.literal('') as unknown as z.ZodEnum<[GenderEnum.HOMBRE, GenderEnum.MUJER, GenderEnum.OTRO]>),
});

type ClientForm = z.infer<typeof clientSchemaRequired>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AttendeeDataProps {
  purchaseData: PurchaseData;
  onUpdateClient: (index: number, field: keyof TicketInfo, value: string | boolean) => void;
  onUpdateEmail: (email: string) => void;
  eventId: number;
  appliedCoupon?: CouponEvent | null;
  discountAmount?: number;
  onCouponApplied: (coupon: CouponEvent) => void;
  onCouponRemoved: () => void;
  requiresClientData?: boolean;
}

const emptyClient: ClientForm = {
  fullName: '',
  docNumber: '',
  phone: '',
  gender: '' as GenderEnum,
};

export const AttendeeData: React.FC<AttendeeDataProps> = ({
  purchaseData,
  onUpdateClient,
  onUpdateEmail,
  eventId,
  appliedCoupon,
  discountAmount = 0,
  onCouponApplied,
  onCouponRemoved,
  requiresClientData = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(purchaseData.clients.length > 0 ? 0 : -1);
  const [completedClients, setCompletedClients] = useState<boolean[]>(() =>
    purchaseData.clients.map(client => !!client.isCompleted)
  );
  const [showCouponBox, setShowCouponBox] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [isEmailCompleted, setIsEmailCompleted] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  useEffect(() => {
    setCompletedClients(purchaseData.clients.map(client => !!client.isCompleted));
  }, [purchaseData.clients]);

  useEffect(() => {
    if (purchaseData.clients.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(prev => {
      if (prev >= purchaseData.clients.length) {
        return purchaseData.clients.length - 1;
      }
      return prev;
    });
  }, [purchaseData.clients.length]);

  useEffect(() => {
    if (purchaseData.email && emailRegex.test(purchaseData.email)) {
      setIsEmailCompleted(true);
      setIsEmailValid(true);
    } else {
      setIsEmailCompleted(false);
      setIsEmailValid(false);
    }
  }, [purchaseData.email]);

  useEffect(() => {
    if (appliedCoupon) {
      setShowCouponBox(false);
      setCouponCode('');
    }
  }, [appliedCoupon]);

  const isFirstRequired = activeIndex === 0;
  const resolver = useMemo(
    () => zodResolver(isFirstRequired ? clientSchemaRequired : clientSchemaOptional),
    [isFirstRequired]
  );

  const safeIndex =
    activeIndex >= 0 && activeIndex < purchaseData.clients.length ? activeIndex : 0;
  const currentClient = (purchaseData.clients[safeIndex] as ClientForm) ?? emptyClient;

  const form = useForm<ClientForm>({
    resolver,
    defaultValues: currentClient,
    values: currentClient,
    mode: 'onChange',
  });

  const {
    reset,
    control,
    watch,
    handleSubmit,
    formState: { isValid, errors },
  } = form;

  useEffect(() => {
    if (activeIndex >= 0 && purchaseData.clients[activeIndex]) {
      reset(purchaseData.clients[activeIndex] as ClientForm);
    }
  }, [activeIndex, purchaseData.clients, reset]);

  const watchFullNameRaw = watch('fullName' as any) ?? '';
  const watchDocNumberRaw = watch('docNumber' as any) ?? '';
  const watchGenderRaw = watch('gender' as any) as string | undefined;
  const watchPhoneRaw = watch('phone' as any) ?? '';

  const watchFullName = String(watchFullNameRaw);
  const watchDocNumber = String(watchDocNumberRaw);
  const watchPhone = String(watchPhoneRaw);
  const watchGender = watchGenderRaw ?? '';

  const hasAnyInput = Boolean(
    watchFullName.trim() || watchDocNumber.trim() || watchPhone.trim() || watchGender.trim()
  );

  const contactEnabled = useMemo(() => {
    if (purchaseData.clients.length === 0) return false;
    if (completedClients.length !== purchaseData.clients.length) return false;
    return completedClients.every(Boolean);
  }, [purchaseData.clients.length, completedClients]);

  const totalClients = purchaseData.clients.length;

  const goToNextCard = useCallback(
    (fromIndex: number, state: boolean[], autoActivateNext = true) => {
      if (!autoActivateNext) {
        setActiveIndex(-1);
        return;
      }
      if (state.length === 0) {
        setActiveIndex(-1);
        return;
      }
      const nextUncompleted = state.findIndex((completed, i) => i > fromIndex && !completed);
      if (nextUncompleted !== -1) {
        setActiveIndex(nextUncompleted);
        return;
      }
      if (fromIndex < state.length - 1) {
        setActiveIndex(fromIndex + 1);
      } else {
        setActiveIndex(-1);
      }
    },
    []
  );

  const markClientCompletion = useCallback(
    (index: number, value: boolean) => {
      let nextState: boolean[] = completedClients;
      setCompletedClients(prev => {
        const next = [...prev];
        next[index] = value;
        nextState = next;
        return next;
      });
      onUpdateClient(index, 'isCompleted', value as unknown as string);
      return nextState;
    },
    [completedClients, onUpdateClient]
  );

  const handleCompleteClick = useCallback(
    (index: number) => {
      const nextState = markClientCompletion(index, true);
      if (requiresClientData || index > 0) {
        goToNextCard(index, nextState);
        return;
      }
      setActiveIndex(-1);
    },
    [goToNextCard, markClientCompletion, requiresClientData]
  );

  const handleSkipClick = useCallback(
    (index: number) => {
      if (index === 0) return;
      const nextState = markClientCompletion(index, true);
      goToNextCard(index, nextState, false);
    },
    [goToNextCard, markClientCompletion]
  );

  const handleEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onUpdateEmail(value);
      const ok = emailRegex.test(value);
      setIsEmailValid(ok);
      setIsEmailCompleted(!!value && ok);
    },
    [onUpdateEmail]
  );

  const handleValidateCoupon = useCallback(async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error('Ingresa un codigo de cupon.');
      return;
    }

    setValidatingCoupon(true);
    try {
      const resp: { success: boolean; data?: CouponEvent; message?: string } = await validateCoupon(
        eventId,
        code
      );
      if (!resp.success || !resp.data) {
        toast.error(resp.message || 'Cupon invalido.');
        return;
      }
      onCouponApplied(resp.data);
      toast.success('Cupon aplicado.');
      setShowCouponBox(false);
      setCouponCode('');
    } catch {
      toast.error('No se pudo validar el cupon.');
    } finally {
      setValidatingCoupon(false);
    }
  }, [couponCode, eventId, onCouponApplied]);

  const handleCouponRemove = useCallback(() => {
    onCouponRemoved();
    setCouponCode('');
    setShowCouponBox(false);
  }, [onCouponRemoved]);

  const submitDisabled = !isValid || !hasAnyInput;

  return (
    <div className="space-y-8 p-6 md:p-8">
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
            Datos de asistentes y contacto
          </h2>
          <p className="text-xs md:text-sm text-zinc-400">
            Completa el primer asistente para habilitar el contacto y el cupon.
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-zinc-300">
          {totalClients} {totalClients === 1 ? 'entrada' : 'entradas'}
        </span>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                  'group relative overflow-hidden rounded-2xl p-0',
                  'border border-white/10 bg-zinc-950/90',
                  isActive
                    ? 'border-2 border-blue-800/80'
                    : 'transition hover:-translate-y-0.5 hover:border-white/20'
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    'border-b border-white/10'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className="flex flex-1 items-center justify-between gap-3 text-left"
                  >
                    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                            isExplicitlyCompleted
                              ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-400/20'
                              : 'bg-white/10 text-white/90 border border-white/15'
                          )}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={cn(
                            'truncate font-medium',
                            isActive ? 'text-white' : 'text-zinc-200'
                          )}
                        >
                          Entrada {index + 1}
                          {index === 0 && (
                            <span className="block text-[10px] text-amber-300 sm:inline sm:ml-2">
                              (obligatoria)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    {isExplicitlyCompleted && !isActive ? (
                      <span className="flex items-center gap-2 text-xs text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        {client.fullName && client.docNumber
                          ? `${client.fullName} - ${client.docNumber}`
                          : 'Completada sin datos'}
                      </span>
                    ) : null}
                  </button>

                  {index > 0 && !isActive && !isExplicitlyCompleted && !requiresClientData && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={event => {
                        event.stopPropagation();
                        handleSkipClick(index);
                      }}
                      className="ml-auto rounded-lg px-3 py-1 text-xs"
                    >
                      Omitir
                    </Button>
                  )}
                </div>

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
                        <form
                          onSubmit={handleSubmit(() => handleCompleteClick(index))}
                          className="space-y-4"
                        >
                          <FormField
                            control={control}
                            name={'fullName' as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm text-zinc-300">
                                  Nombre completo{index === 0 && ' *'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id={`fullName-${index}`}
                                    onChange={event => {
                                      field.onChange(event);
                                      onUpdateClient(index, 'fullName', event.target.value);
                                    }}
                                    placeholder="Juan Perez"
                                    className={cn(
                                      'rounded-lg bg-white/5 text-white placeholder:text-zinc-400',
                                      'border border-white/10 outline-none',
                                      'hover:border-blue-800/40',
                                      'focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70',
                                      'focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0',
                                      'active:border-blue-800 active:ring-2 active:ring-blue-800/70'
                                    )}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          <AnimatePresence>
                            {((watchFullNameRaw && watchFullNameRaw.length > 0) || index > 0) &&
                              !errors.fullName && (
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
                                        <FormLabel className="text-sm text-zinc-300">
                                          Documento{index === 0 && ' *'}
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            id={`docNumber-${index}`}
                                            onChange={event => {
                                              const normalized = normalizeDocNumber(event.target.value);
                                              field.onChange(normalized);
                                              onUpdateClient(index, 'docNumber', normalized);
                                            }}
                                            maxLength={DOC_NUMBER_MAX_LENGTH}
                                            autoCapitalize="characters"
                                            placeholder="ABC123456"
                                            className={cn(
                                              'rounded-lg bg-white/5 text-white placeholder:text-zinc-400',
                                              'border border-white/10 outline-none',
                                              'hover:border-blue-800/40',
                                              'focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70',
                                              'focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0',
                                              'active:border-blue-800 active:ring-2 active:ring-blue-800/70'
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
                            {((watchDocNumberRaw && watchDocNumberRaw.length > 0) || index > 0) &&
                              !errors.docNumber && (
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
                                        <FormLabel className="text-sm text-zinc-300">
                                          Genero{index === 0 && ' *'}
                                        </FormLabel>
                                        <Select
                                          value={field.value as any}
                                          onValueChange={value => {
                                            field.onChange(value);
                                            onUpdateClient(index, 'gender', value as GenderEnum);
                                          }}
                                        >
                                          <FormControl>
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
                                              <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                          </FormControl>
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
                                            <SelectItem
                                              value={GenderEnum.HOMBRE}
                                              className={cn(
                                                'relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm',
                                                'outline-none transition-colors',
                                                'hover:bg-blue-500/20 hover:text-blue-800',
                                                'data-[state=checked]:bg-blue-600/30 data-[state=checked]:text-white',
                                                'data-[highlighted]:bg-blue-500/25 data-[highlighted]:text-white'
                                              )}
                                            >
                                              {GenderEnum.HOMBRE}
                                            </SelectItem>
                                            <SelectItem
                                              value={GenderEnum.MUJER}
                                              className={cn(
                                                'relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm',
                                                'outline-none transition-colors',
                                                'hover:bg-white/10',
                                                'data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-white',
                                                'data-[highlighted]:bg-blue-500/25'
                                              )}
                                            >
                                              {GenderEnum.MUJER}
                                            </SelectItem>
                                            <SelectItem
                                              value={GenderEnum.OTRO}
                                              className={cn(
                                                'relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm',
                                                'outline-none transition-colors',
                                                'hover:bg-white/10',
                                                'data-[state=checked]:bg-blue-500/20 data-[state=checked]:text-white',
                                                'data-[highlighted]:bg-blue-500/25'
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
                            {((watchGenderRaw && watchGenderRaw.length > 0) || index > 0) &&
                              !errors.gender && (
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
                                        <FormLabel className="text-sm text-zinc-300">
                                          Telefono{index === 0 && ' *'}
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            id={`phone-${index}`}
                                            onChange={event => {
                                              field.onChange(event);
                                              onUpdateClient(index, 'phone', event.target.value);
                                            }}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="+54 9 11 1234-5678"
                                            className={cn(
                                              'rounded-lg bg-white/5 text-white placeholder:text-zinc-400',
                                              'border border-white/10 outline-none',
                                              'hover:border-blue-800/40',
                                              'focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70',
                                              'focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0',
                                              'active:border-blue-800 active:ring-2 active:ring-blue-800/70'
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
                            {index > 0 && !requiresClientData ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSkipClick(index)}
                                className="rounded-lg"
                              >
                                Omitir
                              </Button>
                            ) : (
                              <span />
                            )}

                            <Button
                              type="submit"
                              disabled={submitDisabled}
                              className={cn(
                                'font-semibold rounded-lg',
                                'bg-green-800 hover:bg-green-800/80 text-white',
                                'disabled:opacity-60 disabled:cursor-not-allowed'
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

      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <AnimatePresence initial={false}>
          {contactEnabled && (
            <motion.div
              key="contact-section"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur p-5">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
                  Email
                </Label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    disabled={!contactEnabled}
                    value={purchaseData.email}
                    onChange={handleEmailChange}
                    placeholder="tu@email.com"
                    className={cn(
                      'pl-9 bg-white/5 text-white placeholder:text-zinc-400 rounded-xl',
                      'border border-white/10 outline-none',
                      'hover:border-blue-800/40',
                      'focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70',
                      'focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0',
                      'active:border-blue-800 active:ring-2 active:ring-blue-800/70',
                      !isEmailValid && purchaseData.email && 'border-rose-500/60 focus:ring-rose-600/50 focus:border-rose-600'
                    )}
                  />
                </div>
                <div className="mt-2 min-h-[20px]">
                  {!isEmailValid && purchaseData.email ? (
                    <p className="text-xs text-rose-300">Por favor, ingresa un email valido.</p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      Te enviaremos las entradas y los detalles a este email.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 backdrop-blur p-4">
                {!appliedCoupon ? (
                  <>
                    <button
                      type="button"
                      disabled={!contactEnabled}
                      className={cn(
                        'inline-flex items-center gap-2 text-sm text-sky-300 hover:text-white hover:underline',
                        !contactEnabled && 'cursor-not-allowed opacity-60'
                      )}
                      onClick={() => setShowCouponBox(value => !value)}
                    >
                      <Tag className="h-4 w-4" />
                      {showCouponBox ? 'Ocultar cupon' : '¿Tenes un cupon?'}
                    </button>

                    <AnimatePresence initial={false}>
                      {showCouponBox && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                          <div className="flex-1">
                            <Label htmlFor="coupon" className="text-sm font-medium text-zinc-300">
                              Codigo de cupon
                            </Label>
                            <Input
                              id="coupon"
                              disabled={!contactEnabled}
                              value={couponCode}
                              onChange={event => setCouponCode(event.target.value)}
                              placeholder="EJ: FESTI20"
                              className={cn(
                                'mt-2 bg-white/5 text-white placeholder:text-zinc-400 rounded-xl',
                                'border border-white/10 outline-none',
                                'hover:border-blue-800/40',
                                'focus:border-blue-800 focus:ring-2 focus:ring-blue-800/70',
                                'focus-visible:border-blue-800 focus-visible:ring-2 focus-visible:ring-blue-800/70 focus-visible:ring-offset-0',
                                'active:border-blue-800 active:ring-2 active:ring-blue-800/70'
                              )}
                            />
                          </div>
                          <Button
                            onClick={handleValidateCoupon}
                            disabled={!contactEnabled || validatingCoupon}
                            className="h-11 rounded-xl bg-sky-700 hover:bg-sky-600 text-white px-4 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {validatingCoupon ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Validar'
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 sm:items-center">
                      <span className="mt-0.5 rounded-md border border-emerald-400/30 bg-emerald-500/20 p-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm text-emerald-200">
                          Cupon aplicado: <span className="font-semibold underline">{appliedCoupon.code}</span>
                        </p>
                        {!!discountAmount && (
                          <p className="text-xs text-emerald-600/90">
                            Descuento: ${discountAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleCouponRemove}
                      className="text-emerald-200 hover:text-white hover:bg-emerald-600/30"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Quitar
                    </Button>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {isEmailCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="rounded-2xl border border-blue-800/40 bg-blue-800/15 p-4 text-sm font-medium text-blue-100 md:text-base"
                  >
                    Genial! Te enviaremos las entradas y toda la info a tu correo.
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
