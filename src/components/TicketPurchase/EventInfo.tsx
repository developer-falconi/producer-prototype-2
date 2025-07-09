import React from 'react';
import { Easing, motion } from 'framer-motion';
import { Event } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar } from 'lucide-react';

interface EventInfoProps {
  event: Event;
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

  const participants = [
    { name: 'Jane Haris', role: 'Organizer', avatar: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=JH' },
    { name: 'Jane Haris', role: 'Speaker', avatar: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=JH' },
  ];

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

      <div className="space-y-3 my-4 p-2">
        {participants.map((person, index) => (
          <motion.div key={index} className="flex items-center justify-between" variants={itemVariants}>
            <div className="flex items-center">
              <img src={person.avatar} alt={person.name} className="w-9 h-9 rounded-full mr-2 object-cover border border-gray-700" />
              <div>
                <p className="text-white text-sm font-semibold">{person.name}</p>
                <p className="text-gray-400 text-xs">{person.role}</p>
              </div>
            </div>
            <button className="text-white/60 hover:text-white transition-colors">
              {person.role === 'Organizer' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 005.793 4m0 0a5 5 0 014.776 4H15v2m-6 0h.01M17 13v5h.582m-15.356-2A8.001 8.001 0 0118.207 20m0 0a5 5 0 00-4.776-4H9v-2m6 0h.01" />
                </svg>
              ) : (
                <span className="bg-white/20 text-white rounded-full px-2 py-0.5 text-xs font-medium">+3</span>
              )}
            </button>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="p-2 bg-zinc-900 text-gray-300 flex-grow"
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