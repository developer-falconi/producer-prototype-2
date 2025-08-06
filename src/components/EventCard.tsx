import { CircleDollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatEventDate, formatEventPrice } from "@/lib/utils";
import { Event, Prevent, PreventStatusEnum } from "@/lib/types";
import { useEffect, useState } from "react";
import { SetURLSearchParams } from "react-router-dom";
import { TicketPurchaseFlow } from "./TicketPurchase/TicketPurchaseFlow";

interface EventCardProps {
  event: Event;
  initialOpenEventId: number | null;
  setSearchParams: SetURLSearchParams;
}

const EventCard: React.FC<EventCardProps> = ({ event, initialOpenEventId, setSearchParams }) => {
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  useEffect(() => {
    if (initialOpenEventId && event.id === initialOpenEventId) {
      setIsEventDetailsOpen(true);
    }
  }, [initialOpenEventId, event.id]);

  const statusColors = {
    ACTIVE: "bg-green-800",
    COMPLETED: "bg-blue-800",
    INACTIVE: "bg-orange-800",
    CANCELLED: "bg-red-800"
  };

  const statusColor = statusColors[event?.status] || "bg-gray-500";

  const handleCardClick = () => {
    setIsEventDetailsOpen(true);
    setSearchParams(prev => {
      prev.set('event', String(event.id));
      return prev;
    });
  };

  const handleCloseDetails = () => {
    setIsEventDetailsOpen(false);
    setSearchParams(prev => {
      prev.delete('event');
      return prev;
    });
  };

  const getClosestActivePreventa = (preventasList: Prevent[]): Prevent | null => {
    const now = new Date();
    const activePreventas = preventasList.filter(
      (preventa) => preventa.status === PreventStatusEnum.ACTIVE
    );

    if (activePreventas.length === 0) {
      return null;
    }

    activePreventas.sort((a, b) => {
      const endDateA = new Date(a.endDate);
      const endDateB = new Date(b.endDate);

      const diffA = Math.abs(endDateA.getTime() - now.getTime());
      const diffB = Math.abs(endDateB.getTime() - now.getTime());

      return diffA - diffB;
    });
    return activePreventas[0];
  }

  const displayPrice = event.prevents && event.prevents.length > 0
    ? getClosestActivePreventa(event.prevents)?.price
    : null;

  const formattedPrice = displayPrice === 0
    ? 'Liberada'
    : (displayPrice ? formatEventPrice(displayPrice) : '-');

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={cn(
          "bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden cursor-pointer",
          "group hover:bg-white/15 transition-all duration-500 hover:scale-105 animate-fade-in z-10"
        )}
      >
        <CardContent className="p-0 relative min-h-[500px]">
          <img
            src={event.logo}
            alt={event.name}
            className="absolute inset-0 w-full h-full aspect-9/16 object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black via-black/50 to-transparent">
            <div className={cn(
              'absolute bottom-6 right-6', statusColor,
              'text-white rounded-md px-2 py-1 text-xs h-11 w-11',
              'flex items-center justify-center'
            )}>
              <div className="flex flex-col items-center font-medium">
                <span className="m-0 text-sm">{formatEventDate(event.startDate).split(' ')[0]}</span>
                <span className="m-0">{formatEventDate(event.startDate).split(' ')[1]}</span>
              </div>
            </div>

            {/* event Details */}
            <div className="flex flex-col justify-end h-full">
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg line-clamp-2">{event.name}</h3>

                <div className="flex justify-between space-y-2">
                  <div className="flex just items-center gap-2 text-white text-sm font-medium">
                    <CircleDollarSign className="w-4 h-4 text-white" />
                    <span className="text-base font-semibold text-white">
                      {formattedPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {isEventDetailsOpen && (
        <TicketPurchaseFlow
          initialEvent={event}
          isOpen={isEventDetailsOpen}
          onClose={handleCloseDetails}
        />
      )}
    </>
  );
};

export default EventCard;