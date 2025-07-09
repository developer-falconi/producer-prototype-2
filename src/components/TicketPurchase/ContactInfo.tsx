import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PurchaseData } from '@/lib/types';
import { motion, AnimatePresence, Easing } from "framer-motion";

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

interface ContactInfoProps {
  purchaseData: PurchaseData;
  onUpdateEmail: (email: string) => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({
  purchaseData,
  onUpdateEmail
}) => {
  const [isEmailCompleted, setIsEmailCompleted] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(true);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (purchaseData.email && emailRegex.test(purchaseData.email)) {
      setIsEmailCompleted(true);
      setIsValidEmail(true);
    } else {
      setIsEmailCompleted(false);
      setIsValidEmail(false);
    }
  }, [purchaseData.email]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    onUpdateEmail(emailValue);

    const currentIsValid = emailRegex.test(emailValue);
    setIsValidEmail(currentIsValid);
    setIsEmailCompleted(!!emailValue && currentIsValid);
  };

  return (
    <div className="space-y-6">
      <motion.h2 variants={itemVariants} className="text-lg font-bold text-gray-100 mb-4">
        Información de Contacto
      </motion.h2>

      <div>
        <Label
          htmlFor="email"
          className="text-gray-300 text-sm font-medium px-1 rounded"
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={purchaseData.email}
          onChange={handleEmailChange}
          className={`p-3 bg-transparent text-white rounded-lg transition-all duration-200 ${!isValidEmail && purchaseData.email ? 'border-red-500' : ''}`} // Add red border for invalid email
          placeholder="tu@email.com"
        />
        {!isValidEmail && purchaseData.email && (
          <p className="text-sm text-red-400 mt-1">
            Por favor, ingresa un email válido.
          </p>
        )}
        <p className="text-sm text-gray-300 mt-4">
          Te enviaremos las entradas y detalles del evento a este email
        </p>
      </div>

      <AnimatePresence>
        {isEmailCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="p-4 bg-blue-600/20 border border-blue-600 rounded-lg text-blue-200 text-center text-md font-semibold shadow-xl"
          >
            ¡Genial! Revisa tu casilla de email, te enviaremos las entradas y toda la info por ahí.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};