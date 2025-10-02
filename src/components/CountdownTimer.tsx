import React, { useEffect, useState } from 'react';
import { calculateTimeRemaining } from '@/lib/utils';

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
    return null;
  }

  const TimeBox = ({ value, label }: { value: number | string; label: string }) => (
    <div className="flex flex-col items-center justify-center p-1 w-14 h-14">
      <span className="text-white text-lg font-extrabold leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white text-xs uppercase mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg">
      <div className="flex justify-center gap-1">
        <TimeBox value={timeRemaining.days} label="Días" />
        <span className="text-lg font-bold mt-1">:</span>
        <TimeBox value={timeRemaining.hours} label="Hrs" />
        <span className="text-lg font-bold mt-1">:</span>
        <TimeBox value={timeRemaining.minutes} label="Min" />
        <span className="text-lg font-bold mt-1">:</span>
        <TimeBox value={timeRemaining.seconds} label="Seg" />
      </div>
    </div>
  );
};

export default CountdownTimer;