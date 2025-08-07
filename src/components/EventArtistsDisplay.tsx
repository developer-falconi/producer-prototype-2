import React from 'react';
import { motion } from 'framer-motion';
import { Disc3, Music } from 'lucide-react';
import { EventArtistDto, ArtistGenderEnum } from '@/lib/types';
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
            <div className="flex items-center flex-grow min-w-0 w-full">
              <div
                className={cn(
                  "w-12 h-12 rounded-full overflow-hidden flex-shrink-0",
                  "mr-3 border-2 border-primary-foreground/20",
                  artist.image || artist.image.length === 0 && 'flex items-center justify-center'
                )}
              >
                {
                  artist.image && artist.image.length > 0 ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc3 className='h-8 w-8' />
                  )
                }
              </div>
              <div className="flex flex-col text-left w-full">
                <p className="text-white text-md font-bold truncate">{artist.name}</p>
                <p className="text-gray-400 text-sm italic truncate">
                  {artist.gender.charAt(0).toUpperCase() + artist.gender.slice(1).toLowerCase()}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center justify-center flex-shrink-0">
              {artist.spotify && (
                <a
                  href={artist.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors duration-200"
                  aria-label={`Abrir Spotify de ${artist.name}`}
                >
                  <Music className="h-5 w-5" />
                </a>
              )}

              <span className="text-purple-400 text-xs font-semibold">{artist.gender}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};