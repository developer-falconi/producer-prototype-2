import React from 'react';
import { Easing, motion } from 'framer-motion';
import { ArtistGenderEnum, EventDto } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar } from 'lucide-react';
import { EventArtistsDisplay } from '../EventArtistsDisplay';

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

  return (
    <motion.div
      className="relative w-full h-full flex flex-col bg-zinc-900 text-white overflow-y-auto rounded-lg shadow-2xl"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <div className="relative w-full h-[65vh] md:h-[70vh] flex-shrink-0">
        <motion.div
          className="absolute inset-0 w-full h-full"
          variants={imageVariants}
          style={{ background: `url(${event.logo}) center center / ${isMobile ? 'cover' : 'contain'} no-repeat` }}
        >
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
    </motion.div>
  );
};