import { useState, useEffect } from "react";
import { intervalToDuration, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface CountdownPreventProps {
  to: string | Date;
}

export const CountdownPrevent = ({ to }: CountdownPreventProps) => {
  const targetTime = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const daysLeft = differenceInDays(targetTime, now);
  const dur = intervalToDuration({ start: now, end: targetTime });
  const { days = 0, hours = 0, minutes = 0 } = dur;

  let bgClass = "bg-blue-600";
  if (now >= targetTime) {
    bgClass = "bg-red-600";
  } else if (daysLeft < 1) {
    bgClass = "bg-red-500";
  } else if (daysLeft < 3) {
    bgClass = "bg-yellow-500";
  } else if (daysLeft < 7) {
    bgClass = "bg-green-600";
  }

  if (now >= targetTime) {
    return (
      <span className={cn(bgClass, 'text-white text-xs font-medium px-2 py-0.5 rounded-lg min-h-7')}>
        Vencido
      </span>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 p-2 py-0.5 rounded-lg',
        'text-white text-xs font-medium min-h-7',
        bgClass
      )}>
      <span>{days}d</span>
      <span>{hours}h</span>
      <span>{minutes}m</span>
    </div>
  );
};
