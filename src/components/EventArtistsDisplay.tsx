import React from 'react';
import { motion } from 'framer-motion';
import { Disc3, Music } from 'lucide-react';
import { EventArtistDto } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EventArtistsDisplayProps {
  artists: EventArtistDto[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const EventArtistsDisplay: React.FC<EventArtistsDisplayProps> = ({ artists }) => {
  if (!artists || artists.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="space-y-4 p-4 rounded-lg shadow-inner"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h3 className="text-lg font-semibold text-white mb-2">Artistas</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {artists.map((artist, index) => (
          <motion.div
            key={artist.id || index}
            className="flex items-center justify-between p-3 px-4 rounded-full border border-black transition-colors duration-200"
            variants={itemVariants}
          >
            <div className="flex items-center flex-grow min-w-0 w-full pr-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mr-3 border-2 border-primary-foreground/20",
                  artist.image || artist.image.length === 0 && 'flex items-center justify-center'
                )}
              >
                {artist.image && artist.image.length > 0 ? (
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc3 className="h-8 w-8" />
                )}
              </div>

              {/* Texto */}
              <div className="flex flex-col text-left min-w-0 max-w-[calc(100%-80px)]">
                <p className="text-white text-md font-bold truncate">{artist.name}</p>
                <p className="text-gray-400 text-sm italic line-clamp-2">
                  {artist.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center justify-center flex-shrink-0 w-[70px] text-center">
              {artist.spotify ? (
                <a
                  href={artist.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors duration-200"
                  aria-label={`Abrir Spotify de ${artist.name}`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 168 168" fill="currentColor">
                    <circle cx="84" cy="84" r="84" fill="currentColor" />
                    <path
                      fill="#000000"
                      d="M122.4 119.8c-1.8 2.8-5.5 3.6-8.3 1.8-22.8-14-51.5-17.2-85.2-9.2-3.1.8-6.3-1.1-7.1-4.1s1.1-6.3 4.1-7.1c36.6-9.7 68.2-6.2 93.9 10.5 2.8 1.7 3.6 5.4 1.8 8.1zm11-23.7c-2.2 3.5-6.8 4.5-10.3 2.3-26.1-16-65.9-20.7-96.7-11.1-3.8 1.2-8-0.9-9.2-4.7-1.2-3.8.9-8 4.7-9.2 34.3-10.7 78.1-5.7 108.4 12.5 3.5 2.1 4.5 6.7 2.3 10.2zm.3-24.2c-29.3-17.8-78-19.4-106.5-10.4-4.5 1.3-9.3-1.4-10.6-5.9-1.3-4.5 1.4-9.3 5.9-10.6 33.3-9.4 86.2-7.5 118.5 11.6 4.1 2.5 5.5 7.8 3 11.9-2.5 4.1-7.8 5.5-11.3 3.4z"
                    />
                  </svg>
                </a>
              ) : (
                <Music className='h-5 w-5' />
              )}

              <span className="text-purple-400 text-xs font-semibold uppercase whitespace-nowrap">
                {artist.gender}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};