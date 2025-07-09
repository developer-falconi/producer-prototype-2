import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle, Star, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PaymentResult({ status, eventBought }: { status: string, eventBought: any }) {
  let titulo = 'Estado del pago';
  let mensaje = 'No se pudo determinar el estado de tu pago.';
  let agradecimiento: string | null = null;
  let icon = <XCircle className="w-12 h-12 mx-auto text-gray-400" />;

  if (status === 'approved') {
    titulo = 'Pago Exitoso 🎉';
    mensaje = '¡Tu pago ha sido aprobado!';
    agradecimiento =
      'Gracias por comprar con Produtik. Los tickets serán enviados a tu correo electrónico en breve.';
    icon = <CheckCircle className="w-12 h-12 mx-auto text-green-600 animate-bounce" />;
  } else if (status === 'pending') {
    titulo = 'Pago Pendiente ⏳';
    mensaje = 'Tu pago está pendiente. Te avisaremos cuando se confirme.';
    icon = <Star className="w-12 h-12 mx-auto text-yellow-500 animate-pulse" />;
  } else if (['failure', 'cancelled', 'rejected'].includes(status || '')) {
    titulo = 'Pago Rechazado ❌';
    mensaje = 'Lo sentimos, tu pago no pudo procesarse.';
    icon = <XCircle className="w-12 h-12 mx-auto text-red-600 animate-shake" />;
  }

  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 8000;
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        return next < 100 ? next : 100;
      });
    }, intervalTime);

    return () => window.clearInterval(interval);
  }, [status]);

  return (
    <div className="bg-blue-700/70 backdrop-blur-sm p-4 rounded-lg shadow-lg w-full max-w-md text-white">
      <div className="container mx-auto max-w-xl text-center">
        <motion.h1
          className="text-4xl font-bold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {titulo}
        </motion.h1>

        <motion.div
          className="text-lg mb-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {mensaje}
        </motion.div>

        {agradecimiento && (
          <motion.div
            className="mt-4 text-base text-center font-medium space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {agradecimiento
              .split('.')
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
              .map((line, idx) => (
                <p key={idx}>{line.endsWith('.') ? line : line + '.'}</p>
              ))}
          </motion.div>
        )}

        {/* Event Details */}
        {eventBought && status === 'approved' && (
          <div className="mt-4 text-left text-lg font-semibold">
            <p>Evento: {eventBought.name}</p>
            <p>Fecha: {formatDate(eventBought.startDate)}</p>
            <p>Ubicación: {eventBought.location}</p>
          </div>
        )}
        <div className="relative w-full h-1 bg-white/30 rounded mt-6 overflow-hidden">
          <motion.div
            className="h-full bg-white"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      </div>
    </div>
  );
}
