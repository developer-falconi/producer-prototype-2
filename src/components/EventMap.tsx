import { motion, Easing } from "framer-motion";
import { cn } from "@/lib/utils";
import { MapPin, Navigation } from "lucide-react";

interface EventMapProps {
  lat?: number | null;
  lng?: number | null;
  address?: string;
  placeName?: string;
  zoom?: number;
  className?: string;
}

export function EventMap({
  lat,
  lng,
  address,
  placeName,
  zoom = 15,
  className,
}: EventMapProps) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const q = hasCoords ? `${lat},${lng}` : encodeURIComponent(address || "");
  const embedSrc = `https://www.google.com/maps?q=${q}&hl=es&z=${zoom}&output=embed`;

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const gmapsDirections = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${placeName
      ? `&destination_place_id=&destination_name=${encodeURIComponent(placeName)}`
      : ""
    }`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      address || ""
    )}`;

  const appleMapsDirections = hasCoords
    ? `maps://?daddr=${lat},${lng}`
    : `maps://?daddr=${encodeURIComponent(address || "")}`;

  const directionsUrl = isIOS ? appleMapsDirections : gmapsDirections;

  const containerVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" as Easing },
    },
  };

  return (
    <motion.div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        className
      )}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="relative w-full h-[280px]">
        <iframe
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 w-full h-full rounded-xl"
        />
        <div className="absolute left-3 bottom-3">

        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-white backdrop-blur">
            <MapPin className="h-4 w-4" />
            <span className="text-xs md:text-sm line-clamp-1">
              {placeName || address || (hasCoords ? `${lat}, ${lng}` : "Ubicación")}
            </span>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-xs md:text-sm font-semibold hover:bg-white/90 transition-colors"
            aria-label="Cómo llegar"
          >
            <Navigation className="h-4 w-4" />
            Cómo llegar
          </a>
        </div>
      </div>
    </motion.div>
  );
}