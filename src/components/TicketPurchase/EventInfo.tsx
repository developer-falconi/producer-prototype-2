import React from 'react';
import { Easing, motion } from 'framer-motion';
import { EventDto, EventStatus } from '@/lib/types';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar } from 'lucide-react';
import { EventArtistsDisplay } from '../EventArtistsDisplay';
import { EventMap } from '../EventMap';
import OptimizedImage from '@/components/OptimizedImage';

interface EventInfoProps {
  event: EventDto;
}

export const EventInfo: React.FC<EventInfoProps> = ({ event }) => {
  const isMobile = useIsMobile();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as Easing,
        when: 'beforeChildren',
        staggerChildren: 0.08,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' as Easing },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' as Easing } },
  };

  const imageVariants = {
    hidden: { scale: 1.05, opacity: 0.8 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' as Easing } },
  };

  if (!event) {
    return null;
  }

  const formattedDate = formatDate(event.startDate)
  const formattedTime = `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`;
  const isCompleted = event.status === EventStatus.COMPLETED;

  return (
    <motion.div
      className="relative w-full h-full flex flex-col min-h-0 bg-zinc-900 text-white overflow-y-auto rounded-lg shadow-2xl"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <div className="relative w-full h-[65vh] md:h-[70vh] flex-shrink-0">
        <motion.div
          className="absolute inset-0 w-full h-full"
          variants={imageVariants}
        >
          <OptimizedImage
            src={event.flyer}
            alt={event.name}
            transformOptions={{ width: 1920, height: 1080, crop: isMobile ? "fill" : "fit", gravity: "auto", quality: "auto" }}
            wrapperClassName="absolute inset-0"
            className={cn(
              "h-full w-full",
              isMobile ? "object-cover" : "object-contain"
            )}
            fallbackSrc="https://via.placeholder.com/1920x1080?text=Evento"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 p-6 pt-16 bg-gradient-to-t from-zinc-900 to-transparent">
          <motion.h1
            className="text-white text-2xl font-bold mb-1 leading-tight"
            variants={itemVariants}
          >
            {event.name}
          </motion.h1>

          <motion.div className="mb-0" variants={itemVariants}>
            <div className="flex items-center mb-1 gap-1">
              <Calendar className='h-4 w-4' />
              <div className="flex items-center gap-4 text-white text-base font-medium">
                <p>{formattedDate}</p>
                <p>{formattedTime}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {isCompleted && (
        <motion.div
          variants={itemVariants}
          className="px-6 pt-6"
        >
          <div className="relative overflow-hidden rounded-xl bg-blue-700 shadow-lg">
            <div className="absolute inset-0 opacity-20 blur-2xl" />
            <div className="relative p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-white/80 font-semibold">Evento completado</p>
                <h2 className="text-lg md:text-xl font-bold text-white leading-tight">
                  ¡Gracias por vivir {event.name} con nosotros!
                </h2>
                <p className="text-sm text-white/90">
                  Reviví los mejores momentos en nuestra galería de fotos.
                </p>
              </div>
              <a
                href="/gallery"
                className="inline-flex items-center justify-center rounded-lg bg-white/95 text-zinc-900 font-semibold text-sm px-4 py-2 hover:bg-white transition"
              >
                Ver imágenes
              </a>
            </div>
          </div>
        </motion.div>
      )}

      <EventArtistsDisplay artists={event.artists} />

      <motion.div
        className="p-6 bg-zinc-900 text-gray-300 flex-grow"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          variants={itemVariants}
        >
          {event.description}
        </motion.p>
      </motion.div>
      <EventMap
        lat={null}
        lng={null}
        address={event.location}
        placeName={event.name}
        className="p-6"
      />
    </motion.div>
  );
};
