import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientData, GenderEnum, PurchaseData, TicketInfo } from '@/lib/types';
import { motion, AnimatePresence, Easing } from "framer-motion";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import '../../App.css';
import { Check } from 'lucide-react';
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
    transition: {
      duration: 0.5,
      ease: "easeOut" as Easing
    },
  },
};

const clientSchema = z.object({
  fullName: z.string().min(1, "El nombre completo es obligatorio."),
  docNumber: z.string()
    .regex(/^[0-9]+$/, "El número de documento debe contener solo números.")
    .min(1, "El número de documento es obligatorio."),
  phone: z.string()
    .regex(/^[0-9]+$/, "El teléfono debe contener solo números.")
    .min(1, "El teléfono es obligatorio."),
  gender: z.enum([GenderEnum.HOMBRE, GenderEnum.MUJER, GenderEnum.OTRO], {
    errorMap: () => ({ message: "El género es obligatorio." })
  })
});

interface AttendeeDataProps {
  purchaseData: PurchaseData;
  onUpdateClient: (index: number, field: keyof TicketInfo, value: string | boolean) => void;
}

export const AttendeeData: React.FC<AttendeeDataProps> = ({
  purchaseData,
  onUpdateClient
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [completedClients, setCompletedClients] = useState<boolean[]>(
    new Array(purchaseData.clients.length).fill(false)
  );

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: purchaseData.clients[activeIndex] as z.infer<typeof clientSchema>,
    mode: "onChange"
  });

  const { reset, control, handleSubmit, formState: { errors } } = form;

  useEffect(() => {
    if (purchaseData.clients[activeIndex]) {
      reset(purchaseData.clients[activeIndex] as z.infer<typeof clientSchema>);
    }
  }, [activeIndex, purchaseData.clients, reset]);

  const isClientFormComplete = (clientFormData: z.infer<typeof clientSchema>) => {
    return !!clientFormData.fullName && !!clientFormData.docNumber && !!clientFormData.gender && !!clientFormData.phone;
  };

  const handleInputChange = (index: number, field: keyof TicketInfo, value: string) => {
    onUpdateClient(index, field, value);
  };

  const handleSelectChange = (index: number, field: keyof TicketInfo, value: GenderEnum) => {
    onUpdateClient(index, field, value);
  };

  const handleCompleteClick = (index: number) => {
    if (isClientFormComplete(purchaseData.clients[index])) {
      onUpdateClient(activeIndex, 'isCompleted', true);
      const newCompletedClients = [...completedClients];
      newCompletedClients[index] = true;
      setCompletedClients(newCompletedClients);

      const nextUncompletedIndex = purchaseData.clients.findIndex((_, i) => i > index && !newCompletedClients[i]);
      if (nextUncompletedIndex !== -1) {
        setActiveIndex(nextUncompletedIndex);
      } else if (index < purchaseData.clients.length - 1) {
        setActiveIndex(index + 1);
      } else {
        setShowCompletionMessage(true);
        setActiveIndex(-1);
      }
    }
  };

  const healthMessages = [
    "Según estudios, la participación en eventos sociales aumenta la liberación de endorfinas, mejorando el estado de ánimo y reduciendo el estrés.",
    "Las fiestas y eventos pueden ayudar a fortalecer las conexiones sociales, lo que está vinculado a una mejor salud mental y una mayor longevidad.",
    "Un estudio realizado por la Universidad de Oxford encontró que las personas que asisten regularmente a eventos sociales tienen un 30% menos de probabilidad de sufrir enfermedades relacionadas con la soledad.",
    "La actividad física durante eventos como bailes o festivales aumenta la circulación sanguínea y ayuda a reducir la presión arterial, promoviendo una mejor salud cardiovascular.",
    "Participar en fiestas o eventos también mejora la calidad del sueño, ya que interactuar socialmente aumenta los niveles de serotonina, un neurotransmisor clave para el descanso."
  ];

  const getCompletionMessage = () => {
    return healthMessages[Math.floor(Math.random() * healthMessages.length)];
  };

  return (
    <div className="space-y-4 p-8">
      <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
        Datos de los Asistentes
      </motion.h2>
      <AnimatePresence>
        {showCompletionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="p-4 bg-green-600/20 border border-green-600 rounded-lg text-green-200 text-center text-base font-semibold shadow-xl"
          >
            {getCompletionMessage()}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {purchaseData.clients.map((client, index) => {
          const isActive = index === activeIndex;
          const isCurrentlyComplete = isClientFormComplete(client);
          const isExplicitlyCompleted = completedClients[index];

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="rounded-lg shadow-lg overflow-hidden"
            >
              <Card className="p-4 bg-transparent border-2">
                <h3
                  className={cn(
                    "font-semibold cursor-pointer flex justify-between items-center",
                    isActive ? "text-gray-200 text-xl mb-2" : "text-gray-200 text-lg"
                  )}
                  onClick={() => setActiveIndex(index)}
                >
                  <span>Entrada {index + 1}</span>
                  {isExplicitlyCompleted && !isActive && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-sm text-muted-foreground"
                    >
                      {client.fullName} - {client.docNumber}
                    </motion.span>
                  )}
                </h3>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      key={`active-form-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-4 overflow-hidden"
                    >
                      <Form {...form}>
                        <form onSubmit={handleSubmit(() => handleCompleteClick(index))} className="space-y-4">
                          <FormField
                            control={control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 text-sm font-medium px-1 rounded">
                                  Nombre Completo
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    id={`fullName-${index}`}
                                    onChange={(e) => handleInputChange(index, 'fullName', e.target.value)}
                                    className="p-3 bg-transparent text-white rounded-lg transition-all duration-200"
                                    placeholder="Juan Pérez"
                                  />
                                </FormControl>
                                <FormMessage className='text-xs' />
                              </FormItem>
                            )}
                          />

                          <AnimatePresence>
                            {form.watch('fullName') && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                              >
                                <FormField
                                  control={control}
                                  name="docNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-300 text-sm font-medium px-1 rounded">
                                        Número de Documento
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          id={`docNumber-${index}`}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onUpdateClient(index, 'docNumber', e.target.value);
                                          }}
                                          className="p-3 bg-transparent text-white rounded-lg transition-all duration-200"
                                          placeholder="12345678"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                        />
                                      </FormControl>
                                      <FormMessage className='text-xs' />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {form.watch('docNumber') && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.2 }}
                              >
                                <FormField
                                  control={control}
                                  name="gender"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-300 text-sm font-medium px-1 rounded">
                                        Género
                                      </FormLabel>
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          onUpdateClient(index, 'gender', value as GenderEnum);
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="p-3 bg-transparent text-white rounded-lg transition-all duration-200">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-popover border border-border rounded-lg shadow-lg bg-card-foreground text-white">
                                          <SelectItem value={GenderEnum.HOMBRE}>{GenderEnum.HOMBRE}</SelectItem>
                                          <SelectItem value={GenderEnum.MUJER}>{GenderEnum.MUJER}</SelectItem>
                                          <SelectItem value={GenderEnum.OTRO}>{GenderEnum.OTRO}</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className='text-xs' />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {form.watch('gender') && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.3 }}
                              >
                                <FormField
                                  control={control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-300 text-sm font-medium px-1 rounded">
                                        Teléfono
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          id={`phone-${index}`}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onUpdateClient(index, 'phone', e.target.value);
                                          }}
                                          className="p-3 bg-transparent text-white rounded-lg transition-all duration-200"
                                          placeholder="+54 9 11 1234-5678"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                        />
                                      </FormControl>
                                      <FormMessage className='text-xs' />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {Object.values(errors).length === 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: 0.4 }}
                              className="flex justify-end pt-4"
                            >
                              <Button
                                type="submit"
                                disabled={Object.keys(errors).length > 0 || isExplicitlyCompleted}
                                variant='default'
                                className="text-white border bg-green-800 transition-colors duration-200 py-2 px-4 rounded-md"
                              >
                                <Check className='h-4 w-4 mr-2' />
                                Completado
                              </Button>
                            </motion.div>
                          )}
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