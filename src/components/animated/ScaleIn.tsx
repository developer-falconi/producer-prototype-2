import { motion } from "motion/react";
import { ReactNode } from "react";

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  hover?: boolean;
}

export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  className,
  hover = false 
}: ScaleInProps) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration, delay }}
      whileHover={hover ? { scale: 1.05 } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
};