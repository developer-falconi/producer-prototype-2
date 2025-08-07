import React, { useEffect, useState } from 'react';
import { calculateTimeRemaining } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining = calculateTimeRemaining(targetDate);
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeRemaining.total <= 0) {
    return (
      <motion.div
        className="relative p-2 rounded-lg flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-black via-gray-800 to-blue-900 rounded-lg"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 5,
            ease: "linear",
            repeat: Infinity,
          }}
        />
        <motion.span
          className="relative z-10 text-white text-xl md:text-2xl font-bold uppercase tracking-wide px-4 py-1"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
            textShadow: '0 0 8px rgba(0, 64, 175, 0.8), 0 0 16px rgba(135, 135, 135, 0.6)',
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          ¡Evento en Vivo! 🎉
        </motion.span>
      </motion.div>
    );
  }

  const TimeBox = ({ value, label }: { value: number | string; label: string }) => (
    <div className="flex flex-col items-center justify-center p-2 w-14 h-14">
      <span className="text-white text-2xl font-extrabold leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white text-xs uppercase mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="bg-black/50 backdrop-blur-sm p-1 rounded-lg">
      <div className="flex justify-center gap-1">
        <TimeBox value={timeRemaining.days} label="Días" />
        <span className="text-xl font-bold mt-1">:</span>
        <TimeBox value={timeRemaining.hours} label="Hrs" />
        <span className="text-xl font-bold mt-1">:</span>
        <TimeBox value={timeRemaining.minutes} label="Min" />
        <span className="text-xl font-bold mt-1">:</span>
        <TimeBox value={timeRemaining.seconds} label="Seg" />
      </div>
    </div>
  );
};

export default CountdownTimer;