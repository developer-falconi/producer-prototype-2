import { formatDate } from "@/lib/utils";
import { Event } from "@/lib/types";
import { LiquidButton } from "./animate-ui/buttons/liquid";
import { GradientBackground } from "./animate-ui/backgrounds/gradient";
import { Button } from "./ui/button";

interface FeaturedEventCardProps {
  activeEvent: Event;
  onGetTicketClick?: () => void;
}

const FeaturedEvent: React.FC<FeaturedEventCardProps> = ({ activeEvent, onGetTicketClick }) => {
  return (
    <div className="p-6 rounded-xl overflow-hidden shadow-lg mt-6 relative bg-red-600">
      <div className="flex flex-col md:flex-row items-center justify-between z-10">
        <div className="text-white text-center md:text-left mb-4 md:mb-0 md:mr-4">
          <h3 className="text-3xl font-bold mb-2 leading-tight">
            {activeEvent.name}
          </h3>
          <div className="flex items-center justify-center md:justify-start text-lg">
            <span className="mr-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
              </svg>
              {formatDate(activeEvent.startDate)}
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
              </svg>
              {activeEvent.location}
            </span>
          </div>
        </div>

        <Button
          onClick={onGetTicketClick}
          className="bg-reg-800"
        >
          GET TICKETS
        </Button>
      </div>
    </div>
  );
};

export default FeaturedEvent;
