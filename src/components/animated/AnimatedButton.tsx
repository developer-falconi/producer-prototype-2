import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const AnimatedButton = ({ 
  children, 
  className, 
  onClick,
  variant,
  size 
}: AnimatedButtonProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Button 
        className={className} 
        onClick={onClick}
        variant={variant}
        size={size}
      >
        {children}
      </Button>
    </motion.div>
  );
};