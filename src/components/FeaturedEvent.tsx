import React from 'react';
import { formatDate } from "@/lib/utils";
import { Event } from "@/lib/types";
import { Button } from "./ui/button";
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeaturedEventCardProps {
  activeEvent: Event;
}

const FeaturedEvent: React.FC<FeaturedEventCardProps> = ({ activeEvent }) => {
  const isMobile = useIsMobile();

  return (
    <div className="relative w-full p-4 sm:p-6 md:p-8 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-black to-gray-600 backdrop-blur-md border border-gray-700/50">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-2">
        {isMobile && (
          <div className="w-full flex justify-center items-center">
            <img
              src={activeEvent.logo}
              alt={activeEvent.name}
              className="w-32 h-48 object-contain rounded-lg shadow-lg transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}

        <div className="flex-1 text-white w-full md:w-2/3 text-center md:text-left order-2 md:order-1">
          <h3 className="text-2xl md:text-3xl font-extrabold mb-3 mt-2 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-gray-300 drop-shadow-lg">
            {activeEvent.name}
          </h3>
          <p className="text-sm text-start text-gray-300 line-clamp-2 md:line-clamp-4 mb-4 whitespace-pre-wrap">
            {activeEvent.description || 'Discover key insights and network with peers at this exciting event.'}
          </p>

          <div className="flex flex-col items-start justify-start text-sm text-gray-200 gap-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
              </svg>
              {formatDate(activeEvent.startDate, 'short')}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-purple-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
              </svg>
              {activeEvent.location}
            </span>
          </div>
        </div>
        {!isMobile && (
          <div
            className="hidden h-full md:block shrink-0 order-1 md:order-2
            md:w-1/3 md:max-w-[200px]
            flex flex-col items-center justify-center gap-2"
          >
            <img
              src={activeEvent.logo}
              alt={activeEvent.name}
              className="w-full h-auto object-contain rounded-lg shadow-lg transition-transform duration-500 hover:scale-105"
            />
            <Link to={`/events?event=${activeEvent.id}`} className='h-full'>
              <Button
                size='sm'
                className="w-full mt-2
                  bg-red-600 hover:bg-red-700 active:bg-red-800
                  transition-all duration-300 ease-in-out"
              >
                GET TICKETS
              </Button>
            </Link>
          </div>
        )}
        {isMobile && (
          <Link to={`/events?event=${activeEvent.id}`}>
            <Button
              className="md:hidden absolute bottom-0 right-0 z-20 rounded-lg
            bg-red-600 hover:bg-red-700 active:bg-red-800
            transition-all duration-300 ease-in-out"
            >
              GET TICKETS
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default FeaturedEvent;