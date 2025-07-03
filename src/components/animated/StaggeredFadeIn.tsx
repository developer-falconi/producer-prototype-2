import { motion } from "motion/react";
import { ReactNode } from "react";

interface StaggeredFadeInProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const StaggeredFadeIn = ({ 
  children, 
  staggerDelay = 0.1, 
  className 
}: StaggeredFadeInProps) => {
  return (
    <motion.div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};