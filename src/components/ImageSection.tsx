import { Producer } from "@/lib/types";
import { CalendarHeart, Gem, Sparkles, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import OptimizedImage from "@/components/OptimizedImage";

interface ImageSectionProps {
  producer: Producer;
}

export default function ImageSection({ producer }: ImageSectionProps) {
  const popVariant: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: 0.2 + custom * 0.15, type: "spring", stiffness: 200 },
    }),
  };

  return (
    <div className="relative w-full p-4 flex items-center justify-center min-h-[300px] md:min-h-[400px] lg:min-h-[500px] overflow-hidden">
      {[Sparkles, Gem, Ticket, CalendarHeart].map((Icon, idx) => (
        <motion.div
          key={idx}
          className={cn("absolute p-2 sm:p-3 rounded-full z-10", [
            "top-10 left-1/4 text-green-500",
            "bottom-10 md:bottom-16 right-1/4 text-blue-600",
            "top-1/2 left-2 text-red-500",
            "top-1/3 right-2 text-purple-500",
          ][idx])}
          custom={idx}
          initial="hidden"
          animate="visible"
          variants={popVariant}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.div>
      ))}

      <motion.div
        className="relative rounded-lg overflow-hidden w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 shadow-xl"
        custom={4}
        initial="hidden"
        animate="visible"
        variants={popVariant}
      >
        <OptimizedImage
          src={producer.logo}
          alt={producer.name}
          transformOptions={{ width: 512, height: 512, crop: "fit", gravity: "auto", quality: "auto" }}
          wrapperClassName="absolute inset-0"
          className="h-full w-full object-contain bg-gradient-to-br from-black to-gray-600 backdrop-blur-md"
        />
      </motion.div>

      <motion.div
        className="absolute bottom-0 md:bottom-8 w-full flex flex-row items-center justify-center gap-4 text-center"
        custom={5}
        initial="hidden"
        animate="visible"
        variants={popVariant}
      >
        <Button
          asChild
          className="px-6 py-2 rounded-full bg-gradient-to-br from-black to-gray-600 backdrop-blur-md transition-all duration-300 hover:scale-105 text-white"
        >
          <Link to="/events">Explorar Eventos</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="px-6 py-2 rounded-full border-gray-400 text-gray-700 hover:text-black transition-all duration-300 hover:scale-105"
        >
          <Link to="/gallery">Ver Galería</Link>
        </Button>
      </motion.div>
    </div>
  );
}
