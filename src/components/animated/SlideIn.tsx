import { motion } from "motion/react";
import { ReactNode } from "react";

interface SlideInProps {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn = ({ 
  children, 
  direction = "left", 
  delay = 0, 
  duration = 0.5, 
  className 
}: SlideInProps) => {
  const getInitialPosition = () => {
    switch (direction) {
      case "left": return { x: -50, opacity: 0 };
      case "right": return { x: 50, opacity: 0 };
      case "up": return { y: -50, opacity: 0 };
      case "down": return { y: 50, opacity: 0 };
      default: return { x: -50, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};