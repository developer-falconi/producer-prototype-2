import { CircleDollarSign, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatEventDate, formatEventPrice } from "@/lib/utils";
import { EventDto, Prevent, PreventStatusEnum } from "@/lib/types";
import { useEffect, useState } from "react";
import { SetURLSearchParams } from "react-router-dom";
import { TicketPurchaseFlow } from "./TicketPurchase/TicketPurchaseFlow";
import QuickInEventPurchaseFlow from "./InEventPurchase/InEventPurchaseFlow";
import { useProducer } from "@/context/ProducerContext";
import { trackViewEvent, trackSelectItem } from "@/lib/analytics";

interface EventCardProps {
  event: EventDto;
  initialOpenEventId: number | null;
  promoterKey: string | null;
  setSearchParams: SetURLSearchParams;
}

const EventCard: React.FC<EventCardProps> = ({ event, initialOpenEventId, promoterKey, setSearchParams }) => {
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const { producer } = useProducer();

  useEffect(() => {
    if (initialOpenEventId && event.id === initialOpenEventId) {
      setIsEventDetailsOpen(true);
    }
  }, [initialOpenEventId, event.id]);

  useEffect(() => {
    if (isEventDetailsOpen) {
      try {
        trackViewEvent(event, producer);
      } catch (e) {
        console.warn("trackViewEvent error:", e);
      }
    }
  }, [isEventDetailsOpen, event, producer]);

  const statusColors = {
    ACTIVE: "bg-green-800",
    COMPLETED: "bg-blue-800",
    INACTIVE: "bg-orange-800",
    CANCELLED: "bg-red-800"
  };

  const statusColor = statusColors[event?.status] || "bg-gray-500";

  const handleCardClick = () => {
    try {
      trackSelectItem("events_grid", event, producer);
    } catch (e) {
      console.warn("trackSelectItem error:", e);
    }

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

  const getFeaturedPrevent = (preventasList: Prevent[]): Prevent | null => {
    return preventasList.find((preventa) => preventa.featured) || null;
  };

  const getOldestActivePrevent = (preventasList: Prevent[]): Prevent | null => {
    const activePreventas = preventasList.filter(
      (preventa) => preventa.status === PreventStatusEnum.ACTIVE
    );

    if (activePreventas.length === 0) {
      return null;
    }

    activePreventas.sort((a, b) => {
      const endDateA = new Date(a.endDate).getTime();
      const endDateB = new Date(b.endDate).getTime();
      return endDateA - endDateB;
    });

    return activePreventas[0];
  };

  const displayPrice = event.prevents && event.prevents.length > 0
    ? getFeaturedPrevent(event.prevents)?.price || getOldestActivePrevent(event.prevents)?.price
    : null;

  const formattedPrice = displayPrice === 0
    ? 'Liberada'
    : (displayPrice ? formatEventPrice(displayPrice) : '-');

  const isLive = new Date() >= new Date(event.startDate) && new Date() < new Date(event.endDate);

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={cn(
          "bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden cursor-pointer",
          "group hover:bg-white/15 transition-all duration-500 hover:scale-105 animate-fade-in z-10",
          isLive && 'border-4 border-red-700'
        )}
      >
        <CardContent className="p-0 relative min-h-[500px]">
          {isLive && (
            <Radio className="absolute top-2 right-2 bg-red-700 text-white h-7 w-7 text-xs font-bold p-1 rounded-full z-30 animate-pulse" />
          )}

          <img
            src={event.flyer}
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
        isLive ? (
          <QuickInEventPurchaseFlow
            event={event}
            isOpen={isEventDetailsOpen}
            onClose={handleCloseDetails}
          />
        ) : (
          <TicketPurchaseFlow
            initialEvent={event}
            isOpen={isEventDetailsOpen}
            promoterKey={promoterKey}
            onClose={handleCloseDetails}
          />
        )
      )}
    </>
  );
};

export default EventCard;